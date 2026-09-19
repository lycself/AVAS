"""Helpers for a run's input folder (staging copies, text-input listing).

``avas run`` copies the text inputs of a project into ``<output>/inputs/`` and
generates ``lattice.txt`` there, so the user's ``InputFile`` is never rewritten
by a run.  The AI sandbox uses the same copy for its trial runs.
"""
import os
import shutil

from avas.data.fieldmap import EXT_MEANING

TEXT_SUFFIXES = (".txt", ".ini", ".dat", ".csv")


def is_field_map(name):
    """*name* has a field-map extension (``.edx``, ``.bsz`` ...)."""
    return os.path.splitext(name)[1].lstrip(".").lower() in EXT_MEANING


def particle_file(beam_path):
    """The ``readparticledistribution`` file named in ``beam.txt`` (None when absent or ``unknown``)."""
    if not os.path.isfile(beam_path):
        return None
    with open(beam_path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = line.split("!", 1)[0].split()
            if len(parts) >= 2 and parts[0].lower() == "readparticledistribution" and parts[1].lower() != "unknown":
                return parts[1]
    return None


def copy_text_inputs(src, dest):
    """Copy the text input files of the folder *src* (and a relative particle file) into *dest*.

    Field maps are skipped: the engine reads them from its field path, which stays
    the original folder.  Returns *dest*.
    """
    os.makedirs(dest, exist_ok=True)
    for name in os.listdir(src):
        path = os.path.join(src, name)
        if os.path.isfile(path) and not is_field_map(name) and name.lower().endswith(TEXT_SUFFIXES):
            shutil.copy2(path, os.path.join(dest, name))
    part = particle_file(os.path.join(dest, "beam.txt"))
    if part and not os.path.isabs(part):
        file = os.path.join(src, part)
        if os.path.isfile(file):
            target = os.path.join(dest, part)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            shutil.copy2(file, target)
    return dest
