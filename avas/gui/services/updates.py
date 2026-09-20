"""Authenticated update RPCs. Browser hosts can inspect; desktop owns restart."""
import copy
import logging
import json
from pathlib import Path
import subprocess
import sys
import threading
import time

from avas import updates
from avas.gui import app, bridge, maintenance
from avas.gui.bridge import UserError, rpc

_lock = threading.RLock()
_cached = None
_checked = 0
_prepared = None


@rpc("updates.status")
def status():
    with _lock:
        return {"phase": "installing" if app.state().get("update_exiting") else "ready" if _prepared is not None
                else "preparing" if maintenance.updating else "idle",
                "commit": _prepared.get("commit", "") if _prepared else ""}


@rpc("updates.result")
def result():
    """Acknowledge a persisted result once; keep the on-disk log and backup."""
    with _lock:
        path = app.app_settings().get("updates/result")
        if not path or not Path(path).is_file():
            return None
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        app.app_settings().set("updates/result", "")
        return data


@rpc("updates.check")
def check(force=False):
    global _cached, _checked
    with _lock:
        if force or _cached is None or time.monotonic() - _checked > 6 * 3600:
            try:
                _cached = updates.check()
                _checked = time.monotonic()
            except Exception as exc:
                logging.getLogger("avas.gui").warning("Update check failed: %s", exc)
                raise UserError("Could not check for updates. Check your connection to GitHub and try again.") from exc
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
    global _prepared
    from avas.gui.services import runner
    if app.state().get("window") is None:
        raise UserError("Update the server installation locally, then restart avas serve.")
    # Reserve before network work: no new simulation may start until cancellation/exit.
    with maintenance.lock:
        maintenance.require_idle_update()
        if runner.any_active():
            raise UserError("Finish all simulations and studies before updating.")
        maintenance.updating = True
    try:
        latest = check(force=True)
        if latest["release"]["commit"] != commit:
            with maintenance.lock:
                maintenance.updating = False
            return {"changed": True, "info": latest}
        if not latest["available"]:
            raise UserError("This installation is already up to date.")
        prepared = updates.stage(latest["release"], latest["current"],
                                 lambda message: bridge.emit("updates.progress", {"message": message}))
        prepared["commit"] = commit
        with _lock:
            _prepared = prepared
        return {"changed": False}
    except Exception as exc:
        with maintenance.lock:
            maintenance.updating = False
        if isinstance(exc, UserError):
            raise
        raise UserError(str(exc)) from exc


@rpc("updates.cancel")
def cancel():
    global _prepared
    with _lock:
        if _prepared is not None:
            _prepared = None
            with maintenance.lock:
                maintenance.updating = False
    return True


@rpc("updates.install")
def install():
    global _prepared
    with _lock:
        if _prepared is None or app.state().get("window") is None:
            raise UserError("Check for updates and confirm the version first.")
        # Start the independent helper before closing: launch failures keep the UI alive.
        try:
            app.app_settings().set("updates/result", str(Path(_prepared["directory"]) / "result.json"))
            subprocess.Popen(_prepared["command"], cwd=_prepared["directory"],
                             creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
        except OSError:
            maintenance.updating = False
            _prepared = None
            raise
        _prepared = None
        app.state()["update_exiting"] = True
    threading.Timer(0.5, app.request_close).start()
    return True
