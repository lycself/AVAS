"""Lattice page and structure editor: files, parsing, schema."""
import logging
import os

from avas import paths
from avas.data import filekinds, schema
from avas.data.fieldmap import EXT_MEANING
from avas.data.lattice_doc import Group, LatticeDocument
from avas.webgui import context
from avas.webgui.bridge import UserError, rpc
from avas.webgui.textio import read_text, write_text

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
    from avas.webgui.services import projects
    projects.notify()
    return list_lattices()
