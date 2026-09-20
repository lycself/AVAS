"""Reading and writing the project's text files."""
import hashlib
import os
import re


def text_fingerprint(text):
    """SHA-1 of *text* with LF line endings and without trailing newlines.

    Tells whether the lattice in the editor is the one a run used (``lattice_sha1`` in
    avas_run.json); the front end computes the same (``textFingerprint`` in usePreview.ts).
    """
    norm = re.sub(r"\r\n?", "\n", text.lstrip("﻿")).rstrip("\n")
    return hashlib.sha1(norm.encode("utf-8")).hexdigest()


def read_text(path):
    """UTF-8 (with or without BOM), then GBK, then UTF-8 with replacement characters."""
    with open(path, "rb") as fh:
        raw = fh.read()
    for enc in ("utf-8-sig", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def write_text(path, text, source="file", restored_from=None):
    from avas.gui.filehistory import capture
    with capture(path, source, restored_from):
        _write_text(path, text)


def normalized_write_text(text):
    """Normalize line endings and ensure a final newline for nonempty text."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if text and not text.endswith("\n"):
        text += "\n"
    return text


def _write_text(path, text):
    """UTF-8, LF line endings, final newline (atomic replace)."""
    text = normalized_write_text(text)
    folder = os.path.dirname(path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    tmp = path + ".avas-tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    os.replace(tmp, path)
