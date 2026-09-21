"""Version and build stamp (shown in Help > About and by ``avas info``).

``packaging/build.py`` writes ``avas/_build.json`` (build time, git commit)
before PyInstaller bundles the package, so a stand-alone AVAS.exe knows when
and from what it was built.  Running from source, the stamp is read from git
and the build time of the web front end.
"""
import functools
from datetime import datetime, timezone
import json
import os
import subprocess
import sys

from avas import __version__
from avas.paths import PACKAGE_DIR

STAMP = os.path.join(PACKAGE_DIR, "_build.json")


@functools.lru_cache(maxsize=1)
def build_info():
    info = {"version": __version__, "frozen": bool(getattr(sys, "frozen", False)), "built": None, "commit": None,
            "dirty": None, "location": os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else PACKAGE_DIR}
    if os.path.isfile(STAMP):
        try:
            with open(STAMP, encoding="utf-8") as fh:
                info.update({k: v for k, v in json.load(fh).items() if k in ("built", "commit", "dirty")})
            info["kind"] = "build"
            return info
        except (OSError, ValueError):
            pass
    info["kind"] = "source"
    web = os.path.join(PACKAGE_DIR, "gui", "web", "index.html")
    if os.path.isfile(web):
        info["frontend"] = datetime.fromtimestamp(os.path.getmtime(web), timezone.utc).isoformat(timespec="seconds")
    info.update(git_stamp(os.path.dirname(PACKAGE_DIR)))
    return info


def git_stamp(root):
    """``{"commit", "dirty"}`` of the repository at *root* (empty when git is unavailable)."""
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    try:
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=root, capture_output=True, text=True,
                                timeout=5, creationflags=flags)
        if commit.returncode != 0:
            return {}
        status = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], cwd=root,
                                capture_output=True, text=True, timeout=10, creationflags=flags)
        return {"commit": commit.stdout.strip(), "dirty": bool(status.stdout.strip())}
    except (OSError, subprocess.SubprocessError):
        return {}
