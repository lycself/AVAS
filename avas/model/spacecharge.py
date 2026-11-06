"""Linear space charge of the rms-equivalent uniform ellipsoid (bunched) or elliptical cylinder (dc)."""
import math

import numpy as np

from avas.model.common import BLOWUP, C_LIGHT, EPS0

SC_GROUP = 4                 # steps between two space-charge kicks

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

    Returns ``(sigma, effective)``: the second moments after every step and the
    step matrices with the kicks folded in (the kick of a group multiplies the
    step before it), whose products give the depressed transfer matrices.
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
    kicks = np.broadcast_to(np.eye(6), (n_groups, 6, 6)).copy()
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
            kicks[i] = kick
        kicked[i] = sigma
        sigma = after[i] @ sigma @ after[i].T
    head = part[:, :first] @ starts[:, None] @ part[:, :first].transpose(0, 1, 3, 2)
    tail = part[:, first:] @ kicked[:, None] @ part[:, first:].transpose(0, 1, 3, 2)
    full = np.concatenate([head, tail], axis=1).reshape(-1, 6, 6)[:n]
    effective = blocks.copy()
    effective[:, first - 1] = kicks @ blocks[:, first - 1]
    return full, effective.reshape(-1, 6, 6)[:n]
