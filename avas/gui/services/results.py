"""Results page: plot data for the interactive (Plotly) figures, tools, and
publication exports through the existing matplotlib plot classes.

Every plot is described by ``(plot, params)``; :func:`figure` returns a
JSON figure description the page turns into Plotly traces, :func:`export`
draws the same plot with matplotlib (light colours) into a file.
"""
import json
import logging
import os
import re
import threading
import time
import uuid

import numpy as np

from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc

log = logging.getLogger("avas.gui")

DATASET_TYPES = ["rms_x", "rms_y", "rms_xy", "max_x", "max_y", "max_xy", "c_x", "c_y", "c_xy", "phi",
                 "beta_x", "beta_y", "beta_z", "beta_xyz", "alpha_x", "emittance_x", "emittance_y", "emittance_z",
                 "loss", "energy"]
PLANE_TITLES = None


# --------------------------------------------------------------------------- helpers
def _dirs(outputDir=None):
    """Project, input directory of the results and the results folder.

    Results written with other inputs (segment runs, command-line runs) name their
    input directory in avas_run.json; the project's InputFile is the fallback.
    """
    p = context.project().require()
    out = outputDir or p.output_dir
    if not os.path.isdir(out):
        raise UserError(f"Results folder not found: {out}")
    input_dir = p.input_dir
    if os.path.normcase(os.path.abspath(out)) != os.path.normcase(os.path.abspath(p.output_dir)):
        try:
            with open(os.path.join(out, "avas_run.json"), encoding="utf-8") as fh:
                cand = json.load(fh).get("input_dir")
            if cand and os.path.isdir(cand):
                input_dir = cand
        except (OSError, ValueError, AttributeError):
            pass
    return p, input_dir, out


_MATH = [(r"\\varepsilon", "ε"), (r"\\epsilon", "ε"), (r"\\alpha", "α"), (r"\\beta", "β"), (r"\\gamma", "γ"),
         (r"\\sigma", "σ"), (r"\\pi", "π"), (r"\\phi", "φ"), (r"\\Phi", "Φ"), (r"\\Delta", "Δ")]


def mathtext_to_html(text):
    """``$\\beta_{x}$(mm/$\\pi$ mrad)`` -> ``β<sub>x</sub>(mm/π mrad)``."""
    if not text or "$" not in text:
        return text or ""

    def conv(m):
        s = m.group(1)
        for pat, rep in _MATH:
            s = re.sub(pat, rep, s)
        s = re.sub(r"_\{([^}]*)\}", r"<sub>\1</sub>", s)
        s = re.sub(r"\^\{([^}]*)\}", r"<sup>\1</sup>", s)
        s = re.sub(r"_(\w)", r"<sub>\1</sub>", s)
        s = re.sub(r"\^(\w)", r"<sup>\1</sup>", s)
        return s.replace("{", "").replace("}", "")

    return re.sub(r"\$([^$]*)\$", conv, text)


def _arr(values):
    return bridge.blob(np.asarray(values, dtype=float), "float64")


def _lines_from_2d(obj):
    """Serialise a PicturePlot_2D after ``get_x_y()``."""
    xs, ys = obj.x, obj.y
    if len(ys) and not isinstance(ys[0], (list, tuple, np.ndarray)):
        ys = [ys]
    if len(xs) and not isinstance(xs[0], (list, tuple, np.ndarray)):
        xs = [xs] * len(ys)
    traces = []
    for i, y in enumerate(ys):
        x = xs[i] if i < len(xs) else xs[0]
        label = obj.labels[i] if i < len(obj.labels) else None
        marker = obj.markers[i] if i < len(obj.markers) else None
        traces.append({"x": _arr(x), "y": _arr(y), "color": obj.colors[i] if i < len(obj.colors) else None,
                       "name": mathtext_to_html(label) if label else None, "markers": bool(marker),
                       "legend": bool(obj.set_legend) and label is not None})
    return {"kind": "lines", "traces": traces, "xlabel": mathtext_to_html(obj.xlabel),
            "ylabel": mathtext_to_html(obj.ylabel), "xlim": list(obj.xlim) if len(obj.xlim) == 2 else None,
            "ylim": [float(v) for v in obj.ylim] if len(obj.ylim) == 2 else None, "legend": bool(obj.set_legend)}


