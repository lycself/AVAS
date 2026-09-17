"""Lattice page, structure editor and visual editor: files, parsing, schema,
envelope overlays (last run, linear preview) and field-map profiles."""
import logging
import math
import os

import numpy as np

from avas import paths
from avas.data import filekinds, schema
from avas.data.fieldmap import EXT_MEANING
from avas.data.lattice_doc import Group, LatticeDocument
from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc
from avas.gui.textio import read_text, write_text

log = logging.getLogger("avas.gui")


# --------------------------------------------------------------------------- schema
def _param(p):
    return {"key": p.key, "label": list(p.label), "unit": p.unit, "kind": p.kind, "doc": list(p.doc),
            "choices": [[str(v), list(text)] for v, text in p.choices]}


def _keyword(k):
    return {"key": k.key, "title": list(k.title), "category": k.category, "doc": list(k.doc),
            "minParams": k.min_params, "params": [_param(p) for p in k.params]}


_SCHEMA = None


@rpc("schema.all")
def schema_all():
    global _SCHEMA
    if _SCHEMA is None:
        _SCHEMA = {
            "lattice": [_keyword(k) for k in schema.LATTICE_KEYWORDS.values()],
            "beam": [_keyword(k) for k in schema.BEAM_KEYWORDS.values()],
            "input": [_keyword(k) for k in schema.INPUT_KEYWORDS.values()],
            "elementCategories": list(schema.ELEMENT_CATEGORIES),
            "ini": [{"section": s, "key": k, "meaning": list(v[0])} for (s, k), v in schema.INI_KEYS.items()],
            "separticle": [{"label": list(label), "unit": unit} for label, unit in schema.SEPARTICLE_COLUMNS],
            "tracewinParams": {k: [list(p) for p in v] for k, v in schema.TRACEWIN_PARAMS.items()},
            "tracewinWords": sorted(filekinds.TRACEWIN_WORDS),
            "extMeaning": {k: list(v) for k, v in EXT_MEANING.items()},
        }
    return _SCHEMA


# --------------------------------------------------------------------------- documents
def fieldmap_bases(dirs):
    res = {}
    for d in dirs:
        try:
            names = os.listdir(d)
        except OSError:
            continue
        for n in names:
            base, ext = os.path.splitext(n)
            ext = ext.lstrip(".").lower()
            if ext in EXT_MEANING:
                res.setdefault(base, set()).add(ext)
    return {k: sorted(v) for k, v in sorted(res.items(), key=lambda kv: kv[0].lower())}


def document_json(doc):
    index = {id(st): i for i, st in enumerate(doc.statements)}
    statements = []
    for st in doc.statements:
        item = {
            "line": st.line_no, "raw": st.raw, "indent": st.indent, "keyword": st.keyword, "key": st.key,
            "name": st.name, "prefixName": st.prefix_name, "commentName": st.comment_name,
            "commentNameLine": st.comment_name_line, "params": st.params, "comment": st.comment,
            "active": st.active, "zStart": st.z_start, "zEnd": st.z_end, "length": st.length, "block": st.block,
            "category": st.category, "isElement": st.is_element, "known": st.spec is not None,
            "fieldType": st.field_type(),
            "issues": [{"level": i.level, "text": list(i.text)} for i in st.issues],
        }
        if st.key == "field":
            found, missing = doc.fieldmap_status(st)
            item["fieldmap"] = {"found": sorted(found), "missing": missing}
        statements.append(item)

    def group(g):
        children = []
        for c in g.children:
            if isinstance(c, Group):
                children.append(group(c))
            else:
                children.append({"s": index[id(c)]})
        return {"title": g.title, "kind": g.kind, "line": g.line_no, "children": children}

    return {
        "statements": statements,
        "root": group(doc.root),
        "issues": [{"level": i.level, "text": list(i.text)} for i in doc.issues],
        "totalLength": doc.total_length,
        "elementCount": len(doc.elements()),
        "rfCount": len(doc.rf_cavities()),
        "issueCount": doc.issue_count(),
    }


def _field_dirs(field_dirs=None):
    if field_dirs is not None:
        return field_dirs
    p = context.project()
    return p.field_dirs() if p.is_open else []


@rpc("lattice.parse")
def parse(text, fieldDirs=None):
    dirs = _field_dirs(fieldDirs)
    return document_json(LatticeDocument(text or "", dirs))


