"""GUI back-end tests: the RPC services the web front end calls (no window is opened).

The example project is copied, simulated once with plt dumps and a density
file, then every page's calls are exercised through ``bridge.dispatch`` exactly
as the page sends them (JSON in, JSON out).
"""
import json
import os
import shutil
import subprocess
import sys
import urllib.request

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010")
WORK = os.path.join(ROOT, "tests", "_output_gui")

sys.path.insert(0, ROOT)
os.environ.setdefault("MPLBACKEND", "Agg")
os.environ["AVAS_GUI_SETTINGS"] = os.path.join(WORK, "gui-settings.json")   # never the user's real settings

pytest.importorskip("webview")


def rpc(method, **params):
    from avas.gui import bridge
    reply = json.loads(bridge.dispatch(method, params))
    return reply


def ok(method, **params):
    reply = rpc(method, **params)
    assert reply["ok"], f"{method}: {reply.get('error')}\n{reply.get('detail', '')}"
    return reply["result"]


def resolve_blobs(value):
    """Replace blob references by numpy arrays (the page fetches them over HTTP)."""
    import numpy as np
    from avas.gui import bridge
    if isinstance(value, dict) and "__blob__" in value:
        return bridge.take_blob(value["__blob__"])
    if isinstance(value, dict):
        return {k: resolve_blobs(v) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve_blobs(v) for v in value]
    return value if not isinstance(value, float) else np.float64(value)


