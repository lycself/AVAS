"""Quick health check of a finished run, read from ``DataSet.txt``.

The native engine writes NaN as ``-nan(ind)`` (MSVC) or ``nan`` and keeps
going, so a run can "finish" with columns that are undefined from some step
on.  That is expected for a single-particle run (rms sizes, Twiss parameters
and emittances of one particle are undefined) and a warning sign otherwise
(all particles lost, tracking diverged).  :func:`dataset_diagnostics` finds
where it starts and returns bilingual messages for the GUI, the CLI and the
AI assistant.

Reading is vectorised (one ``numpy`` conversion of the whole file), a 20 000
row DataSet takes well under a second.
"""
import math
import os

import numpy as np

COLUMNS = 41
# DataSet.txt columns (manual 20260427, "DataSet.txt"); only the ones checked or reported here
COLUMN_NAMES = {
    0: "energy", 7: "alpha_x", 8: "alpha_y", 9: "alpha_z", 10: "beta_x", 11: "beta_y", 12: "beta_z",
    13: "emit_x", 14: "emit_y", 15: "emit_z", 16: "rms_x", 17: "rms_x'", 18: "rms_y", 19: "rms_y'",
    20: "rms_z", 21: "rms_z'", 22: "max_x", 24: "max_y", 28: "particles",
}
_NAN_TOKENS = (b"-nan(ind)", b"nan(ind)", b"-nan(snan)", b"nan(snan)", b"-nan(qnan)", b"nan(qnan)", b"-nan",
               b"1.#ind", b"-1.#ind", b"1.#qnan", b"-1.#qnan")
_INF_TOKENS = ((b"-1.#inf", b"-inf"), (b"1.#inf", b"inf"))


def read_dataset_array(path):
    """``DataSet.txt`` as a float array ``(rows, 41)``; an incomplete last row is dropped."""
    with open(path, "rb") as fh:
        raw = fh.read()
    low = raw.lower()
    for token in _NAN_TOKENS:
        low = low.replace(token, b"nan")
    for token, repl in _INF_TOKENS:
        low = low.replace(token, repl)
    lines = low.splitlines()
    while lines and not lines[-1].strip():
        lines.pop()
    if lines and len(lines[-1].split()) != COLUMNS:
        lines.pop()
    good = [ln for ln in lines if len(ln.split()) == COLUMNS]
    if not good:
        return np.empty((0, COLUMNS))
    try:
        values = np.array(b" ".join(good).split(), dtype=float)
    except ValueError:                       # a stray token: fall back to a tolerant per-token parse
        values = np.array([_float(t) for t in b" ".join(good).split()], dtype=float)
    return values.reshape(len(good), COLUMNS)


def _float(token):
    try:
        return float(token)
    except ValueError:
        return math.nan


def _fmt(v):
    return f"{v:.4g}"


