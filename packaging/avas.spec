# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the stand-alone AVAS build.

Run from the repository root:

    python packaging/fetch_webview2.py      # once: WebView2 bootstrapper for machines without the runtime
    pyinstaller packaging/avas.spec

The result is dist/AVAS/ with
* AVAS.exe     - console program, same sub-commands as the ``avas`` CLI (``AVAS.exe run ...``)
* AVASGui.exe  - the graphical interface without a console window
* MicrosoftEdgeWebview2Setup.exe (if fetched) - offered when WebView2 is missing
"""
import os

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

ROOT = os.path.abspath(os.path.join(SPECPATH, ".."))

datas = []
datas += collect_data_files("avas", subdir="engine")
datas += collect_data_files("avas", subdir="static")
datas += [(os.path.join(ROOT, "avas", "gui", "web"), os.path.join("avas", "gui", "web"))]
datas += collect_data_files("webview")                  # pywebview's JavaScript glue
bootstrapper = os.path.join(ROOT, "packaging", "redist", "MicrosoftEdgeWebview2Setup.exe")
binaries = [(bootstrapper, ".")] if os.path.isfile(bootstrapper) else []

hiddenimports = (
    ["avas.gui.app", "avas.api.basic", "avas.sim.error", "avas.sim.err_adjust", "sklearn.utils._typedefs",
     "clr_loader", "pythonnet"]
    + collect_submodules("avas.gui.services")
    + collect_submodules("webview.platforms")
)

common = dict(pathex=[ROOT], binaries=binaries, datas=datas, hiddenimports=hiddenimports, hookspath=[],
              hooksconfig={}, runtime_hooks=[], excludes=["avas.gpu", "avas.hpc", "PyQt5", "PySide6", "tkinter"],
              noarchive=False)

cli = Analysis([os.path.join(ROOT, "run_avas.py")], **common)
gui = Analysis([os.path.join(ROOT, "packaging", "avas_gui.py")], **common)

cli_pyz = PYZ(cli.pure, cli.zipped_data)
gui_pyz = PYZ(gui.pure, gui.zipped_data)

cli_exe = EXE(cli_pyz, cli.scripts, [], exclude_binaries=True, name="AVAS", console=True, upx=False)
gui_exe = EXE(gui_pyz, gui.scripts, [], exclude_binaries=True, name="AVASGui", console=False, upx=False)

coll = COLLECT(
    cli_exe, cli.binaries, cli.zipfiles, cli.datas,
    gui_exe, gui.binaries, gui.zipfiles, gui.datas,
    strip=False, upx=False, name="AVAS",
)
