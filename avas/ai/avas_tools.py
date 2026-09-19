"""The AVAS-specific tools of the AI assistant.

Read tools inspect the open project (lattice, beam, settings, results, log,
user manual).  Write tools never touch a file directly: they build a
*proposal* (old → new values plus the new file text), validate it with the
same checks as the editors, and hand it to the host, which asks the user
(unless auto-apply is on), backs the file up and applies it — into the open
lattice editor when there is one, so the change is one undo step there.

Simulations: :func:`run_simulation` starts the normal project run (the GUI
saves open pages first).  Scans and optimisations run in a sandbox copy
(:mod:`avas.ai.sandbox`) or with the linear envelope preview, so they never
overwrite the project's results; the best values come back as a proposal.

The host object (see :class:`avas.gui.services.assistant.Host`) provides
``project()``, ``front(method, params, timeout)``, ``lattice_text()``,
``approve(ctx, proposal)``, ``apply(ctx, proposal)``, ``log_lines(n, problems)``
and ``auto_apply``.
"""
import ast
import math
import operator
import os
import re
import time
import uuid

import numpy as np

from avas.ai.agent import Tool, ToolError
from avas.data import schema
from avas.data.lattice_doc import ERROR, LatticeDocument, format_statement

ELEMENT_KEYS = {"drift", "field", "quad", "solenoid", "bend", "steerer", "edge", "diag_energy", "diag_size", "diag_position"}
MAX_ROWS = 80


# =========================================================================== helpers
def _num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def _g(v, digits=6):
    f = _num(v)
    return None if f is None else float(f"{f:.{digits}g}")


def _fmt_value(v):
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
        raise ToolError("Address an element with line (1-based), name or index.")
    if spec.get("line") not in (None, ""):
        line = int(spec["line"]) - 1
        st = doc.by_line.get(line)
        if st is None:
            raise ToolError(f"No statement on line {line + 1} (comment or blank line?).")
        return st
    if spec.get("name"):
        name = str(spec["name"]).strip().lower()
        hits = [s for s in doc.statements if s.name.lower() == name]
        if not hits:
            hits = [s for s in doc.statements if s.key == "field" and s.param(8).lower() == name]
            if len(hits) > 1:
                raise ToolError(f"'{spec['name']}' is a field map used by {len(hits)} elements (lines "
                                f"{', '.join(str(s.line_no + 1) for s in hits[:12])}); address one by line.")
        if not hits:
            raise ToolError(f"No element named '{spec['name']}'. Use list_elements to find it.")
        return hits[0]
    if spec.get("index") not in (None, ""):
        idx = int(spec["index"])
        for line, n in element_numbers(doc).items():
            if n == idx:
                return doc.by_line[line]
        raise ToolError(f"No element number {idx}.")
    raise ToolError("Address an element with line (1-based), name or index.")


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
            raise ToolError(f"'{key}' is not a parameter of {st.keyword}. Parameters: {', '.join(names)} "
                            "(or p1, p2 … by position).")
    if k < 0 or (spec and k >= max(len(spec.params), len(st.params))):
        raise ToolError(f"Parameter position {k + 1} is out of range for {st.keyword}.")
    if spec and k < len(spec.params) and spec.params[k].kind == schema.RESERVED:
        raise ToolError(f"Parameter {k + 1} of {st.keyword} is reserved (always 0).")
    return k


def check_value(st, k, value):
    spec = st.spec
    p = spec.params[k] if spec and k < len(spec.params) else None
    text = _fmt_value(value)
    if not text:
        raise ToolError("Empty value.")
    if p is None:
        return text
    if p.kind == schema.FLOAT and _num(text) is None:
        raise ToolError(f"{p.key} of {st.keyword} must be a number, got '{text}'.")
    if p.kind in (schema.INT, schema.FLAG):
        f = _num(text)
        if f is None or not float(f).is_integer():
            raise ToolError(f"{p.key} of {st.keyword} must be an integer, got '{text}'.")
        text = str(int(f))
    if p.kind == schema.ENUM:
        v = p.choice_value(text)
        if v is None:
            raise ToolError(f"{p.key} of {st.keyword} must be one of {[c for c, _ in p.choices]}, got '{text}'.")
        text = str(v)
    if p.key in ("L", "R") and _num(text) is not None and _num(text) < 0:
        raise ToolError(f"{p.key} must not be negative.")
    return text


def param_info(st, k):
    spec = st.spec
    p = spec.params[k] if spec and k < len(spec.params) else None
    return {"param": p.key if p else f"p{k + 1}", "label": p.label[0] if p else f"parameter {k + 1}",
            "unit": p.unit if p else ""}


def element_summary(st):
    """Compact one-line description (units included) for listings."""
    p = st.param
    key = st.key
    if key == "drift":
        s = f"L={p(0)} R={p(1)}"
    elif key == "quad":
        s = f"L={p(0)} R={p(1)} G={p(3)}T/m"
    elif key == "solenoid":
        s = f"L={p(0)} R={p(1)} B={p(3)}T"
    elif key == "bend":
        s = f"alpha={p(3)}deg rho={p(4)}m N={p(5)} HV={p(6)}"
    elif key == "steerer":
        s = f"Bx={p(3)} By={p(4)} kind={p(5)}"
    elif key == "edge":
        s = f"beta={p(3)}deg rho={p(4)} gap={p(5)} HV={p(8)}"
    elif key == "field":
        ft = st.field_type()
        kind = {"1": "RF", "2": "static E", "3": "static B"}.get(ft, f"type {p(3)}")
        s = f"{kind} map={p(8)} L={p(0)} R={p(1)}"
        if ft == "1":
            s += f" f={_g(_num(p(4)) or 0) / 1e6 if _num(p(4)) else p(4)}MHz phase={p(5)}deg V3={p(2)} Ke={p(6)} Kb={p(7)}"
        elif ft == "2":
            s += f" Ke={p(6)}"
        else:
            s += f" Kb={p(7)}"
    else:
        s = " ".join(st.params)
    return s


def _issues(st):
    return [i.text[0] for i in st.issues]


def _error_set(doc):
    return {(st.raw.strip(), i.text[0]) for st in doc.statements for i in st.issues if i.level == ERROR} | \
        {("", i.text[0]) for i in doc.issues if i.level == ERROR}


def validate_new_text(old_doc, new_text, field_dirs):
    new_doc = LatticeDocument(new_text, field_dirs)
    new_errors = sorted(_error_set(new_doc) - _error_set(old_doc))
    if new_errors:
        raise ToolError("The change would introduce lattice errors: " +
                        "; ".join(f"{msg} ({line})" if line else msg for line, msg in new_errors[:8]))
    return new_doc


def replace_lines(text, replacements):
    lines = text.splitlines()
    for line_no, new in replacements.items():
        lines[line_no] = new
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


def _selected_statements(doc, select):
    sel = select or {}
    kws = sel.get("keyword")
    kws = {k.lower() for k in ([kws] if isinstance(kws, str) else kws or [])}
    ftype = str(sel.get("field_type") or "").strip()
    fmap = str(sel.get("fieldmap") or "").strip().lower()
    name_re = sel.get("name_regex")
    zmin = _num(sel.get("z_min"))
    zmax = _num(sel.get("z_max"))
    lines = {int(v) - 1 for v in sel.get("lines") or []}
    out = []
    for st in doc.statements:
        if not st.is_element:
            continue
        if sel.get("active_only", True) and not st.active:
            continue
        if kws and st.key not in kws:
            continue
        if ftype and (st.key != "field" or st.field_type() != ftype):
            continue
        if fmap and (st.key != "field" or fmap not in st.param(8).lower()):
            continue
        if name_re:
            try:
                if not re.search(name_re, st.name or "", re.IGNORECASE):
                    continue
            except re.error as exc:
                raise ToolError(f"Bad name_regex: {exc}") from exc
        if zmin is not None and (st.z_start is None or st.z_start < zmin):
            continue
        if zmax is not None and (st.z_end is None or st.z_end > zmax):
            continue
        if lines and st.line_no not in lines:
            continue
        out.append(st)
    return out


