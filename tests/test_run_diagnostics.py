"""DataSet.txt health checks: NaN written by the engine, single-particle runs, lost beam, metrics."""
import os

import pytest

from avas.post.analysis.run_diagnostics import dataset_diagnostics, dataset_metrics, failure_hint, read_dataset_array


def _row(energy=65.0, alive=1000, nan=False, rms=1e-3, z=0.0, emit=1e-7):
    v = [0.0] * 41
    v[0] = energy
    v[5] = z
    v[13] = v[14] = v[15] = emit
    v[16] = v[18] = rms
    v[22] = v[24] = 3 * rms
    v[28] = alive
    tokens = [repr(x) for x in v]
    if nan:
        for c in (7, 10, 13, 16):
            tokens[c] = "-nan(ind)"
    return " ".join(tokens)


def _write(tmp_path, rows):
    path = os.path.join(tmp_path, "DataSet.txt")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(rows) + "\n")
    return str(tmp_path)


def test_reads_msvc_nan_tokens_and_drops_partial_row(tmp_path):
    out = _write(tmp_path, [_row(), _row(nan=True, z=0.1), "65.0 1 2"])
    data = read_dataset_array(os.path.join(out, "DataSet.txt"))
    assert data.shape == (2, 41)
    assert data[1, 16] != data[1, 16]          # NaN


def test_single_particle_nan_is_expected(tmp_path):
    out = _write(tmp_path, [_row(alive=1, nan=True, z=0.1 * i) for i in range(5)])
    d = dataset_diagnostics(out)
    assert d["singleParticle"] and d["nan"]["firstRow"] == 0
    assert d["messages"][0]["level"] == "info" and "SingleParticle" in d["messages"][0]["text"][0]


def test_nan_in_multi_particle_run_is_a_warning(tmp_path):
    rows = [_row(z=0.1 * i) for i in range(5)] + [_row(nan=True, z=0.5 + 0.1 * i) for i in range(3)]
    d = dataset_diagnostics(_write(tmp_path, rows))
    assert d["nan"]["firstRow"] == 5 and d["nan"]["z"] == pytest.approx(0.5)
    assert d["messages"][0]["level"] == "warning" and "z ≈ 0.5 m" in d["messages"][0]["text"][0]


def test_lost_beam_and_metrics(tmp_path):
    rows = [_row(alive=1000, z=0.0, energy=10.0), _row(alive=990, z=1.0, energy=11.0, rms=2e-3, emit=1.1e-7),
            _row(alive=0, z=2.0, energy=12.0)]
    out = _write(tmp_path, rows)
    d = dataset_diagnostics(out)
    assert d["allLost"]["z"] == pytest.approx(2.0)
    assert any(m["level"] == "error" for m in d["messages"])
    m = dataset_metrics(out)
    assert m["transmission"] == 0.0 and m["lost"] == 1000
    assert m["rms_x_max"] == pytest.approx(2.0) and m["rms_x_max_z"] == pytest.approx(1.0)
    assert m["emit_x_growth"] == pytest.approx(0.1)        # last valid row (alive > 0) vs first
    assert [loc["z"] for loc in m["loss_locations"]] == [1.0, 2.0]


def test_failure_hint_for_old_nan_crash():
    assert "NaN" in failure_hint("could not convert string to float: '-nan(ind)'")[0]
    assert failure_hint("some other error") is None
