"""Runs simulations in child processes and streams progress to the page.

A *job* is one or more *stages* run one after the other: a normal run has one
stage (the project's InputFile -> OutputFile); a segment run
(:mod:`avas.gui.services.segments`) may first compute the reference timing and
the upstream beam.  Each stage is ``python -u -m avas run ...`` (``AVAS.exe
run ...`` when frozen) whose merged stdout/stderr is read in a thread:

* ``Simulate progress 45.34%. Estimated remaining time 9s. Run time 15s. 1 0.35m``
  (the native engine's progress line, redrawn with ``\\r``) becomes the live
  progress.  Times may be printed as ``12.5s``, ``3.20min`` or ``1.05h``.
* every other line goes to the log panel (logger ``avas.engine``) and is kept
  for the failure message.

Pausing suspends the child process tree (:mod:`avas.gui.proctree`); the engine
continues exactly where it stopped when resumed.  Elapsed time excludes paused
time, and for a few seconds after resuming the remaining time is estimated
from the progress rate because the engine's own estimate still contains the
pause.

For error studies the engine restarts once per seed; the overall *step i / N*
is read from the output directory by ``GetSchedule`` every 3 s.

The assistant's sandbox studies (:mod:`avas.ai.sandbox`) are reported through
the same state with ``source: "assistant"`` so the Run page, tool bar and status
bar show them and can pause, resume and stop them.

Events: ``run.progress`` (state dict) and ``run.finished`` ({ok, message, stopped,
source, label, outputDir}).
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
from avas.gui import bridge, context, proctree
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
RESUME_SETTLE_S = 8.0           # the engine's estimate contains the pause for a few seconds


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


class Stage:
    """One engine run of a job.

    *prepare* is called right before the stage starts (after the previous stage
    finished) and returns ``{input_dir, output_dir, mode?, field_dir?, lattice?}``.
    """

    def __init__(self, key, label, prepare):
        self.key = key
        self.label = label
        self.prepare = prepare
        self.status = "pending"
        self.elapsed_s = None
        self.output_dir = None


class Job:
    def __init__(self, project, stages, source="project", label="", mode="basic", output_dir=None, on_finished=None):
        self.project = project
        self.stages = stages
        self.source = source            # project | segment
        self.label = label
        self.mode = mode
        self.output_dir = output_dir or project.output_dir
        self.on_finished = on_finished  # f(job, ok, message, stopped)
        self.ok = None
        self.message = ""


class Runner:
    def __init__(self):
        self.proc = None
        self.job = None
        self.project = None
        self.mode = "basic"
        self.lock = threading.RLock()
        self._t0 = 0.0
        self._stage = -1
        self._stage_t0 = 0.0
        self._tail = []
        self._state = {}
        self._stopping = False
        self._paused_since = None
        self._paused_total = 0.0
        self._resumed_at = 0.0
        self._frozen_eta = None
        self._samples = []              # (active seconds, percent) of the current stage
        self._stage_paused0 = 0.0

    @property
    def is_running(self):
        return self.job is not None

    @property
    def is_paused(self):
        return self.job is not None and self._paused_since is not None

    def _paused_seconds(self, now):
        return self._paused_total + (now - self._paused_since if self._paused_since else 0.0)

    def _job_seconds(self, now=None):
        """Time since the job started, without pauses."""
        now = now or time.time()
        return max(0.0, now - self._t0 - self._paused_seconds(now))

    def _stage_seconds(self, now=None):
        now = now or time.time()
        return max(0.0, now - self._stage_t0 - (self._paused_seconds(now) - self._stage_paused0))

    def _own_eta(self):
        pct = self._state.get("percent")
        pts = self._samples
        if pct is None or len(pts) < 2:
            return None
        t_last, p_last = pts[-1]
        ref = next((pt for pt in pts if t_last - pt[0] <= 20.0), pts[0])
        dt, dp = t_last - ref[0], p_last - ref[1]
        if dt <= 0.5 or dp <= 0:
            return None
        return max(0.0, (100.0 - pct) / (dp / dt))

    def _eta(self):
        if self._paused_since is not None:
            return self._frozen_eta
        engine = self._state.get("eta_s")
        if time.time() - self._resumed_at < RESUME_SETTLE_S:
            own = self._own_eta()
            return own if own is not None else engine
        return engine

    def state(self):
        with self.lock:
            job = self.job
            if job is None:
                from avas.ai import sandbox
                s = sandbox.activity_state()
                if s is not None:
                    return s
                s = dict(self._state)
                s.update(running=False, paused=False, mode=self.mode)
                return s
            s = dict(self._state)
            s.update(running=True, paused=self._paused_since is not None, mode=self.mode, source=job.source,
                     label=job.label, outputDir=job.output_dir, elapsed_s=self._job_seconds(),
                     eta_s=self._eta(), stage=self._stage + 1, stages=len(job.stages),
                     stageLabel=job.stages[self._stage].label if 0 <= self._stage < len(job.stages) else "")
            return s

    # ------------------------------------------------------------------ control
    def start(self, project, mode):
        mode = mode if mode in MODES else "basic"
        stage = Stage("run", "", lambda: {"input_dir": project.input_dir, "output_dir": project.output_dir, "mode": mode})
        self.start_job(Job(project, [stage], source="project", mode=mode))

    def start_job(self, job):
        from avas.ai import sandbox
        with self.lock:
            if self.job is not None:
                raise UserError("A simulation is already running.")
            if sandbox.active():
                raise UserError("The assistant is running a simulation study; stop it first.")
            self.job = job
            self.project = job.project
            self.mode = job.mode
            self._t0 = time.time()
            self._stage = -1
            self._stopping = False
            self._paused_since = None
            self._paused_total = 0.0
            self._stage_paused0 = 0.0
            self._resumed_at = 0.0
            self._frozen_eta = None
            self._state = {"percent": 0.0, "eta_s": None, "run_s": None, "pos_m": None, "elapsed_s": 0.0,
                           "step": None, "all_step": None, "line": ""}
        if job.source == "project":
            os.makedirs(job.project.output_dir, exist_ok=True)
            job.project.write_run_info({
                "avas_version": __version__, "input_dir": job.project.input_dir, "output_dir": job.project.output_dir,
                "mode": self.mode, "started": time.strftime("%Y-%m-%d %H:%M:%S"), "status": "running", "source": "gui",
            })
        try:
            self._next_stage()
        except Exception:
            with self.lock:
                self.job = None
                self.proc = None
            if job.source == "project":
                info = job.project.last_run()
                info.update(status="failed", finished=time.strftime("%Y-%m-%d %H:%M:%S"))
                try:
                    job.project.write_run_info(info)
                except OSError:
                    pass
            raise
        log.info("simulation started (%s) -> %s", self.mode if job.source == "project" else job.label, job.output_dir)

    def _next_stage(self):
        """Prepare and launch the next stage of the job (raises when it cannot start)."""
        job = self.job
        with self.lock:
            self._stage += 1
            stage = job.stages[self._stage]
            stage.status = "running"
            self._stage_t0 = time.time()
            self._stage_paused0 = self._paused_total
            self._tail = []
            self._samples = []
            self._state.update(percent=0.0, eta_s=None, run_s=None, pos_m=None, line="")
            if job.source != "project" and len(job.stages) > 1:
                self._state.update(step=None, all_step=None)
        self._emit()
        try:
            spec = stage.prepare()
        except UserError:
            stage.status = "failed"
            raise
        except Exception as exc:  # noqa: BLE001 - shown as the failure of the job
            stage.status = "failed"
            log.exception("preparing %s failed", stage.key)
            raise UserError(f"{stage.label or stage.key}: {exc}") from exc
        stage.output_dir = spec["output_dir"]
        if self._stopping:
            raise UserError("stopped by user")
        os.makedirs(spec["output_dir"], exist_ok=True)
        env = dict(os.environ)
        env.update(PYTHONUNBUFFERED="1", PYTHONIOENCODING="utf-8", MPLBACKEND="Agg", AVAS_GUI_CHILD="1")
        env.pop("AVAS_LATTICE", None)
        repo_root = os.path.dirname(PACKAGE_DIR)
        env["PYTHONPATH"] = repo_root + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
        cmd = simulation_command(spec["input_dir"], spec["output_dir"], spec.get("mode") or "basic")
        if spec.get("field_dir"):
            cmd += ["--field", spec["field_dir"]]
        if spec.get("lattice"):
            cmd += ["--lattice", spec["lattice"]]
        flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        try:
            proc = subprocess.Popen(cmd, cwd=job.project.path, env=env, stdin=subprocess.DEVNULL,
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, creationflags=flags)
        except OSError as exc:
            stage.status = "failed"
            raise UserError(f"Could not start the simulation: {exc}") from exc
        with self.lock:
            self.proc = proc
            if self._paused_since is not None:         # paused while the stage was being prepared
                proctree.suspend(proc.pid)
        if len(job.stages) > 1:
            log.info("stage %d/%d: %s", self._stage + 1, len(job.stages), stage.label)
        threading.Thread(target=self._read_loop, args=(proc,), name="avas-run-reader", daemon=True).start()
        threading.Thread(target=self._tick_loop, args=(proc,), name="avas-run-tick", daemon=True).start()
        self._emit()

    def stop(self):
        from avas.ai import sandbox
        with self.lock:
            job, proc = self.job, self.proc
            if job is None:
                return sandbox.stop_active()
            self._stopping = True
        if proc is not None and proc.poll() is None:
            proctree.kill(proc)
        return True

    def pause(self):
        from avas.ai import sandbox
        with self.lock:
            if self.job is None:
                return sandbox.pause()
            if self._paused_since is not None:
                return True
            proc = self.proc
            if proc is not None and proc.poll() is None and not proctree.suspend(proc.pid):
                raise UserError("The simulation could not be paused.")
            self._frozen_eta = self._eta()
            self._paused_since = time.time()
        log.info("simulation paused")
        self._emit()
        return True

    def resume(self):
        from avas.ai import sandbox
        with self.lock:
            if self.job is None:
                return sandbox.resume()
            if self._paused_since is None:
                return True
            proc = self.proc
            if proc is not None and proc.poll() is None:
                proctree.resume(proc.pid)
            now = time.time()
            self._paused_total += now - self._paused_since
            self._paused_since = None
            self._resumed_at = now
        log.info("simulation resumed")
        self._emit()
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
            job = self.job
            if job is not None and job.source == "project" and self.mode in ERROR_MODES and not self.is_paused \
                    and time.time() - last_poll >= 3.0 and not polling[0]:
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
                pct = fields.get("percent")
                if pct is not None:
                    if self._samples and pct < self._samples[-1][1]:
                        self._samples = []          # error studies restart the engine per seed
                    self._samples.append((self._job_seconds(), pct))
                    del self._samples[:-120]
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
        job = self.job
        stage = job.stages[self._stage]
        stage.elapsed_s = round(self._stage_seconds(), 1)
        if not self._stopping and code == 0 and self._stage + 1 < len(job.stages):
            stage.status = "finished"
            with self.lock:
                self.proc = None
            try:
                self._next_stage()
                return
            except UserError as exc:
                stopped = self._stopping
                self._finalize(False, "stopped by user" if stopped else str(exc))
                return
        if self._stopping:
            stage.status = "stopped"
            self._finalize(False, "stopped by user")
        elif code != 0:
            stage.status = "failed"
            message = self._failure_message() or f"exit code {code}"
            if len(job.stages) > 1:
                message = f"{stage.label}: {message}"
            self._finalize(False, message)
        else:
            stage.status = "finished"
            with self.lock:
                self._state["percent"] = 100.0
                self._state["eta_s"] = 0.0
            self._finalize(True, "finished")

    def _finalize(self, ok, message):
        job = self.job
        stopped = self._stopping
        elapsed = self._job_seconds()
        if stopped:
            log.warning("simulation stopped by user")
        elif not ok:
            log.error("simulation failed: %s", message)
        else:
            log.info("simulation finished in %.1f s", elapsed)
        job.ok, job.message = ok, message
        if job.source == "project":
            p = job.project
            info = p.last_run() if p else {}
            info.update(status="finished" if ok else ("stopped" if stopped else "failed"),
                        finished=time.strftime("%Y-%m-%d %H:%M:%S"), elapsed_s=round(elapsed, 1), source="gui",
                        mode=self.mode)
            if ok:
                info.pop("error", None)
            else:
                info["error"] = message
            diagnostics = run_diagnostics(p, self._t0) if p and not stopped else None
            if diagnostics is not None:
                info["diagnostics"] = diagnostics
            else:
                info.pop("diagnostics", None)
            try:
                p.write_run_info(info)
            except OSError:
                pass
        elif ok:
            run_diagnostics(job.project, self._t0, job.output_dir)
        if job.on_finished is not None:
            try:
                job.on_finished(job, ok, message, stopped)
            except Exception:  # noqa: BLE001 - the run itself is over
                log.exception("finishing %s failed", job.label)
        with self.lock:
            self._state["elapsed_s"] = elapsed
            self._state["eta_s"] = 0.0 if ok else None
            state = self.state()
            self.proc = None
            self.job = None
            self._paused_since = None
        state.update(running=False, paused=False, ok=ok, message=message, stopped=stopped)
        bridge.emit("run.progress", state)
        bridge.emit("run.finished", state)
        from avas.gui.services import projects
        projects.notify()


def run_diagnostics(project, started=0.0, output_dir=None):
    """DataSet.txt health check of the run just finished; its messages also go to the log.

    A DataSet.txt older than *started* belongs to an earlier run and is ignored.
    """
    from avas.i18n import pick
    from avas.post.analysis.run_diagnostics import dataset_diagnostics
    out = output_dir or project.output_dir
    dataset = os.path.join(out, "DataSet.txt")
    if not os.path.isfile(dataset) or os.path.getmtime(dataset) < started - 1:
        return None
    try:
        cached = project.last_run().get("diagnostics") if output_dir is None else None
        diag = cached or dataset_diagnostics(out)
    except Exception as exc:  # noqa: BLE001 - diagnostics are best effort
        log.debug("run diagnostics failed: %s", exc)
        return None
    for m in (diag or {}).get("messages", []):
        {"error": log.error, "warning": log.warning}.get(m["level"], log.info)("%s", pick(m["text"]))
    return diag


_runner = Runner()


def is_running():
    """A job of the runner (normal or segment run) is active, possibly paused or between stages."""
    return _runner.is_running


def any_active():
    """Any simulation: a runner job or an assistant sandbox study."""
    from avas.ai import sandbox
    return _runner.is_running or sandbox.active()


def runner():
    return _runner


def publish():
    """Send the current state to the page (used by the assistant's sandbox studies)."""
    bridge.emit("run.progress", _runner.state())


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


@rpc("run.pause")
def pause():
    _runner.pause()
    return _runner.state()


@rpc("run.resume")
def resume():
    _runner.resume()
    return _runner.state()


@rpc("run.state")
def state():
    return _runner.state()


def shutdown():
    _runner.stop()
