"""The linear model as an object: build once, evaluate with knobs, errors and a beam centroid.

:class:`LinearModel` holds a lattice, a beam and the field-map directories;
:meth:`LinearModel.evaluate` returns a :class:`ModelResult` with the full
resolution of the model in SI units (m, rad, MeV; δ = Δp/p).  The editor's
:func:`avas.sim.linear_optics.linear_preview` is :meth:`ModelResult.preview`
of a fresh model.

Centroid (first moments) and second moments are kept apart: every step is
the affine map ``x → M·x + d``.  The constant ``d`` comes from steerers,
element offsets and the on-axis transverse fields of maps; it moves the
centroid only.  The moments about the centroid follow ``M·Σ·Mᵀ`` with the
linear space-charge kicks, which act about the beam centre and leave the
centroid alone.  Changing a lattice parameter (a *knob*) changes the design:
the reference particle is tracked again.  Offsets and rolls (*errors*) and
steerers are deviations from the design: the reference stays.

The centroid conventions (steerer kick direction, units and length, first-order
transport, the deflection by the on-axis fields of maps) were checked against
single-particle engine runs on 2026-11-03 (``info["centroid_checked"]``).  Off-axis, the engine follows a map's own
transverse fields, which the model reduces to their linear part on the axis.
"""
import math
import os
import time

import numpy as np

from avas import paths
from avas.data import lattice_edit, schema
from avas.data.lattice_doc import LatticeDocument, format_statement, to_float
from avas.model.beam import _check_beam, _sigma0, read_beam
from avas.model.common import BLOWUP, MEV_TM, PreviewError, _kin, _to_int, _Warnings
from avas.model.elements import _prefix_products
from avas.model.spacecharge import _propagate_sc, _space_charge_setup
from avas.model.tracker import _APERTURE_KEYS, SectionCache, _PreviewDocument, _track

APERTURE_SIGMAS = 3.0
PLANES = {"x": 0, "y": 2, "z": 4}
ERROR_KEYS = ("dx", "dy", "roll")


class ModelError(PreviewError):
    """A knob, error or address does not fit the lattice (message for the user)."""


