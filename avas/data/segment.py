"""Simulating one part of a lattice ("segment") on its own.

The engine tracks only what lies between the first ``start`` and ``end``, so a
segment run is an ordinary run of a lattice cut out of the full one.  This
module is pure: it picks the part, writes the lattices of the stages and
converts the RF phases; :mod:`avas.gui.services.segments` runs the stages.

A segment is a range of *items*: single statements, or whole superpose blocks
and ``lattice ... lattice_end`` periods, which are never split.

Entry beam, one of

* ``beam``      the segment starts at the beginning of the lattice: beam.txt as is;
* ``dst``       the particle file the last full run wrote exactly at the entry;
* ``upstream``  the elements before the segment are simulated first and their
                final particle distribution is the entry beam;
* ``twiss``     a beam generated from the Twiss parameters, normalised rms
                emittances and mean energy the last full run recorded at the
                entry (DataSet.txt): approximate, the distribution shape and the
                centroid offsets are lost;
* ``segment``   the final particle file of an earlier segment run that ends at
                the entry (as accurate as that run's own entry beam).

RF timing.  A cavity phase is written with V3 = 0 (synchronous phase), 1 (RF
phase when the synchronous particle enters) or 2 (RF phase at t = 0), and a
segment run starts its clock at its entry.  Unless the segment starts at the
beginning, every RF field in it is therefore rewritten with V3 = 2 and::

    phase = φ_RF − 360°·f·(t_in − T)

where φ_RF and t_in (synData.txt) are the RF phase seen by and the arrival
time of the synchronous particle at that cavity in a single-particle reference
run of the lattice up to the segment end, and T is the time of the entry beam:
the arrival of the synchronous particle at the entry, plus Δz/(βc) for the
bunch centroid of a ``twiss`` beam (which is generated centred).  For a
``segment`` entry T is when the earlier run's own reference particle reached
its end (its time origin plus its ``exitPlane`` time): that particle is defined
by the mean energy of its entry beam and drifts from the design timing, by
0.4° of RF phase after two cryomodules of the CAFe lattice.

Checked against full runs on 2026-09-17 (HWR cavity, 5260 particles, space
charge): particle-file entries reproduced the exit energy to 2e-5 and rms sizes
and emittances to 0.3 %; keeping V3 = 2 unchanged gave 40 % larger sizes and
rewriting to V3 = 0 with the synchronous phase was badly wrong (the engine
picks another solution).  A ``twiss`` entry reproduced the energy to 2e-4 and
the sizes to 4 %, the emittances to 11 %.
"""
import math
import os
import re

from avas.data.lattice_doc import format_statement, to_float

TOL_Z = 1e-5
PLANE_MARGIN = 0.05             # m, output planes this close to the end of a run are dropped
C_LIGHT = 299792458.0
_DST_NAME = re.compile(r"^outData_([-+\d.eE]+)\.dst$", re.IGNORECASE)


class SegmentError(Exception):
    pass


# =========================================================================== items and selection
class Item:
    """A piece of the lattice that is never split."""

    def __init__(self, statements, group=None):
        self.statements = statements
        self.group = group
        self.first_line = min(s.comment_name_line if s.comment_name_line is not None else s.line_no for s in statements)
        self.last_line = max(s.line_no for s in statements)
        els = [s for s in statements if s.is_element]
        zs = [s.z_start for s in statements if s.z_start is not None]
        ze = [s.z_end for s in statements if s.z_end is not None]
        self.z0 = min(zs) if zs else 0.0
        self.z1 = max(ze) if ze else self.z0
        self.elements = els
        self.rf = [s for s in statements if s.key == "field" and s.field_type() == "1"]

    @property
    def length(self):
        return self.z1 - self.z0

    @property
    def has_length(self):
        return any(s.length > TOL_Z for s in self.elements)


def items(doc):
    """The active lattice as a list of :class:`Item` (``start`` and ``end`` excluded)."""
    out, by_group = [], {}
    for st in doc.statements:
        if not st.active or st.key in ("start", "end"):
            continue
        top, g = None, st.group
        while g is not None and g.kind != "root":
            if g.kind in ("superpose", "period"):
                top = g
            g = g.parent
        if top is None:
            out.append([st])
            continue
        key = id(top)
        if key not in by_group:
            by_group[key] = [st]
            out.append(by_group[key])
        else:
            by_group[key].append(st)
    return [Item(sts) for sts in out]


