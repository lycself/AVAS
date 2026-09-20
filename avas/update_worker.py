"""Standalone, standard-library-only updater. Copied outside the installation before exit.

The same file is built as AVASUpdate.exe for frozen installations. No application imports:
the installed package and its dependencies may be replaced while this process is alive.
"""
import hashlib
from contextlib import redirect_stderr, redirect_stdout
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import time
import zipfile


MANIFEST = ".avas-install.json"


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
                    raise OSError("Close other AVAS processes using this installation before updating.")
            else:
                import fcntl
                fcntl.flock(self.file, (fcntl.LOCK_EX if self.exclusive else fcntl.LOCK_SH) | fcntl.LOCK_NB)
        except Exception:
            self.file.close()
            raise
        return self

    def __exit__(self, *args):
        self.file.close()  # OS releases the lease, including on abnormal process termination


def digest(path):
    with open(path, "rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def safe_path(root, name):
    parts = PurePosixPath(name).parts
    if (not parts or "\\" in name or ":" in name or name.startswith("/")
            or any(p in (".", "..") or p.endswith((".", " ")) for p in parts)
            or any(p.lower() in (".git", ".venv") for p in parts)):
        raise ValueError(f"Unsafe update path: {name}")
    root = Path(root).resolve()
    target = root.joinpath(*parts)
    if not target.resolve().is_relative_to(root) or target.is_symlink():
        raise ValueError(f"Unsafe update path: {name}")
    return target


def read_manifest(root):
    data = json.loads((Path(root) / MANIFEST).read_text(encoding="utf-8"))
    files = data["files"]
    folded = set()
    for name, value in files.items():
        safe_path(root, name)
        if name.casefold() in folded or len(value) != 64 or any(c not in "0123456789abcdef" for c in value):
            raise ValueError("Invalid update file manifest")
        folded.add(name.casefold())
    return data


def unpack(archive, dest, source_commit=None):
    """Extract only regular, bounded paths; verify every payload file before use."""
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as zf:
        seen = set()
        total = 0
        for entry in zf.infolist():
            name = entry.filename
            if source_commit:
                prefix = f"AVAS-{source_commit}/"
                if not name.startswith(prefix):
                    raise ValueError("Source baseline does not match the requested revision")
                name = name[len(prefix):]
                if not name:
                    continue
            target = safe_path(dest, name)
            if name.casefold() in seen or (entry.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Duplicate or symbolic link in update archive")
            seen.add(name.casefold())
            total += entry.file_size
            if total > 8 * 1024**3:
                raise ValueError("Update archive is too large")
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(entry) as src, target.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
    if source_commit:
        marker = json.loads((dest / ".avas-source.json").read_text(encoding="utf-8"))
        if marker.get("commit") != source_commit:
            raise ValueError("Source baseline revision marker is invalid")
        files = {p.relative_to(dest).as_posix(): digest(p) for p in dest.rglob("*") if p.is_file() and p.name != MANIFEST}
        (dest / MANIFEST).write_text(json.dumps({"kind": "source", "commit": source_commit, "files": files}), encoding="utf-8")
    data = read_manifest(dest)
    actual = {p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file()}
    if actual != set(data["files"]) | {MANIFEST}:
        raise ValueError("Update archive does not match its manifest")
    for name, expected in data["files"].items():
        if digest(safe_path(dest, name)) != expected:
            raise ValueError(f"Update checksum failed: {name}")
    return data


def preflight(root, old, new):
    """No changed/deleted managed file or new-file collision may be overwritten."""
    for name in old.keys() | new.keys():
        path = safe_path(root, name)
        for parent in path.parents:
            if parent == Path(root).resolve():
                break
            if parent.exists() and not parent.is_dir():
                raise ValueError(f"Local file blocks an update directory: {name}")
        if name in old:
            if not path.is_file() or digest(path) != old[name]:
                raise ValueError(f"Local file changed; update stopped: {name}")
        elif path.exists():
            raise ValueError(f"Local file would be overwritten: {name}")


def replace_files(root, staged, backup):
    root, staged, backup = Path(root), Path(staged), Path(backup)
    old = read_manifest(root)["files"]
    new = read_manifest(staged)["files"]
    for name, expected in new.items():
        if digest(safe_path(staged, name)) != expected:
            raise ValueError(f"Staged update checksum failed: {name}")
    preflight(root, old, new)
    names = sorted(old.keys() | new.keys() | {MANIFEST})
    backup.mkdir(parents=True, exist_ok=False)
    # Complete backups before the first mutation. A journal survives interruption.
    for name in names:
        src = safe_path(root, name)
        if src.is_file():
            dst = safe_path(backup, name)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    (backup.parent / "journal.json").write_text(json.dumps({"root": str(root), "files": names}), encoding="utf-8")
    changed = []
    try:
        for name in names:
            dst = safe_path(root, name)
            changed.append(name)
            if name in new or name == MANIFEST:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(safe_path(staged, name), dst)
            elif dst.exists():
                dst.unlink()
    except Exception:
        restore(root, backup, changed)
        raise


def restore(root, backup, names):
    errors = []
    for name in reversed(names):
        try:
            dst, src = safe_path(root, name), safe_path(backup, name)
            if src.is_file():
                if dst.is_file() and digest(src) == digest(dst):
                    continue  # a locked file that never changed needs no rewrite
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
            elif dst.is_file():
                dst.unlink()
        except OSError as exc:
            errors.append(f"{name}: {exc}")
    if errors:
        raise OSError("Some files need manual restoration from backup: " + "; ".join(errors))


def command(args, cwd, **kwargs):
    if not kwargs.get("capture_output"):
        kwargs.setdefault("stdout", sys.stdout)
        kwargs.setdefault("stderr", sys.stderr)
    return subprocess.run(args, cwd=cwd, check=True, timeout=900,
                          creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0, **kwargs)


def git(root, *args):
    return command(["git", *args], root, capture_output=True, text=True, encoding="utf-8", stdin=subprocess.DEVNULL,
                   env=dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")).stdout.strip()


def git_preflight(root, before, target):
    if git(root, "rev-parse", "HEAD") != before or git(root, "symbolic-ref", "--short", "HEAD") != "main":
        raise ValueError("The Git branch changed; check for updates again.")
    if git(root, "status", "--porcelain", "--untracked-files=all"):
        raise ValueError("The Git working tree has local changes; update stopped.")
    git(root, "merge-base", "--is-ancestor", before, target)
    # Include ignored files: git may otherwise overwrite these during checkout.
    for name in git(root, "diff", "--name-only", "-z", "--diff-filter=A", before, target).split("\0"):
        if name and safe_path(root, name).exists():
            raise ValueError(f"Local file would be overwritten: {name}")


def wait_for_exit(pid, timeout=120):
    if os.name == "nt":
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x00100000, False, pid)
        if not handle:
            if ctypes.get_last_error() == 87:  # already gone
                return
            raise OSError("Cannot wait for AVAS to exit")
        try:
            if kernel.WaitForSingleObject(handle, timeout * 1000) != 0:
                raise TimeoutError("AVAS did not exit; no files were changed")
        finally:
            kernel.CloseHandle(handle)
    else:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                return
            time.sleep(0.2)
        raise TimeoutError("AVAS did not exit; no files were changed")


def execute(plan):
    root = Path(plan["root"])
    backup = Path(plan["backup"])
    if plan["kind"] == "git":
        git_preflight(root, plan["before"], plan["commit"])
        git(root, "merge", "--ff-only", plan["commit"])
    else:
        if plan.get("baseline") and not (root / MANIFEST).exists():
            baseline = json.loads(Path(plan["baseline"]).read_text(encoding="utf-8"))
            preflight(root, baseline["files"], read_manifest(plan["staged"])["files"])
            shutil.copy2(plan["baseline"], root / MANIFEST)
        if plan.get("before") and read_manifest(root).get("commit") != plan["before"]:
            raise ValueError("The installed version changed; check for updates again.")
        replace_files(root, plan["staged"], backup)
    # Dependencies may have changed; the existing venv is intentionally preserved.
    if plan["kind"] != "frozen":
        command([plan["python"], "-m", "pip", "install", "-e", "."], root)
        command([plan["python"], "-m", "pip", "check"], root)
        command([plan["python"], "-c", "import avas.gui.app; import avas.gui.services"], root)
    else:
        try:
            command([str(root / "AVAS.exe"), "info"], root, env=dict(os.environ, AVAS_UPDATE_PROBE="1"))
        except Exception:
            journal = json.loads((backup.parent / "journal.json").read_text(encoding="utf-8"))
            restore(root, backup, journal["files"])
            raise


def main():
    plan_path = Path(sys.argv[1]).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    result = plan_path.with_name("result.json")
    with plan_path.with_name("update.log").open("a", encoding="utf-8") as log, redirect_stdout(log), redirect_stderr(log):
        try:
            wait_for_exit(plan["pid"])
            # Child command logs are directed to this file explicitly by command().
            if plan.get("lock"):
                with InstallationLock(plan["lock"], exclusive=True):
                    execute(plan)
            else:
                execute(plan)
            outcome = {"ok": True, "commit": plan["commit"]}
        except Exception as exc:
            import traceback
            traceback.print_exc()
            outcome = {"ok": False, "error": str(exc), "log": str(plan_path.with_name("update.log")),
                       "backup": plan["backup"]}
        result.write_text(json.dumps(outcome, ensure_ascii=False, indent=2), encoding="utf-8")
        try:
            subprocess.Popen(plan["restart"], cwd=plan["root"],
                             creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
        except OSError:
            import traceback
            traceback.print_exc()
            outcome = {"ok": False, "error": "Could not restart AVAS. See the update log.",
                       "log": str(plan_path.with_name("update.log")), "backup": plan["backup"]}
            result.write_text(json.dumps(outcome, ensure_ascii=False, indent=2), encoding="utf-8")
        if not outcome["ok"] and os.name == "nt" and not plan.get("silent"):
            import ctypes
            ctypes.windll.user32.MessageBoxW(None, "AVAS update failed / 更新失败\n" + outcome["error"]
                                            + "\n" + outcome["log"], "AVAS", 0x10)


if __name__ == "__main__":
    main()
