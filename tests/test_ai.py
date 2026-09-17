"""AI assistant plumbing tests (avas.ai): no internet, no real model.

A small OpenAI-compatible mock server runs on a random loopback port.  Each
test scripts its replies (SSE streams, JSON bodies, HTTP errors, delays) and
inspects the requests the client sent.
"""
import json
import os
import socket
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from avas.ai import agent as agent_mod                      # noqa: E402
from avas.ai import secrets as secrets_mod                  # noqa: E402
from avas.ai.agent import (FINAL_ANSWER_PROMPT, Agent, Tool, ToolError, _ReplyFilter,  # noqa: E402
                           history_to_text_protocol, parse_tool_call_block, shrink_history)
from avas.ai.client import (ChatClient, LLMError, ProviderConfig, TagStreamSplitter,  # noqa: E402
                            mask_secret, normalize_base_url, parse_tool_arguments)
from avas.ai.presets import PRESETS, get_preset             # noqa: E402

SECRET_KEY = "sk-test-SECRETSECRETSECRET1234"


# =========================================================================== mock server
class SSE:
    """A streamed reply: each item is a chunk dict (JSON-encoded) or a raw data string."""

    def __init__(self, chunks, delay=0.0, done=True):
        self.chunks, self.delay, self.done = chunks, delay, done

    def send(self, h):
        h.send_response(200)
        h.send_header("Content-Type", "text/event-stream")
        h.end_headers()
        try:
            for chunk in self.chunks:
                data = chunk if isinstance(chunk, str) else json.dumps(chunk)
                h.wfile.write(f"data: {data}\n\n".encode("utf-8"))
                h.wfile.flush()
                if self.delay:
                    time.sleep(self.delay)
            if self.done:
                h.wfile.write(b"data: [DONE]\n\n")
                h.wfile.flush()
        except OSError:
            pass


class ChunkedSSE(SSE):
    """Like SSE but HTTP/1.1 chunked transfer encoding, as uvicorn/Ollama/llama.cpp send it."""

    def send(self, h):
        h.wfile.write(b"HTTP/1.1 200 OK\r\nContent-Type: text/event-stream; charset=utf-8\r\n"
                      b"Transfer-Encoding: chunked\r\nConnection: close\r\n\r\n")
        payloads = [c if isinstance(c, str) else json.dumps(c) for c in self.chunks] + (["[DONE]"] if self.done else [])
        try:
            for data in payloads:
                raw = f"data: {data}\r\n\r\n".encode("utf-8")
                h.wfile.write(f"{len(raw):x}\r\n".encode() + raw + b"\r\n")
                h.wfile.flush()
                if self.delay:
                    time.sleep(self.delay)
            h.wfile.write(b"0\r\n\r\n")
            h.wfile.flush()
        except OSError:
            pass
        h.close_connection = True


class JSONReply:
    def __init__(self, status, obj, headers=None):
        self.status, self.obj, self.headers = status, obj, headers or {}

    def send(self, h):
        raw = json.dumps(self.obj).encode("utf-8")
        h.send_response(self.status)
        h.send_header("Content-Type", "application/json")
        h.send_header("Content-Length", str(len(raw)))
        for k, v in self.headers.items():
            h.send_header(k, v)
        h.end_headers()
        try:
            h.wfile.write(raw)
        except OSError:
            pass


class Delay:
    def __init__(self, seconds, then):
        self.seconds, self.then = seconds, then

    def send(self, h):
        time.sleep(self.seconds)
        self.then.send(h)


class WatchDisconnect:
    """Send nothing; set ``mock.disconnected`` when the client closes the connection (like a busy server)."""

    def __init__(self, seconds):
        self.seconds = seconds

    def send(self, h):
        sock = h.connection
        sock.settimeout(0.05)
        end = time.monotonic() + self.seconds
        while time.monotonic() < end:
            try:
                if sock.recv(1, socket.MSG_PEEK) == b"":
                    h.server.mock.disconnected = True
                    return
            except socket.timeout:
                continue
            except OSError:
                h.server.mock.disconnected = True
                return


class _Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def log_message(self, *args):
        pass

    def do_GET(self):
        mock = self.server.mock
        mock.requests.append({"method": "GET", "path": self.path, "headers": dict(self.headers), "body": None})
        if self.path == "/v1/models" and mock.models is not None:
            JSONReply(200, {"object": "list", "data": [{"id": m, "object": "model"} for m in mock.models]}).send(self)
        elif self.path == "/api/tags" and mock.ollama_tags is not None:
            JSONReply(200, {"models": [{"name": m} for m in mock.ollama_tags]}).send(self)
        else:
            JSONReply(404, {"error": "404 page not found"}).send(self)

    def do_POST(self):
        mock = self.server.mock
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length) or b"{}")
        mock.requests.append({"method": "POST", "path": self.path, "headers": dict(self.headers), "body": body})
        responder = mock.script.pop(0) if mock.script else mock.default
        if responder is None:
            responder = JSONReply(500, {"error": {"message": "mock: script exhausted"}})
        if callable(responder):
            responder = responder(body)
        responder.send(self)


class MockLLM:
    def __init__(self):
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.server.daemon_threads = True
        self.server.block_on_close = False
        self.server.mock = self
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}/v1"
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
        self.thread.start()
        self.reset()

    def reset(self):
        self.script, self.requests, self.default, self.disconnected = [], [], None, False
        self.models, self.ollama_tags = ["m1", "qwen-test"], None

    def posts(self):
        return [r for r in self.requests if r["method"] == "POST"]

    def close(self):
        self.server.shutdown()
        self.server.server_close()


