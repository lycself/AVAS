"""Official update discovery and staging; installation lives in update_worker."""
import json
import http.client
import hashlib
from contextvars import ContextVar
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import time
import traceback
import urllib.request
import urllib.error

from avas import __version__
from avas.paths import PACKAGE_DIR, USER_DATA_DIR
from avas import update_worker as worker

REPOSITORY = "lycself/AVAS"
BASE = f"https://github.com/{REPOSITORY}/releases/download"
LATEST = BASE + "/avas-latest/update.json"
SHA = re.compile(r"[0-9a-f]{40}\Z")
DOWNLOAD_ATTEMPTS = 4
_cancel_event = ContextVar("update_cancel_event", default=None)


class UpdateCancelled(Exception):
    pass


class DownloadChecksumError(ValueError):
    pass


def check_cancelled():
    event = _cancel_event.get()
    if event is not None and event.is_set():
        raise UpdateCancelled()


def cached_download(item, work, progress):
    # URL includes the revision and asset kind; checksum isolates republished assets.
    identity = hashlib.sha256((item["url"] + item["sha256"]).encode()).hexdigest()
    cache = work.parent / "downloads"
    cache.mkdir(exist_ok=True)
    path = cache / f"{identity}.zip"
    with worker.InstallationLock(cache / f"{identity}.lock", exclusive=True):
        check_cancelled()
        download(item, path, progress=progress, resume=True)
    return path


class IncompleteDownload(ValueError):
    pass


def root_path():
    return Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(PACKAGE_DIR).parent


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "AVAS-Updater", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=20) as response:
        raw = response.read(1024 * 1024 + 1)
    if len(raw) > 1024 * 1024:
        raise ValueError("Update metadata is too large")
    return json.loads(raw)


def validate_release(data):
    if data.get("schema") != 1 or data.get("repository") != REPOSITORY or not SHA.fullmatch(data.get("commit", "")):
        raise ValueError("Invalid official update metadata")
    for key in ("version", "notes", "published", "requires_python"):
        if not isinstance(data.get(key), str):
            raise ValueError("Invalid official update metadata")
    for kind in ("source", "windows"):
        item = data["assets"][kind]
        expected = f"{BASE}/avas-{data['commit']}/avas-{kind}.zip"
        if item["url"] != expected or not re.fullmatch(r"[0-9a-f]{64}", item["sha256"]):
            raise ValueError("Invalid official update asset")
    return data


def installation(root=None):
    root = Path(root or root_path()).resolve()
    kind = "frozen" if getattr(sys, "frozen", False) else "source"
    commit = ""
    if kind != "frozen" and (root / ".git").exists():
        kind = "git"
        if Path(worker.git(root, "rev-parse", "--show-toplevel")).resolve() != root:
            raise ValueError("Cannot identify the AVAS repository root")
        commit = worker.git(root, "rev-parse", "HEAD")
    else:
        from avas.buildinfo import archive_stamp
        commit = archive_stamp(root).get("commit", "")
    return {"kind": kind, "commit": commit if SHA.fullmatch(commit) else "", "version": __version__, "root": str(root)}


def check():
    release = validate_release(fetch_json(LATEST))
    current = installation()
    available = current["commit"] != release["commit"]
    if current["kind"] == "git" and available:
        # A developer ahead of the last published build should not be downgraded.
        try:
            worker.git(current["root"], "merge-base", "--is-ancestor", release["commit"], current["commit"])
            available = False
        except Exception:
            pass  # the remote commit may not have been fetched yet
    elif available and current["commit"]:
        # GitHub includes file patches only on page 1. We need the global
        # ancestry status, not potentially huge diffs of compiled web assets.
        comparison = fetch_json(f"https://api.github.com/repos/{REPOSITORY}/compare/"
                                f"{current['commit']}...{release['commit']}?per_page=1&page=2")
        if comparison.get("status") not in ("ahead", "behind", "identical"):
            raise ValueError("This installation does not share the official update history.")
        available = comparison["status"] == "ahead"
    return {"current": current, "release": release, "available": available}