# =========================================================================== model
class LinearModel:
    """A lattice with its beam and field maps, evaluated by the linear model.

    *lattice*: lattice text.  *beam*: dict of :func:`avas.model.beam.read_beam`.
    *field_dirs*: directory or directories searched for field maps.
    *centroid*: track the centroid (steerers, offsets, map dipoles); False keeps it at zero.
    *map_dipoles*: let the on-axis transverse fields of maps steer the centroid.
    *cache_size*: field-map sections kept between evaluations (:class:`SectionCache`), so
    changing a quadrupole re-tracks only the cheap parts; 0 = no cache.  The field-map
    files are read once: make a new model after changing them on disk.
    """

    def __init__(self, lattice, beam, field_dirs=(), centroid=True, map_dipoles=True, cache_size=256):
        if isinstance(lattice, LatticeDocument):
            self.text, self._doc = None, lattice
        else:
            self.text, self._doc = lattice or "", None
        self.beam = dict(beam or {})
        if isinstance(field_dirs, (str, os.PathLike)):
            field_dirs = [field_dirs]
        self.field_dirs = [os.fspath(d) for d in field_dirs or () if d]
        self.track_centroid = centroid
        self.map_dipoles = centroid and map_dipoles
        self.cache = SectionCache(cache_size) if cache_size else None

    @classmethod
    def from_project(cls, project, lattice=None, **kwargs):
        """Model of a project folder (or its InputFile): the run lattice (``ini.ini``) unless *lattice*
        names another file of InputFile, beam.txt and the project's field-map directories."""
        project = os.fspath(project)
        input_dir = os.path.join(project, "InputFile")
        if not os.path.isfile(os.path.join(input_dir, "beam.txt")):
            input_dir = project
        path = paths.lattice_source_path(input_dir) if lattice is None else (
            lattice if os.path.isabs(lattice) else os.path.join(input_dir, lattice))
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        return cls(text, read_beam(input_dir), paths.field_dirs(input_dir), **kwargs)

    @property
    def doc(self):
        """The parsed lattice (without knobs)."""
        if self._doc is None:
            self._doc = _PreviewDocument(self.text)
        return self._doc

    def with_knobs(self, knobs):
        """Lattice text with *knobs* applied: ``{target: {param: value}}``, target and param addressed as in
        :mod:`avas.data.lattice_edit` (name, 1-based line, ``{"index": n}``; parameter key or position)."""
        if self.text is None:
            raise ModelError("Knobs need the lattice text, not a parsed document.")
        changed = {}                                     # line → (statement, parameters)
        try:
            for target, values in (knobs or {}).items():
                if not isinstance(values, dict):
                    raise ModelError(f"Knob '{target}': give {{parameter: value}}.")
                st = lattice_edit.resolve(self.doc, _address(target))
                params = changed.get(st.line_no, (st, list(st.params)))[1]
                for param, value in values.items():
                    k = lattice_edit.param_index(st, param)
                    while len(params) <= k:
                        params.append("0")
                    params[k] = lattice_edit.check_value(st, k, value)
                changed[st.line_no] = (st, params)
        except lattice_edit.LatticeEditError as exc:
            raise ModelError(str(exc)) from None
        return lattice_edit.replace_lines(self.text, {line: format_statement(st, params=params)
                                                      for line, (st, params) in changed.items()})

    def evaluate(self, space_charge=None, knobs=None, errors=None, centroid0=None, beam=None, sigma0=None):
        """Track the beam: returns a :class:`ModelResult`.

        *space_charge*: None = on when the beam current is positive.
        *knobs*: lattice parameters to change, see :meth:`with_knobs`.
        *errors*: ``{target: {"dx": m, "dy": m, "roll": rad}}``: the element is moved by (dx, dy) and
        turned by *roll* about the beam axis (positive from x towards y).
        *centroid0*: initial centroid (x, x', y, y', z, δ) in m, rad and Δp/p.
        *beam*: values replacing those of the model's beam (``{"current": 5.0}``).
        *sigma0*: initial second moments (6×6, m and rad) instead of the beam's Twiss parameters.
        """
        started = time.perf_counter()
        doc = _PreviewDocument(self.with_knobs(knobs)) if knobs else self.doc
        beam = dict(self.beam, **(beam or {}))
        doc, tracker, warn = _track(doc, beam, self.field_dirs, self.cache, self.map_dipoles)
        mass, energy, charge = _check_beam(beam)
        _g0, bg0, _b0, _p0 = _kin(energy, mass)
        sigma0 = _sigma0(beam, float(bg0)) if sigma0 is None else np.array(sigma0, dtype=float).reshape(6, 6)
        c0 = np.zeros(6) if centroid0 is None else np.asarray(centroid0, dtype=float).reshape(6)
        steps = tracker.arrays()
        sc = None
        with np.errstate(all="ignore"):
            if steps is None:
                z, w = np.array([0.0]), np.array([energy])
                sigma, centroid = sigma0[None].copy(), c0[None].copy()
                lines, aperture = np.array([-1]), np.array([0.0])
                mats = effective = np.zeros((0, 6, 6))
                d = np.zeros((0, 6))
                gamma_s = beta_s = h_s = np.zeros(0)
            else:
                _apply_errors(doc, steps, errors or {})
                if self.track_centroid:
                    _apply_steerers(doc, steps, mass, charge)
                mats, d = steps["mats"], steps["d"]
                sc = _space_charge_setup(beam, mass, charge, steps, warn, space_charge)
                if sc is None:
                    prod = _prefix_products(mats)
                    full, effective = prod @ sigma0 @ prod.transpose(0, 2, 1), mats
                else:
                    full, effective = _propagate_sc(mats, sigma0, sc)
                sigma = np.concatenate([sigma0[None], full])
                centroid = np.concatenate([c0[None], _centroid(mats, d, c0)])
                z = np.concatenate(([0.0], steps["z"]))
                w = np.concatenate(([energy], steps["w"]))
                lines = np.concatenate(([-1], steps["line"]))
                aperture = np.concatenate(([0.0], steps["aperture"]))
                gamma_s, beta_s, h_s = steps["gamma"], steps["beta"], steps["h"]
            # beam blow-up / NaN: cut the curves there
            diag = np.stack([sigma[:, 0, 0], sigma[:, 2, 2], sigma[:, 4, 4]], axis=1)
            bad = ~(np.isfinite(diag).all(axis=1) & (diag[:, 0] >= 0) & (diag[:, 1] >= 0)
                    & (diag[:, 0] < BLOWUP) & (diag[:, 1] < BLOWUP))
        if bad.any():
            cut = int(np.argmax(bad))
            warn.add(f"The envelope diverges at z = {z[max(cut, 0)]:.3f} m; the preview ends there.",
                     f"包络在 z = {z[max(cut, 0)]:.3f} m 处发散，预览到此为止。", "blowup")
            cut = max(cut, 1)
            z, w, sigma, centroid, lines, aperture = (a[:cut] for a in (z, w, sigma, centroid, lines, aperture))
            mats, effective, d, gamma_s, beta_s, h_s = (a[:cut - 1] for a in (mats, effective, d, gamma_s, beta_s, h_s))
        rms = np.sqrt(np.maximum(np.stack([sigma[:, 0, 0], sigma[:, 2, 2]], axis=1), 0.0)) * 1e3   # mm

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
        info = {"space_charge": sc is not None, "elapsed_ms": (time.perf_counter() - started) * 1e3,
                "slices": len(z) - 1, "centroid": self.track_centroid, "map_dipoles": self.map_dipoles,
                "centroid_checked": True}
        if self.cache is not None:
            info["cache"] = {"hits": self.cache.hits, "misses": self.cache.misses}
        return ModelResult(doc=doc, beam=beam, mass=mass, charge=charge, z=z, energy=w, sigma=sigma,
                           centroid=centroid, mats=mats, effective=effective, d=d, step_gamma=gamma_s,
                           step_beta=beta_s, step_h=h_s, line=lines, aperture=aperture, elements=elements,
                           rf=dict(tracker.rf), warnings=warn.items, info=info)


