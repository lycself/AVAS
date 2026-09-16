"""Runs a simulation in a child process and reports progress to the GUI.

The child is ``python -m avas run ...`` (or ``AVAS.exe run ...`` when frozen)
driven through :class:`QProcess`.  Its stdout/stderr are read line by line:

* ``Simulate progress 45.34%. Estimated remaining time 9s. Run time 15s. ...``
  printed by the native engine becomes the live progress (percent, ETA,
  elapsed).  This is the same text the terminal shows, so GUI and console
  can no longer disagree.
* every other line is forwarded through :attr:`SimulationRunner.output`
  (the log panel shows it) and kept for the failure message.

For error studies the engine restarts once per seed, so the percentage
resets; the overall *step i / N* is read from the output directory by
:class:`avas.api.qt.getschedule.GetSchedule` in a worker thread.
"""
import logging
import os
import re
import sys
import time

from PyQt5.QtCore import QObject, QProcess, QProcessEnvironment, QThread, QTimer, pyqtSignal

from avas import __version__
from avas.paths import PACKAGE_DIR

log = logging.getLogger("avas.gui")

PROGRESS_RE = re.compile(
    r"Simulate progress\s+(?P<pct>[\d.]+)\s*%"
    r"(?:.*?Estimated remaining time\s+(?P<eta>\d+)\s*s)?"
    r"(?:.*?Run time\s+(?P<run>\d+)\s*s)?"
    r"(?:.*?\b(?P<bunch>\d+)\s+(?P<pos>[\d.]+)\s*m\s*$)?",
    re.IGNORECASE,
)
ERROR_MODES = ("stat", "dyn", "stat_dyn")


class _ScheduleThread(QThread):
    """Reads step i/N of an error study from the output directory."""
    result = pyqtSignal(dict)

    def __init__(self, project_path):
        super().__init__()
        self.project_path = project_path

    def run(self):
        try:
            from avas.api.qt.getschedule import GetSchedule
            res = GetSchedule({"projectPath": self.project_path}).main()
        except Exception as exc:  # noqa: BLE001
            res = {"code": -1, "data": {"msg": str(exc)}}
        self.result.emit(res)


def simulation_command(input_dir, output_dir, mode):
    """Return ``(program, args)`` that runs the simulation in a child process."""
    run_args = ["run", "--input", input_dir, "--output", output_dir, "--mode", mode or "basic"]
    if getattr(sys, "frozen", False):
        return sys.executable, run_args
    return sys.executable, ["-u", "-m", "avas"] + run_args


