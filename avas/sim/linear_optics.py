"""Fast linear envelope preview of a lattice ("linear preview (approximate)").

The visual lattice editor calls :func:`linear_preview` while parameters are
dragged, so the model is deliberately simple and linear; the multi-particle
engine stays the reference.

Model
-----
* Reference particle: kinetic energy W and time t integrated along z through
  the summed on-axis Ez of RF and static-electric field maps.  An RF map acts
  as ``Ke·Ez(s)·cos(ω(t − t_in) + φ0)`` with φ0 the RF phase when the reference
  particle enters the map.  The phase parameter of ``field`` depends on V3:
  0 synchronous phase φs = atan2(∫E·sinφ dz, ∫E·cosφ dz) (φ0 is solved for),
  1 entry phase φ0, 2 phase at t = 0 (φ0 = φ + 360°·f·t_in).
* Second moments of (x, x', y, y', z, δ = Δp/p) are pushed with 6×6 matrices.
  Field maps are cut into 1 mm slices for the reference particle and 4 mm
  slices for the optics (all maps of a superpose block summed); each optics
  slice is a half step in the local Bz (solenoid body, no edge kicks), a thin
  kick from the near-axis gradients of the maps (∂Ex/∂x, ∂Ey/∂y, ∂By/∂x,
  ∂Bx/∂y and the skew / radial terms, which carry the solenoid fringes) and
  the linear RF bunching, and another half step.  Momentum gain damps x', y',
  δ and scales z.  drift / quad / solenoid / bend (sector, field index) / edge
  use the usual matrices; steerers and diagnostics are identities.
* Space charge (optional): linear kick of the rms-equivalent uniform ellipsoid
  (bunched beam, charge I/f) or elliptical cylinder (``beamtype dc``), applied
  every ``SC_GROUP`` steps.

Conventions calibrated against the engine (AVAS.dll): E maps in MV/m scaled
by Ke, B maps in T scaled by Kb; the RF magnetic field is
``Kb·B(s)·sin(ω(t − t_in) + φ0)``; maps are stored z outermost (decided per
map from the data, see :func:`_map_group`); beam Twiss β in mm/mrad with
normalised rms emittances (z plane: z in mm, δ = Δp/p in mrad).  The RF phase
of the transverse fields is the one of the reference particle.
Not modelled: dipole / steering content of maps (a warning is given),
superposeout offsets, chromatic and non-linear effects (e.g. the growth of
the longitudinal emittance in low-energy cavities), losses, ``scanphase`` of
input.txt.
"""
import math
import os
import stat
import struct
import threading
import time

import numpy as np

from avas.data import schema
from avas.data.fieldmap import FieldMap
from avas.data.lattice_doc import LatticeDocument, to_float

C_LIGHT = 299792458.0
MEV_TM = 299.792458          # p [MeV/c] = MEV_TM · q · Bρ [T·m]
EPS0 = 8.8541878128e-12
FINE_STEP = 0.001            # m, reference-particle integration inside field maps
SLICES_PER_KICK = 4          # fine steps merged into one transverse slice
MATRIX_STEP = 0.01           # m, output resolution of drifts and matrix elements
BLOWUP = 1.0                 # m, an rms size above this counts as a lost beam
APERTURE_SIGMAS = 3.0
MAX_ITER = 20                # reference-particle fixed-point iterations per field section
ENERGY_TOL = 1e-9            # relative convergence of the slice energies
SC_GROUP = 4                 # steps between two space-charge kicks

_RF_EXT = ("edz", "edx", "edy")
_ES_EXT = ("esz", "esx", "esy")
_BS_EXT = ("bsz", "bsx", "bsy")
_RFB_EXT = ("bdx", "bdy")
_APERTURE_KEYS = ("drift", "field", "quad", "solenoid", "bend")
_trapezoid = getattr(np, "trapezoid", None) or np.trapz


class PreviewError(Exception):
    """The input cannot be previewed at all (no start line, incomplete beam data ...)."""


# =========================================================================== beam
def read_beam(input_dir):
    """Beam of ``<input_dir>/beam.txt`` for :func:`linear_preview`.

    Returns ``{"mass", "charge", "energy", "current", "frequency", "dc",
    "twiss": {"x"|"y"|"z": (alpha, beta, emit_n)}, "source", "warnings"}``.
    When the beam comes from a TraceWin ``.dst`` file (``use_dst``) its
    moments are used instead of the Twiss keywords.
    """
    path = os.path.join(input_dir, "beam.txt")
    if not os.path.isfile(path):
        raise PreviewError(f"beam.txt not found in {input_dir}")
    values = {}
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            tokens = line.split("!")[0].split()
            if tokens:
                values[tokens[0].lower()] = tokens[1:]

    def num(key, index=0, default=None):
        try:
            return float(values[key][index])
        except (KeyError, IndexError, ValueError):
            return default

    beam = {
        "mass": num("particlerestmass"), "charge": num("numofcharge", default=1.0),
        "energy": num("kneticenergy"), "current": num("current", default=0.0),
        "frequency": num("frequency", default=0.0),
        "dc": (values.get("beamtype") or ["notdc"])[0].lower() == "dc",
        "twiss": {}, "source": "twiss", "warnings": [],
    }
    for plane in "xyz":
        twiss = [num("twiss" + plane, k) for k in range(3)]
        if all(v is not None for v in twiss):
            beam["twiss"][plane] = tuple(twiss)

    dst = (values.get("readparticledistribution") or [""])[0]
    if dst and dst.lower() != "unknown" and num("use_dst", default=1) != 0:
        dst_path = dst if os.path.isabs(dst) else os.path.join(input_dir, dst)
        if dst_path.lower().endswith(".dst") and os.path.isfile(dst_path):
            try:
                beam.update(_beam_from_dst(dst_path))
                beam["source"] = "dst"
            except (OSError, ValueError, struct.error) as exc:
                beam["warnings"].append((f"Particle file '{dst}' could not be read ({exc}); Twiss keywords used.",
                                         f"无法读取粒子文件“{dst}”（{exc}），改用 Twiss 参数。"))
        else:
            beam["warnings"].append((f"Particle file '{dst}' is not a readable .dst file; Twiss keywords used.",
                                     f"粒子文件“{dst}”不是可读取的 .dst 文件，改用 Twiss 参数。"))
    return beam


