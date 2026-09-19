"""The run path without the engine: input staging, engine wrapper plumbing, error-study RNG."""
import os
import random
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)


@pytest.fixture(autouse=True)
def _no_lattice_override(monkeypatch):
    """`avas run --lattice` of another test must not decide which lattice these tests read."""
    from avas import paths
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)


# --------------------------------------------------------------------------- staging
def test_copy_text_inputs_skips_field_maps(tmp_path):
    from avas.data.inputs import copy_text_inputs, particle_file
    dest = copy_text_inputs(EXAMPLE_INPUT, str(tmp_path / "inputs"))
    names = set(os.listdir(dest))
    assert {"input.txt", "beam.txt", "lattice_mulp.txt", "ini.ini"} <= names
    assert not any(n.endswith((".edx", ".edy", ".edz", ".bsx", ".bsy", ".bsz", ".bdx", ".bdy", ".bdz")) for n in names)
    part = particle_file(os.path.join(EXAMPLE_INPUT, "beam.txt"))
    if part:                                        # the referenced particle file travels with the text inputs
        assert part in names


def test_stage_inputs_generates_lattice_in_the_output_folder(tmp_path, monkeypatch):
    from avas import paths
    from avas.api.basic import stage_inputs
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)
    inp = str(tmp_path / "InputFile")
    shutil.copytree(EXAMPLE_INPUT, inp)
    before = open(os.path.join(inp, "lattice.txt"), encoding="utf-8").read()
    staged = stage_inputs(inp, str(tmp_path / "out"))
    assert staged == os.path.join(str(tmp_path / "out"), "inputs")
    generated = open(os.path.join(staged, "lattice.txt"), encoding="utf-8").read()
    assert generated.strip().startswith("start") and "end" in generated
    assert open(os.path.join(inp, "lattice.txt"), encoding="utf-8").read() == before      # user folder untouched


def test_basic_mulp_runs_the_engine_on_the_staged_copy(tmp_path, monkeypatch):
    """basic_mulp hands the engine <out>/inputs as input and the original folder as field path."""
    from avas.api import basic
    inp = str(tmp_path / "InputFile")
    shutil.copytree(EXAMPLE_INPUT, inp)
    out = str(tmp_path / "out")
    calls = {}

    class FakeMultiParticle:
        def __init__(self, item):
            calls.update(item)

        def run(self):
            os.makedirs(calls["output_file"], exist_ok=True)
            open(os.path.join(calls["output_file"], "DataSet.txt"), "w").close()
            return 0

    class FakeDiag:
        def __init__(self, item):
            calls["diag_input"] = item["input_file"]

        def write_diag_info_to_file(self):
            pass

    import avas.core.MultiParticle as mp
    import avas.sim.diaginfo as diag
    monkeypatch.setattr(mp, "MultiParticle", FakeMultiParticle)
    monkeypatch.setattr(diag, "DiagInfo", FakeDiag)
    assert basic.basic_mulp(project_path=None, input_file=inp, output_file=out, field_path=None) is True
    assert calls["input_file"] == os.path.join(out, "inputs")
    assert calls["field_path"] == inp
    assert calls["diag_input"] == inp
    assert os.path.isfile(os.path.join(out, "inputs", "lattice.txt"))


def test_error_modes_run_on_the_staged_copy(tmp_path, monkeypatch):
    """err_stat / err_dyn / err_stat_dyn stage the text inputs like basic_mulp; the study gets the copy."""
    from avas.api import basic
    import avas.sim.error as error_mod
    inp = str(tmp_path / "InputFile")
    shutil.copytree(EXAMPLE_INPUT, inp)
    out = str(tmp_path / "out")
    seen = {}

    class FakeStudy:
        def __init__(self, item):
            seen.update(item)

        def run(self):
            return "ran"

    for name, api_fn in (("Errorstat", basic.err_stat), ("ErrorDyn", basic.err_dyn), ("Errorstatdyn", basic.err_stat_dyn)):
        seen.clear()
        monkeypatch.setattr(error_mod, name, FakeStudy)
        api_fn(project_path=None, input_file=inp, output_file=out, field_path=None, seed=3)
        assert seen["input_file"] == os.path.join(out, "inputs")
        assert seen["field_path"] == inp and seen["output_file"] == out
        assert seen["seed"] == 3 and seen["if_normal"] == 1                     # defaults still applied
        assert os.path.isfile(os.path.join(out, "inputs", "lattice_mulp.txt"))
        assert not any(f.endswith((".edx", ".bsz")) for f in os.listdir(os.path.join(out, "inputs")))