# --------------------------------------------------------------------------- plots
def _dataset(p, input_dir, out, type="rms_x", interval=1):
    from avas.post.plot.plotdataset import PlotDataSet
    path = os.path.join(out, "DataSet.txt")
    if not os.path.isfile(path):
        raise UserError("DataSet.txt not found in the results folder. Run the simulation first.")
    if type not in DATASET_TYPES:
        raise UserError(f"Unknown quantity: {type}")
    beam = os.path.join(input_dir, "beam.txt")
    obj = PlotDataSet(path, type, int(interval or 1), input_dir=input_dir if os.path.isfile(beam) else None)
    obj.get_x_y()
    fig = _lines_from_2d(obj)
    fig["yPlain"] = True
    return obj, fig


def _phase_advance(p, input_dir, out, unit="period"):
    from avas.post.plot.plotpicture import PlotPhaseAdvance
    obj = PlotPhaseAdvance(p.path, unit, input_dir=input_dir, output_dir=out)
    obj.get_x_y()
    return obj, _lines_from_2d(obj)


def _syn_phase(p, input_dir, out):
    from avas.paths import lattice_source_path
    from avas.post.plot.plotpicture import PlotCavitySynPhase
    obj = PlotCavitySynPhase(lattice_source_path(input_dir))
    obj.get_x_y()
    if not obj.x or not obj.x[0]:
        raise UserError("No RF cavities (field elements of type 1) in the lattice.")
    return obj, _lines_from_2d(obj)


def cavity_fields(input_dir):
    from avas.paths import lattice_source_path
    from avas.utils.readfile import read_lattice_mulp_with_name
    info, _ = read_lattice_mulp_with_name(lattice_source_path(input_dir))
    names = []
    for row in info:
        if row and row[0] == "end":
            break
        if row and row[0] == "field" and float(row[4]) == 1 and row[9] not in names:
            names.append(row[9])
    return names


def _cavity_voltage(p, input_dir, out, ratio=None):
    from avas.paths import lattice_source_path
    from avas.post.plot.plotpicture import PlotCavityVoltage
    names = cavity_fields(input_dir)
    if not names:
        raise UserError("No field elements in the lattice.")
    r = {n: 1.0 for n in names}
    for k, v in (ratio or {}).items():
        try:
            r[k] = float(v)
        except (TypeError, ValueError) as exc:
            raise UserError(f"Voltage ratio of {k}: '{v}' is not a number") from exc
    obj = PlotCavityVoltage(lattice_source_path(input_dir), r)
    obj.get_x_y()
    fig = {"kind": "bar", "traces": [{"x": _arr(obj.x), "y": _arr(obj.y), "color": "r"}],
           "xlabel": obj.xlabel, "ylabel": "Cavity voltage (MV/m)"}
    return obj, fig


def _file(params, out, key="path"):
    path = params.get(key) or ""
    if not path:
        return None
    return path if os.path.isabs(path) else os.path.join(out, path)


def _err_emit_loss(p, input_dir, out, path=""):
    from avas.post.plot.ploterror import PlotErr_emit_loss
    f = _file({"path": path}, out)
    if not f or not os.path.isfile(f):
        raise UserError("Choose an error-study result file (OutputFile/errors_par*.txt).")
    obj = PlotErr_emit_loss(f)
    obj.get_x_y()
    traces = [{"x": _arr(obj.xy["ax1_x"][i]), "y": _arr(obj.xy["ax1_y"][i]), "color": obj.colors1[i],
               "name": obj.labels1[i], "legend": True} for i in range(len(obj.xy["ax1_x"]))]
    traces += [{"x": _arr(obj.xy["ax2_x"][i]), "y": _arr(obj.xy["ax2_y"][i]), "color": obj.colors2[i],
                "name": obj.labels2[i], "legend": True, "y2": True} for i in range(len(obj.xy["ax2_x"]))]
    return obj, {"kind": "lines", "traces": traces, "xlabel": obj.xlabel, "ylabel": obj.ylabel1,
                 "ylabel2": obj.ylabel2, "legend": True, "xdtick": 1}


