"""Segment runs (avas.data.segment): choosing the part, stage lattices, output planes, RF re-phasing.

No engine runs here; tests/test_gui.py runs a segment end to end.
"""
import os
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from avas.data import segment as seg  # noqa: E402
from avas.data.lattice_doc import LatticeDocument  # noqa: E402

LATTICE = """start
err_step 1 1
automaticoutput 0.1 0.3 1.3
section LEBT {
drift 0.3 0.02 0
}
section cav {
outputplane 0
field 0.21 0.02 2 1 162.5e6 -33 1.36 -1.36 efield
drift 0.2 0.02 0
superpose 0 0 0
field 0.21 0.02 0 1 162.5e6 15 1.36 -1.36 efield
superpose 0.05
field 0.1 0.03 0 3 0 0 1 0.5 sol
superposeend
drift 0.1 0.02 0
}
end
"""


def lines_of(text):
    return [ln.strip() for ln in text.splitlines() if ln.strip()]


@pytest.fixture()
def doc():
    return LatticeDocument(LATTICE)


def test_section_at_the_beginning_keeps_beam_and_phases(doc):
    p = seg.plan(doc, section="LEBT")
    assert p.at_beginning and not p.needs_timing and p.label == "LEBT"
    assert (p.z_start, p.z_end) == (0.0, pytest.approx(0.3))
    text = lines_of(seg.segment_text(p))
    assert text[0] == "start" and text[-1] == "end"
    assert "drift 0.3 0.02 0" in text and "err_step 1 1" in text
    # automaticoutput clipped: planes 0.1 .. 1.3 -> only 0.1 lies before the end minus the margin
    assert "automaticoutput 0.1 0.3 0" in text
    assert not any(ln.startswith(("section", "{", "}")) for ln in text)


def test_middle_section_needs_timing_and_keeps_blocks_whole(doc):
    p = seg.plan(doc, section="cav")
    assert not p.at_beginning and p.to_end and p.needs_timing
    assert p.z_start == pytest.approx(0.3) and p.z_end == pytest.approx(1.02)
    assert len(p.rf) == 2
    body = lines_of(seg.segment_text(p))
    assert body.count("superposeend") == 1 and "superpose 0.05" in body
    # output planes before the segment that fall inside it move to its entry (0.4 and 0.7 -> 0.1, 0.4)
    assert body[1] == "automaticoutput 0.1 0.3 0.3"
    up = lines_of(seg.upstream_text(p))
    assert up == ["start", "err_step 1 1", "automaticoutput 0.1 0.3 0", "drift 0.3 0.02 0", "end"]
    ref = lines_of(seg.reference_text(p))
    assert ref[-2] == "drift 0.1 0.02 0" and ref.count("field 0.21 0.02 2 1 162.5e6 -33 1.36 -1.36 efield") == 1


def test_selection_by_lines_and_z(doc):
    field_lines = [s.line_no for s in doc.rf_cavities()]
    p = seg.plan(doc, start_line=field_lines[0], end_line=field_lines[0])
    assert len(p.elements) == 1 and p.z_start == pytest.approx(0.3) and p.z_end == pytest.approx(0.51)
    # the output plane at the entry is taken along, the drift after the cavity is not
    assert "outputplane 0" in lines_of(seg.segment_text(p))
    q = seg.plan(doc, z_min=0.5, z_max=0.95)
    assert len(q.rf) == 1 and q.elements[0].key == "drift" and q.z_end == pytest.approx(0.92)
    with pytest.raises(seg.SegmentError, match="available: LEBT, cav"):
        seg.plan(doc, section="MEBT")
    with pytest.raises(seg.SegmentError):
        seg.plan(doc, z_min=5, z_max=6)


def test_superpose_block_is_atomic(doc):
    inner = next(s for s in doc.statements if s.key == "field" and s.param(8) == "sol")
    p = seg.plan(doc, start_line=inner.line_no, end_line=inner.line_no)
    keys = [s.key for s in p.elements]
    assert keys == ["field", "field"]                    # the whole superpose block


