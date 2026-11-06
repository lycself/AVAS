"""Field-map profiles for the linear model: on-axis values and transverse derivatives versus z (cached)."""
import math
import os
import threading

import numpy as np

from avas.data.fieldmap import FieldMap


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
