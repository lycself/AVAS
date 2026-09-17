"""Input files are read-only while a simulation that reads them is running.

A project run, an error study or a segment run (also while paused) may read
the project's InputFile again later: error studies re-read the lattice for
every error group (``avas/sim/error.py``) and segment runs copy InputFile at
the start of each stage.  Editing inputs in between would silently mix two
configurations, so every call that writes an input file checks
:func:`require_unlocked`.  The assistant's sandbox studies work on their own
copy and do not lock.
"""
from avas.gui.bridge import UserError

LOCKED_MESSAGE = "A simulation is running: the input files are locked until it finishes or is stopped."


def inputs_locked():
    from avas.gui.services import runner
    return runner.runner().is_running


def require_unlocked():
    if inputs_locked():
        raise UserError(LOCKED_MESSAGE)
