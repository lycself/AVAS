"""AI assistant service: AVAS tools, approvals, undo, conversations, sandbox runs.

A scripted OpenAI-compatible server stands in for the model, so the whole
turn (streaming, tool calls, proposals, persistence) runs without a real LLM.
No window is opened: requests to the page return ``None`` and the tools fall
back to the files, as in the CLI.
"""
import json
import os
import shutil
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010")
WORK = os.path.join(ROOT, "tests", "_output_assistant")

sys.path.insert(0, ROOT)
os.environ.setdefault("MPLBACKEND", "Agg")
os.environ["AVAS_GUI_SETTINGS"] = os.path.join(WORK, "gui-settings.json")
os.environ["AVAS_AI_DATA"] = os.path.join(WORK, "ai-data")


def rpc(method, **params):
    from avas.gui import bridge
    return json.loads(bridge.dispatch(method, params))


def ok(method, **params):
    reply = rpc(method, **params)
    assert reply["ok"], f"{method}: {reply.get('error')}\n{reply.get('detail', '')}"
    return reply["result"]


# --------------------------------------------------------------------------- scripted model
class Script:
    """Replies in order; each is ("text", str) or ("tools", [(name, args), ...])."""

    def __init__(self):
        self.replies = []
        self.requests = []

    def next(self, body):
        self.requests.append(body)
        return self.replies.pop(0) if self.replies else ("text", "done")


