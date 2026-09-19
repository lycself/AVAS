"""Application-level calls: info, preferences, native dialogs, shell integration."""
import os
import subprocess
import sys

import avas
from avas.gui import app as gui_app
from avas.gui import bridge, logbridge, webview2
from avas.gui.bridge import UserError, rpc


@rpc("app.info")
def info():
    from avas.buildinfo import build_info
    s = gui_app.app_settings()
    return {
        "version": avas.__version__,
        "build": build_info(),
        "python": sys.version.split()[0],
        "platform": sys.platform,
        "baseUrl": gui_app.state()["base_url"],
        "host": "webview" if gui_app.state()["window"] is not None else "browser",
        "settings": s.all(),
        "systemDark": gui_app.system_prefers_dark(),
        "webview2": webview2.installed_version(),
        "settingsPath": s.path,
    }


@rpc("app.systemDark")
def system_dark():
    return gui_app.system_prefers_dark()


@rpc("settings.set")
def settings_set(values):
    gui_app.app_settings().update(values)
    if "ui/language" in values:
        from avas import i18n
        i18n.set_language(values["ui/language"])
    if "ui/theme" in values:
        gui_app.set_title_bar_dark(gui_app.resolve_theme(values["ui/theme"]) == "dark")
    return True


@rpc("app.titleBar")
def title_bar(dark):
    gui_app.set_title_bar_dark(bool(dark))
    return True


@rpc("app.setTitle")
def set_title(title):
    win = gui_app.state()["window"]
    if win is not None:
        win.set_title(title)
    return True


@rpc("app.quit")
def quit_app():
    gui_app.request_close(force=True)
    return True


@rpc("app.logHistory")
def log_history():
    return logbridge.history()


@rpc("app.clearLog")
def clear_log():
    logbridge.clear_history()
    return True


# --------------------------------------------------------------------------- dialogs
def _window():
    win = gui_app.state()["window"]
    if win is None:
        raise UserError("Native dialogs need the desktop window; in a browser use the page's own file chooser.")
    return win


@rpc("dialog.openFile")
def open_file(directory="", multiple=False, filters=None):
    import webview
    result = _window().create_file_dialog(webview.FileDialog.OPEN, directory=directory or "",
                                          allow_multiple=bool(multiple), file_types=tuple(filters or ()))
    if not result:
        return None
    return list(result) if multiple else result[0]


@rpc("dialog.openFolder")
def open_folder(directory=""):
    import webview
    result = _window().create_file_dialog(webview.FileDialog.FOLDER, directory=directory or "")
    if not result:
        return None
    return result[0] if isinstance(result, (list, tuple)) else result


@rpc("dialog.saveFile")
def save_file(directory="", filename="", filters=None):
    import webview
    result = _window().create_file_dialog(webview.FileDialog.SAVE, directory=directory or "",
                                          save_filename=filename or "", file_types=tuple(filters or ()))
    if not result:
        return None
    return result if isinstance(result, str) else result[0]


# --------------------------------------------------------------------------- shell
@rpc("shell.open")
def shell_open(path):
    if not os.path.exists(path):
        raise UserError(f"Not found: {path}")
    if sys.platform == "win32":
        os.startfile(path)  # noqa: S606
    elif sys.platform == "darwin":
        subprocess.Popen(["open", path])
    else:
        subprocess.Popen(["xdg-open", path])
    return True


@rpc("shell.reveal")
def shell_reveal(path):
    if not os.path.exists(path):
        raise UserError(f"Not found: {path}")
    if sys.platform == "win32":
        if os.path.isdir(path):
            os.startfile(path)  # noqa: S606
        else:
            subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
    else:
        shell_open(path if os.path.isdir(path) else os.path.dirname(path))
    return True


@rpc("shell.openUrl")
def shell_open_url(url):
    """Open an http(s) link from the assistant's answers in the default browser."""
    import webbrowser
    if not isinstance(url, str) or not url.lower().startswith(("http://", "https://")):
        raise UserError("Only http(s) links can be opened.")
    webbrowser.open(url)
    return True


@rpc("shell.exists")
def shell_exists(path):
    return bool(path) and os.path.exists(path)


def emit(name, payload=None):
    bridge.emit(name, payload)


@rpc("app.zoom")
def zoom(factor):
    gui_app.set_zoom(max(0.5, min(3.0, float(factor))))
    return True


@rpc("app.closeGuard")
def close_guard(unsaved):
    """The page reports whether any page has unsaved changes (checked when the window closes)."""
    gui_app.state()["unsaved"] = bool(unsaved)
    return True
