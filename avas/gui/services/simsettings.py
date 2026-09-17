"""Settings page: tracking options in input.txt and run mode in ini.ini."""
import os

from avas.api.qt.api import create_from_file_input_ini, write_to_file_input_ini
from avas.utils.iniconfig import IniConfig
from avas.gui import context
from avas.gui.bridge import UserError, rpc
from avas.gui.locks import require_unlocked


def safe_int(v, default):
    if v is None:
        return default
    try:
        return int(v)
    except (TypeError, ValueError):
        try:
            f = float(v)
            return int(f) if f.is_integer() else default
        except (TypeError, ValueError):
            return default


def safe_float(v, default):
    if v is None:
        return default
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def safe_str(v, default):
    return default if v is None else str(v)


def ensure_ini(project):
    """A project without ini.ini gets the default one (the config readers need it)."""
    path = project.input_file("ini.ini")
    if not os.path.isfile(path):
        IniConfig().write_to_file(project.item())


def _triple(values):
    if values in (None, ""):
        vals = []
    elif isinstance(values, (list, tuple)):
        vals = list(values)
    else:
        vals = [values]
    return [safe_str(vals[i], "") if i < len(vals) else "" for i in range(3)]


@rpc("settings.load")
def load():
    p = context.project().require()
    ensure_ini(p)
    item = p.item()
    d = create_from_file_input_ini(item)["data"]["inputiniParams"]
    scan = d.get("scanphase")
    form = {
        "sim_type": d.get("sim_type") or "mulp",
        "steppercycle": safe_str(d.get("steppercycle"), "100"),
        "dumpperiodicity": safe_str(d.get("dumpperiodicity"), "0"),
        "randomseed": safe_str(d.get("randomseed"), "0"),
        "multithreading": safe_int(d.get("multithreading"), 0) == 1,
        "scanphase": "default" if scan is None else str(safe_int(scan, 0)),
        "spacecharge": safe_int(d.get("spacecharge"), 1) == 1,
        "scmethod": d.get("scmethod") or "SPICNIC",
        "numofgrid": _triple(d.get("numofgrid")),
        "meshrms": _triple(d.get("meshrms")),
        "fieldSource": safe_str(d.get("fieldSource"), ""),
        "longlimits_start": safe_int(d.get("longlimits_start"), 0) == 1,
        "longlimits_phase": safe_str(d.get("longlimits_phase"), "0"),
        "longlimits_energy": safe_str(d.get("longlimits_energy"), "0"),
        "boundary": safe_int(d.get("boundary"), 0) == 1,
        "pchistogram_start": safe_int(d.get("pchistogram_start"), 0) == 1,
        "pchistogram_grid": safe_str(d.get("pchistogram_grid"), "300"),
        "error_type": "",
        "error_seed": "50",
    }
    ini = IniConfig().create_from_file(item)
    if isinstance(ini, dict) and ini.get("code", 0) == 0:
        err = ini["data"]["iniParams"].get("error", {})
        form["error_type"] = err.get("error_type") or ""
        form["error_seed"] = safe_str(err.get("seed"), "50")
    meta = {
        "device": d.get("device") or "cpu",
        "hadThreadsKey": d.get("multithreading") is not None,
        "hasScanData": os.path.isfile(p.input_file("scanData.txt")),
        "inputPath": p.input_file("input.txt"),
        "iniPath": p.input_file("ini.ini"),
    }
    return {"form": form, "meta": meta, "error": {"error_type": form["error_type"]}}


def _read_triple(texts, cast):
    vals = [str(t).strip() for t in texts]
    if not all(vals):
        return None
    try:
        return [cast(v) for v in vals]
    except ValueError:
        return None


@rpc("settings.save")
def save(form, meta):
    require_unlocked()
    p = context.project().require()
    item = p.item()
    scan = form.get("scanphase")
    values = {
        "sim_type": form.get("sim_type") or "mulp",
        "scmethod": form.get("scmethod") or "SPICNIC",
        "spacecharge": 1 if form.get("spacecharge") else 0,
        "steppercycle": safe_int(form.get("steppercycle"), 100),
        "dumpperiodicity": safe_int(form.get("dumpperiodicity"), 0),
        "pchistogram_start": 1 if form.get("pchistogram_start") else 0,
        "pchistogram_grid": safe_int(form.get("pchistogram_grid"), 300),
        "fieldSource": (form.get("fieldSource") or "").strip(),
        "longlimits_start": 1 if form.get("longlimits_start") else 0,
        "longlimits_phase": safe_float(form.get("longlimits_phase"), 0),
        "longlimits_energy": safe_float(form.get("longlimits_energy"), 0),
        "boundary": 1 if form.get("boundary") else 0,
        "randomseed": safe_int(form.get("randomseed"), 0),
        "spacechargelong": None,
        "spacechargetype": None,
        "device": meta.get("device") or "cpu",
        # keywords absent from input.txt keep the engine's default: only write them
        # when the user asked for a value (or turned a previously set one off)
        "multithreading": 1 if form.get("multithreading") else (0 if meta.get("hadThreadsKey") else None),
        "scanphase": None if scan in (None, "", "default") else safe_int(scan, 0),
        "numofgrid": _read_triple(form.get("numofgrid") or [], int),
        "meshrms": _read_triple(form.get("meshrms") or [], float),
    }
    ensure_ini(p)
    try:
        res = write_to_file_input_ini(item, values)
    except Exception as exc:  # noqa: BLE001 - range/type errors from the config classes
        raise UserError(str(exc)) from exc
    if res["code"] != 0:
        raise UserError(res["data"]["msg"])
    ini = IniConfig()
    ini.create_from_file(item)
    res = ini.set_param(error={"error_type": form.get("error_type") or "",
                               "seed": safe_int(form.get("error_seed"), 50), "if_normal": 1})
    if isinstance(res, dict) and res.get("code", 0) != 0:
        raise UserError(res["data"]["msg"])
    res = ini.write_to_file(item)
    if isinstance(res, dict) and res.get("code", 0) != 0:
        raise UserError(res["data"]["msg"])
    return load()