def download(item, dest, require_checksum=True, progress=lambda data: None, resume=False):
    """Retry transient failures, resuming only validated byte ranges of verified assets."""
    force_full = False
    check_cancelled()
    if resume and require_checksum and Path(dest).is_file():
        progress({"message": "Verifying the update checksum...", "stage": "verify"})
        if worker.digest(dest, check_cancelled) == item["sha256"]:
            return
    for attempt in range(DOWNLOAD_ATTEMPTS):
        check_cancelled()
        try:
            return _download(item, dest, require_checksum, progress, resume=(resume or attempt > 0) and not force_full)
        except (urllib.error.URLError, TimeoutError, ConnectionError,
                http.client.HTTPException, IncompleteDownload, DownloadChecksumError) as exc:
            check_cancelled()
            force_full = isinstance(exc, DownloadChecksumError) or isinstance(exc, urllib.error.HTTPError) and exc.code == 416
            if isinstance(exc, urllib.error.HTTPError) and exc.code not in (408, 416, 429, 500, 502, 503, 504):
                raise
            if attempt == DOWNLOAD_ATTEMPTS - 1:
                raise
            progress({"message": "Download interrupted; retrying automatically...", "stage": "retry"})
            event = _cancel_event.get()
            if event is None:
                time.sleep(2 ** attempt)
            elif event.wait(2 ** attempt):
                check_cancelled()


def _download(item, dest, require_checksum, progress, resume=False):
    dest = Path(dest)
    offset = dest.stat().st_size if resume and require_checksum and dest.exists() else 0
    req = urllib.request.Request(item["url"], headers={"User-Agent": "AVAS-Updater"})
    if offset:
        req.add_header("Range", f"bytes={offset}-")
    total = offset
    started = last_report = time.monotonic()
    with urllib.request.urlopen(req, timeout=60) as response:
        headers = getattr(response, "headers", {})
        try:
            length = int(headers.get("Content-Length", 0)) or None
        except (TypeError, ValueError):
            length = None
        if length is not None and length < 0:
            length = None
        if getattr(response, "status", 200) == 206:
            match = re.fullmatch(r"bytes (\d+)-(\d+)/(\d+)", headers.get("Content-Range", ""))
            if not match:
                raise ValueError("Invalid update download byte range")
            start, end, full = map(int, match.groups())
            if start != offset or end != full - 1 or start > end or (length is not None and length != end - start + 1):
                raise ValueError("Invalid update download byte range")
            length = full
        else:
            # Some servers ignore Range: safely restart instead of appending a full ZIP.
            offset = total = 0
        if length is not None and length > 4 * 1024**3:
            raise ValueError("Update download is too large")
        worker.require_space(dest.parent, (length - offset) if length is not None else 64 * 1024)

        def report():
            progress({"message": "Downloading the update...", "stage": "download", "downloaded": total,
                      "total": length, "speed": (total - offset) / max(time.monotonic() - started, 0.001)})

        report()
        with open(dest, "ab" if offset else "wb") as stream:
            while True:
                check_cancelled()
                chunk = response.read(64 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > 4 * 1024**3:
                    raise ValueError("Update download is too large")
                if length is None:
                    worker.require_space(dest.parent, len(chunk))
                stream.write(chunk)
                if time.monotonic() - last_report >= 0.25:
                    report()
                    last_report = time.monotonic()
        report()
    if length is not None and total != length:
        raise IncompleteDownload("The update download is incomplete. Please try again.")
    progress({"message": "Verifying the update checksum...", "stage": "verify"})
    check_cancelled()
    if require_checksum and worker.digest(dest, check_cancelled) != item["sha256"]:
        raise DownloadChecksumError("Update download checksum failed")


def stage(release, current, progress=lambda data: None, cancel_event=None):
    token = _cancel_event.set(cancel_event)
    try:
        return _stage_logged(release, current, progress)
    finally:
        _cancel_event.reset(token)


def _stage_logged(release, current, progress):
    cache = Path(USER_DATA_DIR) / "updates"
    cache.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="update-", dir=cache))
    log, log_path = worker.open_update_log(work / "update.log")
    with log:
        previous = None

        def report(data):
            check_cancelled()
            nonlocal previous
            if data["message"] != previous:
                print(data["message"], file=log, flush=True)
                previous = data["message"]
            progress({**data, "log": str(log_path)})

        try:
            report({"message": "Preparing the confirmed update...", "stage": "prepare"})
            result = _stage(release, current, work, report)
            result["log"] = str(log_path)
            return result
        except UpdateCancelled:
            print("Update cancelled; verified-asset download cache retained.", file=log, flush=True)
            raise
        except Exception as exc:
            traceback.print_exc(file=log)
            worker.flush_log(log)
            raise RuntimeError(f"{exc}\n{log_path}") from exc


