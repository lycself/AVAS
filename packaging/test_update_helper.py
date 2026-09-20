"""CI smoke test: execute the frozen helper outside the bundle, on a disposable folder."""
import json
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
                "pid": parent.pid, "commit": "a" * 40, "restart": [sys.executable, "-c", "pass"], "silent": True}
        path = temp / "plan.json"
        path.write_text(json.dumps(plan), encoding="utf-8")
        run = subprocess.run([str(helper), str(path)], check=True, timeout=90, capture_output=True, text=True)
        assert "lost sys.stderr" not in run.stderr, run.stderr
        assert (root / "test.txt").read_text() == "old"  # failed health check restores the old bundle
        assert (temp / "backup/test.txt").read_text() == "old"
        result = json.loads((temp / "result.json").read_text(encoding="utf-8"))
        assert not result["ok"] and (temp / "update.log").exists()
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