class SimulationRunner(QObject):
    started = pyqtSignal()
    progress = pyqtSignal(dict)          # see _emit_progress for the keys
    output = pyqtSignal(str)             # one non-progress line of engine output
    finished = pyqtSignal(bool, str)     # ok, message

    def __init__(self, parent=None):
        super().__init__(parent)
        self.project = None
        self.process = None
        self.mode = ""
        self._t0 = 0.0
        self._buffer = ""
        self._tail = []
        self._state = {}
        self._stopping = False
        self._schedule_thread = None
        self._schedule_timer = QTimer(self)
        self._schedule_timer.timeout.connect(self._poll_schedule)
        self._tick_timer = QTimer(self)
        self._tick_timer.timeout.connect(self._tick)

    @property
    def is_running(self):
        return self.process is not None and self.process.state() != QProcess.NotRunning

    # ------------------------------------------------------------------ control
    def start(self, project, mode=""):
        if self.is_running:
            raise RuntimeError("a simulation is already running")
        self.project = project
        self.mode = mode or "basic"
        self._t0 = time.time()
        self._buffer = ""
        self._tail = []
        self._stopping = False
        self._state = {"percent": 0.0, "eta_s": None, "run_s": None, "pos_m": None, "elapsed_s": 0.0,
                       "step": None, "all_step": None, "line": ""}
        os.makedirs(project.output_dir, exist_ok=True)
        project.write_run_info({
            "avas_version": __version__,
            "input_dir": project.input_dir,
            "output_dir": project.output_dir,
            "mode": self.mode,
            "started": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "running",
            "source": "gui",
        })

        program, args = simulation_command(project.input_dir, project.output_dir, self.mode)
        proc = QProcess(self)
        proc.setProcessChannelMode(QProcess.MergedChannels)
        proc.setWorkingDirectory(project.path)
        env = QProcessEnvironment.systemEnvironment()
        env.insert("PYTHONUNBUFFERED", "1")
        env.insert("PYTHONIOENCODING", "utf-8")
        env.insert("MPLBACKEND", "Agg")
        env.insert("AVAS_GUI_CHILD", "1")
        repo_root = os.path.dirname(PACKAGE_DIR)
        existing = env.value("PYTHONPATH", "")
        env.insert("PYTHONPATH", repo_root + (os.pathsep + existing if existing else ""))
        proc.setProcessEnvironment(env)
        proc.readyReadStandardOutput.connect(self._read)
        proc.finished.connect(self._on_finished)
        proc.errorOccurred.connect(self._on_error)
        self.process = proc
        proc.start(program, args)
        if not proc.waitForStarted(10000):
            self.process = None
            raise RuntimeError(f"could not start {program}: {proc.errorString()}")

        self._tick_timer.start(1000)
        if self.mode in ERROR_MODES:
            self._schedule_timer.start(3000)
        log.info("simulation started (%s) -> %s", self.mode, project.output_dir)
        self.started.emit()
        self.progress.emit(dict(self._state))

    def stop(self):
        if self.is_running:
            self._stopping = True
            self.process.kill()
            self.process.waitForFinished(5000)
        else:
            self._cleanup()

    # ------------------------------------------------------------------ output
    def _read(self):
        if self.process is None:
            return
        data = bytes(self.process.readAllStandardOutput())
        text = data.decode("utf-8", errors="replace")
        # the engine redraws its progress line with a bare '\r' (no newline), so a
        # carriage return must count as a line terminator too
        self._buffer += text.replace("\r\n", "\n").replace("\r", "\n")
        *lines, self._buffer = self._buffer.split("\n")
        for line in lines:
            self._handle_line(line)

    def _handle_line(self, line):
        if not line.strip():
            return
        m = PROGRESS_RE.search(line)
        if m:
            try:
                self._state["percent"] = min(100.0, float(m.group("pct")))
            except ValueError:
                pass
            for key, name in (("eta_s", "eta"), ("run_s", "run")):
                v = m.group(name)
                self._state[key] = int(v) if v is not None else self._state.get(key)
            if m.group("pos") is not None:
                try:
                    self._state["pos_m"] = float(m.group("pos"))
                except ValueError:
                    pass
            self._state["line"] = line.strip()
            self._emit_progress()
            return
        self._tail.append(line)
        self._tail = self._tail[-40:]
        self.output.emit(line)

    def _tick(self):
        self._state["elapsed_s"] = time.time() - self._t0
        self._emit_progress()

    def _emit_progress(self):
        self._state["elapsed_s"] = time.time() - self._t0
        self.progress.emit(dict(self._state))

    # ------------------------------------------------------------------ error-study steps
    def _poll_schedule(self):
        if self.project is None or (self._schedule_thread is not None and self._schedule_thread.isRunning()):
            return
        self._schedule_thread = _ScheduleThread(self.project.path)
        self._schedule_thread.result.connect(self._on_schedule)
        self._schedule_thread.start()

    def _on_schedule(self, res):
        if res.get("code", 0) != 0:
            return
        sched = res.get("data", {}).get("schedule") or {}
        try:
            self._state["step"] = int(sched.get("currentStep"))
            self._state["all_step"] = int(sched.get("allStep"))
        except (TypeError, ValueError):
            return
        self._emit_progress()

    # ------------------------------------------------------------------ end of run
    def _on_error(self, err):
        if self.process is None or self._stopping:
            return
        if err == QProcess.FailedToStart:
            self._finish(False, f"failed to start: {self.process.errorString()}")

    def _on_finished(self, exit_code, exit_status):
        if self.process is None:
            return
        self._read()
        if self._buffer.strip():
            self._handle_line(self._buffer)
            self._buffer = ""
        if self._stopping:
            log.warning("simulation stopped by user")
            self._finish(False, "stopped by user")
        elif exit_status == QProcess.CrashExit:
            log.error("simulation process crashed (exit code %s)", exit_code)
            self._finish(False, self._failure_message() or f"engine process crashed (exit code {exit_code})")
        elif exit_code != 0:
            msg = self._failure_message() or f"exit code {exit_code}"
            log.error("simulation failed: %s", msg)
            self._finish(False, msg)
        else:
            self._state["percent"] = 100.0
            self._emit_progress()
            log.info("simulation finished in %.1f s", time.time() - self._t0)
            self._finish(True, "finished")

    def _failure_message(self):
        """Best short description of why the child failed, from its last lines."""
        for line in reversed(self._tail):
            s = line.strip()
            if s.lower().startswith("error:"):
                return s[6:].strip()
        for line in reversed(self._tail):
            s = line.strip()
            if s and not s.startswith(("File ", "Traceback", "[avas]")) and "^" not in s:
                return s
        return ""

    def _finish(self, ok, message):
        info = self.project.last_run() if self.project else {}
        info.update(status="finished" if ok else ("stopped" if message == "stopped by user" else "failed"),
                    finished=time.strftime("%Y-%m-%d %H:%M:%S"), elapsed_s=round(time.time() - self._t0, 1),
                    source="gui", mode=self.mode)
        if not ok:
            info["error"] = message
        elif "error" in info:
            del info["error"]
        if self.project:
            self.project.write_run_info(info)
        self._cleanup()
        self.finished.emit(ok, message)

    def _cleanup(self):
        self._tick_timer.stop()
        self._schedule_timer.stop()
        if self.process is not None:
            proc = self.process
            self.process = None
            try:
                proc.readyReadStandardOutput.disconnect(self._read)
                proc.finished.disconnect(self._on_finished)
                proc.errorOccurred.disconnect(self._on_error)
            except TypeError:
                pass
            proc.deleteLater()