def _group_titles(doc):
    out = []

    def walk(grp):
        for child in grp.children:
            if hasattr(child, "children"):
                if child.kind in ("section", "heading"):
                    out.append(child)
                walk(child)
    walk(doc.root)
    return out


def section_names(doc):
    return [g.title for g in _group_titles(doc)]


def _in_group(st, grp):
    g = st.group
    while g is not None:
        if g is grp:
            return True
        g = g.parent
    return False


class Plan:
    """A chosen segment: items ``i0 .. i1`` of the lattice."""

    def __init__(self, doc, its, i0, i1, label=""):
        self.doc = doc
        self.items = its
        self.i0, self.i1 = i0, i1
        self.label = label
        part = its[i0:i1 + 1]
        self.first_line = min(it.first_line for it in part)
        self.last_line = max(it.last_line for it in part)
        with_length = [it for it in part if it.elements] or part
        self.z_start = min(it.z0 for it in with_length)
        self.z_end = max(it.z1 for it in with_length)
        self.elements = [s for it in part for s in it.elements]
        self.rf = [s for it in part for s in it.rf]
        self.at_beginning = not any(it.has_length or it.rf for it in its[:i0])
        self.to_end = not any(it.has_length or it.rf for it in its[i1 + 1:])

    @property
    def needs_timing(self):
        """RF fields that must be re-phased (the segment does not start at t = 0 of the full lattice)."""
        return bool(self.rf) and not self.at_beginning

    def summary(self):
        def label(st):
            return st.name or (st.param(8) if st.key == "field" else "") or st.keyword
        first, last = (self.elements[0], self.elements[-1]) if self.elements else (None, None)
        return {"label": self.label, "first_line": self.first_line + 1, "last_line": self.last_line + 1,
                "z_start": round(self.z_start, 6), "z_end": round(self.z_end, 6),
                "length": round(self.z_end - self.z_start, 6), "elements": len(self.elements), "rf": len(self.rf),
                "first": f"{label(first)} (L{first.line_no + 1})" if first else "",
                "last": f"{label(last)} (L{last.line_no + 1})" if last else "",
                "at_beginning": self.at_beginning, "to_end": self.to_end, "total_length": round(self.doc.total_length, 6)}


def plan(doc, section=None, start_line=None, end_line=None, z_min=None, z_max=None, label=None):
    """Choose a segment.

    *section*: title of a ``section NAME {`` group or a comment heading;
    *start_line* / *end_line*: 0-based lines of the first / last element;
    *z_min* / *z_max*: metres, elements whose middle lies inside.  Later
    arguments narrow the range given by earlier ones.
    """
    its = items(doc)
    if not any(it.elements for it in its):
        raise SegmentError("The lattice has no elements between start and end.")
    i0, i1 = 0, len(its) - 1
    auto_label = ""
    if section:
        want = str(section).strip().lower()
        groups = _group_titles(doc)
        found = [g for g in groups if g.title.strip().lower() == want] or \
                [g for g in groups if want in g.title.strip().lower()]
        if not found:
            names = ", ".join(sorted({g.title for g in groups})) or "none"
            raise SegmentError(f"No section or heading named '{section}' in the lattice (available: {names}).")
        if len({id(g) for g in found}) > 1 and len({g.title for g in found}) > 1:
            raise SegmentError(f"'{section}' matches several sections: {', '.join(g.title for g in found)}.")
        grp = found[0]
        idx = [k for k, it in enumerate(its) if any(_in_group(s, grp) for s in it.statements)]
        if not idx:
            raise SegmentError(f"The section '{grp.title}' contains no active elements.")
        i0, i1 = min(idx), max(idx)
        auto_label = grp.title

    def index_of(line):
        for k, it in enumerate(its):
            if any(s.line_no == line for s in it.statements):
                return k
        raise SegmentError(f"Line {line + 1} is not an active statement of the lattice.")

    if start_line is not None:
        i0 = index_of(int(start_line))
    if end_line is not None:
        i1 = index_of(int(end_line))
    if z_min is not None or z_max is not None:
        lo = -math.inf if z_min is None else float(z_min)
        hi = math.inf if z_max is None else float(z_max)
        idx = [k for k in range(i0, i1 + 1) if its[k].elements and lo - TOL_Z <= (its[k].z0 + its[k].z1) / 2 <= hi + TOL_Z]
        if not idx:
            raise SegmentError(f"No element between z = {z_min} and {z_max} m.")
        i0, i1 = min(idx), max(idx)
    if i1 < i0:
        raise SegmentError("The segment ends before it starts.")
    # snap to elements, then take along zero-length neighbours at the same position (steerers, output planes)
    while i0 <= i1 and not its[i0].elements:
        i0 += 1
    while i1 >= i0 and not its[i1].elements:
        i1 -= 1
    if i0 > i1:
        raise SegmentError("The chosen range contains no element.")
    z0, z1 = its[i0].z0, its[i1].z1
    while i0 > 0 and not its[i0 - 1].has_length and not its[i0 - 1].rf and abs(its[i0 - 1].z1 - z0) <= TOL_Z:
        i0 -= 1
    while i1 + 1 < len(its) and not its[i1 + 1].has_length and not its[i1 + 1].rf and abs(its[i1 + 1].z0 - z1) <= TOL_Z:
        i1 += 1
    result = Plan(doc, its, i0, i1)
    result.label = label or auto_label or f"z{result.z_start:.3f}-{result.z_end:.3f}m"
    return result


