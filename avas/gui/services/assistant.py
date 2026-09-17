"""AI assistant: providers, conversations, the agent worker and change approvals.

* Providers (OpenAI-compatible endpoints, local or hosted) live in the GUI
  settings under ``ai/providers``; API keys only in the OS credential store
  (:mod:`avas.ai.secrets`), never in ``gui.json``.
* A conversation belongs to a project and is saved as JSON in
  ``%LOCALAPPDATA%/AVAS/assistant/<project key>/<id>.json``.  It keeps the
  model history (OpenAI format) and the *items* the chat panel shows (user and
  assistant messages, tool cards, proposals, notices), so a reloaded
  conversation looks the way it did.
* A turn runs :class:`avas.ai.agent.Agent` in a worker thread.  Agent events
  become item updates sent to the page as ``assistant.event``.
* Tools that change something call :meth:`Host.propose`: the page shows a
  proposal card and the tool waits for ``assistant.decide`` (unless auto-apply
  is on).  Applied changes are backed up to ``<project>/.avas_ai/backups`` and
  can be undone from the card.
* Some tools need the page (the lattice text being edited, saving open pages,
  starting a run the same way the Run button does).  :func:`front_call` sends
  ``assistant.front`` and waits for ``assistant.frontReply``; without a page
  (tests, dev tools) it returns ``None`` and the tools fall back to the files.
"""
import copy
import hashlib
import json
import logging
import os
import threading
import time
import uuid

from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc
from avas.paths import USER_DATA_DIR

log = logging.getLogger("avas.gui")

DEFAULT_OPTIONS = {"autoApply": False, "maxSteps": 40}
MAX_RESULT_CHARS = 4000

_conversations = {}
_conv_lock = threading.RLock()
_front_pending = {}
_front_lock = threading.Lock()


# =========================================================================== settings
def _settings():
    return context.settings()


def providers():
    items = _settings().get("ai/providers") or []
    return [p for p in items if isinstance(p, dict) and p.get("id")]


def options():
    return {**DEFAULT_OPTIONS, **(_settings().get("ai/options") or {})}


def _secret_name(provider_id):
    return f"provider.{provider_id}"


def _public_provider(p):
    from avas.ai import get_secret
    try:
        has_key = bool(get_secret(_secret_name(p["id"]), env_fallback=False))
    except Exception:  # noqa: BLE001 - a broken credential store must not break the dialog
        has_key = False
    return {**p, "hasKey": has_key}


def active_provider():
    items = providers()
    active = _settings().get("ai/active")
    return next((p for p in items if p["id"] == active), items[0] if items else None)


def provider_config(p, api_key=None):
    from avas.ai import ProviderConfig, get_secret
    key = api_key if api_key else get_secret(_secret_name(p["id"]), env_fallback=True) if p.get("id") else ""

    def opt_float(v):
        try:
            return float(v) if v not in (None, "") else None
        except (TypeError, ValueError):
            return None

    def opt_int(v):
        try:
            return int(v) if v not in (None, "", 0, "0") else None
        except (TypeError, ValueError):
            return None

    extra = p.get("extraBody") or {}
    if isinstance(extra, str):
        try:
            extra = json.loads(extra) if extra.strip() else {}
        except ValueError as exc:
            raise UserError(f"Extra request fields must be JSON: {exc}") from exc
    return ProviderConfig(base_url=p.get("baseUrl") or "", model=p.get("model") or "", api_key=key or "",
                          temperature=opt_float(p.get("temperature")), max_tokens=opt_int(p.get("maxTokens")),
                          tool_mode=p.get("toolMode") or "auto", timeout=opt_float(p.get("timeout")) or 180.0,
                          extra_body=extra)


@rpc("assistant.config")
def config():
    from avas.ai import PRESETS, backend_name
    active = active_provider()
    return {"providers": [_public_provider(p) for p in providers()], "active": active["id"] if active else None,
            "presets": PRESETS, "options": options(), "secretStore": backend_name()}