@pytest.fixture(scope="module")
def _server():
    mock = MockLLM()
    yield mock
    mock.close()


@pytest.fixture
def mock(_server):
    _server.reset()
    yield _server
    _server.reset()


@pytest.fixture(autouse=True)
def fast_retries(monkeypatch):
    monkeypatch.setattr(ChatClient, "retry_delays", (0.01, 0.01))


def cfg(mock, **kw):
    kw.setdefault("api_key", SECRET_KEY)
    kw.setdefault("timeout", 10.0)
    return ProviderConfig(base_url=mock.base_url, model="qwen-test", **kw)


# --------------------------------------------------------------------------- chunk builders
def delta(finish=None, **d):
    return {"id": "c1", "object": "chat.completion.chunk", "choices": [{"index": 0, "delta": d, "finish_reason": finish}]}


def usage_chunk(prompt=11, completion=7):
    return {"id": "c1", "choices": [], "usage": {"prompt_tokens": prompt, "completion_tokens": completion,
                                                 "total_tokens": prompt + completion}}


def text_stream(text, size=3, **kw):
    chunks = [delta(role="assistant", content="")]
    chunks += [delta(content=text[i:i + size]) for i in range(0, len(text), size)]
    chunks += [delta(finish="stop"), usage_chunk()]
    return SSE(chunks, **kw)


def tool_stream(calls, text=""):
    """*calls*: list of (id, name, arguments dict); arguments streamed in 5-char fragments."""
    chunks = [delta(role="assistant", content=text or None)]
    for i, (cid, name, args) in enumerate(calls):
        chunks.append(delta(tool_calls=[{"index": i, "id": cid, "type": "function",
                                         "function": {"name": name, "arguments": ""}}]))
        raw = json.dumps(args)
        for j in range(0, len(raw), 5):
            chunks.append(delta(tool_calls=[{"index": i, "function": {"arguments": raw[j:j + 5]}}]))
    chunks += [delta(finish="tool_calls"), usage_chunk()]
    return SSE(chunks)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# =========================================================================== presets / helpers
def test_presets_shape():
    ids = [p["id"] for p in PRESETS]
    assert len(ids) == len(set(ids))
    for want in ("ollama", "lmstudio", "vllm", "llamacpp", "xinference", "openai", "deepseek", "dashscope",
                 "moonshot", "siliconflow", "zhipu", "openrouter", "custom"):
        assert want in ids
    for p in PRESETS:
        assert set(p) >= {"id", "label", "base_url", "needs_key", "local", "notes"}
        assert len(p["notes"]) == 2 and all(p["notes"])
        if p["local"]:
            assert p["base_url"].startswith("http://localhost:") and not p["needs_key"]
        elif p["id"] != "custom":
            assert p["base_url"].startswith("https://") and p["needs_key"]
            assert normalize_base_url(p["base_url"]) == p["base_url"]
    assert get_preset("nope")["id"] == "custom"


def test_normalize_base_url():
    assert normalize_base_url("localhost:11434") == "http://localhost:11434/v1"
    assert normalize_base_url(" http://127.0.0.1:1234/ ") == "http://127.0.0.1:1234/v1"
    assert normalize_base_url("http://localhost:5555") == "http://localhost:5555"
    assert normalize_base_url("api.deepseek.com/v1/") == "https://api.deepseek.com/v1"
    assert normalize_base_url("https://x.org/v1/chat/completions") == "https://x.org/v1"
    assert normalize_base_url("https://x.openai.azure.com/openai/deployments/d?api-version=2024-10-21") == \
        "https://x.openai.azure.com/openai/deployments/d?api-version=2024-10-21"
    client = ChatClient(ProviderConfig("https://x.openai.azure.com/openai/deployments/d?api-version=1", "m"))
    assert client.url("/chat/completions") == "https://x.openai.azure.com/openai/deployments/d/chat/completions?api-version=1"
    assert ChatClient(ProviderConfig("http://localhost:11434", "m")).server_name == "Ollama"
    with pytest.raises(LLMError):
        normalize_base_url("  ")


def test_parse_tool_arguments():
    assert parse_tool_arguments('{"a": 1}') == {"a": 1}
    assert parse_tool_arguments({"a": 1}) == {"a": 1}
    assert parse_tool_arguments("") == {} and parse_tool_arguments(None) == {}
    assert parse_tool_arguments('```json\n{"a": [1, 2]}\n```') == {"a": [1, 2]}
    assert parse_tool_arguments('{"a": 1, "b": [1, 2,],}') == {"a": 1, "b": [1, 2]}
    assert parse_tool_arguments('{"a": {"b": "x"') == {"a": {"b": "x"}}
    assert parse_tool_arguments("{'a': True, 'b': None}") == {"a": True, "b": None}
    assert parse_tool_arguments(json.dumps('{"a": 2}')) == {"a": 2}
    assert parse_tool_arguments("Sure: {\"x\": 3} done") == {"x": 3}
    assert parse_tool_arguments("not json at all") == {"__invalid__": "not json at all"}


def test_mask_secret():
    text = f"Incorrect API key provided: {SECRET_KEY}. Header Authorization: Bearer abc.def-ghi api_key=zzzzzzzzzz12"
    masked = mask_secret(text, SECRET_KEY)
    assert SECRET_KEY not in masked and "abc.def-ghi" not in masked and "zzzzzzzzzz12" not in masked
    assert SECRET_KEY not in repr(ProviderConfig("http://x", "m", api_key=SECRET_KEY))
    assert "api_key" not in ProviderConfig("http://x", "m", api_key=SECRET_KEY).to_dict()


