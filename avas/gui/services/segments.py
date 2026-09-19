"""Segment runs: simulate one part of the lattice on its own (physics in :mod:`avas.data.segment`).

A run lives in ``<project>/Segments/<label>_<YYYYmmdd-HHMMSS>/``::

    segment.json            what was run: range, entry beam, re-phased cavities, stages, status,
                            fingerprint of everything upstream of its end
    reference/              single-particle run up to the segment end (RF timing), when needed
    upstream/               the elements before the segment (entry beam "upstream")
    InputFile/ OutputFile/  the segment itself

A finished run's final particle file can be the entry beam of the next segment
(entry beam "segment") as long as the fingerprint still matches the project.

The stages run one after the other through the normal runner, so the Run page
shows them and they can be paused and stopped; the project's own input files
and OutputFile are never touched.  The assistant starts segment runs (tool
``run_segment``) after the user approved the range and chose the entry beam.
"""
import json
import logging
import os
import re
import shutil
import time

from avas.data import segment
from avas.data.lattice_doc import LatticeDocument
from avas.gui import context
from avas.gui.bridge import UserError, rpc
from avas.gui.locks import require_unlocked
from avas.gui.textio import read_text, write_text

log = logging.getLogger("avas.gui")

SEGMENTS_DIR = "Segments"
META_FILE = "segment.json"
ENTRY_FILE = "segment_entry.dst"
OPTION_IDS = ("beam", "dst", "segment", "upstream", "twiss")


def segments_root(project):
    return os.path.join(project.path, SEGMENTS_DIR)


def load_doc(project, text=None):
    path = project.lattice_path()
    if text is None:
        if not os.path.isfile(path):
            raise UserError(f"The lattice file {project.lattice_name()} does not exist.")
        text = read_text(path)
    return LatticeDocument(text, project.field_dirs())


def make_plan(doc, spec, label=None):
    try:
        return segment.plan(doc, label=label, **{k: v for k, v in (spec or {}).items() if v is not None})
    except segment.SegmentError as exc:
        raise UserError(str(exc)) from exc


def _last_full_run(project, p):
    """Facts about the project's last run that the entry beam options rely on."""
    info = project.last_run() or {}
    finished = info.get("status") == "finished"
    stale = False
    try:
        started = time.mktime(time.strptime(info.get("started", ""), "%Y-%m-%d %H:%M:%S"))
        stale = os.path.getmtime(project.lattice_path()) > started
    except (ValueError, OSError, OverflowError):
        pass
    elapsed = info.get("elapsed_s") if finished else None
    total = p.doc.total_length or 0.0
    return {"started": info.get("started"), "finished": finished, "stale": stale,
            "elapsed_s": elapsed, "total": total}


def _input_texts(project):
    return [read_text(project.input_file(n)) if os.path.isfile(project.input_file(n)) else "" for n in ("beam.txt", "input.txt")]


def fingerprint(project, doc, z):
    return segment.upstream_fingerprint(doc, z, _input_texts(project))


