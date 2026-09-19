"""beam.txt / input.txt config classes (avas.utils.beamconfig, avas.utils.inputconfig) and the keyword tables.

The classes keep their public surface: ``create_from_file`` / ``set_param`` /
``write_to_file`` return ``{"code", "data": {"msg", "beamParams" | "inputParams"}}``,
keywords set to None are not written, unknown keywords survive a round trip.
Types and choices come from ``avas.data.schema``.
"""
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)

from avas.utils.beamconfig import BeamConfig  # noqa: E402
from avas.utils.inputconfig import InputConfig  # noqa: E402
from avas.utils.exception import CustomFileNotFoundError, TypeError as KeyTypeError  # noqa: E402
from avas.utils.exception import ValueChooseError, ValueRangeError  # noqa: E402


def _lines(path):
    with open(path, encoding="utf-8") as fh:
        return [ln.split() for ln in fh if ln.strip()]


def _keyword_lines(path, key):
    return [ln for ln in _lines(path) if ln[0].lower() == key]


# --------------------------------------------------------------------------- beam.txt
def test_beam_example_types_and_round_trip(tmp_path):
    cfg = BeamConfig()
    res = cfg.create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "beam.txt")})
    assert res["code"] == 0 and res["data"]["msg"] == "success"
    p = res["data"]["beamParams"]
    assert p["readparticledistribution"] is None            # "unknown" in the file
    assert float(p["numofcharge"]) == 1 and p["particlenumber"] == 5260 and isinstance(p["particlenumber"], int)
    assert p["current"] == pytest.approx(0.1841) and isinstance(p["current"], float)
    assert p["frequency"] == pytest.approx(162.5e6) and p["kneticenergy"] == pytest.approx(1.5270289036445652)
    assert p["use_dst"] == 0 and isinstance(p["use_dst"], int) and p["beamtype"] == "notdc"
    assert p["alpha_x"] == pytest.approx(-0.65785) and p["beta_y"] == pytest.approx(0.37292)
    assert p["emit_z"] == pytest.approx(0.26506) and isinstance(p["emit_z"], float)
    assert p["distribution_x"] == "GS" and p["distribution_y"] == "GS"
    assert "twissx" not in p and "distribution" not in p          # split into components
    out = tmp_path / "beam.txt"
    cfg.write_to_file({"otherPath": str(out)})
    again = BeamConfig().create_from_file({"otherPath": str(out)})["data"]["beamParams"]
    assert again == p
    assert _keyword_lines(out, "twissx")[0] == ["twissx", "-0.65785", "0.37743", "0.13768"]
    assert _keyword_lines(out, "distribution")[0] == ["distribution", "GS", "GS"]
    assert _keyword_lines(out, "readparticledistribution")[0] == ["readparticledistribution", "unknown"]
    assert [ln[0] for ln in _lines(out)] == [ln[0] for ln in _lines(os.path.join(EXAMPLE_INPUT, "beam.txt"))]


def test_beam_unknown_keywords_and_dst(tmp_path):
    src = tmp_path / "beam.txt"
    shutil.copy(os.path.join(EXAMPLE_INPUT, "beam.txt"), src)
    with open(src, "a", encoding="utf-8") as fh:
        fh.write("randomseed 7\nmykey a b\ninitpos 1 2 3\n")
    cfg = BeamConfig()
    p = cfg.create_from_file({"otherPath": str(src)})["data"]["beamParams"]
    assert str(p["randomseed"]) == "7" and p["mykey"] == ["a", "b"]
    assert [float(v) for v in p["initpos"]] == [1, 2, 3]
    out = tmp_path / "out.txt"
    cfg.write_to_file({"otherPath": str(out)})
    assert _keyword_lines(out, "randomseed") == [["randomseed", "7"]]
    assert _keyword_lines(out, "mykey") == [["mykey", "a", "b"]]
    assert [float(v) for v in _keyword_lines(out, "initpos")[0][1:]] == [1, 2, 3]
    # a particle file is kept when use_dst is 1
    cfg.set_param(use_dst=1, readparticledistribution="part_rfq.dst")
    cfg.write_to_file({"otherPath": str(out)})
    assert _keyword_lines(out, "readparticledistribution") == [["readparticledistribution", "part_rfq.dst"]]
    assert _keyword_lines(out, "use_dst") == [["use_dst", "1"]]


