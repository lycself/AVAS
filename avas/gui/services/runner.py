"""Runs a simulation in a child process and streams progress to the page.

The child is ``python -u -m avas run ...`` (``AVAS.exe run ...`` when frozen).
Its merged stdout/stderr is read in a thread:

* ``Simulate progress 45.34%. Estimated remaining time 9s. Run time 15s. 1 0.35m``
  (the native engine's progress line, redrawn with ``\\r``) becomes the live
  progress.  Times may be printed as ``12.5s``, ``3.20min`` or ``1.05h``.
* every other line goes to the log panel (logger ``avas.engine``) and is kept
  for the failure message.

For error studies the engine restarts once per seed; the overall *step i / N*
is read from the output directory by ``GetSchedule`` every 3 s.

Events: ``run.progress`` (state dict) and ``run.finished`` ({ok, message}).
"""
import codecs
import configparser
import logging
import os
import re
import subprocess
import sys
import threading
import time

from avas import __version__
from avas.paths import PACKAGE_DIR
from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc

log = logging.getLogger("avas.gui")
engine_log = logging.getLogger("avas.engine")

_TIME = r"([\d.]+)\s*(s|sec|min|h)\b"
PROGRESS_RE = re.compile(r"Simulate progress\s+(?P<pct>[\d.]+)\s*%", re.IGNORECASE)
ETA_RE = re.compile(r"Estimated remaining time\s+" + _TIME, re.IGNORECASE)
RUN_RE = re.compile(r"Run time\s+" + _TIME, re.IGNORECASE)
POS_RE = re.compile(r"\b(\d+)\s+([\d.]+)\s*m\s*$")
ERROR_MODES = ("stat", "dyn", "stat_dyn")
MODES = ("basic",) + ERROR_MODES


def _seconds(match):
    if not match:
        return None
    try:
        value = float(match.group(1))
    except ValueError:
        return None
    unit = match.group(2).lower()
    return value * (60.0 if unit == "min" else 3600.0 if unit == "h" else 1.0)


def parse_progress(line):
    """Progress fields found in *line* (``None`` if it is not a progress line)."""
    m = PROGRESS_RE.search(line)
    if not m:
        return None
    out = {}
    try:
        out["percent"] = min(100.0, float(m.group("pct")))
    except ValueError:
        pass
    eta = _seconds(ETA_RE.search(line))
    if eta is not None:
        out["eta_s"] = eta
    run = _seconds(RUN_RE.search(line))
    if run is not None:
        out["run_s"] = run
    pos = POS_RE.search(line.rstrip())
    if pos:
        try:
            out["pos_m"] = float(pos.group(2))
        except ValueError:
            pass
    return out


def simulation_command(input_dir, output_dir, mode):
    run_args = ["run", "--input", input_dir, "--output", output_dir, "--mode", mode or "basic"]
    if getattr(sys, "frozen", False):
        # the windowed AVASGui.exe starts runs through the console program next to it
        console = os.path.join(os.path.dirname(sys.executable), "AVAS.exe")
        return [console if os.path.isfile(console) else sys.executable] + run_args
    return [sys.executable, "-u", "-m", "avas"] + run_args