@rpc("assistant.saveProvider")
def save_provider(provider, apiKey=None, clearKey=False):
    from avas.ai import set_secret, delete_secret
    p = dict(provider or {})
    if not p.get("baseUrl") or not p.get("model"):
        raise UserError("Base URL and model are required.")
    is_new = not p.get("id")
    p["id"] = p.get("id") or uuid.uuid4().hex[:10]
    p.pop("hasKey", None)
    items = [x for x in providers() if x["id"] != p["id"]]
    existing = next((x for x in providers() if x["id"] == p["id"]), None)
    idx = providers().index(existing) if existing else len(items)
    items.insert(idx, p)
    s = _settings()
    values = {"ai/providers": items}
    if is_new or not s.get("ai/active") or not any(x["id"] == s.get("ai/active") for x in items):
        values["ai/active"] = p["id"]           # a model the user just added is the one they want to use
    s.update(values)
    try:
        if clearKey:
            delete_secret(_secret_name(p["id"]))
        elif apiKey:
            set_secret(_secret_name(p["id"]), apiKey)
    except Exception as exc:  # noqa: BLE001
        raise UserError(f"The API key could not be stored: {exc}") from exc
    return config()


@rpc("assistant.deleteProvider")
def delete_provider(id):
    from avas.ai import delete_secret
    items = [x for x in providers() if x["id"] != id]
    values = {"ai/providers": items}
    if _settings().get("ai/active") == id:
        values["ai/active"] = items[0]["id"] if items else None
    _settings().update(values)
    try:
        delete_secret(_secret_name(id))
    except Exception:  # noqa: BLE001
        pass
    return config()


@rpc("assistant.setActive")
def set_active(id):
    if not any(x["id"] == id for x in providers()):
        raise UserError("Unknown provider.")
    _settings().set("ai/active", id)
    return config()


@rpc("assistant.setOptions")
def set_options(values):
    _settings().set("ai/options", {**options(), **(values or {})})
    return config()


@rpc("assistant.test")
def test_provider(provider, apiKey=None):
    from avas.ai import ChatClient
    cfg = provider_config(provider, apiKey)
    try:
        return ChatClient(cfg).test()
    except Exception as exc:  # noqa: BLE001 - shown in the dialog
        return {"ok": False, "error": str(exc)}


@rpc("assistant.models")
def list_models(provider, apiKey=None):
    from avas.ai import ChatClient, LLMError
    cfg = provider_config({**provider, "model": provider.get("model") or "-"}, apiKey)
    try:
        return ChatClient(cfg).list_models()
    except LLMError as exc:
        raise UserError(str(exc)) from exc


# =========================================================================== page round trips
def page_available():
    return bridge.window() is not None or bool(bridge._subscribers)


def front_call(method, params=None, timeout=5.0):
    """Ask the page to do something (see frontend/src/assistant/front.ts); ``None`` without a page."""
    if not page_available():
        return None
    rid = uuid.uuid4().hex
    rec = {"event": threading.Event(), "ok": False, "result": None, "error": None}
    with _front_lock:
        _front_pending[rid] = rec
    bridge.emit("assistant.front", {"id": rid, "method": method, "params": params or {}})
    done = rec["event"].wait(timeout)
    with _front_lock:
        _front_pending.pop(rid, None)
    if not done:
        log.debug("assistant: page did not answer %s", method)
        return None
    if not rec["ok"]:
        from avas.ai import ToolError
        raise ToolError(rec["error"] or f"{method} failed in the page")
    return rec["result"]


@rpc("assistant.frontReply")
def front_reply(id, ok=True, result=None, error=None):
    with _front_lock:
        rec = _front_pending.get(id)
    if rec is not None:
        rec.update(ok=bool(ok), result=result, error=error)
        rec["event"].set()
    return True


# =========================================================================== conversations
def _project_key(path):
    if not path:
        return "_no_project"
    return hashlib.sha1(os.path.normcase(os.path.abspath(path)).encode("utf-8")).hexdigest()[:16]


