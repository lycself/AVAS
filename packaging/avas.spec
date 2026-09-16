# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the stand-alone AVAS build.

Run from the repository root:

    pyinstaller packaging/avas.spec

The result is dist/AVAS/AVAS.exe (Windows) which understands the same
sub-commands as the ``avas`` CLI (``AVAS.exe gui``, ``AVAS.exe run ...``).
"""
import os

from PyInstaller.utils.hooks import collect_data_files

ROOT = os.path.abspath(os.path.join(SPECPATH, ".."))
PKG = os.path.join(ROOT, "avas")

datas = []
datas += collect_data_files("avas", subdir="engine")
datas += collect_data_files("avas", subdir="static")
datas += collect_data_files("avas", subdir="i18n")
datas += collect_data_files("qtawesome")          # icon fonts (codicons) used by the GUI

block_cipher = None

a = Analysis(
    [os.path.join(ROOT, "run_avas.py")],
    pathex=[ROOT],
    binaries=[],
    datas=datas,
    hiddenimports=[
        "avas.gui.app",
        "avas.gui.user_pyqt",
        "avas.api.basic",
        "avas.sim.error",
        "avas.sim.err_adjust",
        "sklearn.utils._typedefs",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["avas.gpu", "avas.hpc"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="AVAS",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="AVAS",
)
