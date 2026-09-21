"""Keep another AVAS process from replacing the installation while this one runs."""
import atexit
import hashlib
import os
from pathlib import Path
import sys

from avas.paths import PACKAGE_DIR, USER_DATA_DIR
from avas.update_guard import InstallationBusy, gate_paths, startup_lease, write_state

_lease = None
_restart_token = ""
_restart_lock = None


def lock_path(root=None):
    root = root or (Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(PACKAGE_DIR).parent)
    identity = os.path.normcase(str(Path(root).resolve()))
    key = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:24]
    return Path(USER_DATA_DIR) / "updates" / f"installation-{key}.lock"


def acquire():
    global _lease, _restart_token, _restart_lock
    if _lease is None and os.environ.get("AVAS_UPDATE_PROBE") != "1":
        path = lock_path()
        try:
            _lease, _restart_token = startup_lease(path, os.environ.pop("AVAS_UPDATE_RESTART", ""))
        except InstallationBusy as exc:
            if sys.stderr is not None:
                print(str(exc), file=sys.stderr)
            raise SystemExit(2) from None  # do not hold an executable open with a dialog
        _restart_lock = path
        atexit.register(_lease.__exit__)


def acknowledge_restart():
    """Only the restarted window acknowledges; an import is not a successful restart."""
    global _restart_token
    if _restart_token and _restart_lock:
        write_state(gate_paths(_restart_lock)["restarted"], {"token": _restart_token})
        _restart_token = ""