def _beam_from_dst(path):
    """Energy, current, frequency, mass and rms Twiss of a TraceWin .dst file."""
    with open(path, "rb") as fh:
        raw = fh.read()
    n = struct.unpack_from("<i", raw, 2)[0]
    current, freq_mhz = struct.unpack_from("<dd", raw, 6)
    if n < 2 or len(raw) < 23 + 48 * n + 8:
        raise ValueError("truncated file")
    parts = np.frombuffer(raw, dtype="<f8", count=6 * n, offset=23).reshape(n, 6)
    mass = struct.unpack_from("<d", raw, 23 + 48 * n)[0]
    energy = float(parts[:, 5].mean())
    gamma = 1.0 + energy / mass
    bg = math.sqrt(gamma * gamma - 1.0)
    beta = bg / gamma
    freq = freq_mhz * 1e6
    wavelength = C_LIGHT / freq if freq > 0 else 1.0
    z = -(parts[:, 4] - parts[:, 4].mean()) * beta * wavelength / (2 * math.pi)
    delta = (parts[:, 5] - energy) / (beta * beta * gamma * mass)
    twiss = {}
    for plane, (u, up) in (("x", (parts[:, 0] * 0.01, parts[:, 1])), ("y", (parts[:, 2] * 0.01, parts[:, 3])),
                           ("z", (z, delta))):
        cov = np.cov(u, up)
        emit = math.sqrt(max(cov[0, 0] * cov[1, 1] - cov[0, 1] ** 2, 0.0))
        if emit <= 0:
            twiss[plane] = (0.0, 1.0, 0.0)
        else:
            twiss[plane] = (-cov[0, 1] / emit, cov[0, 0] / emit, emit * bg * 1e6)
    return {"mass": mass, "energy": energy, "current": current, "frequency": freq, "twiss": twiss}


def _check_beam(beam):
    if not isinstance(beam, dict):
        raise PreviewError("No beam data.")
    try:
        mass, energy = float(beam["mass"]), float(beam["energy"])
        charge = float(beam.get("charge") or 0.0)
    except (KeyError, TypeError, ValueError):
        raise PreviewError("Beam data needs mass and energy.") from None
    if not (mass > 0 and energy > 0 and charge != 0 and math.isfinite(mass * energy * charge)):
        raise PreviewError("Beam mass, energy and charge must be positive / non-zero numbers.")
    twiss = beam.get("twiss") or {}
    for plane in "xy":
        t = twiss.get(plane)
        if t is None or len(t) < 3 or not float(t[1]) > 0 or not float(t[2]) >= 0:
            raise PreviewError(f"Beam Twiss parameters of plane {plane} are missing or invalid.")
    return mass, energy, charge


def _sigma0(beam, bg):
    """Initial 6×6 second-moment matrix in m and rad."""
    sigma = np.zeros((6, 6))
    for k, plane in enumerate("xyz"):
        t = (beam.get("twiss") or {}).get(plane)
        if t is None:
            continue
        alpha, beta, emit_n = (float(v) for v in t[:3])
        if not beta > 0 or not emit_n >= 0:
            continue
        emit = emit_n / bg * 1e-6                          # geometric, m·rad
        i = 2 * k
        sigma[i, i] = beta * emit                          # β [mm/mrad] = β [m/rad]
        sigma[i, i + 1] = sigma[i + 1, i] = -alpha * emit
        sigma[i + 1, i + 1] = (1 + alpha * alpha) / beta * emit
    return sigma


# =========================================================================== field maps
_MAP_CACHE = {}
_MAP_LOCK = threading.Lock()


def _map_group(paths, stats=None):
    """``{ext: profile}`` for the files ``{ext: path}`` of one field map (cached by path, mtime, size).

    A profile holds the on-axis value and the transverse derivatives ``d/dx``,
    ``d/dy`` at the axis versus z.  The storage order of the axes is decided
    for the whole group (all files of one map share it): the order in which
    the values are smoother along z, z outermost unless clearly worse.  This
    is more robust than a per-file decision, which fails e.g. for quadrupole
    maps whose peak profile looks alike in both orders.
    """
    stats = stats or {ext: os.stat(p) for ext, p in paths.items()}
    key = tuple(sorted((ext, os.path.normcase(os.path.abspath(p)), stats[ext].st_mtime_ns, stats[ext].st_size)
                       for ext, p in paths.items()))
    hit = _MAP_CACHE.get(key)
    if hit is not None:
        return hit
    with _MAP_LOCK:
        hit = _MAP_CACHE.get(key)
        if hit is not None:
            return hit
        maps, outer, inner = {}, {}, {}
        score = [0.0, 0.0]
        for ext, path in paths.items():
            fm = FieldMap(path).read()
            nz, nx, ny = fm.nz + 1, fm.nx + 1, fm.ny + 1
            if fm.values is None or fm.values.size < nz * nx * ny:
                raise ValueError(f"{os.path.basename(path)}: {0 if fm.values is None else fm.values.size} values, "
                                 f"{nz * nx * ny} expected")
            v = fm.values[:nz * nx * ny]
            if fm.norm != 1:
                v = v * fm.norm
            maps[ext] = fm
            outer[ext] = v.reshape(nz, ny, nx)
            inner[ext] = np.transpose(v.reshape(nx, ny, nz), (2, 1, 0))
            if nz > 2 and nx * ny > 1:
                score[0] += _z_roughness(outer[ext])
                score[1] += _z_roughness(inner[ext])
        cubes = inner if score[1] < 0.9 * score[0] else outer
        hit = {}
        for ext, fm in maps.items():
            cube = cubes[ext]                                    # [z, y, x]
            x = np.linspace(fm.x_range[0], fm.x_range[1], fm.nx + 1)
            y = np.linspace(fm.y_range[0], fm.y_range[1], fm.ny + 1)
            row_y0 = _interp_axis(cube, y, axis=1)               # [z, x] at y = 0
            row_x0 = _interp_axis(cube, x, axis=2)               # [z, y] at x = 0
            hit[ext] = {
                "z": np.linspace(0.0, fm.length, fm.nz + 1), "length": fm.length,
                "axis": _interp_axis(row_y0, x, axis=1),
                "dx": _derivative_at_zero(row_y0, x), "dy": _derivative_at_zero(row_x0, y),
            }
        stale = {k for k in _MAP_CACHE if {item[1] for item in k} & {item[1] for item in key}}
        for old in stale:
            del _MAP_CACHE[old]
        _MAP_CACHE[key] = hit
        return hit


