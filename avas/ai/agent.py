"""Tool-using agent loop for the AI assistant.

Design
------
* :class:`Agent` runs one user turn: call the model, stream text/reasoning to
  ``emit``, execute requested tools sequentially in the calling thread, feed
  the results back and repeat until the model answers without tools,
  ``max_steps`` model calls requested tools (then one last call without tools
  asks for a final answer), the user stops, or an error occurs.  LLM errors
  never escape :meth:`Agent.run`; they become ``error`` events.
* History is plain OpenAI chat format (``user``; ``assistant`` with optional
  ``tool_calls`` whose ``arguments`` is a JSON string; ``tool`` with
  ``tool_call_id``) without the system prompt.  An assistant message may carry
  ``reasoning_content`` for display; :func:`avas.ai.client.sanitize_message`
  drops it before sending.  The same history works in every tool mode, so a
  conversation can move between providers.
* Tool modes: ``native`` uses the ``tools`` request field.  ``prompted``
  describes the tools in the system prompt (:data:`PROMPTED_TOOLS_HEADER`);
  the model writes ``<tool_call>{"name": ..., "arguments": {...}}</tool_call>``
  blocks and results are sent back as a user message of
  ``<tool_result name=".." id="..">…</tool_result>`` blocks.  Prompted calls
  are still *stored* as native ``tool_calls`` + ``tool`` messages and only
  rendered as text when a request is built.  ``auto`` starts native and switches
  to prompted for the rest of the Agent's life when the server rejects tools
  (``agent.effective_tool_mode``).  In native mode ``<tool_call>`` text written
  by models whose template leaks it (Qwen/Hermes on some servers) is executed
  too.  ``<tool_call>`` blocks are never shown as text, and anything from a
  model-invented ``<tool_result`` onwards is dropped.
* Tool results go to the model as text: strings unchanged, other values as
  compact JSON (``ensure_ascii=False``, NaN/inf -> null, numpy -> lists),
  truncated to ``max_tool_chars`` with a marker explaining how to ask for less.
  The ``tool_end`` event carries the full JSON-able value.
* Context budget: tokens are estimated as ASCII chars / 3 plus one token per
  non-ASCII char (conservative for English, JSON and CJK text).  When the
  request would exceed ``context_tokens`` minus an output reserve, old tool
  results are clipped first, then the oldest complete turns are dropped, then
  older tool steps of the current turn; an assistant ``tool_calls`` message is
  never separated from its results and the latest user message is always kept.
  Only the request is shrunk; the returned history keeps everything.  If the
  server still reports ``context_length`` the request is rebuilt with a 40 %
  smaller budget and tighter clipping, once per run.
"""
from __future__ import annotations

import json
import logging
import math
import threading
from dataclasses import dataclass
from typing import Any, Callable

from avas.ai.client import (ChatClient, LLMError, ProviderConfig, TOOL_MODES, TagStreamSplitter, new_call_id,
                            parse_tool_arguments)

log = logging.getLogger("avas.gui")


# =========================================================================== public types
class ToolError(Exception):
    """Raised by a tool handler for an expected failure; the message goes to the model."""


@dataclass
class Tool:
    """A function the model may call.

    ``handler(arguments, ctx)`` returns ``str | dict | list`` (anything
    JSON-able; numpy values are converted) or raises :class:`ToolError`.
    """
    name: str
    description: str
    parameters: dict
    handler: Callable[[dict, "ToolContext"], Any]
    long_running: bool = False

    def spec(self):
        """OpenAI ``tools`` entry."""
        params = self.parameters or {"type": "object", "properties": {}}
        return {"type": "function", "function": {"name": self.name, "description": self.description,
                                                 "parameters": params}}


@dataclass
class ToolContext:
    """Passed to tool handlers.

    ``emit(dict)`` sends progress to the GUI as ``{"type": "tool_progress",
    "id", "name", **dict}`` (thread-safe).  Long tools should poll
    ``stop_event``.
    """
    call_id: str
    emit: Callable[[dict], None]
    stop_event: threading.Event
    agent: "Agent"
    name: str = ""


