"""Project open / create / recent list."""
import logging
import os

from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc

log = logging.getLogger("avas.gui")


def notify():
    """Tell the page the project (or something shown in its summary) changed."""
    bridge.emit("project", context.project().summary())


def _runner_busy():
    from avas.gui.services import assistant, runner
    return runner.any_active() or assistant.any_busy()


@rpc("project.summary")
def summary():
    return context.project().summary()


@rpc("project.open")
def open_project(path):
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    if not path:
        raise UserError("No folder selected.")
    p = context.project()
    try:
        p.open(path)
    except ValueError as exc:
        raise UserError(str(exc)) from exc
    log.info("project opened: %s", p.path)
    return p.summary()


@rpc("project.create")
def create_project(path):
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    if not path:
        raise UserError("No folder selected.")
    p = context.project()
    try:
        p.create(path)
    except ValueError as exc:
        raise UserError(str(exc)) from exc
    log.info("project created: %s", p.path)
    return p.summary()


@rpc("project.close")
def close_project():
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    context.project().close()
    return context.project().summary()


@rpc("project.restoreLast")
def restore_last():
    p = context.project()
    last = p.last_path()
    if last and os.path.isdir(last) and not p.is_open:
        try:
            p.open(last)
        except ValueError as exc:
            log.warning("%s", exc)
    return p.summary()


@rpc("project.removeRecent")
def remove_recent(path):
    context.project().remove_recent(path)
    return context.project().summary()


# --------------------------------------------------------------------------- overview page
_cache = {}


def _cached(key, stamp, compute):
    hit = _cache.get(key)
    if hit and hit[0] == stamp:
        return hit[1]
    value = compute()
    _cache[key] = (stamp, value)
    return value


def _stamp(path):
    try:
        st = os.stat(path)
        return (path, st.st_mtime_ns, st.st_size)
    except OSError:
        return (path, None, None)


def lattice_summary(p):
    from avas.data.lattice_doc import LatticeDocument
    from avas.gui.textio import read_text
    path = p.lattice_path()

    def compute():
        if not os.path.isfile(path):
            return {"name": p.lattice_name(), "exists": False}
        doc = LatticeDocument(read_text(path), p.field_dirs())
        counts = {}
        for st in doc.elements():
            key = st.key if st.key != "field" else f"field{st.field_type()}"
            counts[key] = counts.get(key, 0) + 1
        errors = sum(1 for st in doc.statements for i in st.issues if i.level == "error")
        return {"name": p.lattice_name(), "exists": True, "elements": len(doc.elements()),
                "length": doc.total_length, "rf": len(doc.rf_cavities()), "issues": doc.issue_count(),
                "errors": errors, "counts": counts, "lines": len(doc.lines)}
    return _cached("lattice", (_stamp(path), tuple(p.field_dirs())), compute)


def beam_summary(p):
    from avas.gui.services import beam
    path = p.input_file("beam.txt")
    if not os.path.isfile(path):
        return {"exists": False}
    try:
        form = _cached("beam", _stamp(path), lambda: beam.load()["form"])
    except UserError as exc:
        return {"exists": True, "error": str(exc)}
    return {"exists": True, **form}


def settings_summary(p):
    from avas.gui.services import simsettings
    stamps = (_stamp(p.input_file("input.txt")), _stamp(p.input_file("ini.ini")))
    try:
        return _cached("settings", stamps, lambda: simsettings.load()["form"])
    except Exception as exc:  # noqa: BLE001 - a broken input.txt must not break the overview
        return {"error": str(exc)}


def run_summary(p):
    from avas.post.analysis.run_diagnostics import dataset_diagnostics, failure_hint
    run = p.last_run()
    if run.get("status") in ("finished", "failed") and "diagnostics" not in run:
        dataset = p.output_file("DataSet.txt")
        if os.path.isfile(dataset):          # runs recorded before diagnostics existed
            run["diagnostics"] = _cached("diagnostics", _stamp(dataset), lambda: dataset_diagnostics(p.output_dir))
    hint = failure_hint(run.get("error")) if run.get("status") == "failed" else None
    if hint:
        run["hint"] = list(hint)
    return run


@rpc("project.overview")
def overview():
    """Everything the project overview page shows, in one call."""
    p = context.project().require()
    out = p.summary()
    out.update(beam=beam_summary(p), lattice=lattice_summary(p), settings=settings_summary(p), lastRun=run_summary(p))
    return out
