"""CI smoke test: execute the frozen helper outside the bundle, on a disposable folder."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from avas.update_worker import MANIFEST, digest  # noqa: E402


def main():
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        root, staged = temp / "installation", temp / "staged"
        for folder, text in ((root, "old"), (staged, "new")):
            folder.mkdir()
            (folder / "test.txt").write_text(text, encoding="utf-8")
            (folder / MANIFEST).write_text(json.dumps({"files": {"test.txt": digest(folder / "test.txt")}}))
        helper = temp / "AVASUpdate.exe"
        shutil.copy2(ROOT / "dist" / "AVAS" / "AVASUpdate.exe", helper)
        # The missing AVAS.exe makes the post-install health check fail deliberately;
        # replacement must already have succeeded and a diagnostic must be persisted.
        parent = subprocess.Popen([sys.executable, "-c", "pass"])
        parent.wait()
        plan = {"root": str(root), "staged": str(staged), "backup": str(temp / "backup"), "kind": "frozen",
                "pid": parent.pid, "commit": "a" * 40, "restart": [sys.executable, "-c", "pass"],
                "silent": True, "handshake": True}
        path = temp / "plan.json"
        path.write_text(json.dumps(plan), encoding="utf-8")
        run = subprocess.run([str(helper), str(path)], timeout=90, capture_output=True, text=True)
        assert run.returncode == 0, run.stderr
        assert "lost sys.stderr" not in run.stderr, run.stderr
        assert (root / "test.txt").read_text() == "old"  # failed health check restores the old bundle
        assert (temp / "backup/test.txt").read_text() == "old"
        result = json.loads((temp / "result.json").read_text(encoding="utf-8"))
        assert not result["ok"] and (temp / "update.log").exists()
        assert "Traceback" in (temp / "update.log").read_text(encoding="utf-8")
        ready = json.loads((temp / "ready.json").read_text(encoding="utf-8"))
        assert ready["log"] == str(temp / "update.log")
        # Successful replacement also uses a real frozen executable for the health
        # probe, with dependencies read from a disposable copy of the bundle.
        # The GUI path starts as an obsolete fixture and is replaced by the real exe.
        bundle = ROOT / "dist/AVAS"
        success_root = temp / "success"
        shutil.copytree(bundle, success_root, copy_function=shutil.copy2)
        success_stage = temp / "success-stage"
        success_stage.mkdir()
        (success_root / "update-smoke.txt").write_text("old")
        (success_stage / "update-smoke.txt").write_text("new")
        (success_root / "AVASGui.exe").write_bytes(b"obsolete executable fixture")
        shutil.copy2(bundle / "AVASGui.exe", success_stage / "AVASGui.exe")
        for folder in (success_root, success_stage):
            (folder / MANIFEST).write_text(json.dumps({"files": {name: digest(folder / name)
                                                               for name in ("update-smoke.txt", "AVASGui.exe")}}))
        success_work = temp / "success-work"
        success_work.mkdir()
        success_plan = {**plan, "root": str(success_root), "staged": str(success_stage), "backup": str(success_work / "backup")}
        success_path = success_work / "plan.json"
        success_path.write_text(json.dumps(success_plan), encoding="utf-8")
        subprocess.run([str(helper), str(success_path)], check=True, timeout=90, capture_output=True, text=True)
        success_result = json.loads((success_work / "result.json").read_text(encoding="utf-8"))
        assert success_result["ok"], success_result
        assert (success_root / "update-smoke.txt").read_text() == "new"
        assert digest(success_root / "AVASGui.exe") == digest(bundle / "AVASGui.exe")
        # A live guarded update refuses both real EXE entry points before parent
        # shutdown. Only the automatic restart gets a ticket through the gate.
        from avas.installation_lock import lock_path
        from avas.gui.proctree import kill
        guard_work = temp / "guard-work"
        guard_work.mkdir()
        user_data = temp / "user-data"
        env = dict(os.environ, LOCALAPPDATA=str(user_data), PYTHONIOENCODING="utf-8")
        env.pop("AVAS_UPDATE_PROBE", None)
        lock = user_data / "AVAS/updates" / lock_path(success_root).name
        parent = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        restart_script = (f"from avas import paths; paths.PACKAGE_DIR={str(success_root / 'avas')!r}; "
                          f"paths.USER_DATA_DIR={str(user_data / 'AVAS')!r}; "
                          "from avas.installation_lock import acquire,acknowledge_restart; acquire(); acknowledge_restart()")
        guarded = {**success_plan, "pid": parent.pid, "lock": str(lock), "guarded": True,
                   "backup": str(guard_work / "backup"), "restart": [sys.executable, "-c", restart_script]}
        guard_path = guard_work / "plan.json"
        guard_path.write_text(json.dumps(guarded), encoding="utf-8")
        updating = subprocess.Popen([str(helper), str(guard_path)], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            deadline = time.monotonic() + 20
            while not (guard_work / "ready.json").exists() and time.monotonic() < deadline:
                assert updating.poll() is None, "Updater exited before acquiring its startup gate"
                time.sleep(0.1)
            assert (guard_work / "ready.json").exists()
            for name in ("AVAS.exe", "AVASGui.exe"):
                blocked = subprocess.run([str(success_root / name)], env=env, capture_output=True, timeout=15)
                assert blocked.returncode == 2, (name, blocked.returncode, blocked.stderr)
            kill(parent)
            parent.wait(timeout=15)
            updating.communicate(timeout=90)
            guarded_result = json.loads((guard_work / "result.json").read_text(encoding="utf-8"))
            assert updating.returncode == 0 and guarded_result["ok"], guarded_result
        finally:
            kill(parent)
            parent.wait(timeout=15)
            if updating.poll() is None:
                kill(updating)
                updating.wait(timeout=15)
        # Start the real bundled HTTP backend, not just the lightweight info command.
        log_path = temp / "server.log"
        with log_path.open("w", encoding="utf-8") as log:
            server = subprocess.Popen([str(ROOT / "dist/AVAS/AVAS.exe"), "serve", "--port", "0",
                                       "--token", "packaging-smoke", "--settings", str(temp / "settings.json")],
                                      stdout=log, stderr=log,
                                      creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
            try:
                deadline = time.monotonic() + 60
                url = ""
                while time.monotonic() < deadline:
                    lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
                    url = next((line.split("AVAS interface: ", 1)[1] for line in lines if "AVAS interface: " in line), "")
                    if url or server.poll() is not None:
                        break
                    time.sleep(0.2)
                assert url, log_path.read_text(encoding="utf-8", errors="replace")
                base = url.split("/index.html", 1)[0]
                req = urllib.request.Request(base + "/api/rpc", data=b'{"method":"updates.status","params":{}}',
                                             headers={"Content-Type": "application/json", "X-AVAS-Token": "packaging-smoke"})
                with urllib.request.urlopen(req, timeout=10) as response:
                    reply = json.load(response)
                assert reply["ok"] and reply["result"]["phase"] == "idle", reply
            finally:
                server.terminate()
                server.wait(timeout=15)
    print("Packaged update helper, rollback, and HTTP backend checks passed.")


if __name__ == "__main__":
    main()