@rpc("lattice.fieldmaps")
def fieldmaps(fieldDirs=None):
    return fieldmap_bases(_field_dirs(fieldDirs))


# --------------------------------------------------------------------------- files
@rpc("lattice.list")
def list_lattices():
    p = context.project().require()
    active = p.lattice_name()
    names = filekinds.lattice_files(p.input_dir) if os.path.isdir(p.input_dir) else []
    if active not in names:
        names.insert(0, active)
    return {
        "active": active,
        "activePath": p.lattice_path(),
        "files": [{"name": n, "missing": not os.path.isfile(p.input_file(n))} for n in names],
        "fieldDirs": p.field_dirs(),
        "envOverride": os.environ.get(paths.LATTICE_ENV_VAR, "") or None,
    }


def _path(name):
    p = context.project().require()
    if not name:
        raise UserError("No lattice file selected.")
    return name if os.path.isabs(name) else p.input_file(name)


@rpc("lattice.read")
def read(name):
    path = _path(name)
    return {"name": name, "path": path, "exists": os.path.isfile(path),
            "text": read_text(path) if os.path.isfile(path) else ""}


@rpc("lattice.write")
def write(name, text):
    path = _path(name)
    write_text(path, text)
    log.info("lattice saved: %s", os.path.basename(path))
    return {"path": path}


@rpc("lattice.setSource")
def set_source(name):
    p = context.project().require()
    p.set_lattice_name(name)
    log.info("lattice used for the run: %s", name)
    from avas.gui.services import projects
    projects.notify()
    return list_lattices()


# --------------------------------------------------------------------------- visual editor data
_cache = {}


def _stamp(path):
    try:
        st = os.stat(path)
        return (path, st.st_mtime_ns, st.st_size)
    except OSError:
        return (path, None, None)


def _cached(key, stamp, compute):
    hit = _cache.get(key)
    if hit is not None and hit[0] == stamp:
        return hit[1]
    value = compute()
    _cache[key] = (stamp, value)
    if len(_cache) > 64:
        _cache.pop(next(iter(_cache)))
    return value


def _stride(n, max_points):
    return max(1, int(math.ceil(n / max_points))) if n else 1


def dataset_envelope(output_dir, max_points=3000):
    """Envelope along z from ``DataSet.txt`` (mm, MeV), downsampled; ``None`` without a DataSet."""
    from avas.post.analysis.run_diagnostics import read_dataset_array
    path = os.path.join(output_dir, "DataSet.txt")
    if not os.path.isfile(path):
        return None
    d = read_dataset_array(path)
    if not d.shape[0]:
        return None
    sign = d[:, 35]
    if np.all(sign == 0):
        z = d[:, 5] + d[:, 33]
    else:                                    # bends: the path length accumulates (same rules as DatasetParameter)
        z = np.zeros(len(d))
        keep = np.ones(len(d), dtype=bool)
        s1 = s2 = 0
        last = 0.0
        for i in range(len(d)):
            step = math.hypot(d[i, 37], d[i, 38])
            if sign[i] == 0:
                s2 = 0
                last = d[i, 5] + d[i, 33] if s1 == 0 else last + d[i, 38]
            elif sign[i] == 1:
                last, s1, s2 = last + step, 1, 0
            elif s2 == 0:
                last, s2 = last + step, 1
            else:
                keep[i] = False
                continue
            z[i] = last
        d, z = d[keep], z[keep]
    alive = d[:, 28]
    lost_idx = np.flatnonzero(np.diff(alive) < 0) + 1
    losses = [{"z": float(z[i]), "n": float(alive[i - 1] - alive[i])} for i in lost_idx[:2000]]
    sl = slice(None, None, _stride(len(d), max_points))

    def mm(col):
        return d[sl, col] * 1e3

    return {
        "z": z[sl], "rmsX": mm(16), "rmsY": mm(18), "maxX": mm(22), "maxY": mm(24),
        "cx": (d[sl, 1] + d[sl, 29]) * 1e3, "cy": (d[sl, 3] + d[sl, 31]) * 1e3, "energy": d[sl, 0],
        "alive": alive[sl], "losses": losses, "particles": float(alive[0]), "rows": int(len(d)),
    }


