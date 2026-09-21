"""Standard-library update/startup coordination, also copied beside the updater."""
import json
import os
from pathlib import Path
import time
import uuid


class InstallationBusy(OSError):
    pass


class InstallationLock:
    """Shared lifetime leases for AVAS processes; exclusive lease for replacement."""
    def __init__(self, path, exclusive=False):
        self.path = Path(path)
        self.exclusive = exclusive
        self.file = None

    def __enter__(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.file = self.path.open("a+b")
        try:
            if os.name == "nt":
                import ctypes
                import msvcrt
                from ctypes import wintypes

                class OVERLAPPED(ctypes.Structure):
                    _fields_ = [("Internal", ctypes.c_size_t), ("InternalHigh", ctypes.c_size_t),
                                ("Offset", wintypes.DWORD), ("OffsetHigh", wintypes.DWORD), ("hEvent", wintypes.HANDLE)]

                self.overlapped = OVERLAPPED()
                kernel = ctypes.WinDLL("kernel32", use_last_error=True)
                kernel.LockFileEx.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.DWORD,
                                             wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(OVERLAPPED)]
                flags = 1 | (2 if self.exclusive else 0)  # fail immediately; exclusive or shared
                if not kernel.LockFileEx(msvcrt.get_osfhandle(self.file.fileno()), flags, 0, 1, 0,
                                         ctypes.byref(self.overlapped)):
                    raise InstallationBusy("Close other AVAS processes using this installation before updating.")
            else:
                import fcntl
                try:
                    fcntl.flock(self.file, (fcntl.LOCK_EX if self.exclusive else fcntl.LOCK_SH) | fcntl.LOCK_NB)
                except BlockingIOError as exc:
                    raise InstallationBusy("Close other AVAS processes using this installation before updating.") from exc
        except Exception:
            self.file.close()
            raise
        return self

    def __exit__(self, *args):
        self.file.close()  # OS releases the lease, including on abnormal process termination


def gate_paths(lock):
    base = Path(lock)
    return {key: base.with_suffix(suffix) for key, suffix in (
        ("lock", ".updating.lock"), ("state", ".updating.json"),
        ("attention", ".attention"), ("restarted", ".restarted.json"))}


def write_state(path, data):
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as stream:
        json.dump(data, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)


def read_state(path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def startup_lease(lock, restart_token=""):
    """Check the update gate and acquire a lifetime lease as one guarded operation."""
    paths = gate_paths(lock)
    gate = InstallationLock(paths["lock"])
    try:
        gate.__enter__()
    except InstallationBusy:
        state = read_state(paths["state"])
        if restart_token and state.get("phase") == "restarting" and state.get("token") == restart_token:
            lease = InstallationLock(lock)
            lease.__enter__()
            return lease, restart_token
        try:
            paths["attention"].touch()
        except OSError:
            pass
        raise InstallationBusy("AVAS is being updated and will restart automatically. Please wait.\n"
                               "AVAS 正在更新，完成后会自动重启，请稍候。") from None
    try:
        lease = InstallationLock(lock)
        lease.__enter__()
        return lease, ""
    finally:
        gate.__exit__()


class UpdateGate:
    """Blocks new launches before parent exit through the automatic GUI restart."""
    def __init__(self, lock):
        self.paths = gate_paths(lock)
        self.lease = InstallationLock(self.paths["lock"], exclusive=True)
        self.token = uuid.uuid4().hex

    def __enter__(self):
        self.lease.__enter__()
        try:
            write_state(self.paths["state"], {"phase": "installing", "token": self.token})
            for key in ("attention", "restarted"):
                self.paths[key].unlink(missing_ok=True)
        except Exception:
            self.lease.__exit__()
            raise
        return self

    def restart_env(self):
        write_state(self.paths["state"], {"phase": "restarting", "token": self.token})
        return dict(os.environ, AVAS_UPDATE_RESTART=self.token)

    def wait_restarted(self, process, timeout=60):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if read_state(self.paths["restarted"]).get("token") == self.token:
                return
            if process.poll() is not None:
                raise OSError("AVAS exited before its window opened.")
            time.sleep(0.1)
        raise TimeoutError("AVAS did not confirm that its window opened. Check the update log.")

    def __exit__(self, *args):
        try:
            for key in ("state", "attention", "restarted"):
                try:
                    self.paths[key].unlink(missing_ok=True)
                except OSError:
                    pass  # stale metadata never blocks startup without a live OS lock
        finally:
            self.lease.__exit__()
