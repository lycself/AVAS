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


@pytest.mark.parametrize("kind", ["source", "frozen"])
@pytest.mark.parametrize("status,available", [("ahead", True), ("behind", False), ("identical", False), ("diverged", None)])
def test_check_large_comparison_uses_summary_page(monkeypatch, kind, status, available):
    import io
    from urllib.parse import parse_qs, urlsplit

    monkeypatch.setattr(updates, "installation", lambda: {"kind": kind, "commit": A})

    def respond(request, timeout):
        if request.full_url == updates.LATEST:
            return io.BytesIO(json.dumps(release(B)).encode())
        url = urlsplit(request.full_url)
        assert url.path.endswith(f"/compare/{A}...{B}")
        query = parse_qs(url.query)
        data = {"status": status, "commits": []}
        if query.get("page") != ["2"] or query.get("per_page") != ["1"]:
            data["files"] = [{"patch": "x" * (2 * 1024 * 1024)}]
        return io.BytesIO(json.dumps(data).encode())

    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    if available is None:
        with pytest.raises(ValueError, match="official update history"):
            updates.check()
    else:
        assert updates.check()["available"] is available


def test_update_metadata_size_limit_remains(monkeypatch):
    import io

    monkeypatch.setattr(updates.urllib.request, "urlopen",
                        lambda *a, **k: io.BytesIO(b" " * (1024 * 1024 + 1)))
    with pytest.raises(ValueError, match="metadata is too large"):
        updates.fetch_json(updates.LATEST)


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
    monkeypatch.setattr(service, "_progress", None)
    monkeypatch.setattr(service, "_cancel_event", None)
    monkeypatch.setitem(app.state(), "update_exiting", False)
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

    def stage(selected, current, progress, cancel_event):
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

    def download(item, dest, **kwargs):
        assert f"avas-{B}/" in item["url"]
        worker.shutil.copy2(tmp_path / "update.zip", dest)

    monkeypatch.setattr(updates, "download", download)
    monkeypatch.setattr(updates, "fetch_json", lambda *a: pytest.fail("must not fetch latest after confirmation"))
    prepared = updates.stage(release(B), {"root": str(root), "kind": kind, "commit": A})
    plan = json.loads(Path(prepared["directory"], "plan.json").read_text())
    assert plan["commit"] == B and (root / "app").read_text() == "old"
    assert plan["handshake"] and plan["guarded"]
    if kind == "frozen":
        assert Path(prepared["directory"], "AVASUpdate.exe").read_text() == "new helper"
    else:
        assert all(Path(prepared["directory"], name).is_file()
                   for name in ("update_worker.py", "update_guard.py", "update_status.py"))
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


@pytest.mark.parametrize("exists", [True, False])
def test_result_distinguishes_missing_log_from_saved_error_details(service, tmp_path, exists):
    from avas.gui import app
    log = tmp_path / "update.log"
    if exists:
        log.write_text("permission error")
    path = tmp_path / "result.json"
    path.write_text(json.dumps({"ok": False, "error": "permission error", "details": "saved traceback", "log": str(log)}))
    app.app_settings().set("updates/result", str(path))
    data = service.result()
    assert data["logAvailable"] == exists and data["details"] == "saved traceback"


def test_prepared_state_survives_page_reconnect(service, monkeypatch):
    monkeypatch.setattr(updates, "check", lambda: info())
    monkeypatch.setattr(updates, "stage", lambda *a: {"command": ["unused"]})
    service.prepare(A)
    assert service.status()["phase"] == "ready" and service.status()["commit"] == A
    service.cancel()
    assert service.status()["phase"] == "idle"


