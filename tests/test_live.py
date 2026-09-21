"""Live display of a running simulation: incremental DataSet.txt reading and the run monitor.

DataSet rows are synthetic (41 columns) so the tests need no engine run.
"""
import os
import sys

import numpy as np
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


def row(z, alive=100, energy=1.5, rms_x=1e-3, bend=0, step=(0.0, 0.0), nan=False):
    v = [0.0] * 41
    v[0] = energy
    v[5] = z
    v[16] = rms_x
    v[18] = 2e-3
    v[20] = 3e-3
    v[22] = 4e-3
    v[24] = 5e-3
    v[28] = alive
    v[35] = bend
    v[37], v[38] = step
    text = " ".join(f"{x:.6g}" for x in v)
    if nan:
        text = text.replace(f"{2e-3:.6g}", "-nan(ind)", 1)
    return text + "\n"


def test_tail_reads_only_new_complete_rows(tmp_path):
    from avas.data.dataset_stream import DatasetTail
    path = tmp_path / "DataSet.txt"
    lines = [row(0.01 * i, alive=100 - (i >= 3) * 5) for i in range(6)]
    path.write_text(lines[0] + lines[1] + lines[2] + lines[3][:20])
    tail = DatasetTail(str(path))
    restarted, rows, losses = tail.poll()
    assert not restarted and list(np.round(rows["z"], 6)) == [0.0, 0.01, 0.02]
    assert rows["rmsX"][0] == pytest.approx(1.0) and rows["rmsZ"][0] == pytest.approx(3.0)      # mm
    assert tail.poll() == (False, None, [])
    with open(path, "a") as fh:
        fh.write(lines[3][20:] + lines[4] + lines[5].replace("\n", "") + "\n")
    _, rows, losses = tail.poll()
    assert len(rows["z"]) == 3 and losses == [{"z": pytest.approx(0.03), "n": 5.0}]
    path.write_text(row(0.0, nan=True))                     # a new engine run rewrote the file
    restarted, rows, losses = tail.poll()
    assert restarted and len(rows["z"]) == 1 and np.isnan(rows["rmsY"][0]) and losses == []


@pytest.mark.parametrize("rewritten_after", [0, 1])
def test_tail_ignores_the_previous_runs_file_until_it_is_rewritten(tmp_path, rewritten_after):
    from avas.data.dataset_stream import DatasetTail
    path = tmp_path / "DataSet.txt"
    path.write_text(row(0.0) + row(0.1) + row(0.2))           # left over from the previous run
    # Control both timestamps: Windows file mtimes and time.time() need not
    # advance together for writes performed immediately after the cutoff.
    started = 1_700_000_000
    old = started - 60
    os.utime(path, (old, old))
    tail = DatasetTail(str(path), not_before=started)
    assert tail.poll() == (False, None, [])                    # the engine is still starting
    path.write_text(row(0.0))                                  # rewritten by the new run
    rewritten = started + rewritten_after
    os.utime(path, (rewritten, rewritten))
    restarted, rows, _ = tail.poll()
    assert not restarted and list(rows["z"]) == [0.0]


def test_path_length_continues_across_chunks_with_bends():
    from avas.data.dataset_stream import PathLength
    from avas.post.analysis.run_diagnostics import normalise_tokens, parse_dataset_lines
    text = "".join([row(0.0), row(0.1), row(0.1, bend=1, step=(0.03, 0.04)), row(0.1, bend=2, step=(0.03, 0.04)),
                    row(0.1, bend=2, step=(0.03, 0.04)), row(0.3, step=(0.0, 0.2)), row(0.5, step=(0.0, 0.2))])
    d = parse_dataset_lines(normalise_tokens(text.encode()).splitlines())
    whole_z, whole_keep = PathLength().update(d)
    pl = PathLength()
    parts = [pl.update(d[i:j]) for i, j in ((0, 2), (2, 4), (4, 7))]
    z = np.concatenate([p[0] for p in parts])
    keep = np.concatenate([p[1] for p in parts])
    assert list(keep) == list(whole_keep) == [True, True, True, True, False, True, True]
    assert np.allclose(z[keep], whole_z[whole_keep])
    assert np.allclose(z[keep], [0.0, 0.1, 0.15, 0.2, 0.4, 0.6])


