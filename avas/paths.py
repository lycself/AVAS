"""Filesystem locations used by the package.

Everything that used to be computed with ``os.path.dirname(__file__)`` chains
now goes through this module, so relocating a sub-package cannot silently
break DLL or data lookups.
"""
import os
import sys

PACKAGE_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_DIR = os.path.join(PACKAGE_DIR, "engine")
STATIC_DIR = os.path.join(PACKAGE_DIR, "static")
I18N_DIR = os.path.join(PACKAGE_DIR, "i18n")


def _user_data_dir():
    """Per-user writable directory for logs and settings."""
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    else:
        base = os.environ.get("XDG_DATA_HOME") or os.path.join(os.path.expanduser("~"), ".local", "share")
    return os.path.join(base, "AVAS")


USER_DATA_DIR = _user_data_dir()
LOG_DIR = os.path.join(USER_DATA_DIR, "logs")


def engine_file(name):
    return os.path.join(ENGINE_DIR, name)


def static_file(name):
    return os.path.join(STATIC_DIR, name)


def resolve_io_dirs(project_path=None, input_file=None, output_file=None):
    """Return ``(input_dir, output_dir)``.

    Explicit ``input_file`` / ``output_file`` win; otherwise fall back to the
    classic ``<project>/InputFile`` and ``<project>/OutputFile`` layout.
    """
    input_dir = input_file or (os.path.join(project_path, "InputFile") if project_path else None)
    output_dir = output_file or (os.path.join(project_path, "OutputFile") if project_path else None)
    return input_dir, output_dir
