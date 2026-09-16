"""Logging setup.

Log files are written per user under ``avas.paths.LOG_DIR`` (one file per
day) instead of inside the source tree.
"""
import logging
import os
import time

from avas.config import if_logger
from avas.paths import LOG_DIR


def _log_filename():
    os.makedirs(LOG_DIR, exist_ok=True)
    return os.path.join(LOG_DIR, time.strftime("%Y%m%d") + ".log")


def setup_logger(level=logging.INFO):
    """Configure the root logger once (console at *level*, file at DEBUG)."""
    if if_logger == 0:
        logging.disable(logging.CRITICAL)
        return

    root = logging.getLogger()
    root.setLevel(level)
    if root.handlers:  # already configured
        return

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s |  %(filename)s:%(lineno)d  | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)

    try:
        file_handler = logging.FileHandler(_log_filename(), mode="a", encoding="utf-8")
    except OSError:
        return  # read-only location: console logging only
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)