# =========================================================================== lattice texts
def _structural(raw):
    s = raw.strip().lower()
    return s in ("{", "}") or (s.startswith("section") and (len(s) == 7 or s[7] in " \t{"))


def _start_line(doc):
    for st in doc.statements:
        if st.key == "start" and st.active:
            return st.line_no
    raise SegmentError("The lattice has no 'start' line.")


def _planes(st):
    """Absolute positions of the output planes of an ``outputplane`` / ``automaticoutput`` statement."""
    base = st.z_start or 0.0
    if st.key == "outputplane":
        return [base + to_float(st.param(0))]
    first, step, span = to_float(st.param(0)), to_float(st.param(1)), to_float(st.param(2))
    if step <= 0:
        return [base + first]
    return [base + first + k * step for k in range(int(math.floor(span / step + 1e-9)) + 1)]


def _inside(z, z_from, z_to):
    # the engine rejects planes beyond the end ("output plane anomaly") and planes closer to
    # the end than the bunch length (checked 2026-09-17: 5 mm failed, 2 cm worked)
    return z_from - TOL_Z <= z <= z_to - PLANE_MARGIN


def _clip_output(st, z_from, z_to):
    """The statement's line limited to planes inside [z_from, z_to - margin], or None."""
    planes = _planes(st)
    inside = [z for z in planes if _inside(z, z_from, z_to)]
    if not inside:
        return None
    if len(inside) == len(planes):
        return st.raw
    base = st.z_start or 0.0
    return f"{st.indent}automaticoutput {inside[0] - base:.9g} {to_float(st.param(1)):.9g} {inside[-1] - inside[0]:.9g}"


def _copy_lines(doc, a, b, replace=None, z_from=None, z_to=None):
    out = []
    for no in range(a, b + 1):
        raw = doc.lines[no]
        if _structural(raw):
            continue
        st = doc.by_line.get(no)
        if st is not None and st.key in ("start", "end"):
            continue
        if st is not None and st.key in ("outputplane", "automaticoutput") and z_to is not None:
            raw = _clip_output(st, z_from, z_to)
            if raw is None:
                continue
        out.append(replace[no] if replace and no in replace else raw)
    return out


def _moved_outputs(p):
    """Output commands before the segment that put planes inside it, re-anchored at its entry."""
    out = []
    for it in p.items[:p.i0]:
        for st in it.statements:
            if st.key not in ("outputplane", "automaticoutput"):
                continue
            inside = [z for z in _planes(st) if _inside(z, p.z_start, p.z_end)]
            if not inside:
                continue
            if st.key == "outputplane":
                out.append(f"outputplane {inside[0] - p.z_start:.9g}")
            else:
                out.append(f"automaticoutput {inside[0] - p.z_start:.9g} {to_float(st.param(1)):.9g} {inside[-1] - inside[0]:.9g}")
    last_sc = None
    for it in p.items[:p.i0]:
        for st in it.statements:
            if st.key == "spacechargecomp":
                last_sc = st.raw.strip()
    return ([last_sc] if last_sc else []) + out


