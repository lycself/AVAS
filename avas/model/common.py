"""Constants and small helpers shared by the linear model modules."""
import numpy as np

C_LIGHT = 299792458.0
MEV_TM = 299.792458          # p [MeV/c] = MEV_TM · q · Bρ [T·m]
EPS0 = 8.8541878128e-12
BLOWUP = 1.0                 # m, an rms size above this counts as a lost beam

_trapezoid = getattr(np, "trapezoid", None) or np.trapz


class PreviewError(Exception):
    """The input cannot be previewed at all (no start line, incomplete beam data ...)."""


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