def _address(target):
    """Lattice address for :func:`lattice_edit.resolve`: names stay names, numbers are 1-based lines."""
    if isinstance(target, str) and not target.strip().isdigit():
        return {"name": target}
    return target


def _rotation(theta):
    """6×6 rotation of (x, x', y, y') into the frame of an element turned by *theta* about z."""
    c, s = math.cos(theta), math.sin(theta)
    r = np.eye(6)
    r[0, 0] = r[1, 1] = r[2, 2] = r[3, 3] = c
    r[0, 2] = r[1, 3] = s
    r[2, 0] = r[3, 1] = -s
    return r


def _section_line(doc, st):
    """Line number the steps of *st* carry: field maps of a superpose block share the first one's."""
    if st.block is None:
        return st.line_no
    fields = [s for s in doc.statements if s.active and s.block == st.block and s.key == "field"]
    if st.key != "field" or not fields:
        raise ModelError(f"Line {st.line_no + 1}: offsets of a {st.keyword} inside a superpose block are not "
                         "modelled.")
    if len(fields) > 1:
        raise ModelError(f"Line {st.line_no + 1}: the field maps of a superpose block are summed before the "
                         "model slices them; an offset of one of them is not modelled.")
    return fields[0].line_no


def _apply_errors(doc, steps, errors):
    """Fold element offsets and rolls into the step matrices and constants (in place)."""
    mats, d, line = steps["mats"], steps["d"], steps["line"]
    for target, err in errors.items():
        try:
            st = lattice_edit.resolve(doc, _address(target))
        except lattice_edit.LatticeEditError as exc:
            raise ModelError(str(exc)) from None
        unknown = set(err) - set(ERROR_KEYS)
        if unknown:
            raise ModelError(f"Unknown error {sorted(unknown)} for '{target}'; use {', '.join(ERROR_KEYS)}.")
        mask = line == _section_line(doc, st)
        if not mask.any():
            raise ModelError(f"'{target}' (line {st.line_no + 1}) has no length inside the simulated part.")
        theta = float(err.get("roll", 0.0))
        if theta:
            r = _rotation(theta)
            mats[mask] = r.T @ mats[mask] @ r
            d[mask] = d[mask] @ r                         # r.T @ d for each step
        shift = np.zeros(6)
        shift[0], shift[2] = float(err.get("dx", 0.0)), float(err.get("dy", 0.0))
        if shift.any():
            d[mask] += shift - mats[mask] @ shift


