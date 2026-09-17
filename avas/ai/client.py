"""OpenAI-compatible chat client built on the standard library.

Design
------
* One protocol for every provider: ``POST {base_url}/chat/completions`` with
  ``stream=True`` and ``GET {base_url}/models``.  Local servers (Ollama,
  LM Studio, vLLM, llama.cpp, Xinference) and hosted APIs differ only in the
  base URL, the key and occasional ``extra_body`` fields.
* HTTP is ``urllib.request``; the SSE body is read line by line so text
  reaches the GUI while it is generated.  Loopback hosts bypass any system
  proxy (a corporate proxy cannot reach ``localhost``); other hosts use the
  normal environment / system proxy settings.
* :meth:`ChatClient.stream_chat` yields small event dicts (see its docstring).
  Reasoning is reported separately whether the server sends it as
  ``reasoning_content`` / ``reasoning`` deltas or inline as ``<think>…</think>``
  (tags may be split across chunks).  Tool-call deltas are aggregated per index
  and emitted once, complete, when the stream ends.
* Cancellation: a ``threading.Event`` is polled while waiting for the response
  headers and a watcher thread shuts the socket down when it is set, so a
  blocked read returns immediately.
* Failures become :class:`LLMError` with a ``kind`` the caller can branch on
  and a message a user can act on.  Transient failures (connection reset,
  HTTP 429, 5xx) are retried up to twice, but only before any output was
  streamed.
* Base URL normalisation (documented, no guessing by trial requests): trailing
  slashes and a pasted ``/chat/completions`` or ``/models`` suffix are removed,
  a missing scheme becomes ``http://`` for loopback hosts and ``https://``
  otherwise, and a bare ``http://localhost:<port>`` on a well-known local
  server port (11434, 1234, 8000, 8080, 9997) gets ``/v1`` appended.  A query
  string (Azure ``?api-version=``) is kept and re-attached to every endpoint.
* API keys never appear in ``repr``, logs or error text (:func:`mask_secret`).
"""
from __future__ import annotations

import ast
import copy
import dataclasses
import http.client
import ipaddress
import json
import logging
import re
import socket
import ssl
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass, field
from typing import Iterator

log = logging.getLogger("avas.gui")

TOOL_MODES = ("auto", "native", "prompted", "off")

ERROR_KINDS = ("auth", "not_found", "rate_limit", "connection", "timeout", "server",
               "bad_request", "tools_unsupported", "context_length", "stopped")

# Well-known local server ports -> product name (used for "/v1" completion and hints).
LOCAL_SERVER_PORTS = {11434: "Ollama", 1234: "LM Studio", 8000: "vLLM",
                      8080: "llama.cpp server", 9997: "Xinference"}


# =========================================================================== configuration
@dataclass
class ProviderConfig:
    """Everything needed to talk to one endpoint.

    ``temperature`` / ``max_tokens`` set to ``None`` are not sent (some
    reasoning models reject them).  ``extra_body`` is merged into the request
    JSON last, so it can add or override any field (e.g.
    ``{"enable_thinking": False}`` for DashScope Qwen3,
    ``{"chat_template_kwargs": {"enable_thinking": False}}`` for vLLM,
    ``{"top_k": 20}`` for llama.cpp / vLLM sampling, ``{"reasoning_effort":
    "low"}`` for OpenAI reasoning models).  ``tool_mode`` is interpreted by
    :class:`avas.ai.agent.Agent`.
    """
    base_url: str
    model: str
    api_key: str = field(default="", repr=False)
    temperature: float | None = 0.2
    max_tokens: int | None = None
    tool_mode: str = "auto"          # "auto" | "native" | "prompted" | "off"
    timeout: float = 180.0
    extra_headers: dict = field(default_factory=dict)
    extra_body: dict = field(default_factory=dict)

    def __repr__(self):
        headers = {k: ("***" if _is_secret_header(k) else v) for k, v in (self.extra_headers or {}).items()}
        return (f"ProviderConfig(base_url={self.base_url!r}, model={self.model!r}, "
                f"api_key={'***' if self.api_key else ''!r}, temperature={self.temperature!r}, "
                f"max_tokens={self.max_tokens!r}, tool_mode={self.tool_mode!r}, timeout={self.timeout!r}, "
                f"extra_headers={headers!r}, extra_body={self.extra_body!r})")

    def to_dict(self, include_key=False):
        """JSON-able dict for settings files (the key is left out unless asked)."""
        data = dataclasses.asdict(self)
        if not include_key:
            data.pop("api_key", None)
        return data

    @classmethod
    def from_dict(cls, data):
        """Build from a settings dict, ignoring unknown keys."""
        names = {f.name for f in dataclasses.fields(cls)}
        return cls(**{k: v for k, v in dict(data).items() if k in names})


def _is_secret_header(name):
    low = str(name).lower()
    return any(s in low for s in ("key", "auth", "token", "secret", "cookie"))


