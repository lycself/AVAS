"""Beam page: ``InputFile/beam.txt``.

Saving rewrites only the keywords the page manages, in place; every other
line (``randomseed``, ``initpos``, comments ...) is kept as it was.
"""
import logging
import os
import shutil

from avas.api.qt.api import cal_beam_parameter
from avas.utils.beamconfig import BeamConfig
from avas.webgui import context
from avas.webgui.bridge import UserError, rpc
from avas.webgui.textio import read_text, write_text

log = logging.getLogger("avas.gui")

DISTRIBUTIONS = ["GS", "WB", "PB", "KV"]
MANAGED = ("readparticledistribution", "numofcharge", "particlerestmass", "current", "particlenumber",
           "frequency", "kneticenergy", "use_dst", "beamtype", "twissx", "twissy", "twissz", "distribution")
TWISS_KEYS = [f"{q}_{pl}" for pl in "xyz" for q in ("alpha", "beta", "emit")]


def _s(v):
    return "" if v is None else str(v)


@rpc("beam.load")
def load():
    p = context.project().require()
    path = p.input_file("beam.txt")
    if not os.path.isfile(path):
        params = {}
    else:
        try:
            params = BeamConfig().create_from_file(p.item())["data"]["beamParams"]
        except Exception as exc:  # noqa: BLE001 - a malformed file is reported, not fatal
            raise UserError(f"beam.txt: {exc}") from exc
    dist_x = _s(params.get("distribution_x")) or "GS"
    dist_y = _s(params.get("distribution_y")) or "GS"
    form = {
        "use_dst": str(params.get("use_dst") or 0) == "1",
        "dst": _s(params.get("readparticledistribution")),
        "numofcharge": _s(params.get("numofcharge")),
        "particlerestmass": _s(params.get("particlerestmass")),
        "current": _s(params.get("current")),
        "particlenumber": _s(params.get("particlenumber")),
        "frequency": _s(params.get("frequency")),
        "kneticenergy": _s(params.get("kneticenergy")),
        "cw": params.get("beamtype") == "dc",
        "distribution_x": dist_x,
        "distribution_y": dist_y,
    }
    for k in TWISS_KEYS:
        form[k] = _s(params.get(k))
    return {"form": form, "path": path, "exists": os.path.isfile(path),
            "dstFiles": sorted((n for n in os.listdir(p.input_dir) if n.lower().endswith((".dst", ".edst"))), key=str.lower)
            if os.path.isdir(p.input_dir) else []}


def _line_key(line):
    code = line.split("!", 1)[0].split()
    return code[0].lower() if code else None


def _format_lines(form):
    if form.get("cw"):
        form = {**form, "alpha_z": "0", "beta_z": "0", "emit_z": "0"}     # a DC beam has no longitudinal Twiss
    def num(key, cast):
        text = str(form.get(key, "")).strip()
        if text == "":
            return None
        try:
            return cast(text)
        except ValueError as exc:
            raise UserError(f"beam.txt: {key} = '{text}' is not a valid number") from exc

    ints = {k: num(k, lambda t: int(float(t)) if float(t).is_integer() else int(t))
            for k in ("numofcharge", "particlenumber")}
    floats = {k: num(k, float) for k in ("particlerestmass", "current", "frequency", "kneticenergy", *TWISS_KEYS)}
    use_dst = 1 if form.get("use_dst") else 0
    dist = [form.get("distribution_x") or "GS", form.get("distribution_y") or "GS"]
    for d in dist:
        if d not in DISTRIBUTIONS + ["undefined"]:
            raise UserError(f"beam.txt: unknown distribution '{d}'")
    # the same type checks the engine-side config class applies
    BeamConfig().set_param(**{**ints, **floats, "use_dst": use_dst, "distribution_x": dist[0], "distribution_y": dist[1]})

    def text(v):
        return repr(v) if isinstance(v, float) else str(v)

    dst = (form.get("dst") or "").strip()
    lines = {
        "readparticledistribution": dst if use_dst else "unknown",
        "numofcharge": ints["numofcharge"],
        "particlerestmass": floats["particlerestmass"],
        "current": floats["current"],
        "particlenumber": ints["particlenumber"],
        "frequency": floats["frequency"],
        "kneticenergy": floats["kneticenergy"],
        "use_dst": use_dst,
        "beamtype": "dc" if form.get("cw") else "notdc",
    }
    for pl in "xyz":
        vals = [floats[f"alpha_{pl}"], floats[f"beta_{pl}"], floats[f"emit_{pl}"]]
        lines[f"twiss{pl}"] = None if None in vals else " ".join(text(v) for v in vals)
    lines["distribution"] = " ".join(dist)
    out = {}
    for key in MANAGED:
        v = lines.get(key)
        if v is None or v == "":
            out[key] = None                      # the keyword is removed
        else:
            out[key] = f"{key} {text(v)}"
    return out


@rpc("beam.save")
def save(form):
    p = context.project().require()
    path = p.input_file("beam.txt")
    new = _format_lines(form)
    old_lines = read_text(path).splitlines() if os.path.isfile(path) else []
    written = set()
    result = []
    for line in old_lines:
        key = _line_key(line)
        if key in new:
            if key in written:
                continue                         # duplicates collapse to one line
            written.add(key)
            if new[key] is None:
                continue
            comment = ""
            if "!" in line:
                comment = " " + line[line.index("!"):]
            result.append(new[key] + comment)
        else:
            result.append(line)
    for key in MANAGED:
        if key not in written and new[key] is not None:
            result.append(new[key])
    write_text(path, "\n".join(result))
    log.info("saved %s", os.path.basename(path))
    return load()


@rpc("beam.importDst")
def import_dst(source, overwrite=False):
    """Copy a particle file into InputFile (if it is not there yet); returns its name."""
    p = context.project().require()
    if not source or not os.path.isfile(source):
        raise UserError(f"Not found: {source}")
    name = os.path.basename(source)
    target = p.input_file(name)
    if os.path.normcase(os.path.abspath(source)) == os.path.normcase(os.path.abspath(target)):
        return {"name": name, "copied": False}
    if os.path.exists(target) and not overwrite:
        return {"name": name, "exists": True}
    shutil.copyfile(source, target)
    log.info("particle file copied to InputFile: %s", name)
    return {"name": name, "copied": True}


@rpc("beam.fromDst")
def from_dst(name):
    """Mass, current, energy and rms Twiss parameters computed from a particle file."""
    p = context.project().require()
    path = name if os.path.isabs(name) else p.input_file(name)
    if not os.path.isfile(path):
        raise UserError(f"Not found: {path}")
    res = cal_beam_parameter({"dstPath": path})
    if res["code"] != 0:
        raise UserError(res["data"]["msg"])
    b = res["data"]["beamParams"]
    out = {k: str(b[k]) for k in ("particlerestmass", "current", "particlenumber", "frequency", "kneticenergy")}
    for pl in "xyz":
        for q in ("alpha", "beta", "emit"):
            out[f"{q}_{pl}"] = str(round(b[f"{q}_{pl}"], 5))
    return out
