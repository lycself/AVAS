"""Updater regressions use temporary installations, local Git and fake networking."""
import copy
import json
from pathlib import Path
import subprocess
import zipfile

import pytest

from avas import updates
from avas import update_worker as worker


A, B, C = "a" * 40, "b" * 40, "c" * 40


def release(commit=A):
    return {"schema": 1, "repository": updates.REPOSITORY, "commit": commit, "version": "2.0.0",
            "requires_python": ">=3.11,<3.14", "published": "2026-09-20", "notes": "Changes",
            "assets": {kind: {"url": f"{updates.BASE}/avas-{commit}/avas-{kind}.zip", "sha256": "0" * 64}
                       for kind in ("source", "windows")}}


def make_install(root, files, commit=A, kind="source"):
    root.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    data = {"commit": commit, "kind": kind, "files": {name: worker.digest(root / name) for name in files}}
    (root / worker.MANIFEST).write_text(json.dumps(data), encoding="utf-8")
    return data


def archive(root, path):
    with zipfile.ZipFile(path, "w") as zf:
        for file in root.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(root).as_posix())


def test_replace_preserves_user_data_and_removes_obsolete_files(tmp_path):
    old, new = tmp_path / "old", tmp_path / "new"
    make_install(old, {"avas/app.py": "old", "avas/obsolete.py": "obsolete"})
    make_install(new, {"avas/app.py": "new", "avas/added.py": "added"}, B)
    (old / "research.txt").write_text("user data")
    (old / ".venv").mkdir()
    (old / ".venv" / "keep").write_text("environment")
    worker.replace_files(old, new, tmp_path / "backup")
    assert (old / "avas/app.py").read_text() == "new"
    assert not (old / "avas/obsolete.py").exists()
    assert (old / "research.txt").read_text() == "user data"
    assert (old / ".venv/keep").read_text() == "environment"
    assert worker.read_manifest(old)["commit"] == B


@pytest.mark.parametrize("change", ["modified", "deleted", "collision"])
def test_conflicts_never_overwrite(tmp_path, change):
    old, new = tmp_path / "old", tmp_path / "new"
    make_install(old, {"app": "old"})
    make_install(new, {"app": "new", "extra": "new"}, B)
    if change == "modified":
        (old / "app").write_text("my changes")
    elif change == "deleted":
        (old / "app").unlink()
    else:
        (old / "extra").write_text("mine")
    before = {p.name: p.read_bytes() for p in old.iterdir()}
    with pytest.raises(ValueError):
        worker.replace_files(old, new, tmp_path / "backup")
    assert before == {p.name: p.read_bytes() for p in old.iterdir()}


def test_locked_file_restores_partial_replacement(tmp_path, monkeypatch):
    old, new = tmp_path / "old", tmp_path / "new"
    make_install(old, {"a": "old-a", "b": "old-b"})
    make_install(new, {"a": "new-a", "b": "new-b"}, B)
    original = worker.shutil.copy2

    def fail(src, dst):
        if Path(src) == new / "b":
            raise PermissionError("locked")
        return original(src, dst)

    monkeypatch.setattr(worker.shutil, "copy2", fail)
    with pytest.raises(PermissionError):
        worker.replace_files(old, new, tmp_path / "backup")
    assert (old / "a").read_text() == "old-a"
    assert worker.read_manifest(old)["commit"] == A


@pytest.mark.parametrize("name", ["../escape", "/absolute", "C:/outside", "folder\\bad", ".git/config", ".venv/python", "file:stream"])
def test_unsafe_archive_paths_rejected(tmp_path, name):
    path = tmp_path / "bad.zip"
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr(name, "bad")
    # ZipInfo normalizes backslashes on Windows, so test path validation directly too.
    with pytest.raises(ValueError):
        worker.safe_path(tmp_path, name)
    with pytest.raises((ValueError, FileNotFoundError)):
        worker.unpack(path, tmp_path / "extracted")


def test_corrupted_archive_rejected(tmp_path):
    root = tmp_path / "source"
    make_install(root, {"app": "original"})
    (root / "app").write_text("corrupt")
    archive(root, tmp_path / "bad.zip")
    with pytest.raises(ValueError, match="checksum"):
        worker.unpack(tmp_path / "bad.zip", tmp_path / "extract")