# =========================================================================== errors
class LLMError(Exception):
    """A failed model request.

    ``kind`` is one of :data:`ERROR_KINDS`; ``status`` the HTTP status (or
    ``None``); ``detail`` the server's own text with secrets masked;
    ``str(err)`` a short actionable message.  ``retryable`` marks transient
    failures (used internally for the retry policy).
    """

    def __init__(self, message, kind="server", status=None, detail="", retryable=False, retry_after=None):
        super().__init__(message)
        self.message = message
        self.kind = kind
        self.status = status
        self.detail = detail or ""
        self.retryable = retryable
        self.retry_after = retry_after

    def __str__(self):
        return self.message

    def to_dict(self):
        return {"kind": self.kind, "message": self.message, "status": self.status, "detail": self.detail}


def _stopped():
    return LLMError("Stopped.", "stopped")


_BEARER_RE = re.compile(r"(?i)\b(bearer\s+)[^\s\"',;]+")
_KEYLIKE_RE = re.compile(r"\b((?:sk|pk|rk)-[A-Za-z0-9]{0,4})[A-Za-z0-9_\-]{12,}")
_KEYPARAM_RE = re.compile(r"(?i)((?:api[_-]?key|access[_-]?token|token)\s*[=:]\s*[\"']?)[A-Za-z0-9._\-]{8,}")


def mask_secret(text, *secrets):
    """Return *text* with the given secrets and anything key-like replaced by ``***``."""
    text = "" if text is None else str(text)
    for secret in secrets:
        if secret and len(secret) >= 4:
            text = text.replace(secret, "***")
    text = _BEARER_RE.sub(r"\1***", text)
    text = _KEYLIKE_RE.sub(r"\1***", text)
    return _KEYPARAM_RE.sub(r"\1***", text)


_TOOLS_UNSUPPORTED_PATTERNS = (
    "does not support tools", "does not support tool", "do not support tools",
    "tool_choice", "tool choice requires", "tools is not supported", "tools are not supported",
    "tool calling is not supported", "tool use is not supported", "function calling is not supported",
    "does not support function calling", "tools not supported", "unsupported parameter: 'tools'",
    "unrecognized request argument supplied: tools", "enable-auto-tool-choice", "tool-call-parser",
    "tools param requires", "--jinja", "'tools' is not permitted", "\"tools\" is not permitted",
)
_CONTEXT_PATTERNS = (
    "context length", "context_length", "context window", "context size", "maximum context",
    "exceed_context_size", "exceeds the context", "too many tokens", "prompt is too long",
    "input is too long", "reduce the length", "maximum input length", "range of input length",
    "input length should be", "n_ctx", "token limit", "tokens exceed", "maximum allowed length",
)


def _contains_any(text, patterns):
    return any(p in text for p in patterns)


# =========================================================================== URLs
def is_loopback(host):
    """True for ``localhost``, ``*.localhost``, 127.0.0.0/8, ``::1`` and ``0.0.0.0``."""
    host = (host or "").strip("[]").lower()
    if host in ("localhost", "0.0.0.0") or host.endswith(".localhost"):
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def normalize_base_url(url):
    """Normalise a user-entered base URL (rules in the module docstring)."""
    url = (url or "").strip()
    if not url:
        raise LLMError("No base URL is configured for the AI provider.", "bad_request")
    if "://" not in url:
        host = re.split(r"[:/]", url.lstrip("["), maxsplit=1)[0]
        url = ("http://" if is_loopback(host) or url.startswith("[::1]") else "https://") + url
    parts = urllib.parse.urlsplit(url)
    path = parts.path.rstrip("/")
    for suffix in ("/chat/completions", "/completions", "/models"):
        if path.endswith(suffix):
            path = path[: -len(suffix)].rstrip("/")
            break
    try:
        port = parts.port
    except ValueError:
        port = None
    if not path and is_loopback(parts.hostname) and port in LOCAL_SERVER_PORTS:
        path = "/v1"
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, parts.query, ""))


# =========================================================================== stream parsing helpers
def new_call_id():
    """A fresh tool-call id: 9 alphanumerics (Mistral templates in vLLM require exactly that)."""
    return uuid.uuid4().hex[:9]