def chain_sources(project, p):
    """Finished segment runs whose final particle file is the beam at the entry of plan *p*, best first.

    Runs that recorded a fingerprint are used only while it matches the current project; older runs
    are offered with ``stale`` set when the lattice or beam.txt / input.txt changed after they started.
    """
    want = fingerprint(project, p.doc, p.z_start)
    inputs = [project.lattice_path(), project.input_file("beam.txt"), project.input_file("input.txt")]
    found = []
    for meta in list_segments(project):
        seg_info = meta.get("segment") or {}
        if meta.get("status") != "finished" or seg_info.get("z_end") is None:
            continue
        if abs(float(seg_info["z_end"]) - p.z_start) > 1e-5:
            continue
        out = os.path.join(meta["folder"], "OutputFile")
        final = segment.final_dst(out)
        length = float(seg_info["z_end"]) - float(seg_info.get("z_start") or 0.0)
        m = final and re.search(r"outData_([-+\d.eE]+)\.dst$", os.path.basename(final))
        if not m or abs(float(m.group(1)) - length) > 5e-6:
            continue
        syn = os.path.join(out, "synData.txt")
        try:
            t_exit = segment.exit_time(segment.read_syndata(syn)) if os.path.isfile(syn) else None
        except segment.SegmentError:
            t_exit = None
        if p.needs_timing and t_exit is None:
            continue
        if meta.get("fingerprint"):
            if meta["fingerprint"] != want:
                continue
            stale = False
        else:
            try:
                started = time.mktime(time.strptime(meta.get("created", ""), "%Y-%m-%d %H:%M:%S"))
                stale = any(os.path.isfile(f) and os.path.getmtime(f) > started for f in inputs)
            except (ValueError, OverflowError):
                stale = True
        entry = meta.get("entry") or {}
        accuracy = "approximate" if entry.get("accuracy") == "approximate" or entry.get("choice") == "twiss" else "accurate"
        t0 = entry.get("t_ref") or 0.0
        found.append({"folder": meta["folder"], "name": os.path.basename(meta["folder"]), "label": meta.get("label"),
                      "created": meta.get("created"), "entry": entry.get("choice"), "accuracy": accuracy, "stale": stale,
                      "file": final, "t_ref": None if t_exit is None else t0 + t_exit})
    found.sort(key=lambda s: (s["stale"], s["accuracy"] != "accurate"))      # list_segments is newest first
    return found


def _share(run, a, b, factor=1.0):
    if not run["elapsed_s"] or not run["total"]:
        return None
    return round(float(run["elapsed_s"]) * max(0.0, b - a) / run["total"] * factor, 1)


def entry_options(project, p):
    """``(options, default id)`` for the entry beam of plan *p*."""
    run = _last_full_run(project, p)
    main_s = _share(run, p.z_start, p.z_end)
    if p.at_beginning:
        return [{"id": "beam", "available": True, "accuracy": "exact", "estimate_s": main_s}], "beam"
    ref_s = _share(run, 0.0, p.z_end, 0.2) if p.needs_timing else 0.0
    options = []
    dst = segment.dst_at(project.output_dir, p.z_start)
    options.append({"id": "dst", "available": bool(dst), "accuracy": "accurate",
                    "file": os.path.basename(dst) if dst else None, "run": run["started"], "stale": run["stale"] if dst else False,
                    "estimate_s": None if main_s is None else round(main_s + (ref_s or 0), 1),
                    "reason": None if dst else "no particle file at the entry in OutputFile"})
    chain = chain_sources(project, p)
    src = chain[0] if chain else None
    options.append({"id": "segment", "available": src is not None, "accuracy": src["accuracy"] if src else "accurate",
                    "source": src["name"] if src else None, "run": src["created"] if src else None,
                    "source_entry": src["entry"] if src else None, "stale": src["stale"] if src else False,
                    "estimate_s": None if main_s is None else round(main_s + (ref_s or 0), 1),
                    "reason": None if src else "no finished segment run that ends at the entry"})
    up_s = _share(run, 0.0, p.z_start)
    options.append({"id": "upstream", "available": True, "accuracy": "accurate",
                    "estimate_s": None if main_s is None or up_s is None else round(main_s + up_s + (ref_s or 0), 1)})
    tw = segment.twiss_at(project.output_dir, p.z_start)
    opt = {"id": "twiss", "available": tw is not None, "accuracy": "approximate", "run": run["started"],
           "stale": run["stale"] if tw else False,
           "estimate_s": None if main_s is None else round(main_s + (ref_s or 0), 1),
           "reason": None if tw else "no DataSet.txt of a multi-particle run covering the entry in OutputFile"}
    if tw:
        opt["energy"] = round(tw["energy"], 6)
        opt["twiss"] = {k: [round(v, 6) for v in vals] for k, vals in tw["twiss"].items()}
    options.append(opt)
    if dst:
        default = "dst"
    elif src and src["accuracy"] == "accurate" and not src["stale"]:
        default = "segment"
    else:
        default = "upstream"
    return options, default