def _apply_steerers(doc, steps, mass, charge):
    """Kicks of the lattice's steerers in the step constants (in place).

    A steerer has no length; its field acts uniformly over the next element (schema: "acts over the
    next element, centred on it").  The kick of each step is split into halves at its two ends.
    """
    statements = [s for s in doc.statements if s.active]
    z_end, h, mats, d = steps["z"], steps["h"], steps["mats"], steps["d"]
    p = mass * steps["gamma"] * steps["beta"]
    for i, st in enumerate(statements):
        if st.key != "steerer":
            continue
        b1, b2 = to_float(st.param(3)), to_float(st.param(4))
        if not (b1 or b2):
            continue
        nxt = next((s for s in statements[i + 1:] if s.is_element and s.key not in ("steerer", "edge")
                    and s.category != schema.DIAG and s.length > 0), None)
        if nxt is None:
            continue
        overlap = np.clip(np.minimum(z_end, nxt.z_end) - np.maximum(z_end - h, nxt.z_start), 0.0, None)
        if _to_int(st.param(5)) == 1:                    # electric, V/m
            f = charge * 1e-6 * overlap / (steps["beta"] * p)
            kx, ky = f * b1, f * b2
        else:                                             # magnetic, T: F = q v × B
            f = charge * MEV_TM * overlap / p
            kx, ky = -f * b2, f * b1
        kick = np.zeros((len(h), 6))
        kick[:, 1], kick[:, 3] = kx / 2, ky / 2
        d += kick + np.einsum("nij,nj->ni", mats, kick)


def _centroid(mats, d, c0):
    """Centroid after every step of ``x → M·x + d`` from *c0*."""
    n = len(mats)
    if not d.any() and not c0.any():
        return np.zeros((n, 6))
    a = np.zeros((n, 7, 7))
    a[:, :6, :6], a[:, :6, 6], a[:, 6, 6] = mats, d, 1.0
    prod = _prefix_products(a)
    return prod[:, :6, :6] @ c0 + prod[:, :6, 6]


