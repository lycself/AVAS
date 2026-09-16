"""Unit tests for the lattice model, file recognition, field-map reader and lattice-source settings."""
import os
import shutil
import struct
import sys

import numpy as np
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)

from avas import paths  # noqa: E402
from avas.data import filekinds as fk  # noqa: E402
from avas.data import schema  # noqa: E402
from avas.data.fieldmap import FieldMap  # noqa: E402
from avas.data.lattice_doc import ERROR, WARNING, LatticeDocument, format_statement, rename_edits  # noqa: E402

# the superpose example of the manual (使用说明20260427), with names and a heading added
MANUAL_SUPERPOSE = """start
!;;;;;;;;;;;; MEBT ;;;;;;;;;;;;
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
!name SOL1
field      0.35   0.02     0   3   0   0   1    0.531  sol_yuan
superpose  0.345 0 0 0 0 0 0
cav1 : field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010 ! first cavity
superposeend
end
drift 1 0.02 0
"""


def test_manual_superpose_positions_names_and_groups():
    doc = LatticeDocument(MANUAL_SUPERPOSE)
    els = doc.elements()
    assert [s.key for s in els] == ["drift", "field", "field"]
    sol, cav = els[1], els[2]
    assert sol.name == "SOL1" and cav.name == "cav1"
    assert sol.z_start == pytest.approx(0.085) and sol.z_end == pytest.approx(0.435)
    assert cav.z_start == pytest.approx(0.43) and cav.z_end == pytest.approx(0.64)
    assert doc.total_length == pytest.approx(0.64)
    assert cav.comment == "! first cavity"
    assert sol.field_type() == "3" and cav.field_type() == "1"
    assert len(doc.rf_cavities()) == 1
    # the drift after 'end' is not simulated
    tail = doc.statements[-1]
    assert tail.key == "drift" and not tail.active
    from avas.data.lattice_doc import Group
    heading = next(c for c in doc.root.children if isinstance(c, Group))
    assert heading.kind == "heading" and heading.title == "MEBT"
    assert "superpose" in [c.kind for c in heading.children if isinstance(c, Group)]


def test_positions_match_latticeparameter_on_example(tmp_path):
    from avas.data.latticeparameter import LatticeParameter
    text = """start
drift 0.1 0.02 0
superpose 0 0 0 0 0 0
field 0.2 0.02 0 3 0 0 1 0.5 sol
superpose 0.15
field 0.21 0.02 0 1 162.5e6 -33 1.36 -1.36 efield
superposeend
quad 0.05 0.02 0 10
drift 0.2 0.02 0
end
"""
    path = tmp_path / "lat.txt"
    path.write_text(text, encoding="utf-8")
    lp = LatticeParameter(str(path))
    lp.get_parameter()
    doc = LatticeDocument(text)
    assert doc.total_length == pytest.approx(lp.total_length)
    assert [round(s.z_start, 9) for s in doc.elements()] == [round(v, 9) for v in lp.v_start]


def test_validation_rules_from_manual(tmp_path):
    text = """start
quad 0.05 0.02 0 10
superpose 0.1 0 0 0 0 0
field 0.1 0.02 0 7 0 0 1 1 missingmap
superpose 0.05
field 0.1 0.02 0 1 1e6 0 1 1
field 0.1 0.02 0 1 1e6 0 1 1 efield
drift 0.1 0.02
steerer 0.2 0.02 0 0 0 0 1
bogus 1 2
"""
    doc = LatticeDocument(text, field_dirs=[EXAMPLE_INPUT])
    by_key = {}
    for st in doc.statements:
        by_key.setdefault(st.key, []).append(st)
    texts = lambda st: " | ".join(i.text[0] for i in st.issues)  # noqa: E731
    assert any("first or last" in i.text[0] for i in by_key["quad"][0].issues)
    first_sup = by_key["superpose"][0]
    assert "all zeros" in texts(first_sup) and "not closed" in texts(first_sup)
    bad_type = by_key["field"][0]
    assert "unexpected value '7'" in texts(bad_type)
    assert by_key["field"][1].worst_issue() == ERROR               # 8 parameters instead of 9
    assert "needs one superpose" in texts(by_key["field"][2])      # element without its own superpose
    assert by_key["drift"][0].worst_issue() == ERROR               # missing reserved 0
    assert "length 0" in texts(by_key["steerer"][0])
    assert by_key["bogus"][0].worst_issue() == WARNING
    assert "No 'end'" in doc.issues[0].text[0]
    # field map lookup: efield exists in the example, missingmap does not
    ok = LatticeDocument("start\nfield 0.21 0.02 0 1 162.5e6 -33 1.36 -1.36 efield\nend\n", [EXAMPLE_INPUT])
    assert not ok.statements[1].issues
    missing = LatticeDocument("start\nfield 0.21 0.02 0 3 0 0 1 1 nomap\nend\n", [EXAMPLE_INPUT])
    assert "not found" in missing.statements[1].issues[0].text[0]


