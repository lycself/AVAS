"""Keep another AVAS process from replacing the installation while this one runs."""
import atexit
import hashlib
import os
from pathlib import Path
import sys

from avas.paths import PACKAGE_DIR, USER_DATA_DIR
from avas.update_worker import InstallationLock

_lease = None


def lock_path(root=None):
    root = root or (Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(PACKAGE_DIR).parent)
    identity = os.path.normcase(str(Path(root).resolve()))
    key = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:24]
    return Path(USER_DATA_DIR) / "updates" / f"installation-{key}.lock"


def acquire():
    global _lease
    if _lease is None and os.environ.get("AVAS_UPDATE_PROBE") != "1":
        _lease = InstallationLock(lock_path())
        _lease.__enter__()
        atexit.register(_lease.__exit__)
