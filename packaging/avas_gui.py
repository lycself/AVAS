"""Entry script of AVASGui.exe (no console window).

Without arguments it opens the GUI; with arguments it behaves like AVAS.exe.
"""
import multiprocessing
import sys

from avas.cli.main import main

if __name__ == "__main__":
    multiprocessing.freeze_support()
    sys.exit(main(sys.argv[1:] or ["gui"]))
