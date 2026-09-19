"""Desktop entry point: ``avas gui`` / ``python -m avas gui`` / ``avas-gui``.

Starts the GUI server (:mod:`avas.gui.server`), opens one pywebview window
(Edge WebView2 on Windows) on its page and runs the GUI loop.  The page uses
the same HTTP / WebSocket transport as a browser would (``avas serve``);
pywebview only provides the window frame and the native file dialogs.  Set
``AVAS_GUI_DEV_URL`` (e.g. ``http://localhost:5173``) to load the Vite dev
server instead, and ``AVAS_GUI_DEBUG=1`` to enable the WebView developer tools.
"""
import logging
import multiprocessing
import os
import sys

from avas.gui import bridge, server, settings as settings_mod, webview2

log = logging.getLogger("avas.gui")

APP_TITLE = "AVAS"
MIN_SIZE = (960, 600)

_state = {"settings": None, "window": None, "server": None, "base_url": "", "force_close": False}


def state():
    return _state


def app_settings():
    if _state["settings"] is None:
        _state["settings"] = settings_mod.Settings()
    return _state["settings"]


# --------------------------------------------------------------------------- theme helpers
def system_prefers_dark():
    if sys.platform != "win32":
        return False
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize") as key:
            value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        return int(value) == 0
    except OSError:
        return False


def resolve_theme(mode):
    if mode in ("light", "dark"):
        return mode
    return "dark" if system_prefers_dark() else "light"


def set_title_bar_dark(dark):
    """Dark / light native title bar (Windows 10 1809+)."""
    win = _state["window"]
    if sys.platform != "win32" or win is None:
        return
    try:
        import ctypes
        hwnd = int(win.native.Handle.ToInt64())
        value = ctypes.c_int(1 if dark else 0)
        for attribute in (20, 19):          # DWMWA_USE_IMMERSIVE_DARK_MODE (new / pre-20H1)
            if ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, attribute, ctypes.byref(value),
                                                          ctypes.sizeof(value)) == 0:
                break
    except Exception:  # noqa: BLE001 - cosmetic only
        pass


def set_zoom(factor):
    """Scale the whole page like browser zoom (WebView2 ZoomFactor); used for View > UI scale."""
    win = _state["window"]
    if win is None:
        return
    try:
        form = win.native
        control = getattr(form, "webview", None)
        if control is None or sys.platform != "win32":
            return
        from System import Action  # pythonnet, available with the WinForms backend

        def apply():
            control.ZoomFactor = float(factor)

        if control.InvokeRequired:
            control.Invoke(Action(apply))
        else:
            apply()
    except Exception as exc:  # noqa: BLE001 - cosmetic only
        log.debug("zoom failed: %s", exc)


# --------------------------------------------------------------------------- window events
def _on_shown():
    set_title_bar_dark(resolve_theme(app_settings().get("ui/theme")) == "dark")


def _on_loaded():
    scale = app_settings().get("ui/uiScale") or 100
    if scale != 100:
        set_zoom(scale / 100.0)


def _on_closing():
    """Runs on the UI thread: must not wait for the page (evaluate_js would dead-lock).

    The page keeps ``unsaved`` up to date (``app.closeGuard``); when there is
    something to ask about, closing is cancelled and the page asks the user,
    then calls ``app.quit``.
    """
    win = _state["window"]
    if _state["force_close"] or win is None:
        return True
    from avas.gui.services import runner
    if _state.get("unsaved") or runner.any_active():
        bridge.emit("app.closeRequested")
        return False
    _remember_geometry()
    return True


def _remember_geometry():
    win = _state["window"]
    try:
        app_settings().set("ui/window", {"width": win.width, "height": win.height, "x": win.x, "y": win.y,
                                         "maximized": bool(getattr(win, "maximized", False))})
    except Exception:  # noqa: BLE001
        pass


def request_close(force=True):
    _state["force_close"] = force
    win = _state["window"]
    if win is not None:
        _remember_geometry()
        win.destroy()


# --------------------------------------------------------------------------- main
def main(argv=None, language=None):
    multiprocessing.freeze_support()
    from avas.gui import logbridge
    logbridge.install()

    s = app_settings()
    if language:
        s.set("ui/language", language)
    from avas import i18n
    i18n.set_language(s.get("ui/language"))
    if not webview2.ensure_runtime(s.get("ui/language")):
        return 1

    import webview
    from avas.gui import services  # noqa: F401 - registers RPC handlers

    dev_url = os.environ.get("AVAS_GUI_DEV_URL")
    srv = server.start(cors_origins=[dev_url.rstrip("/")] if dev_url else None)
    _state["server"], _state["base_url"] = srv, srv.base_url
    url = srv.page_url("webview", dev_url=dev_url)

    geo = s.get("ui/window") or {}
    dark = resolve_theme(s.get("ui/theme")) == "dark"
    width, height = int(geo.get("width") or 1400), int(geo.get("height") or 900)
    screen = _primary_screen()
    if screen is not None:                       # never larger than the screen it opens on
        width = min(width, max(MIN_SIZE[0], screen[0] - 40))
        height = min(height, max(MIN_SIZE[1], screen[1] - 80))
    kwargs = dict(width=width, height=height, min_size=MIN_SIZE, background_color="#1f1f1f" if dark else "#ffffff",
                  text_select=True, maximized=bool(geo.get("maximized")))
    if geo.get("x") is not None and geo.get("y") is not None and _on_some_screen(geo, width, height):
        kwargs.update(x=int(geo["x"]), y=int(geo["y"]))

    # No js_api: the page talks to the HTTP server like a browser would; the window only
    # provides the frame and the native file dialogs.
    win = webview.create_window(APP_TITLE, url, **kwargs)
    _state["window"] = win
    win.events.shown += _on_shown
    win.events.loaded += _on_loaded
    win.events.closing += _on_closing

    storage = os.path.join(os.path.dirname(settings_mod.default_path()), "webview")
    debug = os.environ.get("AVAS_GUI_DEBUG") == "1"
    webview.start(gui="edgechromium" if sys.platform == "win32" else None, debug=debug,
                  private_mode=False, storage_path=storage, icon=_icon_path())
    services.runner.shutdown()
    services.assistant.shutdown()
    services.scan.shutdown()
    srv.shutdown()
    return 0


def _primary_screen():
    try:
        import webview
        screen = webview.screens[0]
        return screen.width, screen.height
    except Exception:  # noqa: BLE001
        return None


def _on_some_screen(geo, width, height):
    """The saved position keeps the whole window on one screen."""
    try:
        import webview
        for screen in webview.screens:
            if screen.x <= geo["x"] and geo["x"] + width <= screen.x + screen.width and \
                    screen.y <= geo["y"] and geo["y"] + height <= screen.y + screen.height:
                return True
    except Exception:  # noqa: BLE001
        return True
    return False


def _icon_path():
    path = os.path.join(server.WEB_ROOT, "avas.ico")
    return path if os.path.isfile(path) else None
