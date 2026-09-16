"""Files page: everything in InputFile/, recognised by content."""
import logging
import os
import shutil
import time

import numpy as np

from avas.data import filekinds as fk
from avas.data.fieldmap import EXT_MEANING, FieldMap, components
from avas.data.lattice_doc import LatticeDocument
from avas.data.particles import read_dst, read_edst
from avas.webgui import bridge, context
from avas.webgui.bridge import UserError, rpc
from avas.webgui.textio import read_text, write_text

log = logging.getLogger("avas.gui")

MAX_EDIT_BYTES = 2 * 1024 * 1024
MAX_POINTS = 20000

# group, role id, accent badge, editable
ROLES = {
    fk.KIND_GENERATED_LATTICE: ("lattices", "generated", False, False),
    fk.KIND_TRACEWIN_LATTICE: ("lattices", "tracewin_lattice", False, False),
    fk.KIND_BEAM: ("engine", "beam", True, True),
    fk.KIND_INPUT: ("engine", "input", True, True),
    fk.KIND_BOUNDARY: ("engine", "boundary", True, True),
    fk.KIND_SCANDATA: ("engine", "scandata", True, True),
    fk.KIND_SEPARTICLE: ("engine", "separticle", True, True),
    fk.KIND_GUI_INI: ("engine", "gui_ini", False, True),
    fk.KIND_PARTICLES: ("particles", "particles", False, False),
    fk.KIND_PARTICLES_EXT: ("particles", "particles", False, False),
    fk.KIND_PLT: ("particles", "plt", False, False),
    fk.KIND_FIELDMAP: ("fieldmaps", "fieldmap", False, False),
    fk.KIND_TRACEWIN_PROJECT: ("other", "tracewin_project", False, False),
    fk.KIND_TEXT: ("other", "text", False, True),
    fk.KIND_BINARY: ("other", "binary", False, False),
}
GROUP_ORDER = ["engine", "lattices", "particles", "fieldmaps", "other"]


def describe(project, path, kind):
    name = os.path.basename(path)
    if kind == fk.KIND_LATTICE:
        if name.lower() == project.lattice_name().lower():
            return "engine", "lattice_run", True, True
        return "lattices", "lattice", False, True
    return ROLES.get(kind, ("other", "binary", False, False))


def _inside(project, path):
    root = os.path.normcase(os.path.abspath(project.input_dir))
    return os.path.normcase(os.path.abspath(path)).startswith(root + os.sep)


def _entry(project, path):
    kind = fk.detect(path)
    group, role, accent, editable = describe(project, path, kind)
    st = os.stat(path)
    return {"name": os.path.basename(path), "path": path, "kind": kind, "group": group, "role": role,
            "accent": accent, "editable": editable, "size": st.st_size, "mtime": st.st_mtime}


@rpc("files.list")
def list_files():
    p = context.project().require()
    entries = []
    if os.path.isdir(p.input_dir):
        for name in os.listdir(p.input_dir):
            path = os.path.join(p.input_dir, name)
            if os.path.isfile(path):
                try:
                    entries.append(_entry(p, path))
                except OSError:
                    continue
    entries.sort(key=lambda e: (GROUP_ORDER.index(e["group"]), e["role"] != "lattice_run", e["name"].lower()))
    return {"dir": p.input_dir, "files": entries, "latticeName": p.lattice_name(), "latticePath": p.lattice_path(),
            "fieldDirs": p.field_dirs()}


def _check(path):
    p = context.project().require()
    if not path or not _inside(p, path):
        raise UserError("Only files inside InputFile/ can be used here.")
    return p


@rpc("files.open")
def open_file(path):
    p = _check(path)
    if not os.path.isfile(path):
        raise UserError(f"Not found: {path}")
    info = _entry(p, path)
    kind = info["kind"]
    if kind in (fk.KIND_PARTICLES, fk.KIND_PARTICLES_EXT, fk.KIND_FIELDMAP, fk.KIND_PLT, fk.KIND_BINARY,
                fk.KIND_TRACEWIN_PROJECT) or info["size"] > MAX_EDIT_BYTES:
        info["view"] = "info"
        info["tooLarge"] = info["size"] > MAX_EDIT_BYTES and kind not in (fk.KIND_PARTICLES, fk.KIND_PARTICLES_EXT,
                                                                           fk.KIND_FIELDMAP, fk.KIND_PLT)
        info["modified"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(info["mtime"]))
        return info
    info["view"] = "text"
    info["text"] = read_text(path)
    return info


@rpc("files.save")
def save_file(path, text):
    p = _check(path)
    info = _entry(p, path) if os.path.isfile(path) else None
    if info is not None and not info["editable"]:
        raise UserError(f"{os.path.basename(path)} is generated or binary and cannot be edited here.")
    write_text(path, text)
    log.info("saved %s", os.path.basename(path))
    return _entry(p, path)


@rpc("files.useLattice")
def use_lattice(path):
    p = _check(path)
    p.set_lattice_name(os.path.basename(path))
    log.info("lattice used for the run: %s", os.path.basename(path))
    from avas.webgui.services import projects
    projects.notify()
    return True