def load_publisher():
    import importlib.util
    spec = importlib.util.spec_from_file_location("avas_update_release", Path(__file__).resolve().parents[1] / "packaging/update_release.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_publisher_explains_downloads_without_polluting_dialog_notes():
    publisher = load_publisher()
    data = release()
    body = publisher.release_body(data)
    assert data["notes"] in body
    for name in ("AVAS-2.0.0-setup.exe", "avas-windows.zip", "avas-source.zip", "update.json", "Source code"):
        assert name in body
    assert data["notes"] == "Changes"


def test_release_build_contains_installer_and_generated_notes(tmp_path, monkeypatch):
    publisher = load_publisher()
    root = tmp_path / "repo"
    root.mkdir()
    worker.git(root, "init", "-b", "main")
    worker.git(root, "config", "user.name", "Test")
    worker.git(root, "config", "user.email", "test@example.invalid")
    (root / "docs/changes").mkdir(parents=True)
    notes = "• Windows 用户可以双击安装。"
    (root / "docs/changes/install.md").write_text(notes, encoding="utf-8")
    (root / "pyproject.toml").write_text('[project]\nversion="2.0.0"\nrequires-python=">=3.11"\n')
    (root / ".gitignore").write_text("dist/\n")
    worker.git(root, "add", ".")
    worker.git(root, "commit", "-m", "test")
    commit = worker.git(root, "rev-parse", "HEAD")
    frozen = root / "dist/AVAS"
    (frozen / "_internal/avas").mkdir(parents=True)
    (frozen / "_internal/avas/_build.json").write_text(json.dumps({"commit": commit, "dirty": False}))
    installer = root / "dist/installer/AVAS-2.0.0-setup.exe"
    installer.parent.mkdir()
    installer.write_bytes(b"test installer fixture")
    monkeypatch.setattr(publisher, "ROOT", root)
    output = root / "dist/updates"
    data = publisher.build(output)
    assert data["notes"] == notes
    assert (output / installer.name).read_bytes() == installer.read_bytes()
    assert data["installer"]["sha256"] == worker.digest(installer)
    assert (output / "docs/update-notes.md").read_text(encoding="utf-8").strip() == notes
    extracted = tmp_path / "extract"
    worker.unpack(output / "avas-source.zip", extracted)
    assert (extracted / "docs/update-notes.md").read_text(encoding="utf-8").strip() == notes
    assert worker.git(root, "status", "--porcelain") == ""


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
    monkeypatch.setattr(publisher.worker, "git", lambda *args: "")
    calls = []
    monkeypatch.setattr(publisher, "gh", lambda *args, **kwargs: calls.append(args))
    publisher.publish(tmp_path)
    upload = next(i for i, args in enumerate(calls) if args[:3] == ("release", "upload", f"avas-{A}"))
    ready = next(i for i, args in enumerate(calls) if args[:3] == ("release", "edit", f"avas-{A}"))
    pointer = next(i for i, args in enumerate(calls) if args[:3] == ("release", "upload", "avas-latest"))
    assert upload < ready < pointer == len(calls) - 1
    short_ready = next(i for i, args in enumerate(calls) if args[:3] == ("release", "edit", f"avas-{A[:7]}"))
    assert ready < short_ready < pointer
    legacy_create = next(args for args in calls if args[:3] == ("release", "create", f"avas-{A}"))
    assert "--prerelease" in legacy_create
    short_create = next(args for args in calls if args[:3] == ("release", "create", f"avas-{A[:7]}"))
    assert "--prerelease" not in short_create
    assert short_create[short_create.index("--target") + 1] == A


@pytest.mark.parametrize("draft", [True, False])
def test_short_release_collision_never_overwrites_assets(monkeypatch, draft):
    publisher = load_publisher()
    monkeypatch.setattr(publisher.worker, "git", lambda *args: f"{B}\trefs/tags/avas-{A[:7]}\n")
    monkeypatch.setattr(publisher, "release_info", lambda tag: {"isDraft": draft, "assets": []})
    monkeypatch.setattr(publisher, "gh", lambda *args, **kwargs: pytest.fail("Must not mutate a colliding release"))
    with pytest.raises(RuntimeError, match="another commit"):
        publisher.publish_short_release(release(A), f"avas-{A}")


def test_short_release_retry_preserves_published_assets(monkeypatch):
    publisher = load_publisher()
    tag = f"avas-{A[:7]}"
    monkeypatch.setattr(publisher.worker, "git", lambda *args: f"{B}\trefs/tags/{tag}\n{A}\trefs/tags/{tag}^{{}}\n")
    monkeypatch.setattr(publisher, "release_info", lambda tag: {"isDraft": False, "assets": [
        {"name": name} for name in ("update.json", "avas-source.zip", "avas-windows.zip", "AVAS-2.0.0-setup.exe")]})
    monkeypatch.setattr(publisher, "gh", lambda *args, **kwargs: pytest.fail("Published assets are immutable"))
    assert publisher.publish_short_release(release(A), f"avas-{A}") == tag


def test_short_release_repairs_unpublished_draft_without_tag(monkeypatch):
    publisher = load_publisher()
    tag = f"avas-{A[:7]}"
    monkeypatch.setattr(publisher.worker, "git", lambda *args: "")
    monkeypatch.setattr(publisher, "release_info", lambda tag: {"isDraft": True, "assets": []})
    calls = []
    monkeypatch.setattr(publisher, "gh", lambda *args, **kwargs: calls.append(args))
    assert publisher.publish_short_release(release(A), f"avas-{A}") == tag
    assert not any(args[:2] == ("release", "create") for args in calls)
    assert any(args[:5] == ("release", "edit", tag, "--target", A) for args in calls)
    assert calls[-1] == ("release", "edit", tag, "--draft=false")


def test_network_failure_during_release_inspection_is_not_treated_as_absence(monkeypatch):
    publisher = load_publisher()
    monkeypatch.setattr(publisher, "gh", lambda *a, **kw: subprocess.CompletedProcess([], 1, "", "connection timed out"))
    with pytest.raises(RuntimeError, match="timed out"):
        publisher.release_info("avas-latest")


@pytest.mark.parametrize("modified", [False, True])
def test_github_source_zip_uses_exact_baseline_without_mutating_on_prepare(tmp_path, monkeypatch, modified):
    root, new = tmp_path / "installed", tmp_path / "new"
    old_files = {"app": "old", ".avas-source.json": json.dumps({"commit": A})}
    make_install(root, old_files)
    make_install(new, {"app": "new", ".avas-source.json": json.dumps({"commit": B}),
                       "docs/update-notes.md": "Release notes"}, B)
    (root / worker.MANIFEST).unlink()  # GitHub Download ZIP, unlike the release asset
    # GitHub's archive uses LF; the release asset uses CRLF and adds release notes.
    (root / "app").write_bytes(b"old\n")
    with zipfile.ZipFile(tmp_path / "baseline.zip", "w") as zf:
        zf.writestr(f"AVAS-{A}/app", b"old\n")
        zf.writestr(f"AVAS-{A}/.avas-source.json", (root / ".avas-source.json").read_bytes())
    (new / "app").write_bytes(b"new\r\n")
    manifest = worker.read_manifest(new)
    manifest["files"]["app"] = worker.digest(new / "app")
    (new / worker.MANIFEST).write_text(json.dumps(manifest), encoding="utf-8")
    archive(new, tmp_path / "new.zip")
    python = root / ".venv" / ("Scripts/python.exe" if updates.os.name == "nt" else "bin/python")
    python.parent.mkdir(parents=True)
    python.write_text("fixture")
    monkeypatch.setattr(updates.sys, "prefix", str(root / ".venv"))
    monkeypatch.setattr(updates, "USER_DATA_DIR", str(tmp_path / "state"))
    monkeypatch.setattr(updates, "fetch_json", lambda url: pytest.fail("Must use the exact GitHub archive"))

    def download(item, dest, **kwargs):
        if item["url"] == f"https://github.com/{updates.REPOSITORY}/archive/{A}.zip":
            assert kwargs["require_checksum"] is False
            source = "baseline.zip"
        else:
            assert item == release(B)["assets"]["source"]
            source = "new.zip"
        worker.shutil.copy2(tmp_path / source, dest)

    monkeypatch.setattr(updates, "download", download)
    current = updates.installation(root)
    assert current["commit"] == A and current["kind"] == "source"
    if modified:
        (root / "app").write_bytes(b"local edit\n")
        with pytest.raises(RuntimeError, match="Local file changed"):
            updates.stage(release(B), current)
        assert (root / "app").read_bytes() == b"local edit\n"
        assert not (root / worker.MANIFEST).exists()
        return
    prepared = updates.stage(release(B), current)
    assert not (root / worker.MANIFEST).exists() and (root / "app").read_bytes() == b"old\n"
    plan = json.loads(Path(prepared["directory"], "plan.json").read_text())
    monkeypatch.setattr(worker, "command", lambda *a, **kw: None)
    worker.execute(plan)
    assert (root / "app").read_bytes() == b"new\r\n" and worker.read_manifest(root)["commit"] == B


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


@pytest.mark.parametrize("length", [200000, None])
def test_download_reports_bytes_speed_and_unknown_size(tmp_path, monkeypatch, length):
    import hashlib
    import io
    monkeypatch.setattr(updates.time, "sleep", lambda seconds: None)
    payload = b"x" * 200000
    response = io.BytesIO(payload)
    response.headers = {} if length is None else {"Content-Length": str(length)}
    monkeypatch.setattr(updates.urllib.request, "urlopen", lambda *a, **kw: response)
    events = []
    updates.download({"url": "https://example.invalid/update", "sha256": hashlib.sha256(payload).hexdigest()},
                     tmp_path / "update.zip", progress=events.append)
    transfers = [e for e in events if e["stage"] == "download"]
    assert transfers[0]["downloaded"] == 0 and transfers[-1]["downloaded"] == len(payload)
    assert all(e["total"] == length for e in transfers)
    assert transfers[-1]["speed"] > 0
    assert events[-1]["stage"] == "verify"


def test_truncated_download_is_not_complete(tmp_path, monkeypatch):
    import io
    def respond(*args, **kwargs):
        response = io.BytesIO(b"short")
        response.headers = {"Content-Length": "100"}
        return response
    monkeypatch.setattr(updates.time, "sleep", lambda seconds: None)
    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    with pytest.raises(ValueError, match="incomplete"):
        updates.download({"url": "https://example.invalid/update"}, tmp_path / "update.zip", require_checksum=False)


@pytest.mark.parametrize("supports_range", [True, False])
def test_download_retries_and_resumes_verified_asset(tmp_path, monkeypatch, supports_range):
    import hashlib
    import io
    payload = b"complete archive"
    requests = []

    def respond(request, **kwargs):
        requests.append(request)
        if len(requests) == 1:
            response = io.BytesIO(payload[:5])
            response.headers = {"Content-Length": str(len(payload))}
        else:
            assert request.get_header("Range") == "bytes=5-"
            response = io.BytesIO(payload[5:] if supports_range else payload)
            response.status = 206 if supports_range else 200
            response.headers = {"Content-Length": str(len(payload) - 5 if supports_range else len(payload))}
            if supports_range:
                response.headers["Content-Range"] = f"bytes 5-{len(payload)-1}/{len(payload)}"
        return response

    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    monkeypatch.setattr(updates.time, "sleep", lambda seconds: None)
    dest = tmp_path / "update.zip"
    updates.download({"url": "https://example.invalid/update", "sha256": hashlib.sha256(payload).hexdigest()}, dest)
    assert dest.read_bytes() == payload
    assert len(requests) == 2


def test_download_rejects_wrong_resume_range(tmp_path, monkeypatch):
    import io
    dest = tmp_path / "update.zip"
    dest.write_bytes(b"first")
    response = io.BytesIO(b"wrong")
    response.status = 206
    response.headers = {"Content-Range": "bytes 0-4/5", "Content-Length": "5"}
    monkeypatch.setattr(updates.urllib.request, "urlopen", lambda *a, **kw: response)
    with pytest.raises(ValueError, match="byte range"):
        updates._download({"url": "https://example.invalid/update"}, dest, True, lambda data: None, resume=True)
    assert dest.read_bytes() == b"first"


def test_low_space_stops_before_installation_changes(tmp_path, monkeypatch):
    from types import SimpleNamespace
    root, staged, backup = tmp_path / "root", tmp_path / "staged", tmp_path / "backup"
    make_install(root, {"app.py": "old"})
    make_install(staged, {"app.py": "new"}, commit=B)
    monkeypatch.setattr(worker.shutil, "disk_usage", lambda path: SimpleNamespace(free=0))
    with pytest.raises(ValueError, match="Not enough disk space"):
        worker.replace_files(root, staged, backup)
    assert (root / "app.py").read_text() == "old"
    assert worker.read_manifest(root)["commit"] == A
    assert not backup.exists()


def test_low_space_stops_extraction_before_payload(tmp_path, monkeypatch):
    from types import SimpleNamespace
    package = tmp_path / "package.zip"
    with zipfile.ZipFile(package, "w") as zf:
        zf.writestr("app.py", "new")
    monkeypatch.setattr(worker.shutil, "disk_usage", lambda path: SimpleNamespace(free=0))
    with pytest.raises(ValueError, match="Not enough disk space"):
        worker.unpack(package, tmp_path / "staged")
    assert not (tmp_path / "staged/app.py").exists()


def test_download_range_rejection_restarts_from_zero(tmp_path, monkeypatch):
    import hashlib
    import io
    import urllib.error
    payload = b"complete archive"
    calls = []

    def respond(request, **kwargs):
        calls.append(request.get_header("Range"))
        if len(calls) == 2:
            raise urllib.error.HTTPError(request.full_url, 416, "range unavailable", {}, None)
        response = io.BytesIO(payload[:5] if len(calls) == 1 else payload)
        response.headers = {"Content-Length": str(len(payload))}
        return response

    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    monkeypatch.setattr(updates.time, "sleep", lambda seconds: None)
    dest = tmp_path / "update.zip"
    updates.download({"url": "https://example.invalid/update", "sha256": hashlib.sha256(payload).hexdigest()}, dest)
    assert calls == [None, "bytes=5-", None]
    assert dest.read_bytes() == payload


def test_cancelled_download_survives_next_prepare_and_reuses_complete_cache(tmp_path, monkeypatch):
    import hashlib
    import io
    import threading
    payload = b"a" * 65536 + b"remaining"
    item = {"url": "https://example.invalid/version-a.zip", "sha256": hashlib.sha256(payload).hexdigest()}
    event = threading.Event()
    calls = []
    class Interrupted(io.BytesIO):
        def read(self, size=-1):
            chunk = super().read(size)
            event.set()
            return chunk
    def respond(request, **kwargs):
        calls.append(request.get_header("Range"))
        if len(calls) == 1:
            response = Interrupted(payload)
            response.headers = {"Content-Length": str(len(payload))}
        else:
            response = io.BytesIO(payload[65536:])
            response.status = 206
            response.headers = {"Content-Length": "9", "Content-Range": f"bytes 65536-{len(payload)-1}/{len(payload)}"}
        return response
    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    first, second = tmp_path / "first", tmp_path / "second"
    token = updates._cancel_event.set(event)
    try:
        with pytest.raises(updates.UpdateCancelled):
            updates.cached_download(item, first, lambda data: None)
    finally:
        updates._cancel_event.reset(token)
    cached = next((tmp_path / "downloads").glob("*.zip"))
    assert cached.stat().st_size == 65536
    result = updates.cached_download(item, second, lambda data: None)
    assert result.read_bytes() == payload
    assert updates.cached_download(item, second, lambda data: None) == result
    assert calls == [None, "bytes=65536-"]


def test_changed_asset_does_not_resume_previous_cache(tmp_path, monkeypatch):
    import hashlib
    import io
    calls = []
    def respond(request, **kwargs):
        calls.append(request.get_header("Range"))
        return io.BytesIO(b"payload")
    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    checksum = hashlib.sha256(b"payload").hexdigest()
    first = updates.cached_download({"url": "https://example.invalid/a", "sha256": checksum}, tmp_path / "first", lambda d: None)
    second = updates.cached_download({"url": "https://example.invalid/b", "sha256": checksum}, tmp_path / "second", lambda d: None)
    assert first != second and calls == [None, None]


def test_bad_cached_prefix_is_replaced_after_checksum_failure(tmp_path, monkeypatch):
    import hashlib
    import io
    payload = b"complete"
    dest = tmp_path / "partial.zip"
    dest.write_bytes(b"bad")
    calls = []
    def respond(request, **kwargs):
        calls.append(request.get_header("Range"))
        response = io.BytesIO(payload[3:] if len(calls) == 1 else payload)
        response.headers = {}
        if len(calls) == 1:
            response.status = 206
            response.headers["Content-Range"] = "bytes 3-7/8"
        return response
    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    monkeypatch.setattr(updates.time, "sleep", lambda seconds: None)
    updates.download({"url": "https://example.invalid/a", "sha256": hashlib.sha256(payload).hexdigest()}, dest, resume=True)
    assert dest.read_bytes() == payload and calls == ["bytes=3-", None]


def test_download_low_space_is_not_retried_or_truncated(tmp_path, monkeypatch):
    import io
    from types import SimpleNamespace
    calls = []
    def respond(*args, **kwargs):
        calls.append(1)
        response = io.BytesIO(b"new")
        response.headers = {"Content-Length": "3"}
        return response
    dest = tmp_path / "update.zip"
    dest.write_bytes(b"existing")
    monkeypatch.setattr(updates.urllib.request, "urlopen", respond)
    monkeypatch.setattr(worker.shutil, "disk_usage", lambda path: SimpleNamespace(free=0))
    with pytest.raises(ValueError, match="Not enough disk space"):
        updates.download({"url": "https://example.invalid/update"}, dest, require_checksum=False)
    assert calls == [1]
    assert dest.read_bytes() == b"existing"


def test_install_space_combines_backup_and_target_on_same_volume(tmp_path, monkeypatch):
    root, staged = tmp_path / "root", tmp_path / "staged"
    root.mkdir()
    staged.mkdir()
    (root / "app").write_bytes(b"old")
    (staged / "app").write_bytes(b"new file")
    checks = []
    monkeypatch.setattr(worker, "require_space", lambda path, needed: checks.append((path, needed)))
    worker.install_space(root, staged, tmp_path / "backup", ["app"])
    assert checks == [(root, 3 + 8 + 8)]


def test_progress_rpc_returns_independent_snapshots(service, monkeypatch):
    from avas.gui import bridge
    events = []
    monkeypatch.setattr(bridge, "emit", lambda name, data: events.append(data))
    data = {"stage": "download", "message": "Downloading the update...", "downloaded": 1024, "total": 4096, "speed": 512}
    service._report_progress(data)
    data["downloaded"] = 9999
    snapshot = service.status()
    assert snapshot["progress"]["downloaded"] == 1024
    snapshot["progress"]["downloaded"] = 8888
    assert service.status()["progress"]["downloaded"] == events[0]["downloaded"] == 1024


def test_failed_prepare_keeps_real_log(tmp_path, monkeypatch):
    monkeypatch.setattr(updates, "USER_DATA_DIR", str(tmp_path))
    with pytest.raises(RuntimeError, match="update.log"):
        updates.stage({}, {})
    logs = list(tmp_path.glob("updates/update-*/update.log"))
    assert len(logs) == 1
    assert "Invalid official update metadata" in logs[0].read_text(encoding="utf-8")


def test_failed_copy_never_truncates_destination(tmp_path, monkeypatch):
    src, dst = tmp_path / "source", tmp_path / "destination"
    src.write_text("new")
    dst.write_text("old")

    def fail(source, target):
        Path(target).write_text("partial")
        raise OSError("disk full")

    monkeypatch.setattr(worker.shutil, "copy2", fail)
    with pytest.raises(OSError, match="disk full"):
        worker.copy_replace(src, dst)
    assert dst.read_text() == "old"
    assert not list(tmp_path.glob(".avas-update-*"))


@pytest.mark.skipif(worker.os.name != "nt", reason="Windows file sharing")
@pytest.mark.parametrize("released", [True, False])
def test_windows_occupied_executable(tmp_path, monkeypatch, released):
    import ctypes
    from ctypes import wintypes
    import threading
    old, new = tmp_path / "old", tmp_path / "new"
    make_install(old, {"AVASGui.exe": "old", "a.txt": "old"})
    make_install(new, {"AVASGui.exe": "new", "a.txt": "new"}, B)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p,
                                  wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    kernel.CreateFileW.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    handle = kernel.CreateFileW(str(old / "AVASGui.exe"), 0x80000000, 1, None, 3, 0, None)
    assert handle != wintypes.HANDLE(-1).value
    if released:
        timer = threading.Timer(0.3, lambda: kernel.CloseHandle(handle))
        timer.start()
        try:
            worker.replace_files(old, new, tmp_path / "backup")
        finally:
            timer.join()
        assert (old / "AVASGui.exe").read_text() == "new"
    else:
        monkeypatch.setattr(worker, "FILE_RETRY_SECONDS", 0)
        try:
            with pytest.raises(PermissionError, match="Close other AVAS"):
                worker.replace_files(old, new, tmp_path / "backup")
        finally:
            kernel.CloseHandle(handle)
        assert (old / "a.txt").read_text() == "old"
        assert worker.read_manifest(old)["commit"] == A
        assert not (tmp_path / "backup").exists()


def test_log_fallback_and_invalid_plan_are_reported(tmp_path, monkeypatch):
    work = tmp_path / "work"
    work.mkdir()
    (work / "update.log").mkdir()  # normal log path cannot be opened as a file
    (work / "plan.json").write_text("invalid json")
    monkeypatch.setattr(worker.tempfile, "tempdir", str(tmp_path))
    monkeypatch.setattr(worker.sys, "argv", ["updater", str(work / "plan.json")])
    errors = []
    monkeypatch.setattr(worker, "notify_failure", errors.append)
    worker.main()
    result = json.loads((work / "result.json").read_text(encoding="utf-8"))
    assert not result["ok"] and "JSONDecodeError" in result["details"]
    log = Path(result["log"])
    assert log.parent == tmp_path and "Could not open" in log.read_text(encoding="utf-8")
    assert errors and errors[0]["log"] == str(log)


def test_logs_and_result_are_flushed_before_restart(tmp_path, monkeypatch):
    plan = {"pid": 123, "commit": B, "root": str(tmp_path), "restart": ["fixture"], "backup": "backup", "handshake": True}
    (tmp_path / "plan.json").write_text(json.dumps(plan))
    monkeypatch.setattr(worker.sys, "argv", ["updater", str(tmp_path / "plan.json")])
    monkeypatch.setattr(worker, "wait_for_exit", lambda *a: None)
    monkeypatch.setattr(worker, "execute", lambda *a: (_ for _ in ()).throw(PermissionError("occupied executable")))
    restarted = []

    def restart(*a, **kw):
        data = json.loads((tmp_path / "result.json").read_text(encoding="utf-8"))
        assert "occupied executable" in Path(data["log"]).read_text(encoding="utf-8")
        assert (tmp_path / "ready.json").is_file()
        restarted.append(True)

    monkeypatch.setattr(worker.subprocess, "Popen", restart)
    monkeypatch.setattr(worker, "notify_failure", lambda *a: pytest.fail("GUI already reports the failure"))
    worker.main()
    assert restarted


def test_no_restart_when_parent_has_not_exited(tmp_path, monkeypatch):
    (tmp_path / "plan.json").write_text(json.dumps({"pid": 123, "root": str(tmp_path), "restart": ["unused"], "silent": True}))
    monkeypatch.setattr(worker.sys, "argv", ["updater", str(tmp_path / "plan.json")])
    monkeypatch.setattr(worker, "wait_for_exit", lambda *a: (_ for _ in ()).throw(TimeoutError("still running")))
    monkeypatch.setattr(worker.subprocess, "Popen", lambda *a, **kw: pytest.fail("parent is still alive"))
    worker.main()
    assert "still running" in json.loads((tmp_path / "result.json").read_text())["error"]


def test_helper_start_failure_keeps_gui_open_and_logs(service, tmp_path, monkeypatch):
    from avas.gui import app, maintenance
    from avas.gui.bridge import UserError
    monkeypatch.setattr(service, "_prepared", {"directory": str(tmp_path), "command": ["missing-helper"]})
    monkeypatch.setattr(maintenance, "updating", True)
    monkeypatch.setattr(service.subprocess, "Popen", lambda *a, **kw: (_ for _ in ()).throw(OSError("cannot launch")))
    monkeypatch.setattr(app, "request_close", lambda *a: pytest.fail("must keep GUI open"))
    with pytest.raises(UserError, match="launcher.log"):
        service.install()
    assert "cannot launch" in (tmp_path / "launcher.log").read_text(encoding="utf-8")
    assert not maintenance.updating


def test_cancel_preparation_keeps_reservation_until_worker_stops(service, monkeypatch):
    import threading
    from avas.gui import maintenance
    from avas.gui.bridge import UserError
    monkeypatch.setattr(updates, "check", lambda: info(A))
    entered, finish = threading.Event(), threading.Event()
    results = []

    def stage(selected, current, progress, event):
        entered.set()
        assert finish.wait(5)
        assert event.is_set()
        raise updates.UpdateCancelled()

    monkeypatch.setattr(updates, "stage", stage)
    thread = threading.Thread(target=lambda: results.append(service.prepare(A)))
    thread.start()
    try:
        assert entered.wait(5)
        service.cancel()
        assert service.status()["cancelling"] and maintenance.updating
        with pytest.raises(UserError, match="being prepared"):
            service.prepare(A)
    finally:
        finish.set()
        thread.join(5)
    assert results == [{"changed": False, "cancelled": True}]
    assert service.status()["phase"] == "idle" and not maintenance.updating
    monkeypatch.setattr(updates, "stage", lambda *args: {"command": ["unused"]})
    assert service.prepare(A) == {"changed": False}
    service.cancel()


def test_cancel_cannot_interrupt_installation(service):
    from avas.gui import app
    from avas.gui.bridge import UserError
    app.state()["update_exiting"] = True
    with pytest.raises(UserError, match="cannot be cancelled"):
        service.cancel()


def test_cancel_at_ready_boundary_never_publishes_install_plan(service, monkeypatch):
    monkeypatch.setattr(updates, "check", lambda: info(A))
    def stage(selected, current, progress, event):
        service.cancel()
        return {"command": ["must not run"]}
    monkeypatch.setattr(updates, "stage", stage)
    assert service.prepare(A)["cancelled"]
    assert service._prepared is None


def test_cancel_stops_preparation_subprocess(tmp_path):
    import sys
    checks = []
    def check():
        checks.append(1)
        if len(checks) > 2:
            raise updates.UpdateCancelled()
    with pytest.raises(updates.UpdateCancelled):
        worker.command([sys.executable, "-c", "import time; time.sleep(30)"], tmp_path,
                       cancel_check=check, capture_output=True)


def test_cancel_during_extraction_does_not_touch_installation(tmp_path):
    package = tmp_path / "package.zip"
    with zipfile.ZipFile(package, "w") as zf:
        zf.writestr("app", b"x" * (2 * 1024**2))
    checks = []
    def check():
        checks.append(1)
        if len(checks) >= 3:
            raise updates.UpdateCancelled()
    with pytest.raises(updates.UpdateCancelled):
        worker.unpack(package, tmp_path / "staged", check=check)
    assert (tmp_path / "staged/app").stat().st_size == 1024**2


def test_helper_must_acknowledge_before_gui_closes(service, tmp_path, monkeypatch):
    from avas.gui import app, maintenance
    (tmp_path / "plan.json").write_text("{}")
    app.app_settings().set("ui/language", "zh_CN")
    monkeypatch.setattr(service, "_prepared", {"directory": str(tmp_path), "command": ["fixture"]})
    monkeypatch.setattr(maintenance, "updating", True)
    monkeypatch.setitem(app.state(), "update_exiting", False)
    closed = []

    class Process:
        def poll(self):
            assert not app.state().get("update_exiting")
            (tmp_path / "ready.json").write_text("{}")
            return None

    class Timer:
        def __init__(self, delay, callback):
            assert (tmp_path / "ready.json").is_file()

        def start(self):
            closed.append(True)

    monkeypatch.setattr(service.subprocess, "Popen", lambda *a, **kw: Process())
    monkeypatch.setattr(service.threading, "Timer", Timer)
    assert service.install() and closed and app.state()["update_exiting"]
    assert json.loads((tmp_path / "plan.json").read_text())["language"] == "zh_CN"


def test_helper_start_timeout_stops_its_process_tree(service, tmp_path, monkeypatch):
    from avas.gui import proctree, maintenance, app
    from avas.gui.bridge import UserError
    monkeypatch.setattr(service, "_prepared", {"directory": str(tmp_path), "command": ["fixture"]})
    monkeypatch.setattr(maintenance, "updating", True)
    ticks = iter([0, 31])
    monkeypatch.setattr(service.time, "monotonic", lambda: next(ticks))
    killed = []

    class Process:
        def poll(self):
            return None

    process = Process()
    monkeypatch.setattr(service.subprocess, "Popen", lambda *a, **kw: process)
    monkeypatch.setattr(proctree, "kill", killed.append)
    monkeypatch.setattr(app, "request_close", lambda *a: pytest.fail("must keep AVAS open"))
    with pytest.raises(UserError, match="did not become ready"):
        service.install()
    assert killed == [process] and not maintenance.updating
