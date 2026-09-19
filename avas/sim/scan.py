"""Parameter scans: run the engine once per value of one parameter and collect
scalar results (:func:`avas.post.analysis.run_diagnostics.dataset_metrics`).

A scan never touches the project's input files or OutputFile: the inputs are
copied into a work folder (:class:`avas.ai.sandbox.Sandbox`) and every value
gets its own ``run_NNN/`` output there.  The GUI (``avas/gui/services/scan.py``)
and the command line (``avas scan``) both call :func:`run_scan`; the assistant
has its own tool with the same mechanics.

A scan is described by a *spec*::

    {"kind": "lattice", "target": <line | name | index>, "param": "G"}
    {"kind": "beam",  "keyword": "particlenumber", "position": 1}
    {"kind": "input", "keyword": "stepsize", "position": 1}

*values* is the list of values to try; *metrics* the keys of
``dataset_metrics`` to report (``None`` = a default set).
"""
import csv
import json
import logging
import os
import re
import time

import numpy as np

from avas.data import lattice_edit as le
from avas.data.lattice_doc import LatticeDocument

log = logging.getLogger(__name__)

DEFAULT_METRICS = ["transmission", "energy_out", "emit_x_growth", "emit_y_growth", "emit_z_growth",
                   "rms_x_max", "rms_y_max", "rms_x_out", "rms_y_out"]
ALL_METRICS = DEFAULT_METRICS + ["lost", "energy_in", "emit_x_in", "emit_y_in", "emit_z_in",
                                 "emit_x_out", "emit_y_out", "emit_z_out", "max_x_max", "max_y_max",
                                 "centroid_x_max", "centroid_y_max", "z_out"]
SCANS_DIR = "Scans"
META_FILE = "scan.json"


class ScanError(ValueError):
    """A scan cannot be set up or was stopped (message for the user)."""


def parse_values(text):
    """``"1, 2, 3"`` or ``"0:10:5"`` (start:stop:count) -> list of floats."""
    text = (text or "").strip()
    if not text:
        raise ScanError("Give the values to scan.")
    if re.fullmatch(r"[^,\s:]+:[^,\s:]+:\d+", text):
        a, b, n = text.split(":")
        n = int(n)
        if n < 2:
            raise ScanError("A range needs at least 2 points.")
        return [float(v) for v in np.linspace(float(a), float(b), n)]
    out = []
    for tok in re.split(r"[,\s]+", text):
        if tok:
            try:
                out.append(float(tok))
            except ValueError as exc:
                raise ScanError(f"Not a number: {tok}") from exc
    return out


def normalise_values(values):
    if isinstance(values, str):
        return parse_values(values)
    out = []
    for v in values or []:
        f = le.num(v)
        if f is None:
            raise ScanError(f"Not a number: {v}")
        out.append(f)
    if not out:
        raise ScanError("Give the values to scan.")
    if len(out) > 500:
        raise ScanError("At most 500 values per scan.")
    return out


class ScanTarget:
    """What a spec addresses, resolved against the project's input files."""

    def __init__(self, spec, texts, field_dirs=(), lattice_name="lattice_mulp.txt"):
        self.spec = dict(spec or {})
        self.kind = (self.spec.get("kind") or "lattice").lower()
        self.texts = texts                      # {file name: text}
        self.lattice_name = lattice_name
        if self.kind == "lattice":
            text = texts.get(lattice_name)
            if text is None:
                raise ScanError(f"The lattice file {lattice_name} does not exist.")
            doc = LatticeDocument(text, list(field_dirs))
            try:
                self.st = le.resolve(doc, self.spec.get("target"))
                self.k = le.param_index(self.st, self.spec.get("param"))
            except LatticeEditError as exc:
                raise ScanError(str(exc)) from exc
            info = le.param_info(self.st, self.k)
            self.file = lattice_name
            self.label = f"{self.st.name or self.st.keyword} (line {self.st.line_no + 1}) {info['param']}"
            self.param = info["param"]
            self.unit = info["unit"]
            self.original = self.st.param(self.k)
            self.doc = doc
        elif self.kind in ("beam", "input"):
            self.file = "beam.txt" if self.kind == "beam" else "input.txt"
            text = texts.get(self.file)
            if text is None:
                raise ScanError(f"{self.file} does not exist.")
            self.keyword = str(self.spec.get("keyword") or "").strip()
            if not self.keyword:
                raise ScanError("Give the keyword to scan.")
            self.position = int(self.spec.get("position") or 1)
            info = le.keyword_info(self.file, self.keyword)
            self.param = self.keyword if self.position == 1 else f"{self.keyword}[{self.position}]"
            self.label = f"{self.file} {self.param}"
            self.unit = info["unit"]
            _line, parts = le.keyword_line(text, self.keyword)
            self.original = parts[self.position] if parts and len(parts) > self.position else None
            self.doc = None
        else:
            raise ScanError(f"Unknown scan kind: {self.kind}")

    def describe(self):
        d = {"kind": self.kind, "file": self.file, "param": self.param, "label": self.label, "unit": self.unit,
             "original": self.original}
        if self.kind == "lattice":
            d.update(line=self.st.line_no + 1, element=self.st.name or self.st.keyword, keyword=self.st.keyword)
        else:
            d.update(keyword=self.keyword, position=self.position)
        return d

    def apply(self, value):
        """``(file name, new text)`` with *value* set."""
        try:
            if self.kind == "lattice":
                new, _st, _k, _val = le.set_param(self.texts[self.file], self.doc, {"line": self.st.line_no + 1},
                                                  self.k + 1, value)
            else:
                new = le.set_keyword_value(self.texts[self.file], self.keyword, value, self.position)
        except LatticeEditError as exc:
            raise ScanError(str(exc)) from exc
        return self.file, new


