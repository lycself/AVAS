"""Python <-> JavaScript plumbing.

* **Calls** (JS -> Python): the page calls ``pywebview.api.call(method, params)``.
  Handlers are registered with :func:`rpc` under dotted names
  (``"project.open"``); ``params`` is a dict passed as keyword arguments.
  The reply is a JSON *string* ``{"ok": true, "result": ...}`` or
  ``{"ok": false, "error": ..., "detail": ...}``.  NaN / inf become ``null``
  and numpy types are converted, so the page can always ``JSON.parse`` it.
* **Events** (Python -> JS): :func:`emit` queues ``(name, payload)``; a
  flusher thread delivers the queue in batches every ~40 ms through
  ``window.__avasEmit(batch)``, so a chatty log never floods the page.
* **Blobs**: large numeric arrays travel as binary over the local HTTP server
  (see :mod:`avas.gui.server`); :func:`blob` stores an array and returns a
  small JSON reference the page resolves with ``fetch``.
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
_window = None
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
class Api:
    """The object handed to pywebview as ``js_api``: exposes only :meth:`call`."""

    def call(self, method, params=None):
        return dispatch(method, params)


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
def attach_window(window):
    global _window
    _window = window
    start_flusher()


def window():
    return _window


def emit(name, payload=None):
    with _queue_lock:
        _queue.append([name, payload])


_subscribers = []


def subscribe():
    """Development: an event queue for an HTTP event-stream client (see server.py)."""
    import queue
    q = queue.Queue()
    _subscribers.append(q)
    start_flusher()
    return q


def unsubscribe(q):
    if q in _subscribers:
        _subscribers.remove(q)


def start_flusher():
    global _flusher
    if _flusher is None:
        _flusher = threading.Thread(target=_flush_loop, name="avas-gui-events", daemon=True)
        _flusher.start()


def _flush_loop():
    while True:
        time.sleep(0.04)
        if _window is None and not _subscribers:
            continue
        with _queue_lock:
            if not _queue:
                continue
            batch = _queue[:]
            _queue.clear()
        for q in list(_subscribers):
            q.put(batch)
        if _window is None:
            continue
        try:
            _window.run_js(f"window.__avasEmit && window.__avasEmit({dumps(batch)})")
        except Exception:  # noqa: BLE001 - window closing / not loaded yet
            with _queue_lock:
                if len(_queue) < 10000:
                    _queue[:0] = batch
            time.sleep(0.2)