class SafeExpression:
    """Arithmetic over metric names: + - * / ** abs min max sqrt log exp; nothing else."""

    OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv,
           ast.Pow: operator.pow, ast.USub: operator.neg, ast.UAdd: operator.pos}
    FUNCS = {"abs": abs, "min": min, "max": max, "sqrt": math.sqrt, "log": math.log, "exp": math.exp}

    def __init__(self, text):
        self.text = text
        try:
            self.tree = ast.parse(text, mode="eval")
        except SyntaxError as exc:
            raise ToolError(f"Bad objective expression: {exc}") from exc
        self.names = {n.id for n in ast.walk(self.tree) if isinstance(n, ast.Name)} - set(self.FUNCS)

    def __call__(self, values):
        def ev(node):
            if isinstance(node, ast.Expression):
                return ev(node.body)
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                return float(node.value)
            if isinstance(node, ast.Name):
                v = values.get(node.id)
                if v is None:
                    raise ValueError(f"metric '{node.id}' is not available")
                return float(v)
            if isinstance(node, ast.BinOp) and type(node.op) in self.OPS:
                return self.OPS[type(node.op)](ev(node.left), ev(node.right))
            if isinstance(node, ast.UnaryOp) and type(node.op) in self.OPS:
                return self.OPS[type(node.op)](ev(node.operand))
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in self.FUNCS:
                return float(self.FUNCS[node.func.id](*[ev(a) for a in node.args]))
            raise ValueError("only arithmetic on metric names is allowed")
        return ev(self.tree)


def preview_metrics(res):
    """Figures of merit from a linear preview result (same names as the engine metrics where possible)."""
    z = np.asarray(res["z"], dtype=float)
    out = {}
    for key, name in (("rms_x", "rms_x"), ("rms_y", "rms_y")):
        v = np.asarray(res[key], dtype=float)
        ok = np.isfinite(v)
        if ok.any():
            i = int(np.nanargmax(np.where(ok, v, -np.inf)))
            out[f"{name}_max"] = float(v[i])
            out[f"{name}_max_z"] = float(z[i])
            out[f"{name}_out"] = float(v[ok][-1])
    e = np.asarray(res.get("energy", []), dtype=float)
    if e.size and np.isfinite(e).any():
        out["energy_out"] = float(e[np.isfinite(e)][-1])
    if "rms_x_out" in out and "rms_y_out" in out:
        out["rms_mismatch_out"] = abs(out["rms_x_out"] - out["rms_y_out"])
    out["warnings"] = len(res.get("warnings") or [])
    return out