def test_rephase_keeps_absolute_rf_timing(doc, tmp_path):
    p = seg.plan(doc, section="cav")
    f = 162.5e6
    t1, t2 = 1.7561270346339901e-08, 4.3658117974579367e-08
    syn = tmp_path / "synData.txt"
    syn.write_text(
        "0 drift 0.3 0 0 0.0570756 invalid invalid\n"
        f"1 field 0.21 0.3 {t1!r} 0.0570756 5.85 -85.665684739122071\n"
        f"2 drift 0.2 0.51 3.06e-08 0.0514 invalid invalid\n"
        f"3 field 0.21 0.71 {t2!r} 0.0514 68.19 133.33493528495305\n"
        "4 exitPlane 0.1 1.02 6.26e-08 0.054 invalid invalid\n", encoding="utf-8")
    rows = seg.read_syndata(str(syn))
    t_entry = seg.arrival_time(rows, p.z_start)
    assert t_entry == t1
    phases, report = seg.rephase(p, rows, t_entry)
    first, second = (phases[s.line_no] for s in p.rf)
    assert first == pytest.approx(-85.665684739122071)            # RF phase at its own entry
    expected = seg.wrap_degrees(133.33493528495305 - 360 * f * (t2 - t1))
    assert second == pytest.approx(expected)
    assert [r["v3"] for r in report] == ["2", "0"]
    text = seg.segment_text(p, phases)
    assert f"field 0.21 0.02 2 1 162.5e6 {second:.10g} 1.36 -1.36 efield" in text
    # interpolated arrival between two element entries
    assert t1 < seg.arrival_time(rows, 0.4) < 3.06e-08


def test_rephase_reports_missing_cavity(doc, tmp_path):
    p = seg.plan(doc, section="cav")
    syn = tmp_path / "synData.txt"
    syn.write_text("0 drift 0.3 0 0 0.05 invalid invalid\n1 field 0.21 0.3 1e-8 0.05 5 6\n", encoding="utf-8")
    with pytest.raises(seg.SegmentError, match="not found in the reference run"):
        seg.rephase(p, seg.read_syndata(str(syn)), 1e-8)


def test_keyword_edits():
    text = "readparticledistribution unknown\nParticleNumber 5000 ! macro\nuse_dst 0\n"
    out = seg.set_keywords(text, {"particlenumber": "1", "use_dst": None, "kneticenergy": "1.5"})
    assert out.splitlines() == ["readparticledistribution unknown", "ParticleNumber 1", "kneticenergy 1.5"]
    assert seg.keyword_value(out, "PARTICLENUMBER") == ["1"]
    assert seg.keyword_value(out, "use_dst") is None


def test_particle_files_by_position(tmp_path):
    for name in ("inData.dst", "outData_0.300000.dst", "outData_1.020000.dst", "other.dst"):
        (tmp_path / name).write_bytes(b"")
    assert seg.dst_at(str(tmp_path), 0.0).endswith("inData.dst")
    assert seg.dst_at(str(tmp_path), 0.3000004).endswith("outData_0.300000.dst")
    assert seg.dst_at(str(tmp_path), 0.31) is None
    assert seg.final_dst(str(tmp_path)).endswith("outData_1.020000.dst")


def test_upstream_fingerprint_follows_upstream_changes_only(doc):
    cav = seg.plan(doc, section="cav")
    lebt = seg.plan(doc, section="LEBT")
    beam = "kneticenergy 1.5\ncurrent 0.1 ! mA\n"
    # a run that ends at the entry and the segment that starts there agree
    assert seg.upstream_fingerprint(doc, lebt.z_end, [beam]) == seg.upstream_fingerprint(doc, cav.z_start, [beam])
    # comments and spacing do not matter, values do
    assert seg.upstream_fingerprint(doc, 0.3, ["kneticenergy  1.5 ! W\ncurrent 0.1\n"]) == seg.upstream_fingerprint(doc, 0.3, [beam])
    assert seg.upstream_fingerprint(doc, 0.3, ["kneticenergy 1.6\ncurrent 0.1\n"]) != seg.upstream_fingerprint(doc, 0.3, [beam])
    changed_down = LatticeDocument(LATTICE.replace("drift 0.1 0.02 0", "drift 0.2 0.02 0"))
    changed_up = LatticeDocument(LATTICE.replace("drift 0.3 0.02 0", "drift 0.31 0.02 0"))
    assert seg.upstream_fingerprint(changed_down, 0.3, [beam]) == seg.upstream_fingerprint(doc, 0.3, [beam])
    assert seg.upstream_fingerprint(changed_up, 0.3, [beam]) != seg.upstream_fingerprint(doc, 0.3, [beam])


def test_exit_time(tmp_path):
    syn = tmp_path / "synData.txt"
    syn.write_text("0 drift 0.3 0 0 0.05 invalid invalid\n0 exitPlane 0.3 0.3 1.25e-08 0.05 invalid invalid\n", encoding="utf-8")
    assert seg.exit_time(seg.read_syndata(str(syn))) == pytest.approx(1.25e-08)
    syn.write_text("0 drift 0.3 0 0 0.05 invalid invalid\n", encoding="utf-8")
    assert seg.exit_time(seg.read_syndata(str(syn))) is None
