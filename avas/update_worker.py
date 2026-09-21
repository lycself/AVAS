"""Standalone, standard-library-only updater. Copied outside the installation before exit.

The same file is built as AVASUpdate.exe for frozen installations. No application imports:
the installed package and its dependencies may be replaced while this process is alive.
"""
import hashlib
from contextlib import ExitStack, redirect_stderr, redirect_stdout
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
import zipfile


if __package__:
    from .update_guard import InstallationLock, UpdateGate
    from .update_status import StatusWindow
else:  # copied outside the installation / frozen helper entry point
    from update_guard import InstallationLock, UpdateGate
    from update_status import StatusWindow


MANIFEST = ".avas-install.json"
FILE_RETRY_SECONDS = 15
SPACE_RESERVE = 64 * 1024**2


def require_space(path, needed):
    """Keep a small reserve; check the actual volume even for not-yet-created paths."""
    path = Path(path).resolve()
    while not path.exists():
        path = path.parent
    free = shutil.disk_usage(path).free
    if free < needed + SPACE_RESERVE:
        raise ValueError(f"Not enough disk space at {path}: need {needed + SPACE_RESERVE} bytes, available {free} bytes")


def install_space(root, staged, backup, names):
    backup_size = sum((root / name).stat().st_size for name in names if (root / name).is_file())
    sizes = [(staged / name).stat().st_size for name in names if (staged / name).is_file()]
    # Conservative peak: all new changed files plus one atomic replacement copy.
    target_size = sum(sizes) + max(sizes, default=0)
    existing = backup.resolve()
    while not existing.exists():
        existing = existing.parent
    if root.stat().st_dev == existing.stat().st_dev:
        require_space(root, backup_size + target_size)
    else:
        require_space(root, target_size)
        require_space(existing, backup_size)


def open_update_log(path):
    """Create a real log before doing work, with a writable temporary fallback."""
    path = Path(path)
    try:
        return path.open("a", encoding="utf-8", buffering=1), path
    except OSError as exc:
        fd, fallback = tempfile.mkstemp(prefix="avas-update-", suffix=".log")
        log = os.fdopen(fd, "a", encoding="utf-8", buffering=1)
        print(f"Could not open {path}: {exc}", file=log, flush=True)
        return log, Path(fallback)


def flush_log(log):
    log.flush()
    os.fsync(log.fileno())


def retry_file(operation, path):
    """Allow Windows image teardown / scanner handles time to be released."""
    deadline = time.monotonic() + FILE_RETRY_SECONDS
    while True:
        try:
            return operation()
        except OSError as exc:
            if getattr(exc, "winerror", None) not in (5, 32, 33):
                raise
            if time.monotonic() >= deadline:
                raise PermissionError(f"Cannot replace {path}. Close other AVAS windows and check file permissions "
                                      f"or security software, then retry. Windows error: {exc}") from exc
            time.sleep(0.25)


def check_replaceable(path):
    """Probe existing Windows files without truncating them or changing permissions."""
    if os.name != "nt" or not path.exists():
        return
    import ctypes
    from ctypes import wintypes
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p,
                                  wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    kernel.CreateFileW.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]

    def probe():
        # GENERIC_WRITE | DELETE, share read/write/delete, OPEN_EXISTING.
        handle = kernel.CreateFileW(str(path), 0x40010000, 7, None, 3, 0, None)
        if handle == wintypes.HANDLE(-1).value:
            raise ctypes.WinError(ctypes.get_last_error())
        kernel.CloseHandle(handle)

    retry_file(probe, path)


def copy_replace(src, dst):
    """Copy completely before replacing a destination; failed copies leave it intact."""
    fd, name = tempfile.mkstemp(prefix=".avas-update-", dir=dst.parent)
    os.close(fd)
    temp = Path(name)
    try:
        retry_file(lambda: shutil.copy2(src, temp), temp)
        retry_file(lambda: os.replace(temp, dst), dst)
    finally:
        if temp.exists():
            temp.unlink()




def digest(path, check=lambda: None):
    with open(path, "rb") as stream:
        result = hashlib.sha256()
        while True:
            check()
            chunk = stream.read(1024 * 1024)
            if not chunk:
                return result.hexdigest()
            result.update(chunk)


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


def unpack(archive, dest, source_commit=None, check=lambda: None):
    """Extract only regular, bounded paths; verify every payload file before use."""
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as zf:
        expanded_size = sum(entry.file_size for entry in zf.infolist())
        if expanded_size > 8 * 1024**3:
            raise ValueError("Update archive is too large")
        require_space(dest, expanded_size)
        seen = set()
        total = 0
        for entry in zf.infolist():
            check()
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
                    while chunk := src.read(1024 * 1024):
                        check()
                        dst.write(chunk)
    if source_commit:
        marker = json.loads((dest / ".avas-source.json").read_text(encoding="utf-8"))
        if marker.get("commit") != source_commit:
            raise ValueError("Source baseline revision marker is invalid")
        files = {p.relative_to(dest).as_posix(): digest(p, check) for p in dest.rglob("*") if p.is_file() and p.name != MANIFEST}
        (dest / MANIFEST).write_text(json.dumps({"kind": "source", "commit": source_commit, "files": files}), encoding="utf-8")
    data = read_manifest(dest)
    actual = {p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file()}
    if actual != set(data["files"]) | {MANIFEST}:
        raise ValueError("Update archive does not match its manifest")
    for name, expected in data["files"].items():
        if digest(safe_path(dest, name), check) != expected:
            raise ValueError(f"Update checksum failed: {name}")
    return data


