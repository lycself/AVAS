"""Build the stand-alone AVAS: stamp, PyInstaller folder and (optionally) the installer.

    .venv\\Scripts\\python.exe packaging\\build.py            # dist\\AVAS\\ (+ installer when Inno Setup is found)
    .venv\\Scripts\\python.exe packaging\\build.py --frontend # rebuild the web page first (needs Node.js)
    .venv\\Scripts\\python.exe packaging\\build.py --no-installer

Steps:

1. ``avas/_build.json``: version, build time and git commit, shown in Help >
   About and by ``AVAS.exe info`` (git-ignored).
2. Warn when the built web page (``avas/gui/web``) is older than
   ``frontend/src`` (rebuild with ``--frontend``).
3. ``pyinstaller packaging/avas.spec`` -> ``dist/AVAS/`` (AVAS.exe, AVASGui.exe).
4. Inno Setup (``ISCC.exe``, https://jrsoftware.org/isinfo.php) compiles
   ``packaging/avas.iss`` -> ``dist/installer/AVAS-<version>-setup.exe``.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


def newest_mtime(folder):
    newest = 0.0
    for dirpath, _dirs, files in os.walk(folder):
        if "node_modules" in dirpath:
            continue
        for name in files:
            newest = max(newest, os.path.getmtime(os.path.join(dirpath, name)))
    return newest


def find_iscc(explicit=None):
    candidates = [explicit] if explicit else []
    candidates += [shutil.which("ISCC.exe"), shutil.which("iscc")]
    for base in (os.environ.get("ProgramFiles(x86)"), os.environ.get("ProgramFiles"), os.environ.get("LOCALAPPDATA")):
        if base:
            candidates.append(os.path.join(base, "Inno Setup 6", "ISCC.exe"))
            candidates.append(os.path.join(base, "Programs", "Inno Setup 6", "ISCC.exe"))
    return next((c for c in candidates if c and os.path.isfile(c)), None)


def run(cmd, **kw):
    print(">", " ".join(f'"{c}"' if " " in str(c) else str(c) for c in cmd), flush=True)
    subprocess.run(cmd, check=True, **kw)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--frontend", action="store_true", help="rebuild the web front end first (npm run build)")
    ap.add_argument("--no-installer", action="store_true", help="skip Inno Setup")
    ap.add_argument("--iscc", help="path of ISCC.exe")
    args = ap.parse_args(argv)

    from avas import __version__
    from avas.buildinfo import STAMP, git_stamp

    if args.frontend:
        npm = shutil.which("npm") or shutil.which("npm.cmd")
        if not npm:
            print("npm not found: install Node.js or build the front end elsewhere")
            return 2
        run([npm, "run", "build"], cwd=os.path.join(ROOT, "frontend"))
    web = os.path.join(ROOT, "avas", "gui", "web", "index.html")
    src = os.path.join(ROOT, "frontend", "src")
    if os.path.isdir(src) and os.path.isfile(web) and newest_mtime(src) > os.path.getmtime(web) + 1:
        print("WARNING: frontend/src is newer than the built page avas/gui/web; use --frontend to rebuild it")

    stamp = {"version": __version__, "built": time.strftime("%Y-%m-%d %H:%M"), **git_stamp(ROOT)}
    with open(STAMP, "w", encoding="utf-8") as fh:
        json.dump(stamp, fh, indent=1)
    print("stamp:", stamp)

    redist = os.path.join(ROOT, "packaging", "redist", "MicrosoftEdgeWebview2Setup.exe")
    if not os.path.isfile(redist):
        print("NOTE: packaging/redist/MicrosoftEdgeWebview2Setup.exe is missing (python packaging/fetch_webview2.py); "
              "the build works without it, but cannot install WebView2 on machines that lack it")

    try:
        run([sys.executable, "-m", "PyInstaller", "--noconfirm", os.path.join("packaging", "avas.spec")], cwd=ROOT)
    finally:
        os.remove(STAMP)            # only the bundle carries the stamp; source runs read git instead
    dist = os.path.join(ROOT, "dist", "AVAS")
    print(f"built {dist}")

    if args.no_installer:
        return 0
    iscc = find_iscc(args.iscc)
    if not iscc:
        print("Inno Setup (ISCC.exe) not found: the installer was not built. Install Inno Setup 6 "
              "(https://jrsoftware.org/isinfo.php, or 'winget install JRSoftware.InnoSetup') and run again.")
        return 0
    run([iscc, f"/DAppVersion={__version__}", f"/DSourceDir={dist}", f"/DOutputDir={os.path.join(ROOT, 'dist', 'installer')}",
         os.path.join(ROOT, "packaging", "avas.iss")])
    print("installer:", os.path.join(ROOT, "dist", "installer", f"AVAS-{__version__}-setup.exe"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
