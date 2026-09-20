"""Field-map cubes, read once and cut into planes for the pages that draw them.

Only one group is kept: the cubes are large, but a page that drags the slice
position through a map would otherwise re-read every file of the group per
frame.  The files page reaches this by path, the lattice page by the map name
an element refers to, so the payload is built here instead of in either
service.
"""
import logging
import os

import numpy as np

from avas.data.fieldmap import EXT_MEANING, PLANES, FieldMap, components, group_order
from avas.gui import bridge
from avas.gui.bridge import UserError

log = logging.getLogger("avas.gui")

_cache = {}


def _stamp(path):
    try:
        st = os.stat(path)
        return (st.st_mtime_ns, st.st_size)
    except OSError:
        return None


def group(dirs, base):
    """``({ext: FieldMap}, order)`` of the files of map *base*, read once and kept until they change."""
    comps = components(dirs, base)
    if not comps:
        raise UserError(f"Field map '{base}' not found.")
    key = (base, tuple((e, _stamp(p)) for e, p in sorted(comps.items())))
    hit = _cache.get(key)
    if hit is None:
        _cache.clear()
        maps = {}
        for ext, path in sorted(comps.items()):
            try:
                maps[ext] = FieldMap(path).read()
            except (OSError, ValueError) as exc:
                log.warning("field map %s: %s", path, exc)
        if not maps:
            raise UserError(f"Field map '{base}' could not be read.")
        hit = _cache[key] = (maps, group_order(maps.values()))
    return hit


def _same_grid(a, b):
    return (a.nz, a.nx, a.ny) == (b.nz, b.nx, b.ny) and abs(a.length - b.length) <= 1e-12 * max(1.0, abs(a.length))


def default_ext(maps):
    """The component to show when the caller has no file in mind: a longitudinal one, RF before static."""
    order = list(EXT_MEANING)
    return min(maps, key=lambda e: (e[2] != "z", order.index(e) if e in order else len(order)))


def fixed_range(fm, plane):
    """Range (m) the slice position may take on the axis *plane* holds fixed."""
    return {"zx": fm.y_range, "zy": fm.x_range, "xy": (0.0, fm.length)}[plane]


def slice_payload(dirs, base, plane="zx", at=None, limit=None, ext=None):
    """One plane of map *base*, for a heat map with arrows.

    Every component of the same family ("bs" static magnetic, "es" static
    electric, "bd" / "ed" the RF fields) that shares the grid is cut at the
    same place, so the page can draw |F| and the in-plane arrows besides the
    single component it asked for.  ``values`` are flat, row-major over (v, u).
    """
    if plane not in PLANES:
        raise UserError(f"Unknown plane '{plane}'.")
    maps, order = group(dirs, base)
    if ext is None:
        ext = default_ext(maps)
    elif ext not in maps:
        raise UserError(f"Field map '{base}.{ext}' could not be read.")
    family = ext[:2]
    lim = (400, 240) if limit is None else (int(limit), int(limit))
    ref = maps[ext]

    out, grids, u, v, at_used = {}, {}, None, None, None
    for e, fm in maps.items():
        if e[:2] != family or not _same_grid(fm, ref):
            continue
        try:
            values, cu, cv, cat = fm.plane(plane, at, order, lim)
        except (OSError, ValueError) as exc:
            out[e] = {"error": str(exc)}
            continue
        u, v, at_used = cu, cv, cat
        grids[e] = values
        out[e] = {"values": bridge.blob(values, "float32"),
                  "min": float(values.min()), "max": float(values.max())}
    if u is None:
        raise UserError(f"Field map '{base}.{ext}' has no plane to show.")

    magnitude = None
    if len(grids) > 1:
        mag = np.sqrt(sum(g.astype(float) ** 2 for g in grids.values()))
        magnitude = {"values": bridge.blob(mag, "float32"), "max": float(mag.max()), "of": sorted(grids)}
    pair = {"zx": ("z", "x"), "zy": ("z", "y"), "xy": ("x", "y")}[plane]
    arrows = [family + a for a in pair]
    return {
        "base": base, "ext": ext, "family": family, "plane": plane,
        "fixed": {"zx": "y", "zy": "x", "xy": "z"}[plane], "at": at_used,
        "atRange": list(fixed_range(ref, plane)), "order": order,
        "length": ref.length, "planes": [p for p in PLANES if _has_plane(ref, p)],
        "u": bridge.blob(u, "float64"), "v": bridge.blob(v, "float64"),
        "components": out, "magnitude": magnitude,
        "arrows": arrows if all(a in grids for a in arrows) else None,
        "meanings": {e: list(EXT_MEANING.get(e, ("", ""))) for e in out},
    }


def _has_plane(fm, plane):
    """A plane is worth offering only when both of its axes have more than one grid line."""
    n = {"z": fm.nz, "x": fm.nx, "y": fm.ny}
    return all(n[a] > 0 for a in plane)