def _conv_dir(path):
    return os.path.join(os.environ.get("AVAS_AI_DATA") or os.path.join(USER_DATA_DIR, "assistant"), _project_key(path))


class Conversation:
    def __init__(self, project_path, conv_id=None):
        self.id = conv_id or time.strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:6]
        self.project = project_path or ""
        self.title = ""
        self.created = time.time()
        self.updated = self.created
        self.messages = []
        self.items = []
        self.proposals = {}
        self.decisions = {}
        self.auto_apply = bool(options().get("autoApply"))
        self.stop_event = threading.Event()
        self.thread = None
        self.tool_mode_memory = {}
        self.usage = {}
        self.lock = threading.RLock()

    # ------------------------------------------------------------------ persistence
    @property
    def path(self):
        return os.path.join(_conv_dir(self.project), f"{self.id}.json")

    def to_json(self):
        return {"id": self.id, "project": self.project, "title": self.title, "created": self.created,
                "updated": self.updated, "messages": self.messages, "items": self.items, "usage": self.usage,
                "autoApply": self.auto_apply, "toolModes": self.tool_mode_memory,
                "proposals": {k: {kk: vv for kk, vv in v.items() if kk not in ("old_text", "new_text")}
                              for k, v in self.proposals.items()}}

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        with self.lock:
            data = bridge.dumps(self.to_json())
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(data)
        os.replace(tmp, self.path)

    @classmethod
    def load(cls, project_path, conv_id):
        c = cls(project_path, conv_id)
        with open(c.path, encoding="utf-8") as fh:
            data = json.load(fh)
        c.title = data.get("title") or ""
        c.created = data.get("created") or c.created
        c.updated = data.get("updated") or c.updated
        c.messages = data.get("messages") or []
        c.items = data.get("items") or []
        c.usage = data.get("usage") or {}
        c.auto_apply = bool(data.get("autoApply", c.auto_apply))
        c.tool_mode_memory = data.get("toolModes") or {}
        c.proposals = data.get("proposals") or {}
        for item in c.items:            # a turn interrupted by closing the app
            if item.get("role") == "tool" and item.get("status") == "running":
                item["status"] = "error"
                item["summary"] = "interrupted"
            if item.get("role") == "proposal" and item.get("status") == "pending":
                item["status"] = "expired"
        return c

    def summary(self):
        return {"id": self.id, "title": self.title or "", "updated": self.updated, "created": self.created,
                "busy": self.busy}

    @property
    def busy(self):
        return self.thread is not None and self.thread.is_alive()

    # ------------------------------------------------------------------ items
    def emit(self, payload):
        bridge.emit("assistant.event", {"conversation": self.id, **payload})

    def upsert(self, item):
        with self.lock:
            for i, it in enumerate(self.items):
                if it["id"] == item["id"]:
                    self.items[i] = item
                    break
            else:
                self.items.append(item)
            # events are serialised later by the flusher: send a snapshot, or deltas appended
            # to the live dict in the meantime would arrive twice
            snapshot = copy.deepcopy(item)
        self.emit({"type": "item", "item": snapshot})

    def find(self, item_id):
        with self.lock:
            return next((it for it in self.items if it["id"] == item_id), None)


def _get(conv_id):
    p = context.project()
    with _conv_lock:
        conv = _conversations.get(conv_id)
        if conv is not None:
            return conv
        try:
            conv = Conversation.load(p.path if p.is_open else "", conv_id)
        except (OSError, ValueError) as exc:
            raise UserError(f"Conversation not found: {conv_id}") from exc
        _conversations[conv_id] = conv
        return conv


