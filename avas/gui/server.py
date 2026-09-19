"""HTTP server: the built page, RPC calls, the event stream, blobs and downloads.

One transport for every way of running the GUI: the desktop window
(pywebview shows this server's page), a local browser (``avas serve``) and,
later, a shared server.  Routes:

* ``POST /api/rpc``       ``{"method", "params"}`` -> :func:`bridge.dispatch` reply
* ``WS   /api/events``    JSON batches ``[[name, payload], ...]`` from :func:`bridge.emit`
* ``GET  /blob/<id>``     raw little-endian bytes of a :func:`bridge.blob` array (one shot)
* ``GET  /download?path`` a local file as an attachment (browser mode: "open" a result file)
* ``GET  /<file>``        the built front end from ``web/`` (``index.html`` is never cached)

Every request except the static page must carry the **access token**
(``X-AVAS-Token`` header, or ``?token=`` for WebSocket and download links).
The token is generated at start and put in the page URL; without it any web
page open in the user's browser could call the RPC and read or write local
files.  The server binds to 127.0.0.1 unless told otherwise.  Handlers are
blocking Python (they may open native dialogs), so they run in a thread pool.

The app is a :class:`fastapi.FastAPI`; the interactive API description is at
``/api/docs`` (the token is a header, so use "Authorize" there first).
"""
import asyncio
import logging
import os
import posixpath
import secrets
import socket
import threading
import time
import urllib.parse

from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse, Response
from pydantic import BaseModel, ConfigDict

from avas.gui import bridge

log = logging.getLogger("avas.gui")

WEB_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
TOKEN_HEADER = "X-AVAS-Token"

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


class RpcRequest(BaseModel):
    """Body of ``POST /api/rpc``."""

    model_config = ConfigDict(extra="forbid")

    method: str
    params: dict | None = None


class _QuietConnectionResets(logging.Filter):
    """Windows' Proactor loop logs an error when the page drops a connection (reload, tab closed); not ours."""

    def filter(self, record):
        exc = record.exc_info[1] if record.exc_info and len(record.exc_info) > 1 else None
        return not (isinstance(exc, ConnectionResetError) and "_call_connection_lost" in record.getMessage())