def preflight(root, old, new, check=lambda: None):
    """No changed/deleted managed file or new-file collision may be overwritten."""
    for name in old.keys() | new.keys():
        check()
        path = safe_path(root, name)
        for parent in path.parents:
            if parent == Path(root).resolve():
                break
            if parent.exists() and not parent.is_dir():
                raise ValueError(f"Local file blocks an update directory: {name}")
        if name in old:
            if not path.is_file() or digest(path, check) != old[name]:
                raise ValueError(f"Local file changed; update stopped: {name}")
        elif path.exists():
            raise ValueError(f"Local file would be overwritten: {name}")


def replace_files(root, staged, backup, progress=lambda stage, value=None: None):
    progress("checking")
    root, staged, backup = Path(root), Path(staged), Path(backup)
    old = read_manifest(root)["files"]
    new = read_manifest(staged)["files"]
    for name, expected in new.items():
        if digest(safe_path(staged, name)) != expected:
            raise ValueError(f"Staged update checksum failed: {name}")
    preflight(root, old, new)
    # Unchanged executables need no rewrite. Commit the version manifest last.
    names = sorted(name for name in old.keys() | new.keys() if old.get(name) != new.get(name)) + [MANIFEST]
    install_space(root, staged, backup, names)
    progress("checking")
    for name in names:
        check_replaceable(safe_path(root, name))
    backup.mkdir(parents=True, exist_ok=False)
    # Complete backups before the first mutation. A journal survives interruption.
    for index, name in enumerate(names):
        progress("backup", index / len(names))
        src = safe_path(root, name)
        if src.is_file():
            dst = safe_path(backup, name)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    (backup.parent / "journal.json").write_text(json.dumps({"root": str(root), "files": names}), encoding="utf-8")
    changed = []
    try:
        for index, name in enumerate(names):
            progress("installing", index / len(names))
            dst = safe_path(root, name)
            changed.append(name)
            if name in new or name == MANIFEST:
                dst.parent.mkdir(parents=True, exist_ok=True)
                copy_replace(safe_path(staged, name), dst)
            elif dst.exists():
                retry_file(dst.unlink, dst)
    except Exception:
        progress("restoring")
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
                copy_replace(src, dst)
            elif dst.is_file():
                retry_file(dst.unlink, dst)
        except OSError as exc:
            errors.append(f"{name}: {exc}")
    if errors:
        raise OSError("Some files need manual restoration from backup: " + "; ".join(errors))


def command(args, cwd, cancel_check=None, **kwargs):
    if not kwargs.get("capture_output"):
        kwargs.setdefault("stdout", sys.stdout)
        kwargs.setdefault("stderr", sys.stderr)
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    if cancel_check is None:
        return subprocess.run(args, cwd=cwd, check=True, timeout=900, creationflags=flags, **kwargs)
    cancel_check()
    if kwargs.pop("capture_output", False):
        kwargs["stdout"] = kwargs["stderr"] = subprocess.PIPE
    with subprocess.Popen(args, cwd=cwd, creationflags=flags, start_new_session=os.name != "nt", **kwargs) as process:
        deadline = time.monotonic() + 900
        try:
            while True:
                cancel_check()
                if time.monotonic() >= deadline:
                    raise subprocess.TimeoutExpired(args, 900)
                try:
                    stdout, stderr = process.communicate(timeout=0.2)
                    break
                except subprocess.TimeoutExpired:
                    pass
            if process.returncode:
                raise subprocess.CalledProcessError(process.returncode, args, stdout, stderr)
            return subprocess.CompletedProcess(args, process.returncode, stdout, stderr)
        except BaseException:
            if process.poll() is None:
                if os.name == "nt":
                    try:
                        subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                       creationflags=flags, timeout=10)
                    finally:
                        process.kill()
                else:
                    import signal
                    os.killpg(process.pid, signal.SIGKILL)
                process.kill()
            process.communicate()
            raise