# =========================================================================== tool factory
def build_tools(host):
    from avas.gui.textio import read_text
    from avas.post.analysis import run_diagnostics as rd

    def project():
        return host.project()

    def lattice():
        name, path, text, source = host.lattice_text()
        doc = LatticeDocument(text, project().field_dirs())
        return name, path, text, source, doc

    # ------------------------------------------------------------------ read tools
    def project_overview(args, ctx):
        from avas.gui.services import projects
        p = project()
        name, _path, _text, source, doc = lattice()
        run = projects.run_summary(p)
        diag = run.pop("diagnostics", None)
        return {
            "project": p.path, "lattice_file": name, "lattice_source": source,
            "lattice": {"elements": len(doc.elements()), "total_length_m": _g(doc.total_length),
                        "rf_cavities": len(doc.rf_cavities()), "problems": doc.issue_count()},
            "beam": projects.beam_summary(p), "settings": projects.settings_summary(p),
            "last_run": {k: run.get(k) for k in ("status", "started", "finished", "elapsed_s", "mode", "error", "hint")
                         if run.get(k) is not None},
            "last_run_messages": [m["text"][0] for m in (diag or {}).get("messages", [])],
            "ui": host.front("ui.state", {}, timeout=2) or {},
        }

    def list_elements(args, ctx):
        _name, _path, _text, _source, doc = lattice()
        numbers = element_numbers(doc)
        rows = []
        stmts = _selected_statements(doc, {**(args.get("filter") or {}), "active_only": not args.get("include_inactive")})
        if args.get("include_commands"):
            stmts = sorted(set(stmts) | {s for s in doc.statements if not s.is_element}, key=lambda s: s.line_no)
        start = int(args.get("offset") or 0)
        count = min(int(args.get("limit") or 60), MAX_ROWS)
        for st in stmts[start:start + count]:
            z = f" z={_g(st.z_start, 7)}..{_g(st.z_end, 7)}" if st.active and st.z_start is not None else ""
            num = f"#{numbers[st.line_no]} " if st.line_no in numbers else ""
            blk = " [superpose]" if st.block is not None else ""
            name = f" name={st.name}" if st.name else ""
            iss = f" ISSUES: {'; '.join(_issues(st))}" if st.issues else ""
            rows.append(f"line {st.line_no + 1}: {num}{st.keyword}{name}{blk}{z} {element_summary(st)}{iss}")
        return {"total": len(stmts), "offset": start, "shown": len(rows), "rows": rows,
                "hint": "use offset/limit to page; filter by keyword, field_type (1 RF, 2 static E, 3 static B), "
                        "fieldmap, name_regex, z_min, z_max"}

    def get_element(args, ctx):
        _name, _path, _text, _source, doc = lattice()
        st = resolve(doc, args)
        spec = st.spec
        params = []
        for k, value in enumerate(st.params):
            p = spec.params[k] if spec and k < len(spec.params) else None
            item = {"position": k + 1, "param": p.key if p else f"p{k + 1}", "value": value}
            if p:
                item.update(label=p.label[0], unit=p.unit, kind=p.kind)
                if p.doc[0]:
                    item["meaning"] = p.doc[0]
                if p.choices:
                    item["choices"] = {c: t[0] for c, t in p.choices}
            params.append(item)
        out = {"line": st.line_no + 1, "keyword": st.keyword, "name": st.name, "title": spec.title[0] if spec else None,
               "doc": spec.doc[0] if spec else None, "active": st.active, "raw": st.raw.strip(),
               "z_start_m": _g(st.z_start, 8), "z_end_m": _g(st.z_end, 8), "length_m": _g(st.length, 8),
               "in_superpose_block": st.block is not None, "params": params, "issues": _issues(st)}
        if st.key == "field":
            found, missing = doc.fieldmap_status(st)
            out["fieldmap"] = {"name": st.param(8), "files_found": sorted(found), "missing": missing}
            try:
                from avas.gui.services.lattice import field_profile
                prof = field_profile(st.param(8))["components"]
                out["fieldmap"]["profiles"] = {
                    ext: {"peak_on_axis": _g(max(abs(v) for v in c["axis"])) if c.get("axis") else None,
                          "peak_transverse_gradient": _g(max(abs(v) for v in c["gradient"])) if c.get("gradient") else None,
                          "map_length_m": c.get("length")}
                    for ext, c in prof.items() if not c.get("error")}
                out["fieldmap"]["note"] = ("field = map value × Ke (electric) or × Kb (magnetic); for quadrupole maps the "
                                           "effective gradient is Kb × peak_transverse_gradient (T/m).")
            except Exception:  # noqa: BLE001 - profile is optional detail
                pass
        if st.block is not None:
            idx = [s for s in doc.statements if s.block == st.block]
            prev = None
            for s in idx:
                if s is st:
                    break
                prev = s
            if prev is not None and prev.key == "superpose":
                out["superpose_z0_m"] = prev.param(0)
        return out

    def keyword_help(args, ctx):
        key = str(args.get("keyword") or "").strip().lower()
        hits = []
        for group, table in (("lattice", schema.LATTICE_KEYWORDS), ("beam.txt", schema.BEAM_KEYWORDS),
                             ("input.txt", schema.INPUT_KEYWORDS)):
            k = table.get(key)
            if k:
                hits.append({"file": group, "keyword": k.key, "title": k.title[0], "title_zh": k.title[1], "doc": k.doc[0],
                             "params": [{"position": i + 1, "param": p.key, "label": p.label[0], "unit": p.unit,
                                         "kind": p.kind, "meaning": p.doc[0],
                                         **({"choices": {c: t[0] for c, t in p.choices}} if p.choices else {})}
                                        for i, p in enumerate(k.params)]})
        if not hits:
            near = [k for t in (schema.LATTICE_KEYWORDS, schema.BEAM_KEYWORDS, schema.INPUT_KEYWORDS) for k in t
                    if key and (key in k or k in key)]
            raise ToolError(f"Unknown keyword '{key}'." + (f" Similar: {', '.join(sorted(set(near))[:12])}" if near else ""))
        return hits

    def search_manual(args, ctx):
        from avas.ai.manual import search
        return search(str(args.get("query") or ""), int(args.get("max_results") or 4))

    def get_beam(args, ctx):
        return _keyword_file(project().input_file("beam.txt"), schema.BEAM_KEYWORDS)

    def get_settings(args, ctx):
        import configparser
        p = project()
        out = {"input.txt": _keyword_file(p.input_file("input.txt"), schema.INPUT_KEYWORDS)}
        ini = p.input_file("ini.ini")
        if os.path.isfile(ini):
            cfg = configparser.ConfigParser()
            cfg.optionxform = str
            cfg.read(ini, encoding="utf-8")
            out["ini.ini"] = {f"{s}.{k}": {"value": v, "meaning": schema.INI_KEYS.get((s, k), (("", ""),))[0][0]}
                              for s in cfg.sections() for k, v in cfg.items(s)}
        return out

    def _keyword_file(path, table):
        if not os.path.isfile(path):
            raise ToolError(f"{os.path.basename(path)} does not exist.")
        rows = []
        for i, line in enumerate(read_text(path).splitlines()):
            code, _sep, comment = line.partition("!")
            parts = code.split()
            if not parts:
                continue
            spec = table.get(parts[0].lower())
            item = {"line": i + 1, "keyword": parts[0], "values": parts[1:]}
            if spec:
                item["meaning"] = spec.title[0]
                item["params"] = [f"{p.key}{f' ({p.unit})' if p.unit else ''}" for p in spec.params]
            else:
                item["meaning"] = "not in the manual"
            if comment.strip():
                item["comment"] = comment.strip()
            rows.append(item)
        return {"file": os.path.basename(path), "keywords": rows}

    def results_summary(args, ctx):
        from avas.gui.services import projects
        p = project()
        out_dir = args.get("output_dir") or p.output_dir
        run = projects.run_summary(p) if out_dir == p.output_dir else {}
        diag = run.pop("diagnostics", None) if run else rd.dataset_diagnostics(out_dir)
        metrics = rd.dataset_metrics(out_dir)
        if metrics is None and not run:
            raise ToolError("No results: DataSet.txt not found. Run the simulation first.")
        return {"run": run, "metrics": {k: (_g(v) if isinstance(v, float) else v) for k, v in (metrics or {}).items()},
                "metric_meanings": {k: v[0] for k, v in rd.METRICS.items()},
                "messages": [m["text"][0] for m in (diag or {}).get("messages", [])]}

    COLUMNS = {"energy": (0, 1.0), "rms_x": (16, 1e3), "rms_y": (18, 1e3), "rms_z": (20, 1e3), "max_x": (22, 1e3),
               "max_y": (24, 1e3), "emit_x": (13, 1e6), "emit_y": (14, 1e6), "emit_z": (15, 1e6), "alpha_x": (7, 1.0),
               "alpha_y": (8, 1.0), "beta_x": (10, 1.0), "beta_y": (11, 1.0), "particles": (28, 1.0)}

    def result_series(args, ctx):
        p = project()
        out_dir = args.get("output_dir") or p.output_dir
        path = os.path.join(out_dir, "DataSet.txt")
        if not os.path.isfile(path):
            raise ToolError("No results: DataSet.txt not found.")
        d = rd.read_dataset_array(path)
        z = d[:, 5] + d[:, 33]
        qs = args.get("quantities") or ["rms_x", "rms_y", "energy"]
        cols = {}
        for q in qs:
            if q in COLUMNS:
                c, f = COLUMNS[q]
                cols[q] = d[:, c] * f
            elif q == "cx":
                cols[q] = (d[:, 1] + d[:, 29]) * 1e3
            elif q == "cy":
                cols[q] = (d[:, 3] + d[:, 31]) * 1e3
            else:
                raise ToolError(f"Unknown quantity '{q}'. Available: {', '.join(list(COLUMNS) + ['cx', 'cy'])}")
        zmin = _num(args.get("z_min"))
        zmax = _num(args.get("z_max"))
        mask = np.ones(len(z), dtype=bool)
        if zmin is not None:
            mask &= z >= zmin
        if zmax is not None:
            mask &= z <= zmax
        idx = np.flatnonzero(mask)
        n = max(2, min(int(args.get("points") or 40), 200))
        if idx.size > n:
            idx = idx[np.linspace(0, idx.size - 1, n).round().astype(int)]
        units = {"energy": "MeV", "rms_x": "mm", "rms_y": "mm", "rms_z": "mm", "max_x": "mm", "max_y": "mm",
                 "emit_x": "pi.mm.mrad (normalized rms)", "emit_y": "pi.mm.mrad (normalized rms)", "emit_z": "x1e6",
                 "cx": "mm", "cy": "mm", "particles": "macro-particles"}
        table = [[_g(z[i], 6)] + [_g(cols[q][i], 5) for q in qs] for i in idx]
        if args.get("show_chart", True) and ctx is not None:
            ctx.emit({"kind": "chart", "title": ", ".join(qs), "x": [r[0] for r in table],
                      "series": [{"name": q, "y": [r[j + 1] for r in table]} for j, q in enumerate(qs)],
                      "xlabel": "z (m)"})
        return {"columns": ["z_m"] + qs, "units": {q: units.get(q, "") for q in qs}, "rows": table}

    def read_log(args, ctx):
        return host.log_lines(int(args.get("lines") or 40), bool(args.get("problems_only")))

    def read_input_file(args, ctx):
        p = project()
        name = os.path.basename(str(args.get("name") or ""))
        path = p.input_file(name)
        if not name or not os.path.isfile(path):
            raw = str(args.get("name") or "")
            if re.search(r"[\\/]|OutputFile|Segments|DataSet", raw):
                raise ToolError("read_input_file only reads files inside InputFile (lattice, beam.txt, input.txt, ini.ini), "
                                "never results. For results use results_summary / result_series (project OutputFile) "
                                "or segment_results (runs in Segments/).")
            raise ToolError(f"No file '{name}' in InputFile. Files there: {', '.join(sorted(os.listdir(p.input_dir))) or 'none'}.")
        if os.path.getsize(path) > 4_000_000:
            raise ToolError("File too large to read as text.")
        if name == p.lattice_name():
            _n, _p, text, _source, _doc = lattice()
        else:
            text = read_text(path)
        lines = text.splitlines()
        start = max(1, int(args.get("start_line") or 1))
        count = max(1, min(int(args.get("count") or 120), 400))
        chunk = lines[start - 1:start - 1 + count]
        return {"file": name, "total_lines": len(lines), "start_line": start,
                "text": "\n".join(f"{start + i:>5}| {ln}" for i, ln in enumerate(chunk))}

    def _segment_run(p, source):
        """Meta of the segment run named by *source*: folder (relative, absolute or its name), label or 'latest'."""
        from avas.gui.services import segments
        runs = segments.list_segments(p)
        if not runs:
            raise ToolError("No segment runs yet (the Segments folder is empty). Use run_segment first.")
        s = str(source or "").strip()
        if s.lower() in ("latest", "last", "newest"):
            return runs[0]

        def norm(x):
            return os.path.normcase(os.path.normpath(str(x)))
        parts = set(norm(s).split(os.sep))
        for m in runs:
            folder = m["folder"]
            if norm(s) in (norm(folder), norm(os.path.relpath(folder, p.path))) or norm(os.path.basename(folder)) in parts:
                return m
        for m in runs:                                                  # label: the newest run with that label
            if (m.get("label") or "").lower() == s.lower():
                return m
        names = ", ".join(os.path.basename(m["folder"]) for m in runs[:10])
        raise ToolError(f"No segment run '{s}'. Available (newest first): {names}. Use segment_results without source to list them.")

    def _segment_run_info(p, m):
        seg = m.get("segment") or {}
        return {"label": m.get("label"), "folder": os.path.relpath(m["folder"], p.path), "status": m.get("status"),
                "created": m.get("created"), "finished": m.get("finished"), "lattice": m.get("lattice"),
                "elements": seg.get("elements"), "first": seg.get("first"), "last": seg.get("last"),
                "z_start": seg.get("z_start"), "z_end": seg.get("z_end"), "length": seg.get("length"),
                "entry_beam": (m.get("entry") or {}).get("choice"), "rephased_cavities": len(m.get("rephased") or []),
                "elapsed_s": sum(float(st.get("elapsed_s") or 0) for st in (m.get("stages") or [])) or None,
                "error": m.get("message")}

    def segment_results(args, ctx):
        from avas.gui.services import segments
        p = project()
        source = args.get("source")
        if source in (None, ""):
            runs = [_segment_run_info(p, m) for m in segments.list_segments(p)]
            return {"segment_runs": runs,
                    "hint": ("Call again with source = folder (or label, or 'latest') for the figures of merit; "
                             "add quantities for values along z.") if runs else "No segment runs yet; use run_segment."}
        m = _segment_run(p, source)
        info = _segment_run_info(p, m)
        if m.get("status") != "finished":
            return {"source": info, "status": m.get("status"), "error": m.get("message"),
                    "note": "This run is not finished; its results cannot be read yet." if m.get("status") in ("running", "pending")
                    else "This run did not finish, see read_log."}
        out = os.path.join(m["folder"], "OutputFile")
        summary = results_summary({"output_dir": out}, ctx)
        result = {"source": info, "metrics": summary["metrics"], "metric_meanings": summary["metric_meanings"],
                  "messages": summary["messages"]}
        if args.get("quantities"):
            result["series"] = result_series({"output_dir": out, "quantities": args["quantities"], "z_min": args.get("z_min"),
                                              "z_max": args.get("z_max"), "points": args.get("points"),
                                              "show_chart": args.get("show_chart", True)}, ctx)
        result["note"] = (f"z in these results starts at 0 at the segment entry (z = {info['z_start']} m of the full lattice); "
                          "the project's OutputFile is a different run.")
        if info["entry_beam"] == "twiss":
            result["note"] += " The entry beam was generated from Twiss parameters, so the result is approximate."
        return result

    # ------------------------------------------------------------------ preview
    def _preview(text):
        from avas.gui.services.lattice import _beam_for_preview
        from avas.sim import linear_optics
        p = project()
        try:
            return linear_optics.linear_preview(text, _beam_for_preview(p), p.field_dirs())
        except linear_optics.PreviewError as exc:
            raise ToolError(str(exc)) from exc

    def _apply_param_changes(doc, text, changes):
        """(new_text, change rows) for [{line|name|index, param, value}]."""
        repl = {}
        rows = []
        pending = {}
        for ch in changes or []:
            st = resolve(doc, ch)
            k = param_index(st, ch.get("param"))
            value = check_value(st, k, ch.get("value"))
            params = pending.setdefault(st.line_no, list(st.params))
            while len(params) <= k:
                params.append("0")
            old = params[k]
            params[k] = value
            info = param_info(st, k)
            rows.append({"line": st.line_no + 1, "element": st.name or (st.param(8) if st.key == "field" else st.keyword),
                         "keyword": st.keyword, **info, "old": old, "new": value})
        for line_no, params in pending.items():
            repl[line_no] = format_statement(doc.by_line[line_no], params=params)
        return replace_lines(text, repl), rows

    def preview_envelope(args, ctx):
        _name, _path, text, _source, doc = lattice()
        if args.get("changes"):
            text, rows = _apply_param_changes(doc, text, args["changes"])
        else:
            rows = []
        res = _preview(text)
        m = preview_metrics(res)
        z = np.asarray(res["z"], dtype=float)
        n = max(2, min(int(args.get("points") or 20), 100))
        idx = np.linspace(0, len(z) - 1, n).round().astype(int) if len(z) else []
        table = [[_g(z[i], 5), _g(res["rms_x"][i], 4), _g(res["rms_y"][i], 4), _g(res["energy"][i], 6)] for i in idx]
        if ctx is not None and args.get("show_chart", True):
            ctx.emit({"kind": "chart", "title": "linear preview", "x": [r[0] for r in table],
                      "series": [{"name": "rms_x (mm)", "y": [r[1] for r in table]}, {"name": "rms_y (mm)", "y": [r[2] for r in table]}],
                      "xlabel": "z (m)"})
        return {"note": "linear envelope preview: approximate (linear optics, simplified RF and space charge)",
                "hypothetical_changes": rows, "metrics": {k: _g(v) for k, v in m.items()},
                "warnings": [w[0] for w in res.get("warnings") or []],
                "columns": ["z_m", "rms_x_mm", "rms_y_mm", "energy_MeV"], "rows": table}

    # ------------------------------------------------------------------ write tools
    def _propose_lattice(ctx, doc, name, path, text, new_text, rows, reason, diff=None):
        if new_text == text:
            raise ToolError("Nothing would change.")
        validate_new_text(doc, new_text, project().field_dirs())
        if diff is None:
            old_lines = text.splitlines()
            new_lines = new_text.splitlines()
            diff = [{"line": r["line"], "old": old_lines[r["line"] - 1].strip(), "new": new_lines[r["line"] - 1].strip()}
                    for r in {r["line"]: r for r in rows}.values()] if len(old_lines) == len(new_lines) else []
        proposal = {"kind": "lattice", "file": name, "path": path, "reason": reason or "", "changes": rows,
                    "diff": diff[:200], "old_text": text, "new_text": new_text}
        return host.propose(ctx, proposal)

    def edit_lattice(args, ctx):
        name, path, text, _source, doc = lattice()
        changes = args.get("changes") or []
        if not changes:
            raise ToolError("No changes given.")
        new_text, rows = _apply_param_changes(doc, text, changes)
        return _propose_lattice(ctx, doc, name, path, text, new_text, rows, args.get("reason"))

    def edit_lattice_bulk(args, ctx):
        name, path, text, _source, doc = lattice()
        stmts = _selected_statements(doc, args.get("select") or {})
        if not stmts:
            raise ToolError("The selection matches no element.")
        op = (args.get("operation") or "set").lower()
        value = args.get("value")
        changes = []
        for st in stmts:
            try:
                k = param_index(st, args.get("param"))
            except ToolError:
                continue
            old = _num(st.param(k))
            if op == "set":
                new = value
            elif op in ("multiply", "scale"):
                if old is None or _num(value) is None:
                    raise ToolError(f"line {st.line_no + 1}: cannot multiply '{st.param(k)}'.")
                new = old * float(value)
            elif op == "add":
                if old is None or _num(value) is None:
                    raise ToolError(f"line {st.line_no + 1}: cannot add to '{st.param(k)}'.")
                new = old + float(value)
            else:
                raise ToolError("operation must be set, multiply or add.")
            changes.append({"line": st.line_no + 1, "param": args.get("param"), "value": new})
        if not changes:
            raise ToolError(f"None of the selected elements has a parameter '{args.get('param')}'.")
        new_text, rows = _apply_param_changes(doc, text, changes)
        return _propose_lattice(ctx, doc, name, path, text, new_text, rows, args.get("reason"))

    def edit_lattice_lines(args, ctx):
        name, path, text, _source, doc = lattice()
        ops = args.get("operations") or []
        if not ops:
            raise ToolError("No operations given.")
        lines = text.splitlines()
        n = len(lines)
        edits = []                                   # (start, end, new_lines) on original line numbers
        for op in ops:
            kind = (op.get("op") or "").lower()
            line = int(op.get("line") or 0)
            if not 1 <= line <= n:
                raise ToolError(f"Line {line} is outside 1 … {n}.")
            new = [ln for ln in str(op.get("text") or "").split("\n")] if op.get("text") is not None else []
            if kind == "replace":
                edits.append((line - 1, line, new))
            elif kind == "insert_after":
                edits.append((line, line, new))
            elif kind == "insert_before":
                edits.append((line - 1, line - 1, new))
            elif kind == "delete":
                edits.append((line - 1, line, []))
            else:
                raise ToolError("op must be replace, insert_after, insert_before or delete.")
        edits.sort(key=lambda e: (e[0], e[1]))
        for a, b in zip(edits, edits[1:]):
            if b[0] < a[1]:
                raise ToolError("Operations overlap; combine them.")
        out = []
        cursor = 0
        diff = []
        for start, end, new in edits:
            out.extend(lines[cursor:start])
            out.extend(new)
            diff.append({"line": start + 1, "old": "\n".join(lines[start:end]), "new": "\n".join(new)})
            cursor = end
        out.extend(lines[cursor:])
        new_text = "\n".join(out) + ("\n" if text.endswith("\n") else "")
        return _propose_lattice(ctx, doc, name, path, text, new_text, [], args.get("reason"), diff=diff)

    def _edit_keyword_file(ctx, filename, table, values, reason, page):
        p = project()
        path = p.input_file(filename)
        dirty = host.front("pages.dirty", {}, timeout=2) or []
        if page in dirty:
            raise ToolError(f"The {page} page has unsaved changes. Ask the user to save or discard them first.")
        text = read_text(path) if os.path.isfile(path) else ""
        lines = text.splitlines()
        rows = []
        for key, value in (values or {}).items():
            spec = table.get(str(key).lower())
            if spec is None:
                raise ToolError(f"'{key}' is not a {filename} keyword (see keyword_help).")
            if value is None or value == "":
                new_values = None
            else:
                parts = value if isinstance(value, (list, tuple)) else str(value).split()
                new_values = [_fmt_value(v) for v in parts]
                if len(new_values) < spec.min_params:
                    raise ToolError(f"{spec.key} needs {spec.min_params} values ({', '.join(q.key for q in spec.params)}).")
                for i, v in enumerate(new_values[:len(spec.params)]):
                    q = spec.params[i]
                    if q.kind == schema.FLOAT and _num(v) is None:
                        raise ToolError(f"{spec.key} {q.key}: '{v}' is not a number.")
                    if q.kind in (schema.INT, schema.FLAG) and (_num(v) is None or not float(_num(v)).is_integer()):
                        raise ToolError(f"{spec.key} {q.key}: '{v}' is not an integer.")
                    if q.kind == schema.ENUM and q.choice_value(v) is None:
                        raise ToolError(f"{spec.key} {q.key}: '{v}' must be one of {[c for c, _ in q.choices]}.")
            found = None
            for i, line in enumerate(lines):
                code, _sep, _c = line.partition("!")
                parts = code.split()
                if parts and parts[0].lower() == spec.key:
                    found = i
                    break
            old = None
            if found is not None:
                code, sep, comment = lines[found].partition("!")
                old = " ".join(code.split()[1:])
                word = code.split()[0]
                if new_values is None:
                    lines[found] = None
                else:
                    lines[found] = f"{word} {' '.join(new_values)}" + (f" !{comment}" if sep else "")
            elif new_values is not None:
                lines.append(f"{spec.key} {' '.join(new_values)}")
            rows.append({"keyword": spec.key, "label": spec.title[0], "old": old, "new": None if new_values is None else " ".join(new_values)})
        new_text = "\n".join(ln for ln in lines if ln is not None) + "\n"
        if new_text.strip() == text.strip():
            raise ToolError("Nothing would change.")
        proposal = {"kind": "file", "file": filename, "path": path, "page": page, "reason": reason or "",
                    "changes": rows, "old_text": text, "new_text": new_text}
        return host.propose(ctx, proposal)

    def edit_beam(args, ctx):
        return _edit_keyword_file(ctx, "beam.txt", schema.BEAM_KEYWORDS, args.get("values"), args.get("reason"), "beam")

    def edit_input(args, ctx):
        return _edit_keyword_file(ctx, "input.txt", schema.INPUT_KEYWORDS, args.get("values"), args.get("reason"), "settings")

    def set_error_study(args, ctx):
        import configparser
        p = project()
        path = p.input_file("ini.ini")
        dirty = host.front("pages.dirty", {}, timeout=2) or []
        if "settings" in dirty:
            raise ToolError("The settings page has unsaved changes. Ask the user to save or discard them first.")
        text = read_text(path) if os.path.isfile(path) else ""
        cfg = configparser.ConfigParser()
        cfg.optionxform = str
        cfg.read_string(text)
        if not cfg.has_section("error"):
            cfg.add_section("error")
        mode = str(args.get("error_type") or "").strip()
        if mode not in ("", "stat", "dyn", "stat_dyn"):
            raise ToolError("error_type must be '', stat, dyn or stat_dyn.")
        rows = [{"keyword": "error.error_type", "old": cfg.get("error", "error_type", fallback=""), "new": mode}]
        cfg.set("error", "error_type", mode)
        if args.get("seed") is not None:
            rows.append({"keyword": "error.seed", "old": cfg.get("error", "seed", fallback=""), "new": str(int(args["seed"]))})
            cfg.set("error", "seed", str(int(args["seed"])))
        import io
        buf = io.StringIO()
        cfg.write(buf)
        proposal = {"kind": "file", "file": "ini.ini", "path": path, "page": "settings", "reason": args.get("reason") or "",
                    "changes": rows, "old_text": text, "new_text": buf.getvalue()}
        return host.propose(ctx, proposal)

    def set_run_lattice(args, ctx):
        from avas.data import filekinds
        p = project()
        name = os.path.basename(str(args.get("name") or ""))
        if name not in filekinds.lattice_files(p.input_dir):
            raise ToolError(f"'{name}' is not an AVAS lattice file in InputFile.")
        proposal = {"kind": "lattice_source", "file": "ini.ini", "reason": args.get("reason") or "",
                    "changes": [{"keyword": "lattice.source", "old": p.lattice_name(), "new": name}], "name": name}
        return host.propose(ctx, proposal)

    # ------------------------------------------------------------------ simulations
    WAIT_CAP_S = 12 * 3600

    def _wait_for_run(ctx, job, label):
        """Wait until the runner *job* is over.  Paused time does not count.  Returns False (never an
        error) when the job is still running after WAIT_CAP_S of active time; the caller then reports
        where the results will be so the model can read them later."""
        from avas.gui.services import runner
        r = runner.runner()
        last = None
        active = 0.0
        previous = time.time()
        while r.job is not None and (job is None or r.job is job):
            now = time.time()
            state = r.state()
            if not state.get("paused"):
                active += now - previous
            previous = now
            if ctx.stop_event.is_set():
                r.stop()
                raise ToolError("Stopped by the user; the simulation was stopped.")
            key = (int(state.get("percent") or 0), state.get("stage"), bool(state.get("paused")))
            if key != last:
                last = key
                stage = f" {state.get('stage')}/{state.get('stages')} {state.get('stageLabel') or ''}".rstrip() \
                    if (state.get("stages") or 1) > 1 else ""
                ctx.emit({"kind": "progress", "percent": key[0], "eta_s": state.get("eta_s"),
                          "label": f"{label}{stage}{' (paused)' if key[2] else ''}"})
            if active > WAIT_CAP_S:
                return False
            time.sleep(0.5)
        return True

    def run_simulation(args, ctx):
        from avas.gui.services import runner
        p = project()
        est = (p.last_run() or {}).get("elapsed_s")
        proposal = {"kind": "run", "reason": args.get("reason") or "", "estimate_s": est,
                    "changes": [{"keyword": "run", "old": None, "new": p.lattice_name()}]}
        decision = host.propose(ctx, proposal)
        if not decision.get("applied"):
            return decision
        if not _wait_for_run(ctx, runner.runner().job, "simulation"):
            return {"status": "running", "still_running": True,
                    "note": "The simulation is still running after a very long wait, so the assistant stopped waiting. "
                            "It keeps running; when the user says it has finished, call results_summary."}
        run = p.last_run()
        if run.get("status") != "finished":
            return {"status": run.get("status"), "error": run.get("error"),
                    "messages": [m["text"][0] for m in (run.get("diagnostics") or {}).get("messages", [])]}
        return {"status": "finished", "elapsed_s": run.get("elapsed_s"), **results_summary({}, None)}

    def _metric_value(metrics, objective):
        if objective.get("expression"):
            return SafeExpression(objective["expression"])(metrics)
        key = objective.get("metric")
        v = metrics.get(key)
        if v is None:
            raise ValueError(f"metric '{key}' not available")
        return float(v)

    def _objective_spec(args):
        obj = args.get("objective") or {}
        if isinstance(obj, str):
            obj = {"expression": obj}
        goal = (obj.get("goal") or "min").lower()
        if goal not in ("min", "max"):
            raise ToolError("objective.goal must be min or max.")
        if not obj.get("expression") and not obj.get("metric"):
            raise ToolError("Give objective.metric (e.g. emit_x_growth) or objective.expression.")
        if obj.get("expression"):
            SafeExpression(obj["expression"])
        return {**obj, "goal": goal}

    def _evaluator(ctx, engine, label, total=None):
        """f(text) -> metrics dict, running the preview or a sandbox simulation.

        A sandbox study is reported on the Run page until ``box.cleanup()``.
        """
        if engine == "preview":
            def ev(text, k):
                return preview_metrics(_preview(text))
            return ev, None
        from avas.ai.sandbox import Sandbox, SandboxError
        box = Sandbox(project(), f"{label}_{time.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}")
        try:
            box.begin("parameter scan" if label == "scan" else "optimisation", total, ctx.stop_event)
        except SandboxError as exc:
            box.cleanup()
            raise ToolError(str(exc)) from exc

        def ev(text, k):
            def progress(pct):
                ctx.emit({"kind": "progress", "percent": pct, "label": f"run {k}", "run": k})
            try:
                out, seconds = box.run(lattice_text=text, stop_event=ctx.stop_event, progress=progress)
            except SandboxError as exc:
                if str(exc) == "stopped":
                    raise ToolError("Stopped by the user.") from exc
                return {"error": str(exc)}
            m = rd.dataset_metrics(out) or {"error": "no DataSet.txt"}
            m["seconds"] = round(seconds, 1)
            m["output_dir"] = out
            return m
        return ev, box

    def scan_parameter(args, ctx):
        name, path, text, _source, doc = lattice()
        st = resolve(doc, args.get("target") or args)
        k = param_index(st, args.get("param"))
        values = args.get("values")
        if not values and args.get("start") is not None:
            n = max(2, min(int(args.get("steps") or 5), 50))
            values = list(np.linspace(float(args["start"]), float(args["stop"]), n))
        if not values:
            raise ToolError("Give values or start/stop/steps.")
        engine = (args.get("engine") or "simulation").lower()
        if engine not in ("simulation", "preview"):
            raise ToolError("engine must be simulation or preview.")
        info = param_info(st, k)
        if engine == "simulation":
            est = (project().last_run() or {}).get("elapsed_s")
            decision = host.propose(ctx, {"kind": "scan", "reason": args.get("reason") or "", "runs": len(values), "estimate_s": est,
                                          "changes": [{"line": st.line_no + 1, "element": st.name or st.keyword, **info,
                                                       "old": st.param(k), "new": f"{len(values)} values: {', '.join(_fmt_value(v) for v in values[:8])}{' …' if len(values) > 8 else ''}"}]})
            if not decision.get("applied"):
                return decision
        ev, box = _evaluator(ctx, engine, "scan", len(values))
        rows = []
        try:
            for i, v in enumerate(values, 1):
                if ctx.stop_event.is_set():
                    break
                val = check_value(st, k, v)
                params = list(st.params)
                while len(params) <= k:
                    params.append("0")
                params[k] = val
                candidate = replace_lines(text, {st.line_no: format_statement(st, params=params)})
                ctx.emit({"kind": "step", "index": i, "total": len(values), "value": val})
                m = ev(candidate, i)
                row = {"value": _num(val) if _num(val) is not None else val}
                wanted = args.get("metrics") or ["transmission", "energy_out", "emit_x_growth", "emit_y_growth", "rms_x_max", "rms_y_max"] \
                    if engine == "simulation" else ["rms_x_max", "rms_y_max", "rms_x_out", "rms_y_out", "energy_out"]
                for key in wanted:
                    row[key] = _g(m.get(key)) if isinstance(m.get(key), (int, float)) else m.get(key)
                if m.get("error"):
                    row["error"] = m["error"]
                rows.append(row)
                ctx.emit({"kind": "table", "rows": rows, "param": f"{st.name or st.keyword} {info['param']}"})
        finally:
            if box is not None:
                box.cleanup()
        if ctx is not None and rows and not any("error" in r for r in rows):
            first_metric = next((key for key in rows[0] if key not in ("value", "error")), None)
            if first_metric and all(isinstance(r.get("value"), (int, float)) for r in rows):
                ctx.emit({"kind": "chart", "title": f"scan {st.name or st.keyword} {info['param']}", "x": [r["value"] for r in rows],
                          "series": [{"name": key, "y": [r.get(key) for r in rows]} for key in rows[0] if key not in ("value", "error")],
                          "xlabel": f"{info['param']} {info['unit']}".strip()})
        return {"element": {"line": st.line_no + 1, "name": st.name, "keyword": st.keyword}, **info, "engine": engine,
                "original_value": st.param(k), "rows": rows,
                "note": "The project files were not changed. Use edit_lattice to apply a chosen value."}

    def optimize(args, ctx):
        from scipy.optimize import minimize
        name, path, text, _source, doc = lattice()
        variables = []
        for var in args.get("variables") or []:
            st = resolve(doc, var)
            k = param_index(st, var.get("param"))
            lo, hi = _num(var.get("min")), _num(var.get("max"))
            x0 = _num(var.get("initial")) if var.get("initial") is not None else _num(st.param(k))
            if lo is None or hi is None or hi <= lo:
                raise ToolError(f"line {st.line_no + 1} {var.get('param')}: give min < max.")
            if x0 is None:
                x0 = (lo + hi) / 2
            variables.append({"st": st, "k": k, "lo": lo, "hi": hi, "x0": min(max(x0, lo), hi), **param_info(st, k)})
        if not variables:
            raise ToolError("Give at least one variable {line|name|index, param, min, max}.")
        if len(variables) > 12:
            raise ToolError("At most 12 variables at once.")
        objective = _objective_spec(args)
        engine = (args.get("engine") or "preview").lower()
        if engine not in ("simulation", "preview"):
            raise ToolError("engine must be simulation or preview.")
        max_eval = int(args.get("max_evaluations") or (200 if engine == "preview" else 20))
        max_eval = max(3, min(max_eval, 2000 if engine == "preview" else 200))
        if engine == "simulation":
            est = (project().last_run() or {}).get("elapsed_s")
            decision = host.propose(ctx, {"kind": "optimize", "reason": args.get("reason") or "", "runs": max_eval, "estimate_s": est,
                                          "objective": objective,
                                          "changes": [{"line": v["st"].line_no + 1, "element": v["st"].name or v["st"].keyword,
                                                       "param": v["param"], "label": v["label"], "unit": v["unit"],
                                                       "old": v["st"].param(v["k"]), "new": f"[{_fmt_value(v['lo'])}, {_fmt_value(v['hi'])}]"}
                                                      for v in variables]})
            if not decision.get("applied"):
                return decision
        ev, box = _evaluator(ctx, engine, "opt", max_eval)
        sign = 1.0 if objective["goal"] == "min" else -1.0
        history = []
        best = {"f": math.inf, "x": [v["x0"] for v in variables], "metrics": None}

        def candidate_text(x):
            by_line = {}
            for v, xi in zip(variables, x):
                st = v["st"]
                params = by_line.setdefault(st.line_no, list(st.params))
                while len(params) <= v["k"]:
                    params.append("0")
                params[v["k"]] = check_value(st, v["k"], float(f"{xi:.8g}"))
            return replace_lines(text, {ln: format_statement(doc.by_line[ln], params=ps) for ln, ps in by_line.items()})

        class Stop(Exception):
            pass

        memo = {}

        def f(u):
            x = [v["lo"] + (v["hi"] - v["lo"]) * min(max(ui, 0.0), 1.0) for v, ui in zip(variables, u)]
            key = tuple(float(f"{xi:.8g}") for xi in x)
            if key in memo:                      # simplex methods revisit points; simulations are expensive
                return memo[key]
            if ctx.stop_event.is_set() or len(history) >= max_eval:
                raise Stop()
            memo[key] = score = _evaluate(x)
            return score

        def _evaluate(x):
            k = len(history) + 1
            m = ev(candidate_text(x), k)
            try:
                val = _metric_value(m, objective) if not m.get("error") else math.inf
            except (ValueError, ZeroDivisionError, OverflowError):
                val = math.inf
            if not math.isfinite(val):
                val = math.inf
            score = sign * val if math.isfinite(val) else 1e30
            history.append({"eval": k, "x": [_g(xi) for xi in x], "objective": _g(val) if math.isfinite(val) else None,
                            **({"error": m["error"]} if m.get("error") else {})})
            if score < best["f"]:
                best.update(f=score, x=x, metrics=m, value=val)
                ctx.emit({"kind": "best", "eval": k, "objective": _g(val), "x": [_g(xi) for xi in x],
                          "names": [f"{v['st'].name or v['st'].keyword}.{v['param']}" for v in variables]})
            ctx.emit({"kind": "step", "index": k, "total": max_eval, "objective": _g(val) if math.isfinite(val) else None})
            return score

        u0 = [(v["x0"] - v["lo"]) / (v["hi"] - v["lo"]) for v in variables]
        method = (args.get("method") or "nelder-mead").lower()
        baseline = None
        try:
            baseline = f(u0)
            if method == "random":
                rng = np.random.default_rng(int(args.get("seed") or 0))
                while len(history) < max_eval:
                    f(rng.random(len(variables)))
            else:
                scipy_method = {"nelder-mead": "Nelder-Mead", "powell": "Powell"}.get(method)
                if scipy_method is None:
                    raise ToolError("method must be nelder-mead, powell or random.")
                opts = {"maxfev": max_eval, "xatol": 1e-4, "fatol": 1e-9} if scipy_method == "Nelder-Mead" else {"maxfev": max_eval, "xtol": 1e-4}
                if scipy_method == "Nelder-Mead" and len(variables) > 0:
                    step = 0.15
                    sim = [u0] + [[min(max(u0[j] + (step if i == j else 0.0), 0.0), 1.0) for j in range(len(u0))] for i in range(len(u0))]
                    opts["initial_simplex"] = sim
                minimize(f, u0, method=scipy_method, bounds=[(0.0, 1.0)] * len(variables), options=opts)
        except Stop:
            pass
        finally:
            if box is not None:
                keep = [best["metrics"]["output_dir"]] if best.get("metrics") and best["metrics"].get("output_dir") else []
                box.cleanup(keep)
        base_val = sign * baseline if baseline is not None and baseline < 1e29 else None
        result = {
            "engine": engine, "objective": objective, "evaluations": len(history),
            "baseline_objective": _g(base_val) if base_val is not None else None,
            "best_objective": _g(best.get("value")) if best.get("value") is not None else None,
            "best_values": [{"line": v["st"].line_no + 1, "element": v["st"].name or v["st"].keyword, "param": v["param"],
                             "unit": v["unit"], "old": v["st"].param(v["k"]), "best": _g(x, 7)}
                            for v, x in zip(variables, best["x"])],
            "best_metrics": {k: (_g(v) if isinstance(v, float) else v) for k, v in (best.get("metrics") or {}).items()
                             if k not in ("output_dir",)},
            "history_tail": history[-15:],
            "note": "Project files were not changed yet.",
        }
        if engine == "preview":
            result["note"] += " The objective used the approximate linear preview; confirm with run_simulation after applying."
        if best.get("metrics") and args.get("propose_best", True) and best.get("value") is not None and \
                (base_val is None or sign * best["value"] < sign * base_val):
            changes = [{"line": v["st"].line_no + 1, "param": v["param"], "value": float(f"{x:.7g}")}
                       for v, x in zip(variables, best["x"])]
            new_text, rows = _apply_param_changes(doc, text, changes)
            try:
                result["apply"] = _propose_lattice(ctx, doc, name, path, text, new_text, rows,
                                                   f"optimum found by optimize ({objective.get('expression') or objective.get('metric')} "
                                                   f"{objective['goal']}: {_g(base_val)} → {_g(best['value'])})")
            except ToolError as exc:
                result["apply"] = {"applied": False, "error": str(exc)}
        return result

    def run_segment(args, ctx):
        from avas.data import segment as seg
        from avas.gui.services import runner, segments
        from avas.gui.bridge import UserError
        from avas.post.analysis import run_diagnostics as rdiag
        p = project()
        _name, _path, _text, _source, doc = lattice()
        spec = {}
        if args.get("section"):
            spec["section"] = str(args["section"])
        if args.get("from") not in (None, "", {}):
            spec["start_line"] = resolve(doc, args["from"]).line_no
        if args.get("to") not in (None, "", {}):
            spec["end_line"] = resolve(doc, args["to"]).line_no
        for key in ("z_min", "z_max"):
            if _num(args.get(key)) is not None:
                spec[key] = _num(args[key])
        if not spec:
            raise ToolError("Say which part to simulate: section, from/to elements or z_min/z_max. "
                            f"Sections and headings in this lattice: {', '.join(seg.section_names(doc)) or 'none'}.")
        try:
            plan, card = segments.describe(p, doc, spec, args.get("label"))
        except UserError as exc:
            raise ToolError(str(exc)) from exc
        options = card["options"]
        wanted = args.get("entry_beam")
        proposal = {"kind": "segment", "reason": args.get("reason") or "", "label": plan.label, "spec": spec,
                    **card, "choice": wanted if any(o["id"] == wanted and o["available"] for o in options) else None}
        est = next((o.get("estimate_s") for o in options if o["id"] == (proposal["choice"] or card["default"])), None)
        proposal["estimate_s"] = est
        decision = host.propose(ctx, proposal)
        if not decision.get("applied"):
            return decision
        job = runner.runner().job
        finished = _wait_for_run(ctx, job, f"segment {plan.label}")
        root = getattr(job, "root", None) if job is not None else None
        folder = os.path.relpath(root, p.path) if root else None
        if not finished:
            return {"status": "running", "still_running": True, "folder": folder, "segment": card["segment"],
                    "note": "The segment run is still running after a very long wait, so the assistant stopped waiting. "
                            "It keeps running; when the user says it has finished, call segment_results with source = folder."}
        meta = {}
        if root and os.path.isfile(os.path.join(root, segments.META_FILE)):
            import json
            with open(os.path.join(root, segments.META_FILE), encoding="utf-8") as fh:
                meta = json.load(fh)
        result = {"status": meta.get("status") or ("finished" if job is not None and job.ok else "unknown"),
                  "folder": folder, "segment": card["segment"],
                  "entry_beam": meta.get("entry", {}).get("choice", decision.get("choice")),
                  "stages": meta.get("stages"), "rephased_cavities": len(meta.get("rephased") or [])}
        if meta.get("status") != "finished":
            result["error"] = meta.get("message") or (job.message if job else None)
            return result
        out = os.path.join(root, "OutputFile")
        metrics = rdiag.dataset_metrics(out) or {}
        result["metrics"] = {k: (_g(v) if isinstance(v, float) else v) for k, v in metrics.items()}
        diag = rdiag.dataset_diagnostics(out) or {}
        result["messages"] = [m["text"][0] for m in diag.get("messages", [])]
        result["note"] = (f"z in these results starts at 0 at the segment entry (z = {card['segment']['z_start']} m of the full lattice). "
                          "The project's OutputFile was not changed; the Results page shows this run under its source selector. "
                          "Values along z and this summary can be read again with segment_results(source=folder).")
        if meta.get("entry", {}).get("choice") == "twiss":
            result["note"] += " The entry beam was generated from Twiss parameters, so the result is approximate."
        return result

    def show_element(args, ctx):
        _name, _path, _text, _source, doc = lattice()
        st = resolve(doc, args)
        host.front("ui.select", {"line": st.line_no}, timeout=3)
        return {"shown": True, "line": st.line_no + 1, "name": st.name, "keyword": st.keyword}

    # ------------------------------------------------------------------ declarations
    TARGET = {"line": {"type": "integer", "description": "1-based line number in the lattice file"},
              "name": {"type": "string", "description": "element name (or field map name if unique)"},
              "index": {"type": "integer", "description": "element number as numbered by the editor (0, 1, 2 …)"}}
    CHANGE = {"type": "object", "properties": {**TARGET,
                                               "param": {"type": "string", "description": "parameter key, e.g. L, R, G, B, phase, Ke, Kb, alpha, or p4 for the 4th"},
                                               "value": {"type": ["number", "string"]}},
              "required": ["param", "value"]}
    SELECT = {"type": "object", "description": "element filter; all given conditions must hold",
              "properties": {"keyword": {"type": ["string", "array"], "items": {"type": "string"}},
                             "field_type": {"type": "string", "enum": ["1", "2", "3"], "description": "1 RF, 2 static E, 3 static B"},
                             "fieldmap": {"type": "string", "description": "substring of the field map name"},
                             "name_regex": {"type": "string"}, "z_min": {"type": "number"}, "z_max": {"type": "number"},
                             "lines": {"type": "array", "items": {"type": "integer"}}}}
    REASON = {"type": "string", "description": "one sentence shown to the user explaining the change"}

    def T(name, description, props, handler, required=(), long_running=False):
        return Tool(name, description, {"type": "object", "properties": props, "required": list(required)}, handler,
                    long_running)

    return [
        T("project_overview", "Summary of the open project: lattice file and statistics, beam, simulation settings, last run status and messages, what the user is looking at.", {}, project_overview),
        T("list_elements", "List lattice elements (compact rows with line number, element number, name, z range and key parameters). Page with offset/limit.",
          {"filter": SELECT, "offset": {"type": "integer"}, "limit": {"type": "integer", "description": "max 80"},
           "include_inactive": {"type": "boolean"}, "include_commands": {"type": "boolean"}}, list_elements),
        T("get_element", "All parameters of one lattice statement with meanings and units, position, issues, field-map information.", TARGET, get_element),
        T("keyword_help", "Meaning and parameters of a keyword of the lattice, beam.txt or input.txt (from the user manual).",
          {"keyword": {"type": "string"}}, keyword_help, required=["keyword"]),
        T("search_manual", "Search the AVAS user manual (Chinese) for a topic; returns matching sections.",
          {"query": {"type": "string"}, "max_results": {"type": "integer"}}, search_manual, required=["query"]),
        T("get_beam", "Keywords and values of beam.txt (initial beam).", {}, get_beam),
        T("get_settings", "Keywords of input.txt (tracking options) and ini.ini (GUI/run options).", {}, get_settings),
        T("results_summary", "Figures of merit of the last full run (project OutputFile): transmission, energy, emittances in/out and growth, largest sizes and where, loss locations, warnings. Segment runs: use segment_results.",
          {}, results_summary),
        T("result_series", "Beam quantities along z from the last full run (project OutputFile; downsampled table, also shown as a chart). Quantities: energy, rms_x, rms_y, rms_z, max_x, max_y, emit_x, emit_y, emit_z, alpha_x, alpha_y, beta_x, beta_y, particles, cx, cy. Segment runs: use segment_results.",
          {"quantities": {"type": "array", "items": {"type": "string"}}, "z_min": {"type": "number"}, "z_max": {"type": "number"},
           "points": {"type": "integer", "description": "rows, max 200"}}, result_series),
        T("segment_results", "Results of segment runs (folders Segments/<label>_<time>, made by run_segment). Without source: list the runs (label, folder, status, z range, entry beam). With source (the folder, its name, the label or 'latest'): figures of merit like results_summary; with quantities also the values along z like result_series (same quantity names; z starts at 0 at the segment entry).",
          {"source": {"type": "string"}, "quantities": {"type": "array", "items": {"type": "string"}},
           "z_min": {"type": "number"}, "z_max": {"type": "number"}, "points": {"type": "integer", "description": "rows, max 200"}},
          segment_results),
        T("read_log", "Recent lines of the application log (engine output, errors).",
          {"lines": {"type": "integer"}, "problems_only": {"type": "boolean"}}, read_log),
        T("read_input_file", "Read part of a text file in InputFile with line numbers (the lattice as currently edited).",
          {"name": {"type": "string"}, "start_line": {"type": "integer"}, "count": {"type": "integer"}}, read_input_file, required=["name"]),
        T("preview_envelope", "Fast approximate linear envelope (rms x/y along z, energy) of the current lattice, optionally with hypothetical parameter changes that are NOT written. Seconds instead of minutes; use it for what-if checks.",
          {"changes": {"type": "array", "items": CHANGE}, "points": {"type": "integer"}}, preview_envelope),
        T("edit_lattice", "Change parameters of lattice elements (one proposal for all changes; the user approves it). Values in the units of the manual.",
          {"changes": {"type": "array", "items": CHANGE}, "reason": REASON}, edit_lattice, required=["changes"]),
        T("edit_lattice_bulk", "Change one parameter of every element matching a filter: set, multiply or add (e.g. scale all quadrupole gradients by 1.05).",
          {"select": SELECT, "param": {"type": "string"}, "operation": {"type": "string", "enum": ["set", "multiply", "add"]},
           "value": {"type": ["number", "string"]}, "reason": REASON}, edit_lattice_bulk, required=["select", "param", "operation", "value"]),
        T("edit_lattice_lines", "Structural lattice edits by line: replace, insert_after, insert_before or delete lines (text may contain several lines). Respect superpose rules.",
          {"operations": {"type": "array", "items": {"type": "object", "properties": {
              "op": {"type": "string", "enum": ["replace", "insert_after", "insert_before", "delete"]},
              "line": {"type": "integer"}, "text": {"type": "string"}}, "required": ["op", "line"]}}, "reason": REASON},
          edit_lattice_lines, required=["operations"]),
        T("edit_beam", "Change beam.txt keywords, e.g. {\"current\": 5, \"twissx\": \"-0.1 0.2 0.15\"}; empty string removes a keyword.",
          {"values": {"type": "object"}, "reason": REASON}, edit_beam, required=["values"]),
        T("edit_input", "Change input.txt keywords (tracking options), e.g. {\"spacecharge\": 0, \"steppercycle\": 200}.",
          {"values": {"type": "object"}, "reason": REASON}, edit_input, required=["values"]),
        T("set_error_study", "Choose the run mode stored in ini.ini: error_type '' (normal run), stat, dyn or stat_dyn, and the seed.",
          {"error_type": {"type": "string", "enum": ["", "stat", "dyn", "stat_dyn"]}, "seed": {"type": "integer"}, "reason": REASON},
          set_error_study, required=["error_type"]),
        T("set_run_lattice", "Choose which lattice file in InputFile is used for the run.",
          {"name": {"type": "string"}, "reason": REASON}, set_run_lattice, required=["name"]),
        T("run_simulation", "Run the full multi-particle simulation of the project (saves open pages first, overwrites OutputFile). Waits until it has finished (however long it takes) and returns the results summary.",
          {"reason": REASON}, run_simulation, long_running=True),
        T("scan_parameter", "Scan one element parameter over values and report metrics per value. engine 'simulation' runs the engine in a sandbox copy (does not touch project files or results), 'preview' uses the fast linear preview.",
          {"target": {"type": "object", "properties": TARGET}, "param": {"type": "string"},
           "values": {"type": "array", "items": {"type": "number"}}, "start": {"type": "number"}, "stop": {"type": "number"},
           "steps": {"type": "integer"}, "engine": {"type": "string", "enum": ["simulation", "preview"]},
           "metrics": {"type": "array", "items": {"type": "string"}}, "reason": REASON},
          scan_parameter, required=["target", "param"], long_running=True),
        T("optimize", "Optimise element parameters within bounds to minimise or maximise an objective. Metrics (simulation): transmission, energy_out, emit_x_out, emit_y_out, emit_z_out, emit_x_growth, emit_y_growth, emit_z_growth, rms_x_max, rms_y_max, rms_x_out, rms_y_out, max_x_max, max_y_max, centroid_x_max, centroid_y_max, lost. Metrics (preview): rms_x_max, rms_y_max, rms_x_out, rms_y_out, energy_out, rms_mismatch_out. The objective may be an expression such as 'emit_x_growth + emit_y_growth' or 'abs(rms_x_out-1.5)+abs(rms_y_out-1.5)'. The best values are proposed as an edit at the end.",
          {"variables": {"type": "array", "items": {"type": "object", "properties": {**TARGET, "param": {"type": "string"},
                                                                                     "min": {"type": "number"}, "max": {"type": "number"},
                                                                                     "initial": {"type": "number"}},
                                                     "required": ["param", "min", "max"]}},
           "objective": {"type": "object", "properties": {"metric": {"type": "string"}, "expression": {"type": "string"},
                                                          "goal": {"type": "string", "enum": ["min", "max"]}}},
           "engine": {"type": "string", "enum": ["preview", "simulation"]},
           "max_evaluations": {"type": "integer"}, "method": {"type": "string", "enum": ["nelder-mead", "powell", "random"]},
           "propose_best": {"type": "boolean"}, "reason": REASON},
          optimize, required=["variables", "objective"], long_running=True),
        T("run_segment", "Simulate only one part of the lattice (e.g. the MEBT / medium-energy section) with the multi-particle engine, in its own folder Segments/<label>_<time> (project files and OutputFile are not changed). Give the part as a section/heading title, or from/to elements (first and last element), or z_min/z_max. The user approves the range and chooses the entry beam on a card: beam.txt when the part starts at the beginning; otherwise the particle file of the last full run at the entry, the exit beam of an earlier segment run that ends at the entry (e.g. CM3 after CM2 was run; fast and as accurate as that run), simulating the upstream elements first, or a beam generated from the Twiss parameters of the last run (approximate). RF phases are re-referenced automatically. Waits until it has finished (however long it takes) and returns the figures of merit; later, read them again with segment_results.",
          {"section": {"type": "string", "description": "title of a 'section NAME {' group or comment heading"},
           "from": {"type": "object", "properties": TARGET, "description": "first element of the part"},
           "to": {"type": "object", "properties": TARGET, "description": "last element of the part"},
           "z_min": {"type": "number"}, "z_max": {"type": "number"},
           "label": {"type": "string", "description": "short name for the run, e.g. MEBT"},
           "entry_beam": {"type": "string", "enum": ["beam", "dst", "segment", "upstream", "twiss"], "description": "preselected on the card; the user decides"},
           "reason": REASON},
          run_segment, long_running=True),
        T("show_element", "Select an element in the lattice editor so the user sees it.", TARGET, show_element),
    ]