def _err_out(p, input_dir, out, path="", stat="average", type="xy"):
    from avas.post.plot.ploterror import PlotErrout
    f = _file({"path": path}, out)
    if not f or not os.path.isfile(f):
        raise UserError("Choose an error-study result file.")
    obj = PlotErrout(f, stat, type)
    obj.get_x_y()
    return obj, _lines_from_2d(obj)


def _density(p, input_dir, out, path="", plane="x", kind="density", interval=1):
    from avas.post.plot import plotdesnsity as pd_
    f = _file({"path": path}, out)
    if not f or not os.path.isfile(f):
        raise UserError("Choose a density file (OutputFile/density_*.dat).")
    interval = int(interval or 1)
    if kind == "density":
        obj = pd_.PlotDensity(f, plane, interval)
        obj.get_x_y()
        z = obj.z_m[0]
        lower = obj.y_m                        # bins x steps, lower bin edges
        dens = np.nan_to_num(obj.density_m, nan=0.0)
        bins = lower.shape[0]
        step = (lower[1] - lower[0]) if bins > 1 else np.ones_like(z)
        lo, hi = float(np.min(lower)), float(np.max(lower + step))
        rows = min(600, max(bins, 300))
        ygrid = np.linspace(lo, hi, rows)
        img = np.zeros((rows, len(z)), dtype=np.float32)
        for i in range(len(z)):
            if step[i] <= 0:
                continue
            k = np.floor((ygrid - lower[0, i]) / step[i]).astype(int)
            ok = (k >= 0) & (k < bins)
            img[ok, i] = dens[k[ok], i]
        fig = {"kind": "density", "x": _arr(z), "y": _arr(ygrid), "z": bridge.blob(img), "rows": rows,
               "cols": len(z), "xlabel": obj.xlabel, "ylabel": obj.ylabel, "colorscale": colorscale("custom_jet")}
        return obj, fig
    if kind == "density_level":
        obj = pd_.PlotDensityLevel(f, plane, interval)
    elif kind in ("centroid", "emit", "rms_size", "rms_size_max", "lost", "maxlost", "minlost"):
        obj = pd_.PlotDensityProcess(f, plane, kind, interval)
    else:
        raise UserError(f"Unknown density plot: {kind}")
    obj.get_x_y()
    return obj, _lines_from_2d(obj)


def _acceptance(p, input_dir, out, kind=0):
    from avas.data.beamset import BeamsetParameter
    from avas.post.plot.plotacc import PlotAcc
    plt_path = os.path.join(out, "BeamSet.plt")
    steps = 0
    if os.path.isfile(plt_path):
        bs = BeamsetParameter(plt_path)
        steps = bs.get_step() - 1
        if bs.numofp <= 0:
            steps = 0
    if steps <= 0:
        raise UserError("BeamSet.plt contains no particle dumps. Set 'Output every N steps (plt)' to a value > 0 on "
                        "the Settings page and run the simulation again.")
    obj = PlotAcc(p.path)
    obj.plt_path = plt_path
    kind = int(kind)
    try:
        emit, norm, a, b = obj.cal_accptance(kind)
    except Exception as exc:  # noqa: BLE001 - "All particles passed" etc.
        raise UserError(str(exc)) from exc
    u, v = {0: ("x", "xx"), 1: ("y", "yy"), 2: ("z", "zz"), 3: ("phi", "E")}[kind]
    lost = obj.loss_particles
    th = np.linspace(0, 2 * np.pi, 400)
    al, be = obj.t_alpha, obj.t_beta
    ex = np.sqrt(emit * be) * np.cos(th)
    ey = -np.sqrt(emit / be) * (al * np.cos(th) + np.sin(th))
    labels = {"x": "x (mm)", "xx": "x' (mrad)", "y": "y (mm)", "yy": "y' (mrad)", "z": "z (mm)",
              "zz": "Δv/v × 1000", "phi": "φ (deg)", "E": "ΔE (MeV)"}
    fig = {"kind": "acceptance", "scatter": {"x": _arr(lost[u].values), "y": _arr(lost[v].values)},
           "ellipse": {"x": _arr(ex), "y": _arr(ey)}, "xlabel": labels[u], "ylabel": labels[v],
           "result": {"emit": emit, "norm": norm, "pos": a, "angle": b}}
    obj._kind = kind
    obj._emit = emit
    return obj, fig


