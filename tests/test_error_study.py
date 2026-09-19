"""Error studies through the CLI (stat / dyn / stat_dyn), 2 groups x 2 runs of 300 particles each (~25 s a mode).

The example lattice gets an ``err_step 2 2`` block with beam + cavity errors.  ``--seed 7`` fixes the Python RNG
that draws the errors, and ``randomseed 12345`` in input.txt fixes the engine, so the checks are:

* the drawn error values (``Error_Datas_<g>_<t>.txt`` and the ``err_*`` lines of the simulated lattices) are
  exactly the golden ones -- the seeded RNG must be consumed in the same order after any refactoring;
* the engine results stay within tolerance of the golden ones (relative 1e-3 on the final energy, 5e-2 on rms);
* the study works on ``<output>/inputs`` and leaves the input folder byte-for-byte alone.
"""
import filecmp
import json
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)

from avas.cli.main import main  # noqa: E402

CAVITY = "field  0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   efield"
LATTICES = {
    "stat": ["err_beam_stat_on 1 1 0 0 0 1 0 0 0 0 0 0 0", "err_beam_stat 1 0.5 0.5 0 0 0 0.01",
             "err_cav_stat_on 1 1 0 0 1 1 0", "err_cav_ncpl_stat 10 2 0.5 0.5 0 0 1 1"],
    "dyn": ["err_beam_dyn_on 1 1 0 0 0 1 0 0 0 0 0 0 0", "err_beam_dyn 1 0.5 0.5 0 0 0 0.01",
            "err_cav_dyn_on 1 1 0 0 1 1 0", "err_cav_ncpl_dyn 10 2 0.5 0.5 0 0 1 1"],
    "stat_dyn": ["err_beam_stat_on 1 1 0 0 0 1 0 0 0 0 0 0 0", "err_beam_stat 1 0.5 0.5 0 0 0 0.01",
                 "err_beam_dyn_on 1 0 0 0 0 1 0 0 0 0 0 0 0", "err_beam_dyn 2 0.2 0 0 0 0 0.005",
                 "err_cav_stat_on 1 1 0 0 1 1 0", "err_cav_ncpl_stat 10 2 0.5 0.5 0 0 1 1",
                 "err_cav_dyn_on 1 1 0 0 1 1 0", "err_cav_ncpl_dyn 10 1 0.2 0.2 0 0 0.5 0.5"],
}
RUNS = ["1_1", "1_2", "2_1", "2_2"]

# golden values recorded on 2026-09-19 with seed 7 (Python 3.11 random.Random): the beam error line and the
# cavity error line the engine is given for every group_time, and the final energy (MeV) / rms_x (m) of each run
STAT_DYN_SAME = {
    "1_1": ("err_beam_dyn 0 -0.08808 -0.17458 0 0 0 -0.00134 0 0 0 0 0 0 0",
            "err_cav_ncpl_dyn 1 0 0.05968 -0.11384 0 0 0.62089 -0.21167 0"),
    "1_2": ("err_beam_dyn 0 -0.05166 0.23813 0 0 0 -0.00356 0 0 0 0 0 0 0",
            "err_cav_ncpl_dyn 1 0 -0.08601 -0.02661 0 0 -0.22368 -0.47846 0"),
    "2_1": ("err_beam_dyn 0 -0.18585 0.08556 0 0 0 0.00398 0 0 0 0 0 0 0",
            "err_cav_ncpl_dyn 1 0 0.38361 0.35156 0 0 -0.28215 0.0196 0"),
    "2_2": ("err_beam_dyn 0 0.16822 0.26457 0 0 0 0.00391 0 0 0 0 0 0 0",
            "err_cav_ncpl_dyn 1 0 0.72167 0.28925 0 0 0.3574 -0.73626 0"),
}
GOLDEN_LINES = {
    "stat": STAT_DYN_SAME,
    "dyn": STAT_DYN_SAME,                          # same draws: the dyn lattice has the same commands in the same order
    "stat_dyn": {
        "1_1": ("err_beam_dyn 0 -0.06421 -0.17458 0.0 0.0 0.0 -0.0024000000000000002 0.0 0.0 0.0 0.0 0.0 0.0 0.0",
                "err_cav_ncpl_dyn 1 0 0.20804 0.017059999999999992 0 0 0.66268 -0.36618 0"),
        "1_2": ("err_beam_dyn 0 0.08094 -0.02341 0.0 0.0 0.0 0.0010399999999999997 0.0 0.0 0.0 0.0 0.0 0.0 0.0",
                "err_cav_ncpl_dyn 1 0 0.37682 0.13586 0 0 0.16575 -0.28605 0"),
        "2_1": ("err_beam_dyn 0 -0.354 0.16865 0.0 0.0 0.0 -0.01071 0.0 0.0 0.0 0.0 0.0 0.0 0.0",
                "err_cav_ncpl_dyn 1 0 0.35614 -1.09531 0 0 -1.20173 -1.2409 0"),
        "2_2": ("err_beam_dyn 0 -0.64828 0.39953 0.0 0.0 0.0 0.00167 0.0 0.0 0.0 0.0 0.0 0.0 0.0",
                "err_cav_ncpl_dyn 1 0 0.14484000000000002 -0.03157 0 0 0.24812 -0.53822 0"),
    },
}
GOLDEN_RESULTS = {          # output_<g>_<t>: (energy MeV, rms_x m) of the last DataSet.txt row
    "stat": {"0_0": (1.88325, 0.00178183), "1_1": (1.88431, 0.00178154), "1_2": (1.87658, 0.00178151),
             "2_1": (1.88855, 0.00177141), "2_2": (1.88608, 0.00177882)},
    "stat_dyn": {"0_0": (1.88325, 0.00178183), "1_1": (1.88399, 0.00177882), "1_2": (1.88501, 0.00177859),
                 "2_1": (1.86383, 0.00175928), "2_2": (1.88424, 0.00177097)},
}
GOLDEN_RESULTS["dyn"] = GOLDEN_RESULTS["stat"]
ENERGY_RTOL = 1e-3
RMS_RTOL = 5e-2


