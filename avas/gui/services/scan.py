"""Scan page: run one parameter over a list of values (:mod:`avas.sim.scan`).

A scan runs in a thread on copies of the input files (no run lock; the
project's InputFile and OutputFile are untouched) and shows on the Run page
like the assistant's studies (source ``scan``), where it can be paused, resumed
and stopped.  Results live in ``<project>/Scans/<label>_<time>/`` (``scan.json``,
``scan.csv`` and one ``run_NNN/`` results folder per value).

Events: ``scan.progress`` (the partial result after every run) and
``scan.finished`` ({folder, status, error}).
"""
import logging
import os
import threading

from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc
from avas.sim import scan as core

log = logging.getLogger("avas.gui")

_lock = threading.Lock()
_current = {"thread": None, "stop": None, "result": None, "project": None}


def _same_path(a, b):
    return os.path.normcase(os.path.abspath(a)) == os.path.normcase(os.path.abspath(b))


def _snapshot(result):
    if result is None:
        return None
    out = dict(result)
    out["rows"] = [dict(r) for r in result.get("rows", [])]
    return out


def running():
    t = _current["thread"]
    return t is not None and t.is_alive()


@rpc("scan.metrics")
def metrics():
    return {"default": core.DEFAULT_METRICS, "all": core.ALL_METRICS}


@rpc("scan.check")
def check(spec, values=None):
    """Resolve the target and values without running: ``{target, values, count}``."""
    p = context.project().require()
    vals = core.normalise_values(values) if values not in (None, "", []) else []
    try:
        target = core.ScanTarget(spec, core.read_inputs(p.input_dir, p.lattice_name()), p.field_dirs(), p.lattice_name())
        if vals:
            target.apply(vals[0])
    except core.ScanError as exc:
        raise UserError(str(exc)) from exc
    est = (p.last_run() or {}).get("elapsed_s")
    return {"target": target.describe(), "values": vals, "count": len(vals),
            "estimate_s": est * len(vals) if est and vals else None}


@rpc("scan.start")
def start(spec, values, metrics=None, label=""):
    p = context.project().require()
    from avas.gui.services import runner
    if runner.any_active():
        raise UserError("A simulation is already running; wait for it to finish.")
    with _lock:
        if running():
            raise UserError("A parameter scan is already running; wait for it to finish.")
        stop = threading.Event()
        try:
            prepared = core.prepare_scan(p, spec, values, metrics, label, stop_event=stop)   # reserves the runner now
        except core.ScanError as exc:
            raise UserError(str(exc)) from exc
        _current.update(stop=stop, result=_snapshot(prepared.result), project=p.path)
        vals = prepared.result["values"]

        def progress(result):
            _current["result"] = result
            bridge.emit("scan.progress", _snapshot(result))

        def work():
            error = None
            result = None
            try:
                result = prepared.execute(on_progress=progress)
            except Exception as exc:  # noqa: BLE001 - reported to the page
                error = f"{type(exc).__name__}: {exc}"
                log.exception("parameter scan failed")
            _current["result"] = result or prepared.result
            bridge.emit("scan.finished", {"folder": prepared.result.get("folder"), "status": prepared.result.get("status"),
                                          "error": error, "rows": len(prepared.result.get("rows", []))})
            try:
                from avas.gui.services import projects
                projects.notify()
            except Exception:  # noqa: BLE001 - display only
                pass

        thread = threading.Thread(target=work, name="avas-scan", daemon=True)
        _current["thread"] = thread
        thread.start()
    log.info("parameter scan started: %s over %d values", spec, len(vals))
    return state()


@rpc("scan.state")
def state():
    return {"running": running(), "result": _snapshot(_current["result"])}


@rpc("scan.stop")
def stop():
    stop_event = _current["stop"]
    if stop_event is not None:
        stop_event.set()
    from avas.ai import sandbox
    sandbox.stop_all()
    return True


@rpc("scan.list")
def list_scans():
    p = context.project().require()
    out = []
    for r in core.list_scans(p.path):
        out.append({"folder": r["folder"], "label": r.get("label"), "created": r.get("created"),
                    "finished": r.get("finished"), "status": r.get("status"), "target": r.get("target"),
                    "count": len(r.get("values") or []), "done": len(r.get("rows") or [])})
    return out


@rpc("scan.load")
def load(folder):
    p = context.project().require()
    root = os.path.normcase(os.path.abspath(os.path.join(p.path, core.SCANS_DIR)))
    if not os.path.normcase(os.path.abspath(folder)).startswith(root + os.sep):
        raise UserError("This folder is not a scan of the project.")
    try:
        return core.load(folder)
    except (OSError, ValueError) as exc:
        raise UserError(f"Cannot read the scan: {exc}") from exc


@rpc("scan.delete")
def delete(folder):
    p = context.project().require()
    root = os.path.normcase(os.path.abspath(os.path.join(p.path, core.SCANS_DIR)))
    full = os.path.normcase(os.path.abspath(folder))
    if not full.startswith(root + os.sep) or not os.path.isfile(os.path.join(folder, core.META_FILE)):
        raise UserError("This folder is not a scan of the project.")
    current = _current["result"]
    if running() and current and _same_path(current.get("folder", ""), folder):
        raise UserError("This scan is still running; stop it first.")
    from avas.gui.services.segments import _trash
    _trash(folder)
    log.info("scan moved to the recycle bin: %s", os.path.basename(folder))
    return True


def shutdown():
    stop()