@rpc("assistant.conversations")
def conversations():
    p = context.project()
    folder = _conv_dir(p.path if p.is_open else "")
    out = []
    if os.path.isdir(folder):
        for name in os.listdir(folder):
            if not name.endswith(".json"):
                continue
            cid = name[:-5]
            with _conv_lock:
                live = _conversations.get(cid)
            if live is not None:
                out.append(live.summary())
                continue
            try:
                with open(os.path.join(folder, name), encoding="utf-8") as fh:
                    data = json.load(fh)
                out.append({"id": cid, "title": data.get("title") or "", "updated": data.get("updated") or 0,
                            "created": data.get("created") or 0, "busy": False})
            except (OSError, ValueError):
                continue
    out.sort(key=lambda c: -(c.get("updated") or 0))
    return out


@rpc("assistant.new")
def new_conversation():
    p = context.project()
    conv = Conversation(p.path if p.is_open else "")
    with _conv_lock:
        _conversations[conv.id] = conv
    return {**conv.summary(), "items": [], "autoApply": conv.auto_apply}


@rpc("assistant.load")
def load_conversation(id):
    conv = _get(id)
    return {**conv.summary(), "items": conv.items, "autoApply": conv.auto_apply, "usage": conv.usage}


@rpc("assistant.delete")
def delete_conversation(id):
    conv = _get(id)
    if conv.busy:
        raise UserError("Stop the assistant first.")
    with _conv_lock:
        _conversations.pop(id, None)
    try:
        os.remove(conv.path)
    except OSError:
        pass
    return conversations()


@rpc("assistant.rename")
def rename_conversation(id, title):
    conv = _get(id)
    conv.title = (title or "").strip()[:120]
    conv.save()
    return conv.summary()


@rpc("assistant.setAutoApply")
def set_auto_apply(id, value):
    conv = _get(id)
    conv.auto_apply = bool(value)
    if conv.auto_apply:            # approve what is already waiting
        with conv.lock:
            for rec in conv.decisions.values():
                rec["decision"] = "apply"
                rec["event"].set()
    return {"autoApply": conv.auto_apply}


def any_busy():
    with _conv_lock:
        return any(c.busy for c in _conversations.values())


@rpc("assistant.state")
def state():
    return {"busy": any_busy()}


