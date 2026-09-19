"""Parameter scans (avas.sim.scan) and the shared lattice-edit helpers (avas.data.lattice_edit)."""
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010")
WORK = os.path.join(ROOT, "tests", "_output_scan")

sys.path.insert(0, ROOT)
os.environ.setdefault("MPLBACKEND", "Agg")
os.environ.setdefault("AVAS_GUI_SETTINGS", os.path.join(WORK, "gui-settings.json"))

from avas.data import lattice_edit as le  # noqa: E402
from avas.data.lattice_doc import LatticeDocument  # noqa: E402
from avas.sim import scan  # noqa: E402

LATTICE = """start
drift 0.1 0.02 0
!name Q1
quad 0.2 0.02 0 12.5 0 0 0
drift 0.3 0.02 0 ! a comment
end
"""


def test_set_param_rewrites_only_that_line():
    doc = LatticeDocument(LATTICE, [])
    new, st, k, val = le.set_param(LATTICE, doc, "Q1", "G", 15)
    assert st.keyword == "quad" and k == 3 and val == "15"
    lines = new.splitlines()
    assert lines[3] == "quad 0.2 0.02 0 15 0 0 0"
    assert lines[4] == "drift 0.3 0.02 0 ! a comment"
    with pytest.raises(le.LatticeEditError):
        le.set_param(LATTICE, doc, "nosuch", "G", 1)
    with pytest.raises(le.LatticeEditError):
        le.set_param(LATTICE, doc, {"line": 4}, "nosuchparam", 1)


def test_set_keyword_value_keeps_comment_and_appends_missing():
    text = "particlenumber 1000 ! macro particles\nkneticenergy 1.5\n"
    out = le.set_keyword_value(text, "ParticleNumber", 5000)
    assert out.splitlines()[0] == "particlenumber 5000 ! macro particles"
    out = le.set_keyword_value(text, "twissx", 2.5, position=2)
    assert out.splitlines()[-1] == "twissx 0 2.5"
    assert le.keyword_line(out, "kneticenergy") == (1, ["kneticenergy", "1.5"])


def test_parse_values():
    assert scan.parse_values("1, 2 3") == [1.0, 2.0, 3.0]
    assert scan.parse_values("0:1:3") == [0.0, 0.5, 1.0]
    with pytest.raises(scan.ScanError):
        scan.parse_values("a,b")
    with pytest.raises(scan.ScanError):
        scan.normalise_values([])


class _Project:
    """The little a scan needs from a project (the CLI builds the same)."""

    def __init__(self, path):
        self.path = path
        self.input_dir = os.path.join(path, "InputFile")

    def field_dirs(self):
        return [self.input_dir]

    def lattice_name(self):
        from avas.paths import lattice_source_name
        return lattice_source_name(self.input_dir)

    def last_run(self):
        return {}


@pytest.fixture(scope="module")
def project():
    shutil.rmtree(WORK, ignore_errors=True)
    shutil.copytree(os.path.join(EXAMPLE, "InputFile"), os.path.join(WORK, "project", "InputFile"))
    os.makedirs(os.path.join(WORK, "project", "OutputFile"))
    return _Project(os.path.join(WORK, "project"))


def test_scan_target_describe(project):
    texts = scan.read_inputs(project.input_dir, project.lattice_name())
    t = scan.ScanTarget({"kind": "beam", "keyword": "particlenumber"}, texts)
    d = t.describe()
    assert d["file"] == "beam.txt" and d["original"] is not None
    file, new = t.apply(1234)
    assert file == "beam.txt" and "particlenumber 1234" in new
    with pytest.raises(scan.ScanError):
        scan.ScanTarget({"kind": "lattice", "target": "nosuch", "param": "G"}, texts, project.field_dirs(),
                        project.lattice_name())


def test_scan_runs_engine_per_value(project):
    """Two short simulations with different macro-particle numbers; nothing in the project changes."""
    before = {n: os.path.getmtime(os.path.join(project.input_dir, n)) for n in os.listdir(project.input_dir)}
    seen = []
    result = scan.run_scan(project, {"kind": "beam", "keyword": "particlenumber"}, [300, 600],
                           metrics=["transmission", "energy_out"], label="np", on_progress=lambda r: seen.append(len(r["rows"])))
    assert result["status"] == "finished" and seen == [1, 2]
    rows = result["rows"]
    assert [r["value"] for r in rows] == [300.0, 600.0]
    assert all(r.get("error") is None for r in rows), rows
    assert all(r["energy_out"] and r["energy_out"] > 1.5 for r in rows)
    assert os.path.isfile(os.path.join(result["folder"], "scan.json"))
    assert os.path.isfile(os.path.join(result["folder"], "scan.csv"))
    assert os.path.isfile(os.path.join(rows[0]["output_dir"], "DataSet.txt"))
    assert result["folder"].startswith(os.path.join(project.path, "Scans"))
    assert {n: os.path.getmtime(os.path.join(project.input_dir, n)) for n in os.listdir(project.input_dir)} == before
    assert not os.listdir(os.path.join(project.path, "OutputFile"))
    assert scan.list_scans(project.path)[0]["label"] == "np"
