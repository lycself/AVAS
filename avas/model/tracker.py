"""Reference particle and per-step 6×6 matrices through the active lattice."""
import math
import os
import stat
import struct
from collections import OrderedDict

import numpy as np

from avas.data import schema
from avas.data.lattice_doc import LatticeDocument, to_float
from avas.model.beam import _check_beam
from avas.model.common import C_LIGHT, MEV_TM, PreviewError, _kin, _to_int, _trapezoid, _Warnings, _wrap
from avas.model.elements import (_half_axial_derivative, _solenoid_body4, _solenoid_edges, bend_matrix, drift_matrix,
                                 edge_matrix, quad_matrix, solenoid_matrix)
from avas.model.fieldmaps import _map_group


FINE_STEP = 0.001            # m, reference-particle integration inside field maps
SLICES_PER_KICK = 4          # fine steps merged into one transverse slice
MATRIX_STEP = 0.01           # m, output resolution of drifts and matrix elements
MAX_ITER = 20                # reference-particle fixed-point iterations per field section
ENERGY_TOL = 1e-9            # relative convergence of the slice energies
PHASE_SCAN_STEP = 5.0        # deg, entry-phase scan when the V3 = 0 fixed point does not converge
GOLDEN = (1 + 5 ** 0.5) / 2

_RF_EXT = ("edz", "edx", "edy")
_ES_EXT = ("esz", "esx", "esy")
_BS_EXT = ("bsz", "bsx", "bsy")
_RFB_EXT = ("bdx", "bdy")
_APERTURE_KEYS = ("drift", "field", "quad", "solenoid", "bend")


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


