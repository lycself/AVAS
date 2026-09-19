"""End-to-end smoke tests: run the bundled example through the CLI and plot it.

Run with ``pytest`` from the repository root.  The simulation takes a few
seconds and needs the native engine (avas/engine/AVAS.dll or libAVAS.so).
"""
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
WORK = os.path.join(ROOT, "tests", "_output")

sys.path.insert(0, ROOT)
from avas.cli.main import main  # noqa: E402


@pytest.fixture(scope="module")
def run_dirs():
    shutil.rmtree(WORK, ignore_errors=True)
    inp = os.path.join(WORK, "InputFile")
    out = os.path.join(WORK, "Results_001")
    shutil.copytree(EXAMPLE_INPUT, inp)
    return inp, out


def test_cli_help_and_info(capsys):
    assert main(["info"]) == 0
    assert "AVAS" in capsys.readouterr().out
    with pytest.raises(SystemExit):
        main(["--help"])


def test_run_decoupled_dirs(run_dirs):
    inp, out = run_dirs
    # implicit "run" sub-command, exactly like `python run_avas.py --input ... --output ...`
    assert main(["--input", inp, "--output", out]) == 0
    assert os.path.isfile(os.path.join(out, "DataSet.txt"))
    assert os.path.isfile(os.path.join(out, "avas_run.json"))


def test_run_with_other_lattice_file(run_dirs, monkeypatch):
    """--lattice FILE (or [lattice] source in ini.ini) decides which lattice is simulated."""
    import json
    from avas import paths
    inp, _out = run_dirs
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)
    with open(os.path.join(inp, "lattice_mulp.txt"), encoding="utf-8") as fh:
        base = fh.read()
    alt = base.replace("start", "start\ndrift 0.1 0.02 0", 1)
    with open(os.path.join(inp, "lattice_long.txt"), "w", encoding="utf-8") as fh:
        fh.write(alt)
    out = os.path.join(WORK, "Results_lattice")
    assert main(["run", "--input", inp, "--output", out, "--lattice", "lattice_long.txt"]) == 0
    monkeypatch.delenv(paths.LATTICE_ENV_VAR, raising=False)
    with open(os.path.join(out, "avas_run.json"), encoding="utf-8") as fh:
        info = json.load(fh)
    assert info["lattice"] == "lattice_long.txt"
    staged = os.path.join(out, "inputs")
    assert os.path.normcase(info["inputs_dir"]) == os.path.normcase(staged)
    with open(os.path.join(staged, "lattice.txt"), encoding="utf-8") as fh:
        generated = fh.read()
    assert "drift 0.1 0.02 0" in generated              # the engine got the chosen file (staged copy)
    for name in ("input.txt", "beam.txt", "lattice_long.txt"):
        assert os.path.isfile(os.path.join(staged, name))
    assert not any(f.endswith((".edx", ".bsz")) for f in os.listdir(staged))   # field maps are not copied
    # the user's input folder is left alone: its lattice.txt is the one shipped with the example
    with open(os.path.join(inp, "lattice.txt"), encoding="utf-8") as fh:
        untouched = fh.read()
    with open(os.path.join(EXAMPLE_INPUT, "lattice.txt"), encoding="utf-8") as fh:
        assert untouched == fh.read()
    assert "drift 0.1 0.02 0" not in untouched
    last = [line.split() for line in open(os.path.join(out, "DataSet.txt"), encoding="utf-8") if line.strip()][-1]
    assert last  # simulation produced data


@pytest.mark.parametrize("kind", ["emittance_x", "rms_x", "loss", "energy", "syn_phase"])
def test_plot_dataset(run_dirs, kind):
    inp, out = run_dirs
    png = os.path.join(WORK, f"{kind}.png")
    assert main(["plot", kind, "--output", out, "--save", png]) == 0
    assert os.path.getsize(png) > 1000


def test_plot_phase(run_dirs):
    inp, out = run_dirs
    dst = [f for f in os.listdir(out) if f.startswith("outData") and f.endswith(".dst")][0]
    png = os.path.join(WORK, "phase.png")
    assert main(["plot", "phase", "--dst", os.path.join(out, dst), "--save", png]) == 0
    assert os.path.getsize(png) > 1000


def test_plot_needs_input_hint(tmp_path):
    # an output directory with no avas_run.json and no sibling InputFile
    out = tmp_path / "Results"
    out.mkdir()
    (out / "DataSet.txt").write_text("")
    assert main(["plot", "loss", "--output", str(out), "--no-show"]) == 2