def test_beam_set_param_validation_and_none(tmp_path):
    cfg = BeamConfig()
    cfg.create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "beam.txt")})
    res = cfg.set_param(particlenumber=1000, current="")
    assert res["code"] == 0 and res["data"]["beamParams"]["particlenumber"] == 1000
    assert res["data"]["beamParams"]["current"] is None
    with pytest.raises(KeyTypeError):
        cfg.set_param(particlenumber="abc")
    with pytest.raises(KeyTypeError):
        cfg.set_param(particlerestmass="938")
    with pytest.raises(ValueChooseError):
        cfg.set_param(distribution_x="XX")
    cfg.set_param(kneticenergy=None, alpha_x=None)
    out = tmp_path / "beam.txt"
    cfg.write_to_file({"otherPath": str(out)})
    keys = [ln[0] for ln in _lines(out)]
    assert "current" not in keys and "kneticenergy" not in keys and "twissx" not in keys
    assert "twissy" in keys and "particlenumber" in keys


def test_beam_missing_file():
    with pytest.raises(CustomFileNotFoundError):
        BeamConfig().create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "nope.txt")})


# --------------------------------------------------------------------------- input.txt
def test_input_example_types_and_round_trip(tmp_path):
    cfg = InputConfig()
    res = cfg.create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "input.txt")})
    assert res["code"] == 0
    p = res["data"]["inputParams"]
    assert p["sim_type"] == "mulp" and p["scmethod"] == "FFT"
    assert p["spacecharge"] == 1 and isinstance(p["spacecharge"], int)
    assert p["steppercycle"] == 50 and isinstance(p["steppercycle"], int)
    assert p["dumpperiodicity"] == 0 and p["boundary"] == 0 and p["randomseed"] == 0
    assert p["pchistogram_start"] == 0 and p["pchistogram_grid"] == 300 and isinstance(p["pchistogram_grid"], int)
    assert p["longlimits_start"] == 0 and isinstance(p["longlimits_start"], int)
    assert p["longlimits_phase"] == 0.0 and isinstance(p["longlimits_phase"], float)
    assert p["longlimits_energy"] == 0.0 and isinstance(p["longlimits_energy"], float)
    assert p.get("multithreading") is None and p.get("scanphase") is None
    out = tmp_path / "input.txt"
    cfg.write_to_file({"otherPath": str(out)})
    again = InputConfig().create_from_file({"otherPath": str(out)})["data"]["inputParams"]
    assert again == p
    assert _keyword_lines(out, "pchistogram") == [["pchistogram", "0", "300"]]
    assert _keyword_lines(out, "longlimits") == [["longlimits", "0", "0.0", "0.0"]]
    assert _keyword_lines(out, "multithreading") == []
    assert [ln[0] for ln in _lines(out)] == [ln[0] for ln in _lines(os.path.join(EXAMPLE_INPUT, "input.txt"))]


def test_input_none_is_dropped_lists_and_unknown_keywords(tmp_path):
    src = tmp_path / "input.txt"
    shutil.copy(os.path.join(EXAMPLE_INPUT, "input.txt"), src)
    with open(src, "a", encoding="utf-8") as fh:
        fh.write("SpaceChargeType 2\nfoo bar\nnumofgrid 32 32 64\nmeshrms 3 3 3.5\n")
    cfg = InputConfig()
    p = cfg.create_from_file({"otherPath": str(src)})["data"]["inputParams"]
    assert p["spacechargetype"] == 2 and p["foo"] == "bar"                 # keywords are case-insensitive
    assert p["numofgrid"] == [32, 32, 64] and p["meshrms"] == [3.0, 3.0, 3.5]
    cfg.set_param(multithreading=1, scanphase=None, numofgrid=[16, 16, 32])
    out = tmp_path / "out.txt"
    cfg.write_to_file({"otherPath": str(out)})
    assert _keyword_lines(out, "multithreading") == [["multithreading", "1"]]
    assert _keyword_lines(out, "scanphase") == []
    assert _keyword_lines(out, "numofgrid") == [["numofgrid", "16", "16", "32"]]
    assert _keyword_lines(out, "foo") == [["foo", "bar"]]
    assert [float(v) for v in _keyword_lines(out, "meshrms")[0][1:]] == [3, 3, 3.5]
    cfg.set_param(multithreading=None)
    cfg.write_to_file({"otherPath": str(out)})
    assert _keyword_lines(out, "multithreading") == []


