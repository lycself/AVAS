"""Build versioned update archives and publish the pointer last (CI only)."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from avas import update_worker as worker  # noqa: E402
from avas.updates import BASE, REPOSITORY  # noqa: E402


def manifest(root, commit, kind):
    files = {p.relative_to(root).as_posix(): worker.digest(p) for p in sorted(root.rglob("*"))
             if p.is_file() and p.name != worker.MANIFEST}
    data = {"schema": 1, "commit": commit, "kind": kind, "files": files}
    (root / worker.MANIFEST).write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


def pack(root, dest):
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(root.rglob("*")):
            if p.is_file():
                zf.write(p, p.relative_to(root).as_posix())


def release_notes(root):
    path = root / "docs" / "update-notes.md"
    notes = path.read_text(encoding="utf-8-sig").strip()
    if not notes:
        raise ValueError("Write a short release summary in docs/update-notes.md before publishing")
    return notes


def build(output):
    output.mkdir(parents=True, exist_ok=True)
    commit = worker.git(ROOT, "rev-parse", "HEAD")
    if worker.git(ROOT, "status", "--porcelain", "--untracked-files=all"):
        raise ValueError("Publish updates only from a clean, committed checkout")
    notes = release_notes(ROOT)
    frozen = ROOT / "dist" / "AVAS"
    stamp = json.loads((frozen / "_internal/avas/_build.json").read_text(encoding="utf-8"))
    if stamp.get("dirty") or not stamp.get("commit") or not commit.startswith(stamp["commit"]):
        raise ValueError("Rebuild the Windows bundle from this clean commit before publishing")
    config = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        archive = temp / "source.zip"
        worker.git(ROOT, "archive", "--format=zip", f"--output={archive}", commit)
        source = temp / "source"
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(source)  # archive was created from this trusted checkout
        manifest(source, commit, "source")
        pack(source, output / "avas-source.zip")
    manifest(frozen, commit, "frozen")
    pack(frozen, output / "avas-windows.zip")
    assets = {}
    for kind in ("source", "windows"):
        path = output / f"avas-{kind}.zip"
        assets[kind] = {"url": f"{BASE}/avas-{commit}/{path.name}", "sha256": worker.digest(path)}
    data = {"schema": 1, "repository": REPOSITORY, "commit": commit, "version": config["version"],
            "requires_python": config["requires-python"], "published": datetime.now(timezone.utc).isoformat(),
            "notes": notes, "assets": assets}
    (output / "update.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


def gh(*args, check=True):
    return subprocess.run(["gh", *args, "--repo", REPOSITORY], check=check, capture_output=True, text=True)


def release_info(tag):
    reply = gh("release", "view", tag, "--json", "isDraft,assets", check=False)
    if reply.returncode:
        if "release not found" in reply.stderr.lower():
            return None
        raise RuntimeError(reply.stderr or "Could not inspect GitHub release")
    return json.loads(reply.stdout)


def publish(output):
    data = json.loads((output / "update.json").read_text(encoding="utf-8"))
    commit = data["commit"]
    tag = f"avas-{commit}"
    # Serialize publishing in CI, and also prevent a slower old build replacing B.
    with tempfile.TemporaryDirectory() as temp:
        pointer = release_info("avas-latest")
        if pointer is not None and any(a["name"] == "update.json" for a in pointer["assets"]):
            gh("release", "download", "avas-latest", "--pattern", "update.json", "--dir", temp)
            previous = json.loads((Path(temp) / "update.json").read_text(encoding="utf-8"))["commit"]
            if previous != commit:
                worker.git(ROOT, "fetch", "origin", previous)
                try:
                    worker.git(ROOT, "merge-base", "--is-ancestor", previous, commit)
                except subprocess.CalledProcessError:
                    print("A newer or unrelated release is already published; leaving the pointer unchanged.")
                    return
    existing = release_info(tag)
    if existing is not None and not existing["isDraft"]:
        if not {"update.json", "avas-source.zip", "avas-windows.zip"}.issubset({a["name"] for a in existing["assets"]}):
            raise RuntimeError("Published fixed-version release is incomplete; refusing to advertise it")
        # Never overwrite a fixed-version asset, even on a rebuild of the same SHA.
        with tempfile.TemporaryDirectory() as temp:
            gh("release", "download", tag, "--pattern", "update.json", "--dir", temp)
            data = json.loads((Path(temp) / "update.json").read_text(encoding="utf-8"))
            (output / "update.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        if existing is None:
            gh("release", "create", tag, "--target", commit, "--title", f"AVAS {data['version']} · {commit[:8]}",
               "--notes-file", str(output / "notes.txt"), "--latest=false", "--draft")
        gh("release", "upload", tag, str(output / "avas-source.zip"), str(output / "avas-windows.zip"),
           str(output / "update.json"), "--clobber")  # only unpublished drafts may be repaired
        gh("release", "edit", tag, "--draft=false")
    if pointer is None:
        gh("release", "create", "avas-latest", "--target", commit, "--title", "AVAS automatic updates",
           "--notes", "Latest tested AVAS update metadata.", "--prerelease", "--latest=false")
    gh("release", "upload", "avas-latest", str(output / "update.json"), "--clobber")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--publish", action="store_true")
    args = ap.parse_args()
    output = ROOT / "dist" / "updates"
    data = build(output)
    (output / "notes.txt").write_text(data["notes"], encoding="utf-8")
    if args.publish:
        publish(output)


if __name__ == "__main__":
    main()
