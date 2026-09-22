import json
import os
import subprocess

import pytest

from avas import buildinfo, updates

SHA = "a" * 40
DATE = "2026-09-22T01:39:00+00:00"


@pytest.fixture
def installation(tmp_path, monkeypatch):
    package = tmp_path / "avas"
    (package / "gui/web").mkdir(parents=True)
    monkeypatch.setattr(buildinfo, "PACKAGE_DIR", str(package))
    monkeypatch.setattr(buildinfo, "STAMP", str(package / "_build.json"))
    monkeypatch.setattr(buildinfo.sys, "frozen", False, raising=False)
    buildinfo.build_info.cache_clear()
    yield tmp_path, package
    buildinfo.build_info.cache_clear()


def write(path, data):
    path.write_text(json.dumps(data), encoding="utf-8")


def test_frontend_timestamp_is_recorded_not_file_mtime(installation):
    root, package = installation
    stamp = package / "gui/web/source-hash.json"
    write(stamp, {"built": DATE})
    os.utime(stamp, (1, 1))
    assert buildinfo.build_info()["frontend"] == DATE


@pytest.mark.parametrize("content", [None, "broken", "[]", '{"sha256":"legacy"}'])
def test_missing_frontend_timestamp_stays_unknown(installation, content):
    root, package = installation
    (package / "gui/web/index.html").write_text("newly extracted")
    if content is not None:
        (package / "gui/web/source-hash.json").write_text(content)
    assert buildinfo.build_info()["frontend"] is None


@pytest.mark.parametrize("manifest", [False, True])
def test_source_archives_match_updater(installation, manifest):
    root, package = installation
    write(root / ".avas-source.json", {"commit": SHA, "committed": DATE})
    if manifest:
        write(root / ".avas-install.json", {"commit": SHA, "files": {}})
    info = buildinfo.build_info()
    assert info["commit"] == updates.installation(root)["commit"] == SHA
    assert info["committed"] == DATE


def test_unexpanded_archive_marker_is_not_a_commit(installation):
    root, package = installation
    write(root / ".avas-source.json", {"commit": "$Format:%H$", "committed": "$Format:%cI$"})
    assert buildinfo.build_info()["commit"] is None


def test_manifest_date_does_not_come_from_different_revision(installation):
    root, package = installation
    write(root / ".avas-source.json", {"commit": SHA, "committed": DATE})
    write(root / ".avas-install.json", {"commit": "b" * 40, "files": {}})
    assert buildinfo.build_info()["committed"] is None


def test_git_checkout_ignores_stale_packaging_stamp(installation):
    root, package = installation
    def git(*args):
        return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()
    git("init", "-q")
    git("config", "user.name", "Test")
    git("config", "user.email", "test@example.invalid")
    (root / "tracked").write_text("original")
    git("add", "tracked")
    git("commit", "-qm", "fixture")
    write(package / "_build.json", {"commit": SHA, "built": DATE})
    (root / "tracked").write_text("modified")
    info = buildinfo.build_info()
    assert info["commit"] == git("rev-parse", "HEAD")
    assert info["committed"] == git("show", "-s", "--format=%cI")
    assert info["dirty"] is True
    assert info["built"] is None


def test_frozen_manifest_expands_legacy_short_sha(installation, monkeypatch):
    root, package = installation
    monkeypatch.setattr(buildinfo.sys, "frozen", True)
    monkeypatch.setattr(buildinfo.sys, "executable", str(root / "AVASGui.exe"))
    write(package / "_build.json", {"commit": SHA[:7], "committed": DATE, "built": DATE})
    write(root / ".avas-install.json", {"commit": SHA, "files": {}})
    info = buildinfo.build_info()
    assert info["commit"] == SHA
    assert info["committed"] == DATE
    assert info["built"] == DATE


def test_app_info_exposes_revision(installation, monkeypatch):
    from avas.gui.services import system
    root, package = installation
    write(root / ".avas-source.json", {"commit": SHA, "committed": DATE})
    class Settings:
        path = "test-settings"
        def all(self):
            return {}
    monkeypatch.setattr(system.gui_app, "app_settings", Settings)
    monkeypatch.setattr(system.gui_app, "state", lambda: {"base_url": "", "window": None})
    monkeypatch.setattr(system.gui_app, "system_prefers_dark", lambda: False)
    monkeypatch.setattr(system.webview2, "installed_version", lambda: None)
    result = system.info()
    assert result["build"]["commit"] == SHA
    assert result["platform"] == system.runtime_platform_label()


def test_app_info_uses_clear_windows_process_architecture(monkeypatch):
    from avas.gui.services import system
    monkeypatch.setattr(system.sys, "platform", "win32")
    monkeypatch.setattr(system.platform, "machine", lambda: "AMD64")
    monkeypatch.setattr(system.struct, "calcsize", lambda _format: 8)
    assert system.runtime_platform_label() == "Windows x64"
    monkeypatch.setattr(system.platform, "machine", lambda: "ARM64")
    assert system.runtime_platform_label() == "Windows ARM64"
    monkeypatch.setattr(system.struct, "calcsize", lambda _format: 4)
    assert system.runtime_platform_label() == "Windows x86"