# --------------------------------------------------------------------------- engine wrapper
def test_engine_wrapper_declares_signatures(tmp_path):
    import ctypes
    from avas.core.MultiParticleEngine import MultiParticleEngine
    try:
        eng = MultiParticleEngine()
    except ValueError as exc:
        pytest.skip(f"engine not loadable here: {exc}")
    assert eng.library.main_agent.restype is ctypes.c_int
    assert eng.library.path.argtypes and len(eng.library.path.argtypes) == 3
    assert eng.get_path(EXAMPLE_INPUT, str(tmp_path), EXAMPLE_INPUT) == 0


def test_check_error_file_fallbacks(tmp_path):
    from avas.core.MultiParticle import MultiParticle
    obj = MultiParticle({"project_path": str(tmp_path), "device": "cpu", "mulp_engine": object()})
    log = tmp_path / "ErrorLog.txt"
    log.write_text("Error 3     lattice element 2 has a negative length", encoding="utf-8")
    assert obj.check_error_file(str(log)) == "lattice element 2 has a negative length"
    log.write_text("no separator in this message", encoding="utf-8")
    assert obj.check_error_file(str(log)) == "no separator in this message"
    log.write_bytes(b"bad \xff bytes     message")
    assert obj.check_error_file(str(log)) == "message"
    assert "could not be read" in obj.check_error_file(str(tmp_path / "missing.txt"))


def test_run_env_follows_the_platform():
    from avas import config
    assert config.run_env == ("windows" if sys.platform.startswith("win") else "linux")


# --------------------------------------------------------------------------- error study RNG
def _error_study(tmp_path, seed, name):
    from avas.sim.error import Error
    out = str(tmp_path / name)
    return Error({"project_path": None, "input_file": EXAMPLE_INPUT, "output_file": out, "seed": seed,
                  "if_normal": 0, "field_path": None, "if_generate_density_file": 0})


def test_error_seed_is_deterministic_and_private(tmp_path):
    a = _error_study(tmp_path, 7, "a")
    b = _error_study(tmp_path, 7, "b")
    c = _error_study(tmp_path, 8, "c")
    cmd = ["err_beam_stat", "1", "0.5", "0.2", "1.0"]
    for e in (a, b, c):
        e.err_beam_stat_on = [1] * 13                           # all beam-error columns switched on
    random.seed(12345)                                          # the global RNG must not matter
    ra = a.generate_error_base(cmd, 1)
    random.seed(999)
    rb = b.generate_error_base(cmd, 1)
    rc = c.generate_error_base(cmd, 1)
    assert ra == rb and ra != rc
    # same stream as the old `random.seed(seed)` + `random.uniform` code
    rng = random.Random(7)
    expected = [round(rng.uniform(-dx, dx), 5) for dx in [0.5, 0.2, 1.0] + [0.0] * 10]
    assert ra[2:] == expected and ra[1] == 0
    assert a.err_adjust_path == os.path.join(str(tmp_path / "a"), "error_adjust")


def test_error_restart_keeps_folders(tmp_path):
    from avas.sim.error import Error
    out = tmp_path / "restart"
    (out / "error_middle" / "output_0").mkdir(parents=True)
    marker = out / "error_output" / "keep.txt"
    marker.parent.mkdir(parents=True)
    marker.write_text("x", encoding="utf-8")
    e = Error({"project_path": None, "input_file": EXAMPLE_INPUT, "output_file": str(out), "seed": 1,
               "if_normal": 0, "field_path": None, "if_generate_density_file": 0, "restart": 1})
    assert marker.is_file()                                     # restart=1 does not wipe the results
    assert e.err_adjust_path == os.path.join(str(out), "error_adjust")