def segment_text(p, phases=None):
    """Lattice of the segment; *phases* maps 0-based line numbers of RF fields to new V3 = 2 phases."""
    replace = {}
    for line, phase in (phases or {}).items():
        st = p.doc.by_line[line]
        params = list(st.params)
        while len(params) < 6:
            params.append("0")
        params[2] = "2"
        params[5] = f"{phase:.10g}"
        replace[line] = format_statement(st, params=params)
    body = _copy_lines(p.doc, p.first_line, p.last_line, replace, p.z_start, p.z_end)
    head = [] if p.at_beginning else _moved_outputs(p)
    return "\n".join(["start"] + head + body + ["end"]) + "\n"


def upstream_text(p):
    """Lattice of everything before the segment."""
    start = _start_line(p.doc)
    return "\n".join(["start"] + _copy_lines(p.doc, start + 1, p.first_line - 1, None, 0.0, p.z_start) + ["end"]) + "\n"


def reference_text(p):
    """Lattice from the beginning to the end of the segment (single-particle timing run)."""
    start = _start_line(p.doc)
    return "\n".join(["start"] + _copy_lines(p.doc, start + 1, p.last_line, None, 0.0, p.z_end) + ["end"]) + "\n"


# =========================================================================== keyword files
def set_keywords(text, values):
    """Replace, append (value str) or remove (value None) keyword lines of beam.txt / input.txt."""
    want = {k.lower(): v for k, v in values.items()}
    done = set()
    out = []
    for line in text.splitlines():
        parts = line.split("!", 1)[0].split()
        key = parts[0].lower() if parts else ""
        if key in want:
            if key in done or want[key] is None:
                continue
            out.append(f"{parts[0]} {want[key]}")
            done.add(key)
        else:
            out.append(line)
    out += [f"{k} {v}" for k, v in want.items() if v is not None and k not in done]
    return "\n".join(out) + "\n"


def keyword_value(text, key):
    for line in text.splitlines():
        parts = line.split("!", 1)[0].split()
        if len(parts) >= 2 and parts[0].lower() == key.lower():
            return parts[1:]
    return None


