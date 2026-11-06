"""Transfer matrices (6×6, coordinates x, x', y, y', z, δ in m, rad) of the linear model."""
import math

import numpy as np



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


def _solenoid_edges(dk):
    """Thin solenoid edges (6×6, arrays) where ``k = Bz/(2Bρ)`` steps up by *dk*: x' += dk·y, y' −= dk·x."""
    m = np.zeros(np.shape(dk) + (6, 6))
    m[..., range(6), range(6)] = 1.0
    m[..., 1, 2] = dk
    m[..., 3, 0] = -dk
    return m


def _half_axial_derivative(values, hf):
    """−½ ∂f/∂z per slice from slice-centre values that are zero outside the element.

    Uses differences of the boundary values with zeros beyond the section, so
    a field that does not vanish at the end of its map still gets its edge
    kick (∫ over the element is zero, like the fringe of a closed solenoid).
    """
    bounds = np.concatenate(([0.0], (values[:-1] + values[1:]) / 2, [0.0]))
    return -0.5 * np.diff(bounds) / hf
