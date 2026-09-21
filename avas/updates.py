"""Official update discovery and staging; installation lives in update_worker."""
import json
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
    elif (root / worker.MANIFEST).is_file():
        commit = worker.read_manifest(root)["commit"]
    elif (root / ".avas-source.json").is_file():
        commit = json.loads((root / ".avas-source.json").read_text(encoding="utf-8"))["commit"]
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
        comparison = fetch_json(f"https://api.github.com/repos/{REPOSITORY}/compare/{current['commit']}...{release['commit']}")
        if comparison.get("status") not in ("ahead", "behind", "identical"):
            raise ValueError("This installation does not share the official update history.")
        available = comparison["status"] == "ahead"
    return {"current": current, "release": release, "available": available}


def download(item, dest, require_checksum=True, progress=lambda data: None):
    req = urllib.request.Request(item["url"], headers={"User-Agent": "AVAS-Updater"})
    total = 0
    started = last_report = time.monotonic()
    with urllib.request.urlopen(req, timeout=60) as response, open(dest, "wb") as stream:
        try:
            length = int(response.headers.get("Content-Length", 0)) or None
        except (AttributeError, TypeError, ValueError):
            length = None
        if length is not None and length < 0:
            length = None

        def report():
            progress({"message": "Downloading the update...", "stage": "download", "downloaded": total,
                      "total": length, "speed": total / max(time.monotonic() - started, 0.001)})

        report()
        while chunk := response.read(64 * 1024):
            total += len(chunk)
            if total > 4 * 1024**3:
                raise ValueError("Update download is too large")
            stream.write(chunk)
            if time.monotonic() - last_report >= 0.25:
                report()
                last_report = time.monotonic()
        report()
    if length is not None and total != length:
        raise ValueError("The update download is incomplete. Please try again.")
    progress({"message": "Verifying the update checksum...", "stage": "verify"})
    if require_checksum and worker.digest(dest) != item["sha256"]:
        raise ValueError("Update download checksum failed")


def stage(release, current, progress=lambda data: None):
    cache = Path(USER_DATA_DIR) / "updates"
    cache.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="update-", dir=cache))
    log, log_path = worker.open_update_log(work / "update.log")
    with log:
        previous = None

        def report(data):
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
        worker.git(root, "fetch", "--no-tags", f"https://github.com/{REPOSITORY}.git", release["commit"])
        worker.git_preflight(root, current["commit"], release["commit"])
    else:
        asset = release["assets"]["windows" if kind == "frozen" else "source"]
        if kind == "frozen" and sys.platform != "win32":
            raise ValueError("Automatic packaged updates currently support Windows only.")
        download(asset, work / "update.zip", progress=progress)
        progress({"message": "Extracting and verifying update files...", "stage": "extract"})
        new = worker.unpack(work / "update.zip", work / "staged")
        if new["commit"] != release["commit"] or new["kind"] != kind:
            raise ValueError("The update package does not match the confirmed version")
        if not (root / worker.MANIFEST).is_file():
            # GitHub's Download ZIP carries export-subst metadata, but no generated
            # manifest. Obtain its exact baseline, never infer it from current files.
            try:
                baseline = validate_release(fetch_json(f"{BASE}/avas-{current['commit']}/update.json"))
            except urllib.error.HTTPError as exc:
                if exc.code != 404:
                    raise
                # Download ZIP may be from an intermediate commit whose publish job
                # was superseded. Its exact official GitHub archive is still a baseline.
                download({"url": f"https://github.com/{REPOSITORY}/archive/{current['commit']}.zip"},
                         work / "baseline.zip", require_checksum=False, progress=progress)
                progress({"message": "Checking the installed files...", "stage": "preflight"})
                old = worker.unpack(work / "baseline.zip", work / "baseline", source_commit=current["commit"])
            else:
                if baseline["commit"] != current["commit"]:
                    raise ValueError("Invalid baseline version")
                download(baseline["assets"]["source"], work / "baseline.zip", progress=progress)
                progress({"message": "Checking the installed files...", "stage": "preflight"})
                old = worker.unpack(work / "baseline.zip", work / "baseline")
            worker.preflight(root, old["files"], new["files"])
        else:
            progress({"message": "Checking the installed files...", "stage": "preflight"})
            worker.preflight(root, worker.read_manifest(root)["files"], new["files"])
    if kind == "frozen":
        # Use the helper from the checksum-verified target package, so updater fixes
        # are not postponed until the following update.
        shutil.copy2(work / "staged" / "AVASUpdate.exe", work / "AVASUpdate.exe")
        helper = [str(work / "AVASUpdate.exe")]
        restart = [str(root / "AVASGui.exe")]
    else:
        for name in ("update_worker.py", "update_guard.py", "update_status.py"):
            shutil.copy2(Path(PACKAGE_DIR) / name, work / name)
        helper = [str(python), str(work / "update_worker.py")]
        restart = [str(python), "-m", "avas", "gui"]
    plan = {"root": str(root), "kind": kind, "before": current["commit"], "commit": release["commit"],
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