class TagStreamSplitter:
    """Split streamed text on an ``open``/``close`` tag pair that may arrive in pieces.

    :meth:`feed` returns a list of ``(kind, text)`` with kind ``"out"`` (text
    outside a block), ``"in"`` (text inside), ``"open"`` / ``"close"`` (tag
    boundaries, text empty).  A possible partial tag at the end of the buffer
    is held back until the next chunk decides it.  :meth:`flush` releases the
    rest at end of stream (an unclosed block stays ``"in"``).
    """

    def __init__(self, open_tag, close_tag):
        self.open_tag = open_tag
        self.close_tag = close_tag
        self.inside = False
        self._buf = ""

    def feed(self, text):
        out = []
        self._buf += text or ""
        while self._buf:
            tag = self.close_tag if self.inside else self.open_tag
            kind = "in" if self.inside else "out"
            idx = self._buf.find(tag)
            if idx >= 0:
                if idx:
                    out.append((kind, self._buf[:idx]))
                self._buf = self._buf[idx + len(tag):]
                self.inside = not self.inside
                out.append(("open" if self.inside else "close", ""))
                continue
            keep = 0
            for k in range(min(len(tag) - 1, len(self._buf)), 0, -1):
                if self._buf.endswith(tag[:k]):
                    keep = k
                    break
            emit = self._buf[: len(self._buf) - keep]
            if emit:
                out.append((kind, emit))
            self._buf = self._buf[len(self._buf) - keep:]
            break
        return out

    def flush(self):
        rest, self._buf = self._buf, ""
        return [("in" if self.inside else "out", rest)] if rest else []


_FENCE_RE = re.compile(r"^```[a-zA-Z0-9_-]*\s*|\s*```$")
_TRAILING_COMMA_RE = re.compile(r",\s*([}\]])")


def _close_brackets(text):
    """Append the quotes/brackets a truncated JSON text is missing."""
    stack, in_str, esc = [], False, False
    for ch in text:
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]" and stack:
            stack.pop()
    return text + ('"' if in_str else "") + "".join(reversed(stack))


def parse_tool_arguments(raw):
    """Parse tool-call arguments leniently into a dict.

    Accepts a dict, a JSON string, a double-encoded JSON string, JSON wrapped in
    code fences or prose, trailing commas, truncated brackets and Python
    literals.  Anything unrecoverable becomes ``{"__invalid__": raw}``.
    """
    if isinstance(raw, dict):
        return raw
    if raw is None:
        return {}
    text = str(raw).strip()
    if not text:
        return {}
    candidates = [text]
    unfenced = _FENCE_RE.sub("", text).strip()
    if unfenced != text:
        candidates.append(unfenced)
    start, end = unfenced.find("{"), unfenced.rfind("}")
    if start >= 0:
        sliced = unfenced[start:end + 1] if end > start else unfenced[start:]
        candidates.append(sliced)
        candidates.append(_TRAILING_COMMA_RE.sub(r"\1", sliced))
        candidates.append(_close_brackets(_TRAILING_COMMA_RE.sub(r"\1", sliced)))
    for cand in candidates:
        try:
            value = json.loads(cand)
        except ValueError:
            continue
        if isinstance(value, str):          # double-encoded
            try:
                value = json.loads(value)
            except ValueError:
                continue
        if isinstance(value, dict):
            return value
    if start >= 0:
        try:
            value = ast.literal_eval(candidates[-1])
            if isinstance(value, dict):
                return value
        except (ValueError, SyntaxError, TypeError, MemoryError, RecursionError):
            pass
    return {"__invalid__": text}


def _is_complete_json(text):
    try:
        json.loads(text)
        return True
    except ValueError:
        return False


class _ToolCallAccumulator:
    """Aggregate streamed ``tool_calls`` deltas into complete calls.

    Keyed by ``index``; falls back to ``id`` or arrival order for servers that
    omit the index, and starts a new entry when a server re-uses index 0 for a
    second complete call.
    """

    def __init__(self):
        self.order = []
        self.by_index = {}
        self.by_id = {}

    def _new(self):
        entry = {"id": None, "name": "", "args": "", "args_obj": None}
        self.order.append(entry)
        return entry

    @staticmethod
    def _complete(entry):
        return bool(entry["name"]) and (entry["args_obj"] is not None or _is_complete_json(entry["args"] or "x"))

    def feed(self, items):
        if isinstance(items, dict):
            items = [items]
        for item in items or []:
            if not isinstance(item, dict):
                continue
            fn = item.get("function") if isinstance(item.get("function"), dict) else {}
            name = fn.get("name") or item.get("name") or ""
            args = fn.get("arguments", item.get("arguments"))
            idx, cid = item.get("index"), item.get("id")
            whole = bool(name) and (isinstance(args, dict) or (isinstance(args, str) and _is_complete_json(args)))
            if cid and cid in self.by_id:
                entry = self.by_id[cid]
            elif isinstance(idx, int):
                entry = self.by_index.get(idx)
                if entry is None or (cid and entry["id"] and entry["id"] != cid) or (whole and self._complete(entry)):
                    entry = self._new()
                    self.by_index[idx] = entry
            elif cid or name or not self.order:
                entry = self._new()
            else:
                entry = self.order[-1]
            if cid and not entry["id"]:
                entry["id"] = cid
                self.by_id[cid] = entry
            if name:
                if not entry["name"] or name.startswith(entry["name"]):
                    entry["name"] = name
                else:
                    entry["name"] += name
            if isinstance(args, dict):
                entry["args_obj"] = args
            elif args is not None:
                piece = str(args)
                if entry["args"] and _is_complete_json(entry["args"]) and _is_complete_json(piece):
                    entry["args"] = piece          # server re-sent the whole arguments
                else:
                    entry["args"] += piece

    def finish(self):
        calls = []
        for entry in self.order:
            if not entry["name"] and not entry["args"] and entry["args_obj"] is None:
                continue
            if entry["args_obj"] is not None:
                arguments = entry["args_obj"]
                raw = json.dumps(arguments, ensure_ascii=False)
            else:
                raw = entry["args"]
                arguments = parse_tool_arguments(raw)
            calls.append({"type": "tool_call", "id": entry["id"] or new_call_id(), "name": entry["name"],
                          "arguments": arguments, "raw_arguments": raw})
        return calls