@rpc("lattice.runEnvelope")
def run_envelope():
    """Beam envelope of the last run, for the schematic overlay (arrays travel as blobs)."""
    p = context.project().require()
    path = p.output_file("DataSet.txt")
    env = _cached(("env", p.output_dir), _stamp(path), lambda: dataset_envelope(p.output_dir))
    if env is None:
        return None
    run = p.last_run()
    out = {k: (bridge.blob(v, "float32") if isinstance(v, np.ndarray) else v) for k, v in env.items()}
    out.update(started=run.get("started"), finished=run.get("finished"), lattice=run.get("lattice"),
               status=run.get("status"), mtime=_stamp(path)[1])
    return out


def _gradient(fm, component, order=None):
    """Transverse gradient on the axis along z: dBy/dx for a y component, dBx/dy for an x component."""
    cube = fm._cube(order)
    xs = np.linspace(fm.x_range[0], fm.x_range[1], fm.nx + 1)
    ys = np.linspace(fm.y_range[0], fm.y_range[1], fm.ny + 1)
    grid = xs if component == "y" else ys
    if grid.size < 3 or grid[-1] == grid[0]:
        return None
    c = min(max(int(np.argmin(np.abs(grid))), 1), grid.size - 2)
    ix, iy = int(np.argmin(np.abs(xs))), int(np.argmin(np.abs(ys)))
    h = grid[c + 1] - grid[c - 1]
    if component == "y":
        g = (cube[:, iy, c + 1] - cube[:, iy, c - 1]) / h
    else:
        g = (cube[:, c + 1, ix] - cube[:, c - 1, ix]) / h
    return g * fm.norm


@rpc("lattice.fieldProfile")
def field_profile(name, fieldDirs=None, points=400):
    """On-axis field and transverse gradient profiles of a field map (per component file)."""
    from avas.data.fieldmap import FieldMap, components, group_order
    comps = components(_field_dirs(fieldDirs), name)
    if not comps:
        raise UserError(f"Field map '{name}' not found.")

    def compute():
        out = {}
        maps = {}
        for ext, path in sorted(comps.items()):
            try:
                maps[ext] = FieldMap(path).read()
            except (OSError, ValueError) as exc:
                out[ext] = {"error": str(exc)}
        order = group_order(maps.values())
        for ext, fm in maps.items():
            try:
                z, axis, peak = fm.profiles(order)
            except (OSError, ValueError) as exc:
                out[ext] = {"error": str(exc)}
                continue
            k = _stride(len(z), int(points))
            item = {"z": z[::k].tolist(), "axis": axis[::k].tolist(), "peak": peak[::k].tolist(),
                    "length": fm.length, "nz": fm.nz, "xRange": list(fm.x_range), "yRange": list(fm.y_range)}
            if ext[2] in "xy":
                g = _gradient(fm, "y" if ext[2] == "y" else "x", order)
                if g is not None:
                    item["gradient"] = g[::k].tolist()
            out[ext] = item
        return out
    stamp = tuple(_stamp(p) for _e, p in sorted(comps.items()))
    return {"name": name, "components": _cached(("field", name, int(points)), stamp, compute)}


def _beam_for_preview(p):
    from avas.sim import linear_optics
    path = p.input_file("beam.txt")
    return _cached(("beam", p.input_dir), _stamp(path), lambda: linear_optics.read_beam(p.input_dir))


@rpc("lattice.preview")
def preview(text, fieldDirs=None, spaceCharge=None, maxPoints=2500):
    """Linear envelope preview of *text* (the editor's current lattice, not the file on disk)."""
    p = context.project().require()
    try:
        from avas.sim import linear_optics
    except ImportError as exc:
        raise UserError(f"The linear preview is not available: {exc}") from exc
    try:
        beam = _beam_for_preview(p)
        res = linear_optics.linear_preview(text or "", beam, _field_dirs(fieldDirs), space_charge=spaceCharge,
                                           max_points=int(maxPoints))
    except linear_optics.PreviewError as exc:
        raise UserError(str(exc)) from exc
    out = {}
    for k, v in res.items():
        if isinstance(v, np.ndarray):
            out[k] = bridge.blob(v, "float32")
        elif k == "warnings":
            out[k] = [list(w) for w in v]
        else:
            out[k] = v
    return out