def test_tag_splitter_char_by_char():
    text = "a<think>b<c</think>d<thin"
    sp = TagStreamSplitter("<think>", "</think>")
    segs = []
    for ch in text:
        segs += sp.feed(ch)
    segs += sp.flush()
    inside = "".join(s for k, s in segs if k == "in")
    outside = "".join(s for k, s in segs if k == "out")
    assert inside == "b<c" and outside == "ad<thin"
    assert [k for k, _ in segs if k in ("open", "close")] == ["open", "close"]


def test_reply_filter_hides_tool_calls_and_invented_results():
    shown = []
    filt = _ReplyFilter(shown.append)
    text = ('Checking.<tool_call>{"name": "add", "arguments": {"a": 1}}</tool_call>\n'
            '<tool_call>{"name": "add", "arguments": {"a": 2}}</tool_call><tool_result name="add">fake')
    for ch in text:
        filt.feed(ch)
    filt.finish()
    visible = "".join(e["delta"] for e in shown)
    assert "<tool" not in visible and "fake" not in visible and visible.startswith("Checking.")
    assert [parse_tool_call_block(b)[0]["arguments"]["a"] for b in filt.blocks] == [1, 2]
    two = parse_tool_call_block('{"name": "a", "arguments": {}}\n{"name": "b", "arguments": {"x": 1}}')
    assert [c["name"] for c in two] == ["a", "b"]
    assert parse_tool_call_block("garbage")[0]["name"] == ""


# =========================================================================== client
def test_stream_text_and_request(mock):
    mock.script.append(text_stream("Hello, 世界 world!"))
    client = ChatClient(cfg(mock, temperature=0.3, max_tokens=99, extra_body={"options": {"num_ctx": 4096}}))
    events = list(client.stream_chat([{"role": "user", "content": "hi", "extra": 1}]))
    assert "".join(e["delta"] for e in events if e["type"] == "text") == "Hello, 世界 world!"
    done = events[-1]
    assert done["type"] == "done" and done["finish_reason"] == "stop" and done["usage"]["total_tokens"] == 18
    req = mock.posts()[0]
    assert req["path"] == "/v1/chat/completions"
    assert req["headers"]["Authorization"] == "Bearer " + SECRET_KEY
    body = req["body"]
    assert body["model"] == "qwen-test" and body["stream"] is True and body["temperature"] == 0.3
    assert body["max_tokens"] == 99 and body["options"] == {"num_ctx": 4096} and "tools" not in body
    assert body["messages"] == [{"role": "user", "content": "hi"}]
    assert body["stream_options"] == {"include_usage": True}


def test_chunked_stream_arrives_incrementally(mock):
    chunks = [delta(content=w) for w in ("one ", "two ", "three ", "four")] + [delta(finish="stop")]
    mock.script.append(ChunkedSSE(chunks, delay=0.15))
    start, stamps, text = time.monotonic(), [], []
    for event in ChatClient(cfg(mock)).stream_chat([{"role": "user", "content": "q"}], stop_event=threading.Event()):
        if event["type"] == "text":
            stamps.append(time.monotonic() - start)
            text.append(event["delta"])
    assert "".join(text) == "one two three four"
    assert stamps[0] < 0.4 and stamps[-1] - stamps[0] > 0.3          # live, not buffered until the end


def test_reasoning_fields_and_split_think_tags(mock):
    mock.script.append(SSE([
        delta(role="assistant"), delta(reasoning_content="Let me "), delta(reasoning="think."),
        delta(content="<th"), delta(content="ink>inner"), delta(content=" thought</thi"),
        delta(content="nk>\n\nAns"), delta(content="wer <"), delta(content="b>"), delta(finish="stop"),
    ]))
    result = ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])
    assert result["reasoning"] == "Let me think.inner thought"
    assert result["content"] == "Answer <b>"
    assert result["finish_reason"] == "stop" and result["tool_calls"] == []


def test_tool_call_fragments_and_odd_servers(mock):
    stream = tool_stream([("call_A", "add", {"a": 1, "b": 2}), ("call_B", "fail", {"reason": "boom 💥"})])
    chunks = stream.chunks[:-2] + [
        # whole call in one chunk, no index, no id, arguments as an object
        delta(tool_calls=[{"type": "function", "function": {"name": "progress", "arguments": {"n": 3}}}]),
        # invalid JSON arguments
        delta(tool_calls=[{"index": 7, "id": "call_C", "function": {"name": "add", "arguments": "{oops"}}]),
    ] + stream.chunks[-2:]
    mock.script.append(SSE(chunks))
    events = list(ChatClient(cfg(mock)).stream_chat([{"role": "user", "content": "q"}],
                                                   tools=[{"type": "function", "function": {"name": "add"}}]))
    calls = [e for e in events if e["type"] == "tool_call"]
    assert [c["name"] for c in calls] == ["add", "fail", "progress", "add"]
    assert calls[0]["id"] == "call_A" and calls[0]["arguments"] == {"a": 1, "b": 2}
    assert json.loads(calls[1]["raw_arguments"]) == {"reason": "boom 💥"}
    assert calls[2]["arguments"] == {"n": 3} and len(calls[2]["id"]) == 9
    assert calls[3]["arguments"] == {"__invalid__": "{oops"}
    assert events[-1]["finish_reason"] == "tool_calls"
    assert mock.posts()[0]["body"]["tools"][0]["function"]["name"] == "add"


