"""Simulations the assistant runs on *copies* of the input files.

Parameter scans and optimisations must not overwrite the project's own
``OutputFile`` or its input files, so every evaluation runs in a work folder
``<project>/.avas_ai/runs/<job>/run_NNN`` with its own ``input`` (text input
files copied from ``InputFile``, the lattice replaced by the candidate text)
and ``output``.  Field maps and particle files stay where they are: the engine
gets the project's field directory through ``--field`` and large binary inputs
are copied only when beam.txt refers to them.

One simulation runs at a time.  A study (all runs of one scan or optimisation)
is an *activity* from :meth:`Sandbox.begin` to :meth:`Sandbox.end`: the GUI
runner reports it on the Run page, tool bar and status bar (source
``assistant``), where it can be paused, resumed and stopped like a normal run,
and no normal run can start in between two of its simulations.
"""
import logging
import os
import re
import shutil
import subprocess
import sys
import threading
import time

from avas.data.fieldmap import EXT_MEANING
from avas.gui import proctree

log = logging.getLogger("avas.gui")

_lock = threading.RLock()
_active = {"proc": None, "job": None}
_activity = None                  # dict while a study is active, see Sandbox.begin
KEEP_OUTPUT = ("DataSet.txt", "avas_run.json", "Phase.txt", "synData.txt")
TEXT_SUFFIXES = (".txt", ".ini", ".dat", ".csv")
_PROGRESS = re.compile(r"Simulate progress\s+([\d.]+)\s*%", re.IGNORECASE)


class SandboxError(Exception):
    pass


def busy():
    """A sandbox simulation process is running right now."""
    return _active["proc"] is not None and _active["proc"].poll() is None


def active():
    """A study is active (possibly between two of its simulations, or paused)."""
    return _activity is not None or busy()


def work_root(project):
    return os.path.join(project.path, ".avas_ai")


def _is_field_map(name):
    return os.path.splitext(name)[1].lstrip(".").lower() in EXT_MEANING


