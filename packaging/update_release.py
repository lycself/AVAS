"""Build versioned update archives and publish the pointer last (CI only)."""
import argparse
from datetime import datetime, timezone
import json
import re
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from release_notes import collect  # noqa: E402
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


def release_body(data):
    return f"""## 本次更新 / Changes

{data['notes']}

## 下载与安装 / Downloads

| 文件 / Asset | 用途 / Purpose |
| --- | --- |
| AVAS-{data['version']}-setup.exe | **Windows 用户推荐**：双击安装，无需 Python、Git 或 GitHub 账户。Recommended Windows installer; no Python, Git or GitHub account required. |
| avas-windows.zip | Windows 免安装版：完整解压，运行 AVASGui.exe；也供自动更新使用。Portable bundle: extract all files and run AVASGui.exe; also used by the updater. |
| avas-source.zip | 源码版，需配置 Python 和依赖。Source distribution; requires Python and dependencies. |
| update.json | 程序读取的更新信息，无需手动下载。Update metadata; not a user download. |
| Source code (zip / tar.gz) | GitHub 自动生成的源码归档，不是 Windows 程序。GitHub source archives, not Windows applications. |

请保留程序目录中的全部文件。缺少 WebView2 时安装程序会联网安装它。
Keep all application files together. Setup downloads WebView2 if the runtime is missing.
"""


def previous_commit():
    if release_info("avas-latest") is None:
        return None
    with tempfile.TemporaryDirectory() as temp:
        gh("release", "download", "avas-latest", "--pattern", "update.json", "--dir", temp)
        commit = json.loads((Path(temp) / "update.json").read_text(encoding="utf-8"))["commit"]
    worker.git(ROOT, "fetch", "origin", commit)
    return commit