def test_fixed_asset_origin():
    data = release()
    updates.validate_release(data)
    data["assets"]["source"]["url"] = "https://example.org/avas-source.zip"
    with pytest.raises(ValueError):
        updates.validate_release(data)


@pytest.fixture
def service(monkeypatch, tmp_path):
    from avas.gui import app, maintenance, settings
    from avas.gui.services import runner, updates as service
    monkeypatch.setattr(service, "_cached", None)
    monkeypatch.setattr(service, "_checked", 0)
    monkeypatch.setattr(service, "_prepared", None)
    monkeypatch.setattr(maintenance, "updating", False)
    monkeypatch.setitem(app.state(), "window", object())
    monkeypatch.setitem(app.state(), "settings", settings.Settings(str(tmp_path / "settings.json")))
    monkeypatch.setattr(runner, "any_active", lambda: False)
    return service


def info(commit=A):
    return {"current": {"commit": C, "kind": "source"}, "release": release(commit), "available": True}


def test_confirmation_detects_B_instead_of_silently_installing_it(service, monkeypatch):
    from avas.gui import maintenance
    monkeypatch.setattr(updates, "check", lambda: info(A))
    assert service.check()["release"]["commit"] == A
    monkeypatch.setattr(updates, "check", lambda: info(B))
    monkeypatch.setattr(updates, "stage", lambda *a: pytest.fail("must ask again"))
    result = service.prepare(A)
    assert result["changed"] and result["info"]["release"]["commit"] == B
    assert not maintenance.updating


def test_release_is_pinned_after_confirmation_and_cancel_releases_lock(service, monkeypatch):
    from avas.gui import maintenance
    monkeypatch.setattr(updates, "check", lambda: info(A))
    installed = []

    def stage(selected, current, progress):
        monkeypatch.setattr(updates, "check", lambda: info(B))
        installed.append(copy.deepcopy(selected))
        return {"command": ["not-executed"]}

    monkeypatch.setattr(updates, "stage", stage)
    assert service.prepare(A) == {"changed": False}
    assert installed[0]["commit"] == A and maintenance.updating
    service.cancel()
    assert not maintenance.updating


def test_failed_download_releases_lock(service, monkeypatch):
    from avas.gui import maintenance
    from avas.gui.bridge import UserError
    monkeypatch.setattr(updates, "check", lambda: info())
    monkeypatch.setattr(updates, "stage", lambda *a: (_ for _ in ()).throw(OSError("offline")))
    with pytest.raises(UserError, match="offline"):
        service.prepare(A)
    assert not maintenance.updating


def test_ignore_is_per_revision_and_browser_cannot_install(service, monkeypatch):
    from avas.gui import app
    from avas.gui.bridge import UserError
    monkeypatch.setattr(updates, "check", lambda: info())
    service.ignore(A)
    assert service.check()["ignored"]
    monkeypatch.setattr(updates, "check", lambda: info(B))
    assert not service.check(force=True)["ignored"]
    monkeypatch.setitem(app.state(), "window", None)
    with pytest.raises(UserError, match="server installation"):
        service.prepare(B)


def test_active_task_refuses_update_and_reservation_refuses_start(service, monkeypatch):
    from avas.gui import maintenance
    from avas.gui.services import runner
    from avas.gui.bridge import UserError
    monkeypatch.setattr(runner, "any_active", lambda: True)
    with pytest.raises(UserError, match="Finish all"):
        service.prepare(A)
    maintenance.updating = True
    with pytest.raises(UserError, match="being prepared"):
        runner.runner().start_job(None)


