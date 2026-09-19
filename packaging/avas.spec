# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the stand-alone AVAS build.

Run from the repository root (packaging/build.py does all of this, stamps the
build and compiles the installer):

    python packaging/fetch_webview2.py      # once: WebView2 bootstrapper for machines without the runtime
    pyinstaller packaging/avas.spec

The result is dist/AVAS/ with
* AVAS.exe     - console program, same sub-commands as the ``avas`` CLI (``AVAS.exe run ...``)
* AVASGui.exe  - the graphical interface without a console window
* MicrosoftEdgeWebview2Setup.exe (if fetched) - offered when WebView2 is missing
"""
import os
import sys

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

ROOT = os.path.abspath(os.path.join(SPECPATH, ".."))

# A Python from conda keeps libexpat.dll, libffi ... in <prefix>/Library/bin; let PyInstaller find them.
_conda_bin = os.path.join(sys.base_prefix, "Library", "bin")
if os.path.isdir(_conda_bin):
    os.environ["PATH"] = _conda_bin + os.pathsep + os.environ.get("PATH", "")

datas = []
datas += collect_data_files("avas", subdir="engine")
datas += collect_data_files("avas", subdir="static")
datas += [(os.path.join(ROOT, "avas", "gui", "web"), os.path.join("avas", "gui", "web"))]
datas += collect_data_files("webview")                  # pywebview's JavaScript glue
manual = os.path.join(ROOT, "docs", "使用说明20260427.docx")   # Help > User manual
if os.path.isfile(manual):
    datas += [(manual, "docs")]
stamp = os.path.join(ROOT, "avas", "_build.json")        # written by packaging/build.py
if os.path.isfile(stamp):
    datas += [(stamp, "avas")]
bootstrapper = os.path.join(ROOT, "packaging", "redist", "MicrosoftEdgeWebview2Setup.exe")
binaries = [(bootstrapper, ".")] if os.path.isfile(bootstrapper) else []
icon = os.path.join(ROOT, "avas", "gui", "web", "avas.ico")
icon = icon if os.path.isfile(icon) else None

hiddenimports = (
    ["avas.gui.app", "sklearn.utils._typedefs", "scipy.optimize", "clr_loader", "pythonnet"]
    # the run / plot entry points import the engine wrapper, post-processing and plots lazily
    + collect_submodules("avas.api")
    + collect_submodules("avas.core")
    + collect_submodules("avas.sim")
    + collect_submodules("avas.post")
    + collect_submodules("avas.data")
    + collect_submodules("avas.utils")
    + collect_submodules("avas.gui.services")
    + collect_submodules("avas.ai")
    + collect_submodules("webview.platforms")
    + collect_submodules("uvicorn")             # protocol / loop implementations are chosen by name at run time
    + collect_submodules("websockets")
    + collect_submodules("anyio")               # FastAPI/Starlette's thread pool picks its backend by name
    + collect_submodules("pydantic")            # FastAPI request models; pydantic-core is loaded by name
)

common = dict(pathex=[ROOT], binaries=binaries, datas=datas, hiddenimports=hiddenimports, hookspath=[],
              hooksconfig={}, runtime_hooks=[], excludes=["avas.gpu", "PyQt5", "PySide6", "tkinter"],
              noarchive=False)

cli = Analysis([os.path.join(ROOT, "run_avas.py")], **common)
gui = Analysis([os.path.join(ROOT, "packaging", "avas_gui.py")], **common)

cli_pyz = PYZ(cli.pure, cli.zipped_data)
gui_pyz = PYZ(gui.pure, gui.zipped_data)

cli_exe = EXE(cli_pyz, cli.scripts, [], exclude_binaries=True, name="AVAS", console=True, upx=False, icon=icon)
gui_exe = EXE(gui_pyz, gui.scripts, [], exclude_binaries=True, name="AVASGui", console=False, upx=False, icon=icon)

coll = COLLECT(
    cli_exe, cli.binaries, cli.zipfiles, cli.datas,
    gui_exe, gui.binaries, gui.zipfiles, gui.datas,
    strip=False, upx=False, name="AVAS",
)