# =========================================================================== prompts
PROMPTED_TOOLS_HEADER = """# Tools

You can use the tools listed below. To call a tool, write a block in exactly this form:

<tool_call>{"name": "TOOL_NAME", "arguments": {...}}</tool_call>

Rules:
- Each block contains one JSON object with "name" and "arguments"; "arguments" is an object matching the tool's parameter schema. Use valid JSON (double quotes).
- You may write several <tool_call> blocks in one reply. After your tool calls, end the reply and wait.
- The results arrive in the next user message as <tool_result name="TOOL_NAME" id="CALL_ID">...</tool_result> blocks. Never write <tool_result> blocks yourself and never guess results.
- If a result contains "error", correct the call or explain the problem.
- When no tool is needed, answer normally without any <tool_call> block.

## Available tools
"""

FINAL_ANSWER_PROMPT = ("The tool-call limit for this request has been reached. Do not call any more tools. "
                       "Using the results above, give your best final answer now and say what remains unfinished.")


def prompted_tools_prompt(tools):
    """The tool section appended to the system prompt in prompted mode."""
    parts = [PROMPTED_TOOLS_HEADER]
    for tool in tools:
        schema = json.dumps(tool.parameters or {"type": "object", "properties": {}}, ensure_ascii=False,
                            separators=(",", ":"))
        parts.append(f"\n### {tool.name}\n{tool.description.strip()}\nParameters: {schema}\n")
    return "".join(parts)


# =========================================================================== JSON / text helpers
def to_jsonable(value):
    """Recursively convert *value* to plain JSON types (NaN/inf -> None, numpy -> lists/scalars)."""
    if value is None or isinstance(value, (str, bool)):
        return value
    if isinstance(value, int):
        return int(value)
    if isinstance(value, float):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, dict):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [to_jsonable(v) for v in value]
    if isinstance(value, (bytes, bytearray)):
        return bytes(value).decode("utf-8", "replace")
    if hasattr(value, "tolist"):                     # numpy arrays and scalars
        return to_jsonable(value.tolist())
    return str(value)


