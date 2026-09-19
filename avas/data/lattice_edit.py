"""Addressing and changing one parameter of a lattice statement, or one value
of a ``beam.txt`` / ``input.txt`` keyword line.

Shared by the AI assistant's tools (:mod:`avas.ai.avas_tools`), parameter
scans (:mod:`avas.sim.scan`) and the command line.  Every function raises
:class:`LatticeEditError` with a message meant for the user.
"""
import math
import re

import numpy as np

from avas.data import schema

ELEMENT_KEYS = {"drift", "field", "quad", "solenoid", "bend", "steerer", "edge", "diag_energy", "diag_size", "diag_position"}


class LatticeEditError(ValueError):
    """The address or value does not fit the lattice (message for the user)."""


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def fmt_value(v):
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, np.integer)):
        return str(int(v))
    if isinstance(v, (float, np.floating)):
        return repr(float(f"{float(v):.10g}"))
    return str(v).strip()


def element_numbers(doc):
    """line_no -> element number as shown by the text editor (0, 1, 2 … over element keywords)."""
    out = {}
    n = 0
    for st in doc.statements:
        if st.key in ELEMENT_KEYS:
            out[st.line_no] = n
            n += 1
    return out


def resolve(doc, spec):
    """The statement addressed by ``{"line": 1-based}``, ``{"name": ..}`` or ``{"index": element number}``."""
    if isinstance(spec, (int, float)):
        spec = {"line": int(spec)}
    elif isinstance(spec, str):
        spec = {"line": int(spec)} if spec.strip().isdigit() else {"name": spec}
    if not isinstance(spec, dict):
        raise LatticeEditError("Address an element with line (1-based), name or index.")
    if spec.get("line") not in (None, ""):
        line = int(spec["line"]) - 1
        st = doc.by_line.get(line)
        if st is None:
            raise LatticeEditError(f"No statement on line {line + 1} (comment or blank line?).")
        return st
    if spec.get("name"):
        name = str(spec["name"]).strip().lower()
        hits = [s for s in doc.statements if s.name.lower() == name]
        if not hits:
            hits = [s for s in doc.statements if s.key == "field" and s.param(8).lower() == name]
            if len(hits) > 1:
                raise LatticeEditError(f"'{spec['name']}' is a field map used by {len(hits)} elements (lines "
                                       f"{', '.join(str(s.line_no + 1) for s in hits[:12])}); address one by line.")
        if not hits:
            raise LatticeEditError(f"No element named '{spec['name']}'. Use list_elements to find it.")
        return hits[0]
    if spec.get("index") not in (None, ""):
        idx = int(spec["index"])
        for line, n in element_numbers(doc).items():
            if n == idx:
                return doc.by_line[line]
        raise LatticeEditError(f"No element number {idx}.")
    raise LatticeEditError("Address an element with line (1-based), name or index.")


def param_index(st, key):
    """Index of parameter *key* ("G", "Kb", "phase", "p4" or 4 for the 4th parameter, 1-based)."""
    spec = st.spec
    if isinstance(key, (int, float)) or (isinstance(key, str) and key.strip().isdigit()):
        k = int(key) - 1
    elif isinstance(key, str) and re.fullmatch(r"[pP]\d+", key.strip()):
        k = int(key.strip()[1:]) - 1
    else:
        want = str(key).strip().lower()
        k = None
        if spec:
            for i, p in enumerate(spec.params):
                if p.key.lower() == want or p.label[0].lower() == want or p.label[0].lower().split(" ")[-1] == want:
                    if p.kind == schema.RESERVED:
                        continue
                    k = i
                    break
        if k is None:
            names = [p.key for p in spec.params if p.kind != schema.RESERVED] if spec else []
            raise LatticeEditError(f"'{key}' is not a parameter of {st.keyword}. Parameters: {', '.join(names)} "
                                   "(or p1, p2 … by position).")
    if k < 0 or (spec and k >= max(len(spec.params), len(st.params))):
        raise LatticeEditError(f"Parameter position {k + 1} is out of range for {st.keyword}.")
    if spec and k < len(spec.params) and spec.params[k].kind == schema.RESERVED:
        raise LatticeEditError(f"Parameter {k + 1} of {st.keyword} is reserved (always 0).")
    return k