class GuiServer:
    """A running server; see :func:`start`."""

    def __init__(self, web_root, host, port, token, cors_origins=None):
        self.web_root = os.path.abspath(web_root)
        self.host = host
        self.token = token
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.bind((host, port))
        self._sock.set_inheritable(True)
        self.port = self._sock.getsockname()[1]
        self.base_url = f"http://{host}:{self.port}"
        self.app = self._build_app(cors_origins)
        self._uvicorn = None
        self._thread = None

    # ------------------------------------------------------------------ app
    def _build_app(self, cors_origins):
        app = FastAPI(title="AVAS GUI", docs_url="/api/docs", redoc_url=None, openapi_url="/api/openapi.json")
        if cors_origins:                       # Vite dev server on another port
            app.add_middleware(CORSMiddleware, allow_origins=list(cors_origins), allow_methods=["*"],
                               allow_headers=["*"])
        guarded = [Depends(self._require_token)]        # 401 is decided before the body is parsed
        app.post("/api/rpc", dependencies=guarded)(self._rpc)
        app.websocket("/api/events")(self._events)
        app.get("/blob/{key}", dependencies=guarded)(self._blob)
        app.get("/download", dependencies=guarded)(self._download)
        app.get("/{path:path}", include_in_schema=False)(self._static)

        @app.exception_handler(RequestValidationError)
        async def bad_request(request, exc):    # noqa: ARG001 - the page only looks at the status
            return PlainTextResponse("bad request", status_code=400)

        return app

    def _authorized(self, request):
        given = request.headers.get(TOKEN_HEADER) or request.query_params.get("token") or ""
        return self.token is None or secrets.compare_digest(given, self.token)

    def _require_token(self, request: Request):
        if not self._authorized(request):
            raise HTTPException(status_code=401, detail="missing or wrong access token")

    async def _rpc(self, req: RpcRequest):
        body = await run_in_threadpool(bridge.dispatch, req.method, req.params or {})
        return Response(body, media_type="application/json; charset=utf-8", headers={"Cache-Control": "no-store"})

    async def _events(self, websocket: WebSocket):
        if not self._authorized(websocket):
            await websocket.close(code=4401)
            return
        await websocket.accept()
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()

        def deliver(text):
            loop.call_soon_threadsafe(queue.put_nowait, text)

        async def pump():
            while True:
                await websocket.send_text(await queue.get())

        bridge.subscribe(deliver)
        task = asyncio.create_task(pump())
        try:
            while True:                        # the page never sends anything; this notices the close
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:  # noqa: BLE001 - connection reset
            pass
        finally:
            bridge.unsubscribe(deliver)
            task.cancel()

    async def _blob(self, key: str):
        arr = bridge.take_blob(key)
        if arr is None:
            raise HTTPException(status_code=404, detail="gone")
        return Response(arr.tobytes(), media_type="application/octet-stream", headers={"Cache-Control": "no-store"})

    async def _download(self, path: str = "", inline: str = "0"):
        """Browser mode: a local file the page cannot open with the system shell."""
        if not path or not os.path.isfile(path):
            raise HTTPException(status_code=404, detail="not found")
        return FileResponse(path, filename=None if inline == "1" else os.path.basename(path),
                            media_type=MIME.get(os.path.splitext(path)[1].lower(), "application/octet-stream"),
                            headers={"Cache-Control": "no-store"})

    async def _static(self, path: str = ""):
        rel = posixpath.normpath(urllib.parse.unquote(path or "")).lstrip("/")
        if rel in ("", "."):
            rel = "index.html"
        full = os.path.abspath(os.path.join(self.web_root, *rel.split("/")))
        if not full.startswith(self.web_root + os.sep) or not os.path.isfile(full):
            raise HTTPException(status_code=404, detail="not found")
        ext = os.path.splitext(full)[1].lower()
        cache = "no-cache" if ext == ".html" else "max-age=3600"
        return FileResponse(full, media_type=MIME.get(ext, "application/octet-stream"), headers={"Cache-Control": cache})

    # ------------------------------------------------------------------ lifecycle
    def page_url(self, host_kind="browser", dev_url=None):
        """URL of the page including the access token; ``host_kind`` tells the page what it runs in."""
        query = {"host": host_kind}
        if self.token:
            query["token"] = self.token
        if dev_url:                            # Vite dev server: page elsewhere, API here
            query["api"] = self.base_url
            return f"{dev_url.rstrip('/')}/?{urllib.parse.urlencode(query)}"
        return f"{self.base_url}/index.html?{urllib.parse.urlencode(query)}"

    def serve(self):
        """Start uvicorn in a daemon thread and return once it accepts connections."""
        import uvicorn

        logging.getLogger("asyncio").addFilter(_QuietConnectionResets())
        config = uvicorn.Config(self.app, log_config=None, log_level="warning", access_log=False, lifespan="off",
                                ws_ping_interval=20.0, ws_ping_timeout=60.0)
        self._uvicorn = uvicorn.Server(config)
        self._thread = threading.Thread(target=self._uvicorn.run, kwargs={"sockets": [self._sock]},
                                        name="avas-gui-http", daemon=True)
        self._thread.start()
        deadline = time.monotonic() + 10
        while not self._uvicorn.started:
            if time.monotonic() > deadline or not self._thread.is_alive():
                raise RuntimeError("the GUI server did not start")
            time.sleep(0.01)
        return self

    def shutdown(self):
        if self._uvicorn is not None:
            self._uvicorn.should_exit = True
            self._thread.join(timeout=5)
        try:
            self._sock.close()
        except OSError:
            pass


def start(web_root=WEB_ROOT, host="127.0.0.1", port=0, token="", cors_origins=None):
    """Serve the GUI; ``token=""`` generates one, ``None`` disables the check (development only)."""
    if token == "":
        token = secrets.token_urlsafe(24)
    if token is None:
        log.warning("GUI server started WITHOUT an access token: any local program or web page can call it")
    return GuiServer(web_root, host, port, token, cors_origins).serve()