def test_numeric_enum_and_bend_length():
    doc = LatticeDocument("start\nfield 0.1 0.02 0 3.0 0 0 1 1 sol\nbend 0 0.02 0 90 2 0 0\nend\n")
    field, bend = doc.statements[1], doc.statements[2]
    assert field.field_type() == "3" and not field.issues
    assert bend.length == pytest.approx(np.pi)          # |α|·ρ = π/2 · 2


def test_format_statement_and_rename_keep_comment_and_style():
    doc = LatticeDocument(MANUAL_SUPERPOSE)
    cav = next(s for s in doc.statements if s.name == "cav1")
    params = list(cav.params)
    params[5] = "-30"
    text = format_statement(cav, params=params)
    assert text == "cav1 : field 0.21 0.02 0 1 162.5e6 -30 1.36 -1.36 hwr010 ! first cavity"
    assert rename_edits(cav, "CAV_A") == [(cav.line_no, "CAV_A : field 0.21 0.02 0 1 162.5e6 -33 1.36 -1.36 hwr010 "
                                                        "! first cavity")]
    sol = next(s for s in doc.statements if s.name == "SOL1")
    assert rename_edits(sol, "S 2") == [(sol.comment_name_line, "!name S_2")]


def test_schema_covers_manual_keywords():
    for key in ("drift", "field", "quad", "solenoid", "bend", "steerer", "edge", "superpose", "superposeend",
                "superposeout", "lattice", "lattice_end", "outputplane", "automaticoutput", "err_step",
                "err_beam_dyn", "err_beam_stat", "err_quad_ncpl_dyn", "err_quad_ncpl_stat", "err_cav_ncpl_dyn",
                "err_cav_ncpl_stat", "err_beam_dyn_on", "err_quad_stat_on", "err_cav_dyn_on", "adjust",
                "diag_energy", "diag_size", "diag_position"):
        assert schema.lattice_keyword(key) is not None, key
    field = schema.lattice_keyword("field")
    assert [p.unit for p in field.params[:2]] == ["m", "m"]
    assert field.params[3].choice_label("1")[1] == "高频场"
    assert len(schema.lattice_keyword("err_cav_stat_on").params) == 7        # dx dy dφx dφy kekb φs dz
    for key in ("multithreading", "steppercycle", "scanphase", "numofgrid", "meshrms", "longlimits", "boundary"):
        assert key in schema.INPUT_KEYWORDS
    for key in ("readparticledistribution", "numofcharge", "twissx", "initpos", "displacedpos"):
        assert key in schema.BEAM_KEYWORDS


def test_file_kinds_by_content(tmp_path):
    shutil.copytree(EXAMPLE_INPUT, tmp_path / "in")
    d = tmp_path / "in"
    (d / "my_version_2.txt").write_text((d / "lattice_mulp.txt").read_text(encoding="utf-8"), encoding="utf-8")
    (d / "tw.dat").write_text("; TraceWin\nDRIFT 158 17 0 0 0\nSUPERPOSE_MAP 0 0 0 0 0 0\n"
                              "FIELD_MAP 70 380 0 26 200 0 0 0 q120 0\nEND\n", encoding="utf-8")
    (d / "notes.txt").write_text("hello world\nthis is a note\n", encoding="utf-8")
    (d / "End to End.ini").write_bytes(b"TraceWin_options_file" + b"\x00" * 64)
    kinds = {n: fk.detect(str(d / n)) for n in os.listdir(d)}
    assert kinds["my_version_2.txt"] == fk.KIND_LATTICE
    assert kinds["lattice_mulp.txt"] == fk.KIND_LATTICE
    assert kinds["lattice.txt"] == fk.KIND_GENERATED_LATTICE
    assert kinds["tw.dat"] == fk.KIND_TRACEWIN_LATTICE
    assert kinds["beam.txt"] == fk.KIND_BEAM and kinds["input.txt"] == fk.KIND_INPUT
    assert kinds["ini.ini"] == fk.KIND_GUI_INI and kinds["scanData.txt"] == fk.KIND_SCANDATA
    assert kinds["part_rfq.dst"] == fk.KIND_PARTICLES and kinds["sol.bsx"] == fk.KIND_FIELDMAP
    assert kinds["notes.txt"] == fk.KIND_TEXT and kinds["End to End.ini"] == fk.KIND_TRACEWIN_PROJECT
    assert "my_version_2.txt" in fk.lattice_files(str(d)) and "lattice.txt" not in fk.lattice_files(str(d))