def test_input_env_writes_only_envelope_keywords(tmp_path):
    src = tmp_path / "input.txt"
    src.write_text("sim_type env\nspacechargelong 2\nspacechargetype 1\nsteppercycle 50\n", encoding="utf-8")
    cfg = InputConfig()
    p = cfg.create_from_file({"otherPath": str(src)})["data"]["inputParams"]
    assert float(p["spacechargelong"]) == 2 and p["spacechargetype"] == 1 and p["steppercycle"] == 50
    out = tmp_path / "out.txt"
    cfg.write_to_file({"otherPath": str(out)})
    assert sorted(ln[0] for ln in _lines(out)) == ["sim_type", "spacechargelong", "spacechargetype"]
    assert float(_keyword_lines(out, "spacechargelong")[0][1]) == 2


def test_input_set_param_validation():
    cfg = InputConfig()
    cfg.create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "input.txt")})
    with pytest.raises(ValueRangeError):
        cfg.set_param(steppercycle=0)
    with pytest.raises(ValueRangeError):
        cfg.set_param(dumpperiodicity=-1)
    with pytest.raises(KeyTypeError):
        cfg.set_param(steppercycle="50")
    with pytest.raises(ValueChooseError):
        cfg.set_param(scmethod="XYZ")
    with pytest.raises(ValueChooseError):
        cfg.set_param(spacecharge=3)
    res = cfg.set_param(scmethod="SPICNIC", spacecharge=0, steppercycle=100, dumpperiodicity="")
    assert res["code"] == 0 and res["data"]["inputParams"]["dumpperiodicity"] is None
    assert res["data"]["inputParams"]["scmethod"] == "SPICNIC"


def test_input_missing_file():
    with pytest.raises(CustomFileNotFoundError):
        InputConfig().create_from_file({"otherPath": os.path.join(EXAMPLE_INPUT, "nope.txt")})


# --------------------------------------------------------------------------- keyword tables
def test_constants_follow_schema():
    import avas.constants as C
    from avas.data import schema
    assert C.mulpud_element == ["drift", "field", "quad", "solenoid", "bend", "steerer", "edge"]
    assert C.control_diag_element == ["diag_energy", "diag_size", "diag_position"]
    assert list(C.all_element) == list(schema.ELEMENT_KEYWORDS) == C.mulpud_element + C.control_diag_element
    assert set(C.mulp_basic_command) == set(C.mulpud_element) | {
        "start", "end", "superpose", "superposeend", "superposeout", "outputplane", "automaticoutput",
        "spacechargecomp"}
    assert set(C.err_write_command) == set(C.mulp_basic_command) | {
        "err_step", "err_cav_ncpl_dyn", "err_quad_ncpl_dyn", "err_beam_dyn", "err_quad_dyn_on", "err_cav_dyn_on",
        "err_beam_dyn_on"}
    for name in ("error_elemment_command", "error_beam_command", "error_elemment_dyn_on", "error_elemment_stat_on",
                 "error_beam_dyn_on", "error_beam_stat_on", "error_elemment_command_ncpl", "error_elemment_command_quad",
                 "error_elemment_command_cav"):
        for key in getattr(C, name):
            assert key in schema.LATTICE_KEYWORDS, (name, key)
    assert C.c_light == 299792458 and C.Pi == pytest.approx(3.141592653589793)