def test_git_pins_A_even_when_branch_has_B_and_rejects_dirty_tree(tmp_path):
    root = tmp_path / "repo"
    root.mkdir()
    worker.git(root, "init", "-b", "main")
    worker.git(root, "config", "user.name", "Update Test")
    worker.git(root, "config", "user.email", "test@example.invalid")

    def commit(text):
        (root / "app").write_text(text)
        worker.git(root, "add", "app")
        worker.git(root, "commit", "-m", text)
        return worker.git(root, "rev-parse", "HEAD")

    before, a, b = commit("base"), commit("A"), commit("B")
    worker.git(root, "branch", "published", b)
    worker.git(root, "reset", "--hard", before)  # disposable fixture only
    worker.git_preflight(root, before, a)
    worker.git(root, "merge", "--ff-only", a)
    assert worker.git(root, "rev-parse", "HEAD") == a
    (root / "app").write_text("local edits")
    with pytest.raises(ValueError, match="local changes"):
        worker.git_preflight(root, a, b)


def test_dependency_failure_does_not_report_success_or_restart(tmp_path, monkeypatch):
    old, new = tmp_path / "old", tmp_path / "new"
    make_install(old, {"app": "old"})
    make_install(new, {"app": "new"}, B)
    monkeypatch.setattr(worker, "command", lambda *a, **kw: (_ for _ in ()).throw(subprocess.CalledProcessError(1, "pip")))
    monkeypatch.setattr(worker.subprocess, "Popen", lambda *a, **kw: pytest.fail("must not report success"))
    with pytest.raises(subprocess.CalledProcessError):
        worker.execute({"root": str(old), "staged": str(new), "backup": str(tmp_path / "backup"),
                        "kind": "source", "python": "unused", "restart": []})
    assert (tmp_path / "backup/app").read_text() == "old"


@pytest.mark.parametrize("kind", ["source", "frozen"])
def test_stage_and_install_fixed_archive(tmp_path, monkeypatch, kind):
    root, new = tmp_path / "installed", tmp_path / "new"
    make_install(root, {"app": "old", "AVASUpdate.exe": "test helper"}, A, kind)
    make_install(new, {"app": "new", "AVASUpdate.exe": "new helper"}, B, kind)
    (root / "project.txt").write_text("my project")
    python = root / ".venv" / ("Scripts/python.exe" if updates.os.name == "nt" else "bin/python")
    python.parent.mkdir(parents=True)
    python.write_text("fixture interpreter")
    monkeypatch.setattr(updates.sys, "prefix", str(root / ".venv"))
    monkeypatch.setattr(updates, "USER_DATA_DIR", str(tmp_path / "state"))
    archive(new, tmp_path / "update.zip")

    def download(item, dest):
        assert f"avas-{B}/" in item["url"]
        worker.shutil.copy2(tmp_path / "update.zip", dest)

    monkeypatch.setattr(updates, "download", download)
    monkeypatch.setattr(updates, "fetch_json", lambda *a: pytest.fail("must not fetch latest after confirmation"))
    prepared = updates.stage(release(B), {"root": str(root), "kind": kind, "commit": A})
    plan = json.loads(Path(prepared["directory"], "plan.json").read_text())
    assert plan["commit"] == B and (root / "app").read_text() == "old"
    monkeypatch.setattr(worker, "command", lambda *a, **kw: None)  # no dependency installation in fixtures
    worker.execute(plan)
    assert (root / "app").read_text() == "new"
    assert (root / "project.txt").read_text() == "my project"
    assert python.read_text() == "fixture interpreter"


def test_staged_tampering_is_refused_before_mutation(tmp_path):
    root, new = tmp_path / "installed", tmp_path / "new"
    make_install(root, {"app": "old"})
    make_install(new, {"app": "new"}, B)
    (new / "app").write_text("changed since download")
    with pytest.raises(ValueError, match="Staged update checksum"):
        worker.replace_files(root, new, tmp_path / "backup")
    assert (root / "app").read_text() == "old"


def test_rpc_transport_does_not_turn_offline_into_up_to_date(service, monkeypatch):
    from avas.gui import bridge
    monkeypatch.setattr(updates, "check", lambda: (_ for _ in ()).throw(OSError("offline")))
    reply = json.loads(bridge.dispatch("updates.check", {"force": True}))
    assert not reply["ok"] and reply["user"] and "connection" in reply["error"]


