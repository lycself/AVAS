"""Loopback HTTP server: serves the built page and binary blobs.

Serving the page ourselves (instead of pywebview's file loader) keeps the page
and ``/blob/<id>`` on one origin, so large arrays can be fetched as raw
little-endian bytes without CORS or JSON overhead.  The server binds to
127.0.0.1 only; blob URLs are unguessable one-shot ids.
"""
import http.server
import os
import posixpath
import threading
import urllib.parse

from avas.webgui import bridge

WEB_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".map": "application/json",
}


class _Handler(http.server.BaseHTTPRequestHandler):
    server_version = "AVAS"
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):  # silence
        pass

    def _send(self, code, body, ctype, extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):  # noqa: N802
        # development only (avas.webgui.devserver): RPC over HTTP for a plain browser
        if not self.server.dev_rpc or urllib.parse.urlparse(self.path).path != "/rpc":
            self._send(404, b"not found", "text/plain")
            return
        length = int(self.headers.get("Content-Length") or 0)
        import json
        req = json.loads(self.rfile.read(length) or b"{}")
        body = bridge.dispatch(req.get("method"), req.get("params")).encode("utf-8")
        self._send(200, body, "application/json; charset=utf-8")

    def _events(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        q = bridge.subscribe()
        try:
            while True:
                batch = q.get()
                self.wfile.write(b"data: " + bridge.dumps(batch).encode("utf-8") + b"\n\n")
                self.wfile.flush()
        except OSError:
            pass
        finally:
            bridge.unsubscribe(q)

    def do_GET(self):  # noqa: N802
        path = urllib.parse.urlparse(self.path).path
        if path == "/events" and self.server.dev_rpc:
            self._events()
            return
        if path.startswith("/blob/"):
            arr = bridge.take_blob(path[len("/blob/"):])
            if arr is None:
                self._send(404, b"gone", "text/plain")
            else:
                self._send(200, arr.tobytes(), "application/octet-stream", {"Cache-Control": "no-store"})
            return
        rel = posixpath.normpath(urllib.parse.unquote(path)).lstrip("/")
        if rel in ("", "."):
            rel = "index.html"
        full = os.path.join(self.server.web_root, *rel.split("/"))
        if not os.path.abspath(full).startswith(os.path.abspath(self.server.web_root)) or not os.path.isfile(full):
            self._send(404, b"not found", "text/plain")
            return
        with open(full, "rb") as fh:
            body = fh.read()
        ext = os.path.splitext(full)[1].lower()
        cache = "no-cache" if ext == ".html" else "max-age=3600"
        self._send(200, body, MIME.get(ext, "application/octet-stream"), {"Cache-Control": cache})


class _Server(http.server.ThreadingHTTPServer):
    daemon_threads = True


def start(web_root=WEB_ROOT, port=0, dev_rpc=False):
    server = _Server(("127.0.0.1", port), _Handler)
    server.web_root = web_root
    server.dev_rpc = dev_rpc
    threading.Thread(target=server.serve_forever, name="avas-gui-http", daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}"