def test_whole_tool_calls_reusing_index_zero(mock):
    mock.script.append(SSE([
        delta(tool_calls=[{"index": 0, "function": {"name": "a", "arguments": '{"x": 1}'}}]),
        delta(tool_calls=[{"index": 0, "function": {"name": "b", "arguments": '{"y": 2}'}}]),
        delta(finish="tool_calls"),
    ]))
    calls = ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])["tool_calls"]
    assert [(c["name"], c["arguments"]) for c in calls] == [("a", {"x": 1}), ("b", {"y": 2})]


def test_non_streaming_json_reply(mock):
    mock.script.append(JSONReply(200, {"choices": [{"index": 0, "finish_reason": "tool_calls", "message": {
        "role": "assistant", "content": "<think>hmm</think>Sure.",
        "tool_calls": [{"id": "t1", "type": "function", "function": {"name": "add", "arguments": '{"a": 5}'}}]}}],
        "usage": {"prompt_tokens": 3, "completion_tokens": 2, "total_tokens": 5}}))
    result = ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])
    assert result["content"] == "Sure." and result["reasoning"] == "hmm"
    assert result["tool_calls"][0]["arguments"] == {"a": 5} and result["usage"]["total_tokens"] == 5


def test_list_models_and_test(mock):
    client = ChatClient(cfg(mock))
    assert client.list_models() == ["m1", "qwen-test"]
    info = client.test()
    assert info["ok"] and info["models"] == ["m1", "qwen-test"] and info["latency_ms"] >= 0 and "warning" not in info
    info = ChatClient(ProviderConfig(mock.base_url, "missing")).test()
    assert info["ok"] and "missing" in info["warning"]
    mock.models, mock.ollama_tags = None, ["llama3.1:8b", "qwen2.5:7b"]       # old Ollama without /v1/models
    assert client.list_models() == ["llama3.1:8b", "qwen2.5:7b"]


def test_test_without_model_listing_probes_chat(mock):
    mock.models = None
    mock.script.append(text_stream("pong"))
    info = ChatClient(cfg(mock)).test()
    assert info["ok"] and info["models"] == []
    assert mock.posts()[0]["body"]["max_tokens"] == 8


def test_test_reports_auth_error(mock):
    mock.models = None
    mock.script.append(JSONReply(401, {"error": {"message": f"Incorrect API key provided: {SECRET_KEY}"}}))
    info = ChatClient(cfg(mock)).test()
    assert not info["ok"] and info["kind"] == "auth" and SECRET_KEY not in info["error"]


@pytest.mark.parametrize("status, payload, tools, kind", [
    (401, {"error": {"message": f"Incorrect API key provided: {SECRET_KEY}", "code": "invalid_api_key"}}, False, "auth"),
    (404, {"error": {"message": 'model "qwen-test" not found, try pulling it first'}}, False, "not_found"),
    (400, {"error": {"message": "registry.ollama.ai/library/gemma2:2b does not support tools"}}, True,
     "tools_unsupported"),
    (400, {"object": "error", "message": '"auto" tool choice requires --enable-auto-tool-choice and '
                                         '--tool-call-parser to be set', "code": 400}, True, "tools_unsupported"),
    (400, {"error": {"message": "This model's maximum context length is 8192 tokens. However, your messages "
                                "resulted in 9000 tokens."}}, False, "context_length"),
    (400, {"error": {"message": "the request exceeds the available context size, try increasing it",
                     "type": "exceed_context_size_error"}}, True, "context_length"),
    (400, {"error": {"message": "tool_choice is weird"}}, False, "bad_request"),
    (429, {"error": {"message": "Rate limit reached"}}, False, "rate_limit"),
])
def test_http_error_kinds(mock, status, payload, tools, kind):
    mock.default = JSONReply(status, payload, headers={"Retry-After": "0"})
    tool_list = [{"type": "function", "function": {"name": "x", "parameters": {}}}] if tools else None
    with pytest.raises(LLMError) as info:
        list(ChatClient(cfg(mock)).stream_chat([{"role": "user", "content": "q"}], tools=tool_list))
    err = info.value
    assert err.kind == kind and err.status == status
    assert SECRET_KEY not in str(err) and SECRET_KEY not in err.detail
    assert len(mock.posts()) == (3 if kind == "rate_limit" else 1)


def test_retry_after_server_error(mock):
    mock.script += [JSONReply(500, {"error": "boom"}), JSONReply(502, {"error": "bad gateway"}), text_stream("ok")]
    assert ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])["content"] == "ok"
    assert len(mock.posts()) == 3


def test_retry_gives_up(mock):
    mock.default = JSONReply(503, {"error": {"message": "overloaded"}})
    with pytest.raises(LLMError) as info:
        ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])
    assert info.value.kind == "server" and "overloaded" in str(info.value) and len(mock.posts()) == 3


def test_stream_options_rejected_is_dropped(mock):
    mock.script += [JSONReply(400, {"error": {"message": "Extra inputs are not permitted: stream_options"}}),
                    text_stream("fine")]
    client = ChatClient(cfg(mock))
    assert client.complete([{"role": "user", "content": "q"}])["content"] == "fine"
    assert "stream_options" in mock.posts()[0]["body"] and "stream_options" not in mock.posts()[1]["body"]


def test_error_inside_stream(mock):
    mock.script.append(SSE([{"error": {"message": "prompt is too long for this model", "code": 400}}]))
    with pytest.raises(LLMError) as info:
        ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}])
    assert info.value.kind == "context_length"