def describe(project, doc, spec, label=None):
    """What the approval card shows: the segment, the entry beam options and the output folder."""
    p = make_plan(doc, spec, label)
    options, default = entry_options(project, p)
    return p, {"segment": p.summary(), "options": options, "default": default, "rephase": p.needs_timing,
               "rf": [{"line": s.line_no + 1, "name": s.name or s.param(8), "v3": s.param(2), "phase": s.param(5)} for s in p.rf],
               "folder": f"{SEGMENTS_DIR}/{safe_name(p.label)}_…"}


def safe_name(label):
    s = re.sub(r"[^\w.\-]+", "_", str(label or "segment"), flags=re.UNICODE).strip("._")
    return (s or "segment")[:40]


# =========================================================================== running
def _write_inputs(project, dest, lattice_text, beam=None, inputs=None):
    from avas.ai.sandbox import copy_text_inputs
    shutil.rmtree(dest, ignore_errors=True)
    copy_text_inputs(project, dest)
    write_text(os.path.join(dest, project.lattice_name()), lattice_text)
    for name, values in (("beam.txt", beam), ("input.txt", inputs)):
        if values:
            path = os.path.join(dest, name)
            text = read_text(path) if os.path.isfile(path) else ""
            write_text(path, segment.set_keywords(text, values))


def _save_meta(root, meta):
    try:
        with open(os.path.join(root, META_FILE), "w", encoding="utf-8") as fh:
            json.dump(meta, fh, indent=2, ensure_ascii=False)
    except OSError:
        log.warning("could not write %s", os.path.join(root, META_FILE))