class _Project:
    def __init__(self, root):
        self.path = str(root)
        self.input_dir = os.path.join(self.path, "InputFile")
        self.output_dir = os.path.join(self.path, "OutputFile")
        os.makedirs(self.input_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        with open(self.lattice_path(), "w") as fh:
            fh.write("start\ndrift 0.5 0.02 0\nend\n")

    def lattice_path(self):
        return os.path.join(self.input_dir, "lattice_mulp.txt")

    def lattice_name(self):
        return "lattice_mulp.txt"

    def field_dirs(self):
        return [self.input_dir]

    def last_run(self):
        return {"started": "2026-09-17 10:00:00", "lattice_sha1": "abc"}


@pytest.fixture
def events(monkeypatch):
    from avas.gui import bridge
    got = []
    monkeypatch.setattr(bridge, "emit", lambda name, payload=None: got.append((name, payload)))
    return got


@pytest.fixture
def runner_job():
    from avas.gui.services import runner
    r = runner.runner()
    yield r
    r.job = None
    r._stage = -1


def test_monitor_follows_a_project_run(tmp_path, events, runner_job):
    from avas.gui.services import live, runner
    from avas.gui.textio import text_fingerprint
    p = _Project(tmp_path)
    ds = os.path.join(p.output_dir, "DataSet.txt")
    with open(ds, "w") as fh:                                    # the previous run
        fh.write("".join(row(0.05 * i, energy=2.0) for i in range(10)))
    job = runner.Job(p, [runner.Stage("run", "", lambda: {})], source="project", mode="basic")
    m = live.Monitor()
    m.wake = lambda: None
    runner_job.job, runner_job._stage = job, 0
    m.begin_job(job)
    begin = [e for n, e in events if e["type"] == "begin"][0]
    assert begin["run"]["kind"] == "project" and begin["run"]["latticeHash"] == text_fingerprint("start\ndrift 0.5 0.02 0\nend\n")
    with open(ds, "w") as fh:                                    # the engine rewrites DataSet.txt
        fh.write(row(0.0) + row(0.01))
    assert m.tick() is True
    kinds = [e["type"] for n, e in events]
    assert kinds[-2:] == ["episode", "rows"]
    rows = events[-1][1]
    assert rows["rows"]["z"] == [0.0, 0.01] and rows["particles0"] == 100
    with open(ds, "a") as fh:
        fh.write(row(0.02, alive=90))
    m.tick()
    assert events[-1][1]["losses"] == [{"z": pytest.approx(0.02), "n": 10.0}]
    snap = m.snapshot()
    assert snap["lattice"]["text"].startswith("start") and snap["previous"]["started"] == "2026-09-17 10:00:00"
    assert snap["episode"]["particles0"] == 100 and "__blob__" in snap["episode"]["rows"]["z"]
    m.end_job(job)
    assert events[-1][1]["type"] == "end" and m.snapshot()["running"] is False


def test_monitor_segment_stage_offset_and_error_band(tmp_path, events, runner_job):
    from avas.gui.services import live, runner
    p = _Project(tmp_path)
    stage = runner.Stage("segment", "MEBT", lambda: {}, z_offset=1.5)
    stage.output_dir = os.path.join(p.path, "Segments", "MEBT", "OutputFile")
    os.makedirs(stage.output_dir)
    job = runner.Job(p, [stage], source="segment", label="MEBT", output_dir=stage.output_dir)
    m = live.Monitor()
    m.wake = lambda: None
    runner_job.job, runner_job._stage = job, 0
    m.begin_job(job)
    with open(os.path.join(stage.output_dir, "DataSet.txt"), "w") as fh:
        fh.write(row(0.0) + row(0.2))
    m.tick()
    ep = [e for n, e in events if e["type"] == "episode"][-1]["episode"]
    assert ep["zOffset"] == 1.5 and ep["stageLabel"] == "MEBT"
    assert events[-1][1]["rows"]["z"] == [1.5, 1.7]
    m.end_job(job)

    # error study: finished seeds become band curves once their DataSet is complete
    events.clear()
    job = runner.Job(p, [runner.Stage("run", "", lambda: {})], source="project", mode="stat")
    runner_job.job, runner_job._stage = job, 0
    m.begin_job(job)
    seed = os.path.join(p.output_dir, "error_output", "output_1_2")
    os.makedirs(seed)
    with open(os.path.join(seed, "DataSet.txt"), "w") as fh:
        fh.write(row(0.0) + row(0.1) + row(0.2))
    m.tick()
    assert not any(e["type"] == "band" for n, e in events)      # size not yet seen twice
    m.tick()
    band = [e for n, e in events if e["type"] == "band"]
    assert len(band) == 1 and band[0]["item"]["group"] == "1" and band[0]["item"]["rows"]["z"] == pytest.approx([0.0, 0.1, 0.2])
    m.tick()
    assert len([e for n, e in events if e["type"] == "band"]) == 1
    assert len(m.snapshot()["band"]) == 1