# =========================================================================== host for the tools
class Host:
    """What the AVAS tools may do, bound to one conversation."""

    def __init__(self, conv):
        self.conv = conv

    @property
    def auto_apply(self):
        return self.conv.auto_apply

    def project(self):
        from avas.ai import ToolError
        p = context.project()
        if not p.is_open:
            raise ToolError("No project is open. Ask the user to open or create a project.")
        if self.conv.project and os.path.normcase(p.path) != os.path.normcase(self.conv.project):
            raise ToolError("The open project changed since this conversation started; start a new conversation.")
        return p

    def front(self, method, params=None, timeout=5.0):
        return front_call(method, params, timeout)

    def lattice_text(self):
        from avas.ai import ToolError
        from avas.gui.textio import read_text
        p = self.project()
        name, path = p.lattice_name(), p.lattice_path()
        r = self.front("lattice.getText", {}, timeout=3)
        if isinstance(r, dict) and r.get("name") == name and isinstance(r.get("text"), str):
            return name, path, r["text"], "editor (may contain unsaved edits)" if r.get("dirty") else "editor"
        if not os.path.isfile(path):
            raise ToolError(f"The lattice file {name} does not exist.")
        return name, path, read_text(path), "file"

    def log_lines(self, n, problems_only=False):
        from avas.gui import logbridge
        rows = logbridge.history()
        if problems_only:
            rows = [r for r in rows if r["level"] in ("WARNING", "ERROR", "CRITICAL")]
        rows = rows[-max(1, min(n, 300)):]
        return [f"{time.strftime('%H:%M:%S', time.localtime(r['t']))} {r['level']} {r['msg'][:500]}" for r in rows]

    # ------------------------------------------------------------------ proposals
    def propose(self, ctx, proposal):
        """Show *proposal*, wait for the user's decision (unless auto-apply) and apply it."""
        from avas.ai import ToolError
        conv = self.conv
        pid = uuid.uuid4().hex[:12]
        public = {k: v for k, v in proposal.items() if k not in ("old_text", "new_text", "path")}
        item = {"id": pid, "role": "proposal", "proposal": public, "status": "pending", "tool": ctx.call_id,
                "time": time.time()}
        with conv.lock:
            conv.proposals[pid] = dict(proposal)
        choices = [o["id"] for o in proposal.get("options") or [] if o.get("available")]
        if conv.auto_apply:
            item["auto"] = True
            decision = "apply"
            choice = proposal.get("choice") or proposal.get("default")
        else:
            rec = {"event": threading.Event(), "decision": None, "choice": None}
            with conv.lock:
                conv.decisions[pid] = rec
            conv.upsert(item)
            while not rec["event"].wait(0.25):
                if ctx.stop_event.is_set():
                    rec["decision"] = "stopped"
                    break
            with conv.lock:
                conv.decisions.pop(pid, None)
            decision = rec["decision"]
            choice = rec.get("choice") or proposal.get("choice") or proposal.get("default")
        if choices:
            if choice not in choices:
                choice = proposal.get("default") if proposal.get("default") in choices else choices[0]
            proposal["choice"] = item["choice"] = choice
            with conv.lock:
                conv.proposals[pid]["choice"] = choice
        if decision != "apply":
            item["status"] = "rejected" if decision == "reject" else "cancelled"
            conv.upsert(item)
            if decision == "stopped":
                raise ToolError("Stopped by the user before the change was approved.")
            return {"applied": False, "decision": "The user rejected this change. Do not repeat it; ask what they want instead."}
        try:
            info = self.apply(pid, proposal)
        except ToolError as exc:
            item.update(status="failed", error=str(exc))
            conv.upsert(item)
            raise
        except Exception as exc:  # noqa: BLE001
            log.exception("assistant: applying a proposal failed")
            item.update(status="failed", error=str(exc))
            conv.upsert(item)
            raise ToolError(f"Applying the change failed: {exc}") from exc
        item.update(status="applied", applied=info)
        conv.upsert(item)
        return {"applied": True, **info}

    def _backup(self, pid, name, text):
        p = self.project()
        folder = os.path.join(p.path, ".avas_ai", "backups", self.conv.id, pid)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, name)
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(text)
        return path

    def _write_lattice(self, name, path, text):
        from avas.gui.services import projects
        from avas.gui.textio import write_text
        r = self.front("lattice.apply", {"name": name, "text": text}, timeout=15)
        if isinstance(r, dict) and r.get("applied"):
            projects.notify()
            return {"where": "editor", "saved": bool(r.get("saved"))}
        write_text(path, text)
        self.front("pages.reload", {"paths": [path]}, timeout=5)
        projects.notify()
        return {"where": "file"}

    def apply(self, pid, proposal):
        from avas import paths
        from avas.ai import ToolError
        from avas.gui.services import projects, runner
        from avas.gui.textio import write_text
        kind = proposal["kind"]
        p = self.project()
        if kind == "lattice":
            before = self._backup(pid, proposal["file"] + ".before", proposal["old_text"])
            info = self._write_lattice(proposal["file"], proposal["path"], proposal["new_text"])
            proposal["backup"] = before
            return {**info, "file": proposal["file"]}
        if kind == "file":
            before = self._backup(pid, proposal["file"] + ".before", proposal["old_text"])
            write_text(proposal["path"], proposal["new_text"])
            self.front("pages.reload", {"paths": [proposal["path"]], "pages": [proposal.get("page"), "files"]}, timeout=5)
            projects.notify()
            proposal["backup"] = before
            return {"file": proposal["file"]}
        if kind == "lattice_source":
            proposal["previous"] = p.lattice_name()
            paths.set_lattice_source(p.input_dir, proposal["name"])
            projects.notify()
            return {"lattice": proposal["name"]}
        if kind == "segment":
            from avas.gui.bridge import UserError
            from avas.gui.services import segments
            if runner.any_active():
                raise ToolError("A simulation is already running.")
            if page_available():
                # the page validates and saves open editors and runs the checks, like the Run button
                r = self.front("run.prepare", {}, timeout=300)
                if not isinstance(r, dict):
                    raise ToolError("The window did not confirm that the project is ready to run.")
                if not r.get("ok"):
                    raise ToolError(r.get("error") or "The project could not be prepared (check the window for a message).")
            else:
                try:
                    runner.check()
                except UserError as exc:
                    raise ToolError(str(exc)) from exc
            try:
                job = segments.start(p, proposal.get("spec") or {}, proposal.get("choice"), proposal.get("label"))
            except UserError as exc:
                raise ToolError(str(exc)) from exc
            self.front("ui.page", {"page": "run"}, timeout=3)
            proposal["folder"] = job.root
            return {"started": True, "folder": os.path.relpath(job.root, p.path), "choice": proposal.get("choice")}
        if kind == "run":
            if runner.any_active():
                raise ToolError("A simulation is already running.")
            if page_available():
                # the page saves open editors and runs its checks, like the Run button
                r = self.front("run.start", {}, timeout=300)
                if not isinstance(r, dict):
                    raise ToolError("The window did not confirm the start of the simulation.")
                if not r.get("started"):
                    raise ToolError(r.get("error") or "The simulation did not start (check the window for a message).")
                return {"started": True}
            runner.check()
            runner._runner.start(p, runner.ini_error_mode(p))
            return {"started": True}
        return {"approved": True}

    def undo(self, pid):
        from avas import paths
        from avas.ai import ToolError
        from avas.gui.services import projects
        from avas.gui.textio import read_text, write_text
        rec = self.conv.proposals.get(pid)
        if not rec:
            raise ToolError("Nothing to undo.")
        kind = rec.get("kind")
        p = self.project()
        if kind in ("lattice", "file"):
            old = rec.get("old_text")
            if old is None and rec.get("backup") and os.path.isfile(rec["backup"]):
                old = read_text(rec["backup"])
            if old is None:
                raise ToolError("The backup of this change is gone.")
            if kind == "lattice":
                path = rec.get("path") or p.lattice_path()
                self._write_lattice(rec["file"], path, old)
            else:
                path = rec.get("path") or p.input_file(rec["file"])
                write_text(path, old)
                self.front("pages.reload", {"paths": [path], "pages": [rec.get("page"), "files"]}, timeout=5)
                projects.notify()
            return True
        if kind == "lattice_source" and rec.get("previous"):
            paths.set_lattice_source(p.input_dir, rec["previous"])
            projects.notify()
            return True
        raise ToolError("This change cannot be undone.")