def start(project, spec, choice=None, label=None):
    """Plan the segment from the saved lattice and start its stages; returns the runner job."""
    from avas.gui.services import runner
    doc = load_doc(project)
    p = make_plan(doc, spec, label)
    options, default = entry_options(project, p)
    choice = choice or default
    opt = next((o for o in options if o["id"] == choice), None)
    if opt is None:
        raise UserError(f"Entry beam '{choice}' does not apply to this segment (choose {', '.join(o['id'] for o in options)}).")
    if not opt["available"]:
        raise UserError(f"Entry beam '{choice}' is not available: {opt.get('reason')}.")

    stamp = time.strftime("%Y%m%d-%H%M%S")
    root = os.path.join(segments_root(project), f"{safe_name(p.label)}_{stamp}")
    os.makedirs(root, exist_ok=True)
    field_dirs = project.field_dirs()
    field_dir = field_dirs[0] if field_dirs else project.input_dir
    lattice_name = project.lattice_name()
    chain_src = chain_sources(project, p)[0] if choice == "segment" else None
    meta = {"label": p.label, "created": time.strftime("%Y-%m-%d %H:%M:%S"), "status": "running",
            "project": project.path, "lattice": lattice_name, "spec": spec, "segment": p.summary(),
            "entry": {"choice": choice, **{k: v for k, v in opt.items() if k not in ("id", "available", "reason")}},
            "fingerprint": fingerprint(project, doc, p.z_end), "rephased": [], "stages": []}
    _save_meta(root, meta)
    beam_text = read_text(project.input_file("beam.txt")) if os.path.isfile(project.input_file("beam.txt")) else ""
    input_text = read_text(project.input_file("input.txt")) if os.path.isfile(project.input_file("input.txt")) else ""
    ref_out = os.path.join(root, "reference", "OutputFile")
    up_out = os.path.join(root, "upstream", "OutputFile")
    seg_in, seg_out = os.path.join(root, "InputFile"), os.path.join(root, "OutputFile")

    def spec_for(input_dir, output_dir):
        shutil.rmtree(output_dir, ignore_errors=True)
        return {"input_dir": input_dir, "output_dir": output_dir, "mode": "basic", "field_dir": field_dir,
                "lattice": lattice_name}

    def prepare_reference():
        beam = {"particlenumber": "1"}
        dist = segment.keyword_value(beam_text, "readparticledistribution")
        use_dst = segment.keyword_value(beam_text, "use_dst")
        if dist and dist[0].lower() != "unknown" and (use_dst is None or use_dst[0] != "0"):
            path = dist[0] if os.path.isabs(dist[0]) else project.input_file(dist[0])
            beam.update(readparticledistribution="unknown", use_dst="0",
                        kneticenergy=f"{segment.dst_mean_energy(path):.10g}")
        dest = os.path.join(root, "reference", "InputFile")
        _write_inputs(project, dest, segment.reference_text(p), beam, {"spacecharge": "0", "dumpperiodicity": "0"})
        return spec_for(dest, ref_out)

    def prepare_upstream():
        dest = os.path.join(root, "upstream", "InputFile")
        _write_inputs(project, dest, segment.upstream_text(p), None, {"dumpperiodicity": "0"})
        return spec_for(dest, up_out)

    def prepare_segment():
        beam, entry = {}, {}
        source = None
        if choice == "dst":
            source = segment.dst_at(project.output_dir, p.z_start)
            if not source:
                raise UserError("The particle file at the entry is gone from OutputFile.")
        elif choice == "upstream":
            source = segment.final_dst(up_out)
            if not source:
                raise UserError("The upstream run wrote no particle file.")
        elif choice == "segment":
            source = chain_src["file"]
            if not os.path.isfile(source):
                raise UserError(f"The particle file of {chain_src['name']} is gone.")
        tw = None
        if choice == "twiss":
            tw = segment.twiss_at(project.output_dir, p.z_start)
            if tw is None:
                raise UserError("DataSet.txt of the last run no longer covers the entry.")
            tx, ty, tz = (tw["twiss"][k] for k in ("x", "y", "z"))
            beam.update(readparticledistribution="unknown", use_dst="0", kneticenergy=f"{tw['energy']:.10g}",
                        twissx=" ".join(f"{v:.8g}" for v in tx), twissy=" ".join(f"{v:.8g}" for v in ty),
                        twissz=" ".join(f"{v:.8g}" for v in tz))
            entry = {"energy": tw["energy"], "twiss": tw["twiss"], "centroid_lag_m": tw["centroid_lag_m"]}
        phases, report, inputs = {}, [], {}
        if p.needs_timing:
            rows = segment.read_syndata(os.path.join(ref_out, "synData.txt"))
            t_entry = segment.arrival_time(rows, p.z_start)
            t_ref = t_entry + (segment.centroid_delay(tw) if tw else 0.0)
            if chain_src is not None:
                # the earlier run's reference particle, not the design one, arrives with its particle file
                t_ref = chain_src["t_ref"]
                entry.update(source=chain_src["name"])
            phases, report = segment.rephase(p, rows, t_ref)
            entry.update(t_entry=t_entry, t_ref=t_ref)
            scan = segment.keyword_value(input_text, "scanphase")
            if scan and scan[0] in ("1", "2"):
                inputs["scanphase"] = "0"        # the reference run already applied the scan / scanData.txt
        _write_inputs(project, seg_in, segment.segment_text(p, phases), beam, inputs)
        if source:
            shutil.copy2(source, os.path.join(seg_in, ENTRY_FILE))
            path = os.path.join(seg_in, "beam.txt")
            write_text(path, segment.set_keywords(read_text(path), {"readparticledistribution": ENTRY_FILE, "use_dst": "1"}))
            entry["file"] = os.path.relpath(source, project.path)
        meta["entry"].update(entry)
        meta["rephased"] = report
        _save_meta(root, meta)
        return spec_for(seg_in, seg_out)

    stages = []
    if p.needs_timing:
        stages.append(runner.Stage("reference", "reference timing", prepare_reference))
    if choice == "upstream":
        stages.append(runner.Stage("upstream", "upstream beam", prepare_upstream))
    stages.append(runner.Stage("segment", p.label, prepare_segment, z_offset=p.z_start))

    def finished(job, ok, message, stopped):
        meta.update(status="finished" if ok else ("stopped" if stopped else "failed"),
                    finished=time.strftime("%Y-%m-%d %H:%M:%S"), message=None if ok else message,
                    stages=[{"key": s.key, "status": s.status, "elapsed_s": s.elapsed_s} for s in job.stages])
        _save_meta(root, meta)

    job = runner.Job(project, stages, source="segment", label=p.label, mode="basic", output_dir=seg_out,
                     on_finished=finished)
    job.root = root
    job.meta = meta
    try:
        runner.runner().start_job(job)
    except Exception:
        meta.update(status="failed")
        _save_meta(root, meta)
        if not os.path.isdir(seg_out):
            shutil.rmtree(root, ignore_errors=True)
        raise
    return job


