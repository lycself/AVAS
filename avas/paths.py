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


# --------------------------------------------------------------------------- lattice source
DEFAULT_LATTICE = "lattice_mulp.txt"
LATTICE_ENV_VAR = "AVAS_LATTICE"


def lattice_source_name(input_dir):
    """File name (inside *input_dir*) of the lattice used for the run.

    Priority: ``$AVAS_LATTICE`` (set by ``avas run --lattice``), then
    ``[lattice] source`` in ``ini.ini`` (chosen on the Lattice page), then
    ``lattice_mulp.txt``.
    """
    override = os.environ.get(LATTICE_ENV_VAR, "").strip()
    if override:
        return override
    ini = os.path.join(input_dir, "ini.ini") if input_dir else ""
    if ini and os.path.isfile(ini):
        import configparser
        cfg = configparser.ConfigParser()
        cfg.optionxform = str
        try:
            cfg.read(ini, encoding="utf-8")
            name = cfg.get("lattice", "source", fallback="").strip()
        except configparser.Error:
            name = ""
        if name:
            return name
    return DEFAULT_LATTICE


def lattice_source_path(input_dir):
    """Absolute path of the lattice used for the run (see :func:`lattice_source_name`)."""
    name = lattice_source_name(input_dir)
    return name if os.path.isabs(name) else os.path.join(input_dir, name)


def set_lattice_source(input_dir, name):
    """Store *name* as ``[lattice] source`` in ``ini.ini``, keeping everything else."""
    import configparser
    ini = os.path.join(input_dir, "ini.ini")
    cfg = configparser.ConfigParser()
    cfg.optionxform = str
    if os.path.isfile(ini):
        cfg.read(ini, encoding="utf-8")
    if not cfg.has_section("lattice"):
        cfg.add_section("lattice")
    cfg.set("lattice", "source", "" if name == DEFAULT_LATTICE else name)
    with open(ini, "w", encoding="utf-8") as fh:
        cfg.write(fh)