def build(output, base=None):
    output.mkdir(parents=True, exist_ok=True)
    commit = worker.git(ROOT, "rev-parse", "HEAD")
    if worker.git(ROOT, "status", "--porcelain", "--untracked-files=all"):
        raise ValueError("Publish updates only from a clean, committed checkout")
    notes = collect(ROOT, base)
    frozen = ROOT / "dist" / "AVAS"
    stamp = json.loads((frozen / "_internal/avas/_build.json").read_text(encoding="utf-8"))
    if stamp.get("dirty") or not stamp.get("commit") or not commit.startswith(stamp["commit"]):
        raise ValueError("Rebuild the Windows bundle from this clean commit before publishing")
    config = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    installer = ROOT / "dist" / "installer" / f"AVAS-{config['version']}-setup.exe"
    if not installer.is_file():
        raise ValueError("Windows installer is missing; build with --require-installer")
    shutil.copy2(installer, output / installer.name)
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        archive = temp / "source.zip"
        worker.git(ROOT, "archive", "--format=zip", f"--output={archive}", commit)
        source = temp / "source"
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(source)  # archive was created from this trusted checkout
        (source / "docs/update-notes.md").write_text(notes + "\n", encoding="utf-8")
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
    data["installer"] = {"name": installer.name, "sha256": worker.digest(installer)}
    (output / "update.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (output / "docs").mkdir(exist_ok=True)
    (output / "docs/update-notes.md").write_text(notes + "\n", encoding="utf-8")
    (output / "notes.txt").write_text(release_body(data), encoding="utf-8")
    return data


def gh(*args, check=True):
    return subprocess.run(["gh", *args, "--repo", REPOSITORY], check=check, capture_output=True, encoding="utf-8")


def release_info(tag):
    reply = gh("release", "view", tag, "--json", "isDraft,assets", check=False)
    if reply.returncode:
        if "release not found" in reply.stderr.lower():
            return None
        raise RuntimeError(reply.stderr or "Could not inspect GitHub release")
    return json.loads(reply.stdout)


def publish_short_release(data, legacy_tag):
    """Expose a short public tag; full-SHA assets remain usable by old updaters."""
    commit = data["commit"]
    tag = f"avas-{commit[:7]}"
    refs = worker.git(ROOT, "ls-remote", "origin", f"refs/tags/{tag}", f"refs/tags/{tag}^{{}}")
    # Annotated tags have a peeled commit; lightweight tags point straight to it.
    by_ref = {ref: sha for sha, ref in (line.split() for line in refs.splitlines() if line.strip())}
    target = by_ref.get(f"refs/tags/{tag}^{{}}", by_ref.get(f"refs/tags/{tag}"))
    if target is not None and target != commit:
        raise RuntimeError("Short release tag belongs to another commit; refusing to overwrite it")
    existing = release_info(tag)
    required = {"update.json", "avas-source.zip", "avas-windows.zip", f"AVAS-{data['version']}-setup.exe"}
    if existing is not None and not existing["isDraft"]:
        if target != commit or not required.issubset({a["name"] for a in existing["assets"]}):
            raise RuntimeError("Published short-tag release is incomplete or has an unexpected target")
        return tag
    with tempfile.TemporaryDirectory() as temp:
        folder = Path(temp)
        # Reuse immutable published bytes, including when a CI job is retried.
        for name in sorted(required):
            gh("release", "download", legacy_tag, "--pattern", name, "--dir", temp)
        notes = folder / "notes.txt"
        notes.write_text(release_body(data), encoding="utf-8")
        if existing is None:
            gh("release", "create", tag, "--target", commit, "--title", f"AVAS {data['version']} · {commit[:7]}",
               "--notes-file", str(notes), "--latest=false", "--draft")
        else:
            gh("release", "edit", tag, "--target", commit, "--notes-file", str(notes))
        gh("release", "upload", tag, *(str(folder / name) for name in sorted(required)), "--clobber")
        gh("release", "edit", tag, "--draft=false")
    return tag


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
        required = {"update.json", "avas-source.zip", "avas-windows.zip"}
        if data.get("installer"):
            required.add(data["installer"]["name"])
        if not required.issubset({a["name"] for a in existing["assets"]}):
            raise RuntimeError("Published fixed-version release is incomplete; refusing to advertise it")
        # Never overwrite a fixed-version asset, even on a rebuild of the same SHA.
        with tempfile.TemporaryDirectory() as temp:
            gh("release", "download", tag, "--pattern", "update.json", "--dir", temp)
            data = json.loads((Path(temp) / "update.json").read_text(encoding="utf-8"))
            (output / "update.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        if existing is None:
            gh("release", "create", tag, "--target", commit, "--title", f"AVAS update compatibility · {commit[:7]}",
               "--notes", "供旧版 AVAS 自动更新使用。正式下载请使用短标签版本。 / Compatibility assets for older AVAS updaters; use the short-tag release for downloads.",
               "--latest=false", "--prerelease", "--draft")
        gh("release", "upload", tag, str(output / "avas-source.zip"), str(output / "avas-windows.zip"),
           str(output / f"AVAS-{data['version']}-setup.exe"),
           str(output / "update.json"), "--clobber")  # only unpublished drafts may be repaired
        gh("release", "edit", tag, "--draft=false")
    public_tag = publish_short_release(data, tag)
    if pointer is None:
        gh("release", "create", "avas-latest", "--target", commit, "--title", "AVAS automatic updates",
           "--notes", "供 AVAS 自动更新使用，普通用户无需下载。请到正式版本下载 Windows 安装包。 / Update metadata for AVAS. Download applications from a versioned release: https://github.com/lycself/AVAS/releases", "--prerelease", "--latest=false")
    gh("release", "edit", "avas-latest", "--notes",
       f"供程序自动更新使用，无需手动下载。 / For automatic updates only.\n\n下载程序 / Download: https://github.com/{REPOSITORY}/releases/tag/{public_tag}")
    # Derive from the immutable release metadata, including publisher retries.
    if data.get("installer"):
        write_setup_pointer(data, output / "setup-latest.ini")
        gh("release", "upload", "avas-latest", str(output / "setup-latest.ini"), "--clobber")
    gh("release", "upload", "avas-latest", str(output / "update.json"), "--clobber")


def write_setup_pointer(data, path):
    """Stable ASCII protocol for old Inno installers; fixed assets are ready first."""
    commit = data["commit"]
    item = data["installer"]
    if (not re.fullmatch(r"[0-9a-f]{40}", commit)
            or not re.fullmatch(r"AVAS-[0-9A-Za-z.+_-]+-setup\.exe", item["name"])
            or not re.fullmatch(r"[0-9a-f]{64}", item["sha256"])):
        raise ValueError("Invalid installer metadata")
    if worker.git(ROOT, "rev-parse", "--is-shallow-repository") != "false":
        raise ValueError("Installer publishing requires complete Git history")
    revision = int(worker.git(ROOT, "rev-list", "--count", commit))
    if revision <= 0:
        raise ValueError("Invalid installer revision")
    path.write_text(f"[Setup]\nSchema=1\nCommit={commit}\nRevision={revision}\n"
                    f"Name={item['name']}\nSHA256={item['sha256']}\n", encoding="ascii")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--publish", action="store_true")
    ap.add_argument("--base", help="previous published commit for an offline build")
    args = ap.parse_args()
    output = ROOT / "dist" / "updates"
    base = previous_commit() if args.publish else args.base
    head = worker.git(ROOT, "rev-parse", "HEAD")
    if base == head:
        print("This commit is already published; leaving its immutable assets unchanged.")
        return
    if base:
        try:
            worker.git(ROOT, "merge-base", "--is-ancestor", base, head)
        except subprocess.CalledProcessError:
            print("A newer or unrelated release is already published; skipping this build.")
            return
    build(output, base)
    if args.publish:
        publish(output)


if __name__ == "__main__":
    main()