def test_connection_refused_message():
    port = free_port()
    client = ChatClient(ProviderConfig(f"http://127.0.0.1:{port}/v1", "m", timeout=5))
    with pytest.raises(LLMError) as info:
        client.complete([{"role": "user", "content": "q"}])
    assert info.value.kind == "connection"
    assert f"http://127.0.0.1:{port}/v1" in str(info.value) and "running?" in str(info.value)
    ollama = ChatClient(ProviderConfig("http://localhost:11434/v1", "m"))
    assert "is Ollama running?" in str(ollama._network_error(ConnectionRefusedError(), 5))
    remote = ChatClient(ProviderConfig("https://api.example.com/v1", "m"))
    assert "proxy" in str(remote._network_error(ConnectionRefusedError(), 5))


def test_timeout_before_headers(mock):
    mock.script.append(Delay(1.5, text_stream("late")))
    start = time.monotonic()
    with pytest.raises(LLMError) as info:
        ChatClient(cfg(mock, timeout=0.3)).complete([{"role": "user", "content": "q"}])
    assert info.value.kind == "timeout" and time.monotonic() - start < 1.2


def test_stop_during_slow_stream(mock):
    mock.script.append(text_stream("x" * 200, size=1, delay=0.05))
    stop = threading.Event()
    threading.Timer(0.3, stop.set).start()
    got, start = [], time.monotonic()
    with pytest.raises(LLMError) as info:
        for event in ChatClient(cfg(mock)).stream_chat([{"role": "user", "content": "q"}], stop_event=stop):
            got.append(event)
    assert info.value.kind == "stopped"
    assert time.monotonic() - start < 1.0 and 0 < len(got) < 100


@pytest.mark.parametrize("sse", [SSE, ChunkedSSE])
def test_stop_unblocks_a_stalled_read(mock, sse):
    mock.script.append(sse([delta(content="first"), delta(content="never")], delay=3.0))
    stop = threading.Event()
    threading.Timer(0.3, stop.set).start()
    got, start = [], time.monotonic()
    with pytest.raises(LLMError) as info:
        for event in ChatClient(cfg(mock)).stream_chat([{"role": "user", "content": "q"}], stop_event=stop):
            got.append(event)
    assert info.value.kind == "stopped" and time.monotonic() - start < 1.0
    assert [e.get("delta") for e in got] == ["first"]


def test_stop_while_waiting_for_headers_closes_connection(mock):
    mock.script.append(WatchDisconnect(3.0))
    stop = threading.Event()
    threading.Timer(0.2, stop.set).start()
    start = time.monotonic()
    with pytest.raises(LLMError) as info:
        ChatClient(cfg(mock)).complete([{"role": "user", "content": "q"}], stop_event=stop)
    assert info.value.kind == "stopped" and time.monotonic() - start < 1.0
    deadline = time.monotonic() + 1.0
    while not mock.disconnected and time.monotonic() < deadline:
        time.sleep(0.02)
    assert mock.disconnected                    # the server learns about the stop immediately


# =========================================================================== agent
class Recorder:
    def __init__(self):
        self.events, self.lock = [], threading.Lock()

    def __call__(self, event):
        json.dumps(event)                       # every event must be JSON-able
        with self.lock:
            self.events.append(event)

    def of(self, kind):
        return [e for e in self.events if e["type"] == kind]

    def text(self):
        return "".join(e["delta"] for e in self.of("text"))


def _add(args, ctx):
    return {"sum": args["a"] + args["b"]}


def _fail(args, ctx):
    raise ToolError(f"cannot do that: {args.get('reason')}")


def _progress(args, ctx):
    for i in range(args["n"]):
        ctx.emit({"message": f"step {i}", "fraction": (i + 1) / args["n"]})
    return "progress finished"


def _crash(args, ctx):
    return 1 / 0


def _big(args, ctx):
    return "0123456789" * 5000


def _numpy(args, ctx):
    return {"v": float("nan"), "arr": np.arange(3), "x": np.float64(2.5), "inf": np.inf}


OBJ = {"type": "object", "properties": {}}
TOOLS = [
    Tool("add", "Add two numbers.", {"type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}},
                                     "required": ["a", "b"]}, _add),
    Tool("fail", "Always fails.", OBJ, _fail),
    Tool("progress", "Reports progress.", {"type": "object", "properties": {"n": {"type": "integer"}}}, _progress,
         long_running=True),
    Tool("crash", "Raises an unexpected error.", OBJ, _crash),
    Tool("big", "Returns a lot of text.", OBJ, _big),
    Tool("numpy", "Returns numpy values.", OBJ, _numpy),
]


def make_agent(mock, rec, tool_mode="auto", **kw):
    return Agent(cfg(mock, tool_mode=tool_mode), TOOLS, "You are the AVAS assistant.", rec, **kw)


def assert_valid_history(hist):
    """OpenAI format: every tool message answers a tool_call of the nearest preceding assistant message."""
    json.dumps(hist)
    pending = set()
    for msg in hist:
        assert msg["role"] in ("user", "assistant", "tool")
        if msg["role"] == "tool":
            assert msg["tool_call_id"] in pending
            pending.discard(msg["tool_call_id"])
            assert isinstance(msg["content"], str)
        else:
            assert not pending, f"unanswered tool calls {pending}"
            if msg.get("tool_calls"):
                pending = {c["id"] for c in msg["tool_calls"]}
                for c in msg["tool_calls"]:
                    assert c["type"] == "function" and isinstance(json.loads(c["function"]["arguments"]), dict)
    assert not pending