LatticeEditError = le.LatticeEditError


def read_inputs(input_dir, lattice_name):
    from avas.gui.textio import read_text
    texts = {}
    for name in ("beam.txt", "input.txt", lattice_name):
        path = os.path.join(input_dir, name)
        if os.path.isfile(path):
            texts[name] = read_text(path)
    return texts


def prepare_scan(project, spec, values, metrics=None, label="", root=None, stop_event=None, source="scan"):
    """Resolve the target, create the work folder and reserve the runner; returns a :class:`PreparedScan`.

    Raises :class:`ScanError` when the spec is wrong or another simulation is active.
    """
    from avas.ai.sandbox import Sandbox, SandboxError

    values = normalise_values(values)
    metrics = [m for m in (metrics or DEFAULT_METRICS) if m in ALL_METRICS] or DEFAULT_METRICS
    lattice_name = project.lattice_name()
    target = ScanTarget(spec, read_inputs(project.input_dir, lattice_name), project.field_dirs(), lattice_name)
    label = safe_label(label) or safe_label(target.param)
    root = root or os.path.join(project.path, SCANS_DIR, f"{label}_{time.strftime('%Y%m%d-%H%M%S')}")
    os.makedirs(root, exist_ok=True)
    result = {"label": label, "created": time.strftime("%Y-%m-%d %H:%M:%S"), "status": "running", "folder": root,
              "target": target.describe(), "values": values, "metrics": metrics, "rows": [], "lattice": lattice_name}
    _write(root, result)
    box = Sandbox(project, os.path.basename(root), root=root)
    try:
        box.begin(f"scan {label}", len(values), stop_event, source=source)
    except SandboxError as exc:
        box.cleanup()
        result.update(status="failed", error=str(exc))
        _write(root, result)
        raise ScanError(str(exc)) from exc
    return PreparedScan(box, target, result, stop_event)


class PreparedScan:
    def __init__(self, box, target, result, stop_event):
        self.box = box
        self.target = target
        self.result = result
        self.stop_event = stop_event

    def execute(self, on_progress=None):
        """Run every value; returns the result dict (also written to ``scan.json`` / ``scan.csv``)."""
        from avas.ai.sandbox import SandboxError
        from avas.post.analysis.run_diagnostics import dataset_metrics
        box, target, result, stop_event = self.box, self.target, self.result, self.stop_event
        root = result["folder"]
        try:
            for i, value in enumerate(result["values"], 1):
                if stop_event is not None and stop_event.is_set():
                    result["status"] = "stopped"
                    break
                row = {"index": i, "value": value}
                try:
                    file, text = target.apply(value)
                    out, seconds = box.run(files={file: text}, stop_event=stop_event)
                    m = dataset_metrics(out) or {}
                    if not m:
                        row["error"] = "no DataSet.txt"
                    for key in result["metrics"]:
                        row[key] = m.get(key)
                    row.update(seconds=round(seconds, 1), output_dir=out)
                except SandboxError as exc:
                    if str(exc) == "stopped":
                        result["status"] = "stopped"
                        row["error"] = "stopped"
                        result["rows"].append(row)
                        break
                    row["error"] = str(exc)
                except ScanError as exc:
                    row["error"] = str(exc)
                result["rows"].append(row)
                _write(root, result)
                if on_progress:
                    try:
                        on_progress(dict(result))
                    except Exception:  # noqa: BLE001 - display only
                        log.debug("scan progress callback failed", exc_info=True)
            if result["status"] == "running":
                result["status"] = "finished"
        finally:
            box.end()
            result["finished"] = time.strftime("%Y-%m-%d %H:%M:%S")
            _write(root, result)
            write_csv(root, result)
        return result


def run_scan(project, spec, values, metrics=None, label="", root=None, on_progress=None, stop_event=None,
             source="scan"):
    """Prepare and run a scan in one go (command line, tests); see :func:`prepare_scan`."""
    return prepare_scan(project, spec, values, metrics, label, root, stop_event, source).execute(on_progress)


def safe_label(label):
    return re.sub(r"[^\w\-.]+", "_", str(label or "").strip())[:40].strip("_")


def _write(root, result):
    tmp = os.path.join(root, META_FILE + ".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=1, ensure_ascii=False)
    os.replace(tmp, os.path.join(root, META_FILE))


def write_csv(root, result):
    """``scan.csv``: one line per value, the metrics as columns."""
    cols = ["value"] + list(result.get("metrics") or []) + ["seconds", "error"]
    with open(os.path.join(root, "scan.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(cols)
        for row in result.get("rows", []):
            w.writerow([row.get(c, "") if row.get(c) is not None else "" for c in cols])


def load(folder):
    path = os.path.join(folder, META_FILE)
    with open(path, encoding="utf-8") as fh:
        result = json.load(fh)
    result["folder"] = folder
    return result


def list_scans(project_path):
    root = os.path.join(project_path, SCANS_DIR)
    out = []
    if not os.path.isdir(root):
        return out
    for name in os.listdir(root):
        folder = os.path.join(root, name)
        if os.path.isfile(os.path.join(folder, META_FILE)):
            try:
                out.append(load(folder))
            except (OSError, ValueError):
                continue
    out.sort(key=lambda r: r.get("created") or "", reverse=True)
    return out
