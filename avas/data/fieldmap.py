"""Read 3D field maps (``.edx/.bdx/.bsx`` ...) for inspection.

Two layouts are handled, both as used in AVAS projects:

* ASCII: ``Nz L`` / ``Nx xmin xmax`` / ``Ny ymin ymax`` / ``norm`` followed by
  (Nz+1)(Nx+1)(Ny+1) values;
* binary (little endian): ``int Nz, double L, int Nx, double xmin, double
  xmax, int Ny, double ymin, double ymax, double norm`` then float32 values.

The storage order of the three axes is not documented in the manual.  Both
candidate orders (z outermost / z innermost) are tried on the whole cube and
z outermost is kept unless z innermost is clearly smoother along z.  All files
of one map share the order, so :func:`group_order` decides it once for the
group: a single quadrupole component (e.g. ``q150.bsy``) can look alike in
both orders, while the group cannot.  The engine's maps checked so far (40
maps of two projects) are all stored z outermost.
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
PLANES = ("zx", "zy", "xy")          # the two axes kept by FieldMap.plane(), horizontal first
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

    def _candidates(self):
        if self.values is None:
            self.read()
        nz, nx, ny = self.nz + 1, self.nx + 1, self.ny + 1
        v = self.values
        if v.size < nz * nx * ny:
            raise ValueError(f"{os.path.basename(self.path)}: {v.size} values, {nz * nx * ny} expected")
        v = v[:nz * nx * ny]
        return v.reshape(nz, ny, nx), np.transpose(v.reshape(nx, ny, nz), (2, 1, 0))

    def order_scores(self):
        """``(roughness z-outer, roughness z-inner)``; ``None`` when the order does not matter."""
        if self.nz < 2 or (self.nx == 0 and self.ny == 0):
            return None
        outer, inner = self._candidates()
        return _cube_roughness(outer), _cube_roughness(inner)

    def _cube(self, order=None):
        """Values indexed ``[z, y, x]``; *order* "outer" / "inner" forces the storage order (see module doc)."""
        outer, inner = self._candidates()
        if order is None:
            scores = self.order_scores()
            order = "inner" if scores and scores[1] < 0.9 * scores[0] else "outer"
        return inner if order == "inner" else outer

    def profiles(self, order=None):
        """``(z, on_axis, max_abs)``: field at x = y = 0 and the largest |field| of each cross-section."""
        cube = self._cube(order)
        ix = _centre_indices(self.x_range, self.nx + 1)
        iy = _centre_indices(self.y_range, self.ny + 1)
        axis = cube[:, iy][:, :, ix].mean(axis=(1, 2)) * self.norm
        peak = np.abs(cube).max(axis=(1, 2)) * abs(self.norm)
        z = np.linspace(0.0, self.length, self.nz + 1)
        return z, axis, peak

    def axis_values(self):
        """Grid coordinates (m) along z, y and x (the axes of :meth:`_cube`)."""
        z = np.linspace(0.0, self.length, self.nz + 1)
        return z, _axis(self.y_range, self.ny + 1), _axis(self.x_range, self.nx + 1)

    def plane(self, plane="zx", at=None, order=None, limit=(400, 240)):
        """Values on one grid plane: ``(values, u, v, at)``, ready for a heat map.

        *plane* names the two axes that are kept, horizontal one first: "zx"
        and "zy" are longitudinal cuts at a fixed y / x, "xy" a cross-section
        at a fixed z.  *at* is the coordinate (m) of the third axis; the
        nearest grid plane is taken and returned, the default being the beam
        axis (x = y = 0) or the middle of the map.  ``values[iv, iu]`` is
        indexed by the second axis first and carries the file's normalisation,
        like :meth:`profiles`.  *limit* caps ``(len(u), len(v))`` by dropping
        grid lines, keeping both ends.
        """
        if plane not in PLANES:
            raise ValueError(f"unknown plane {plane!r}")
        cube = self._cube(order)
        z, y, x = self.axis_values()
        name, coords = {"zx": ("y", y), "zy": ("x", x), "xy": ("z", z)}[plane]
        want = (self.length / 2 if name == "z" else 0.0) if at is None else float(at)
        k = int(np.argmin(np.abs(coords - want)))
        if plane == "zx":
            values, u, v = cube[:, k, :].T, z, x
        elif plane == "zy":
            values, u, v = cube[:, :, k].T, z, y
        else:
            values, u, v = cube[k], x, y
        iu, iv = _pick(len(u), limit[0]), _pick(len(v), limit[1])
        return values[np.ix_(iv, iu)] * self.norm, u[iu], v[iv], float(coords[k])

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


def _axis(rng, n):
    """Coordinates of *n* grid lines spanning *rng*; a single line sits at its start."""
    lo, hi = rng
    return np.full(1, float(lo)) if n <= 1 else np.linspace(float(lo), float(hi), n)


def _pick(n, limit):
    """At most *limit* indices of ``range(n)``, first and last always kept."""
    limit = max(2, int(limit))
    if n <= limit:
        return np.arange(n)
    return np.unique(np.linspace(0, n - 1, limit).round().astype(int))


def _centre_indices(rng, n):
    lo, hi = rng
    if n <= 1 or hi == lo:
        return [0]
    pos = (0.0 - lo) / (hi - lo) * (n - 1)
    i0 = int(np.floor(pos))
    i0 = min(max(i0, 0), n - 1)
    i1 = min(i0 + 1, n - 1)
    return [i0] if abs(pos - i0) < 1e-9 else sorted({i0, i1})


def _cube_roughness(cube):
    """Second over first differences along z (scale free) on at most ~16×16 transverse points."""
    sub = cube[:, ::max(1, cube.shape[1] // 16), ::max(1, cube.shape[2] // 16)]
    d1 = np.abs(np.diff(sub, axis=0)).sum()
    return float(np.abs(np.diff(sub, 2, axis=0)).sum() / d1) if d1 > 0 else 0.0


def group_order(fieldmaps):
    """Storage order shared by the files of one map: "inner" only when clearly smoother overall."""
    outer = inner = 0.0
    for fm in fieldmaps:
        scores = fm.order_scores()
        if scores:
            outer += scores[0]
            inner += scores[1]
    return "inner" if outer > 0 and inner < 0.9 * outer else "outer"


def components(dirs, base):
    """``{ext: path}`` of the files belonging to field map *base* in *dirs*."""
    found = {}
    for d in dirs:
        for ext in EXT_MEANING:
            p = os.path.join(d, f"{base}.{ext}")
            if ext not in found and os.path.isfile(p):
                found[ext] = p
    return found