def test_agent_native_end_to_end(mock):
    mock.script += [
        tool_stream([("call_1", "add", {"a": 2, "b": 3}), ("call_2", "fail", {"reason": "nope"}),
                     ("call_3", "progress", {"n": 3}), ("call_4", "crash", {})], text="Working."),
        text_stream("All done."),
    ]
    rec = Recorder()
    agent = make_agent(mock, rec)
    hist = agent.run([], "Please compute.", threading.Event())
    assert_valid_history(hist)
    assert [m["role"] for m in hist] == ["user", "assistant", "tool", "tool", "tool", "tool", "assistant"]
    assert hist[1]["content"] == "Working." and hist[-1]["content"] == "All done."
    ends = {e["id"]: e for e in rec.of("tool_end")}
    assert ends["call_1"]["ok"] and ends["call_1"]["result"] == {"sum": 5}
    assert not ends["call_2"]["ok"] and "cannot do that: nope" in ends["call_2"]["result"]["error"]
    assert not ends["call_4"]["ok"] and "ZeroDivisionError" in ends["call_4"]["result"]["error"]
    assert [e["name"] for e in rec.of("tool_start")] == ["add", "fail", "progress", "crash"]
    prog = rec.of("tool_progress")
    assert len(prog) == 3 and all(p["id"] == "call_3" and p["name"] == "progress" for p in prog)
    assert prog[-1]["fraction"] == 1.0
    assert rec.text() == "Working.All done."
    end = rec.of("turn_end")[-1]
    assert end["reason"] == "done" and end["steps"] == 2 and end["tool_mode"] == "native"
    assert end["usage"]["total_tokens"] == 36 and end["usage"]["last_prompt_tokens"] == 11
    # requests: system prompt first, tools offered, results fed back with ids
    first, second = mock.posts()[0]["body"], mock.posts()[1]["body"]
    assert first["messages"][0] == {"role": "system", "content": "You are the AVAS assistant."}
    assert [t["function"]["name"] for t in first["tools"]] == [t.name for t in TOOLS]
    tool_msgs = [m for m in second["messages"] if m["role"] == "tool"]
    assert [m["tool_call_id"] for m in tool_msgs] == ["call_1", "call_2", "call_3", "call_4"]
    assert json.loads(tool_msgs[0]["content"]) == {"sum": 5} and tool_msgs[2]["content"] == "progress finished"
    # a follow-up turn continues the persisted history
    mock.script.append(text_stream("Again."))
    hist2 = agent.run(json.loads(json.dumps(hist)), "And again?", threading.Event())
    assert hist2[:len(hist)] == hist and hist2[-1] == {"role": "assistant", "content": "Again."}
    assert len(mock.posts()[2]["body"]["messages"]) == len(hist2)          # system + all but the new reply


def test_agent_auto_falls_back_to_prompted(mock):
    def reject_tools(body):
        if "tools" in body:
            return JSONReply(400, {"error": {"message": "registry.ollama.ai/library/phi3:mini does not support tools",
                                             "type": "api_error"}})
        return JSONReply(500, {"error": "unexpected"})

    call_text = 'Let me add.<tool_call>{"name": "add", "arguments": {"a": 1, "b": 2}}</tool_call>'
    mock.script += [reject_tools, text_stream(call_text, size=4), text_stream("The sum is 3.")]
    rec = Recorder()
    agent = make_agent(mock, rec)
    hist = agent.run([], "Add 1 and 2", threading.Event())
    assert agent.effective_tool_mode == "prompted"
    assert rec.of("notice")[0]["kind"] == "tool_mode"
    assert rec.text() == "Let me add.The sum is 3."
    assert_valid_history(hist)
    assert hist[1]["tool_calls"][0]["function"]["name"] == "add" and hist[1]["content"] == "Let me add."
    assert json.loads(hist[2]["content"]) == {"sum": 3}
    posts = mock.posts()
    assert len(posts) == 3 and "tools" not in posts[1]["body"] and "tools" not in posts[2]["body"]
    system = posts[1]["body"]["messages"][0]["content"]
    assert system.startswith("You are the AVAS assistant.") and "<tool_call>" in system and "### add" in system
    last = posts[2]["body"]["messages"]
    assert [m["role"] for m in last] == ["system", "user", "assistant", "user"]
    assert "<tool_call>" in last[2]["content"]
    assert last[3]["content"].startswith('<tool_result name="add" id="') and '{"sum":3}' in last[3]["content"]
    # the fallback is remembered: the next turn goes straight to prompted mode
    mock.script.append(text_stream("Hi."))
    agent.run(hist, "thanks", threading.Event())
    assert "tools" not in mock.posts()[3]["body"]


def test_agent_native_mode_executes_text_tool_calls(mock):
    mock.script += [text_stream('<tool_call>\n{"name": "add", "arguments": {"a": 4, "b": 4}}\n</tool_call>', size=7),
                    text_stream("8")]
    rec = Recorder()
    agent = make_agent(mock, rec, tool_mode="native")
    hist = agent.run([], "4+4", threading.Event())
    assert agent.effective_tool_mode == "native"
    assert rec.of("tool_end")[0]["result"] == {"sum": 8} and rec.text() == "8"
    assert_valid_history(hist)
    assert "tools" in mock.posts()[1]["body"]


def test_agent_explicit_native_does_not_fall_back(mock):
    mock.script.append(JSONReply(400, {"error": {"message": "model does not support tools"}}))
    rec = Recorder()
    agent = make_agent(mock, rec, tool_mode="native")
    hist = agent.run([], "hi", threading.Event())
    assert rec.of("error")[0]["kind"] == "tools_unsupported" and rec.of("turn_end")[0]["reason"] == "error"
    assert hist == [{"role": "user", "content": "hi"}] and agent.effective_tool_mode == "native"


