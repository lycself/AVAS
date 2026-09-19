"""Python <-> JavaScript plumbing.

* **Calls** (JS -> Python): the page posts ``{"method", "params"}`` to
  ``/api/rpc`` (:mod:`avas.gui.server`) and :func:`dispatch` runs the handler.
  Handlers are registered with :func:`rpc` under dotted names
  (``"project.open"``); ``params`` is a dict passed as keyword arguments.
  The reply is a JSON *string* ``{"ok": true, "result": ...}`` or
  ``{"ok": false, "error": ..., "detail": ...}``.  NaN / inf become ``null``
  and numpy types are converted, so the page can always ``JSON.parse`` it.
* **Events** (Python -> JS): :func:`emit` queues ``(name, payload)``; a
  flusher thread delivers the queue in batches every ~40 ms to every
  connected page's WebSocket (:func:`subscribe`), so a chatty log never
  floods the page.
* **Blobs**: large numeric arrays travel as binary over the HTTP server;
  :func:`blob` stores an array and returns a small JSON reference the page
  resolves with ``fetch``.

The same transport serves the desktop window (pywebview), a local browser
and, later, a shared server: pywebview only provides the window and the
native file dialogs.
"""
import json
import logging
import math
import threading
import time
import traceback
import uuid

import numpy as np

log = logging.getLogger("avas.gui")

_handlers = {}
_queue = []
_queue_lock = threading.Lock()
_flusher = None
_blobs = {}
_blob_lock = threading.Lock()
MAX_BLOBS = 64


class UserError(Exception):
    """An expected problem whose message is shown to the user as is."""


def rpc(name):
    def deco(fn):
        _handlers[name] = fn
        return fn
    return deco


def handlers():
    return dict(_handlers)


# --------------------------------------------------------------------------- json
def _clean(obj):
    if isinstance(obj, dict):
        return {str(k): _clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v) for v in obj]
    if isinstance(obj, np.ndarray):
        if obj.dtype.kind in "fc":
            arr = obj.astype(float)
            return [_clean(v) for v in arr.tolist()] if not np.isfinite(arr).all() else arr.tolist()
        return _clean(obj.tolist())
    if isinstance(obj, (np.floating, float)):
        v = float(obj)
        return v if math.isfinite(v) else None
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", "replace")
    if hasattr(obj, "__fspath__"):
        return str(obj)
    return obj


def dumps(obj):
    return json.dumps(_clean(obj), ensure_ascii=False, allow_nan=False)


# --------------------------------------------------------------------------- blobs
def blob(array, dtype="float32"):
    """Register a numeric array for binary transfer; returns a JSON-able reference."""
    arr = np.ascontiguousarray(np.asarray(array, dtype=dtype))
    key = uuid.uuid4().hex
    with _blob_lock:
        _blobs[key] = arr
        while len(_blobs) > MAX_BLOBS:
            _blobs.pop(next(iter(_blobs)))
    return {"__blob__": key, "dtype": str(arr.dtype), "shape": list(arr.shape)}


def take_blob(key):
    with _blob_lock:
        return _blobs.pop(key, None)


# --------------------------------------------------------------------------- calls
def dispatch(method, params=None):
    fn = _handlers.get(method)
    if fn is None:
        return dumps({"ok": False, "error": f"Unknown method: {method}"})
    t0 = time.perf_counter()
    try:
        result = fn(**(params or {}))
        return dumps({"ok": True, "result": result})
    except UserError as exc:
        return dumps({"ok": False, "error": str(exc), "user": True})
    except Exception as exc:  # noqa: BLE001 - reported to the page
        detail = traceback.format_exc()
        log.error("%s failed: %s", method, exc)
        log.debug("%s", detail)
        return dumps({"ok": False, "error": f"{type(exc).__name__}: {exc}", "detail": detail})
    finally:
        dt = (time.perf_counter() - t0) * 1e3
        if dt > 500:
            log.debug("%s took %.0f ms", method, dt)


# --------------------------------------------------------------------------- events
def emit(name, payload=None):
    with _queue_lock:
        _queue.append([name, payload])


_subscribers = []


def subscribe(deliver):
    """Register a connected page: ``deliver(text)`` gets each JSON-encoded batch.

    Called from the flusher thread; the server hands the text to the page's
    WebSocket.  Events emitted while nobody is connected are dropped (pages
    fetch the current state when they connect), so a reload never replays a
    backlog of stale progress.
    """
    _subscribers.append(deliver)
    start_flusher()
    return deliver


def unsubscribe(deliver):
    if deliver in _subscribers:
        _subscribers.remove(deliver)


def connected():
    return len(_subscribers)


def start_flusher():
    global _flusher
    if _flusher is None:
        _flusher = threading.Thread(target=_flush_loop, name="avas-gui-events", daemon=True)
        _flusher.start()


def _flush_loop():
    while True:
        time.sleep(0.04)
        with _queue_lock:
            if not _queue:
                continue
            batch = _queue[:]
            _queue.clear()
        if not _subscribers:
            continue
        try:
            text = dumps(batch)
        except Exception as exc:  # noqa: BLE001 - a payload that is not JSON-able
            log.error("event batch dropped: %s", exc)
            continue
        for deliver in list(_subscribers):
            try:
                deliver(text)
            except Exception:  # noqa: BLE001 - connection going away
                unsubscribe(deliver)
