"""File-system browsing for the page's own file dialog.

In the desktop window the page uses the native dialogs (``dialog.*`` in
:mod:`system`); in a browser there are none, so the page shows its own
folder / file chooser fed by these calls.  Paths are the server's local
paths.  (A shared multi-user server will confine them to a workspace;
for now the GUI runs on the user's own machine.)
"""
import os
import string
import sys

from avas.gui.bridge import UserError, rpc


def _roots():
    if sys.platform == "win32":
        drives = []
        for letter in string.ascii_uppercase:
            drive = f"{letter}:\\"
            if os.path.exists(drive):
                drives.append(drive)
        return drives
    return ["/"]


def _is_hidden(name, path):
    if name.startswith("."):
        return True
    if sys.platform == "win32":
        try:
            import ctypes
            attrs = ctypes.windll.kernel32.GetFileAttributesW(path)
            return attrs != -1 and bool(attrs & 0x2)
        except Exception:  # noqa: BLE001
            return False
    return False


@rpc("fs.home")
def home():
    return os.path.expanduser("~")


@rpc("fs.stat")
def stat(path):
    path = path or ""
    exists = bool(path) and os.path.exists(path)
    return {"path": path, "exists": exists, "isDir": exists and os.path.isdir(path)}


@rpc("fs.list")
def list_dir(path="", showHidden=False):
    """Entries of a folder, folders first; ``path=""`` gives the home folder."""
    path = os.path.abspath(os.path.expanduser(path or "~"))
    if not os.path.isdir(path):
        raise UserError(f"Not a folder: {path}")
    entries = []
    try:
        names = os.listdir(path)
    except PermissionError as exc:
        raise UserError(f"Cannot read folder: {path}") from exc
    for name in names:
        full = os.path.join(path, name)
        try:
            st = os.stat(full)
        except OSError:
            continue
        is_dir = os.path.isdir(full)
        if not showHidden and _is_hidden(name, full):
            continue
        entries.append({"name": name, "path": full, "isDir": is_dir, "size": 0 if is_dir else st.st_size,
                        "mtime": st.st_mtime})
    entries.sort(key=lambda e: (not e["isDir"], e["name"].lower()))
    parent = os.path.dirname(path)
    return {"dir": path, "parent": parent if parent != path else None, "roots": _roots(), "entries": entries,
            "sep": os.sep}
