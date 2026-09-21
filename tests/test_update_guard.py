"""Startup/update races across distribution types; never use the real installation."""
import json
import os
import subprocess
import sys
import time

import pytest

from avas.update_guard import InstallationBusy, InstallationLock, UpdateGate, gate_paths, startup_lease, write_state


@pytest.mark.parametrize("channel", ["setup", "portable", "source-zip", "git"])
def test_gate_covers_exit_install_and_automatic_restart(tmp_path, channel):
    lock = tmp_path / channel / "installation.lock"
    old = InstallationLock(lock)
    old.__enter__()
    with UpdateGate(lock) as gate:
        with pytest.raises(InstallationBusy, match="automatically"):
            startup_lease(lock)
        assert gate.paths["attention"].exists()
        old.__exit__()
        with InstallationLock(lock, exclusive=True):
            with pytest.raises(InstallationBusy):
                startup_lease(lock)
        token = gate.restart_env()["AVAS_UPDATE_RESTART"]
        with pytest.raises(InstallationBusy):
            startup_lease(lock, "wrong token")
        restarted, ticket = startup_lease(lock, token)
        try:
            assert ticket == token
            with pytest.raises(InstallationBusy):
                startup_lease(lock)
            write_state(gate.paths["restarted"], {"token": ticket})
            gate.wait_restarted(None, timeout=1)
        finally:
            restarted.__exit__()
    normal, ticket = startup_lease(lock)
    normal.__exit__()
    assert not ticket


def test_crashed_updater_does_not_leave_startup_blocked(tmp_path):
    lock = tmp_path / "installation.lock"
    script = "from avas.update_guard import UpdateGate; import sys,time; g=UpdateGate(sys.argv[1]); g.__enter__(); print('ready',flush=True); time.sleep(60)"
    process = subprocess.Popen([sys.executable, "-c", script, str(lock)], stdout=subprocess.PIPE, text=True)
    try:
        assert process.stdout.readline().strip() == "ready"
        with pytest.raises(InstallationBusy):
            startup_lease(lock)
    finally:
        # Kill the fixture's entire Python launcher tree (the venv may have a child).
        from avas.gui.proctree import kill
        kill(process)
        process.wait(timeout=10)
    assert gate_paths(lock)["state"].is_file()
    lease, token = startup_lease(lock)
    lease.__exit__()
    assert token == ""


@pytest.mark.parametrize("entry", ["avas.cli.main", "avas.gui.app", "avas.gui.serve"])
def test_source_entry_refuses_before_loading_dependencies(tmp_path, entry, monkeypatch):
    from avas import installation_lock
    monkeypatch.setattr(installation_lock, "USER_DATA_DIR", str(tmp_path / "user"))
    root = tmp_path / "source"
    lock = installation_lock.lock_path(root)
    code = (f"from avas import paths; paths.PACKAGE_DIR={str(root / 'avas')!r}; "
            f"paths.USER_DATA_DIR={str(tmp_path / 'user')!r}\n"
            f"try:\n import {entry}\n"
            "except SystemExit:\n import sys; assert 'numpy' not in sys.modules; assert 'fastapi' not in sys.modules; raise\n")
    env = {k: v for k, v in os.environ.items() if k not in ("AVAS_UPDATE_PROBE", "AVAS_UPDATE_RESTART")}
    env["PYTHONIOENCODING"] = "utf-8"
    with UpdateGate(lock):
        result = subprocess.run([sys.executable, "-c", code], env=env, capture_output=True, text=True, encoding="utf-8", timeout=15)
    assert result.returncode == 2, result.stderr
    assert "automatically" in result.stderr and "Traceback" not in result.stderr


def test_restart_acknowledgement_is_not_sent_until_window_shown(tmp_path, monkeypatch):
    from avas import installation_lock
    lock = tmp_path / "installation.lock"
    with UpdateGate(lock) as gate:
        token = gate.restart_env()["AVAS_UPDATE_RESTART"]
        monkeypatch.setattr(installation_lock, "_restart_token", token)
        monkeypatch.setattr(installation_lock, "_restart_lock", lock)
        assert not gate.paths["restarted"].exists()
        installation_lock.acknowledge_restart()
        assert json.loads(gate.paths["restarted"].read_text())["token"] == token
        assert installation_lock._restart_token == ""


@pytest.mark.skipif(os.name != "nt", reason="Native Windows updater controls")
def test_native_status_window_is_ready_and_closes_on_completion(tmp_path):
    from avas.update_status import StatusWindow
    attention = tmp_path / "attention"
    with StatusWindow("zh_CN", attention) as window:
        assert window.ready.is_set() and window.error is None
        window.set("backup", 0.3)
        window.set("installing", 0.6)
        attention.touch()
        deadline = time.monotonic() + 3
        while attention.exists() and time.monotonic() < deadline:
            time.sleep(0.05)
        assert not attention.exists()
        window.set("restarting")
    assert not window.thread.is_alive() and window.error is None


def test_native_phase_percentages_are_scoped_to_measured_operations():
    from avas.update_status import StatusWindow
    zh = StatusWindow("zh_CN", enabled=False)
    assert "[备份]" in zh.phase_label("backup", 0.3)
    assert "30%" in zh.phase_label("backup", 0.3)
    assert "%" not in zh.phase_label("restarting")
    assert "%" not in zh.phase_label("dependencies", 0.5)
    assert "[Install]" in StatusWindow("en", enabled=False).phase_label("installing", 0.5)


def test_failed_status_window_prevents_installation(tmp_path, monkeypatch):
    from avas import update_worker as worker
    plan = {"guarded": True, "lock": str(tmp_path / "installation.lock"), "pid": os.getpid(),
            "silent": True, "handshake": True}
    path = tmp_path / "plan.json"
    path.write_text(json.dumps(plan))
    monkeypatch.setattr(worker.sys, "argv", ["updater", str(path)])

    class FailedWindow:
        def __init__(self, *a, **kw):
            pass

        def __enter__(self):
            raise RuntimeError("Cannot show status window")

        def __exit__(self, *a):
            pass

    monkeypatch.setattr(worker, "StatusWindow", FailedWindow)
    monkeypatch.setattr(worker, "wait_for_exit", lambda *a: pytest.fail("must not ask parent to close"))
    worker.main()
    assert not path.with_name("ready.json").exists()
    assert "Cannot show" in json.loads(path.with_name("result.json").read_text())["error"]
    lease, _ = startup_lease(plan["lock"])
    lease.__exit__()
