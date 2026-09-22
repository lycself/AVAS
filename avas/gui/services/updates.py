"""Authenticated update RPCs. Browser hosts can inspect; desktop owns restart."""
import copy
import logging
import json
from pathlib import Path
import subprocess
import sys
import threading
import time
import traceback

from avas import updates
from avas.gui import app, bridge, maintenance
from avas.gui.bridge import UserError, rpc

_lock = threading.RLock()
_check_lock = threading.Lock()
_cached = None
_checked = 0
_prepared = None
_progress = None
_cancel_event = None


def _report_progress(data):
    global _progress
    with _lock:
        _progress = copy.deepcopy(data)
        snapshot = copy.deepcopy(_progress)
    bridge.emit("updates.progress", snapshot)


@rpc("updates.status")
def status():
    with _lock:
        return {"phase": "installing" if app.state().get("update_exiting") else "ready" if _prepared is not None
                else "preparing" if maintenance.updating else "idle",
                "commit": _prepared.get("commit", "") if _prepared else "",
                "cancelling": _cancel_event is not None and _cancel_event.is_set(),
                "progress": copy.deepcopy(_progress)}


@rpc("updates.result")
def result():
    """Acknowledge a persisted result once; keep the on-disk log and backup."""
    with _lock:
        path = app.app_settings().get("updates/result")
        if not path or not Path(path).is_file():
            return None
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        data["logAvailable"] = bool(data.get("log") and Path(data["log"]).is_file())
        app.app_settings().set("updates/result", "")
        return data


@rpc("updates.check")
def check(force=False):
    global _cached, _checked
    # Serialize discovery separately: status/progress/cancellation must not wait for networking.
    with _check_lock:
        with _lock:
            refresh = force or _cached is None or time.monotonic() - _checked > 6 * 3600
        if refresh:
            try:
                fresh = updates.check()
            except Exception as exc:
                logging.getLogger("avas.gui").warning("Update check failed: %s", exc)
                raise UserError("Could not check for updates. Check your connection to GitHub and try again.") from exc
            with _lock:
                _cached = fresh
                _checked = time.monotonic()
        with _lock:
            result = copy.deepcopy(_cached)
        result["canInstall"] = app.state().get("window") is not None
        result["ignored"] = app.app_settings().get("updates/ignored") == result["release"]["commit"]
        return result


@rpc("updates.ignore")
def ignore(commit):
    if not updates.SHA.fullmatch(commit):
        raise UserError("Invalid update revision.")
    app.app_settings().set("updates/ignored", commit)
    return True


@rpc("updates.prepare")
def prepare(commit):
    global _prepared, _cancel_event, _progress
    from avas.gui.services import runner
    if app.state().get("window") is None:
        raise UserError("Update the server installation locally, then restart avas serve.")
    # Reserve before network work: no new simulation may start until cancellation/exit.
    with maintenance.lock:
        maintenance.require_idle_update()
        if runner.any_active():
            raise UserError("Finish all simulations and studies before updating.")
        maintenance.updating = True
        with _lock:
            event = _cancel_event = threading.Event()
    try:
        _report_progress({"message": "Preparing the confirmed update...", "stage": "prepare"})
        latest = check(force=True)
        if event.is_set():
            raise updates.UpdateCancelled()
        if latest["release"]["commit"] != commit:
            return {"changed": True, "info": latest}
        if not latest["available"]:
            raise UserError("This installation is already up to date.")
        prepared = updates.stage(latest["release"], latest["current"], _report_progress, event)
        prepared["commit"] = commit
        with _lock:
            if event.is_set():
                raise updates.UpdateCancelled()
            _prepared = prepared
        return {"changed": False}
    except updates.UpdateCancelled:
        return {"changed": False, "cancelled": True}
    except Exception as exc:
        if isinstance(exc, UserError):
            raise
        raise UserError(str(exc)) from exc
    finally:
        with maintenance.lock:
            with _lock:
                _cancel_event = None
                if _prepared is None:
                    _progress = None
                    maintenance.updating = False


@rpc("updates.cancel")
def cancel():
    global _prepared, _progress
    with maintenance.lock:
        with _lock:
            if app.state().get("update_exiting"):
                raise UserError("Installation has started and cannot be cancelled.")
            if _cancel_event is not None:
                _cancel_event.set()
            if _prepared is not None:
                _prepared = None
                _progress = None
                if _cancel_event is None:
                    maintenance.updating = False
    return True


@rpc("updates.install")
def install(presentation=None):
    global _prepared
    with _lock:
        if _prepared is None or app.state().get("window") is None:
            raise UserError("Check for updates and confirm the version first.")
        # Start the independent helper before closing: launch failures keep the UI alive.
        try:
            plan_path = Path(_prepared["directory"]) / "plan.json"
            if plan_path.is_file():
                plan = json.loads(plan_path.read_text(encoding="utf-8"))
                plan["language"] = app.app_settings().get("ui/language") or "en"
                from avas.update_view import normalize_presentation, panel_screen_rect
                supplied = dict(presentation) if isinstance(presentation, dict) else {}
                if supplied.get("theme") not in ("light", "dark"):
                    supplied["theme"] = app.resolve_theme(app.app_settings().get("ui/theme"))
                supplied.setdefault("motion", app.app_settings().get("ui/motion") or "full")
                appearance = normalize_presentation(supplied)
                appearance["bounds"] = panel_screen_rect(app.state().get("window"), presentation)
                plan["presentation"] = appearance
                updates.worker.save_result(plan_path, plan)
            app.app_settings().set("updates/result", str(Path(_prepared["directory"]) / "result.json"))
            # Capture even bootloader/startup errors before the helper can open its own log.
            log, log_path = updates.worker.open_update_log(Path(_prepared["directory"]) / "launcher.log")
            with log:
                print("Launching the independent update helper", file=log, flush=True)
                try:
                    process = subprocess.Popen(_prepared["command"], cwd=_prepared["directory"], stdout=log, stderr=log,
                                               creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
                    ready = Path(_prepared["directory"]) / "ready.json"
                    deadline = time.monotonic() + 30
                    while not ready.is_file():
                        code = process.poll()
                        if code is not None:
                            raise OSError(f"The update helper exited before AVAS closed (exit code {code}).")
                        if time.monotonic() >= deadline:
                            # Only terminate the helper we just started, never another AVAS process.
                            # It has not acknowledged readiness or touched installed files.
                            from avas.gui import proctree
                            proctree.kill(process)  # a frozen one-file helper has its own child process
                            raise OSError("The update helper did not become ready. AVAS will remain open.")
                        time.sleep(0.1)
                except OSError as exc:
                    traceback.print_exc(file=log)
                    updates.worker.flush_log(log)
                    raise OSError(f"{exc}\n{log_path}") from exc
        except OSError as exc:
            maintenance.updating = False
            _prepared = None
            raise UserError(str(exc)) from exc
        _prepared = None
        app.state()["update_exiting"] = True
    threading.Timer(0.5, app.request_close).start()
    return True