def dataset_diagnostics(output_dir):
    """Summary and problems of ``<output_dir>/DataSet.txt``; ``None`` when there is no DataSet."""
    path = os.path.join(output_dir, "DataSet.txt")
    if not os.path.isfile(path):
        return None
    data = read_dataset_array(path)
    out = {"rows": int(data.shape[0]), "messages": []}
    if not data.shape[0]:
        out["messages"].append({"level": "warning", "text": ("DataSet.txt is empty.", "DataSet.txt 为空。")})
        return out
    # z along a straight line: synchronous-particle position + centroid offset (manual, DataSet.txt)
    z = data[:, 5] + data[:, 33]
    alive = data[:, 28]
    n0 = alive[0] if math.isfinite(alive[0]) else math.nan
    n1 = alive[-1] if math.isfinite(alive[-1]) else math.nan
    out.update(particlesStart=_num(n0), particlesEnd=_num(n1), energyStart=_num(data[0, 0]),
               energyEnd=_num(data[-1, 0]), zEnd=_num(np.nanmax(z) if np.isfinite(z).any() else math.nan),
               transmission=_num(n1 / n0 if n0 and math.isfinite(n0) and math.isfinite(n1) else math.nan))
    single = bool(n0 == 1)
    out["singleParticle"] = single

    checked = [c for c in COLUMN_NAMES if c != 28]
    bad = ~np.isfinite(data[:, checked])
    nan_cols = [COLUMN_NAMES[checked[i]] for i in np.flatnonzero(bad.any(axis=0))]
    if nan_cols:
        first = int(np.flatnonzero(bad.any(axis=1))[0])
        zf = z[first] if math.isfinite(z[first]) else math.nan
        out["nan"] = {"columns": nan_cols, "firstRow": first, "z": _num(zf), "rows": int(bad.any(axis=1).sum())}
        cols = ", ".join(nan_cols[:6]) + (" …" if len(nan_cols) > 6 else "")
        if single:
            out["messages"].append({"level": "info", "text": (
                "Single-particle run (particlenumber 1): rms sizes, Twiss parameters and emittances are undefined "
                "for one particle, so DataSet.txt holds NaN in those columns. This is expected; see "
                "SingleParticle.txt for the trajectory.",
                "单粒子模拟（particlenumber 1）：一个粒子的 rms 尺寸、Twiss 参数和发射度没有定义，DataSet.txt "
                "中这些列为 NaN，属正常现象；粒子轨迹见 SingleParticle.txt。")})
        else:
            where = f"z ≈ {_fmt(zf)} m" if math.isfinite(zf) else f"row {first}"
            where_zh = f"z ≈ {_fmt(zf)} m" if math.isfinite(zf) else f"第 {first} 行"
            out["messages"].append({"level": "warning", "text": (
                f"DataSet.txt contains NaN ({cols}) from step {first} ({where}): the beam may be lost there "
                "or the tracking diverged. Check apertures, field maps and phases around that position.",
                f"DataSet.txt 从第 {first} 步（{where_zh}）开始出现 NaN（{cols}）：束流可能在此处丢失或计算发散，"
                "请检查该位置附近的孔径、场图和相位。")})
    if not single and math.isfinite(n0) and n0 > 0:
        lost_rows = np.flatnonzero(np.isfinite(alive) & (alive <= 0))
        if lost_rows.size:
            r = int(lost_rows[0])
            out["allLost"] = {"row": r, "z": _num(z[r])}
            out["messages"].append({"level": "error", "text": (
                f"All particles are lost at z ≈ {_fmt(z[r])} m (step {r}).",
                f"在 z ≈ {_fmt(z[r])} m（第 {r} 步）粒子全部丢失。")})
        elif math.isfinite(n1) and n1 < n0:
            out["messages"].append({"level": "info", "text": (
                f"Transmission {n1 / n0 * 100:.2f} % ({int(n0 - n1)} of {int(n0)} macro-particles lost).",
                f"传输效率 {n1 / n0 * 100:.2f} %（{int(n0)} 个宏粒子中丢失 {int(n0 - n1)} 个）。")})
    return out


def _num(v):
    v = float(v)
    return v if math.isfinite(v) else None


# --------------------------------------------------------------------------- metrics
METRICS = {
    "transmission": ("Transmission (fraction of macro-particles surviving)", "传输效率（存活宏粒子比例）"),
    "energy_out": ("Final mean kinetic energy (MeV)", "末端平均动能（MeV）"),
    "emit_x_out": ("Final normalized rms emittance x (π·mm·mrad)", "末端 x 归一化 rms 发射度（π·mm·mrad）"),
    "emit_y_out": ("Final normalized rms emittance y (π·mm·mrad)", "末端 y 归一化 rms 发射度（π·mm·mrad）"),
    "emit_z_out": ("Final rms emittance z (engine units ×1e6)", "末端 z rms 发射度（引擎单位 ×1e6）"),
    "emit_x_growth": ("Emittance growth x (out/in - 1)", "x 发射度增长（出/入 - 1）"),
    "emit_y_growth": ("Emittance growth y (out/in - 1)", "y 发射度增长（出/入 - 1）"),
    "emit_z_growth": ("Emittance growth z (out/in - 1)", "z 发射度增长（出/入 - 1）"),
    "rms_x_max": ("Largest rms size x along the lattice (mm)", "全程最大 x rms 尺寸（mm）"),
    "rms_y_max": ("Largest rms size y along the lattice (mm)", "全程最大 y rms 尺寸（mm）"),
    "rms_x_out": ("Final rms size x (mm)", "末端 x rms 尺寸（mm）"),
    "rms_y_out": ("Final rms size y (mm)", "末端 y rms 尺寸（mm）"),
    "max_x_max": ("Largest maximum particle excursion x (mm)", "全程最大 x 粒子偏移（mm）"),
    "max_y_max": ("Largest maximum particle excursion y (mm)", "全程最大 y 粒子偏移（mm）"),
    "centroid_x_max": ("Largest |centroid x| (mm)", "最大 |x 质心|（mm）"),
    "centroid_y_max": ("Largest |centroid y| (mm)", "最大 |y 质心|（mm）"),
    "lost": ("Lost macro-particles", "丢失宏粒子数"),
}