def _profile_cube(nz, nx, ny):
    z = np.linspace(0, 1, nz + 1)
    bz = np.exp(-((z - 0.5) / 0.15) ** 2)                 # smooth bump along z, flat transversally
    return np.broadcast_to(bz[:, None, None], (nz + 1, ny + 1, nx + 1)).copy()


def test_fieldmap_ascii_and_binary(tmp_path):
    nz, nx, ny = 40, 4, 4
    cube = _profile_cube(nz, nx, ny)
    # ASCII with x outermost / z innermost, binary with z outermost: both must give the same profile
    ascii_path = tmp_path / "m.bsz"
    values = np.transpose(cube, (2, 1, 0)).reshape(-1)
    ascii_path.write_text(f"{nz} 0.4\n{nx} -0.02 0.02\n{ny} -0.02 0.02\n1\n" + "\n".join(f"{v:.8e}" for v in values),
                          encoding="ascii")
    bin_path = tmp_path / "b.bsz"
    with open(bin_path, "wb") as fh:
        fh.write(struct.pack("<id i2d i2d d", nz, 0.4, nx, -0.02, 0.02, ny, -0.02, 0.02, 2.0))
        fh.write(cube.reshape(-1).astype("<f4").tobytes())
    for path, norm in ((ascii_path, 1.0), (bin_path, 2.0)):
        fm = FieldMap(str(path)).read()
        z, axis, peak = fm.profiles()
        assert fm.nz == nz and fm.length == pytest.approx(0.4) and fm.binary == (path == bin_path)
        assert z[np.argmax(axis)] == pytest.approx(0.2, abs=0.011)
        assert axis.max() == pytest.approx(norm, rel=1e-5) and peak.max() == pytest.approx(norm, rel=1e-5)
    example = FieldMap(os.path.join(EXAMPLE_INPUT, "sol.bsz")).read()
    z, axis, _peak = example.profiles()
    assert example.nz == 200 and abs(z[np.argmax(np.abs(axis))] - 0.175) < 0.02   # solenoid peak at its centre


def test_lattice_source_setting(tmp_path, monkeypatch):
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)
    d = tmp_path / "in"
    shutil.copytree(EXAMPLE_INPUT, d)
    assert paths.lattice_source_name(str(d)) == "lattice_mulp.txt"
    paths.set_lattice_source(str(d), "lattice_alt.txt")
    assert paths.lattice_source_name(str(d)) == "lattice_alt.txt"
    assert paths.lattice_source_path(str(d)) == os.path.join(str(d), "lattice_alt.txt")
    text = (d / "ini.ini").read_text(encoding="utf-8")
    assert "sim_type = mulp" in text and "source = lattice_alt.txt" in text        # other keys kept
    # IniConfig (used by the Settings page) keeps the new key through a read/write cycle
    from avas.utils.iniconfig import IniConfig
    ini = IniConfig()
    ini.create_from_file({"otherPath": str(d / "ini.ini")})
    ini.set_param(error={"error_type": "stat"})
    ini.write_to_file({"otherPath": str(d / "ini.ini")})
    assert paths.lattice_source_name(str(d)) == "lattice_alt.txt"
    monkeypatch.setenv(paths.LATTICE_ENV_VAR, "other.txt")
    assert paths.lattice_source_name(str(d)) == "other.txt"
    monkeypatch.delenv(paths.LATTICE_ENV_VAR)
    paths.set_lattice_source(str(d), "lattice_mulp.txt")
    assert paths.lattice_source_name(str(d)) == "lattice_mulp.txt"