PLOTS = {"dataset": _dataset, "phase_advance": _phase_advance, "syn_phase": _syn_phase,
         "cavity_voltage": _cavity_voltage, "err_emit_loss": _err_emit_loss, "err_out": _err_out,
         "density": _density, "acceptance": _acceptance}


@rpc("results.figure")
def figure(plot, params=None, outputDir=None):
    fn = PLOTS.get(plot)
    if fn is None:
        raise UserError(f"Unknown plot: {plot}")
    p, input_dir, out = _dirs(outputDir)
    try:
        _obj, fig = fn(p, input_dir, out, **(params or {}))
    except UserError:
        raise
    except FileNotFoundError as exc:
        raise UserError(f"File not found: {exc.filename or exc}") from exc
    except (ValueError, IndexError, KeyError) as exc:
        raise UserError(f"{type(exc).__name__}: {exc}") from exc
    return fig


# --------------------------------------------------------------------------- colour maps
_CMAPS = {}


def colorscale(name, n=64):
    if name in _CMAPS:
        return _CMAPS[name]
    import matplotlib
    matplotlib.use("Agg", force=False)
    import matplotlib.colors as mcolors
    import matplotlib.pyplot as plt
    if name == "custom_jet":
        colors = [(1, 1, 1), *plt.cm.jet(np.linspace(0, 1, 256))]
        cmap = mcolors.LinearSegmentedColormap.from_list("custom_jet", colors)
    else:
        from avas.utils.my_jet import make_tracewin_like_jet
        cmap = make_tracewin_like_jet(low_frac=0.1, N=256)
    scale = [[i / (n - 1), mcolors.to_hex(cmap(i / (n - 1)))] for i in range(n)]
    _CMAPS[name] = scale
    return scale


# --------------------------------------------------------------------------- listings
@rpc("results.overview")
def overview(outputDir=None):
    p, input_dir, out = _dirs(outputDir)
    names = sorted(os.listdir(out), key=str.lower)

    def files(pred, folder=out):
        return [os.path.join(folder, n) for n in sorted(os.listdir(folder), key=str.lower)
                if os.path.isfile(os.path.join(folder, n)) and pred(n.lower())] if os.path.isdir(folder) else []

    run_info = p.last_run() if os.path.normcase(out) == os.path.normcase(p.output_dir) else {}
    return {
        "outputDir": out, "defaultOutput": p.output_dir, "inputDir": input_dir,
        "hasDataSet": "DataSet.txt" in names, "hasPlt": "BeamSet.plt" in names,
        "dst": files(lambda n: n.endswith(".dst")) + files(lambda n: n.endswith(".dst"), input_dir),
        "plt": files(lambda n: n.endswith(".plt")),
        "errors": files(lambda n: n.startswith("errors_par") and n.endswith(".txt")),
        "density": files(lambda n: n.startswith("density") and n.endswith(".dat")),
        "cavities": cavity_fields(input_dir) if os.path.isfile(p.lattice_path()) else [],
        "runInfo": run_info,
    }


# --------------------------------------------------------------------------- phase space
_SESSIONS = {}
_SESSION_LOCK = threading.Lock()
PLANE_KEYS = ["x", "x1", "y", "y1", "z", "z1", "phi", "w_minus_mean", "dp_p_100"]


def _titles():
    from avas.config import dst_picture_title_dict
    return dst_picture_title_dict


