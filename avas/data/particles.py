"""Readers for TraceWin-style particle distributions (.dst / .edst).

``read_dst`` / ``read_edst`` return the header, the particle array
(x [cm], x' [rad], y [cm], y' [rad], phi [rad], W [MeV]) and rms Twiss
parameters (beta in mm/mrad, normalised emittance in pi mm mrad).
"""
import struct

import numpy as np


def _twiss(u, up):
    u = u - u.mean()
    up = up - up.mean()
    uu, pp, upu = float(np.mean(u * u)), float(np.mean(up * up)), float(np.mean(u * up))
    emit = np.sqrt(max(uu * pp - upu * upu, 0.0))
    if emit == 0:
        return 0.0, 0.0, 0.0
    return -upu / emit, uu / emit, emit


def _summary(particles, mc2):
    energy = float(particles[:, 5].mean()) if len(particles) else 0.0
    gamma = 1 + energy / mc2 if mc2 else 1.0
    beta = np.sqrt(max(1 - 1 / gamma ** 2, 0.0))
    bg = beta * gamma
    twiss = {}
    for plane, (i, j, su, sp) in {"x": (0, 1, 10.0, 1000.0), "y": (2, 3, 10.0, 1000.0)}.items():
        a, b, e = _twiss(particles[:, i] * su, particles[:, j] * sp)          # mm, mrad
        twiss[plane] = (a, b, e * bg)                                         # β in mm/mrad, normalised ε
    return energy, twiss


def read_dst(path):
    with open(path, "rb") as fh:
        fh.read(2)
        number = struct.unpack("<i", fh.read(4))[0]
        ib = struct.unpack("<d", fh.read(8))[0]
        freq = struct.unpack("<d", fh.read(8))[0]
        fh.read(1)
        particles = np.fromfile(fh, dtype="<f8", count=6 * number).reshape(number, 6)
        mc2 = struct.unpack("<d", fh.read(8))[0]
    energy, twiss = _summary(particles, mc2)
    try:    # same numbers as "Fill parameters from file" on the Beam page
        from avas.api.qt.api import cal_beam_parameter
        res = cal_beam_parameter({"dstPath": path})
        if res.get("code") == 0:
            bp = res["data"]["beamParams"]
            twiss = {pl: (bp[f"alpha_{pl}"], bp[f"beta_{pl}"], bp[f"emit_{pl}"]) for pl in ("x", "y", "z")}
    except Exception:  # noqa: BLE001 - fall back to the plain rms estimate
        pass
    return {"number": number, "ib": ib, "freq": freq, "mc2": mc2, "energy": energy, "twiss": twiss,
            "particles": particles}


def read_edst(path):
    """Extended distribution: (Np+1) × 9 doubles, the last row is the synchronous particle."""
    with open(path, "rb") as fh:
        fh.read(2)
        number = struct.unpack("<i", fh.read(4))[0]
        ib = struct.unpack("<d", fh.read(8))[0]
        freq = struct.unpack("<d", fh.read(8))[0]
        fh.read(1)
        raw = np.fromfile(fh, dtype="<f8", count=9 * (number + 1)).reshape(number + 1, 9)
        tail = fh.read(8)
        mc2 = struct.unpack("<d", tail)[0] if len(tail) == 8 else float(raw[-1, 7])
    particles = raw[:-1, :6]
    species = sorted({(float(q), float(m)) for q, m in raw[:-1, 6:8]})
    energy, twiss = _summary(particles, mc2)
    return {"number": number, "ib": ib, "freq": freq, "mc2": mc2, "energy": energy, "twiss": twiss,
            "particles": particles, "species": species}
