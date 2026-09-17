"""Live beam data of the running simulation for the Run page and the visual editor.

A *live run* belongs to one runner job (project run, error study, segment run) or
one assistant study.  It follows the DataSet.txt of the engine run in progress -
an *episode*: error studies have one per error seed, segment runs one per stage,
studies one per evaluation - once per second with
:class:`avas.data.dataset_stream.DatasetTail`, and sends what is new as
``run.live`` events:

* ``{"type": "begin", "run": {...}}`` when a job or study starts;
* ``{"type": "episode", "run": id, "episode": {...}}`` when an engine run starts;
* ``{"type": "rows", "run": id, "episode": id, "reset": bool, "rows": {z: [...], ...}, "losses": [...]}``
  (z in m on the project's beam line, sizes in mm, energy in MeV, macro-particles);
* ``{"type": "band", "run": id, "item": {...}}`` for every finished error seed;
* ``{"type": "end", "run": id}``.

``run.liveSnapshot`` returns everything at once (arrays as blobs, the lattice text
the run uses and the previous run's envelope) for a page that opens during a run.
The last live run stays available after it ends (final state, replay) until the
next one begins.
"""
import logging
import os
import threading
import time
import uuid

import numpy as np

from avas.data.dataset_stream import DatasetTail, dataset_envelope
from avas.gui import bridge
from avas.gui.bridge import rpc
from avas.gui.textio import read_text, text_fingerprint

log = logging.getLogger("avas.gui")

POLL_S = 1.0
IDLE_EXIT_TICKS = 30                 # the thread ends after this many idle polls; wake() restarts it
ROW_KEYS = ("z", "rmsX", "rmsY", "rmsZ", "maxX", "maxY", "energy", "alive")
BAND_POINTS = 1500
ERROR_MODES = ("stat", "dyn", "stat_dyn")


def _lists(arrays):
    return {k: [float(x) for x in v] for k, v in arrays.items()}


def _blobs(arrays):
    return {k: bridge.blob(v, "float32") for k, v in arrays.items()}


class Episode:
    """One engine run whose DataSet.txt is being followed."""

    def __init__(self, key, path, z_offset=0.0, stage=None, stage_label="", index=None, total=None, lattice=None, not_before=None):
        self.id = uuid.uuid4().hex[:12]
        self.key = key
        self.path = path
        self.z_offset = float(z_offset or 0.0)
        self.stage = stage
        self.stage_label = stage_label
        self.index = index
        self.total = total
        self.lattice = lattice                # assistant evaluations: their own lattice
        # a DataSet.txt older than the run is the previous run's until the engine rewrites it
        self.tail = DatasetTail(path, not_before)
        self.chunks = []
        self.losses = []
        self.particles0 = None

    def meta(self):
        return {"id": self.id, "key": self.key, "zOffset": self.z_offset, "stage": self.stage, "stageLabel": self.stage_label,
                "index": self.index, "total": self.total, "particles0": self.particles0}

    def poll(self):
        """New rows since the last call: ``(reset, rows, losses)`` or ``None`` when nothing changed."""
        restarted, rows, losses = self.tail.poll()
        if restarted:                         # the engine rewrote the file (a new run in the same folder)
            self.chunks, self.losses, self.particles0 = [], [], None
        if rows is None:
            return (True, None, []) if restarted else None
        rows = {k: rows[k] for k in ROW_KEYS}
        rows["z"] = rows["z"] + self.z_offset
        for loss in losses:
            loss["z"] += self.z_offset
        if self.particles0 is None and len(rows["alive"]):
            self.particles0 = float(rows["alive"][0])
        self.chunks.append(rows)
        self.losses += losses
        return restarted, rows, losses

    def arrays(self):
        if not self.chunks:
            return {k: np.empty(0) for k in ROW_KEYS}
        return {k: np.concatenate([c[k] for c in self.chunks]) for k in ROW_KEYS}


class LiveRun:
    def __init__(self, kind, key, label="", mode="basic", lattice=None, previous=None, output_dir=None, project=None):
        self.id = uuid.uuid4().hex[:12]
        self.kind = kind                      # project | segment | assistant
        self.project = project                # project folder (jobs)
        self.key = key
        self.label = label
        self.mode = mode
        self.lattice = lattice                # {name, text, fieldDirs, hash} of the run (jobs)
        self.previous = previous              # {env, started, latticeHash}: the run before (project runs)
        self.output_dir = output_dir
        self.t0 = time.time()
        self.started = time.strftime("%Y-%m-%d %H:%M:%S")
        self.episode = None
        self.band = []
        self.band_pending = {}
        self.band_seen = set()
        self.done = False

    def meta(self):
        lat = self.lattice or {}
        return {"id": self.id, "kind": self.kind, "label": self.label, "mode": self.mode, "started": self.started,
                "running": not self.done, "outputDir": self.output_dir, "latticeName": lat.get("name"),
                "latticeHash": lat.get("hash"), "hasPrevious": self.previous is not None, "project": self.project}