def _store(data):
    key = uuid.uuid4().hex
    with _SESSION_LOCK:
        _SESSIONS[key] = data
        while len(_SESSIONS) > 8:
            _SESSIONS.pop(next(iter(_SESSIONS)))
    return key


def _session(handle):
    with _SESSION_LOCK:
        s = _SESSIONS.get(handle)
    if s is None:
        raise UserError("The particle data is no longer loaded; open the viewer again.")
    return s


@rpc("phase.openDst")
def open_dst(path):
    from avas.data.beamparameter import DstParameter
    if not path or not os.path.isfile(path):
        raise UserError("Select a .dst file.")
    d = DstParameter(path).get_parameter()
    return {"handle": _store({"dst": d, "source": path}), "number": int(d["number"]), "energy": float(d["energy"]),
            "title": os.path.basename(path)}


@rpc("phase.pltInfo")
def plt_info(path):
    from avas.data.beamset import BeamsetParameter
    if not path or not os.path.isfile(path):
        raise UserError("Select a .plt file.")
    obj = BeamsetParameter(path)
    steps = obj.get_step()
    if obj.numofp <= 0 or steps <= 0:
        raise UserError(f"{os.path.basename(path)} contains no particle dumps. Set 'Output every N steps (plt)' "
                        "to a value > 0 on the Settings page and run the simulation again.")
    headers = obj.get_all_dict()
    return {"steps": steps, "particles": obj.numofp,
            "items": [{"step": i, "index": h.get("index"), "location": h.get("location"), "time": h.get("time"),
                       "type": h.get("type", h.get("tpye"))} for i, h in enumerate(headers[:steps])]}


@rpc("phase.openPlt")
def open_plt(path, step=0, outputDir=None):
    from avas.post.analysis.treatplt import TreatPlt
    p, _input, out = _dirs(outputDir)
    if not path or not os.path.isfile(path):
        raise UserError("Select a .plt file.")
    dataset = os.path.join(out, "DataSet.txt")
    if not os.path.isfile(dataset):
        raise UserError("DataSet.txt is needed next to the .plt file (it holds the synchronous particle).")
    obj = TreatPlt({"project_path": p.path, "plt_path": path, "dataset_path": dataset})
    obj.get_dataset_plt_base_info()
    step = int(step)
    if not 0 <= step < obj.plt_obj.get_step():
        raise UserError(f"Step {step} is outside 0 … {obj.plt_obj.get_step() - 1}.")
    try:
        _all, _alive, d = obj.get_parameter_one_step(step)
    except IndexError as exc:
        raise UserError("This step has no matching row in DataSet.txt.") from exc
    loc = obj.plt_obj.one_step_dict.get("location")
    return {"handle": _store({"dst": d, "source": path, "step": step, "plt": True}), "number": int(d["number"]),
            "energy": float(d["energy"]), "location": loc, "title": f"{os.path.basename(path)} · step {step}"}


def _sigma(n):
    if n <= 100:
        return 1
    if n <= 1e5:
        return 0.7
    if n <= 1e6:
        return 0.5
    if n <= 1e7:
        return 0.3
    return 0.1


def _density_image(x, y, xr, yr, total):
    from scipy.ndimage import gaussian_filter
    from avas.utils.pixel_scatter import pixel_scatter
    W, H = 400, 300
    xmin, xmax = xr
    ymin, ymax = yr
    if xmax <= xmin or ymax <= ymin:
        return np.zeros((H, W), dtype=np.float32)
    img = pixel_scatter(np.ascontiguousarray(x, dtype=np.float64), np.ascontiguousarray(y, dtype=np.float64),
                        float(xmin), float(xmax), float(ymin), float(ymax), W, H, 4, 0.0)
    img = gaussian_filter(np.asarray(img, dtype=np.float64), _sigma(total))
    m = img.max()
    return (img / m if m > 0 else img).astype(np.float32)


