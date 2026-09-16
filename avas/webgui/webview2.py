"""Microsoft Edge WebView2 runtime: detection and installation.

The GUI is rendered by WebView2 (part of Windows 11, installed on most
Windows 10 machines through Edge updates).  When it is missing we offer to run
Microsoft's Evergreen bootstrapper ``MicrosoftEdgeWebview2Setup.exe``, which is
shipped next to the application (see ``packaging/fetch_webview2.py``), and
fall back to opening Microsoft's download page when the bootstrapper is not
there.
"""
import ctypes
import os
import platform
import subprocess
import sys
import webbrowser

RUNTIME_GUID = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
BOOTSTRAPPER = "MicrosoftEdgeWebview2Setup.exe"
DOWNLOAD_PAGE = "https://developer.microsoft.com/microsoft-edge/webview2/#download"

_MB_YESNO = 0x04
_MB_OK = 0x00
_MB_ICONWARNING = 0x30
_MB_ICONERROR = 0x10
_IDYES = 6


def installed_version():
    """Version string of the installed runtime, or ``None``."""
    if sys.platform != "win32":
        return "n/a"
    import winreg

    candidates = [
        (winreg.HKEY_LOCAL_MACHINE, rf"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{RUNTIME_GUID}"),
        (winreg.HKEY_LOCAL_MACHINE, rf"SOFTWARE\Microsoft\EdgeUpdate\Clients\{RUNTIME_GUID}"),
        (winreg.HKEY_CURRENT_USER, rf"SOFTWARE\Microsoft\EdgeUpdate\Clients\{RUNTIME_GUID}"),
    ]
    for hive, path in candidates:
        try:
            with winreg.OpenKey(hive, path) as key:
                version, _ = winreg.QueryValueEx(key, "pv")
        except OSError:
            continue
        if version and version != "0.0.0.0":
            return str(version)
    return None


def bootstrapper_path():
    """The bundled bootstrapper, if any."""
    roots = []
    if getattr(sys, "frozen", False):
        roots.append(os.path.dirname(sys.executable))
        roots.append(getattr(sys, "_MEIPASS", ""))
    here = os.path.dirname(os.path.abspath(__file__))
    roots.append(os.path.join(here, "redist"))
    roots.append(os.path.join(os.path.dirname(os.path.dirname(here)), "packaging", "redist"))
    for root in roots:
        path = os.path.join(root, BOOTSTRAPPER)
        if root and os.path.isfile(path):
            return path
    return None


def _message_box(text, title, flags):
    try:
        return ctypes.windll.user32.MessageBoxW(None, text, title, flags)
    except Exception:  # noqa: BLE001 - no GUI available
        print(f"{title}: {text}", file=sys.stderr)
        return 0


def ensure_runtime(language="en"):
    """Return True when WebView2 is usable, offering installation otherwise."""
    if sys.platform != "win32" or installed_version():
        return True
    zh = str(language).lower().startswith("zh")
    setup = bootstrapper_path()
    if setup:
        text = ("AVAS 的界面需要 Microsoft Edge WebView2 运行库，本机尚未安装。\n\n"
                "现在安装吗？（需要联网，约 1–2 分钟）") if zh else (
                "The AVAS interface needs the Microsoft Edge WebView2 Runtime, which is not installed.\n\n"
                "Install it now? (needs an internet connection, about 1-2 minutes)")
        if _message_box(text, "AVAS", _MB_YESNO | _MB_ICONWARNING) != _IDYES:
            return False
        try:
            subprocess.run([setup, "/install"], check=False)
        except OSError as exc:
            _message_box(str(exc), "AVAS", _MB_OK | _MB_ICONERROR)
            return False
        if installed_version():
            return True
        text = "WebView2 安装没有完成，请稍后重试。" if zh else "The WebView2 installation did not complete. Please try again."
        _message_box(text, "AVAS", _MB_OK | _MB_ICONERROR)
        return False
    text = ("AVAS 的界面需要 Microsoft Edge WebView2 运行库，本机尚未安装。\n\n"
            "点击“确定”打开微软下载页面，安装后重新启动 AVAS。") if zh else (
            "The AVAS interface needs the Microsoft Edge WebView2 Runtime, which is not installed.\n\n"
            "Press OK to open Microsoft's download page, then start AVAS again.")
    _message_box(text, "AVAS", _MB_OK | _MB_ICONWARNING)
    webbrowser.open(DOWNLOAD_PAGE)
    return False


def describe():
    return {"webview2": installed_version(), "machine": platform.machine()}