class Runner:
    def __init__(self):
        self.proc = None
        self.project = None
        self.mode = "basic"
        self.lock = threading.RLock()
        self._t0 = 0.0
        self._tail = []
        self._state = {}
        self._stopping = False
        self._timers = []

    @property
    def is_running(self):
        return self.proc is not None and self.proc.poll() is None

    def state(self):
        with self.lock:
            s = dict(self._state)
        if self.is_running:
            s["elapsed_s"] = time.time() - self._t0
        s["running"] = self.is_running
        s["mode"] = self.mode
        return s

    # ------------------------------------------------------------------ control
    def start(self, project, mode):
        with self.lock:
            if self.is_running:
                raise UserError("A simulation is already running.")
            self.project = project
            self.mode = mode if mode in MODES else "basic"
            self._t0 = time.time()
            self._tail = []
            self._stopping = False
            self._state = {"percent": 0.0, "eta_s": None, "run_s": None, "pos_m": None, "elapsed_s": 0.0,
                           "step": None, "all_step": None, "line": ""}
            os.makedirs(project.output_dir, exist_ok=True)
            project.write_run_info({
                "avas_version": __version__, "input_dir": project.input_dir, "output_dir": project.output_dir,
                "mode": self.mode, "started": time.strftime("%Y-%m-%d %H:%M:%S"), "status": "running", "source": "gui",
            })
            env = dict(os.environ)
            env.update(PYTHONUNBUFFERED="1", PYTHONIOENCODING="utf-8", MPLBACKEND="Agg", AVAS_GUI_CHILD="1")
            repo_root = os.path.dirname(PACKAGE_DIR)
            env["PYTHONPATH"] = repo_root + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
            cmd = simulation_command(project.input_dir, project.output_dir, self.mode)
            flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            try:
                self.proc = subprocess.Popen(cmd, cwd=project.path, env=env, stdin=subprocess.DEVNULL,
                                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, creationflags=flags)
            except OSError as exc:
                self.proc = None
                raise UserError(f"Could not start the simulation: {exc}") from exc
        log.info("simulation started (%s) -> %s", self.mode, project.output_dir)
        threading.Thread(target=self._read_loop, args=(self.proc,), name="avas-run-reader", daemon=True).start()
        threading.Thread(target=self._tick_loop, args=(self.proc,), name="avas-run-tick", daemon=True).start()
        self._emit()

    def stop(self):
        proc = self.proc
        if proc is None or proc.poll() is not None:
            return False
        self._stopping = True
        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True,
                               creationflags=subprocess.CREATE_NO_WINDOW)
            else:
                proc.kill()
        except OSError:
            proc.kill()
        return True

    # ------------------------------------------------------------------ threads
    def _read_loop(self, proc):
        decoder = codecs.getincrementaldecoder("utf-8")(errors="replace")
        buffer = ""
        stream = proc.stdout
        while True:
            chunk = stream.read1(65536) if hasattr(stream, "read1") else stream.read(4096)
            if not chunk:
                break
            buffer += decoder.decode(chunk)
            buffer = buffer.replace("\r\n", "\n").replace("\r", "\n")
            *lines, buffer = buffer.split("\n")
            for line in lines:
                self._handle_line(line)
        buffer += decoder.decode(b"", final=True)
        if buffer.strip():
            self._handle_line(buffer)
        code = proc.wait()
        self._finished(proc, code)

    def _tick_loop(self, proc):
        last_poll = 0.0
        polling = [False]
        while proc.poll() is None:
            time.sleep(1.0)
            if proc is not self.proc:
                return
            self._emit()
            if self.mode in ERROR_MODES and time.time() - last_poll >= 3.0 and not polling[0]:
                last_poll = time.time()
                polling[0] = True
                threading.Thread(target=self._poll_schedule, args=(polling,), daemon=True).start()

    def _poll_schedule(self, polling):
        try:
            from avas.api.qt.getschedule import GetSchedule
            res = GetSchedule({"projectPath": self.project.path}).main()
            if res.get("code", 0) == 0:
                sched = res.get("data", {}).get("schedule") or {}
                with self.lock:
                    self._state["step"] = int(sched.get("currentStep"))
                    self._state["all_step"] = int(sched.get("allStep"))
                self._emit()
        except Exception:  # noqa: BLE001 - progress is best effort
            pass
        finally:
            polling[0] = False

    def _handle_line(self, line):
        if not line.strip():
            return
        fields = parse_progress(line)
        if fields is not None:
            with self.lock:
                self._state.update(fields)
                self._state["line"] = line.strip()
            return          # the tick loop publishes at most once per second
        with self.lock:
            self._tail.append(line)
            self._tail = self._tail[-60:]
        if line.startswith("[avas]"):
            log.info("%s", line)
        else:
            engine_log.info("%s", line)

    def _emit(self):
        bridge.emit("run.progress", self.state())

    def _failure_message(self):
        for line in reversed(self._tail):
            s = line.strip()
            if s.lower().startswith("error:"):
                return s[6:].strip()
        for line in reversed(self._tail):
            s = line.strip()
            if s and not s.startswith(("File ", "Traceback", "[avas]")) and "^" not in s:
                return s
        return ""

    def _finished(self, proc, code):
        if proc is not self.proc:
            return
        elapsed = time.time() - self._t0
        if self._stopping:
            ok, message = False, "stopped by user"
            log.warning("simulation stopped by user")
        elif code != 0:
            ok, message = False, self._failure_message() or f"exit code {code}"
            log.error("simulation failed: %s", message)
        else:
            ok, message = True, "finished"
            with self.lock:
                self._state["percent"] = 100.0
                self._state["eta_s"] = 0.0
            log.info("simulation finished in %.1f s", elapsed)
        info = self.project.last_run() if self.project else {}
        info.update(status="finished" if ok else ("stopped" if self._stopping else "failed"),
                    finished=time.strftime("%Y-%m-%d %H:%M:%S"), elapsed_s=round(elapsed, 1), source="gui",
                    mode=self.mode)
        if ok:
            info.pop("error", None)
        else:
            info["error"] = message
        try:
            if self.project:
                self.project.write_run_info(info)
        except OSError:
            pass
        with self.lock:
            self._state["elapsed_s"] = elapsed
        self.proc = None
        state = self.state()
        state.update(ok=ok, message=message, stopped=self._stopping)
        bridge.emit("run.progress", state)
        bridge.emit("run.finished", state)
        from avas.gui.services import projects
        projects.notify()


_runner = Runner()


def is_running():
    return _runner.is_running


def ini_error_mode(project):
    ini = os.path.join(project.input_dir, "ini.ini")
    cfg = configparser.ConfigParser()
    cfg.optionxform = str
    try:
        cfg.read(ini, encoding="utf-8")
        mode = cfg.get("error", "error_type", fallback="").strip()
    except configparser.Error:
        mode = ""
    return mode if mode in ERROR_MODES else "basic"


@rpc("run.check")
def check():
    """The engine's own pre-run checks (lattice syntax, ini values)."""
    p = context.project().require()
    from avas.api.qt.api import project_check
    try:
        project_check(p.item())
    except Exception as exc:  # noqa: BLE001 - shown to the user as is
        raise UserError(str(exc)) from exc
    return True


@rpc("run.start")
def start():
    p = context.project().require()
    check()
    _runner.start(p, ini_error_mode(p))
    return _runner.state()


@rpc("run.stop")
def stop():
    return _runner.stop()


@rpc("run.state")
def state():
    return _runner.state()


def shutdown():
    _runner.stop()