SCRIPT = Script()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        kind, payload = SCRIPT.next(body)
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()

        def send(obj):
            self.wfile.write(b"data: " + json.dumps(obj).encode() + b"\n\n")
            self.wfile.flush()

        if kind == "text":
            for i in range(0, len(payload), 5):
                send({"choices": [{"index": 0, "delta": {"content": payload[i:i + 5]}}]})
            send({"choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]})
        else:
            for i, (name, args) in enumerate(payload):
                send({"choices": [{"index": 0, "delta": {"tool_calls": [
                    {"index": i, "id": f"call{i}{int(time.time() * 1000) % 100000}", "type": "function",
                     "function": {"name": name, "arguments": json.dumps(args)}}]}}]})
            send({"choices": [{"index": 0, "delta": {}, "finish_reason": "tool_calls"}]})
        self.wfile.write(b"data: [DONE]\n\n")


@pytest.fixture(scope="module")
def server():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}/v1"
    srv.shutdown()


@pytest.fixture(scope="module")
def project(server):
    shutil.rmtree(WORK, ignore_errors=True)
    shutil.copytree(os.path.join(EXAMPLE, "InputFile"), os.path.join(WORK, "project", "InputFile"))
    os.makedirs(os.path.join(WORK, "project", "OutputFile"))
    from avas.gui import services  # noqa: F401
    ok("project.open", path=os.path.join(WORK, "project"))
    ok("assistant.saveProvider", provider={"name": "mock", "preset": "custom", "baseUrl": server, "model": "mock",
                                           "toolMode": "native", "contextTokens": 16000})
    return os.path.join(WORK, "project")


def lattice_text(project):
    with open(os.path.join(project, "InputFile", "lattice_mulp.txt"), encoding="utf-8") as fh:
        return fh.read()


def wait_idle(conv_id, timeout=120):
    from avas.gui.services import assistant
    t0 = time.time()
    while time.time() - t0 < timeout:
        conv = assistant._get(conv_id)
        if not conv.busy:
            return conv
        time.sleep(0.05)
    raise AssertionError("assistant turn did not finish")


def wait_for(pred, timeout=30):
    t0 = time.time()
    while time.time() - t0 < timeout:
        v = pred()
        if v:
            return v
        time.sleep(0.05)
    raise AssertionError("condition not met")


# --------------------------------------------------------------------------- tests
def test_turn_with_read_tools_and_persistence(project):
    SCRIPT.replies = [("tools", [("project_overview", {}), ("list_elements", {})]), ("text", "One RF cavity.")]
    conv = ok("assistant.new")
    ok("assistant.send", conversation=conv["id"], text="What is in this lattice?", ui={"page": "lattice"})
    c = wait_idle(conv["id"])
    roles = [i["role"] for i in c.items]
    assert roles == ["user", "tool", "tool", "assistant"], c.items
    assert all(i["status"] == "ok" for i in c.items if i["role"] == "tool")
    assert c.items[-1]["text"] == "One RF cavity."
    # the system prompt carries the project facts and the UI context
    system = SCRIPT.requests[0]["messages"][0]["content"]
    assert "lattice_mulp.txt" in system and "lattice page" in system
    assert {t["function"]["name"] for t in SCRIPT.requests[0]["tools"]} >= {"edit_lattice", "optimize", "run_simulation"}
    # saved and reloadable
    listed = ok("assistant.conversations")
    assert listed[0]["id"] == conv["id"] and listed[0]["title"] == "What is in this lattice?"
    from avas.gui.services import assistant
    with assistant._conv_lock:
        assistant._conversations.clear()
    loaded = ok("assistant.load", id=conv["id"])
    assert [i["role"] for i in loaded["items"]] == roles


def test_edit_needs_approval_and_can_be_undone(project):
    before = lattice_text(project)
    SCRIPT.replies = [("tools", [("edit_lattice", {"changes": [{"line": 2, "param": "phase", "value": -30}],
                                                   "reason": "less bunching"})]), ("text", "Changed.")]
    conv = ok("assistant.new")
    ok("assistant.send", conversation=conv["id"], text="set the phase to -30")
    from avas.gui.services import assistant
    c = assistant._get(conv["id"])
    prop = wait_for(lambda: next((i for i in c.items if i["role"] == "proposal" and i["status"] == "pending"), None))
    assert prop["proposal"]["changes"][0]["old"] == "-33" and prop["proposal"]["changes"][0]["new"] == "-30"
    assert lattice_text(project) == before                      # nothing written before approval
    ok("assistant.decide", conversation=conv["id"], id=prop["id"], decision="apply")
    wait_idle(conv["id"])
    assert " -30 " in lattice_text(project)
    tool = next(i for i in c.items if i["role"] == "tool")
    assert json.loads(tool["result"])["applied"] is True
    ok("assistant.undo", conversation=conv["id"], id=prop["id"])
    assert lattice_text(project) == before
    backups = os.path.join(project, ".avas_ai", "backups", conv["id"], prop["id"])
    assert os.path.isfile(os.path.join(backups, "lattice_mulp.txt.before"))


def test_rejected_edit_is_reported_to_the_model(project):
    before = lattice_text(project)
    SCRIPT.replies = [("tools", [("edit_beam", {"values": {"current": 1.0}})]), ("text", "OK, not changed.")]
    conv = ok("assistant.new")
    ok("assistant.send", conversation=conv["id"], text="raise the current")
    from avas.gui.services import assistant
    c = assistant._get(conv["id"])
    prop = wait_for(lambda: next((i for i in c.items if i["role"] == "proposal" and i["status"] == "pending"), None))
    ok("assistant.decide", conversation=conv["id"], id=prop["id"], decision="reject")
    wait_idle(conv["id"])
    assert prop["id"] and next(i for i in c.items if i["role"] == "proposal")["status"] == "rejected"
    tool_msg = [m for m in c.messages if m["role"] == "tool"][0]
    assert "rejected" in tool_msg["content"]
    assert lattice_text(project) == before


def test_invalid_edit_is_refused_without_a_proposal(project):
    SCRIPT.replies = [("tools", [("edit_lattice", {"changes": [{"line": 2, "param": "L", "value": -1}]})]), ("text", "Sorry.")]
    conv = ok("assistant.new")
    ok("assistant.send", conversation=conv["id"], text="make it negative")
    c = wait_idle(conv["id"])
    assert not any(i["role"] == "proposal" for i in c.items)
    tool = next(i for i in c.items if i["role"] == "tool")
    assert tool["status"] == "error" and "negative" in tool["summary"]


def test_stop_while_waiting_for_approval(project):
    SCRIPT.replies = [("tools", [("edit_input", {"values": {"spacecharge": 0}})]), ("text", "stopped")]
    conv = ok("assistant.new")
    ok("assistant.send", conversation=conv["id"], text="turn off space charge")
    from avas.gui.services import assistant
    c = assistant._get(conv["id"])
    wait_for(lambda: any(i["role"] == "proposal" for i in c.items))
    ok("assistant.stop", conversation=conv["id"])
    wait_idle(conv["id"])
    assert next(i for i in c.items if i["role"] == "proposal")["status"] == "cancelled"
    with open(os.path.join(project, "InputFile", "input.txt"), encoding="utf-8") as fh:
        assert "spacecharge 1" in fh.read()


def test_edits_are_refused_while_a_run_locks_the_inputs(project):
    from avas.ai import ToolContext, ToolError
    from avas.ai.avas_tools import build_tools
    from avas.gui.services import assistant, runner
    before = lattice_text(project)
    r = runner.runner()
    # a change asked for during the run: refused at once, no card
    conv = assistant.Conversation(project)
    tools = {t.name: t for t in build_tools(assistant.Host(conv))}
    ctx = ToolContext(call_id="t", emit=lambda e: None, stop_event=threading.Event(), agent=None)
    r.job = object()
    try:
        for name, args in (("edit_lattice", {"changes": [{"line": 2, "param": "phase", "value": -30}]}),
                           ("edit_beam", {"values": {"current": 1.0}}),
                           ("set_run_lattice", {"name": "lattice_mulp.txt"})):
            with pytest.raises(ToolError, match="locked"):
                tools[name].handler(args, ctx)
        assert not any(i["role"] == "proposal" for i in conv.items)
    finally:
        r.job = None
    # a card approved after the run started: not applied either
    SCRIPT.replies = [("tools", [("edit_lattice", {"changes": [{"line": 2, "param": "phase", "value": -31}]})]), ("text", "Later.")]
    c = ok("assistant.new")
    ok("assistant.send", conversation=c["id"], text="set the phase to -31")
    conv = assistant._get(c["id"])
    prop = wait_for(lambda: next((i for i in conv.items if i["role"] == "proposal" and i["status"] == "pending"), None))
    r.job = object()
    try:
        ok("assistant.decide", conversation=c["id"], id=prop["id"], decision="apply")
        wait_idle(c["id"])
    finally:
        r.job = None
    assert next(i for i in conv.items if i["role"] == "proposal")["status"] == "failed"
    assert "locked" in [m for m in conv.messages if m["role"] == "tool"][0]["content"]
    assert lattice_text(project) == before


def test_preview_scan_and_optimize(project):
    pytest.importorskip("avas.sim.linear_optics")
    from avas.ai import ToolContext
    from avas.ai.avas_tools import build_tools
    from avas.gui.services import assistant
    conv = assistant.Conversation(project)
    conv.auto_apply = True
    tools = {t.name: t for t in build_tools(assistant.Host(conv))}
    events = []
    ctx = ToolContext(call_id="t", emit=events.append, stop_event=threading.Event(), agent=None)
    scan = tools["scan_parameter"].handler({"target": {"line": 2}, "param": "Ke", "start": 1.0, "stop": 1.6,
                                            "steps": 4, "engine": "preview"}, ctx)
    assert len(scan["rows"]) == 4 and scan["rows"][-1]["energy_out"] > scan["rows"][0]["energy_out"]
    assert any(e.get("kind") == "chart" for e in events)
    before = lattice_text(project)
    res = tools["optimize"].handler({"variables": [{"line": 2, "param": "Ke", "min": 1.0, "max": 2.0}],
                                     "objective": {"metric": "energy_out", "goal": "max"}, "engine": "preview",
                                     "max_evaluations": 15}, ctx)
    assert res["best_values"][0]["best"] == pytest.approx(2.0, abs=0.05)
    assert res["apply"]["applied"] is True and lattice_text(project) != before
    with open(os.path.join(project, "InputFile", "lattice_mulp.txt"), "w", encoding="utf-8") as fh:
        fh.write(before)


def test_sandbox_scan_runs_the_engine_without_touching_the_project(project):
    from avas.ai import ToolContext
    from avas.ai.avas_tools import build_tools
    from avas.gui.services import assistant
    conv = assistant.Conversation(project)
    conv.auto_apply = True
    tools = {t.name: t for t in build_tools(assistant.Host(conv))}
    ctx = ToolContext(call_id="s", emit=lambda e: None, stop_event=threading.Event(), agent=None)
    out = os.path.join(project, "OutputFile")
    before = sorted(os.listdir(out))
    res = tools["scan_parameter"].handler({"target": {"line": 2}, "param": "phase", "values": [-33, -25],
                                           "engine": "simulation"}, ctx)
    rows = res["rows"]
    assert len(rows) == 2 and all("error" not in r for r in rows), rows
    assert rows[0]["transmission"] == pytest.approx(1.0) and rows[1]["energy_out"] != rows[0]["energy_out"]
    assert sorted(os.listdir(out)) == before                 # project results untouched
    assert " -33 " in lattice_text(project)


def test_sandbox_study_shows_on_the_run_page_and_can_be_paused_and_stopped(project):
    """A simulation-based scan is one 'assistant' job for the runner: visible, pausable, and Stop ends the turn."""
    from avas.ai import ToolContext, ToolError
    from avas.ai.avas_tools import build_tools
    from avas.gui.services import assistant, runner
    conv = assistant.Conversation(project)
    conv.auto_apply = True
    tools = {t.name: t for t in build_tools(assistant.Host(conv))}
    stop = threading.Event()
    ctx = ToolContext(call_id="p", emit=lambda e: None, stop_event=stop, agent=None)
    outcome = {}

    def work():
        try:
            outcome["result"] = tools["scan_parameter"].handler(
                {"target": {"line": 2}, "param": "phase", "values": [-40, -35, -30, -25], "engine": "simulation"}, ctx)
        except ToolError as exc:
            outcome["error"] = str(exc)

    thread = threading.Thread(target=work)
    thread.start()
    try:
        t0 = time.time()
        # (the runner keeps the last job's percent, e.g. from test_gui in the same process)
        while not (runner.state().get("source") == "assistant" and runner.state().get("percent")) and time.time() - t0 < 120:
            time.sleep(0.2)
        state = runner.state()
        assert state["running"] and state["source"] == "assistant" and state["label"] == "parameter scan"
        assert state["step"] == 1 and state["all_step"] == 4 and runner.any_active() and not runner.is_running()
        assert ok("run.pause")["paused"] is True
        pct = runner.state()["percent"]
        time.sleep(2.0)
        assert runner.state()["percent"] == pct                  # the engine is frozen
        assert ok("run.resume")["paused"] is False
        assert rpc("run.start")["ok"] is False                   # no normal run during a study
        assert ok("run.stop") is True
        thread.join(60)
        assert not thread.is_alive()
        assert outcome.get("error") == "Stopped by the user." and stop.is_set()
        assert runner.state()["running"] is False and not runner.any_active()
    finally:
        stop.set()
        thread.join(60)