def _z_roughness(cube):
    """Second over first differences along z (scale free) on at most ~16×16 transverse points."""
    sub = cube[:, ::max(1, cube.shape[1] // 16), ::max(1, cube.shape[2] // 16)]
    d1 = np.abs(np.diff(sub, axis=0)).sum()
    return float(np.abs(np.diff(sub, 2, axis=0)).sum() / d1) if d1 > 0 else 0.0


def clear_cache():
    with _MAP_LOCK:
        _MAP_CACHE.clear()


def _bracket(grid):
    """``(i0, t)``: 0 lies at ``grid[i0] + t·(grid[i0+1] − grid[i0])``."""
    n = grid.size
    if n == 1 or grid[-1] == grid[0]:
        return 0, 0.0
    pos = (0.0 - grid[0]) / (grid[-1] - grid[0]) * (n - 1)
    i0 = min(max(int(math.floor(pos)), 0), n - 2)
    return i0, pos - i0


def _interp_axis(arr, grid, axis):
    if grid.size == 1:
        return np.take(arr, 0, axis=axis)
    i0, t = _bracket(grid)
    return (1 - t) * np.take(arr, i0, axis=axis) + t * np.take(arr, i0 + 1, axis=axis)


def _derivative_at_zero(rows, grid):
    """d/du at u = 0 of ``rows[:, u]`` (central difference when 0 is a grid node)."""
    n = grid.size
    if n < 2:
        return np.zeros(rows.shape[0])
    i0, t = _bracket(grid)
    if t > 1 - 1e-9:
        i0, t = i0 + 1, 0.0
    if t < 1e-9 and 0 < i0 < n - 1:
        return (rows[:, i0 + 1] - rows[:, i0 - 1]) / (grid[i0 + 1] - grid[i0 - 1])
    i0 = min(i0, n - 2)
    return (rows[:, i0 + 1] - rows[:, i0]) / (grid[i0 + 1] - grid[i0])


# =========================================================================== matrices
def drift_matrix(length, gamma=1.0):
    m = np.eye(6)
    m[0, 1] = m[2, 3] = length
    m[4, 5] = length / (gamma * gamma)
    return m


def _cs(k, length):
    """``C, S`` of u'' = −k·u over *length* (arrays), with ``u' → −k·S``."""
    k = np.asarray(k, dtype=float)
    length = np.broadcast_to(np.asarray(length, dtype=float), k.shape)
    r = np.sqrt(np.abs(k))
    x = r * length
    small = x < 1e-6
    rs = np.where(small, 1.0, r)
    c = np.where(k > 0, np.cos(x), np.cosh(x))
    s = np.where(k > 0, np.sin(x), np.sinh(x)) / rs
    c = np.where(small, 1.0 - k * length ** 2 / 2, c)
    s = np.where(small, length - k * length ** 3 / 6, s)
    return c, s


def quad_matrix(length, k, gamma=1.0):
    """Thick quadrupole, ``k = G/Bρ`` [1/m²] focusing in x when positive."""
    m = drift_matrix(length, gamma)
    for i, kk in ((0, k), (2, -k)):
        c, s = _cs(np.array([kk]), length)
        m[i:i + 2, i:i + 2] = [[c[0], s[0]], [-kk * s[0], c[0]]]
    return m


def _solenoid4(k, length):
    """Hard-edge solenoid 4×4 matrices (arrays), ``k = Bz/(2Bρ)`` [1/m]."""
    k = np.asarray(k, dtype=float)
    length = np.broadcast_to(np.asarray(length, dtype=float), k.shape)
    kl = k * length
    c, s = np.cos(kl), np.sin(kl)
    sk = np.where(np.abs(kl) > 1e-9, s / np.where(k == 0, 1.0, k), length)
    m = np.empty(k.shape + (4, 4))
    cc, sc = c * c, s * c
    m[..., 0, 0] = cc;         m[..., 0, 1] = c * sk;    m[..., 0, 2] = sc;        m[..., 0, 3] = s * sk
    m[..., 1, 0] = -k * sc;    m[..., 1, 1] = cc;        m[..., 1, 2] = -k * s * s; m[..., 1, 3] = sc
    m[..., 2, 0] = -sc;        m[..., 2, 1] = -s * sk;   m[..., 2, 2] = cc;        m[..., 2, 3] = c * sk
    m[..., 3, 0] = k * s * s;  m[..., 3, 1] = -sc;       m[..., 3, 2] = -k * sc;   m[..., 3, 3] = cc
    return m


def _solenoid_body4(k, length):
    """Uniform Bz without edge kicks (x'' = 2k·y', y'' = −2k·x'), arrays; the radial
    fringe field comes separately from the field-map gradients."""
    k = np.asarray(k, dtype=float)
    length = np.broadcast_to(np.asarray(length, dtype=float), k.shape)
    theta = 2 * k * length
    c, s = np.cos(theta), np.sin(theta)
    small = np.abs(theta) < 1e-6
    k2 = np.where(small, 1.0, 2 * k)
    s2 = np.where(small, length, s / k2)
    c2 = np.where(small, k * length * length, (1 - c) / k2)
    m = np.zeros(k.shape + (4, 4))
    m[..., 0, 0] = m[..., 2, 2] = 1.0
    m[..., 0, 1] = s2;   m[..., 0, 3] = c2
    m[..., 1, 1] = c;    m[..., 1, 3] = s
    m[..., 2, 1] = -c2;  m[..., 2, 3] = s2
    m[..., 3, 1] = -s;   m[..., 3, 3] = c
    return m


def solenoid_matrix(length, k, gamma=1.0):
    m = drift_matrix(length, gamma)
    m[:4, :4] = _solenoid4(np.array([k]), length)[0]
    return m


def bend_matrix(length, angle, n_index=0.0, plane=0, gamma=1.0):
    """Sector dipole over arc *length* bending by *angle* [rad] with field index *n_index*."""
    m = drift_matrix(length, gamma)
    if length <= 0:
        return m
    h = angle / length
    kb, kq = (1.0 - n_index) * h * h, n_index * h * h
    b, q = (0, 2) if int(plane) == 0 else (2, 0)
    c, s = (v[0] for v in _cs(np.array([kb]), length))
    if abs(kb * length * length) < 1e-6:
        one_c, l_s = length ** 2 / 2, length ** 3 / 6
    else:
        one_c, l_s = (1 - c) / kb, (length - s) / kb
    m[b:b + 2, b:b + 2] = [[c, s], [-kb * s, c]]
    m[b, 5], m[b + 1, 5] = h * one_c, h * s
    m[4, b], m[4, b + 1] = -h * s, -h * one_c
    m[4, 5] = length / (gamma * gamma) - h * h * l_s
    cq, sq = (v[0] for v in _cs(np.array([kq]), length))
    m[q:q + 2, q:q + 2] = [[cq, sq], [-kq * sq, cq]]
    return m


def edge_matrix(beta_deg, rho, gap=0.0, k1=0.0, k2=0.0, plane=0):
    """Thin pole-face rotation (TRANSPORT / TraceWin form with fringe correction)."""
    m = np.eye(6)
    if rho == 0:
        return m
    beta = math.radians(beta_deg)
    h = 1.0 / rho
    psi = k1 * gap * h * (1 + math.sin(beta) ** 2) / math.cos(beta) * (1 - k1 * k2 * gap * h * math.tan(beta))
    b, q = (0, 2) if int(plane) == 0 else (2, 0)
    m[b + 1, b] = h * math.tan(beta)
    m[q + 1, q] = -h * math.tan(beta - psi)
    return m


def _prefix_products(mats):
    """``P[i] = mats[i] @ ... @ mats[0]`` with O(log n) batched multiplications."""
    n = len(mats)
    if n == 1:
        return mats.copy()
    half = n // 2
    pq = _prefix_products(mats[1:2 * half:2] @ mats[0:2 * half:2])
    out = np.empty_like(mats)
    out[1:2 * half:2] = pq
    out[0] = mats[0]
    if n > 2:
        out[2::2] = mats[2::2] @ pq[:(n - 1) // 2]
    return out


# =========================================================================== helpers
class _Warnings:
    def __init__(self):
        self.items, self._seen = [], set()

    def add(self, en, zh, key=None):
        key = key or en
        if key not in self._seen:
            self._seen.add(key)
            self.items.append((en, zh))


def _kin(energy, mass):
    gamma = 1.0 + energy / mass
    bg = np.sqrt(np.maximum(gamma * gamma - 1.0, 0.0))
    return gamma, bg, bg / gamma, mass * bg


def _wrap(deg):
    return (deg + 180.0) % 360.0 - 180.0


def _to_int(text):
    try:
        return int(round(float(text)))
    except (TypeError, ValueError, OverflowError):
        return 0


def _half_axial_derivative(values, hf):
    """−½ ∂f/∂z per slice from slice-centre values that are zero outside the element.

    Uses differences of the boundary values with zeros beyond the section, so
    a field that does not vanish at the end of its map still gets its edge
    kick (∫ over the element is zero, like the fringe of a closed solenoid).
    """
    bounds = np.concatenate(([0.0], (values[:-1] + values[1:]) / 2, [0.0]))
    return -0.5 * np.diff(bounds) / hf


def _sections(doc, warn):
    """Active lattice as ``[("fields", [statements]) | ("matrix", statement)]`` in beam order."""
    out, items, block, block_lines = [], [], None, []

    def close():
        if items:
            out.append(("fields", list(items)))
        items.clear()

    for st in doc.statements:
        if not st.active:
            continue
        if st.spec is None:
            warn.add(f"Line {st.line_no + 1}: unknown keyword '{st.keyword}' ignored (zero length).",
                     f"第 {st.line_no + 1} 行：未知关键字“{st.keyword}”，已忽略（长度按 0 计）。", ("kw", st.key))
            continue
        if st.block is not None:
            if st.block != block:
                close()
                block, block_lines = st.block, []
            if st.key == "superpose":
                block_lines.append(st)
            elif st.is_element:
                if st.key == "field":
                    items.append(st)
                elif st.key not in ("drift", "steerer") and st.category != schema.DIAG:
                    warn.add(f"Line {st.line_no + 1}: '{st.keyword}' inside a superpose block is ignored by the preview.",
                             f"第 {st.line_no + 1} 行：叠加场中的“{st.keyword}”在预览中被忽略。")
            if st.key in ("superposeend", "superposeout"):
                if st.key == "superposeout" and any(to_float(v) != 0 for s in block_lines for v in s.params[1:6]):
                    warn.add(f"Line {st.line_no + 1}: superposeout offsets and rotations are ignored by the preview.",
                             f"第 {st.line_no + 1} 行：预览忽略 superposeout 的横向偏移和转角。")
                close()
                block = None
            continue
        if block is not None:
            close()
            block = None
        if not st.is_element:
            continue
        if st.key == "field":
            out.append(("fields", [st]))
        else:
            out.append(("matrix", st))
    close()
    return out


# =========================================================================== tracking
class _Tracker:
    """Reference particle and per-step 6×6 matrices through the lattice sections."""

    def __init__(self, mass, charge, energy, field_dirs, warn):
        self.mass, self.q, self.energy0 = mass, charge, energy
        self.z, self.t, self.w = 0.0, 0.0, energy
        self.dirs = field_dirs
        self.warn = warn
        self.stopped = False
        self.rf = {}                                   # line -> (phase_rf, phase_s)
        self._groups = {}
        # per-step lists (concatenated at the end)
        self.mats, self.z_end, self.w_end, self.h = [], [], [], []
        self.gamma, self.beta, self.aperture, self.line = [], [], [], []

    # ---------------------------------------------------------------- bookkeeping
    def _push(self, mats, z_end, w_end, h, w_mid, aperture, line):
        n = len(mats)
        g, _bg, b, _p = _kin(np.asarray(w_mid, dtype=float), self.mass)
        self.mats.append(np.asarray(mats))
        self.z_end.append(np.asarray(z_end, dtype=float))
        self.w_end.append(np.broadcast_to(np.asarray(w_end, dtype=float), (n,)))
        self.h.append(np.broadcast_to(np.asarray(h, dtype=float), (n,)))
        self.gamma.append(np.broadcast_to(g, (n,)))
        self.beta.append(np.broadcast_to(b, (n,)))
        self.aperture.append(np.broadcast_to(np.asarray(aperture, dtype=float), (n,)))
        self.line.append(np.broadcast_to(np.asarray(line), (n,)))

    def arrays(self):
        if not self.mats:
            return None
        cat = np.concatenate
        return {"mats": cat(self.mats), "z": cat(self.z_end), "w": cat(self.w_end), "h": cat(self.h),
                "gamma": cat(self.gamma), "beta": cat(self.beta), "aperture": cat(self.aperture),
                "line": cat(self.line)}

    def _gap(self, z0):
        if z0 > self.z + 1e-12:
            self.drift(z0 - self.z, 0.0, -1)

    # ---------------------------------------------------------------- matrix elements
    def drift(self, length, aperture, line):
        n = max(1, int(math.ceil(length / MATRIX_STEP - 1e-9)))
        g, _bg, b, _p = _kin(self.w, self.mass)
        m = drift_matrix(length / n, g)
        self._advance([m] * n, length, aperture, line, b)

    def _advance(self, mats, length, aperture, line, beta):
        n = len(mats)
        z = self.z + length * np.arange(1, n + 1) / n
        self._push(mats, z, self.w, length / n, self.w, aperture, line)
        self.z += length
        self.t += length / (beta * C_LIGHT)

    def matrix(self, st):
        self._gap(st.z_start)
        key, length, line = st.key, st.length, st.line_no
        aperture = to_float(st.param(1))
        g, _bg, b, p = _kin(self.w, self.mass)
        brho_inv = MEV_TM * self.q / p
        n = max(1, int(math.ceil(length / MATRIX_STEP - 1e-9)))
        h = length / n
        if key == "drift":
            self.drift(length, aperture, line)
        elif key == "quad":
            self._advance([quad_matrix(h, to_float(st.param(3)) * brho_inv, g)] * n, length, aperture, line, b)
        elif key == "solenoid":
            self._advance([solenoid_matrix(h, to_float(st.param(3)) * brho_inv / 2, g)] * n,
                          length, aperture, line, b)
        elif key == "bend":
            angle = math.radians(to_float(st.param(3))) / n
            m = bend_matrix(h, angle, to_float(st.param(5)), _to_int(st.param(6)), g)
            self._advance([m] * n, length, aperture, line, b)
        elif key == "edge":
            m = edge_matrix(to_float(st.param(3)), to_float(st.param(4)), to_float(st.param(5)),
                            to_float(st.param(6)), to_float(st.param(7)), _to_int(st.param(8)))
            self._push([m], [self.z], self.w, 0.0, self.w, aperture, line)
        elif length > 0:        # steerer / diagnostics have no length; anything else drifts
            self.drift(length, aperture, line)

    # ---------------------------------------------------------------- field maps
    def _find(self, base, ext):
        """``(path, stat)`` of ``base.ext`` in the first field directory holding it, or None."""
        for d in self.dirs:
            path = os.path.join(d, f"{base}.{ext}")
            try:
                info = os.stat(path)
            except (OSError, ValueError):
                continue
            if stat.S_ISREG(info.st_mode):
                return path, info
        return None

    def _load(self, st, exts, required=True):
        """``{ext: profile}`` of the files found; warns (when *required*) and returns {} when unusable."""
        base, line = st.param(8), st.line_no + 1
        key = (base, exts)
        if key not in self._groups:
            hits = {ext: self._find(base, ext) for ext in exts} if base else {}
            hits = {ext: hit for ext, hit in hits.items() if hit}
            paths = {ext: hit[0] for ext, hit in hits.items()}
            found = {}
            if paths:
                try:
                    found = _map_group(paths, {ext: hit[1] for ext, hit in hits.items()})
                except (OSError, ValueError, IndexError, struct.error) as exc:
                    self.warn.add(f"Line {line}: field map '{base}' could not be read ({exc}); treated as a drift.",
                                  f"第 {line} 行：无法读取场图“{base}”（{exc}），按漂移段处理。")
                    paths = None
            self._groups[key] = found
            if paths == {} and required:
                wanted = ",".join("." + e for e in exts)
                self.warn.add(f"Line {line}: field map '{base}' not found ({wanted}); treated as a drift.",
                              f"第 {line} 行：找不到场图“{base}”（{wanted}），按漂移段处理。", ("missing", base, exts))
        return self._groups[key]

    def _sample(self, prof, key, s, length):
        inside = (s >= 0) & (s <= min(length, prof["length"]) + 1e-12)
        return np.where(inside, np.interp(s, prof["z"], prof[key]), 0.0)

    def fields(self, stmts):
        z0 = min(st.z_start for st in stmts)
        z1 = max(st.z_end for st in stmts)
        self._gap(z0)
        z0 = max(z0, self.z)
        if z1 <= z0 + 1e-12:
            return
        # fine grid with every element boundary on a slice boundary
        cuts = sorted({z0, z1} | {min(max(v, z0), z1) for st in stmts for v in (st.z_start, st.z_end)})
        parts = []
        for a, b in zip(cuts[:-1], cuts[1:]):
            if b - a > 1e-12:
                n = max(1, int(math.ceil((b - a) / (FINE_STEP * SLICES_PER_KICK) - 1e-9))) * SLICES_PER_KICK
                parts.append(a + (b - a) * np.arange(n) / n)
        zb = np.append(np.concatenate(parts), z1)
        hf = np.diff(zb)
        zc = zb[:-1] + hf / 2
        nf = hf.size
        zeros = np.zeros(nf)

        ez_static = zeros.copy()
        e_grad = [zeros.copy() for _ in range(4)]           # static ∂Ex/∂x, ∂Ex/∂y, ∂Ey/∂y, ∂Ey/∂x
        b_grad = [zeros.copy() for _ in range(4)]           # ∂By/∂x, ∂By/∂y, ∂Bx/∂y, ∂Bx/∂x
        bz = zeros.copy()
        aperture = np.full(nf, np.inf)
        cavities = []
        for st in stmts:
            line = st.line_no + 1
            s = zc - st.z_start
            inside = (s >= 0) & (s <= st.length)
            radius = to_float(st.param(1))
            if radius > 0:
                aperture[inside] = np.minimum(aperture[inside], radius)
            ftype = st.field_type()
            ke, kb = to_float(st.param(6)), to_float(st.param(7))
            if ftype in ("1", "2"):
                exts = _RF_EXT if ftype == "1" else _ES_EXT
                prof = self._load(st, exts)
                if not prof:
                    continue
                ez_key, ex_key, ey_key = exts
                ez = self._sample(prof[ez_key], "axis", s, st.length) * ke if ez_key in prof else zeros.copy()
                if ex_key in prof and ey_key in prof:
                    grads = [self._sample(prof[ex_key], "dx", s, st.length), self._sample(prof[ex_key], "dy", s, st.length),
                             self._sample(prof[ey_key], "dy", s, st.length), self._sample(prof[ey_key], "dx", s, st.length)]
                    grads = [g * ke for g in grads]
                else:                                       # Maxwell: ∂Ex/∂x = ∂Ey/∂y = −½ ∂Ez/∂z
                    half = _half_axial_derivative(ez, hf)
                    grads = [half, zeros.copy(), half.copy(), zeros.copy()]
                if ftype == "2":
                    ez_static += ez
                    for acc, g in zip(e_grad, grads):
                        acc += g
                    continue
                bprof = self._load(st, _RFB_EXT, required=False) if kb else {}
                if "bdx" in bprof and "bdy" in bprof:     # RF magnetic field ∝ sin(phase)
                    bgrads = [self._sample(bprof[ext], key, s, st.length) * kb
                              for ext, key in (("bdy", "dx"), ("bdy", "dy"), ("bdx", "dy"), ("bdx", "dx"))]
                else:
                    bgrads = None
                v3 = _to_int(st.param(2))
                cavities.append({"line": st.line_no, "v3": v3, "omega": 2 * math.pi * to_float(st.param(4)),
                                 "phase": to_float(st.param(5)), "ez": ez, "grads": grads, "bgrads": bgrads,
                                 "i_in": int(np.argmin(np.abs(zb - st.z_start)))})
            elif ftype == "3":
                prof = self._load(st, _BS_EXT)
                if not prof:
                    continue
                bz_el = self._sample(prof["bsz"], "axis", s, st.length) * kb if "bsz" in prof else zeros
                bz += bz_el
                if "bsx" in prof and "bsy" in prof:
                    for acc, ext, key in zip(b_grad, ("bsy", "bsy", "bsx", "bsx"), ("dx", "dy", "dy", "dx")):
                        acc += self._sample(prof[ext], key, s, st.length) * kb
                else:                                       # Maxwell: ∂Bx/∂x = ∂By/∂y = −½ ∂Bz/∂z
                    half = _half_axial_derivative(bz_el, hf)
                    b_grad[1] += half
                    b_grad[3] += half
                self._dipole_check(st, prof, kb)
            else:
                self.warn.add(f"Line {line}: field type '{st.param(3)}' is not supported; treated as a drift.",
                              f"第 {line} 行：不支持的场类型“{st.param(3)}”，按漂移段处理。")

        wb, tb, stop = self._reference(zb, hf, ez_static, cavities)
        if stop is not None:                                # reference particle stopped: keep the slices before
            keep = (stop // SLICES_PER_KICK) * SLICES_PER_KICK
            self.warn.add(f"The reference particle stops at z = {zb[stop]:.3f} m; the preview ends there.",
                          f"参考粒子在 z = {zb[stop]:.3f} m 处停止，预览到此为止。", "stop")
            self.stopped = True
            if keep == 0:
                return
            zb, hf, zc, wb, tb = zb[:keep + 1], hf[:keep], zc[:keep], wb[:keep + 1], tb[:keep + 1]
            ez_static, bz, aperture = ez_static[:keep], bz[:keep], aperture[:keep]
            e_grad = [g[:keep] for g in e_grad]
            b_grad = [g[:keep] for g in b_grad]
            for cav in cavities:
                for key in ("ez", "rel", "sinc", "weight"):
                    cav[key] = cav[key][:keep]
                cav["grads"] = [g[:keep] for g in cav["grads"]]
                cav["bgrads"] = cav["bgrads"] and [g[:keep] for g in cav["bgrads"]]
            nf = keep
        self._field_steps(zb, hf, wb, e_grad, b_grad, bz, aperture, cavities, stmts[0].line_no)
        self.z, self.t, self.w = float(zb[-1]), float(tb[-1]), float(wb[-1])

    def _dipole_check(self, st, prof, kb):
        _g, _bg, _b, p = _kin(self.w, self.mass)
        worst = 0.0
        for ext in ("bsx", "bsy"):
            if ext in prof:
                pr = prof[ext]
                mask = pr["z"] <= st.length + 1e-12
                if mask.sum() > 1:
                    worst = max(worst, abs(_trapezoid(pr["axis"][mask], pr["z"][mask])))
        angle = worst * abs(kb) * MEV_TM * abs(self.q) / p
        if angle > 1e-3:
            self.warn.add(
                f"Line {st.line_no + 1}: field map '{st.param(8)}' deflects the beam by about {angle * 1e3:.1f} mrad; "
                "steering and bending are not modelled.",
                f"第 {st.line_no + 1} 行：场图“{st.param(8)}”使束流偏转约 {angle * 1e3:.1f} mrad，预览不计偏转。")

    def _reference(self, zb, hf, ez_static, cavities):
        """W and t on the fine boundaries; V3 = 0 phases solved on the way.  Returns ``(wb, tb, stop_index)``."""
        mass, q = self.mass, self.q
        nf = hf.size
        wc = np.full(nf, self.w)
        wb = tb = None
        for _it in range(MAX_ITER):
            _g, _bg, beta, _p = _kin(wc, mass)
            dt = hf / (np.maximum(beta, 1e-12) * C_LIGHT)
            tb = self.t + np.concatenate(([0.0], np.cumsum(dt)))
            tc = tb[:-1] + dt / 2
            dw = q * hf * ez_static
            for cav in cavities:
                omega = cav["omega"]
                rel = omega * (tc - tb[cav["i_in"]])
                cav["sinc"] = np.sinc(omega * dt / (2 * math.pi))    # phase slip inside one slice
                weight = cav["ez"] * hf * cav["sinc"]
                if cav["v3"] == 0:
                    a, b = np.dot(weight, np.cos(rel)), np.dot(weight, np.sin(rel))
                    phi0 = math.radians(cav["phase"]) - math.atan2(b, a) if (a or b) else math.radians(cav["phase"])
                    cav["no_field"] = not (a or b)
                elif cav["v3"] == 2:
                    phi0 = math.radians(cav["phase"]) + omega * tb[cav["i_in"]]
                else:
                    phi0 = math.radians(cav["phase"])
                cav["phi0"], cav["rel"], cav["weight"] = phi0, rel, weight
                dw = dw + q * weight * np.cos(rel + phi0)
            wb = self.w + np.concatenate(([0.0], np.cumsum(dw)))
            if not np.all(wb[1:] > 0):
                break
            new = (wb[:-1] + wb[1:]) / 2
            done = np.max(np.abs(new - wc)) < ENERGY_TOL * self.w
            wc = new
            if done:
                break
        bad = np.nonzero(~(wb > 0))[0]
        stop = int(bad[0]) - 1 if bad.size else None
        for cav in cavities:
            phase = cav["rel"] + cav["phi0"]
            s, c = np.dot(cav["weight"], np.sin(phase)), np.dot(cav["weight"], np.cos(phase))
            phase_s = math.degrees(math.atan2(s, c)) if (s or c) else None
            self.rf[cav["line"]] = (_wrap(math.degrees(cav["phi0"])), phase_s)
            if cav.get("no_field"):
                self.warn.add(f"Line {cav['line'] + 1}: no accelerating field, the synchronous phase cannot be set; "
                              "the phase is used as entry phase.",
                              f"第 {cav['line'] + 1} 行：没有加速场，无法设置同步相位，相位按入口相位处理。")
        return wb, tb, (max(stop, 0) if stop is not None else None)

    def _field_steps(self, zb, hf, wb, e_grad, b_grad, bz, aperture, cavities, line):
        """Merge fine slices into kick slices and build their 6×6 matrices."""
        q, mass, k = self.q, self.mass, SLICES_PER_KICK
        wc = (wb[:-1] + wb[1:]) / 2
        _g, _bg, beta, p = _kin(wc, mass)
        ex = [g.copy() for g in e_grad]
        bx = [g.copy() for g in b_grad]
        ez_sin = np.zeros_like(hf)
        for cav in cavities:
            phase = cav["rel"] + cav["phi0"]
            sin, sinc = np.sin(phase), cav["sinc"]
            cos_w, sin_w = np.cos(phase) * sinc, sin * sinc
            for acc, g in zip(ex, cav["grads"]):
                acc += g * cos_w
            for acc, g in zip(bx, cav["bgrads"] or ()):
                acc += g * sin_w
            ez_sin += cav["ez"] * sin_w * cav["omega"]
        e_fac = q * hf / (beta * p)
        b_fac = q * hf * MEV_TM / p
        fine = [e_fac * ex[0] - b_fac * bx[0], e_fac * ex[1] - b_fac * bx[1],
                e_fac * ex[2] + b_fac * bx[2], e_fac * ex[3] + b_fac * bx[3],
                q * hf * ez_sin / (beta * beta * C_LIGHT * p)]
        n = hf.size // k

        def merge(a):
            return a[:n * k].reshape(n, k).sum(axis=1)

        axx, axy, ayy, ayx, azz = (merge(a) for a in fine)
        h = merge(hf)
        ksol = merge(q * MEV_TM * bz / (2 * p) * hf) / h
        zb_c = zb[::k][:n + 1]
        wb_c = wb[::k][:n + 1]
        gb, _bgb, bb, pb = _kin(wb_c, mass)
        wmid = merge(wc * hf) / h
        gm, _bgm, _bm, _pm = _kin(wmid, mass)

        half = np.zeros((n, 6, 6))
        half[:, :4, :4] = _solenoid_body4(ksol, h / 2)
        half[:, 4, 4] = half[:, 5, 5] = 1.0
        half[:, 4, 5] = h / 2 / (gm * gm)
        kick = np.zeros((n, 6, 6))
        kick[:, 0, 0] = kick[:, 2, 2] = 1.0
        r = pb[:-1] / pb[1:]
        kick[:, 1, 1] = kick[:, 3, 3] = r
        kick[:, 1, 0], kick[:, 1, 2] = r * axx, r * axy
        kick[:, 3, 2], kick[:, 3, 0] = r * ayy, r * ayx
        kick[:, 4, 4] = bb[1:] / bb[:-1]                      # fixed-time bunch length follows β
        rd = (bb[:-1] * pb[:-1]) / (bb[1:] * pb[1:])          # δ of a fixed energy offset
        kick[:, 5, 5] = rd
        kick[:, 5, 4] = rd * azz
        mats = half @ kick @ half
        ap = aperture[:n * k].reshape(n, k).min(axis=1)
        ap = np.where(np.isfinite(ap), ap, 0.0)
        self._push(mats, zb_c[1:], wb_c[1:], h, wmid, ap, line)


# =========================================================================== propagation
def _space_charge_setup(beam, mass, charge, steps, warn, requested):
    current = float(beam.get("current") or 0.0) * 1e-3
    if requested is None:
        requested = current > 0
    if not requested or current <= 0:
        return None
    g, b, h = steps["gamma"], steps["beta"], steps["h"]
    mc2 = mass * 1e6
    if beam.get("dc"):
        return {"dc": True, "c": charge * current * h / (math.pi * EPS0 * C_LIGHT * b ** 3 * g ** 3 * mc2)}
    freq = float(beam.get("frequency") or 0.0)
    twiss_z = (beam.get("twiss") or {}).get("z")
    if freq <= 0 or twiss_z is None or not float(twiss_z[2]) > 0 or not float(twiss_z[1]) > 0:
        warn.add("Space charge needs the beam frequency and the z Twiss parameters; it is left out.",
                 "空间电荷需要束流频率和 z 方向 Twiss 参数，预览中未计入。")
        return None
    bunch = current / freq
    base = 3 * charge * bunch * h / (4 * math.pi * EPS0 * b * b * mc2)
    return {"dc": False, "t": base / g ** 3, "l": base / g, "gamma": g}


def _longitudinal_factor(p):
    """Depolarisation factor Mz of a spheroid with (rest-frame) length / radius ratio *p*."""
    if abs(p - 1.0) < 1e-6:
        return 1.0 / 3.0
    if p > 1e6:                                   # needle
        return (math.log(2 * p) - 1) / (p * p)
    if p < 1e-6:                                  # pancake
        return 1.0
    if p > 1.0:
        e = math.sqrt(1.0 - 1.0 / (p * p))
        return (1.0 - e * e) / e ** 3 * (math.atanh(e) - e)
    e = math.sqrt(1.0 / (p * p) - 1.0)
    return (1.0 + e * e) / e ** 3 * (e - math.atan(e))


def _propagate_sc(mats, sigma0, sc, group=None):
    """Propagation with linear space-charge kicks.

    The steps are taken in groups; one kick with the strength integrated over
    the group is applied in its middle (second-order splitting).  Moments
    inside a group are rebuilt afterwards with batched products, so the output
    keeps the full step resolution.
    """
    group = max(1, int(group or SC_GROUP))
    n = len(mats)
    n_groups = -(-n // group)
    pad = n_groups * group - n
    coef = {k: np.concatenate([np.asarray(v, dtype=float), np.zeros(pad)]) for k, v in sc.items() if k != "dc"}
    if pad:
        mats = np.concatenate([mats, np.broadcast_to(np.eye(6), (pad, 6, 6))])
    blocks = mats.reshape(n_groups, group, 6, 6)
    first = max(1, group // 2)                         # steps before the kick
    part = np.empty_like(blocks)                       # products from the group start / from the kick on
    part[:, 0] = blocks[:, 0]
    for j in range(1, group):
        part[:, j] = blocks[:, j] @ (part[:, j - 1] if j != first else np.eye(6))
    before = part[:, first - 1]
    after = part[:, -1] if first < group else np.broadcast_to(np.eye(6), (n_groups, 6, 6))

    def summed(key):
        return coef[key].reshape(n_groups, group).sum(axis=1)

    dc = sc["dc"]
    if dc:
        c_dc = summed("c")
    else:
        c_t, c_l = summed("t"), summed("l")
        gamma = np.maximum(coef["gamma"].reshape(n_groups, group).max(axis=1), 1.0)
    starts = np.full((n_groups, 6, 6), np.nan)
    kicked = np.full((n_groups, 6, 6), np.nan)
    kick = np.eye(6)
    sigma = sigma0.copy()
    sqrt5 = math.sqrt(5.0)
    for i in range(n_groups):
        starts[i] = sigma
        sigma = before[i] @ sigma @ before[i].T
        sx2, sy2, sz2 = sigma[0, 0], sigma[2, 2], sigma[4, 4]
        if not (0 <= sx2 < BLOWUP and 0 <= sy2 < BLOWUP and math.isfinite(sz2)):
            break
        sx, sy = math.sqrt(sx2), math.sqrt(sy2)
        if sx > 0 and sy > 0:
            if dc:
                kick[1, 0] = c_dc[i] / (2 * sx * (2 * sx + 2 * sy))
                kick[3, 2] = c_dc[i] / (2 * sy * (2 * sx + 2 * sy))
            elif sz2 > 0:
                a, b, cz = sqrt5 * sx, sqrt5 * sy, sqrt5 * math.sqrt(sz2)
                mz = _longitudinal_factor(gamma[i] * cz / math.sqrt(a * b))
                inv = 1.0 / (a * b * cz)
                kick[1, 0] = c_t[i] * (1 - mz) * b / (a + b) * inv
                kick[3, 2] = c_t[i] * (1 - mz) * a / (a + b) * inv
                kick[5, 4] = c_l[i] * mz * inv
            sigma = kick @ sigma @ kick.T
        kicked[i] = sigma
        sigma = after[i] @ sigma @ after[i].T
    head = part[:, :first] @ starts[:, None] @ part[:, :first].transpose(0, 1, 3, 2)
    tail = part[:, first:] @ kicked[:, None] @ part[:, first:].transpose(0, 1, 3, 2)
    full = np.concatenate([head, tail], axis=1).reshape(-1, 6, 6)[:n]
    return np.stack([full[:, 0, 0], full[:, 2, 2], full[:, 4, 4]], axis=1)


# =========================================================================== public entry
class _PreviewDocument(LatticeDocument):
    """LatticeDocument without the editor's validation pass, which the preview does not use."""

    def _validate(self):
        pass


def _track(lattice_text, beam, field_dirs):
    """Parse, check and build the per-step matrices: ``(doc, tracker, warnings)``."""
    mass, energy, charge = _check_beam(beam)
    if isinstance(lattice_text, LatticeDocument):
        doc = lattice_text
    else:
        doc = _PreviewDocument(lattice_text or "")
    if not any(st.key == "start" for st in doc.statements):
        raise PreviewError("The lattice has no 'start' line.")
    if isinstance(field_dirs, (str, os.PathLike)):
        field_dirs = [field_dirs]
    warn = _Warnings()
    for en, zh in beam.get("warnings") or ():
        warn.add(en, zh)
    tracker = _Tracker(mass, charge, energy, [os.fspath(d) for d in (field_dirs or ()) if d], warn)
    with np.errstate(all="ignore"):
        for kind, item in _sections(doc, warn):
            if kind == "fields":
                tracker.fields(item)
            else:
                tracker.matrix(item)
            if tracker.stopped:
                break
    return doc, tracker, warn


def linear_preview(lattice_text, beam, field_dirs, space_charge=None, max_points=3000):
    """Linear envelope of *lattice_text* (the editor text) for *beam* (see :func:`read_beam`).

    *field_dirs*: directory or list of directories searched for field maps.
    *space_charge*: None = on when the beam current is positive.

    Returns plain data: ``z`` [m], ``rms_x``, ``rms_y``, ``rms_z`` [mm],
    ``energy`` [MeV] (numpy arrays, at most *max_points* points), ``elements``
    (one dict per active element: line, key, name, z0, z1, w_in, w_out,
    phase_rf, phase_s, aperture), ``warnings`` [(en, zh)] and ``model``.
    Raises :class:`PreviewError` only for unusable input.
    """
    started = time.perf_counter()
    doc, tracker, warn = _track(lattice_text, beam, field_dirs)
    mass, energy, charge = tracker.mass, tracker.energy0, tracker.q
    _g0, bg0, _b0, _p0 = _kin(energy, mass)
    sigma0 = _sigma0(beam, float(bg0))
    steps = tracker.arrays()
    sc = None
    with np.errstate(all="ignore"):
        if steps is None:
            z = np.array([0.0])
            w = np.array([energy])
            diag = np.array([[sigma0[0, 0], sigma0[2, 2], sigma0[4, 4]]])
            lines = np.array([-1])
            aperture = np.array([0.0])
        else:
            sc = _space_charge_setup(beam, mass, charge, steps, warn, space_charge)
            if sc is None:
                prod = _prefix_products(steps["mats"])
                sig = prod @ sigma0 @ prod.transpose(0, 2, 1)
                diag = np.stack([sig[:, 0, 0], sig[:, 2, 2], sig[:, 4, 4]], axis=1)
            else:
                diag = _propagate_sc(steps["mats"], sigma0, sc)
            diag = np.vstack([[sigma0[0, 0], sigma0[2, 2], sigma0[4, 4]], diag])
            z = np.concatenate(([0.0], steps["z"]))
            w = np.concatenate(([energy], steps["w"]))
            lines = np.concatenate(([-1], steps["line"]))
            aperture = np.concatenate(([0.0], steps["aperture"]))
        # beam blow-up / NaN: cut the curves there
        bad = ~(np.isfinite(diag).all(axis=1) & (diag[:, 0] >= 0) & (diag[:, 1] >= 0)
                & (diag[:, 0] < BLOWUP) & (diag[:, 1] < BLOWUP))
    if bad.any():
        cut = int(np.argmax(bad))
        warn.add(f"The envelope diverges at z = {z[max(cut, 0)]:.3f} m; the preview ends there.",
                 f"包络在 z = {z[max(cut, 0)]:.3f} m 处发散，预览到此为止。", "blowup")
        cut = max(cut, 1)
        z, w, diag, lines, aperture = z[:cut], w[:cut], diag[:cut], lines[:cut], aperture[:cut]
    rms = np.sqrt(np.maximum(diag, 0.0)) * 1e3                # mm

    over = (aperture > 0) & (APERTURE_SIGMAS * np.maximum(rms[:, 0], rms[:, 1]) > aperture * 1e3)
    if over.any():
        i = int(np.argmax(over))
        where = f" (line {lines[i] + 1})" if lines[i] >= 0 else ""
        where_zh = f"（第 {lines[i] + 1} 行）" if lines[i] >= 0 else ""
        warn.add(f"3 × rms beam size exceeds the aperture at z = {z[i]:.3f} m{where}; expect losses.",
                 f"在 z = {z[i]:.3f} m{where_zh} 处 3 倍 rms 束流尺寸超过孔径，可能有束损。")

    z_end = float(z[-1])
    elements = []
    for st in doc.elements():
        inside = st.z_start is not None and st.z_start <= z_end + 1e-9
        rf = tracker.rf.get(st.line_no)
        elements.append({
            "line": st.line_no, "key": st.key, "name": st.name, "z0": st.z_start, "z1": st.z_end,
            "w_in": float(np.interp(st.z_start, z, w)) if inside else None,
            "w_out": float(np.interp(st.z_end, z, w)) if inside and st.z_end <= z_end + 1e-9 else None,
            "phase_rf": rf[0] if rf else None, "phase_s": rf[1] if rf else None,
            "aperture": to_float(st.param(1)) if st.key in _APERTURE_KEYS else None,
        })

    n_steps = len(z) - 1
    if len(z) > max(int(max_points), 2):
        idx = np.unique(np.round(np.linspace(0, len(z) - 1, int(max_points))).astype(int))
        z, w, rms = z[idx], w[idx], rms[idx]
    return {
        "z": z, "rms_x": rms[:, 0], "rms_y": rms[:, 1], "rms_z": rms[:, 2], "energy": w,
        "elements": elements, "warnings": warn.items,
        "model": {"space_charge": sc is not None, "elapsed_ms": (time.perf_counter() - started) * 1e3,
                  "slices": n_steps},
    }
