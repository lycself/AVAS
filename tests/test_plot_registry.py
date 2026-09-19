"""The DataSet plot registry (avas/post/plot/dataset_plots.py) keeps every old plot type and its data."""
import os

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, "tests", "_output", "Results_001")          # written by test_smoke.py
INPUTS = os.path.join(ROOT, "tests", "_output", "InputFile")

# the hand-maintained list the CLI had before the registry existed (order matters for `avas plot --help`)
OLD_DATASET_PLOTS = [
    "loss", "energy", "phi",
    "emittance_x", "emittance_y", "emittance_z",
    "rms_x", "rms_y", "rms_xy",
    "max_x", "max_y", "max_xy",
    "c_x", "c_y", "c_xy",
    "alpha_x", "beta_x", "beta_y", "beta_z", "beta_xyz",
]


def test_registry_names_match_the_old_cli_list():
    from avas.cli.main import PLOT_TYPES
    from avas.post.plot.dataset_plots import DATASET_PLOTS, DST_PLOTS, LATTICE_PLOTS
    assert list(DATASET_PLOTS) == OLD_DATASET_PLOTS
    assert set(DATASET_PLOTS) == set(OLD_DATASET_PLOTS)
    assert PLOT_TYPES == OLD_DATASET_PLOTS + ["cavity_voltage", "syn_phase", "phase_advance", "phase"]
    assert tuple(LATTICE_PLOTS) == ("cavity_voltage", "syn_phase", "phase_advance") and tuple(DST_PLOTS) == ("phase",)


def test_registry_module_is_light():
    import subprocess
    import sys
    code = "import sys, avas.post.plot.dataset_plots; assert 'matplotlib' not in sys.modules"
    subprocess.run([sys.executable, "-c", code], check=True, cwd=ROOT)


def _old_get_x_y(kind):
    """What PlotDataSet.get_x_y computed before the registry (the if/elif chain), for a few types."""
    from avas.data.datasetparameter import DatasetParameter
    d = DatasetParameter(os.path.join(RESULTS, "DataSet.txt"), None, input_dir=INPUTS)
    d.get_parameter()
    z = list(d.z)
    mm = lambda v: [i * 10**3 for i in v]                       # noqa: E731
    if kind == "rms_xy":
        y = [mm(d.rms_x), mm(d.rms_xx), mm(d.rms_y), mm(d.rms_yy)]
        meta = ("RMS_xy Size(mm)", ["x", None, "y", None], ["r", "r", "b", "b"], 1, [])
    elif kind == "emittance_x":
        y = [[i * 10**6 for i in d.emit_x]]
        meta = ("Emit_x(pi*mm*mrad)", [None] * 10, ["r", "b", "g"], 0, [])
    elif kind == "beta_xyz":
        y = [list(d.beta_x), list(d.beta_y), list(d.beta_z)]
        meta = (r"$\beta_{xyz}$" + "(mm/" + r"$\pi$ mrad)", [r"$\beta_{x}$", r"$\beta_{y}$", r"$\beta_{z}$"],
                ["r", "b", "g"], 1, [])
    elif kind == "loss":
        y = [list(d.loss)]
        meta = ("loss", [None] * 10, ["r", "b", "g"], 0, [-max(d.loss) - 100, max(d.loss) + 100])
    elif kind == "c_xy":
        y = [mm(d.x), mm(d.y)]
        meta = ("Center x and y(mm)", ["x", "y"], ["r", "b"], 1, [-5, 5])
    else:
        raise KeyError(kind)
    return [z] * len(y), y, meta


@pytest.mark.parametrize("kind", ["rms_xy", "emittance_x", "beta_xyz", "loss", "c_xy"])
def test_get_x_y_unchanged(kind):
    if not os.path.isfile(os.path.join(RESULTS, "DataSet.txt")):
        pytest.skip("run tests/test_smoke.py first (it produces tests/_output/Results_001)")
    import matplotlib
    matplotlib.use("Agg")
    from avas.post.plot.plotdataset import PlotDataSet
    v = PlotDataSet(os.path.join(RESULTS, "DataSet.txt"), kind, 1, input_dir=INPUTS)
    x, y = v.get_x_y()
    ox, oy, (ylabel, labels, colors, set_legend, ylim) = _old_get_x_y(kind)
    assert x == ox and y == oy
    assert v.xlabel == "z(m)" and v.ylabel == ylabel
    assert list(v.labels) == labels and list(v.colors) == colors and v.set_legend == set_legend
    assert list(v.ylim) == ylim


def test_sample_interval_and_unknown_type():
    if not os.path.isfile(os.path.join(RESULTS, "DataSet.txt")):
        pytest.skip("run tests/test_smoke.py first")
    import matplotlib
    matplotlib.use("Agg")
    from avas.post.plot.plotdataset import PlotDataSet
    full = PlotDataSet(os.path.join(RESULTS, "DataSet.txt"), "energy", 1, input_dir=INPUTS).get_x_y()
    every3 = PlotDataSet(os.path.join(RESULTS, "DataSet.txt"), "energy", 3, input_dir=INPUTS).get_x_y()
    assert every3[0][0] == full[0][0][::3] and every3[1][0] == full[1][0][::3]
    with pytest.raises(ValueError, match="unknown DataSet plot type"):
        PlotDataSet(os.path.join(RESULTS, "DataSet.txt"), "no_such_plot", 1, input_dir=INPUTS).get_x_y()