# =========================================================================== results
def list_segments(project):
    root = segments_root(project)
    out = []
    if not os.path.isdir(root):
        return out
    for name in os.listdir(root):
        folder = os.path.join(root, name)
        path = os.path.join(folder, META_FILE)
        if not os.path.isfile(path):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                meta = json.load(fh)
        except (OSError, ValueError):
            continue
        meta["folder"] = folder
        out.append(meta)
    out.sort(key=lambda m: m.get("created") or "", reverse=True)
    return out


@rpc("results.sources")
def sources():
    """Result folders of the project: OutputFile, archived runs (Runs/) and every segment run."""
    p = context.project().require()
    info = p.last_run() or {}
    out = [{"kind": "project", "label": "OutputFile", "outputDir": p.output_dir, "status": info.get("status"),
            "time": info.get("finished") or info.get("started")}]
    from avas.gui.services import runs
    for rec in runs.list_runs(p):
        out.append({"kind": "archived", "label": rec.get("label") or os.path.basename(rec["folder"]),
                    "outputDir": rec["folder"], "status": rec.get("status"),
                    "time": rec.get("finished") or rec.get("started"), "mode": rec.get("mode"),
                    "elapsed_s": rec.get("elapsed_s"), "archivedAt": rec.get("archived_at")})
    for meta in list_segments(p):
        seg = meta.get("segment") or {}
        out.append({"kind": "segment", "label": meta.get("label") or os.path.basename(meta["folder"]),
                    "outputDir": os.path.join(meta["folder"], "OutputFile"), "status": meta.get("status"),
                    "time": meta.get("finished") or meta.get("created"), "zStart": seg.get("z_start"),
                    "zEnd": seg.get("z_end"), "entry": (meta.get("entry") or {}).get("choice"),
                    "rephased": len(meta.get("rephased") or [])})
    return out


# =========================================================================== deleting records
def _same_path(a, b):
    return os.path.normcase(os.path.abspath(a)) == os.path.normcase(os.path.abspath(b))


def _trash(path):
    """Move a file or folder to the recycle bin (patched in tests)."""
    from send2trash import send2trash
    send2trash(os.path.normpath(path))


@rpc("runs.delete")
def delete_run(outputDir):
    """Move a run record to the recycle bin.

    The project's own record is its OutputFile folder (results and avas_run.json
    go together; the folder is recreated empty).  A segment record is the whole
    ``Segments/<label>_<time>/`` folder, given by its OutputFile or its root.
    Refused while a simulation is running, like every other change to the
    project's files.
    """
    p = context.project().require()
    require_unlocked()
    if not outputDir:
        raise UserError("No run record given.")
    if _same_path(outputDir, p.output_dir):
        if os.path.isdir(p.output_dir):
            _trash(p.output_dir)
        os.makedirs(p.output_dir, exist_ok=True)
        log.info("results of the full run moved to the recycle bin: %s", p.output_dir)
        result = {"kind": "project", "outputDir": p.output_dir}
    else:
        from avas.gui.services import runs
        archived = next((r for r in runs.list_runs(p) if _same_path(outputDir, r["folder"])), None)
        if archived is not None:
            _trash(archived["folder"])
            info = p.last_run() or {}
            if info.get("archived") and _same_path(info["archived"], archived["folder"]):
                info.pop("archived", None)
                p.write_run_info(info)
            log.info("run record moved to the recycle bin: %s", os.path.basename(archived["folder"]))
            result = {"kind": "archived", "folder": archived["folder"]}
        else:
            for meta in list_segments(p):
                folder = meta["folder"]
                if _same_path(outputDir, folder) or _same_path(outputDir, os.path.join(folder, "OutputFile")):
                    _trash(folder)
                    log.info("segment run moved to the recycle bin: %s", os.path.basename(folder))
                    result = {"kind": "segment", "folder": folder}
                    break
            else:
                raise UserError("This folder is not a run record of the project.")
    from avas.gui.services import projects
    projects.notify()
    return result