def _pad(lo, hi):
    def low(v):
        return v * 0.8 if v > 0 else v * 1.2 if v < 0 else v

    def high(v):
        return v * 1.2 if v > 0 else v * 0.8 if v < 0 else v
    return [low(lo), high(hi)]


@rpc("phase.panels")
def panels(handle, planes, ratio=1.0):
    from avas.post.analysis.out_percentemitt import cla_twiss_output_standard
    s = _session(handle)
    d = s["dst"]
    planes = [list(pl) for pl in planes][:4]
    for pl in planes:
        for k in pl:
            if k not in PLANE_KEYS:
                raise UserError(f"Unknown coordinate: {k}")
    ratio = float(ratio)
    if not 0 < ratio <= 1:
        raise UserError("The emittance fraction must be between 1 and 100 %.")
    twiss, text = cla_twiss_output_standard({"picture_type": planes, "dst_path": None, "dst_dict": d, "ratio": ratio})
    titles = _titles()
    out = []
    n = len(d["x"])
    for pl in planes:
        x = np.asarray(d[pl[0]], dtype=float)
        y = np.asarray(d[pl[1]], dtype=float)
        xr = _pad(float(x.min()), float(x.max())) if n else [0, 1]
        yr = _pad(float(y.min()), float(y.max())) if n else [0, 1]
        data_x = [float(x.min()), float(x.max())] if n else [0, 1]
        data_y = [float(y.min()), float(y.max())] if n else [0, 1]
        img = _density_image(x, y, data_x, data_y, n)
        tw = twiss.get(tuple(pl))
        ellipse = None
        if tw and tw[1] != 0:
            th = np.linspace(0, 2 * np.pi, 400)
            alpha, beta, emit = tw[0], tw[1], tw[9]
            ellipse = {"x": _arr(np.sqrt(emit * beta) * np.cos(th)),
                       "y": _arr(-np.sqrt(emit / beta) * (alpha * np.cos(th) + np.sin(th)))}
        out.append({"plane": pl, "title": f"{titles[pl[0]]} - {titles[pl[1]]}", "xTitle": titles[pl[0]],
                    "yTitle": titles[pl[1]], "image": bridge.blob(img), "w": img.shape[1], "h": img.shape[0],
                    "extent": data_x + data_y, "range": xr + yr, "ellipse": ellipse,
                    "twiss": [float(v) for v in tw] if tw else None})
    return {"panels": out, "number": n, "energy": float(d["energy"]), "twissText": text,
            "colorscale": colorscale("tracewin_like_jet")}


@rpc("phase.rebin")
def rebin(handle, plane, xrange, yrange):
    """Density image of the zoomed view, from the original particles."""
    d = _session(handle)["dst"]
    x = np.asarray(d[plane[0]], dtype=float)
    y = np.asarray(d[plane[1]], dtype=float)
    full = float(x.max() - x.min()) or 1.0
    total = int(abs(xrange[1] - xrange[0]) / full * len(x))
    img = _density_image(x, y, [float(xrange[0]), float(xrange[1])], [float(yrange[0]), float(yrange[1])], total)
    return {"image": bridge.blob(img), "w": img.shape[1], "h": img.shape[0], "extent": list(xrange) + list(yrange)}


# --------------------------------------------------------------------------- tools
_jobs = {}


@rpc("tools.expand")
def expand(input, ratio=10, output=None):
    p, _i, out = _dirs()
    if not input or not os.path.isfile(input):
        raise UserError("Select a .dst file.")
    try:
        ratio = int(ratio)
    except (TypeError, ValueError) as exc:
        raise UserError("The multiplication factor must be an integer.") from exc
    if ratio < 1:
        raise UserError("The multiplication factor must be at least 1.")
    output = output or os.path.join(out, "change_num_result.dst")
    if _jobs.get("expand") and _jobs["expand"].is_alive():
        raise UserError("An expansion is already running.")
    import multiprocessing
    from avas.api.basic import change_particle_number
    proc = multiprocessing.Process(target=change_particle_number, args=(input, output, ratio), daemon=True)
    proc.start()
    _jobs["expand"] = proc
    log.info("expanding %s x%s -> %s", os.path.basename(input), ratio, output)

    def watch():
        proc.join()
        ok = proc.exitcode == 0 and os.path.isfile(output)
        if proc.exitcode is not None and proc.exitcode < 0:
            ok = False
        (log.info if ok else log.error)("particle expansion %s: %s", "finished" if ok else "failed", output)
        bridge.emit("tools.expand", {"ok": ok, "output": output, "exitcode": proc.exitcode})
    threading.Thread(target=watch, daemon=True).start()
    return {"output": output}