@rpc("files.rename")
def rename_file(path, newName):
    p = _check(path)
    new_name = (newName or "").strip()
    if not new_name or any(c in new_name for c in '\\/:*?"<>|'):
        raise UserError("Invalid file name.")
    target = os.path.join(os.path.dirname(path), new_name)
    if os.path.exists(target) and os.path.normcase(target) != os.path.normcase(path):
        raise UserError(f"{new_name} already exists.")
    was_run_lattice = os.path.basename(path).lower() == p.lattice_name().lower()
    os.replace(path, target)
    if was_run_lattice:
        p.set_lattice_name(new_name)
    log.info("renamed %s -> %s", os.path.basename(path), new_name)
    from avas.webgui.services import projects
    projects.notify()
    return target


@rpc("files.trash")
def trash_file(path):
    _check(path)
    from send2trash import send2trash
    send2trash(os.path.normpath(path))
    log.info("moved to the recycle bin: %s", os.path.basename(path))
    from avas.webgui.services import projects
    projects.notify()
    return True


@rpc("files.import")
def import_files(sources, overwrite=False):
    p = context.project().require()
    copied, existing = [], []
    for src in sources or []:
        if not os.path.isfile(src):
            continue
        target = p.input_file(os.path.basename(src))
        if os.path.normcase(os.path.abspath(src)) == os.path.normcase(os.path.abspath(target)):
            continue
        if os.path.exists(target) and not overwrite:
            existing.append(os.path.basename(src))
            continue
        shutil.copyfile(src, target)
        copied.append(os.path.basename(src))
    if copied:
        log.info("copied into InputFile: %s", ", ".join(copied))
    return {"copied": copied, "existing": existing}


@rpc("files.create")
def create_file(name):
    p = context.project().require()
    name = (name or "").strip()
    if not name or any(c in name for c in '\\/:*?"<>|'):
        raise UserError("Invalid file name.")
    path = p.input_file(name)
    if os.path.exists(path):
        raise UserError(f"{name} already exists.")
    write_text(path, "")
    return path


@rpc("files.duplicate")
def duplicate_file(path):
    p = _check(path)
    base, ext = os.path.splitext(os.path.basename(path))
    for i in range(1, 1000):
        target = p.input_file(f"{base}_copy{'' if i == 1 else i}{ext}")
        if not os.path.exists(target):
            shutil.copyfile(path, target)
            return target
    raise UserError("Could not find a free name.")


# --------------------------------------------------------------------------- data views
def _sample(particles):
    n = len(particles)
    if n > MAX_POINTS:
        idx = np.sort(np.random.default_rng(0).choice(n, MAX_POINTS, replace=False))
        return particles[idx]
    return particles


@rpc("files.particles")
def particles(path):
    _check(path)
    extended = path.lower().endswith(".edst")
    d = read_edst(path) if extended else read_dst(path)
    part = _sample(d["particles"])
    return {
        "extended": extended,
        "number": d["number"], "ib": d["ib"], "freq": d["freq"], "mc2": d["mc2"], "energy": d["energy"],
        "twiss": {k: [float(x) for x in v] for k, v in d["twiss"].items()},
        "species": [list(s) for s in d.get("species", [])[:8]],
        "moreSpecies": len(d.get("species", [])) > 8,
        "x": bridge.blob(part[:, 0] * 10), "xp": bridge.blob(part[:, 1] * 1000),
        "y": bridge.blob(part[:, 2] * 10), "yp": bridge.blob(part[:, 3] * 1000),
        "phi": bridge.blob(np.degrees(part[:, 4])), "w": bridge.blob(part[:, 5]),
        "shown": len(part),
    }


def _lattice_doc(project):
    path = project.lattice_path()
    if not path or not os.path.isfile(path):
        return None
    return LatticeDocument(read_text(path), project.field_dirs())


@rpc("files.fieldmap")
def fieldmap(path):
    p = _check(path)
    fm = FieldMap(path).read()
    z, axis, peak = fm.profiles()
    base = os.path.splitext(os.path.basename(path))[0]
    dirs = p.field_dirs() or [os.path.dirname(path)]
    found = sorted(components(dirs, base))
    users = []
    doc = _lattice_doc(p)
    if doc is not None:
        for st in doc.statements:
            if st.active and st.key == "field" and st.param(8) == base:
                users.append(st.name or {"line": st.line_no + 1})
    ext = os.path.splitext(path)[1].lstrip(".").lower()
    return {
        "ext": ext, "meaning": list(EXT_MEANING.get(ext, ("", ""))), "binary": fm.binary, "length": fm.length,
        "nz": fm.nz, "nx": fm.nx, "ny": fm.ny, "points": fm.points, "xRange": list(fm.x_range),
        "yRange": list(fm.y_range), "norm": fm.norm, "base": base, "found": found, "usedBy": users,
        "z": bridge.blob(z, "float64"), "axis": bridge.blob(axis, "float64"), "peak": bridge.blob(peak, "float64"),
    }


@rpc("files.rfCavities")
def rf_cavities():
    p = context.project().require()
    doc = _lattice_doc(p)
    if doc is None:
        return []
    return [st.name or st.param(8) or f"field {i + 1}" for i, st in enumerate(doc.rf_cavities())]