# =========================================================================== result
class ModelResult:
    """Output of :meth:`LinearModel.evaluate`.  Arrays have one entry per point (the start and the end of
    every step, ``len(z)``) or per step (``mats``, ``effective``, ``d``: ``len(z) − 1``).

    ``z`` [m], ``energy`` [MeV], ``sigma`` (·, 6, 6) second moments about the centroid and
    ``centroid`` (·, 6) in (x, x', y, y', z, δ) with m, rad and δ = Δp/p; ``mats`` the step matrices,
    ``effective`` the same with the space-charge kicks folded in, ``d`` the step constants
    (``step_gamma``, ``step_beta``, ``step_h``: Lorentz factors and length of each step);
    ``line`` the 0-based lattice line of each point (−1 in gaps); ``elements``, ``rf``
    (line → (entry RF phase, synchronous phase) in degrees), ``warnings`` [(en, zh)] and ``info``.
    """

    def __init__(self, **values):
        self.__dict__.update(values)
        self._prefix = {}

    # ---------------------------------------------------------------- per point
    @property
    def gamma(self):
        return 1.0 + self.energy / self.mass

    @property
    def beta_gamma(self):
        g = self.gamma
        return np.sqrt(np.maximum(g * g - 1.0, 0.0))

    def rms(self, plane):
        """rms size [m] (plane x, y or z)."""
        i = PLANES[plane]
        return np.sqrt(np.maximum(self.sigma[:, i, i], 0.0))

    def rms_divergence(self, plane):
        """rms x', y' [rad] or δ."""
        i = PLANES[plane] + 1
        return np.sqrt(np.maximum(self.sigma[:, i, i], 0.0))

    def emittance(self, plane, normalized=False):
        """rms emittance [m·rad] of one plane; *normalized* multiplies by βγ (the beam.txt convention,
        also for z with δ = Δp/p)."""
        i = PLANES[plane]
        s = self.sigma
        e = np.sqrt(np.maximum(s[:, i, i] * s[:, i + 1, i + 1] - s[:, i, i + 1] ** 2, 0.0))
        return e * self.beta_gamma if normalized else e

    def twiss(self, plane):
        """``(alpha, beta)`` of one plane; beta in m/rad (= mm/mrad)."""
        i = PLANES[plane]
        e = self.emittance(plane)
        with np.errstate(all="ignore"):
            return -self.sigma[:, i, i + 1] / e, self.sigma[:, i, i] / e

    # ---------------------------------------------------------------- transfer maps
    def _products(self, space_charge):
        key = bool(space_charge)
        if key not in self._prefix:
            mats = self.effective if space_charge else self.mats
            self._prefix[key] = _prefix_products(mats) if len(mats) else np.zeros((0, 6, 6))
        return self._prefix[key]

    def phase_advance(self, plane, space_charge=None):
        """Cumulative phase advance [rad] from the start, from the transfer matrix and the initial Twiss
        parameters (uncoupled formula: inside solenoids it mixes x and y).  *space_charge*: None =
        depressed when the result has space charge."""
        if space_charge is None:
            space_charge = self.info["space_charge"]
        i = PLANES[plane]
        prod = self._products(space_charge)
        s0 = self.sigma[0]
        e0 = math.sqrt(max(s0[i, i] * s0[i + 1, i + 1] - s0[i, i + 1] ** 2, 0.0))
        if not e0 > 0 or not len(prod):
            return np.zeros(len(self.z))
        alpha0, beta0 = -s0[i, i + 1] / e0, s0[i, i] / e0
        r11, r12 = prod[:, i, i], prod[:, i, i + 1]
        mu = np.unwrap(np.arctan2(r12, beta0 * r11 - alpha0 * r12))
        return np.concatenate(([0.0], mu))

    def propagate(self, sigma, start=0, end=None, space_charge=None, current=None):
        """Second moments *sigma* (6×6 at point *start*) pushed to point *end* through the steps of this result.

        *space_charge*: None = as the result; *current* [mA] replaces the beam current of the kicks.
        Returns ``(sigmas, effective)``: the moments at points start … end and the step matrices with
        the kicks folded in.  The kicks are grouped from *start*, so a part of the line differs from the
        same part of the full evaluation by the grouping only (second order in the step).
        """
        end = len(self.z) - 1 if end is None else end
        sigma = np.asarray(sigma, dtype=float).reshape(6, 6)
        mats = self.mats[start:end]
        if space_charge is None:
            space_charge = self.info["space_charge"]
        sc = None
        if space_charge and len(mats):
            beam = dict(self.beam) if current is None else dict(self.beam, current=current)
            steps = {"gamma": self.step_gamma[start:end], "beta": self.step_beta[start:end], "h": self.step_h[start:end]}
            sc = _space_charge_setup(beam, self.mass, self.charge, steps, _Warnings(), True)
        if not len(mats):
            return sigma[None].copy(), mats.copy()
        with np.errstate(all="ignore"):
            if sc is None:
                prod = _prefix_products(mats)
                full, effective = prod @ sigma @ prod.transpose(0, 2, 1), mats
            else:
                full, effective = _propagate_sc(mats, sigma, sc)
        return np.concatenate([sigma[None], full]), effective

    def index(self, z, side="left"):
        """Point index at *z* [m]: the first point at or after it (``side="left"``) or the last at or
        before it (``"right"``)."""
        if side == "left":
            i = int(np.searchsorted(self.z, z - 1e-12, side="left"))
        else:
            i = int(np.searchsorted(self.z, z + 1e-12, side="right")) - 1
        return min(max(i, 0), len(self.z) - 1)

    def span(self, target):
        """``(entry index, exit index)`` of a lattice element (name, 1-based line or ``{"index": n}``)."""
        try:
            st = lattice_edit.resolve(self.doc, _address(target))
        except lattice_edit.LatticeEditError as exc:
            raise ModelError(str(exc)) from None
        if st.z_start is None:
            raise ModelError(f"'{target}' is outside the simulated part of the lattice.")
        return self.index(st.z_start, "right"), self.index(st.z_end, "right")

    def transfer(self, start=0, end=None, space_charge=False, affine=False):
        """Transfer matrix between point indices *start* and *end* (default: the whole result).

        *space_charge*: with the linear space-charge kicks of this beam.  *affine*: return
        ``(M, d)`` with the constant of the centroid map ``x → M·x + d`` as well.
        """
        end = len(self.z) - 1 if end is None else end
        if end < start:
            raise ValueError("end must not be before start")
        mats = (self.effective if space_charge else self.mats)[start:end]
        if not len(mats):
            return (np.eye(6), np.zeros(6)) if affine else np.eye(6)
        if not affine:
            return _prefix_products(mats)[-1]
        a = np.zeros((len(mats), 7, 7))
        a[:, :6, :6], a[:, :6, 6], a[:, 6, 6] = mats, self.d[start:end], 1.0
        p = _prefix_products(a)[-1]
        return p[:6, :6], p[:6, 6]

    def at(self, where):
        """All quantities at one point: an index, ``("z", value)``, an element (its exit) or
        ``(element, "entry" | "exit")``.  Per plane under ``planes``: rms, emittance(_n), alpha, beta."""
        if isinstance(where, (int, np.integer)):
            i = int(where)
        elif isinstance(where, tuple) and where[0] == "z":
            i = self.index(float(where[1]), "right")
        elif isinstance(where, tuple):
            i = self.span(where[0])[0 if where[1] == "entry" else 1]
        else:
            i = self.span(where)[1]
        out = {"index": i, "z": float(self.z[i]), "energy": float(self.energy[i]),
               "sigma": self.sigma[i].copy(), "centroid": self.centroid[i].copy(), "planes": {}}
        for plane in PLANES:
            alpha, beta = self.twiss(plane)
            out["planes"][plane] = {"rms": float(self.rms(plane)[i]), "emittance": float(self.emittance(plane)[i]),
                          "emittance_n": float(self.emittance(plane, True)[i]),
                          "alpha": float(alpha[i]), "beta": float(beta[i])}
        return out

    # ---------------------------------------------------------------- editor preview
    def preview(self, max_points=3000):
        """The dictionary of :func:`avas.sim.linear_optics.linear_preview` (rms in mm, downsampled)."""
        z, w = self.z, self.energy
        rms = np.sqrt(np.maximum(np.stack([self.sigma[:, 0, 0], self.sigma[:, 2, 2], self.sigma[:, 4, 4]],
                                          axis=1), 0.0)) * 1e3
        if len(z) > max(int(max_points), 2):
            idx = np.unique(np.round(np.linspace(0, len(z) - 1, int(max_points))).astype(int))
            z, w, rms = z[idx], w[idx], rms[idx]
        return {
            "z": z, "rms_x": rms[:, 0], "rms_y": rms[:, 1], "rms_z": rms[:, 2], "energy": w,
            "elements": self.elements, "warnings": self.warnings,
            "model": {"space_charge": self.info["space_charge"], "elapsed_ms": self.info["elapsed_ms"],
                      "slices": self.info["slices"]},
        }
