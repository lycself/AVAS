"""Read 3D field maps (``.edx/.bdx/.bsx`` ...) for inspection.

Two layouts are handled, both as used in AVAS projects:

* ASCII: ``Nz L`` / ``Nx xmin xmax`` / ``Ny ymin ymax`` / ``norm`` followed by
  (Nz+1)(Nx+1)(Ny+1) values;
* binary (little endian): ``int Nz, double L, int Nx, double xmin, double
  xmax, int Ny, double ymin, double ymax, double norm`` then float32 values.

The storage order of the three axes is not documented in the manual.  Both
candidate orders (z outermost / z innermost) are tried and the one whose
longitudinal profile is smoother is used, which is unambiguous for real field
maps.
"""
import os
import struct

import numpy as np

EXT_MEANING = {
    "edx": ("RF electric field Ex", "高频电场 Ex"), "edy": ("RF electric field Ey", "高频电场 Ey"),
    "edz": ("RF electric field Ez", "高频电场 Ez"),
    "bdx": ("RF magnetic field Bx", "高频磁场 Bx"), "bdy": ("RF magnetic field By", "高频磁场 By"),
    "bdz": ("RF magnetic field Bz", "高频磁场 Bz"),
    "esx": ("static electric field Ex", "静电场 Ex"), "esy": ("static electric field Ey", "静电场 Ey"),
    "esz": ("static electric field Ez", "静电场 Ez"),
    "bsx": ("static magnetic field Bx", "静磁场 Bx"), "bsy": ("static magnetic field By", "静磁场 By"),
    "bsz": ("static magnetic field Bz", "静磁场 Bz"),
}
_BINARY_HEADER = struct.Struct("<id i2d i2d d")


class FieldMap:
    def __init__(self, path):
        self.path = path
        self.ext = os.path.splitext(path)[1].lstrip(".").lower()
        self.binary = False
        self.nz = self.nx = self.ny = 0
        self.length = 0.0
        self.x_range = (0.0, 0.0)
        self.y_range = (0.0, 0.0)
        self.norm = 1.0
        self.values = None

    @property
    def points(self):
        return (self.nz + 1) * (self.nx + 1) * (self.ny + 1)

    def read(self, load_values=True):
        with open(self.path, "rb") as fh:
            head = fh.read(64)
        self.binary = not _looks_ascii(head)
        if self.binary:
            self._read_binary(load_values)
        else:
            self._read_ascii(load_values)
        return self

    def _read_binary(self, load_values):
        with open(self.path, "rb") as fh:
            raw = fh.read(_BINARY_HEADER.size)
            (self.nz, self.length, self.nx, xmin, xmax, self.ny, ymin, ymax, self.norm) = _BINARY_HEADER.unpack(raw)
            self.x_range, self.y_range = (xmin, xmax), (ymin, ymax)
            if load_values:
                self.values = np.fromfile(fh, dtype="<f4", count=self.points).astype(float)

    def _read_ascii(self, load_values):
        with open(self.path, "r", encoding="ascii", errors="replace") as fh:
            header = [fh.readline().split() for _ in range(4)]
            self.nz, self.length = int(float(header[0][0])), float(header[0][1])
            self.nx, self.x_range = int(float(header[1][0])), (float(header[1][1]), float(header[1][2]))
            self.ny, self.y_range = int(float(header[2][0])), (float(header[2][1]), float(header[2][2]))
            self.norm = float(header[3][0])
            if load_values:
                self.values = np.array(fh.read().split(), dtype=float)[:self.points]

    def _cube(self):
        """Values as an array indexed ``[z, y, x]``; the axis order is detected once (see module doc)."""
        if self.values is None:
            self.read()
        nz, nx, ny = self.nz + 1, self.nx + 1, self.ny + 1
        v = self.values
        if v.size < nz * nx * ny:
            raise ValueError(f"{os.path.basename(self.path)}: {v.size} values, {nz * nx * ny} expected")
        v = v[:nz * nx * ny]
        z_outer = v.reshape(nz, ny, nx)
        z_inner = np.transpose(v.reshape(nx, ny, nz), (2, 1, 0))
        if nx == 1 and ny == 1 or nz == 1:
            return z_outer
        rough = [_roughness(np.abs(c).max(axis=(1, 2))) for c in (z_outer, z_inner)]
        return z_outer if rough[0] <= rough[1] else z_inner

    def profiles(self):
        """``(z, on_axis, max_abs)``: field at x = y = 0 and the largest |field| of each cross-section."""
        cube = self._cube()
        ix = _centre_indices(self.x_range, self.nx + 1)
        iy = _centre_indices(self.y_range, self.ny + 1)
        axis = cube[:, iy][:, :, ix].mean(axis=(1, 2)) * self.norm
        peak = np.abs(cube).max(axis=(1, 2)) * abs(self.norm)
        z = np.linspace(0.0, self.length, self.nz + 1)
        return z, axis, peak

    def on_axis(self):
        z, axis, _peak = self.profiles()
        return z, axis


def _looks_ascii(head):
    if not head:
        return False
    try:
        text = head.decode("ascii")
    except UnicodeDecodeError:
        return False
    return all(ch in "0123456789+-.eE \t\r\n" for ch in text)


def _centre_indices(rng, n):
    lo, hi = rng
    if n <= 1 or hi == lo:
        return [0]
    pos = (0.0 - lo) / (hi - lo) * (n - 1)
    i0 = int(np.floor(pos))
    i0 = min(max(i0, 0), n - 1)
    i1 = min(i0 + 1, n - 1)
    return [i0] if abs(pos - i0) < 1e-9 else sorted({i0, i1})


def _roughness(curve):
    span = float(np.ptp(curve)) or 1.0
    return float(np.abs(np.diff(curve, 2)).sum()) / span if curve.size > 2 else 0.0


def components(dirs, base):
    """``{ext: path}`` of the files belonging to field map *base* in *dirs*."""
    found = {}
    for d in dirs:
        for ext in EXT_MEANING:
            p = os.path.join(d, f"{base}.{ext}")
            if ext not in found and os.path.isfile(p):
                found[ext] = p
    return found