def _stage(release, current, work, progress):
    """Freeze the confirmed release. Never reread the latest pointer here."""
    validate_release(release)
    root = Path(current["root"])
    if not current["commit"]:
        raise ValueError("This installation has no update baseline. Download a new official package first.")
    kind = current["kind"]
    python = root / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if kind != "frozen":
        if not python.is_file() or Path(sys.prefix).resolve() != (root / ".venv").resolve():
            raise ValueError("Start AVAS with this installation's .venv before updating.")
        from packaging.specifiers import SpecifierSet
        from platform import python_version
        if python_version() not in SpecifierSet(release["requires_python"]):
            raise ValueError("The update requires a different Python version; update Python manually first.")
    if kind == "git":
        progress({"message": "Fetching the confirmed Git revision...", "stage": "fetch"})
        if worker.git(root, "remote", "get-url", "origin").removesuffix(".git").rstrip("/") not in (
                f"https://github.com/{REPOSITORY}", f"git@github.com:{REPOSITORY}"):
            raise ValueError("The Git origin is not the official AVAS repository.")
        worker.git(root, "fetch", "--no-tags", f"https://github.com/{REPOSITORY}.git", release["commit"], cancel_check=check_cancelled)
        worker.git_preflight(root, current["commit"], release["commit"])
    else:
        asset = release["assets"]["windows" if kind == "frozen" else "source"]
        if kind == "frozen" and sys.platform != "win32":
            raise ValueError("Automatic packaged updates currently support Windows only.")
        archive = cached_download(asset, work, progress)
        progress({"message": "Extracting and verifying update files...", "stage": "extract"})
        new = worker.unpack(archive, work / "staged", check=check_cancelled)
        if new["commit"] != release["commit"] or new["kind"] != kind:
            raise ValueError("The update package does not match the confirmed version")
        if not (root / worker.MANIFEST).is_file():
            # GitHub archives and release assets can have different line endings
            # and generated files, even at the same commit. Match the archive's
            # provenance instead of comparing it with the release asset manifest.
            download({"url": f"https://github.com/{REPOSITORY}/archive/{current['commit']}.zip"},
                     work / "baseline.zip", require_checksum=False, progress=progress)
            progress({"message": "Checking the installed files...", "stage": "preflight"})
            old = worker.unpack(work / "baseline.zip", work / "baseline", source_commit=current["commit"], check=check_cancelled)
            worker.preflight(root, old["files"], new["files"], check_cancelled)
        else:
            progress({"message": "Checking the installed files...", "stage": "preflight"})
            old = worker.read_manifest(root)
            worker.preflight(root, old["files"], new["files"], check_cancelled)
        names = [name for name in old["files"].keys() | new["files"].keys()
                 if old["files"].get(name) != new["files"].get(name)] + [worker.MANIFEST]
        worker.install_space(root, work / "staged", work / "backup", names)
    check_cancelled()
    if kind == "frozen":
        # Use the helper from the checksum-verified target package, so updater fixes
        # are not postponed until the following update.
        shutil.copy2(work / "staged" / "AVASUpdate.exe", work / "AVASUpdate.exe")
        helper = [str(work / "AVASUpdate.exe")]
        restart = [str(root / "AVASGui.exe")]
    else:
        for name in ("update_worker.py", "update_guard.py", "update_status.py", "update_view.py"):
            shutil.copy2(Path(PACKAGE_DIR) / name, work / name)
        helper = [str(python), str(work / "update_worker.py")]
        restart = [str(python), "-m", "avas", "gui"]
    plan = {"root": str(root), "kind": kind, "before": current["commit"], "commit": release["commit"],
            "display_versions": {"current": f"{current.get('version', '')} · {current['commit'][:8]}",
                                 "target": f"{release['version']} · {release['commit'][:8]}"},
            "pid": os.getpid(), "python": str(python), "staged": str(work / "staged"),
            "backup": str(work / "backup"), "restart": restart, "handshake": True, "guarded": True}
    from avas.installation_lock import lock_path
    plan["lock"] = str(lock_path(root))
    if (work / "baseline" / worker.MANIFEST).exists():
        plan["baseline"] = str(work / "baseline" / worker.MANIFEST)
    plan_path = work / "plan.json"
    plan_path.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    progress({"message": "The confirmed update is ready to install.", "stage": "ready"})
    return {"command": [*helper, str(plan_path)], "directory": str(work)}