def test_agent_max_steps_asks_for_final_answer(mock):
    counter = iter(range(100))
    mock.default = lambda body: (tool_stream([(f"c{next(counter)}", "add", {"a": 1, "b": 1})]) if "tools" in body
                                 else text_stream("Final answer."))
    rec = Recorder()
    hist = make_agent(mock, rec, max_steps=2).run([], "loop forever", threading.Event())
    posts = mock.posts()
    assert len(posts) == 3 and "tools" in posts[0]["body"] and "tools" not in posts[2]["body"]
    final_msgs = posts[2]["body"]["messages"]
    assert final_msgs[-1]["role"] == "user" and FINAL_ANSWER_PROMPT in final_msgs[-1]["content"]
    assert all(m["role"] != "tool" for m in final_msgs)
    assert rec.of("turn_end")[0]["reason"] == "max_steps" and rec.of("notice")[0]["kind"] == "max_steps"
    assert hist[-1] == {"role": "assistant", "content": "Final answer."}
    assert_valid_history(hist)


def test_agent_stop_during_stream(mock):
    mock.script.append(text_stream("slow words " * 40, size=2, delay=0.03))
    rec = Recorder()
    stop = threading.Event()
    threading.Timer(0.3, stop.set).start()
    start = time.monotonic()
    hist = make_agent(mock, rec).run([], "talk", stop)
    assert time.monotonic() - start < 1.0
    assert rec.of("turn_end")[0]["reason"] == "stopped" and not rec.of("error")
    assert hist[-1]["role"] == "assistant" and 0 < len(hist[-1]["content"]) < 400
    assert_valid_history(hist)


def test_agent_stop_during_tools(mock):
    def stopper(args, ctx):
        ctx.stop_event.set()
        return "stopping"

    tools = TOOLS + [Tool("stopper", "Sets stop.", OBJ, stopper)]
    mock.script.append(tool_stream([("s1", "stopper", {}), ("s2", "add", {"a": 1, "b": 1})]))
    rec = Recorder()
    agent = Agent(cfg(mock), tools, "sys", rec)
    hist = agent.run([{"role": "user", "content": "old"}, {"role": "assistant", "content": "old reply"}], "go",
                     threading.Event())
    assert [e["name"] for e in rec.of("tool_start")] == ["stopper"]
    assert rec.of("turn_end")[0]["reason"] == "stopped" and len(mock.posts()) == 1
    assert "Cancelled" in hist[-1]["content"] and hist[-1]["tool_call_id"] == "s2"
    assert_valid_history(hist)


def test_agent_truncates_tool_output_and_cleans_json(mock):
    mock.script += [tool_stream([("b1", "big", {}), ("n1", "numpy", {})]), text_stream("ok")]
    rec = Recorder()
    hist = make_agent(mock, rec, max_tool_chars=1000).run([], "big please", threading.Event())
    ends = {e["id"]: e for e in rec.of("tool_end")}
    assert len(ends["b1"]["result"]) == 50000
    assert ends["n1"]["result"] == {"v": None, "arr": [0, 1, 2], "x": 2.5, "inf": None}
    sent = {m["tool_call_id"]: m["content"] for m in mock.posts()[1]["body"]["messages"] if m["role"] == "tool"}
    assert len(sent["b1"]) <= 1000 and "output truncated" in sent["b1"]
    assert sent["b1"].startswith("0123456789") and sent["b1"].endswith("0123456789")
    assert sent["n1"] == '{"v":null,"arr":[0,1,2],"x":2.5,"inf":null}'
    assert hist[2]["content"] == sent["b1"]


def test_agent_unknown_tool_and_invalid_arguments(mock):
    mock.script += [SSE([delta(tool_calls=[{"index": 0, "id": "u1", "function": {"name": "nope", "arguments": "{}"}},
                                           {"index": 1, "id": "u2", "function": {"name": "add", "arguments": "{bad"}}]),
                         delta(finish="tool_calls")]),
                    text_stream("sorry")]
    rec = Recorder()
    hist = make_agent(mock, rec).run([], "x", threading.Event())
    ends = rec.of("tool_end")
    assert "Unknown tool 'nope'" in ends[0]["result"]["error"] and not ends[0]["ok"]
    assert "not valid JSON" in ends[1]["result"]["error"]
    assert_valid_history(hist)


def test_agent_error_returns_history(mock):
    mock.script.append(JSONReply(401, {"error": {"message": "Invalid token"}}))
    rec = Recorder()
    old = [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}]
    hist = make_agent(mock, rec).run(old, "c", threading.Event())
    assert hist == old + [{"role": "user", "content": "c"}]
    err = rec.of("error")[0]
    assert err["kind"] == "auth" and err["status"] == 401 and rec.of("turn_end")[0]["reason"] == "error"