def dumps_compact(value):
    return json.dumps(to_jsonable(value), ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def truncate_for_model(text, limit):
    """Keep head and tail of *text* within about *limit* chars, with an explanatory marker."""
    if not limit or len(text) <= limit:
        return text
    marker_len = 260
    room = max(limit - marker_len, limit // 2)
    head = room * 3 // 4
    tail = room - head
    omitted = len(text) - head - tail
    marker = (f"\n[… output truncated: {omitted} of {len(text)} characters omitted. If you need the missing part, "
              f"call the tool again asking for less data (fewer rows or columns, a narrower range, or a "
              f"summary).]\n")
    return text[:head] + marker + (text[-tail:] if tail else "")


def clip_middle(text, limit):
    """Shorten *text* to about *limit* chars keeping head and tail: ``[… N chars omitted]``."""
    if len(text) <= limit:
        return text
    head = max(limit * 2 // 3, 1)
    tail = max(limit - head, 0)
    omitted = len(text) - head - tail
    return f"{text[:head]}\n[… {omitted} chars omitted]\n{text[-tail:] if tail else ''}"


def estimate_tokens(text):
    """Rough token count: ASCII chars / 3 + 1 per non-ASCII char (conservative)."""
    if not text:
        return 0
    if not isinstance(text, str):
        text = json.dumps(text, ensure_ascii=False)
    n = len(text)
    non_ascii = min(n, (len(text.encode("utf-8")) - n) // 2)
    return int((n - non_ascii) / 3.0) + non_ascii + 1


def message_tokens(msg):
    """Estimated tokens of one chat message (content, tool calls and overhead)."""
    content = msg.get("content")
    if isinstance(content, list):
        total = 0
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                total += estimate_tokens(part.get("text", ""))
            else:
                total += 800                        # images and other media: flat guess
    else:
        total = estimate_tokens(content if isinstance(content, str) else (content and str(content)))
    for call in msg.get("tool_calls") or []:
        fn = call.get("function") or {}
        total += 8 + estimate_tokens(fn.get("name", "")) + estimate_tokens(fn.get("arguments", ""))
    return total + 4


# =========================================================================== history transforms
def _split_turns(msgs):
    """Group messages into turns, each starting at a user message (a leading non-user run is its own group)."""
    turns = []
    for msg in msgs:
        if msg.get("role") == "user" or not turns:
            turns.append([msg])
        else:
            turns[-1].append(msg)
    return turns


def _split_steps(turn):
    """Split a turn into ``(head, steps)``: leading non-assistant messages, then assistant+tool groups."""
    head, steps = [], []
    for msg in turn:
        role = msg.get("role")
        if role == "assistant":
            steps.append([msg])
        elif steps:
            steps[-1].append(msg)
        else:
            head.append(msg)
    return head, steps


def shrink_history(history, budget, level=0):
    """Fit *history* into *budget* estimated tokens (see module docstring).

    Returns ``(messages, info)``; messages are shallow copies (the input is not
    modified) and ``info`` counts ``clipped_results``, ``dropped_turns`` and
    ``dropped_steps``.
    """
    msgs = [dict(m) for m in history]
    info = {"clipped_results": 0, "dropped_turns": 0, "dropped_steps": 0}
    cost = {id(m): message_tokens(m) for m in msgs}       # messages stay referenced, so ids are stable
    current = sum(cost.values())
    if current <= budget:
        return msgs, info
    limits = (1500, 400) if level == 0 else (400, 120)
    turns = _split_turns(msgs)
    _, last_steps = _split_steps(turns[-1])
    protected = {id(m) for m in (last_steps[-1] if last_steps else []) if m.get("role") == "tool"}

    def flat():
        return [m for turn in turns for m in turn]

    def clip(msg, limit):
        nonlocal current
        content = msg.get("content")
        if msg.get("role") == "tool" and isinstance(content, str) and len(content) > limit + 40:
            msg["content"] = clip_middle(content, limit)
            new = message_tokens(msg)
            current += new - cost[id(msg)]
            cost[id(msg)] = new
            info["clipped_results"] += 1

    # 1. clip old tool results, oldest first
    for limit in limits:
        for msg in flat():
            if current <= budget:
                return flat(), info
            if id(msg) not in protected:
                clip(msg, limit)
    # 2. drop the oldest complete turns
    while len(turns) > 1 and current > budget:
        current -= sum(cost[id(m)] for m in turns.pop(0))
        info["dropped_turns"] += 1
    if current <= budget:
        return flat(), info
    # 3. drop older tool steps of the current turn (keep its user message and latest step)
    head, steps = _split_steps(turns[0])
    while len(steps) > 1 and current > budget:
        current -= sum(cost[id(m)] for m in steps.pop(0))
        info["dropped_steps"] += 1
    if info["dropped_steps"] and head and isinstance(head[-1].get("content"), str):
        old = head[-1]
        head[-1] = dict(old, content=old["content"] + f"\n\n[Note: {info['dropped_steps']} earlier tool steps of "
                                                      f"this request were omitted to fit the context window.]")
        cost[id(head[-1])] = message_tokens(head[-1])
        current += cost[id(head[-1])] - cost[id(old)]
    result = head + [m for s in steps for m in s]
    # 4. last resort: clip the remaining tool results as well
    for msg in result:
        if current <= budget:
            break
        clip(msg, limits[-1])
    return result, info


def _merge_user_messages(msgs):
    """Merge consecutive user messages (strict chat templates require alternation)."""
    out = []
    for msg in msgs:
        if out and msg.get("role") == "user" and out[-1].get("role") == "user":
            prev, cur = out[-1].get("content"), msg.get("content")
            if isinstance(prev, str) and isinstance(cur, str):
                out[-1] = dict(out[-1], content=f"{prev}\n\n{cur}")
            else:
                def parts(c):
                    return c if isinstance(c, list) else [{"type": "text", "text": c or ""}]
                out[-1] = dict(out[-1], content=parts(prev) + parts(cur))
        else:
            out.append(msg)
    return out


def history_to_text_protocol(history):
    """Render native tool calls/results as ``<tool_call>`` / ``<tool_result>`` text messages."""
    out, names = [], {}
    for msg in history:
        role = msg.get("role")
        if role == "assistant" and msg.get("tool_calls"):
            parts = [msg["content"]] if msg.get("content") else []
            for call in msg["tool_calls"]:
                fn = call.get("function") or {}
                names[call.get("id")] = fn.get("name", "")
                block = json.dumps({"name": fn.get("name", ""), "arguments": parse_tool_arguments(fn.get("arguments"))},
                                   ensure_ascii=False)
                parts.append(f"<tool_call>{block}</tool_call>")
            out.append({"role": "assistant", "content": "\n".join(parts)})
        elif role == "tool":
            cid = str(msg.get("tool_call_id", ""))
            name = str(names.get(msg.get("tool_call_id"), "")).replace('"', "'")
            content = msg.get("content")
            text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)
            out.append({"role": "user", "content": f'<tool_result name="{name}" id="{cid}">\n{text}\n</tool_result>'})
        else:
            out.append({k: v for k, v in msg.items() if k != "tool_calls"})
    return _merge_user_messages(out)


def parse_tool_call_block(text):
    """Parse the body of a ``<tool_call>`` block into ``[{"name", "arguments"}]`` (one or more)."""
    def one(obj):
        name = obj.get("name") or obj.get("tool") or obj.get("tool_name") or ""
        args = None
        for key in ("arguments", "parameters", "args", "input"):
            if key in obj:
                args = obj[key]
                break
        fn = obj.get("function")
        if isinstance(fn, dict):
            name = fn.get("name") or name
            args = fn.get("arguments", args)
        elif isinstance(fn, str) and not name:
            name = fn
        return {"name": str(name), "arguments": parse_tool_arguments(args) if args is not None else {}}

    obj = parse_tool_arguments(text)
    if "__invalid__" not in obj:
        return [one(obj)]
    lines = [ln for ln in text.strip().splitlines() if ln.strip()]
    if len(lines) > 1:
        parsed = [parse_tool_arguments(ln) for ln in lines]
        if all("__invalid__" not in p and (p.get("name") or p.get("function")) for p in parsed):
            return [one(p) for p in parsed]
    return [{"name": "", "arguments": obj}]


class _ReplyFilter:
    """Streams visible text, collects ``<tool_call>`` blocks, drops invented ``<tool_result`` text."""

    def __init__(self, emit, hide_calls=True):
        self.emit = emit
        self.hide_calls = hide_calls
        self.calls = TagStreamSplitter("<tool_call>", "</tool_call>")
        self.cut = TagStreamSplitter("<tool_result", "\x00\x00")       # never closes: everything after is dropped
        self.visible, self.blocks = [], []
        self._block = None

    def feed(self, delta):
        if self.hide_calls:
            self._route(self.calls.feed(delta))
        else:
            self._show([("out", delta)])

    def _route(self, segments):
        for kind, seg in segments:
            if kind == "open":
                self._block = []
            elif kind == "close":
                self.blocks.append("".join(self._block or []))
                self._block = None
            elif kind == "in":
                if self._block is None:
                    self._block = []
                self._block.append(seg)
            else:
                self._show(self.cut.feed(seg))

    def _show(self, segments):
        for kind, seg in segments:
            if kind == "out" and seg:
                self.visible.append(seg)
                self.emit({"type": "text", "delta": seg})

    def finish(self):
        if self.hide_calls:
            self._route(self.calls.flush())
            if self._block is not None and "".join(self._block).strip():
                self.blocks.append("".join(self._block))      # unclosed block at end of stream
            self._block = None
            self._show(self.cut.flush())


def _add_usage(total, usage):
    if not isinstance(usage, dict):
        return
    for key in ("prompt_tokens", "completion_tokens", "total_tokens"):
        if isinstance(usage.get(key), (int, float)):
            total[key] = total.get(key, 0) + usage[key]
    if isinstance(usage.get("prompt_tokens"), (int, float)):
        total["last_prompt_tokens"] = usage["prompt_tokens"]


# =========================================================================== agent
class Agent:
    """Runs user turns against one provider with a fixed tool set.

    Events passed to ``emit`` (all JSON-able dicts)::

        {"type": "text", "delta"}                      visible answer text
        {"type": "reasoning", "delta"}                 thinking text
        {"type": "tool_start", "id", "name", "arguments"}
        {"type": "tool_progress", "id", "name", ...}   from ToolContext.emit
        {"type": "tool_end", "id", "name", "ok", "result"}
        {"type": "notice", "kind", "message", ...}     kind: tool_mode | context | max_steps | empty_reply
        {"type": "error", "kind", "message", "status", "detail"}
        {"type": "turn_end", "reason", "usage", "steps", "tool_mode"}
                 reason: done | stopped | max_steps | error; usage summed over calls or None
    """

    def __init__(self, config: ProviderConfig, tools: list[Tool], system_prompt: str, emit: Callable[[dict], None],
                 max_steps: int = 40, context_tokens: int = 32000, max_tool_chars: int = 12000,
                 client_factory=ChatClient):
        if config.tool_mode not in TOOL_MODES:
            raise ValueError(f"tool_mode must be one of {TOOL_MODES}, got {config.tool_mode!r}")
        self.config = config
        self.tools = list(tools or [])
        self._tools_by_name = {t.name: t for t in self.tools}
        self.system_prompt = system_prompt or ""
        self.max_steps = max(int(max_steps), 1)
        self.context_tokens = int(context_tokens)
        self.max_tool_chars = int(max_tool_chars)
        self.client = client_factory(config)
        self.effective_tool_mode = "native" if config.tool_mode == "auto" else config.tool_mode
        self._emit_fn = emit
        self._emit_lock = threading.Lock()
        self._run_lock = threading.Lock()
        self._context_notice = False

    # ------------------------------------------------------------------ events
    def emit(self, event):
        """Thread-safe event delivery; exceptions from the sink are logged, not raised."""
        with self._emit_lock:
            try:
                self._emit_fn(event)
            except Exception:
                log.debug("AI emit callback failed", exc_info=True)

    def _progress(self, call_id, name, event):
        payload = dict(event) if isinstance(event, dict) else {"message": str(event)}
        payload.update(type="tool_progress", id=call_id, name=name)
        self.emit(payload)

    # ------------------------------------------------------------------ request building
    def tool_specs(self):
        return [t.spec() for t in self.tools]

    def build_system_prompt(self, mode):
        if mode == "prompted" and self.tools:
            base = self.system_prompt.rstrip()
            return (base + "\n\n" if base else "") + prompted_tools_prompt(self.tools)
        return self.system_prompt

    def build_messages(self, history, mode, level=0):
        """Request messages for *history* in *mode* (system prompt, context budget, text protocol)."""
        system = self.build_system_prompt(mode)
        fixed = estimate_tokens(system) + 8
        if mode == "native" and self.tools:
            fixed += estimate_tokens(json.dumps(self.tool_specs(), ensure_ascii=False))
        reserve = int(self.config.max_tokens) if self.config.max_tokens else min(4096, self.context_tokens // 4)
        budget = max(self.context_tokens - reserve - fixed, 256)
        if level:
            budget = int(budget * 0.6)
        msgs, info = shrink_history(history, budget, level)
        if any(info.values()) and not self._context_notice:
            self._context_notice = True
            self.emit({"type": "notice", "kind": "context", **info,
                       "message": "The conversation is long; older tool output was shortened or earlier messages "
                                  "were left out of the request to fit the model's context window."})
        if mode != "native":
            msgs = history_to_text_protocol(msgs)
        return ([{"role": "system", "content": system}] if system else []) + msgs

    # ------------------------------------------------------------------ model call
    def _call(self, messages, mode, stop_event, hide_calls=None):
        """One streamed model call; returns content, reasoning, calls, usage and error (never raises)."""
        tools = self.tool_specs() if mode == "native" and self.tools else None
        filt = _ReplyFilter(self.emit, hide_calls=(mode != "off") if hide_calls is None else hide_calls)
        reasoning, native, usage, finish, error = [], [], None, None, None
        try:
            for event in self.client.stream_chat(messages, tools=tools, stop_event=stop_event):
                kind = event.get("type")
                if kind == "text":
                    filt.feed(event["delta"])
                elif kind == "reasoning":
                    reasoning.append(event["delta"])
                    self.emit({"type": "reasoning", "delta": event["delta"]})
                elif kind == "tool_call":
                    native.append(event)
                elif kind == "done":
                    usage, finish = event.get("usage"), event.get("finish_reason")
        except LLMError as exc:
            error = exc
        except Exception as exc:                       # bug or unexpected transport failure
            log.debug("AI model call failed", exc_info=True)
            error = LLMError(f"Unexpected error while talking to the model: {type(exc).__name__}: {exc}", "server")
        filt.finish()
        calls = []
        if error is None:
            if native and mode == "native":
                calls = [{"id": c["id"], "name": c["name"], "arguments": c["arguments"]} for c in native]
            elif mode in ("native", "prompted") and filt.blocks:
                for block in filt.blocks:
                    calls.extend(dict(c, id=new_call_id()) for c in parse_tool_call_block(block))
            seen = set()
            for call in calls:                          # ids must be unique within one step
                if not call["id"] or call["id"] in seen:
                    call["id"] = new_call_id()
                seen.add(call["id"])
        return {"content": "".join(filt.visible).strip(), "reasoning": "".join(reasoning), "calls": calls,
                "usage": usage, "finish_reason": finish, "error": error}

    # ------------------------------------------------------------------ tools
    def result_text(self, value):
        """Text sent to the model for a JSON-able tool result (truncated to ``max_tool_chars``)."""
        if value is None:
            text = "OK (no output)"
        elif isinstance(value, str):
            text = value
        else:
            text = dumps_compact(value)
        return truncate_for_model(text, self.max_tool_chars)

    def _execute(self, call, stop_event):
        cid, name, args = call["id"], call["name"], call["arguments"]
        if not isinstance(args, dict):
            args = parse_tool_arguments(args)
        self.emit({"type": "tool_start", "id": cid, "name": name, "arguments": to_jsonable(args)})
        tool, ok = self._tools_by_name.get(name), False
        if tool is None:
            if name:
                value = {"error": f"Unknown tool '{name}'. Available tools: "
                                  f"{', '.join(self._tools_by_name) or 'none'}."}
            else:
                value = {"error": 'Could not read the tool call. Write it as <tool_call>{"name": "TOOL_NAME", '
                                  '"arguments": {...}}</tool_call> with valid JSON.',
                         "received": str(args.get("__invalid__", ""))[:500]}
        elif set(args) == {"__invalid__"}:
            value = {"error": "The tool arguments were not valid JSON. Send one JSON object matching the "
                              "parameter schema.", "received": str(args["__invalid__"])[:500]}
        else:
            ctx = ToolContext(call_id=cid, emit=lambda ev: self._progress(cid, name, ev), stop_event=stop_event,
                              agent=self, name=name)
            try:
                value, ok = tool.handler(args, ctx), True
            except ToolError as exc:
                value = {"error": str(exc)}
            except Exception as exc:
                log.debug("AI tool %s raised", name, exc_info=True)
                value = {"error": f"{type(exc).__name__}: {exc}"}
        try:
            value = to_jsonable(value)
        except Exception:                              # pathological objects (recursion etc.)
            value = str(value)
        self.emit({"type": "tool_end", "id": cid, "name": name, "ok": ok, "result": value})
        return self.result_text(value)

    # ------------------------------------------------------------------ turn
    def run(self, history: list[dict], user_message, stop_event: threading.Event | None = None) -> list[dict]:
        """Run one user turn and return the full new history (never raises for model errors)."""
        if not self._run_lock.acquire(blocking=False):
            raise RuntimeError("Agent.run is already running on this agent")
        try:
            return self._run(history, user_message, stop_event if stop_event is not None else threading.Event())
        finally:
            self._run_lock.release()

    @staticmethod
    def _assistant_message(reply):
        msg = {"role": "assistant", "content": reply["content"]}
        if reply["reasoning"]:
            msg["reasoning_content"] = reply["reasoning"]
        return msg

    def _run(self, history, user_message, stop_event):
        hist = json.loads(json.dumps(list(history or []), ensure_ascii=False))
        hist.append({"role": "user", "content": to_jsonable(user_message)})
        usage, steps, level, context_retried, reason = {}, 0, 0, False, "done"
        self._context_notice = False
        while True:
            if stop_event.is_set():
                reason = "stopped"
                break
            if steps >= self.max_steps:
                reason = self._final_answer(hist, stop_event, usage, level)
                break
            mode = self.effective_tool_mode if self.tools else "off"
            reply = self._call(self.build_messages(hist, mode, level), mode, stop_event)
            _add_usage(usage, reply["usage"])
            error = reply["error"]
            if error is not None:
                if error.kind == "stopped":
                    reason = "stopped"
                elif not reply["content"] and not reply["reasoning"]:
                    if error.kind == "tools_unsupported" and mode == "native" and self.config.tool_mode == "auto":
                        self.effective_tool_mode = "prompted"
                        log.info("AI: %s rejected native tools; switching to prompted tool calls",
                                 self.client.server_name if hasattr(self.client, "server_name") else "server")
                        self.emit({"type": "notice", "kind": "tool_mode", "mode": "prompted",
                                   "message": "This model/server does not accept native tool calls; "
                                              "switched to prompted tool calls.", "detail": error.detail})
                        continue
                    if error.kind == "context_length" and not context_retried:
                        context_retried, level = True, 1
                        self.emit({"type": "notice", "kind": "context", "message": "The request exceeded the "
                                   "model's context window; retrying with a shorter history."})
                        continue
                if reply["content"] or reply["reasoning"]:
                    hist.append(self._assistant_message(reply))
                if error.kind != "stopped":
                    self.emit({"type": "error", "kind": error.kind, "message": str(error), "status": error.status,
                               "detail": error.detail})
                    reason = "error"
                break
            steps += 1
            msg = self._assistant_message(reply)
            if reply["calls"]:
                msg["tool_calls"] = [{"id": c["id"], "type": "function",
                                      "function": {"name": c["name"],
                                                   "arguments": json.dumps(to_jsonable(c["arguments"]),
                                                                           ensure_ascii=False)}}
                                     for c in reply["calls"]]
            hist.append(msg)
            if not reply["calls"]:
                if not reply["content"]:
                    self.emit({"type": "notice", "kind": "empty_reply", "message": "The model returned an empty "
                               "reply" + (" after thinking (it may have run out of output tokens)."
                                          if reply["reasoning"] else ".")})
                reason = "done"
                break
            for call in reply["calls"]:
                if stop_event.is_set():       # every tool_call needs a result to keep the history valid
                    text = dumps_compact({"error": "Cancelled: the user stopped the assistant before this tool ran."})
                else:
                    text = self._execute(call, stop_event)
                hist.append({"role": "tool", "tool_call_id": call["id"], "content": text})
        self.emit({"type": "turn_end", "reason": reason, "usage": usage or None, "steps": steps,
                   "tool_mode": self.effective_tool_mode})
        return hist

    def _final_answer(self, hist, stop_event, usage, level):
        """After ``max_steps``: one call without tools asking for the final answer; returns the turn reason."""
        self.emit({"type": "notice", "kind": "max_steps",
                   "message": f"Reached the limit of {self.max_steps} tool steps; asking the model for a final "
                              f"answer."})
        messages = self.build_messages(hist, "off", level)
        messages = _merge_user_messages(messages + [{"role": "user", "content": FINAL_ANSWER_PROMPT}])
        reply = self._call(messages, "off", stop_event, hide_calls=True)
        _add_usage(usage, reply["usage"])
        if reply["content"] or reply["reasoning"]:
            hist.append(self._assistant_message(reply))
        error = reply["error"]
        if error is not None and error.kind == "stopped":
            return "stopped"
        if error is not None:
            self.emit({"type": "error", "kind": error.kind, "message": str(error), "status": error.status,
                       "detail": error.detail})
        return "max_steps"