# =========================================================================== timing
def read_syndata(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            p = line.split()
            if len(p) < 8:
                continue
            try:
                rows.append({"name": p[1], "length": float(p[2]), "z": float(p[3]), "t": float(p[4]), "gb": float(p[5]),
                             "phis": None if p[6] == "invalid" else float(p[6]),
                             "phirf": None if p[7] == "invalid" else float(p[7])})
            except ValueError:
                continue
    if not rows:
        raise SegmentError(f"No timing data in {path}.")
    return rows


def arrival_time(rows, z):
    """Arrival time of the synchronous particle at *z* (exact at element entries, else interpolated)."""
    for r in rows:
        if abs(r["z"] - z) <= TOL_Z:
            return r["t"]
    ordered = sorted(rows, key=lambda r: (r["z"], r["t"]))
    for a, b in zip(ordered, ordered[1:]):
        if a["z"] < z < b["z"]:
            return a["t"] + (b["t"] - a["t"]) * (z - a["z"]) / (b["z"] - a["z"])
    raise SegmentError(f"The reference run does not reach z = {z:.6g} m.")


def exit_time(rows):
    """Arrival time of a run's synchronous particle at its end (the ``exitPlane`` row), or None."""
    return next((r["t"] for r in rows if r["name"].lower() == "exitplane"), None)


def upstream_fingerprint(doc, z, extra_texts=()):
    """Hash of everything that shapes the beam arriving at *z*: the elements before it and the given
    input texts (beam.txt, input.txt).  A run ending at *z* and a segment starting at *z* get the same
    value while nothing upstream changed."""
    import hashlib
    h = hashlib.sha1()
    for st in doc.statements:
        if st.active and st.is_element and st.z_start is not None and st.z_start < z - TOL_Z and st.z_end <= z + TOL_Z:
            h.update(" ".join(st.raw.split("!", 1)[0].split()).encode("utf-8") + b"\n")
    for text in extra_texts:
        h.update(b"\x00")
        for line in (text or "").splitlines():
            code = " ".join(line.split("!", 1)[0].split())
            if code:
                h.update(code.encode("utf-8") + b"\n")
    return h.hexdigest()


def wrap_degrees(a):
    return (a + 180.0) % 360.0 - 180.0


def rephase(p, rows, t_ref):
    """``{line: new phase}`` and a report for every RF field of the segment (V3 = 2, clock starting at *t_ref*)."""
    used = set()
    phases, report = {}, []
    for st in p.rf:
        match = None
        for k, r in enumerate(rows):
            if k in used or r["phirf"] is None or r["name"].lower() != "field":
                continue
            if abs(r["z"] - st.z_start) <= TOL_Z and abs(r["length"] - st.length) <= 1e-6 + 1e-6 * st.length:
                match = k
                break
        if match is None:
            raise SegmentError(f"The RF field on line {st.line_no + 1} was not found in the reference run.")
        used.add(match)
        r = rows[match]
        f = to_float(st.param(4))
        new = wrap_degrees(r["phirf"] - 360.0 * f * (r["t"] - t_ref))
        phases[st.line_no] = new
        report.append({"line": st.line_no + 1, "name": st.name or st.param(8), "v3": st.param(2), "phase": st.param(5),
                       "new_phase": round(new, 6), "phi_rf": round(r["phirf"], 6), "t_in": r["t"]})
    return phases, report


# =========================================================================== entry beams
def dst_at(output_dir, z):
    """Particle file of *output_dir* written at *z* (``inData.dst`` for z = 0), or None."""
    if not os.path.isdir(output_dir):
        return None
    if abs(z) <= TOL_Z and os.path.isfile(os.path.join(output_dir, "inData.dst")):
        return os.path.join(output_dir, "inData.dst")
    best = None
    for name in os.listdir(output_dir):
        m = _DST_NAME.match(name)
        if not m:
            continue
        try:
            zz = float(m.group(1))
        except ValueError:
            continue
        if abs(zz - z) <= 5e-6 and (best is None or abs(zz - z) < best[0]):
            best = (abs(zz - z), os.path.join(output_dir, name))
    return best[1] if best else None


def final_dst(output_dir):
    """The particle file at the largest position of *output_dir* (the end of a run)."""
    best = None
    for name in os.listdir(output_dir) if os.path.isdir(output_dir) else ():
        m = _DST_NAME.match(name)
        if m:
            try:
                zz = float(m.group(1))
            except ValueError:
                continue
            if best is None or zz > best[0]:
                best = (zz, os.path.join(output_dir, name))
    return best[1] if best else None


def dst_mean_energy(path):
    from avas.data.particles import read_dst
    return float(read_dst(path)["energy"])


def twiss_at(output_dir, z):
    """Beam of the last run at *z* from DataSet.txt: mean energy, Twiss (α, β mm/mrad, ε_n π·mm·mrad) per plane,
    centroid lag behind the synchronous particle (m) and its γβ.  None if not available."""
    import numpy as np
    from avas.post.analysis.run_diagnostics import read_dataset_array
    path = os.path.join(output_dir, "DataSet.txt")
    if not os.path.isfile(path):
        return None
    d = read_dataset_array(path)
    if not d.shape[0]:
        return None
    ok = (d[:, 28] > 1) & np.isfinite(d[:, [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]]).all(axis=1) & (d[:, 35] == 0)
    d = d[ok]
    if len(d) < 2:
        return None
    zs = d[:, 33]
    order = np.argsort(zs, kind="stable")
    d, zs = d[order], zs[order]
    if z < zs[0] - 1e-3 or z > zs[-1] + 1e-3:
        return None
    k = int(np.searchsorted(zs, z))
    k = min(max(k, 1), len(d) - 1)
    a, b = d[k - 1], d[k]
    w = 0.0 if zs[k] == zs[k - 1] else min(max((z - zs[k - 1]) / (zs[k] - zs[k - 1]), 0.0), 1.0)
    row = a + (b - a) * w

    def plane(ia, ib, ie):
        return float(row[ia]), float(row[ib]), float(row[ie] * 1e6)
    return {"energy": float(row[0]), "twiss": {"x": plane(7, 10, 13), "y": plane(8, 11, 14), "z": plane(9, 12, 15)},
            "centroid_lag_m": float(-row[5]), "gb": float(row[6]), "particles": int(row[28]), "z": float(z)}


def centroid_delay(twiss):
    """Time (s) the bunch centroid of a ``twiss_at`` beam arrives after the synchronous particle."""
    gb = twiss["gb"]
    beta = gb / math.sqrt(1 + gb * gb) if gb > 0 else 0.0
    return twiss["centroid_lag_m"] / (beta * C_LIGHT) if beta > 0 else 0.0
