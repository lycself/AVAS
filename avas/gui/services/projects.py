"""Project open / create / recent list."""
import logging
import os

from avas.gui import bridge, context
from avas.gui.bridge import UserError, rpc

log = logging.getLogger("avas.gui")


def notify():
    """Tell the page the project (or something shown in its summary) changed."""
    bridge.emit("project", context.project().summary())


def _runner_busy():
    from avas.gui.services import runner
    return runner.is_running()


@rpc("project.summary")
def summary():
    return context.project().summary()


@rpc("project.open")
def open_project(path):
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    if not path:
        raise UserError("No folder selected.")
    p = context.project()
    try:
        p.open(path)
    except ValueError as exc:
        raise UserError(str(exc)) from exc
    log.info("project opened: %s", p.path)
    return p.summary()


@rpc("project.create")
def create_project(path):
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    if not path:
        raise UserError("No folder selected.")
    p = context.project()
    try:
        p.create(path)
    except ValueError as exc:
        raise UserError(str(exc)) from exc
    log.info("project created: %s", p.path)
    return p.summary()


@rpc("project.close")
def close_project():
    if _runner_busy():
        raise UserError("Stop the running simulation first.")
    context.project().close()
    return context.project().summary()


@rpc("project.restoreLast")
def restore_last():
    p = context.project()
    last = p.last_path()
    if last and os.path.isdir(last) and not p.is_open:
        try:
            p.open(last)
        except ValueError as exc:
            log.warning("%s", exc)
    return p.summary()


@rpc("project.removeRecent")
def remove_recent(path):
    context.project().remove_recent(path)
    return context.project().summary()