def test_git_ignored_file_collision_is_preserved(tmp_path):
    root = tmp_path / "repo"
    root.mkdir()
    worker.git(root, "init", "-b", "main")
    worker.git(root, "config", "user.name", "Update Test")
    worker.git(root, "config", "user.email", "test@example.invalid")
    (root / ".gitignore").write_text("user-data\n")
    worker.git(root, "add", ".gitignore")
    worker.git(root, "commit", "-m", "base")
    before = worker.git(root, "rev-parse", "HEAD")
    (root / "user-data").write_text("new program file")
    worker.git(root, "add", "-f", "user-data")
    worker.git(root, "commit", "-m", "new file")
    target = worker.git(root, "rev-parse", "HEAD")
    worker.git(root, "reset", "--hard", before)
    (root / "user-data").write_text("my results")
    with pytest.raises(ValueError, match="overwritten"):
        worker.git_preflight(root, before, target)
    assert (root / "user-data").read_text() == "my results"


def test_other_process_leases_prevent_installation(tmp_path):
    path = tmp_path / "installation.lock"
    with worker.InstallationLock(path):
        with worker.InstallationLock(path):  # shared leases allow multiple application windows
            with pytest.raises(OSError):
                with worker.InstallationLock(path, exclusive=True):
                    pytest.fail("must not replace a live installation")
    with worker.InstallationLock(path, exclusive=True):
        with pytest.raises(OSError):
            with worker.InstallationLock(path):
                pytest.fail("must not start during replacement")


def test_result_is_reported_once_and_logs_are_kept(service, tmp_path):
    from avas.gui import app
    path = tmp_path / "result.json"
    path.write_text(json.dumps({"ok": False, "error": "dependency installation failed"}))
    app.app_settings().set("updates/result", str(path))
    assert not service.result()["ok"]
    assert service.result() is None and path.exists()


def test_prepared_state_survives_page_reconnect(service, monkeypatch):
    monkeypatch.setattr(updates, "check", lambda: info())
    monkeypatch.setattr(updates, "stage", lambda *a: {"command": ["unused"]})
    service.prepare(A)
    assert service.status() == {"phase": "ready", "commit": A}
    service.cancel()
    assert service.status()["phase"] == "idle"


