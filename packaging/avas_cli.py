"""Packaged console entry point; without arguments open the desktop app."""
import multiprocessing
from pathlib import Path
import subprocess
import sys


def main(argv=None):
    argv = sys.argv[1:] if argv is None else list(argv)
    if not argv:
        subprocess.Popen([str(Path(sys.executable).with_name("AVASGui.exe"))])
        return 0
    from avas.cli.main import main as cli_main
    return cli_main(argv)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    sys.exit(main())