def _lattice_info(path, name=None, field_dirs=None):
    if not path or not os.path.isfile(path):
        return None
    text = read_text(path)
    return {"name": name or os.path.basename(path), "text": text, "fieldDirs": list(field_dirs or []),
            "hash": text_fingerprint(text)}


class Monitor:
    def __init__(self):
        self.lock = threading.RLock()
        self.run = None
        self._thread = None
        self._wake = threading.Event()

    # ------------------------------------------------------------------ control
    def wake(self):
        with self.lock:
            if self._thread is None or not self._thread.is_alive():
                self._thread = threading.Thread(target=self._loop, name="avas-live", daemon=True)
                self._thread.start()
        self._wake.set()

    def begin_job(self, job):
        """Called by the runner when *job* starts, before it rewrites the run info and DataSet.txt."""
        try:
            p = job.project
            lattice = _lattice_info(p.lattice_path(), p.lattice_name(), p.field_dirs())
            previous = None
            if job.source == "project":
                env = dataset_envelope(p.output_dir)          # still the previous run's
                if env is not None:
                    info = p.last_run()
                    previous = {"env": env, "started": info.get("started"), "latticeHash": info.get("lattice_sha1")}
            run = LiveRun(job.source, ("job", id(job)), job.label, job.mode, lattice, previous, job.output_dir, p.path)
            with self.lock:
                self._finish(self.run)
                self.run = run
            bridge.emit("run.live", {"type": "begin", "run": run.meta()})
        except Exception:  # noqa: BLE001 - the live display must never stop a run
            log.exception("live display: could not follow the new run")
        self.wake()

    def end_job(self, job):
        """Called by the runner when *job* is over, so the page has the last rows with ``run.finished``."""
        try:
            with self.lock:
                run = self.run
                if run is not None and run.key == ("job", id(job)):
                    self._finish(run)
        except Exception:  # noqa: BLE001
            log.exception("live display: finishing failed")

    # ------------------------------------------------------------------ polling
    def _loop(self):
        idle = 0
        while True:
            self._wake.wait(POLL_S)
            self._wake.clear()
            try:
                busy = self.tick()
            except Exception:  # noqa: BLE001 - keep following
                log.exception("live display: polling failed")
                busy = True
            idle = 0 if busy else idle + 1
            if idle >= IDLE_EXIT_TICKS:
                with self.lock:
                    if self._wake.is_set():
                        continue
                    self._thread = None
                return

    def tick(self):
        """Poll once; returns whether a job or study is active."""
        from avas.ai import sandbox
        from avas.gui.services import runner
        r = runner.runner()
        job, stage = r.current_stage()
        rstate = r.state() if job is not None else {}      # outside our lock (the runner has its own)
        study = sandbox.live_source() if job is None else None
        with self.lock:
            run = self.run
            if job is not None:
                owner = ("job", id(job))
            elif study is not None:
                owner = ("study", study["job"])
            else:
                owner = None
            if run is not None and run.key != owner and not run.done:
                self._finish(run)
            if owner is None:
                return False
            if run is None or run.key != owner:
                if job is not None:
                    run = LiveRun(job.source, owner, job.label, job.mode,
                                  _lattice_info(job.project.lattice_path(), job.project.lattice_name(), job.project.field_dirs()),
                                  None, job.output_dir, job.project.path)
                else:
                    run = LiveRun("assistant", owner, study["label"])
                self.run = run
                bridge.emit("run.live", {"type": "begin", "run": run.meta()})
            spec = self._job_episode(rstate, job, stage) if job is not None else self._study_episode(study)
            ep = run.episode
            if spec is not None and (ep is None or ep.key != spec["key"]):
                if ep is not None:
                    self._poll_episode(run, ep)
                # (file times lag the clock by up to one timer tick, ~16 ms on Windows)
                ep = run.episode = Episode(**spec, not_before=run.t0 - 0.1)
                bridge.emit("run.live", {"type": "episode", "run": run.id, "episode": ep.meta()})
            if ep is not None:
                self._poll_episode(run, ep)
            if run.kind == "project" and run.mode in ERROR_MODES:
                self._scan_band(run)
            return True

    def _job_episode(self, rstate, job, stage):
        if stage is None:
            return None
        if job.source == "project":
            if job.mode in ERROR_MODES:
                step = rstate.get("step")
                return {"key": f"seed:{step}", "path": os.path.join(job.output_dir, "error_middle", "output_0", "DataSet.txt"),
                        "index": step, "total": rstate.get("all_step")}
            return {"key": "run", "path": os.path.join(job.output_dir, "DataSet.txt")}
        if not stage.output_dir:                     # the stage is still being prepared
            return None
        return {"key": f"stage:{stage.key}", "path": os.path.join(stage.output_dir, "DataSet.txt"), "z_offset": stage.z_offset,
                "stage": stage.key, "stage_label": stage.label, "index": job.stages.index(stage) + 1, "total": len(job.stages)}

    def _study_episode(self, study):
        if not study["running"]:
            return None
        return {"key": f"eval:{study['index']}", "path": os.path.join(study["out"], "DataSet.txt"), "index": study["index"],
                "total": study["total"], "lattice": _lattice_info(study["lattice"], None, study["field_dirs"])}

    def _poll_episode(self, run, ep):
        new = ep.poll()
        if new is None:
            return
        reset, rows, losses = new
        payload = {"type": "rows", "run": run.id, "episode": ep.id, "reset": reset, "particles0": ep.particles0,
                   "rows": _lists(rows) if rows is not None else None, "losses": losses}
        bridge.emit("run.live", payload)

    def _scan_band(self, run, final=False):
        """Finished error seeds (copied to error_output/output_<group>_<time>) become band curves."""
        folder = os.path.join(run.output_dir or "", "error_output")
        if not os.path.isdir(folder):
            return
        for name in sorted(os.listdir(folder)):
            path = os.path.join(folder, name, "DataSet.txt")
            if name in run.band_seen or not os.path.isfile(path):
                continue
            try:
                st = os.stat(path)
            except OSError:
                continue
            if st.st_mtime < run.t0 - 1:
                continue                             # from an earlier study
            if not final and run.band_pending.get(name) != st.st_size:
                run.band_pending[name] = st.st_size  # still being copied: take it once its size is stable
                continue
            run.band_seen.add(name)
            env = dataset_envelope(os.path.dirname(path), BAND_POINTS)
            if env is None:
                continue
            parts = name.split("_")
            item = {"label": name, "group": parts[1] if len(parts) > 2 else None, "time": parts[2] if len(parts) > 2 else None,
                    "arrays": {k: env[k] for k in ROW_KEYS}}
            run.band.append(item)
            bridge.emit("run.live", {"type": "band", "run": run.id,
                                     "item": {**{k: v for k, v in item.items() if k != "arrays"}, "rows": _lists(item["arrays"])}})

    def _finish(self, run):
        if run is None or run.done:
            return
        if run.episode is not None:
            self._poll_episode(run, run.episode)
        if run.kind == "project" and run.mode in ERROR_MODES:
            self._scan_band(run, final=True)
        run.done = True
        bridge.emit("run.live", {"type": "end", "run": run.id})

    # ------------------------------------------------------------------ page
    def snapshot(self):
        with self.lock:
            run = self.run
            if run is None:
                return None
            out = run.meta()
            ep = run.episode
            lattice = ep.lattice if run.kind == "assistant" and ep is not None else run.lattice
            out["lattice"] = None if lattice is None else {k: lattice[k] for k in ("name", "text", "fieldDirs", "hash")}
            prev = run.previous
            out["previous"] = None if prev is None else {
                **{k: (bridge.blob(v, "float32") if isinstance(v, np.ndarray) else v) for k, v in prev["env"].items()},
                "started": prev["started"], "latticeHash": prev["latticeHash"]}
            out["episode"] = None if ep is None else {**ep.meta(), "rows": _blobs(ep.arrays()), "losses": list(ep.losses)}
            out["band"] = [{**{k: v for k, v in b.items() if k != "arrays"}, "rows": _blobs(b["arrays"])} for b in run.band]
            return out


_monitor = Monitor()


def monitor():
    return _monitor


@rpc("run.liveSnapshot")
def live_snapshot():
    """Everything the live display has for the current (or last) run; ``None`` before the first run."""
    return _monitor.snapshot()