def _nanmax_at(values, z):
    ok = np.isfinite(values)
    if not ok.any():
        return None, None
    i = int(np.nanargmax(np.where(ok, values, -np.inf)))
    return _num(values[i]), _num(z[i])


def dataset_metrics(output_dir):
    """Scalar figures of merit of a run (see :data:`METRICS`), plus where maxima and losses occur.

    Used by the assistant, parameter scans and optimisation; ``None`` without DataSet.txt.
    """
    path = os.path.join(output_dir, "DataSet.txt")
    if not os.path.isfile(path):
        return None
    d = read_dataset_array(path)
    if not d.shape[0]:
        return None
    z = d[:, 5] + d[:, 33]
    alive = d[:, 28]
    valid = np.isfinite(d[:, 13]) & (alive > 0)
    first = int(np.flatnonzero(valid)[0]) if valid.any() else 0
    last = int(np.flatnonzero(valid)[-1]) if valid.any() else len(d) - 1

    def growth(col):
        a, b = d[first, col], d[last, col]
        return _num(b / a - 1.0) if a and math.isfinite(a) and math.isfinite(b) else None

    m = {
        "transmission": _num(alive[-1] / alive[0]) if alive[0] else None,
        "lost": _num(alive[0] - alive[-1]),
        "energy_in": _num(d[first, 0]),
        "energy_out": _num(d[last, 0]),
        "emit_x_in": _num(d[first, 13] * 1e6), "emit_y_in": _num(d[first, 14] * 1e6), "emit_z_in": _num(d[first, 15] * 1e6),
        "emit_x_out": _num(d[last, 13] * 1e6), "emit_y_out": _num(d[last, 14] * 1e6), "emit_z_out": _num(d[last, 15] * 1e6),
        "emit_x_growth": growth(13), "emit_y_growth": growth(14), "emit_z_growth": growth(15),
        "rms_x_out": _num(d[last, 16] * 1e3), "rms_y_out": _num(d[last, 18] * 1e3),
        "z_out": _num(z[last]),
    }
    for key, col in (("rms_x_max", 16), ("rms_y_max", 18), ("max_x_max", 22), ("max_y_max", 24)):
        m[key], m[key.replace("_max", "_max_z")] = _nanmax_at(d[:, col] * 1e3, z)
    for key, cols in (("centroid_x_max", (1, 29)), ("centroid_y_max", (3, 31))):
        m[key], m[key + "_z"] = _nanmax_at(np.abs(d[:, cols[0]] + d[:, cols[1]]) * 1e3, z)
    drops = np.flatnonzero(np.diff(alive) < 0) + 1
    if drops.size:
        amounts = alive[drops - 1] - alive[drops]
        order = np.argsort(-amounts)[:8]
        m["loss_locations"] = [{"z": _num(z[drops[i]]), "lost": _num(amounts[i])} for i in sorted(order, key=lambda i: z[drops[i]])]
    return m


def failure_hint(message):
    """Extra explanation for known failure messages (bilingual) or ``None``."""
    text = (message or "").lower()
    if "could not convert string to float" in text and "nan" in text:
        return ("Older AVAS versions stopped when DataSet.txt contained NaN (e.g. a single-particle run). "
                "This version reads NaN values; run the simulation again.",
                "旧版 AVAS 在 DataSet.txt 含 NaN（例如单粒子模拟）时会中止，当前版本已能读取 NaN，请重新运行模拟。")
    return None
