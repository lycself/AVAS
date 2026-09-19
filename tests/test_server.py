"""The GUI's HTTP / WebSocket transport (avas/gui/server.py): the real uvicorn server in a thread,
exactly as ``avas gui`` and ``avas serve`` start it.  Token check, RPC dispatch, blobs, the event
stream, downloads, static files and shutdown.  No window, no engine run."""
import json
import os
import sys
import time

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "tests", "_output_server")
sys.path.insert(0, ROOT)
os.makedirs(WORK, exist_ok=True)
os.environ.setdefault("AVAS_GUI_SETTINGS", os.path.join(WORK, "gui-settings.json"))

httpx = pytest.importorskip("httpx")
pytest.importorskip("uvicorn")
pytest.importorskip("websockets")


@pytest.fixture(scope="module")
def srv():
    from avas.gui import app as gui_app
    from avas.gui import server
    from avas.gui import services  # noqa: F401 - registers the RPC handlers
    s = server.start(port=0)
    gui_app.state()["server"], gui_app.state()["base_url"] = s, s.base_url
    yield s
    t0 = time.monotonic()
    s.shutdown()
    assert time.monotonic() - t0 < 5


def rpc(srv, method, params=None, token=None):
    headers = {"X-AVAS-Token": srv.token if token is None else token} if token != "" else {}
    return httpx.post(f"{srv.base_url}/api/rpc", json={"method": method, "params": params or {}}, headers=headers, timeout=10)


def test_token_required(srv):
    assert srv.token and len(srv.token) >= 24
    assert rpc(srv, "app.info", token="").status_code == 401
    assert rpc(srv, "app.info", token="wrong").status_code == 401
    r = rpc(srv, "app.info")
    assert r.status_code == 200
    reply = r.json()
    assert reply["ok"] and reply["result"]["host"] == "browser"
    assert srv.token in srv.page_url("browser") and "host=browser" in srv.page_url("browser")
    assert srv.page_url("webview").endswith(f"index.html?host=webview&token={srv.token}")
    dev = srv.page_url("webview", dev_url="http://localhost:5173/")
    assert dev.startswith("http://localhost:5173/?") and "api=" in dev


def test_rpc_errors_are_json(srv):
    reply = rpc(srv, "no.such.method").json()
    assert reply["ok"] is False and "Unknown method" in reply["error"]
    reply = rpc(srv, "fs.list", {"path": os.path.join(WORK, "does-not-exist")}).json()
    assert reply["ok"] is False and reply.get("user") is True
    assert httpx.post(f"{srv.base_url}/api/rpc", content=b"not json", headers={"X-AVAS-Token": srv.token}).status_code == 400
    assert rpc(srv, "app.info", params=None).status_code == 200


def test_fs_listing(srv):
    sub = os.path.join(WORK, "listing", "sub")
    os.makedirs(sub, exist_ok=True)
    with open(os.path.join(WORK, "listing", "a.txt"), "w", encoding="utf-8") as fh:
        fh.write("x" * 10)
    res = rpc(srv, "fs.list", {"path": os.path.join(WORK, "listing")}).json()["result"]
    names = [(e["name"], e["isDir"]) for e in res["entries"]]
    assert names == [("sub", True), ("a.txt", False)]          # folders first
    assert res["parent"] and os.path.normcase(res["parent"]) == os.path.normcase(WORK)
    assert res["roots"]
    st = rpc(srv, "fs.stat", {"path": sub}).json()["result"]
    assert st["exists"] and st["isDir"]
    assert rpc(srv, "fs.home").json()["result"]


def test_blob_roundtrip(srv):
    import numpy as np
    from avas.gui import bridge
    ref = bridge.blob(np.arange(5, dtype="float32"))
    r = httpx.get(f"{srv.base_url}/blob/{ref['__blob__']}", headers={"X-AVAS-Token": srv.token})
    assert r.status_code == 200
    assert np.frombuffer(r.content, dtype="float32").tolist() == [0, 1, 2, 3, 4]
    assert httpx.get(f"{srv.base_url}/blob/{ref['__blob__']}", headers={"X-AVAS-Token": srv.token}).status_code == 404  # one shot
    ref = bridge.blob([1.0])
    assert httpx.get(f"{srv.base_url}/blob/{ref['__blob__']}").status_code == 401


def test_events_over_websocket(srv):
    from websockets.sync.client import connect
    from avas.gui import bridge
    ws_base = srv.base_url.replace("http://", "ws://")
    with connect(f"{ws_base}/api/events?token={srv.token}") as ws:
        for _ in range(50):                     # subscription happens right after accept
            if bridge.connected():
                break
            time.sleep(0.02)
        bridge.emit("test.ping", {"n": 1})
        bridge.emit("test.ping", {"n": 2})
        # other tests in the same process may leave the live monitor or a runner emitting: keep only ours
        batch = [e for e in json.loads(ws.recv(timeout=5)) if e[0].startswith("test.")]
        while len(batch) < 2:
            batch += [e for e in json.loads(ws.recv(timeout=5)) if e[0].startswith("test.")]
        assert batch == [["test.ping", {"n": 1}], ["test.ping", {"n": 2}]]
    for _ in range(50):
        if not bridge.connected():
            break
        time.sleep(0.02)
    assert bridge.connected() == 0
    bridge.emit("test.dropped", None)           # nobody connected: dropped, not queued
    time.sleep(0.1)
    with connect(f"{ws_base}/api/events?token={srv.token}") as ws:
        try:
            got = [e for e in json.loads(ws.recv(timeout=0.3)) if e[0].startswith("test.")]
        except TimeoutError:
            got = []
        assert got == []
    with pytest.raises(Exception):
        with connect(f"{ws_base}/api/events?token=wrong") as ws:
            ws.recv(timeout=2)


def test_download_and_static(srv):
    path = os.path.join(WORK, "result.txt")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("hello")
    r = httpx.get(f"{srv.base_url}/download", params={"path": path, "token": srv.token})
    assert r.status_code == 200 and r.text == "hello"
    assert "attachment" in r.headers.get("content-disposition", "")
    assert httpx.get(f"{srv.base_url}/download", params={"path": path}).status_code == 401
    assert httpx.get(f"{srv.base_url}/download", params={"path": path + ".nope", "token": srv.token}).status_code == 404

    index = httpx.get(f"{srv.base_url}/index.html")
    assert index.status_code == 200 and index.headers["cache-control"] == "no-cache"
    assert httpx.get(f"{srv.base_url}/").status_code == 200
    assert httpx.get(f"{srv.base_url}/..%2Fpyproject.toml").status_code == 404
    assert httpx.get(f"{srv.base_url}/nothing-here.js").status_code == 404
