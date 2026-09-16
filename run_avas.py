#!/usr/bin/env python
"""Convenience launcher that works without installing the package.

Examples (PowerShell)::

    .\run_avas.py --input "D:\proj\InputFile" --output "D:\proj\Results_001"
    .\run_avas.py plot emittance_x --output "D:\proj\Results_001" --save emit_x.png
    .\run_avas.py gui

``.\run_avas.py --help`` lists every command.

Interpreter selection
---------------------
If the project has a virtual environment in ``.venv`` (see README:
``python -m venv .venv`` + ``pip install -e .``), this launcher always runs inside it,
no matter which Python started the script.  Set ``AVAS_NO_VENV=1`` to disable
that hand-off (e.g. to run with the current interpreter on purpose).
"""
import os
import subprocess
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))


def _venv_python():
    if os.name == "nt":
        return os.path.join(_HERE, ".venv", "Scripts", "python.exe")
    return os.path.join(_HERE, ".venv", "bin", "python")


def _reexec_in_venv():
    """Hand off to .venv's interpreter when we are not already inside it."""
    if os.environ.get("AVAS_NO_VENV"):
        return
    venv_py = _venv_python()
    if not os.path.isfile(venv_py):
        return
    try:
        same = os.path.samefile(sys.executable, venv_py)
    except OSError:
        same = False
    if same or sys.prefix == os.path.dirname(os.path.dirname(venv_py)):
        return
    env = dict(os.environ, AVAS_NO_VENV="1")
    cmd = [venv_py, os.path.abspath(__file__)] + sys.argv[1:]
    sys.exit(subprocess.call(cmd, env=env))


_reexec_in_venv()

if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from avas.cli.main import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
