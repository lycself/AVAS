"""Forward Python log records to the page's log panel (event ``log``)."""
import logging
import threading

from avas.gui import bridge

_installed = {"handler": None}
MAX_HISTORY = 2000
_history = []
_lock = threading.Lock()


class PageHandler(logging.Handler):
    def emit(self, record):
        if getattr(record, "hide_from_gui_log", False):
            return
        try:
            msg = record.getMessage()
            if record.exc_info:
                msg += "\n" + logging.Formatter().formatException(record.exc_info)
            entry = {"t": record.created, "level": record.levelname, "name": record.name, "msg": msg}
        except Exception:  # noqa: BLE001
            return
        with _lock:
            _history.append(entry)
            if len(_history) > MAX_HISTORY:
                del _history[: len(_history) - MAX_HISTORY]
        bridge.emit("log", entry)


def history():
    with _lock:
        return list(_history)


def clear_history():
    with _lock:
        _history.clear()


def install(level=logging.DEBUG):
    if _installed["handler"] is not None:
        return _installed["handler"]
    from avas.log import setup_logger
    setup_logger()
    handler = PageHandler(level)
    root = logging.getLogger()
    root.addHandler(handler)
    if root.level > logging.INFO or root.level == logging.NOTSET:
        root.setLevel(logging.INFO)
    _installed["handler"] = handler
    return handler
