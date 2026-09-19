"""Run history: keep a finished full run as a record under ``<project>/Runs/``.

Every full run writes into ``OutputFile/`` and overwrites the previous one, so
a result the user wants to keep is *archived*: ``OutputFile/`` (results,
``avas_run.json`` and the ``inputs/`` snapshot the run was made from) is copied
to ``Runs/<time>_<label>/``.  The copy is a normal results folder: the Results
page lists it as a source, plots it and compares it with other runs, and
``runs.delete`` moves it to the recycle bin.

The page asks before a new run when the last one is finished and not archived
(:func:`unsaved`), because starting the run overwrites it.
"""
import json
import logging
import os
import re
import shutil
import time

from avas.gui import context
from avas.gui.bridge import UserError, rpc
from avas.gui.locks import require_unlocked
from avas.gui.project import RUN_INFO_FILE

log = logging.getLogger("avas.gui")

RUNS_DIR = "Runs"


def runs_root(project):
    return os.path.join(project.path, RUNS_DIR)


def _read_info(folder):
    path = os.path.join(folder, RUN_INFO_FILE)
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def list_runs(project):
    """Archived runs, newest first: ``[{folder, label, status, started, finished, elapsed_s, ...}]``."""
    root = runs_root(project)
    out = []
    if not os.path.isdir(root):
        return out
    for name in os.listdir(root):
        folder = os.path.join(root, name)
        info = _read_info(folder) if os.path.isdir(folder) else None
        if info is None:
            continue
        info = dict(info)
        info["folder"] = folder
        info.setdefault("label", name)
        out.append(info)
    out.sort(key=lambda r: r.get("archived_at") or r.get("finished") or "", reverse=True)
    return out


def safe_label(label):
    return re.sub(r"[^\w\-.]+", "_", str(label or "").strip())[:40].strip("_")


def is_archived(project):
    """The last full run has an archive copy that still exists."""
    info = project.last_run() or {}
    dest = info.get("archived")
    return bool(dest) and os.path.isdir(dest)


@rpc("runs.unsaved")
def unsaved():
    """Whether starting a run would overwrite a finished result that is not archived."""
    p = context.project().require()
    info = p.last_run() or {}
    has_data = os.path.isfile(os.path.join(p.output_dir, "DataSet.txt"))
    pending = info.get("status") == "finished" and has_data and not is_archived(p)
    return {"unsaved": pending, "started": info.get("started"), "mode": info.get("mode"),
            "archived": info.get("archived") if is_archived(p) else None}


@rpc("runs.archive")
def archive(label=""):
    """Copy OutputFile/ to Runs/<time>_<label>/ and remember it in the run record."""
    p = context.project().require()
    require_unlocked()
    info = p.last_run() or {}
    if info.get("status") != "finished":
        raise UserError("Only a finished run can be kept as a record.")
    if not os.path.isfile(os.path.join(p.output_dir, "DataSet.txt")):
        raise UserError("There is no DataSet.txt in OutputFile to keep.")
    if is_archived(p):
        return {"folder": info["archived"], "existing": True}
    label = safe_label(label)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    name = f"{stamp}_{label}" if label else stamp
    dest = os.path.join(runs_root(p), name)
    if os.path.exists(dest):
        raise UserError(f"A record named {name} already exists.")
    os.makedirs(runs_root(p), exist_ok=True)
    try:
        shutil.copytree(p.output_dir, dest, ignore=shutil.ignore_patterns("error_middle"))
    except OSError as exc:
        shutil.rmtree(dest, ignore_errors=True)
        raise UserError(f"Could not copy the results: {exc}") from exc
    copied = dict(info)
    copied.update(label=label or stamp, archived_from=p.output_dir, archived_at=time.strftime("%Y-%m-%d %H:%M:%S"),
                  output_dir=dest)
    copied.pop("archived", None)
    with open(os.path.join(dest, RUN_INFO_FILE), "w", encoding="utf-8") as fh:
        json.dump(copied, fh, indent=2, ensure_ascii=False)
    info["archived"] = dest
    p.write_run_info(info)
    log.info("run kept as record %s", os.path.relpath(dest, p.path))
    from avas.gui.services import projects
    projects.notify()
    return {"folder": dest, "label": copied["label"], "existing": False}


@rpc("runs.rename")
def rename(folder, label):
    """Change the label of an archived run (the folder name stays)."""
    p = context.project().require()
    root = os.path.normcase(os.path.abspath(runs_root(p)))
    full = os.path.normcase(os.path.abspath(folder))
    if not full.startswith(root + os.sep) or not os.path.isdir(folder):
        raise UserError("This folder is not a run record of the project.")
    info = _read_info(folder)
    if info is None:
        raise UserError("This folder is not a run record of the project.")
    label = safe_label(label)
    if not label:
        raise UserError("Give a name.")
    info["label"] = label
    with open(os.path.join(folder, RUN_INFO_FILE), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2, ensure_ascii=False)
    return {"folder": folder, "label": label}