@rpc("tools.expandStop")
def expand_stop():
    proc = _jobs.get("expand")
    if proc and proc.is_alive():
        proc.terminate()
        proc.join(5)
        log.warning("particle expansion stopped")
        return True
    return False


@rpc("tools.pltToDst")
def plt_to_dst(step, path=None, outputDir=None):
    from avas.post.analysis.plttodstfile import Plttozcode
    _p, _i, out = _dirs(outputDir)
    path = path or os.path.join(out, "BeamSet.plt")
    if not os.path.isfile(path):
        raise UserError("BeamSet.plt not found in the results folder.")
    obj = Plttozcode(path)
    steps = obj.get_all_step()
    step = int(step)
    if not 0 <= step < steps:
        raise UserError(f"Step {step} is outside 0 … {steps - 1}.")
    obj.write_to_dst(step)
    target = os.path.join(os.path.dirname(path), f"plt_step_{step}.dst")
    log.info("wrote %s", target)
    return {"output": target}


# --------------------------------------------------------------------------- export (matplotlib, light)
@rpc("results.export")
def export(plot, path, params=None, outputDir=None, dpi=200):
    """Draw *plot* with the matplotlib plot classes (publication style, light) into *path*."""
    import matplotlib
    matplotlib.use("Agg", force=True)
    import matplotlib.pyplot as plt
    if not path:
        raise UserError("No file name.")
    params = dict(params or {})
    with matplotlib.rc_context(matplotlib.rcParamsDefault):
        matplotlib.use("Agg", force=True)
        fig = plt.figure(figsize=(7, 4.5))
        try:
            if plot == "phase":
                _export_phase(fig, params)
            else:
                fn = PLOTS.get(plot)
                if fn is None:
                    raise UserError(f"Unknown plot: {plot}")
                p, input_dir, out = _dirs(outputDir)
                obj, _fig = fn(p, input_dir, out, **params)
                if plot == "acceptance":
                    obj.plot(fig, obj.t_alpha, obj.t_beta, obj.t_gamma, obj._emit, obj.loss_particles, obj._kind)
                else:
                    obj.run(0, fig)
                try:
                    fig.tight_layout()
                except Exception:  # noqa: BLE001
                    pass
            fig.savefig(path, dpi=int(dpi), bbox_inches="tight")
        finally:
            plt.close(fig)
    log.info("saved %s", path)
    return {"path": path}


def _export_phase(fig, params):
    from avas.post.analysis.out_percentemitt import cla_twiss_output_standard
    from avas.post.plot.plotphase2 import PlotPhase2
    s = _session(params["handle"])
    planes = [list(pl) for pl in params["planes"]][:4]
    twiss, _text = cla_twiss_output_standard({"picture_type": planes, "dst_dict": s["dst"],
                                              "ratio": float(params.get("ratio", 1.0))})
    fig.set_size_inches(6.4 * 1.3, 6 * 1.3)
    PlotPhase2().run({"show_": 0, "fig": fig, "picture_type": planes, "dst_path": None, "dst_dict": s["dst"],
                      "twiss_dict": twiss})


def warm():
    """Compile the numba density kernel in the background so the first viewer opens quickly."""
    def run():
        try:
            from avas.utils.pixel_scatter import warmup
            t0 = time.time()
            warmup()
            log.debug("pixel_scatter warm-up %.1f s", time.time() - t0)
        except Exception:  # noqa: BLE001
            pass
    threading.Thread(target=run, daemon=True).start()
