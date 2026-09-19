"""Registry of the DataSet.txt curve plots (``avas plot TYPE`` and :class:`PlotDataSet`).

One entry per plot type: which curves of :func:`dataset_curves` go on the y axis,
the axis labels, legend labels, colours, legend switch and y limits.  ``ylabel``
and ``ylim`` may be callables taking the curves dictionary (for values that depend
on the data).  This module stays free of matplotlib so the command line can list
the names cheaply; :mod:`avas.post.plot.plotdataset` does the drawing.
"""
from collections import namedtuple

PlotSpec = namedtuple("PlotSpec", "y xlabel ylabel labels colors set_legend ylim")
PlotSpec.__new__.__defaults__ = (None, None, 0, None)     # labels, colors, set_legend, ylim

_Z = "z(m)"
_BETA_UNIT = "(mm/" + r"$\pi$ mrad)"


def _loss_ylim(c):
    return [-max(c["loss"]) - 100, max(c["loss"]) + 100]


def _rms_x_ylim(c):
    top = 2 * max(c["rms_x"])
    return [-top, top]


def _phi_ylabel(c):
    return f"RMS phase width(deg) at {c['freq'] / 1e6:g} MHz"


DATASET_PLOTS = {
    "loss": PlotSpec(("loss",), _Z, "loss", ylim=_loss_ylim),
    "energy": PlotSpec(("ek",), _Z, "Ek(MeV)"),
    "phi": PlotSpec(("phi", "phi_phi"), _Z, _phi_ylabel, colors=["r", "r"]),
    "emittance_x": PlotSpec(("emit_x",), _Z, "Emit_x(pi*mm*mrad)"),
    "emittance_y": PlotSpec(("emit_y",), _Z, "Emit_y(pi*mm*mrad)"),
    "emittance_z": PlotSpec(("emit_z",), _Z, "Emit_z(pi*mm*mrad)"),
    "rms_x": PlotSpec(("rms_x", "rms_xx"), _Z, "RMS_x Size(mm)", colors=["r", "r"], ylim=_rms_x_ylim),
    "rms_y": PlotSpec(("rms_y", "rms_yy"), _Z, "RMS_y Size(mm)", colors=["b", "b"]),
    "rms_xy": PlotSpec(("rms_x", "rms_xx", "rms_y", "rms_yy"), _Z, "RMS_xy Size(mm)",
                       labels=["x", None, "y", None], colors=["r", "r", "b", "b"], set_legend=1),
    "max_x": PlotSpec(("max_x", "max_xx"), _Z, "Max_x Size(mm)", colors=["r", "r"]),
    "max_y": PlotSpec(("max_y", "max_yy"), _Z, "Max_y Size(mm)", colors=["b", "b"]),
    "max_xy": PlotSpec(("max_x", "max_xx", "max_y", "max_yy"), _Z, "Max_xy Size(mm)",
                       labels=["x", None, "y", None], colors=["r", "r", "b", "b"], set_legend=1),
    "c_x": PlotSpec(("center_x",), _Z, "Center x(mm)", ylim=[-5, 5]),
    "c_y": PlotSpec(("center_y",), _Z, "Center y(mm)"),
    "c_xy": PlotSpec(("center_x", "center_y"), _Z, "Center x and y(mm)",
                     labels=["x", "y"], colors=["r", "b"], set_legend=1, ylim=[-5, 5]),
    "alpha_x": PlotSpec(("alpha_x",), _Z, r"$\alpha_{x}$"),
    "beta_x": PlotSpec(("beta_x",), _Z, r"$\beta_{x}$" + _BETA_UNIT),
    "beta_y": PlotSpec(("beta_y",), _Z, r"$\beta_{y}$" + _BETA_UNIT),
    "beta_z": PlotSpec(("beta_z",), _Z, r"$\beta_{z}$" + _BETA_UNIT),
    "beta_xyz": PlotSpec(("beta_x", "beta_y", "beta_z"), _Z, r"$\beta_{xyz}$" + _BETA_UNIT,
                         labels=[r"$\beta_{x}$", r"$\beta_{y}$", r"$\beta_{z}$"], set_legend=1),
}

# plots that read the lattice / a particle file instead of DataSet.txt (handled by avas.api.plotting)
LATTICE_PLOTS = ("cavity_voltage", "syn_phase", "phase_advance")
DST_PLOTS = ("phase",)

MISSING_CURVE = {
    "phi": "the rms phase width needs beam.txt (mass and frequency) next to the results",
}


def dataset_curves(dataset_obj):
    """All curves a plot may use, from a :class:`DatasetParameter` after ``get_parameter()``.

    Sizes and centroids in mm, emittances in pi mm mrad, energy in MeV; ``phi`` /
    ``phi_phi`` are None when beam.txt (mass, frequency) was not available.
    """
    d = dataset_obj
    phi = getattr(d, "phi", None)
    return {
        "z": list(d.z),
        "ek": list(d.ek),
        "emit_x": [i * 10**6 for i in d.emit_x],
        "emit_y": [i * 10**6 for i in d.emit_y],
        "emit_z": [i * 10**6 for i in d.emit_z],
        "rms_x": [i * 10**3 for i in d.rms_x],
        "rms_xx": [i * 10**3 for i in d.rms_xx],
        "rms_y": [i * 10**3 for i in d.rms_y],
        "rms_yy": [i * 10**3 for i in d.rms_yy],
        "max_x": [i * 10**3 for i in d.max_x],
        "max_xx": [i * 10**3 for i in d.max_xx],
        "max_y": [i * 10**3 for i in d.max_y],
        "max_yy": [i * 10**3 for i in d.max_yy],
        "alpha_x": list(d.alpha_x),
        "alpha_y": list(d.alpha_y),
        "alpha_z": list(d.alpha_z),
        "beta_x": list(d.beta_x),
        "beta_y": list(d.beta_y),
        "beta_z": list(d.beta_z),
        "center_x": [i * 10**3 for i in d.x],
        "center_y": [i * 10**3 for i in d.y],
        "loss": list(d.loss),
        "phi": None if phi is None else list(phi),
        "phi_phi": None if phi is None else list(d.phi_phi),
        "freq": getattr(d, "freq", None),
    }