@rpc("assistant.decide")
def decide(conversation, id, decision, choice=None):
    conv = _get(conversation)
    with conv.lock:
        rec = conv.decisions.get(id)
    if rec is None:
        raise UserError("This proposal is no longer waiting for a decision.")
    rec["decision"] = "apply" if decision == "apply" else "reject"
    rec["choice"] = choice
    rec["event"].set()
    return True


@rpc("assistant.undo")
def undo(conversation, id):
    from avas.ai import ToolError
    conv = _get(conversation)
    item = conv.find(id)
    if item is None or item.get("status") != "applied":
        raise UserError("Only applied changes can be undone.")
    try:
        Host(conv).undo(id)
    except ToolError as exc:
        raise UserError(str(exc)) from exc
    item["status"] = "undone"
    conv.upsert(item)
    conv.save()
    return item


# =========================================================================== turns
def _facts(ui):
    """Short project facts for the system prompt."""
    from avas.gui.services import projects
    facts = []
    p = context.project()
    if not p.is_open:
        return ["No project is open."], None
    facts.append(f"Project folder: {p.path}")
    facts.append(f"Lattice used for the run: {p.lattice_name()}")
    try:
        lat = projects.lattice_summary(p)
        if lat.get("exists"):
            facts.append(f"Lattice: {lat['elements']} elements, total length {lat['length']:.4g} m, "
                         f"{lat['rf']} RF cavities, {lat['issues']} problems")
        beam = projects.beam_summary(p)
        if beam.get("exists") and not beam.get("error"):
            facts.append(f"Beam: q={beam.get('numofcharge')}, mass={beam.get('particlerestmass')} MeV, "
                         f"W={beam.get('kneticenergy')} MeV, I={beam.get('current')} mA, "
                         f"f={beam.get('frequency')} Hz, macro-particles={beam.get('particlenumber')}"
                         + (f", from file {beam.get('dst')}" if beam.get("use_dst") else ""))
        run = projects.run_summary(p)
        if run.get("status"):
            facts.append(f"Last run: {run.get('status')} ({run.get('started')}, {run.get('elapsed_s')} s)"
                         + (f", error: {run.get('error')}" if run.get("error") else ""))
    except Exception:  # noqa: BLE001 - facts are a convenience
        pass
    run_time = None
    elapsed = (p.last_run() or {}).get("elapsed_s")
    if elapsed:
        run_time = f"{float(elapsed):.0f} s (last run)"
    ui = ui or {}
    if ui.get("page"):
        facts.append(f"The user is on the {ui['page']} page")
    if ui.get("selection"):
        facts.append(f"Selected in the lattice editor: {ui['selection']}")
    if ui.get("dirty"):
        facts.append(f"Pages with unsaved edits: {', '.join(ui['dirty'])}")
    return facts, run_time