def load_publisher():
    import importlib.util
    spec = importlib.util.spec_from_file_location("avas_update_release", Path(__file__).resolve().parents[1] / "packaging/update_release.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_publisher_preserves_custom_notes(tmp_path):
    publisher = load_publisher()
    (tmp_path / "docs").mkdir()
    notes = "• 修复启动问题。\n• Improved update detection."
    (tmp_path / "docs/update-notes.md").write_text("\ufeff" + notes + "\n", encoding="utf-8")
    assert publisher.release_notes(tmp_path) == notes


def test_publisher_requires_release_notes(tmp_path):
    publisher = load_publisher()
    with pytest.raises(FileNotFoundError):
        publisher.release_notes(tmp_path)
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs/update-notes.md").write_text(" \n", encoding="utf-8")
    with pytest.raises(ValueError, match="short release summary"):
        publisher.release_notes(tmp_path)


def test_old_publisher_cannot_replace_new_pointer(tmp_path, monkeypatch):
    publisher = load_publisher()
    (tmp_path / "update.json").write_text(json.dumps(release(A)))
    monkeypatch.setattr(publisher, "release_info", lambda tag: {"isDraft": False, "assets": [{"name": "update.json"}]})

    def gh(*args, **kwargs):
        assert args[:2] == ("release", "download"), "Old run must not publish anything"
        Path(args[args.index("--dir") + 1], "update.json").write_text(json.dumps(release(B)))

    def git(root, *args):
        if args[0] == "merge-base":
            raise subprocess.CalledProcessError(1, "git merge-base")
        return ""

    monkeypatch.setattr(publisher, "gh", gh)
    monkeypatch.setattr(publisher.worker, "git", git)
    publisher.publish(tmp_path)


def test_publisher_uploads_pointer_only_after_fixed_release_is_ready(tmp_path, monkeypatch):
    publisher = load_publisher()
    (tmp_path / "update.json").write_text(json.dumps(release(A)))
    monkeypatch.setattr(publisher, "release_info", lambda tag: None)
    calls = []
    monkeypatch.setattr(publisher, "gh", lambda *args, **kwargs: calls.append(args))
    publisher.publish(tmp_path)
    upload = next(i for i, args in enumerate(calls) if args[:3] == ("release", "upload", f"avas-{A}"))
    ready = next(i for i, args in enumerate(calls) if args[:3] == ("release", "edit", f"avas-{A}"))
    pointer = next(i for i, args in enumerate(calls) if args[:3] == ("release", "upload", "avas-latest"))
    assert upload < ready < pointer == len(calls) - 1


def test_network_failure_during_release_inspection_is_not_treated_as_absence(monkeypatch):
    publisher = load_publisher()
    monkeypatch.setattr(publisher, "gh", lambda *a, **kw: subprocess.CompletedProcess([], 1, "", "connection timed out"))
    with pytest.raises(RuntimeError, match="timed out"):
        publisher.release_info("avas-latest")


def test_github_source_zip_uses_exact_baseline_without_mutating_on_prepare(tmp_path, monkeypatch):
    root, baseline, new = tmp_path / "installed", tmp_path / "baseline", tmp_path / "new"
    old_files = {"app": "old", ".avas-source.json": json.dumps({"commit": A})}
    make_install(root, old_files)
    make_install(baseline, old_files)
    make_install(new, {"app": "new", ".avas-source.json": json.dumps({"commit": B})}, B)
    (root / worker.MANIFEST).unlink()  # GitHub Download ZIP, unlike the release asset
    archive(baseline, tmp_path / "baseline.zip")
    archive(new, tmp_path / "new.zip")
    python = root / ".venv" / ("Scripts/python.exe" if updates.os.name == "nt" else "bin/python")
    python.parent.mkdir(parents=True)
    python.write_text("fixture")
    monkeypatch.setattr(updates.sys, "prefix", str(root / ".venv"))
    monkeypatch.setattr(updates, "USER_DATA_DIR", str(tmp_path / "state"))
    monkeypatch.setattr(updates, "fetch_json", lambda url: release(A) if f"avas-{A}/" in url else pytest.fail(url))
    monkeypatch.setattr(updates, "download", lambda item, dest: worker.shutil.copy2(
        tmp_path / ("baseline.zip" if f"avas-{A}/" in item["url"] else "new.zip"), dest))
    current = updates.installation(root)
    assert current["commit"] == A and current["kind"] == "source"
    prepared = updates.stage(release(B), current)
    assert not (root / worker.MANIFEST).exists() and (root / "app").read_text() == "old"
    plan = json.loads(Path(prepared["directory"], "plan.json").read_text())
    monkeypatch.setattr(worker, "command", lambda *a, **kw: None)
    worker.execute(plan)
    assert (root / "app").read_text() == "new" and worker.read_manifest(root)["commit"] == B


def test_download_checksum_failure(tmp_path, monkeypatch):
    import io
    monkeypatch.setattr(updates.urllib.request, "urlopen", lambda *a, **kw: io.BytesIO(b"corrupted download"))
    with pytest.raises(ValueError, match="checksum"):
        updates.download(release()["assets"]["source"], tmp_path / "download.zip")


def test_unreleased_github_zip_still_has_a_verifiable_baseline(tmp_path):
    path = tmp_path / "github.zip"
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr(f"AVAS-{A}/", "")
        zf.writestr(f"AVAS-{A}/.avas-source.json", json.dumps({"commit": A}))
        zf.writestr(f"AVAS-{A}/avas/app.py", "original")
    baseline = worker.unpack(path, tmp_path / "baseline", source_commit=A)
    assert baseline["commit"] == A
    assert baseline["files"]["avas/app.py"] == worker.digest(tmp_path / "baseline/avas/app.py")
    with pytest.raises(ValueError, match="requested revision"):
        worker.unpack(path, tmp_path / "wrong", source_commit=B)


@pytest.mark.parametrize("kind", ["source", "frozen"])
def test_archive_or_bundle_ahead_of_release_is_not_downgraded(monkeypatch, kind):
    monkeypatch.setattr(updates, "installation", lambda: {"kind": kind, "commit": B})
    monkeypatch.setattr(updates, "fetch_json", lambda url: release(A) if url == updates.LATEST else {"status": "behind"})
    assert not updates.check()["available"]