def check_value(st, k, value):
    spec = st.spec
    p = spec.params[k] if spec and k < len(spec.params) else None
    text = fmt_value(value)
    if not text:
        raise LatticeEditError("Empty value.")
    if p is None:
        return text
    if p.kind == schema.FLOAT and num(text) is None:
        raise LatticeEditError(f"{p.key} of {st.keyword} must be a number, got '{text}'.")
    if p.kind in (schema.INT, schema.FLAG):
        f = num(text)
        if f is None or not float(f).is_integer():
            raise LatticeEditError(f"{p.key} of {st.keyword} must be an integer, got '{text}'.")
        text = str(int(f))
    if p.kind == schema.ENUM:
        v = p.choice_value(text)
        if v is None:
            raise LatticeEditError(f"{p.key} of {st.keyword} must be one of {[c for c, _ in p.choices]}, got '{text}'.")
        text = str(v)
    if p.key in ("L", "R") and num(text) is not None and num(text) < 0:
        raise LatticeEditError(f"{p.key} must not be negative.")
    return text


def param_info(st, k):
    spec = st.spec
    p = spec.params[k] if spec and k < len(spec.params) else None
    return {"param": p.key if p else f"p{k + 1}", "label": p.label[0] if p else f"parameter {k + 1}",
            "unit": p.unit if p else ""}


def replace_lines(text, replacements):
    lines = text.splitlines()
    for line_no, new in replacements.items():
        lines[line_no] = new
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


def set_param(text, doc, target, param, value):
    """*text* with parameter *param* of the statement *target* set to *value*.

    Returns ``(new_text, statement, k, value_text)``.
    """
    from avas.data.lattice_doc import format_statement
    st = resolve(doc, target)
    k = param_index(st, param)
    val = check_value(st, k, value)
    params = list(st.params)
    while len(params) <= k:
        params.append("0")
    params[k] = val
    return replace_lines(text, {st.line_no: format_statement(st, params=params)}), st, k, val


# --------------------------------------------------------------------------- keyword files
def keyword_line(text, keyword):
    """``(line_no, parts)`` of the first ``keyword v1 v2 …`` line (case-insensitive) or ``(None, None)``."""
    want = keyword.strip().lower()
    for i, line in enumerate(text.splitlines()):
        body = line.split("!", 1)[0].split("//", 1)[0]
        parts = body.split()
        if parts and parts[0].lower() == want:
            return i, parts
    return None, None


def set_keyword_value(text, keyword, value, position=1):
    """*text* (beam.txt / input.txt) with value number *position* (1-based) of *keyword* replaced.

    A missing keyword line is appended; other values and the trailing comment stay.
    """
    val = fmt_value(value)
    if not val:
        raise LatticeEditError("Empty value.")
    if position < 1:
        raise LatticeEditError("position must be 1 or more.")
    lines = text.splitlines()
    line_no, parts = keyword_line(text, keyword)
    if line_no is None:
        lines.append(" ".join([keyword] + ["0"] * (position - 1) + [val]))
        return "\n".join(lines) + "\n"
    line = lines[line_no]
    body, sep, comment = line.partition("!")
    tokens = body.split()
    while len(tokens) <= position:
        tokens.append("0")
    tokens[position] = val
    lines[line_no] = " ".join(tokens) + (" " + sep + comment if sep else "")
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


def keyword_info(file, keyword):
    """Label and unit of a beam.txt / input.txt keyword from the schema (empty strings if unknown)."""
    table = schema.BEAM_KEYWORDS if file == "beam.txt" else schema.INPUT_KEYWORDS
    kw = table.get(keyword.lower())
    if kw is None:
        return {"label": keyword, "unit": ""}
    p = kw.params[0] if kw.params else None
    return {"label": kw.title[0] if kw.title else keyword, "unit": p.unit if p else ""}
