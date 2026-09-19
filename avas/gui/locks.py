"""Input files are read-only while a simulation that reads them is running.

A segment run copies InputFile at the start of each stage, and a project run
or error study works on the snapshot in ``<output>/inputs/`` that the run
record and the live display describe.  Editing inputs in between would
silently mix two configurations, so every call that writes an input file
checks :func:`require_unlocked` while a job is active (also while paused).
The assistant's sandbox studies and the Scan page work on their own copies
and do not lock.
"""
from avas.gui.bridge import UserError

LOCKED_MESSAGE = "A simulation is running: the input files are locked until it finishes or is stopped."


def inputs_locked():
    from avas.gui.services import runner
    return runner.runner().is_running


def require_unlocked():
    if inputs_locked():
        raise UserError(LOCKED_MESSAGE)
