"""Runs a simulation in a child process and reports progress to the GUI."""
import logging
import time
from multiprocessing import Process, Queue

from PyQt5.QtCore import QObject, QThread, QTimer, pyqtSignal

from avas import __version__

log = logging.getLogger("avas.gui")


def _worker(project_path, queue):
    """Child-process entry: run SimMode, report an exception through *queue*."""
    try:
        from avas.api.qt.SimMode import SimMode
        SimMode({"projectPath": project_path}).run()
    except Exception as exc:  # noqa: BLE001 - crosses a process boundary
        queue.put(str(exc))
    finally:
        queue.close()


class _ProgressThread(QThread):
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


class SimulationRunner(QObject):
    started = pyqtSignal()
    progress = pyqtSignal(dict)          # {"currentLength", "totalLength", "currentStep", "allStep"}
    finished = pyqtSignal(bool, str)     # ok, message

    def __init__(self, parent=None):
        super().__init__(parent)
        self.project = None
        self.process = None
        self.queue = None
        self.mode = ""
        self._t0 = 0.0
        self._progress_thread = None
        self._check_timer = QTimer(self)
        self._check_timer.timeout.connect(self._check_process)
        self._progress_timer = QTimer(self)
        self._progress_timer.timeout.connect(self._poll_progress)

    @property
    def is_running(self):
        return self.process is not None and self.process.is_alive()

    # ------------------------------------------------------------------ control
    def start(self, project, mode=""):
        if self.is_running:
            raise RuntimeError("a simulation is already running")
        self.project = project
        self.mode = mode
        self._t0 = time.time()
        project.write_run_info({
            "avas_version": __version__,
            "input_dir": project.input_dir,
            "output_dir": project.output_dir,
            "mode": mode,
            "started": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "running",
            "source": "gui",
        })
        self.queue = Queue()
        self.process = Process(target=_worker, args=(project.path, self.queue))
        self.process.start()
        self._check_timer.start(1000)
        self._progress_timer.start(2000)
        log.info("simulation started (%s) -> %s", mode or "basic", project.output_dir)
        self.started.emit()

    def stop(self):
        if self.is_running:
            self.process.terminate()
            self.process.join()
            log.warning("simulation stopped by user")
            self._finish(False, "stopped by user")
        else:
            self._cleanup()

    # ------------------------------------------------------------------ internals
    def _check_process(self):
        if self.process is None or self.process.is_alive():
            return
        self.process.join()
        error = None
        try:
            if self.queue is not None and not self.queue.empty():
                error = self.queue.get()
        except (OSError, EOFError):
            pass
        if error:
            log.error("simulation failed: %s", error)
            self._finish(False, error)
        else:
            log.info("simulation finished in %.1f s", time.time() - self._t0)
            self._finish(True, "finished")

    def _finish(self, ok, message):
        info = self.project.last_run() if self.project else {}
        info.update(status="finished" if ok else ("stopped" if message == "stopped by user" else "failed"),
                    finished=time.strftime("%Y-%m-%d %H:%M:%S"), elapsed_s=round(time.time() - self._t0, 1))
        if not ok:
            info["error"] = message
        if self.project:
            self.project.write_run_info(info)
        self._cleanup()
        self.finished.emit(ok, message)

    def _cleanup(self):
        self._check_timer.stop()
        self._progress_timer.stop()
        self.process = None
        if self.queue is not None:
            try:
                self.queue.close()
            except (OSError, ValueError):
                pass
            self.queue = None

    def _poll_progress(self):
        if self.project is None or (self._progress_thread is not None and self._progress_thread.isRunning()):
            return
        self._progress_thread = _ProgressThread(self.project.path)
        self._progress_thread.result.connect(self._on_progress)
        self._progress_thread.start()

    def _on_progress(self, res):
        if res.get("code", 0) != 0:
            return
        sched = res.get("data", {}).get("schedule")
        if sched:
            self.progress.emit(sched)