def _history_with_tool_results(turns, size):
    hist = []
    for t in range(turns):
        cid = f"id{t}"
        hist += [{"role": "user", "content": f"question {t}"},
                 {"role": "assistant", "content": "", "tool_calls": [
                     {"id": cid, "type": "function", "function": {"name": "big", "arguments": "{}"}}]},
                 {"role": "tool", "tool_call_id": cid, "content": ("数据" if t % 2 else "data") * (size // 4)},
                 {"role": "assistant", "content": f"answer {t}"}]
    return hist


def test_shrink_history_clips_then_drops_turns():
    hist = _history_with_tool_results(6, 20000) + [{"role": "user", "content": "latest question"}]
    snapshot = json.dumps(hist)
    msgs, info = shrink_history(hist, 3000)
    assert json.dumps(hist) == snapshot                          # input untouched
    assert info["clipped_results"] > 0
    assert msgs[-1] == {"role": "user", "content": "latest question"}
    assert_valid_history(msgs)
    assert sum(agent_mod.message_tokens(m) for m in msgs) <= 3000
    msgs, info = shrink_history(hist, 400)
    assert info["dropped_turns"] > 0 and msgs[0]["role"] == "user" and msgs[-1]["content"] == "latest question"
    assert_valid_history(msgs)
    small, info = shrink_history(hist[:4], 10 ** 6)
    assert small == hist[:4] and not any(info.values())


def test_shrink_history_drops_old_steps_of_current_turn():
    hist = [{"role": "user", "content": "do many things"}]
    for i in range(8):
        hist += [{"role": "assistant", "content": "", "tool_calls": [
            {"id": f"s{i}", "type": "function", "function": {"name": "big", "arguments": "{}"}}]},
            {"role": "tool", "tool_call_id": f"s{i}", "content": "y" * 3000}]
    msgs, info = shrink_history(hist, 700)
    assert info["dropped_steps"] > 0 and msgs[0]["role"] == "user" and "omitted" in msgs[0]["content"]
    assert msgs[-1]["tool_call_id"] == "s7"
    assert_valid_history(msgs)


def test_agent_context_length_error_retries_shorter(mock):
    mock.script += [JSONReply(400, {"error": {"message": "This model's maximum context length is 4096 tokens"}}),
                    text_stream("short enough")]
    rec = Recorder()
    agent = make_agent(mock, rec, context_tokens=9000, max_tool_chars=100000)
    agent.config.max_tokens = 1000
    old = _history_with_tool_results(3, 5000)
    hist = agent.run(old, "summarise", threading.Event())
    posts = mock.posts()
    assert len(posts) == 2 and rec.of("turn_end")[0]["reason"] == "done"
    assert len(json.dumps(posts[1]["body"]["messages"])) < len(json.dumps(posts[0]["body"]["messages"]))
    assert any(n["kind"] == "context" for n in rec.of("notice"))
    assert hist[:len(old)] == old                                # persisted history is not shrunk


def test_history_to_text_protocol_merges_user_messages():
    hist = [{"role": "user", "content": "q"},
            {"role": "assistant", "content": "", "tool_calls": [
                {"id": "a", "type": "function", "function": {"name": "add", "arguments": '{"a": 1}'}},
                {"id": "b", "type": "function", "function": {"name": "fail", "arguments": "{}"}}]},
            {"role": "tool", "tool_call_id": "a", "content": "1"},
            {"role": "tool", "tool_call_id": "b", "content": '{"error":"x"}'},
            {"role": "user", "content": "next"}]
    out = history_to_text_protocol(hist)
    assert [m["role"] for m in out] == ["user", "assistant", "user"]
    assert out[1]["content"].count("<tool_call>") == 2
    assert out[2]["content"].startswith('<tool_result name="add" id="a">\n1\n</tool_result>')
    assert '<tool_result name="fail" id="b">' in out[2]["content"] and out[2]["content"].endswith("next")


def test_agent_tool_mode_off_sends_no_tools(mock):
    mock.script.append(text_stream("plain <tool_call> text"))
    rec = Recorder()
    hist = make_agent(mock, rec, tool_mode="off").run([], "hi", threading.Event())
    body = mock.posts()[0]["body"]
    assert "tools" not in body and body["messages"][0]["content"] == "You are the AVAS assistant."
    assert hist[-1]["content"] == "plain <tool_call> text" and not rec.of("tool_start")


# =========================================================================== secrets
def test_secrets_file_backend_and_env_fallback(tmp_path, monkeypatch):
    path = tmp_path / "sub" / "ai_secrets.json"
    monkeypatch.setattr(secrets_mod, "_backend", secrets_mod._FileBackend(str(path)))
    monkeypatch.delenv(secrets_mod.ENV_FALLBACK, raising=False)
    assert secrets_mod.get_secret("prov") == ""
    secrets_mod.set_secret("prov", "k-123")
    secrets_mod.set_secret("other", "k-456")
    assert secrets_mod.get_secret("prov") == "k-123" and json.loads(path.read_text())["other"] == "k-456"
    if os.name != "nt":
        assert (os.stat(path).st_mode & 0o777) == 0o600
    assert secrets_mod.delete_secret("prov") and not secrets_mod.delete_secret("prov")
    monkeypatch.setenv(secrets_mod.ENV_FALLBACK, "env-key")
    assert secrets_mod.get_secret("prov") == "env-key" and secrets_mod.get_secret("prov", env_fallback=False) == ""
    secrets_mod.set_secret("other", "")
    assert secrets_mod.get_secret("other", env_fallback=False) == ""


@pytest.mark.skipif(not sys.platform.startswith("win"), reason="Windows Credential Manager only")
def test_secrets_windows_credential_manager_roundtrip(monkeypatch):
    monkeypatch.delenv(secrets_mod.ENV_FALLBACK, raising=False)
    assert secrets_mod.backend_name() == "windows-credential-manager"
    name = f"pytest-{uuid.uuid4().hex}"
    value = "sk-测试-" + uuid.uuid4().hex
    try:
        assert secrets_mod.get_secret(name) == ""
        secrets_mod.set_secret(name, value)
        assert secrets_mod.get_secret(name) == value
        secrets_mod.set_secret(name, value + "2")                 # overwrite
        assert secrets_mod.get_secret(name) == value + "2"
        assert secrets_mod.delete_secret(name) is True
        assert secrets_mod.get_secret(name) == "" and secrets_mod.delete_secret(name) is False
    finally:
        try:
            secrets_mod.delete_secret(name)
        except OSError:
            pass