def git(root, *args, cancel_check=None):
    return command(["git", *args], root, capture_output=True, text=True, encoding="utf-8", stdin=subprocess.DEVNULL,
                   env=dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never"), cancel_check=cancel_check).stdout.strip()


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


def execute(plan, progress=lambda stage, value=None: None):
    progress("checking")
    root = Path(plan["root"])
    backup = Path(plan["backup"])
    if plan["kind"] == "git":
        git_preflight(root, plan["before"], plan["commit"])
        progress("installing")
        git(root, "merge", "--ff-only", plan["commit"])
    else:
        if plan.get("baseline") and not (root / MANIFEST).exists():
            baseline = json.loads(Path(plan["baseline"]).read_text(encoding="utf-8"))
            preflight(root, baseline["files"], read_manifest(plan["staged"])["files"])
            shutil.copy2(plan["baseline"], root / MANIFEST)
        if plan.get("before") and read_manifest(root).get("commit") != plan["before"]:
            raise ValueError("The installed version changed; check for updates again.")
        replace_files(root, plan["staged"], backup, progress)
    # Dependencies may have changed; the existing venv is intentionally preserved.
    if plan["kind"] != "frozen":
        progress("dependencies")
        command([plan["python"], "-m", "pip", "install", "-e", "."], root)
        command([plan["python"], "-m", "pip", "check"], root)
        progress("checking_startup")
        command([plan["python"], "-c", "import avas.gui.app; import avas.gui.services"], root,
                env=dict(os.environ, AVAS_UPDATE_PROBE="1"))
    else:
        try:
            progress("checking_startup")
            command([str(root / "AVAS.exe"), "info"], root, env=dict(os.environ, AVAS_UPDATE_PROBE="1"))
        except Exception:
            progress("restoring")
            journal = json.loads((backup.parent / "journal.json").read_text(encoding="utf-8"))
            restore(root, backup, journal["files"])
            raise


def save_result(path, outcome):
    temp = path.with_suffix(".tmp")
    with temp.open("w", encoding="utf-8") as stream:
        json.dump(outcome, stream, ensure_ascii=False, indent=2)
        flush_log(stream)
    os.replace(temp, path)


def notify_failure(outcome):
    message = "AVAS update failed / 更新失败\n" + outcome["error"] + "\n" + outcome.get("log", "")
    if os.name == "nt":
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, message, "AVAS", 0x10)
    elif sys.stderr is not None:
        print(message, file=sys.stderr)


def run_logged(plan_path, log, log_path):
    with ExitStack() as session:
        _run_logged(plan_path, log, log_path, session)


def _run_logged(plan_path, log, log_path, session):
    plan = {}
    gate = None
    status = None
    parent_exited = False
    result = plan_path.with_name("result.json")
    try:
        print(f"Reading update plan: {plan_path}", flush=True)
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        if plan.get("guarded"):
            gate = session.enter_context(UpdateGate(plan["lock"]))
        status = session.enter_context(StatusWindow(plan.get("language", "en"),
            gate.paths["attention"] if gate else None, enabled=bool(gate) and not plan.get("silent"),
            presentation=plan.get("presentation"), versions=plan.get("display_versions", {
                "current": plan.get("before", "")[:8], "target": plan.get("commit", "")[:8]})))
        status.set("waiting")
        if plan.get("handshake"):
            flush_log(log)
            save_result(plan_path.with_name("ready.json"), {"pid": os.getpid(), "log": str(log_path)})
        print(f"Waiting for AVAS process {plan['pid']} to exit", flush=True)
        wait_for_exit(plan["pid"])
        parent_exited = True
        print(f"Installing {plan['commit']} into {plan['root']}", flush=True)
        if plan.get("lock"):
            with InstallationLock(plan["lock"], exclusive=True):
                execute(plan, status.set)
        else:
            execute(plan, status.set)
        outcome = {"ok": True, "commit": plan["commit"], "log": str(log_path)}
    except Exception as exc:
        if status:
            status.set("failed")
        traceback.print_exc()
        outcome = {"ok": False, "error": str(exc), "details": traceback.format_exc(),
                   "log": str(log_path), "backup": plan.get("backup", "")}
    flush_log(log)  # visible on disk before the restarted GUI reads the result
    saved = False
    try:
        save_result(result, outcome)
        saved = True
    except OSError as exc:
        outcome = {**outcome, "ok": False, "error": outcome.get("error", "") + f"\nCannot save {result}: {exc}"}
        print(outcome["error"], flush=True)

    restarted = False
    if parent_exited and plan.get("restart") and plan.get("root"):
        try:
            if status:
                status.set("restarting")
            process = subprocess.Popen(plan["restart"], cwd=plan["root"],
                                       env=gate.restart_env() if gate else None,
                                       creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            if gate:
                gate.wait_restarted(process)
            restarted = True
        except OSError as exc:
            traceback.print_exc()
            outcome = {**outcome, "ok": False, "error": outcome.get("error", "") + f"\nCould not restart AVAS: {exc}"}
            try:
                save_result(result, outcome)
            except OSError:
                traceback.print_exc()
    flush_log(log)
    # A restarted GUI reports persisted failures. Native fallback is for cases where
    # that reporting channel is unavailable, avoiding two identical error dialogs.
    if not outcome["ok"] and not (saved and restarted) and not plan.get("silent"):
        notify_failure(outcome)


def main():
    try:
        plan_path = Path(sys.argv[1]).resolve()
        log, log_path = open_update_log(plan_path.with_name("update.log"))
        with log, redirect_stdout(log), redirect_stderr(log):
            run_logged(plan_path, log, log_path)
    except Exception as exc:
        # Even missing/invalid plans and failures creating either log get a direct
        # diagnostic; never direct the user to a file we failed to create.
        notify_failure({"ok": False, "error": f"{exc}\n{traceback.format_exc()}"})


if __name__ == "__main__":
    main()