@pytest.fixture(scope="module")
def project():
    shutil.rmtree(WORK, ignore_errors=True)
    inp = os.path.join(WORK, "project", "InputFile")
    shutil.copytree(os.path.join(EXAMPLE, "InputFile"), inp)
    os.makedirs(os.path.join(WORK, "project", "OutputFile"))
    with open(os.path.join(inp, "input.txt"), encoding="utf-8") as fh:
        text = fh.read()
    text = text.replace("dumpperiodicity 0", "dumpperiodicity 5").replace("pchistogram 0 300", "pchistogram 1 300")
    with open(os.path.join(inp, "input.txt"), "w", encoding="utf-8") as fh:
        fh.write(text)
    env = dict(os.environ)
    env.pop("AVAS_LATTICE", None)
    res = subprocess.run([sys.executable, "-m", "avas", "run", "--input", inp,
                          "--output", os.path.join(WORK, "project", "OutputFile")],
                         cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
    assert res.returncode == 0, res.stdout[-2000:] + res.stderr[-2000:]
    from avas.gui import services  # noqa: F401 - registers the handlers
    summary = ok("project.open", path=os.path.join(WORK, "project"))
    assert summary["open"] and summary["latticeName"] == "lattice_mulp.txt"
    return summary


def test_bridge_json_is_strict():
    from avas.gui import bridge
    import numpy as np
    text = bridge.dumps({"a": float("nan"), "b": np.float32(1.5), "c": np.arange(3), "d": [float("inf")]})
    assert json.loads(text) == {"a": None, "b": 1.5, "c": [0, 1, 2], "d": [None]}
    assert json.loads(bridge.dispatch("no.such.method"))["ok"] is False


def test_progress_line_parsing():
    from avas.gui.services.runner import parse_progress
    p = parse_progress("Simulate progress 45.34%. Estimated remaining time 9s. Run time 15s.  1  0.35m     ")
    assert p == {"percent": 45.34, "eta_s": 9.0, "run_s": 15.0, "pos_m": 0.35}
    p = parse_progress("Simulate progress 70.00%. Estimated remaining time 2.50min. Run time 1.05h.")
    assert p["eta_s"] == pytest.approx(150.0) and p["run_s"] == pytest.approx(3780.0)
    assert parse_progress("[avas] mode=basic") is None


def test_server_serves_page_and_blobs():
    from avas.gui import bridge, server
    import numpy as np
    srv, base = server.start()
    try:
        with urllib.request.urlopen(f"{base}/index.html", timeout=10) as resp:
            assert b'<div id="root">' in resp.read()
        ref = bridge.blob(np.array([1.0, 2.0, 3.0]), "float64")
        with urllib.request.urlopen(f"{base}/blob/{ref['__blob__']}", timeout=10) as resp:
            assert np.frombuffer(resp.read(), dtype="<f8").tolist() == [1.0, 2.0, 3.0]
        with pytest.raises(urllib.error.HTTPError):
            urllib.request.urlopen(f"{base}/../avas/paths.py", timeout=10)
    finally:
        srv.shutdown()


def test_settings_page_round_trip(project):
    data = ok("settings.load")
    assert data["form"]["steppercycle"] == "50" and data["form"]["dumpperiodicity"] == "5"
    data["form"]["multithreading"] = True
    data["form"]["error_type"] = "stat"
    data["form"]["error_seed"] = "7"
    saved = ok("settings.save", form=data["form"], meta=data["meta"])
    assert saved["form"]["multithreading"] is True and saved["form"]["error_type"] == "stat"
    from avas.gui.services.runner import ini_error_mode
    from avas.gui import context
    assert ini_error_mode(context.project()) == "stat"
    saved["form"]["error_type"] = ""
    saved["form"]["multithreading"] = False
    ok("settings.save", form=saved["form"], meta=saved["meta"])


def test_beam_page_keeps_unknown_keywords(project):
    path = os.path.join(project["inputDir"], "beam.txt")
    with open(path, "a", encoding="utf-8") as fh:
        fh.write("randomseed 7 ! keep me\n")
    data = ok("beam.load")
    assert data["form"]["particlenumber"] == "5260"
    data["form"]["current"] = "0.2"
    ok("beam.save", form=data["form"])
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    assert "randomseed 7 ! keep me" in text and "current 0.2" in text
    params = ok("beam.fromDst", name="part_rfq.dst")
    assert params["particlenumber"] == "5260" and float(params["emit_x"]) == pytest.approx(0.13768, abs=1e-5)


def test_lattice_page(project):
    info = ok("lattice.list")
    names = [f["name"] for f in info["files"]]
    assert "lattice_mulp.txt" in names and "lattice.txt" not in names
    text = ok("lattice.read", name="lattice_mulp.txt")["text"]
    doc = ok("lattice.parse", text=text)
    assert doc["elementCount"] == 1 and doc["statements"][1]["key"] == "field"
    schema = ok("schema.all")
    assert any(k["key"] == "quad" for k in schema["lattice"])
    alt = os.path.join(project["inputDir"], "lattice_alt.txt")
    shutil.copyfile(os.path.join(project["inputDir"], "lattice_mulp.txt"), alt)
    ok("lattice.setSource", name="lattice_alt.txt")
    assert ok("project.summary")["latticeName"] == "lattice_alt.txt"
    ok("lattice.setSource", name="lattice_mulp.txt")
    ok("lattice.write", name="lattice_mulp.txt", text=text)


def test_files_page(project):
    listing = ok("files.list")
    roles = {f["name"]: f["role"] for f in listing["files"]}
    assert roles["beam.txt"] == "beam" and roles["lattice_mulp.txt"] == "lattice_run"
    assert roles["lattice.txt"] == "generated" and roles["part_rfq.dst"] == "particles"
    opened = ok("files.open", path=os.path.join(project["inputDir"], "input.txt"))
    assert opened["view"] == "text" and "steppercycle" in opened["text"]
    assert rpc("files.save", path=os.path.join(project["inputDir"], "lattice.txt"), text="x")["ok"] is False
    assert rpc("files.open", path=os.path.join(ROOT, "README.md"))["ok"] is False      # outside InputFile
    new = ok("files.create", name="notes.txt")
    renamed = ok("files.rename", path=new, newName="notes2.txt")
    assert os.path.isfile(renamed) and not os.path.exists(new)
    os.remove(renamed)
    particles = resolve_blobs(ok("files.particles", path=os.path.join(project["inputDir"], "part_rfq.dst")))
    assert particles["number"] == 5260 and len(particles["x"]) == 5260
    fm = resolve_blobs(ok("files.fieldmap", path=os.path.join(project["inputDir"], "hwr010.edz")))
    assert fm["nz"] == 105 and len(fm["z"]) == 106


def test_results_plots(project):
    for kind in ("rms_x", "rms_xy", "phi", "beta_xyz", "emittance_z", "loss", "energy", "c_xy"):
        fig = ok("results.figure", plot="dataset", params={"type": kind})
        assert fig["traces"], kind
    assert ok("results.figure", plot="syn_phase")["traces"]
    assert ok("results.figure", plot="cavity_voltage", params={"ratio": {"efield": 2}})["kind"] == "bar"
    overview = ok("results.overview")
    assert overview["density"] and overview["plt"]
    for kind in ("density", "density_level", "centroid", "emit", "rms_size_max"):
        ok("results.figure", plot="density", params={"path": overview["density"][0], "plane": "x", "kind": kind})
    reply = rpc("results.figure", plot="dataset", params={"type": "nonsense"})
    assert reply["ok"] is False and reply.get("user")


def test_phase_space_viewers_and_export(project):
    overview = ok("results.overview")
    dst = [p for p in overview["dst"] if p.endswith("inData.dst")][0]
    handle = ok("phase.openDst", path=dst)["handle"]
    planes = [["x", "x1"], ["y", "y1"], ["phi", "w_minus_mean"], ["x", "y"]]
    data = resolve_blobs(ok("phase.panels", handle=handle, planes=planes, ratio=0.9))
    assert len(data["panels"]) == 4 and data["panels"][0]["image"].size == 300 * 400
    assert "[90%]" in data["twissText"]
    info = ok("phase.pltInfo", path=overview["plt"][0])
    assert info["steps"] > 1
    plt_handle = ok("phase.openPlt", path=overview["plt"][0], step=1)["handle"]
    ok("phase.panels", handle=plt_handle, planes=planes, ratio=1)
    out = ok("tools.pltToDst", step=1)["output"]
    assert os.path.getsize(out) > 1000
    png = os.path.join(WORK, "export.png")
    ok("results.export", plot="dataset", params={"type": "rms_xy"}, path=png)
    from matplotlib.image import imread
    assert tuple(imread(png)[0, 0][:3]) == (1.0, 1.0, 1.0)     # publication export: white background
    ok("results.export", plot="phase", params={"handle": handle, "planes": planes, "ratio": 1},
       path=os.path.join(WORK, "phase.png"))
