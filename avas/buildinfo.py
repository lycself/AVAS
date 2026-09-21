"""Version and build stamp (shown in Help > About and by ``avas info``).

``packaging/build.py`` writes ``avas/_build.json`` (build time, git commit)
before PyInstaller bundles the package, so a stand-alone AVAS.exe knows when
and from what it was built.  Running from source, the stamp is read from git
and the build time of the web front end.
"""
import functools
import json
import os
from pathlib import Path
import re
import subprocess
import sys

from avas import __version__
from avas.paths import PACKAGE_DIR

STAMP = os.path.join(PACKAGE_DIR, "_build.json")


def _read_json(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def archive_stamp(root):
    """Release identity shared by the updater and version display (no Git needed)."""
    from avas.update_worker import MANIFEST, read_manifest
    root = Path(root)
    source = _read_json(root / ".avas-source.json")
    data = read_manifest(root) if (root / MANIFEST).is_file() else source
    commit = data.get("commit")
    if not isinstance(commit, str) or not re.fullmatch(r"[0-9a-f]{40}", commit):
        return {}
    committed = data.get("committed")
    if not committed and source.get("commit") == commit:
        committed = source.get("committed")
    return {"commit": commit, "committed": committed}


@functools.lru_cache(maxsize=1)
def build_info():
    info = {"version": __version__, "frozen": bool(getattr(sys, "frozen", False)), "built": None, "commit": None,
            "dirty": None, "location": os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else PACKAGE_DIR}
    info["kind"] = "build" if info["frozen"] else "source"
    info["frontend"] = _read_json(Path(PACKAGE_DIR) / "gui/web/source-hash.json").get("built")
    root = Path(sys.executable).parent if info["frozen"] else Path(PACKAGE_DIR).parent
    if info["frozen"]:
        info.update({k: v for k, v in _read_json(STAMP).items() if k in ("built", "commit", "committed", "dirty")})
    try:
        revision = git_stamp(root) if not info["frozen"] and (root / ".git").exists() else archive_stamp(root)
    except (OSError, ValueError, KeyError, TypeError):
        revision = {}
    # An old bundle may only contain a short SHA; the release manifest supplies the full one.
    if revision.get("commit"):
        if revision["commit"] != info.get("commit") and not revision["commit"].startswith(info.get("commit") or "?"):
            info["committed"] = None
        info.update({k: v for k, v in revision.items() if v is not None})
    return info


def git_stamp(root):
    """``{"commit", "dirty"}`` of the repository at *root* (empty when git is unavailable)."""
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    try:
        commit = subprocess.run(["git", "show", "-s", "--format=%H%n%cI", "HEAD"], cwd=root, capture_output=True, text=True,
                                timeout=5, creationflags=flags)
        if commit.returncode != 0:
            return {}
        status = subprocess.run(["git", "status", "--porcelain", "--untracked-files=no"], cwd=root,
                                capture_output=True, text=True, timeout=10, creationflags=flags)
        sha, committed = commit.stdout.strip().splitlines()
        return {"commit": sha, "committed": committed, "dirty": bool(status.stdout.strip()) if status.returncode == 0 else None}
    except (OSError, subprocess.SubprocessError):
        return {}