class _EventSink:
    """Turns agent events into chat items."""

    def __init__(self, conv, turn_id):
        self.conv = conv
        self.turn = turn_id
        self.current = None           # the assistant item receiving text
        self.tools = {}

    def _assistant_item(self):
        if self.current is None:
            self.current = {"id": uuid.uuid4().hex[:12], "role": "assistant", "text": "", "reasoning": "",
                            "turn": self.turn, "time": time.time()}
            self.conv.upsert(self.current)
        return self.current

    def __call__(self, ev):
        t = ev.get("type")
        conv = self.conv
        if t in ("text", "reasoning"):
            item = self._assistant_item()
            field = "text" if t == "text" else "reasoning"
            with conv.lock:
                item[field] = (item.get(field) or "") + ev.get("delta", "")
            conv.emit({"type": "delta", "itemId": item["id"], "field": field, "delta": ev.get("delta", "")})
        elif t == "tool_start":
            self.current = None
            item = {"id": ev["id"], "role": "tool", "name": ev["name"], "args": ev.get("arguments") or {},
                    "status": "running", "turn": self.turn, "time": time.time()}
            self.tools[ev["id"]] = item
            conv.upsert(item)
        elif t == "tool_progress":
            item = self.tools.get(ev.get("id")) or conv.find(ev.get("id"))
            if item is None:
                return
            kind = ev.get("kind")
            payload = {k: v for k, v in ev.items() if k not in ("type", "id", "name")}
            if kind == "chart":
                item.setdefault("charts", [])
                item["charts"] = (item["charts"] + [payload])[-4:]
            elif kind == "table":
                item["table"] = payload
            elif kind == "best":
                item["best"] = payload
            elif kind == "step":
                item["step"] = payload
            else:
                item["progress"] = payload
            conv.upsert(item)
        elif t == "tool_end":
            item = self.tools.get(ev.get("id")) or conv.find(ev.get("id"))
            if item is None:
                return
            result = ev.get("result")
            text = bridge.dumps(result)
            item.update(status="ok" if ev.get("ok") else "error",
                        result=text if len(text) <= MAX_RESULT_CHARS else text[:MAX_RESULT_CHARS] + " …")
            if not ev.get("ok"):
                item["summary"] = (result or {}).get("error") if isinstance(result, dict) else str(result)
            item.pop("progress", None)
            conv.upsert(item)
        elif t == "notice":
            conv.upsert({"id": uuid.uuid4().hex[:12], "role": "notice", "kind": ev.get("kind"),
                         "text": ev.get("message") or "", "turn": self.turn, "time": time.time()})
        elif t == "error":
            self.current = None
            conv.upsert({"id": uuid.uuid4().hex[:12], "role": "error", "kind": ev.get("kind"),
                         "text": ev.get("message") or "", "detail": ev.get("detail") or "", "turn": self.turn,
                         "time": time.time()})
        elif t == "turn_end":
            usage = ev.get("usage") or {}
            for k, v in usage.items():
                if isinstance(v, (int, float)):
                    conv.usage[k] = conv.usage.get(k, 0) + v
            if ev.get("tool_mode"):
                conv.emit({"type": "toolMode", "mode": ev.get("tool_mode")})