def _content_text(content):
    """Text of a delta/message ``content`` that may be a string or a list of parts."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)
    return str(content)


class _StreamState:
    """Turns parsed chunks (streamed or not) into client events."""

    def __init__(self):
        self.think = TagStreamSplitter("<think>", "</think>")
        self.calls = _ToolCallAccumulator()
        self.finish_reason = None
        self.usage = None
        self.received = False
        self._after_think = False

    def _text(self, text):
        events = []
        for kind, seg in self.think.feed(text):
            events.extend(self._segment(kind, seg))
        return events

    def _segment(self, kind, seg):
        if kind == "close":
            self._after_think = True
        elif kind == "in" and seg:
            return [{"type": "reasoning", "delta": seg}]
        elif kind == "out" and seg:
            if self._after_think:
                seg = seg.lstrip("\r\n")
                if not seg:
                    return []
                self._after_think = False
            return [{"type": "text", "delta": seg}]
        return []

    def feed_chunk(self, obj):
        """Events for one chunk; raises :class:`LLMError` for an error payload."""
        if not isinstance(obj, dict):
            return []
        if obj.get("error") and not obj.get("choices"):
            raise _payload_error(obj)
        self.received = True
        if obj.get("usage"):
            self.usage = obj["usage"]
        events = []
        for choice in obj.get("choices") or []:
            if not isinstance(choice, dict) or choice.get("index", 0) not in (0, None):
                continue
            delta = choice.get("delta") or choice.get("message") or {}
            for key in ("reasoning_content", "reasoning"):
                if isinstance(delta.get(key), str) and delta[key]:
                    events.append({"type": "reasoning", "delta": delta[key]})
                    break
            text = _content_text(delta.get("content"))
            if text:
                events.extend(self._text(text))
            if delta.get("tool_calls"):
                self.calls.feed(delta["tool_calls"])
            elif isinstance(delta.get("function_call"), dict):     # legacy single-call form
                self.calls.feed([dict(delta["function_call"], index=0)])
            if choice.get("finish_reason"):
                self.finish_reason = choice["finish_reason"]
        return events

    def finish(self):
        events = []
        for kind, seg in self.think.flush():
            events.extend(self._segment(kind, seg))
        events.extend(self.calls.finish())
        events.append({"type": "done", "finish_reason": self.finish_reason, "usage": self.usage})
        return events


def _extract_error_message(raw):
    """Best-effort human text from an error body (JSON in various shapes, or plain text)."""
    raw = (raw or "").strip()
    try:
        obj = json.loads(raw)
    except ValueError:
        return raw[:2000]
    if isinstance(obj, list) and obj:
        obj = obj[0]
    if isinstance(obj, dict):
        err = obj.get("error", obj)
        if isinstance(err, dict):
            msg = err.get("message") or err.get("msg") or err.get("detail")
            if msg is None:
                msg = obj.get("message") or obj.get("detail")
            if msg is not None:
                return (msg if isinstance(msg, str) else json.dumps(msg, ensure_ascii=False))[:2000]
            return json.dumps(err, ensure_ascii=False)[:2000]
        if isinstance(err, str):
            return err[:2000]
    return raw[:2000]


def _payload_error(obj):
    """LLMError for an ``{"error": ...}`` object received inside a 200 stream."""
    err = obj.get("error")
    code = err.get("code") if isinstance(err, dict) else None
    status = code if isinstance(code, int) and 400 <= code < 600 else None
    detail = _extract_error_message(json.dumps(obj))
    return classify_http_error(status, detail, has_tools=True)


def classify_http_error(status, detail, has_tools=False, server="the server", model="", url="", retry_after=None,
                        has_key=True):
    """Map an HTTP status plus the server's message to an :class:`LLMError`."""
    low = (detail or "").lower()
    shown = f": {detail}" if detail else ""
    code = f"HTTP {status}" if status else "error"
    if status not in (401, 403, 429):
        if _contains_any(low, _CONTEXT_PATTERNS):
            return LLMError(f"The conversation is longer than the model's context window ({code}){shown}",
                            "context_length", status, detail)
        if has_tools and _contains_any(low, _TOOLS_UNSUPPORTED_PATTERNS):
            return LLMError(f"{server} or model '{model}' does not support native tool calling ({code}){shown}",
                            "tools_unsupported", status, detail)
    if status in (401, 403):
        hint = "an API key is required" if not has_key else "check the API key and its permissions"
        return LLMError(f"{server} rejected the request ({code}): {hint}.{(' ' + detail) if detail else ''}",
                        "auth", status, detail)
    if status == 404:
        if "model" in low:
            msg = f"Model '{model}' was not found on {server}{shown}"
        else:
            msg = (f"Endpoint not found ({code}, {url}). Check that the base URL is right and ends with the "
                   f"API version segment, e.g. /v1{('. Server said' + shown) if detail else ''}")
        return LLMError(msg, "not_found", status, detail)
    if status == 429:
        return LLMError(f"Rate limit or quota exceeded at {server} ({code}). Wait a moment or check the "
                        f"account balance{shown}", "rate_limit", status, detail, retryable=True,
                        retry_after=retry_after)
    if status in (408, 504):
        return LLMError(f"{server} timed out ({code}){shown}", "timeout", status, detail)
    if status is None or status >= 500:
        return LLMError(f"{server} reported an internal error ({code}){shown}", "server", status, detail,
                        retryable=status is not None)
    return LLMError(f"{server} rejected the request ({code}){shown}", "bad_request", status, detail)