class _Tracker:
    """Reference particle and per-step 6×6 matrices through the lattice sections."""

    def __init__(self, mass, charge, energy, field_dirs, warn, map_dipoles=True):
        self.mass, self.q, self.energy0 = mass, charge, energy
        self.map_dipoles = map_dipoles                 # on-axis transverse fields of maps steer the centroid
        self.z, self.t, self.w = 0.0, 0.0, energy
        self.dirs = field_dirs
        self.warn = warn
        self.stopped = False
        self.rf = {}                                   # line -> (phase_rf, phase_s)
        self._groups = {}
        # per-step lists (concatenated at the end)
        self.mats, self.d, self.z_end, self.w_end, self.h = [], [], [], [], []
        self.gamma, self.beta, self.aperture, self.line = [], [], [], []

    # ---------------------------------------------------------------- bookkeeping
    def _push(self, mats, z_end, w_end, h, w_mid, aperture, line, d=None):
        """Append steps ``x → mats·x + d`` (*d*: constant 6-vectors of the centroid, zero by default)."""
        n = len(mats)
        g, _bg, b, _p = _kin(np.asarray(w_mid, dtype=float), self.mass)
        self.mats.append(np.asarray(mats))
        self.d.append(np.zeros((n, 6)) if d is None else np.asarray(d, dtype=float))
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
        return {"mats": cat(self.mats), "d": cat(self.d), "z": cat(self.z_end), "w": cat(self.w_end), "h": cat(self.h),
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
        e_dip = [zeros.copy() for _ in range(2)]            # static Ex, Ey on the axis
        b_dip = [zeros.copy() for _ in range(2)]            # static Bx, By on the axis
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
                dips = [self._sample(prof[k], "axis", s, st.length) * ke if k in prof else zeros.copy()
                        for k in (ex_key, ey_key)]
                if ftype == "2":
                    ez_static += ez
                    for acc, g in zip(e_grad + e_dip, grads + dips):
                        acc += g
                    continue
                bprof = self._load(st, _RFB_EXT, required=False) if kb else {}
                if "bdx" in bprof and "bdy" in bprof:     # RF magnetic field ∝ sin(phase)
                    bgrads = [self._sample(bprof[ext], key, s, st.length) * kb
                              for ext, key in (("bdy", "dx"), ("bdy", "dy"), ("bdx", "dy"), ("bdx", "dx"))]
                    bdips = [self._sample(bprof[ext], "axis", s, st.length) * kb for ext in ("bdx", "bdy")]
                else:
                    bgrads = bdips = None
                v3 = _to_int(st.param(2))
                cavities.append({"line": st.line_no, "v3": v3, "omega": 2 * math.pi * to_float(st.param(4)),
                                 "phase": to_float(st.param(5)), "ez": ez, "grads": grads, "bgrads": bgrads,
                                 "dips": dips, "bdips": bdips,
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
                    for acc, ext in zip(b_dip, ("bsx", "bsy")):
                        acc += self._sample(prof[ext], "axis", s, st.length) * kb
                self._dipole_check(st, prof, kb)
            else:
                self.warn.add(f"Line {line}: field type '{st.param(3)}' is not supported; treated as a drift.",
                              f"第 {line} 行：不支持的场类型“{st.param(3)}”，按漂移段处理。")
        # The radial (solenoid fringe) part ∂Bx/∂x + ∂By/∂y of the static magnetic field is −∂Bz/∂z by
        # Maxwell.  It comes from the summed Bz as edge kicks at the slice boundaries (see _field_steps),
        # never from the maps' own Bx, By: in noisy maps (examples/hwr010 sol) they disagree with Bz and
        # the period matrix is then not symplectic.  The maps keep their divergence-free part (normal and
        # skew quadrupole content).
        skew = (b_grad[3] - b_grad[1]) / 2
        b_grad[3], b_grad[1] = skew, -skew
        bz_bounds = np.concatenate(([0.0], (bz[:-1] + bz[1:]) / 2, [0.0]))

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
            bz_bounds = bz_bounds[:keep + 1]
            e_grad = [g[:keep] for g in e_grad]
            b_grad = [g[:keep] for g in b_grad]
            e_dip = [g[:keep] for g in e_dip]
            b_dip = [g[:keep] for g in b_dip]
            for cav in cavities:
                for key in ("ez", "rel", "sinc", "weight"):
                    cav[key] = cav[key][:keep]
                for key in ("grads", "bgrads", "dips", "bdips"):
                    cav[key] = cav[key] and [g[:keep] for g in cav[key]]
            nf = keep
        self._field_steps(zb, hf, wb, e_grad, b_grad, bz, bz_bounds, aperture, cavities, stmts[0].line_no,
                          e_dip, b_dip)
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

    def _iterate(self, hf, ez_static, cavities, fixed=None):
        """Fixed-point iteration of the slice energies: ``(wb, tb, status)``, status "ok" | "stop" | "open".

        V3 = 0 phases are re-solved in every pass unless *fixed* (``{id(cav): φ0 [rad]}``) holds them;
        the state of the last pass is left in the cavity dicts.
        """
        mass, q = self.mass, self.q
        wc = np.full(hf.size, self.w)
        wb = tb = None
        status = "open"
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
                if fixed and id(cav) in fixed:
                    phi0 = fixed[id(cav)]
                elif cav["v3"] == 0:
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
                status = "stop"
                break
            new = (wb[:-1] + wb[1:]) / 2
            done = np.max(np.abs(new - wc)) < ENERGY_TOL * self.w
            wc = new
            if done:
                status = "ok"
                break
        return wb, tb, status

    @staticmethod
    def _phase_s(cav):
        """Synchronous phase [rad] of the last pass (atan2(∫E sinφ, ∫E cosφ)), or None without field."""
        phase = cav["rel"] + cav["phi0"]
        s, c = np.dot(cav["weight"], np.sin(phase)), np.dot(cav["weight"], np.cos(phase))
        return math.atan2(s, c) if (s or c) else None

    def _solve_phase(self, hf, ez_static, cavities, cav):
        """V3 = 0 when the fixed point does not converge: scan the entry phase φ0, then bisect.

        φs(φ0) is computed along the trajectory that φ0 itself produces.  For slow particles
        (far below the cavity's design β) it need not cover all phases (the cavity's net
        accelerating vector nearly cancels).  Like the engine (checked on Windows, 2026-11-02),
        when no φ0 gives the requested φs the solution 180° away is taken (the cavity then
        decelerates; the engine's synData.txt still writes the requested φs), with a warning;
        when neither exists the engine stops with a "scan phase" error and the preview uses the
        closest reachable φs, with a warning.  Among several roots the one on a rising branch of
        φs(φ0) is used (the engine's choice at 0.7 MeV), then the largest energy gain.
        Returns the result of :meth:`_iterate`.
        """
        target = math.radians(cav["phase"])

        def miss(phi0, aim=target):
            wb, _tb, status = self._iterate(hf, ez_static, cavities, {id(cav): phi0})
            ps = self._phase_s(cav) if status == "ok" else None
            if ps is None:
                return math.nan, ps, -math.inf
            return math.remainder(ps - aim, 2 * math.pi), ps, float(wb[-1])

        grid = np.radians(np.arange(-180.0, 180.0, PHASE_SCAN_STEP))
        scan = [miss(p) for p in grid]
        phis = np.array([np.nan if m[1] is None else m[1] for m in scan])

        def roots(aim):
            """``[(φ0, rising, final energy)]`` of φs(φ0) = *aim*."""
            f = np.array([math.remainder(v - aim, 2 * math.pi) if np.isfinite(v) else np.nan for v in phis])
            out = []
            for i in range(grid.size):
                fa, fb = f[i], f[(i + 1) % grid.size]
                if not (np.isfinite(fa) and np.isfinite(fb)) or abs(fa) + abs(fb) > math.pi:
                    continue                                # no data, or a jump of the wrapped phase
                if fa == 0 or fa * fb < 0:
                    lo_, hi = grid[i], grid[i] + math.radians(PHASE_SCAN_STEP)
                    for _ in range(50):
                        mid = (lo_ + hi) / 2
                        fm = miss(mid, aim)[0]
                        if not np.isfinite(fm):
                            break
                        if (fm < 0) == (fa < 0):
                            lo_ = mid
                        else:
                            hi = mid
                    root = (lo_ + hi) / 2
                    out.append((root, fb > fa, miss(root, aim)[2]))
            return out

        def pick(found):
            return max(found, key=lambda r: (r[1], r[2]))[0]

        line = cav["line"] + 1
        found = roots(target)
        if found:
            best = pick(found)
            if len(found) > 1:
                self.warn.add(f"Line {line}: {len(found)} entry phases give the synchronous phase {cav['phase']:g}°; "
                              "the preview uses the one on a rising branch with the largest energy gain.",
                              f"第 {line} 行：有 {len(found)} 个入口相位都给出同步相位 {cav['phase']:g}°，"
                              "预览取上升分支上能量增益最大的一个。")
            return self._iterate(hf, ez_static, cavities, {id(cav): best})
        flipped = roots(target + math.pi)
        if flipped:
            best = pick(flipped)
            result = self._iterate(hf, ez_static, cavities, {id(cav): best})
            got = math.degrees(self._phase_s(cav) or 0.0)
            self.warn.add(f"Line {line}: at this energy no RF phase gives an accelerating synchronous phase of "
                          f"{cav['phase']:g}°; like the engine, the preview takes the solution 180° away "
                          f"(φs = {got:.1f}°, which the engine's synData.txt writes as {cav['phase']:g}°): "
                          "the cavity decelerates the beam.",
                          f"第 {line} 行：在此能量下，任何射频相位都给不出加速的同步相位 {cav['phase']:g}°；"
                          f"预览与内核一样取相差 180° 的解（φs = {got:.1f}°，内核 synData.txt 记为 {cav['phase']:g}°），"
                          "这个腔使束流减速。")
            return result
        finite = np.isfinite(phis)
        if not finite.any():
            return self._iterate(hf, ez_static, cavities)
        f = np.array([abs(m[0]) if np.isfinite(m[0]) else np.nan for m in scan])
        i = int(np.nanargmin(f))
        lo_, hi = grid[i] - math.radians(PHASE_SCAN_STEP), grid[i] + math.radians(PHASE_SCAN_STEP)
        for _ in range(60):                                 # golden-section search of |miss|
            a = hi - (hi - lo_) / GOLDEN
            b = lo_ + (hi - lo_) / GOLDEN
            fa, fb = abs(miss(a)[0]), abs(miss(b)[0])
            if not fb < fa:
                hi = b
            else:
                lo_ = a
        best = (lo_ + hi) / 2
        reach = np.degrees(np.unwrap(phis[finite]))
        lo_s, hi_s = _wrap(float(reach.min())), _wrap(float(reach.max()))
        got = miss(best)[1]
        self.warn.add(f"Line {line}: at this energy no RF phase gives the synchronous phase {cav['phase']:g}° "
                      f"or {_wrap(cav['phase'] + 180):g}° (reachable about {lo_s:.0f}° … {hi_s:.0f}°); the engine stops "
                      f"with a \"scan phase\" error, the preview uses the closest, {math.degrees(got):.1f}°.",
                      f"第 {line} 行：在此能量下，任何射频相位都给不出同步相位 {cav['phase']:g}° 或 "
                      f"{_wrap(cav['phase'] + 180):g}°（可达范围约 {lo_s:.0f}° … {hi_s:.0f}°）；内核会报“scan phase”错误，"
                      f"预览取最接近的 {math.degrees(got):.1f}°。")
        return self._iterate(hf, ez_static, cavities, {id(cav): best})

    def _reference(self, zb, hf, ez_static, cavities):
        """W and t on the fine boundaries; V3 = 0 phases solved on the way.  Returns ``(wb, tb, stop_index)``."""
        wb, tb, status = self._iterate(hf, ez_static, cavities)
        if status == "open":
            free = [cav for cav in cavities if cav["v3"] == 0 and not cav.get("no_field")]
            if len(free) == 1:
                wb, tb, status = self._solve_phase(hf, ez_static, cavities, free[0])
        if status == "open":
            z0 = self.z
            self.warn.add(f"The reference particle does not converge in the field section at z = {z0:.3f} m; "
                          "its energy and RF phases there are not self-consistent.",
                          f"参考粒子在 z = {z0:.3f} m 处的场段中不收敛，该处的能量和射频相位不自洽。")
        bad = np.nonzero(~(wb > 0))[0]
        stop = int(bad[0]) - 1 if bad.size else None
        for cav in cavities:
            phase_s = self._phase_s(cav)
            self.rf[cav["line"]] = (_wrap(math.degrees(cav["phi0"])), None if phase_s is None else math.degrees(phase_s))
            if cav.get("no_field"):
                self.warn.add(f"Line {cav['line'] + 1}: no accelerating field, the synchronous phase cannot be set; "
                              "the phase is used as entry phase.",
                              f"第 {cav['line'] + 1} 行：没有加速场，无法设置同步相位，相位按入口相位处理。")
        return wb, tb, (max(stop, 0) if stop is not None else None)

    def _field_steps(self, zb, hf, wb, e_grad, b_grad, bz, bz_bounds, aperture, cavities, line, e_dip, b_dip):
        """Merge fine slices into kick slices and build their 6×6 matrices.

        A kick slice is ``edge · body · kick · body · edge``: the body is the slice-mean Bz without edges,
        and the two thin edges step the solenoid strength from its value at the slice boundary
        (*bz_bounds*, zero at the ends of the section) to the slice mean and back.  The edges of
        neighbouring slices add up to the jump of the mean, so the Bz part of the section is a product
        of hard-edge solenoids and exactly symplectic, however Bz varies inside a slice.

        The on-axis transverse fields (*e_dip*, *b_dip* and the cavities' ``dips`` / ``bdips``) give the
        constant part of the kick, which only moves the centroid (``d`` of :meth:`_push`).
        """
        q, mass, k = self.q, self.mass, SLICES_PER_KICK
        wc = (wb[:-1] + wb[1:]) / 2
        _g, _bg, beta, p = _kin(wc, mass)
        ex = [g.copy() for g in e_grad]
        bx = [g.copy() for g in b_grad]
        dip_e = [g.copy() for g in e_dip]
        dip_b = [g.copy() for g in b_dip]
        ez_sin = np.zeros_like(hf)
        for cav in cavities:
            phase = cav["rel"] + cav["phi0"]
            sin, sinc = np.sin(phase), cav["sinc"]
            cos_w, sin_w = np.cos(phase) * sinc, sin * sinc
            for acc, g in zip(ex + dip_e, cav["grads"] + cav["dips"]):
                acc += g * cos_w
            for acc, g in zip(bx + dip_b, (cav["bgrads"] or []) + (cav["bdips"] or [])):
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
        kb_edge = q * MEV_TM * bz_bounds[::k][:n + 1] / (2 * pb)
        edge_in, edge_out = _solenoid_edges(ksol - kb_edge[:-1]), _solenoid_edges(kb_edge[1:] - ksol)
        outer = edge_out @ half
        mats = outer @ kick @ half @ edge_in
        d = None
        if self.map_dipoles and any(np.any(g) for g in dip_e + dip_b):
            push = np.zeros((n, 6))
            push[:, 1] = r * merge(e_fac * dip_e[0] - b_fac * dip_b[1])
            push[:, 3] = r * merge(e_fac * dip_e[1] + b_fac * dip_b[0])
            d = np.einsum("nij,nj->ni", outer, push)
        ap = aperture[:n * k].reshape(n, k).min(axis=1)
        ap = np.where(np.isfinite(ap), ap, 0.0)
        self._push(mats, zb_c[1:], wb_c[1:], h, wmid, ap, line, d)



class _PreviewDocument(LatticeDocument):
    """LatticeDocument without the editor's validation pass, which the preview does not use."""

    def _validate(self):
        pass


class _Recorder:
    """Forwards warnings and remembers them, so a cached section can repeat them."""

    def __init__(self, warn):
        self.warn, self.calls = warn, []

    def add(self, en, zh, key=None):
        self.calls.append((en, zh, key))
        self.warn.add(en, zh, key)


class SectionCache:
    """Results of field-map sections, reused while their statements and entry state are unchanged.

    Field sections are the expensive part of a model (reference-particle iteration, V3 = 0 phase
    search); matrix elements are rebuilt every time.  The key holds the statements' parameters and
    positions, the entry z and energy, and the entry time only where it matters (V3 = 2 cavities).
    Field-map files are not watched: build a new cache (or model) after changing them.
    """

    LISTS = ("mats", "d", "z_end", "w_end", "h", "gamma", "beta", "aperture", "line")

    def __init__(self, size=256):
        self.size = size
        self.items = OrderedDict()
        self.hits = self.misses = 0

    def run(self, tracker, stmts):
        absolute = any(_to_int(st.param(2)) == 2 for st in stmts if st.field_type() == "1")
        key = (tuple((st.line_no, st.key, tuple(st.params), st.z_start, st.z_end, st.block) for st in stmts),
               tracker.z, tracker.w, tracker.t if absolute else None, tracker.map_dipoles, tuple(tracker.dirs),
               tracker.mass, tracker.q)
        hit = self.items.get(key)
        if hit is not None:
            self.items.move_to_end(key)
            self.hits += 1
            for name, chunk in hit["lists"].items():
                getattr(tracker, name).extend(chunk)
            for call in hit["warnings"]:
                tracker.warn.add(*call)
            tracker.rf.update(hit["rf"])
            tracker.z, tracker.t, tracker.w = hit["z"], tracker.t + hit["dt"], hit["w"]
            tracker.stopped = tracker.stopped or hit["stopped"]
            return
        self.misses += 1
        start = {name: len(getattr(tracker, name)) for name in self.LISTS}
        t0, warn, rf_before = tracker.t, tracker.warn, dict(tracker.rf)
        tracker.warn = _Recorder(warn)
        try:
            tracker.fields(stmts)
        finally:
            recorder, tracker.warn = tracker.warn, warn
        self.items[key] = {
            "lists": {name: getattr(tracker, name)[start[name]:] for name in self.LISTS},
            "warnings": recorder.calls, "z": tracker.z, "dt": tracker.t - t0, "w": tracker.w,
            "stopped": tracker.stopped, "rf": {k: v for k, v in tracker.rf.items() if rf_before.get(k) != v},
        }
        while len(self.items) > self.size:
            self.items.popitem(last=False)


def _track(lattice_text, beam, field_dirs, cache=None, map_dipoles=True):
    """Parse, check and build the per-step matrices: ``(doc, tracker, warnings)``.

    *cache*: a :class:`SectionCache` shared between calls (see :class:`avas.model.LinearModel`).
    """
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
    tracker = _Tracker(mass, charge, energy, [os.fspath(d) for d in (field_dirs or ()) if d], warn, map_dipoles)
    with np.errstate(all="ignore"):
        for kind, item in _sections(doc, warn):
            if kind == "fields":
                if cache is None:
                    tracker.fields(item)
                else:
                    cache.run(tracker, item)
            else:
                tracker.matrix(item)
            if tracker.stopped:
                break
    return doc, tracker, warn