def copy_text_inputs(project, dest):
    """Copy the text input files of *project* (and a relative particle file) into *dest*."""
    os.makedirs(dest, exist_ok=True)
    src = project.input_dir
    for name in os.listdir(src):
        path = os.path.join(src, name)
        if os.path.isfile(path) and not _is_field_map(name) and name.lower().endswith(TEXT_SUFFIXES):
            shutil.copy2(path, os.path.join(dest, name))
    beam = os.path.join(dest, "beam.txt")
    if not os.path.isfile(beam):
        return
    with open(beam, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = line.split("!", 1)[0].split()
            if len(parts) >= 2 and parts[0].lower() == "readparticledistribution" and parts[1].lower() != "unknown":
                file = os.path.join(src, parts[1])
                if not os.path.isabs(parts[1]) and os.path.isfile(file):
                    shutil.copy2(file, os.path.join(dest, parts[1]))


# =========================================================================== activity
def _publish():
    try:
        from avas.gui.services import runner
        runner.publish()
    except Exception:  # noqa: BLE001 - progress display only
        pass


def _active_seconds(act, now=None):
    now = now or time.time()
    paused = act["paused_total"] + (now - act["paused_since"] if act["paused_since"] else 0.0)
    return max(0.0, now - act["t0"] - paused)


def activity_state():
    """Run-page state of the active study, or None."""
    with _lock:
        act = _activity
        if act is None:
            return None
        return {"running": True, "paused": act["paused_since"] is not None, "source": "assistant",
                "label": act["label"], "mode": "basic", "percent": act["percent"], "eta_s": None,
                "elapsed_s": _active_seconds(act), "step": act["index"] or None, "all_step": act["total"],
                "pos_m": None, "line": act["line"]}


def pause():
    with _lock:
        act = _activity
        if act is None:
            return False
        if act["paused_since"] is None:
            proc = _active["proc"]
            if proc is not None and proc.poll() is None:
                proctree.suspend(proc.pid)
            act["paused_since"] = time.time()
    log.info("assistant study paused")
    _publish()
    return True


def resume():
    with _lock:
        act = _activity
        if act is None:
            return False
        if act["paused_since"] is not None:
            proc = _active["proc"]
            if proc is not None and proc.poll() is None:
                proctree.resume(proc.pid)
            act["paused_total"] += time.time() - act["paused_since"]
            act["paused_since"] = None
    log.info("assistant study resumed")
    _publish()
    return True


def stop_active():
    """Stop the active study: its assistant turn is told to stop and the running engine is killed."""
    with _lock:
        act = _activity
        if act is not None and act["stop_event"] is not None:
            act["stop_event"].set()
        if act is not None:
            act["stopped"] = True
    stop_all()
    return act is not None


class Sandbox:
    """A work folder with a private copy of the project's text input files."""

    def __init__(self, project, job_id):
        self.project = project
        self.job_id = job_id
        self.root = os.path.join(work_root(project), "runs", job_id)
        self.input_dir = os.path.join(self.root, "input")
        self.count = 0
        self._own_activity = False
        copy_text_inputs(project, self.input_dir)
        dirs = project.field_dirs()
        self.field_dir = dirs[0] if dirs else project.input_dir
        self.lattice_name = project.lattice_name()

    # ------------------------------------------------------------------ activity
    def begin(self, label, total=None, stop_event=None):
        """Report the following runs as one study on the Run page."""
        global _activity
        from avas.gui.services import runner
        with _lock:
            if runner.is_running():
                raise SandboxError("Another simulation is running; wait for it to finish.")
            if _activity is not None and _activity["job"] != self.job_id:
                raise SandboxError("The assistant is already running a simulation study.")
            _activity = {"job": self.job_id, "label": label, "total": total, "index": 0, "percent": None,
                         "line": "", "t0": time.time(), "paused_since": None, "paused_total": 0.0,
                         "stop_event": stop_event, "stopped": False}
            self._own_activity = True
        _publish()

    def end(self):
        global _activity
        with _lock:
            if not self._own_activity or _activity is None or _activity["job"] != self.job_id:
                return
            _activity = None
            self._own_activity = False
        _publish()

    def write_input(self, name, text):
        with open(os.path.join(self.input_dir, name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)

    def run(self, lattice_text=None, files=None, stop_event=None, progress=None, timeout=None, keep=False):
        """Run the engine once; returns ``(output_dir, seconds)``.

        *files* maps input file names to replacement texts (e.g. beam.txt);
        *progress* is called with the engine's percentage.  Bulky outputs are
        removed unless *keep*.  *timeout* and the returned seconds do not count
        time spent paused.
        """
        from avas.gui.services import runner
        transient = not self._own_activity
        if transient:
            self.begin("Assistant simulation", stop_event=stop_event)
        try:
            return self._run(lattice_text, files, stop_event, progress, timeout, keep, runner)
        finally:
            if transient:
                self.end()

    def _stopped(self, stop_event):
        act = _activity
        return (stop_event is not None and stop_event.is_set()) or (act is not None and act.get("stopped"))

    def _run(self, lattice_text, files, stop_event, progress, timeout, keep, runner):
        self.count += 1
        if lattice_text is not None:
            self.write_input(self.lattice_name, lattice_text)
        for name, text in (files or {}).items():
            self.write_input(name, text)
        out = os.path.join(self.root, f"run_{self.count:03d}")
        shutil.rmtree(out, ignore_errors=True)
        os.makedirs(out)
        cmd = runner.simulation_command(self.input_dir, out, "basic") + ["--field", self.field_dir, "--lattice", self.lattice_name]
        env = dict(os.environ)
        env.update(PYTHONUNBUFFERED="1", PYTHONIOENCODING="utf-8", MPLBACKEND="Agg", AVAS_GUI_CHILD="1")
        from avas.paths import PACKAGE_DIR
        repo_root = os.path.dirname(PACKAGE_DIR)
        env["PYTHONPATH"] = repo_root + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
        env.pop("AVAS_LATTICE", None)
        flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        while True:                              # a paused study does not start its next simulation
            if self._stopped(stop_event):
                raise SandboxError("stopped")
            act = _activity
            if act is None or act["paused_since"] is None:
                break
            time.sleep(0.2)
        with _lock:
            if runner.is_running() or busy():
                raise SandboxError("Another simulation is running; wait for it to finish.")
            proc = subprocess.Popen(cmd, cwd=self.root, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, creationflags=flags)
            _active.update(proc=proc, job=self.job_id)
            if _activity is not None:
                _activity.update(index=self.count, percent=0.0, line="")
                if _activity["paused_since"] is not None:      # paused while starting
                    proctree.suspend(proc.pid)
        _publish()
        tail = []

        def reader():
            buffer = b""
            stream = proc.stdout
            while True:
                chunk = stream.read1(4096) if hasattr(stream, "read1") else stream.read(4096)
                if not chunk:
                    break
                buffer += chunk
                parts = re.split(rb"[\r\n]", buffer)
                buffer = parts.pop()
                for raw in parts:
                    line = raw.decode("utf-8", "replace").strip()
                    if not line:
                        continue
                    m = _PROGRESS.search(line)
                    if m:
                        try:
                            pct = float(m.group(1))
                        except ValueError:
                            continue
                        act = _activity
                        if act is not None:
                            act["percent"] = pct
                            act["line"] = line
                        if progress:
                            try:
                                progress(pct)
                            except Exception:  # noqa: BLE001 - progress display only
                                pass
                    else:
                        tail.append(line)
                        del tail[:-30]

        thread = threading.Thread(target=reader, name="avas-sandbox-reader", daemon=True)
        thread.start()
        started = previous = time.time()
        paused_s = 0.0
        last_publish = 0.0
        try:
            while proc.poll() is None:
                now = time.time()
                act = _activity
                if act is not None and act["paused_since"] is not None:
                    paused_s += now - previous
                previous = now
                if self._stopped(stop_event):
                    proctree.kill(proc)
                    raise SandboxError("stopped")
                if timeout and now - started - paused_s > timeout:
                    proctree.kill(proc)
                    raise SandboxError(f"timed out after {timeout:.0f} s")
                if now - last_publish >= 1.0:
                    last_publish = now
                    _publish()
                time.sleep(0.2)
            thread.join(5)
            code = proc.returncode
        finally:
            with _lock:
                _active.update(proc=None, job=None)
        seconds = max(0.0, time.time() - started - paused_s)
        if code != 0:
            if self._stopped(stop_event):
                raise SandboxError("stopped")
            message = next((ln[6:].strip() for ln in reversed(tail) if ln.lower().startswith("error:")), None)
            raise SandboxError(message or (tail[-1] if tail else f"engine exit code {code}"))
        if not keep:
            for name in os.listdir(out):
                if name not in KEEP_OUTPUT:
                    p = os.path.join(out, name)
                    if os.path.isfile(p):
                        try:
                            os.remove(p)
                        except OSError:
                            pass
        return out, seconds

    def cleanup(self, keep_dirs=()):
        """Remove run folders except *keep_dirs* and end the study."""
        self.end()
        if not os.path.isdir(self.root):
            return
        keep = {os.path.normcase(os.path.abspath(k)) for k in keep_dirs}
        for name in os.listdir(self.root):
            p = os.path.join(self.root, name)
            if name.startswith("run_") and os.path.normcase(os.path.abspath(p)) not in keep:
                shutil.rmtree(p, ignore_errors=True)


def kill(proc):
    proctree.kill(proc)


def stop_all():
    proc = _active["proc"]
    if proc is not None:
        kill(proc)