class _StopWatcher:
    """Shut a response's socket down as soon as *stop_event* is set, unblocking reads."""

    def __init__(self, resp, stop_event):
        self._done = threading.Event()
        self._thread = threading.Thread(target=self._run, args=(resp, stop_event), daemon=True,
                                        name="avas-llm-stop")
        self._thread.start()

    def _run(self, resp, stop_event):
        while not self._done.wait(0.05):
            if stop_event.is_set():
                _abort_response(resp)
                return

    def close(self):
        self._done.set()


def _abort_response(resp):
    _abort_socket(getattr(getattr(getattr(resp, "fp", None), "raw", None), "_sock", None))  # http.client internals


def _abort_socket(sock):
    """Unblock a read in another thread and drop the connection (the server then stops generating).

    POSIX: ``shutdown`` makes a blocked ``recv`` return EOF.  Windows ignores
    that for a call already in progress, so the handle is closed as well
    (``socket._real_close``: the makefile reference keeps plain ``close`` from
    doing it); the blocked call then fails with WSAENOTSOCK.
    """
    if sock is None:
        return
    try:
        sock.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass
    if sys.platform.startswith("win") and hasattr(sock, "_real_close"):
        try:
            sock._real_close()
        except OSError:
            pass


# =========================================================================== client
class _TrackConnections:
    """Handler mixin: record the ``http.client`` connections opened for a request.

    Lets a stop request close the socket while ``urlopen`` still waits for the
    response headers (a local server may spend minutes on prompt processing).
    """

    def do_open(self, http_class, req, **kwargs):
        registry = getattr(req, "avas_connections", None)
        if registry is not None:
            base_class = http_class

            def http_class(*args, **kw):
                conn = base_class(*args, **kw)
                registry.append(conn)
                return conn
        return super().do_open(http_class, req, **kwargs)


class _HTTPHandler(_TrackConnections, urllib.request.HTTPHandler):
    pass


class _HTTPSHandler(_TrackConnections, urllib.request.HTTPSHandler):
    pass


_MESSAGE_KEYS = ("role", "content", "name", "tool_calls", "tool_call_id")


def sanitize_message(msg):
    """Copy of an OpenAI message with only standard keys (strict servers reject extras)."""
    out = {k: msg[k] for k in _MESSAGE_KEYS if k in msg}
    if out.get("tool_calls"):
        calls = []
        for call in out["tool_calls"]:
            fn = call.get("function") or {}
            args = fn.get("arguments", "{}")
            if not isinstance(args, str):
                args = json.dumps(args, ensure_ascii=False)
            calls.append({"id": call.get("id") or new_call_id(), "type": "function",
                          "function": {"name": fn.get("name", ""), "arguments": args}})
        out["tool_calls"] = calls
        if out.get("content") is None:
            out["content"] = ""
    elif "tool_calls" in out:
        del out["tool_calls"]
    return out


