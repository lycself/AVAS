"""Compatibility alias: ``python -m avas.gui.devserver`` is now ``avas serve``.

The GUI is served over HTTP in every mode (see :mod:`avas.gui.server`); this
module keeps the old command working for scripts and launch configurations.
Without ``--settings`` it uses a separate development preferences file, like
the old dev server did, and a fixed token ``dev`` so the URL stays the same
between restarts.
"""
import os
import sys

from avas.gui import serve


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if "--settings" not in argv:
        argv += ["--settings", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".dev-gui.json")]
    if "--token" not in argv and "--no-token" not in argv:
        argv += ["--token", "dev"]
    return serve.main(argv, parser=serve.build_parser("python -m avas.gui.devserver"))


if __name__ == "__main__":
    raise SystemExit(main())