def _worker(conv, provider, text, ui):
    from avas.ai import Agent
    from avas.ai.avas_prompt import build_system_prompt
    from avas.ai.avas_tools import build_tools
    turn = uuid.uuid4().hex[:8]
    sink = _EventSink(conv, turn)
    try:
        cfg = provider_config(provider)
        facts, run_time = _facts(ui)
        system = build_system_prompt({"facts": facts, "run_time": run_time})
        opts = options()
        agent = Agent(cfg, build_tools(Host(conv)), system, emit=sink,
                      max_steps=int(opts.get("maxSteps") or 40),
                      context_tokens=int(provider.get("contextTokens") or 32000))
        remembered = conv.tool_mode_memory.get(provider["id"])
        if cfg.tool_mode == "auto" and remembered in ("native", "prompted"):
            agent.effective_tool_mode = remembered
        history = agent.run(conv.messages, text, conv.stop_event)
        with conv.lock:
            conv.messages = history
        conv.tool_mode_memory[provider["id"]] = agent.effective_tool_mode
    except UserError as exc:
        conv.upsert({"id": uuid.uuid4().hex[:12], "role": "error", "kind": "config", "text": str(exc), "turn": turn,
                     "time": time.time()})
    except Exception as exc:  # noqa: BLE001 - reported in the chat
        log.exception("assistant turn failed")
        conv.upsert({"id": uuid.uuid4().hex[:12], "role": "error", "kind": "internal", "text": str(exc), "turn": turn,
                     "time": time.time()})
    finally:
        conv.updated = time.time()
        try:
            conv.save()
        except OSError as exc:
            log.warning("assistant: could not save the conversation: %s", exc)
        conv.emit({"type": "busy", "busy": False})


@rpc("assistant.send")
def send(conversation, text, ui=None):
    conv = _get(conversation)
    if conv.busy:
        raise UserError("The assistant is still working on the previous message.")
    text = (text or "").strip()
    if not text:
        raise UserError("Empty message.")
    provider = active_provider()
    if provider is None:
        raise UserError("No AI provider is configured. Open the assistant settings and add one "
                        "(for a local model, e.g. Ollama at http://localhost:11434/v1).")
    p = context.project()
    if not conv.project and p.is_open and not conv.messages:
        conv.project = p.path              # a fresh conversation adopts the open project
    if not conv.title:
        conv.title = text.splitlines()[0][:60]
    conv.upsert({"id": uuid.uuid4().hex[:12], "role": "user", "text": text, "time": time.time(),
                 "provider": provider.get("name") or provider.get("model"), "model": provider.get("model")})
    conv.stop_event = threading.Event()
    conv.thread = threading.Thread(target=_worker, args=(conv, provider, text, ui or {}), name="avas-assistant",
                                   daemon=True)
    conv.thread.start()
    conv.emit({"type": "busy", "busy": True})
    return conv.summary()


@rpc("assistant.stop")
def stop(conversation):
    conv = _get(conversation)
    conv.stop_event.set()
    with conv.lock:
        for rec in conv.decisions.values():
            rec["event"].set()
    return True


def shutdown():
    with _conv_lock:
        convs = list(_conversations.values())
    for conv in convs:
        conv.stop_event.set()
    from avas.ai import sandbox
    sandbox.stop_all()