class ChatClient:
    """Thin OpenAI-compatible client; one instance per :class:`ProviderConfig`.

    Instances hold no connection state and may be used from any thread, but a
    single ``stream_chat`` generator must be consumed by one thread.
    """

    max_retries = 2
    retry_delays = (1.0, 3.0)      # seconds before retry 1 and 2 (Retry-After wins, capped at 20 s)

    def __init__(self, cfg: ProviderConfig):
        self.cfg = cfg
        self.base_url = normalize_base_url(cfg.base_url)
        parts = urllib.parse.urlsplit(self.base_url)
        self.host = parts.hostname or ""
        self.is_local = is_loopback(self.host)
        try:
            port = parts.port
        except ValueError:
            port = None
        product = LOCAL_SERVER_PORTS.get(port) if self.is_local else None
        self.server_name = product or (f"the model server at {parts.netloc}" if self.is_local else parts.netloc)
        handlers = [urllib.request.ProxyHandler({})] if self.is_local else []
        self._opener = urllib.request.build_opener(*handlers, _HTTPHandler, _HTTPSHandler)
        self._include_usage = True

    def __repr__(self):
        return f"ChatClient(base_url={self.base_url!r}, model={self.cfg.model!r})"

    # ------------------------------------------------------------------ HTTP plumbing
    def url(self, path, base=None):
        """Endpoint URL: *path* appended to the base path, base query string kept."""
        parts = urllib.parse.urlsplit(base or self.base_url)
        return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path.rstrip("/") + path, parts.query, ""))

    def _headers(self, stream):
        headers = {"Content-Type": "application/json", "User-Agent": "AVAS-assistant",
                   "Accept": "text/event-stream" if stream else "application/json"}
        if self.cfg.api_key:
            headers["Authorization"] = "Bearer " + self.cfg.api_key.strip()
        headers.update({str(k): str(v) for k, v in (self.cfg.extra_headers or {}).items()})
        return headers

    def _mask(self, text):
        secrets = [self.cfg.api_key] + [v for k, v in (self.cfg.extra_headers or {}).items() if _is_secret_header(k)]
        return mask_secret(text, *[str(s) for s in secrets if s])

    def _open(self, method, url, body=None, stop_event=None, timeout=None, stream=False, has_tools=False):
        """Send a request and return the open response, mapping failures to :class:`LLMError`."""
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(url, data=data, method=method, headers=self._headers(stream))
        timeout = self.cfg.timeout if timeout is None else timeout
        try:
            return self._open_cancellable(req, timeout, stop_event)
        except LLMError:
            raise
        except urllib.error.HTTPError as exc:
            raise self._http_error(exc, url, has_tools) from None
        except urllib.error.URLError as exc:
            raise self._network_error(exc.reason, timeout) from None
        except (OSError, http.client.HTTPException) as exc:
            raise self._network_error(exc, timeout) from None

    def _open_cancellable(self, req, timeout, stop_event):
        if stop_event is None:
            return self._opener.open(req, timeout=timeout)
        if stop_event.is_set():
            raise _stopped()
        box, lock, finished = {}, threading.Lock(), threading.Event()
        req.avas_connections = []

        def worker():
            try:
                box["resp"] = self._opener.open(req, timeout=timeout)
            except BaseException as exc:          # re-raised in the caller's thread
                box["exc"] = exc
            with lock:
                finished.set()
                if box.get("abandoned") and "resp" in box:
                    box["resp"].close()

        threading.Thread(target=worker, daemon=True, name="avas-llm-open").start()
        while not finished.wait(0.05):
            if stop_event.is_set():
                with lock:
                    if not finished.is_set():
                        box["abandoned"] = True
                        for conn in list(req.avas_connections):     # stop waiting server-side too
                            _abort_socket(getattr(conn, "sock", None))
                        raise _stopped()
                break
        if "exc" in box:
            raise box["exc"]
        if stop_event.is_set():
            box["resp"].close()
            raise _stopped()
        return box["resp"]

    def _http_error(self, exc, url, has_tools):
        try:
            raw = exc.read(65536).decode("utf-8", "replace")
        except Exception:
            raw = ""
        finally:
            try:
                exc.close()
            except Exception:
                pass
        detail = self._mask(_extract_error_message(raw) or str(exc.reason or ""))
        retry_after = None
        try:
            retry_after = float(exc.headers.get("Retry-After")) if exc.headers else None
        except (TypeError, ValueError):
            pass
        return classify_http_error(exc.code, detail, has_tools=has_tools, server=self.server_name,
                                   model=self.cfg.model, url=self._mask(url), retry_after=retry_after,
                                   has_key=bool(self.cfg.api_key))

    def _network_error(self, reason, timeout):
        base = self._mask(self.base_url)
        if isinstance(reason, (TimeoutError, socket.timeout)):
            return LLMError(f"No response from {base} within {timeout:g} s. Large local models can take a while "
                            f"to load; try again or increase the timeout.", "timeout", detail=str(reason))
        if isinstance(reason, ssl.SSLError):
            return LLMError(f"TLS/SSL error while connecting to {self.host}: {reason}. Behind a corporate proxy, "
                            f"check its certificate settings.", "connection", detail=str(reason))
        if isinstance(reason, socket.gaierror):
            return LLMError(f"Could not resolve host '{self.host}'. Check the base URL and the network or proxy "
                            f"settings.", "connection", detail=str(reason))
        if isinstance(reason, ConnectionRefusedError):
            who = self.server_name if self.is_local else "the server"
            hint = f" — is {who} running?" if self.is_local else ". Check the URL and the network or proxy settings."
            return LLMError(f"Could not connect to {base}{hint}", "connection", detail=str(reason))
        transient = isinstance(reason, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError,
                                        http.client.IncompleteRead, http.client.RemoteDisconnected))
        if transient:
            return LLMError(f"The connection to {base} was interrupted ({type(reason).__name__}).", "connection",
                            detail=self._mask(reason), retryable=True)
        return LLMError(f"Could not connect to {base}: {self._mask(reason)}", "connection",
                        detail=self._mask(reason))

    def _sleep(self, seconds, stop_event):
        if stop_event is None:
            time.sleep(seconds)
        elif stop_event.wait(seconds):
            raise _stopped()

    # ------------------------------------------------------------------ models / connectivity
    def _get_json(self, url, stop_event=None, timeout=None):
        resp = self._open("GET", url, stop_event=stop_event, timeout=timeout)
        try:
            raw = resp.read()
        except (OSError, http.client.HTTPException) as exc:
            raise self._network_error(exc, timeout or self.cfg.timeout) from None
        finally:
            resp.close()
        try:
            return json.loads(raw.decode("utf-8", "replace"))
        except ValueError:
            raise LLMError(f"{self.server_name} returned something that is not JSON from {self._mask(url)}.",
                           "bad_request", detail=self._mask(raw[:500])) from None

    def list_models(self, stop_event=None) -> list[str]:
        """Model ids from ``GET {base}/models`` (falls back to Ollama's ``/api/tags`` on 404)."""
        timeout = min(self.cfg.timeout, 20.0)
        try:
            obj = self._get_json(self.url("/models"), stop_event, timeout)
        except LLMError as exc:
            if exc.kind != "not_found" or not self.is_local:
                raise
            root = re.sub(r"/v\d+$", "", urllib.parse.urlsplit(self.base_url).path.rstrip("/"))
            parts = urllib.parse.urlsplit(self.base_url)
            base = urllib.parse.urlunsplit((parts.scheme, parts.netloc, root, "", ""))
            obj = self._get_json(self.url("/api/tags", base=base), stop_event, timeout)
        items = []
        if isinstance(obj, dict):
            items = obj.get("data") or obj.get("models") or []
        elif isinstance(obj, list):
            items = obj
        ids = []
        for item in items:
            if isinstance(item, str):
                ids.append(item)
            elif isinstance(item, dict):
                ids.append(item.get("id") or item.get("name") or item.get("model") or "")
        return sorted({i for i in ids if i})

    def test(self) -> dict:
        """Quick connectivity check: ``{"ok", "models", "latency_ms", "error"?, "kind"?, "warning"?}``.

        Lists the models; if the provider has no model listing, sends a tiny
        chat request instead (a few tokens).
        """
        start = time.perf_counter()
        result = {"ok": False, "models": [], "latency_ms": None}
        try:
            try:
                result["models"] = self.list_models()
            except LLMError as exc:
                if exc.kind not in ("not_found", "bad_request") or not self.cfg.model:
                    raise
                probe = ChatClient(dataclasses.replace(self.cfg, max_tokens=8, timeout=min(self.cfg.timeout, 60.0)))
                probe.complete([{"role": "user", "content": "ping"}])
            result["ok"] = True
            if self.cfg.model and result["models"] and self.cfg.model not in result["models"]:
                result["warning"] = f"Model '{self.cfg.model}' is not in the list reported by {self.server_name}."
        except LLMError as exc:
            result["error"] = str(exc)
            result["kind"] = exc.kind
        result["latency_ms"] = round((time.perf_counter() - start) * 1000.0, 1)
        return result

    # ------------------------------------------------------------------ chat
    def _chat_body(self, messages, tools, stream):
        body = {"model": self.cfg.model, "messages": [sanitize_message(m) for m in messages], "stream": stream}
        if self.cfg.temperature is not None:
            body["temperature"] = self.cfg.temperature
        if self.cfg.max_tokens:
            body["max_tokens"] = int(self.cfg.max_tokens)
        if tools:
            body["tools"] = tools
        if stream and self._include_usage:
            body["stream_options"] = {"include_usage": True}
        body.update(copy.deepcopy(self.cfg.extra_body or {}))
        return body

    def stream_chat(self, messages, tools=None, stop_event=None) -> Iterator[dict]:
        """Stream one completion.

        *messages* are OpenAI chat messages (non-standard keys are dropped);
        *tools* the OpenAI ``tools`` list or ``None``.  Yields, in order of
        arrival::

            {"type": "text", "delta": str}
            {"type": "reasoning", "delta": str}
            {"type": "tool_call", "id": str, "name": str, "arguments": dict, "raw_arguments": str}
            {"type": "done", "finish_reason": str | None, "usage": dict | None}

        ``tool_call`` events come after all text, just before ``done``;
        unparseable arguments arrive as ``{"__invalid__": raw}``.  Raises
        :class:`LLMError` (kind ``"stopped"`` when *stop_event* is set).
        """
        attempt, usage_retry_done = 0, False
        while True:
            body = self._chat_body(messages, tools, stream=True)
            emitted = False
            try:
                resp = self._open("POST", self.url("/chat/completions"), body, stop_event, stream=True,
                                  has_tools=bool(tools))
                try:
                    for event in self._events(resp, stop_event):
                        emitted = True
                        yield event
                finally:
                    resp.close()
                return
            except LLMError as exc:
                if exc.kind == "stopped" or emitted:
                    raise
                if (exc.kind == "bad_request" and self._include_usage and not usage_retry_done
                        and "stream_options" in exc.detail.lower()):
                    self._include_usage, usage_retry_done = False, True
                    continue
                if exc.retryable and attempt < self.max_retries:
                    delay = self.retry_delays[min(attempt, len(self.retry_delays) - 1)]
                    if exc.retry_after:
                        delay = min(max(delay, exc.retry_after), 20.0)
                    log.debug("AI request failed (%s), retrying in %.1f s", exc.kind, delay)
                    attempt += 1
                    self._sleep(delay, stop_event)
                    continue
                raise

    def complete(self, messages, tools=None, stop_event=None) -> dict:
        """Run :meth:`stream_chat` to the end and aggregate it::

            {"content": str, "reasoning": str, "tool_calls": [tool_call events],
             "finish_reason": str | None, "usage": dict | None}
        """
        text, reasoning, calls, done = [], [], [], {}
        for event in self.stream_chat(messages, tools, stop_event):
            kind = event["type"]
            if kind == "text":
                text.append(event["delta"])
            elif kind == "reasoning":
                reasoning.append(event["delta"])
            elif kind == "tool_call":
                calls.append(event)
            elif kind == "done":
                done = event
        return {"content": "".join(text), "reasoning": "".join(reasoning), "tool_calls": calls,
                "finish_reason": done.get("finish_reason"), "usage": done.get("usage")}

    def _read_failure(self, exc, stop_event):
        if stop_event is not None and stop_event.is_set():
            return _stopped()
        if isinstance(exc, (TimeoutError, socket.timeout)):
            return LLMError(f"{self.server_name} stopped sending data for {self.cfg.timeout:g} s.", "timeout",
                            detail=str(exc))
        err = self._network_error(exc, self.cfg.timeout)
        err.retryable = True
        return err

    def _events(self, resp, stop_event):
        """Parse an SSE (or plain JSON) chat response into client events."""
        state = _StreamState()
        watcher = _StopWatcher(resp, stop_event) if stop_event is not None else None
        try:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            if "event-stream" not in ctype and "json" in ctype:      # server ignored stream=True
                try:
                    raw = resp.read()
                except (OSError, http.client.HTTPException) as exc:
                    raise self._read_failure(exc, stop_event) from None
                try:
                    obj = json.loads(raw.decode("utf-8", "replace"))
                except ValueError:
                    raise LLMError(f"{self.server_name} returned invalid JSON.", "server",
                                   detail=self._mask(raw[:500])) from None
                yield from state.feed_chunk(obj)
                yield from state.finish()
                return
            pending, stray = [], []
            while True:
                if stop_event is not None and stop_event.is_set():
                    raise _stopped()
                try:
                    raw = resp.readline()
                except (OSError, ValueError, http.client.HTTPException) as exc:
                    raise self._read_failure(exc, stop_event) from None
                if not raw:
                    break
                line = raw.decode("utf-8", "replace").rstrip("\r\n")
                if line.startswith("data:"):
                    pending.append(line[5:][1:] if line[5:6] == " " else line[5:])
                elif not line:
                    if not pending:
                        continue
                elif line.startswith((":", "event:", "id:", "retry:")):
                    continue
                else:
                    stray.append(line)
                    continue
                if not pending:
                    continue
                payload = "\n".join(pending)
                if payload.strip() == "[DONE]":
                    pending = []
                    break
                try:
                    obj = json.loads(payload)
                except ValueError:
                    if not line:          # event complete but unparseable
                        log.debug("AI stream: skipped malformed event %r", payload[:200])
                        pending = []
                    continue
                pending = []
                for event in state.feed_chunk(obj):
                    yield event
            if stop_event is not None and stop_event.is_set():
                raise _stopped()
            if not state.received and stray:
                try:
                    obj = json.loads("\n".join(stray))
                except ValueError:
                    obj = None
                if isinstance(obj, dict):
                    yield from state.feed_chunk(obj)
            if not state.received:
                raise LLMError(f"{self.server_name} closed the connection without a reply.", "server",
                               detail=self._mask("\n".join(stray)[:500]), retryable=True)
            yield from state.finish()
        except LLMError as exc:
            if exc.kind not in ("stopped",) and exc.detail:
                exc.detail = self._mask(exc.detail)
            raise
        finally:
            if watcher is not None:
                watcher.close()