def _engine_available():
    try:
        from avas.core.MultiParticleEngine import MultiParticleEngine
        MultiParticleEngine()
        return True
    except Exception:  # noqa: BLE001 - any load problem means "no engine here"
        return False


def _set_keyword(path, keyword, value):
    with open(path, encoding="utf-8") as fh:
        lines = fh.read().splitlines()
    out = [f"{keyword} {value}" if line.split() and line.split()[0] == keyword else line for line in lines]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")


@pytest.fixture(scope="module")
def study_dirs(tmp_path_factory):
    """InputFile (300 particles, fixed engine seed, one lattice per mode) and a pristine copy of it."""
    root = tmp_path_factory.mktemp("error_study")
    inp = os.path.join(str(root), "InputFile")
    shutil.copytree(EXAMPLE_INPUT, inp, ignore=shutil.ignore_patterns("__pycache__"))
    _set_keyword(os.path.join(inp, "beam.txt"), "particlenumber", 300)
    _set_keyword(os.path.join(inp, "input.txt"), "randomseed", 12345)      # a fixed seed makes the engine reproducible
    for mode, commands in LATTICES.items():
        with open(os.path.join(inp, f"lattice_{mode}.txt"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(["start", "err_step 2 2"] + commands + [CAVITY, "end"]) + "\n")
    pristine = os.path.join(str(root), "InputFile_pristine")
    shutil.copytree(inp, pristine)
    return str(root), inp, pristine


def _last_row(dataset):
    with open(dataset, encoding="utf-8") as fh:
        rows = [line.split() for line in fh if line.strip()]
    return [float(x) for x in rows[-1]]


def _err_lines(lattice_path):
    with open(lattice_path, encoding="utf-8") as fh:
        lines = [line.strip() for line in fh]
    return tuple(line for line in lines if line.startswith(("err_beam_dyn ", "err_cav_ncpl_dyn ")))


@pytest.mark.skipif(not _engine_available(), reason="the simulation engine cannot be loaded here")
@pytest.mark.parametrize("mode", ["stat", "dyn", "stat_dyn"])
def test_error_study_mode(study_dirs, mode, monkeypatch):
    from avas import paths
    root, inp, pristine = study_dirs
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)
    out = os.path.join(root, f"out_{mode}")
    assert main(["run", "--input", inp, "--output", out, "--mode", mode, "--seed", "7",
                 "--lattice", f"lattice_{mode}.txt"]) == 0
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)

    # --- the input folder is left alone: the study worked on <out>/inputs
    match, mismatch, errors = filecmp.cmpfiles(inp, pristine, os.listdir(pristine), shallow=False)
    assert not mismatch and not errors and sorted(os.listdir(inp)) == sorted(os.listdir(pristine))
    with open(os.path.join(out, "avas_run.json"), encoding="utf-8") as fh:
        info = json.load(fh)
    assert info["status"] == "finished" and info["mode"] == mode
    staged = os.path.join(out, "inputs")
    assert os.path.normcase(info["inputs_dir"]) == os.path.normcase(staged)
    for name in ("input.txt", "beam.txt", f"lattice_{mode}.txt", "lattice.txt"):
        assert os.path.isfile(os.path.join(staged, name))
    assert not any(f.endswith((".edx", ".bsz")) for f in os.listdir(staged))      # field maps stay in the input dir

    # --- the drawn errors come from the seeded RNG: exact
    error_output = os.path.join(out, "error_output")
    assert sorted(os.listdir(error_output)) == ["output_0_0"] + [f"output_{r}" for r in RUNS]
    for run in RUNS:
        beam, cav = GOLDEN_LINES[mode][run]
        assert _err_lines(os.path.join(error_output, f"output_{run}", "lattice.txt")) == (beam, cav), run
        with open(os.path.join(out, f"Error_Datas_{run}.txt"), encoding="utf-8") as fh:
            assert fh.read().split() == ["CAV_ERROR[0]"] + cav.split()[3:], run
        assert os.path.isfile(os.path.join(out, f"par_diag_datas_{run}.txt"))
    assert not os.path.exists(os.path.join(out, "error_middle", "output_0"))       # moved to error_output

    # --- engine results: within tolerance of the golden run
    for run, (energy, rms_x) in GOLDEN_RESULTS[mode].items():
        row = _last_row(os.path.join(error_output, f"output_{run}", "DataSet.txt"))
        assert abs(row[0] - energy) <= ENERGY_RTOL * energy, (run, row[0], energy)
        assert abs(row[16] - rms_x) <= RMS_RTOL * rms_x, (run, row[16], rms_x)
        assert row[28] == 300

    # --- summary files: one row per run, group summaries for both groups
    with open(os.path.join(out, "errors_par_tot.txt"), encoding="utf-8") as fh:
        tot = [line.split() for line in fh if line.strip()]
    assert [r[0] for r in tot] == ["step_err", "0_0"] + RUNS
    assert all(len(r) == len(tot[0]) for r in tot[1:])
    assert all(float(r[1]) == 0.0 for r in tot[1:])                              # ratio_loss: nothing lost
    with open(os.path.join(out, "errors_par.txt"), encoding="utf-8") as fh:
        par = [line.split() for line in fh if line.strip()]
    assert [r[0] for r in par] == ["step_err", "0", "1", "2"]
    for row in par[2:]:
        assert len(row) == 23
        assert float(row[22]) > 0                                                # rms(delat_energy) over 2 runs
