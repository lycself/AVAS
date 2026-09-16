"""Persistent GUI preferences as a small JSON file.

Location: ``gui.json`` in :data:`avas.paths.USER_DATA_DIR` (``%LOCALAPPDATA%\\AVAS``
on Windows); ``AVAS_GUI_SETTINGS`` overrides the path (tests use this so the
user's real preferences are never touched).
"""
import json
import os
import threading

from avas.paths import USER_DATA_DIR

DEFAULTS = {
    "ui/language": "en",
    "ui/theme": "system",
    "ui/uiScale": 100,
    "ui/sidebarWidth": 248,
    "ui/sidebarCollapsed": False,
    "ui/logHeight": 200,
    "ui/logCollapsed": False,
    "ui/window": None,
    "ui/lastPage": "project",
    "project/recent": [],
    "project/last": "",
}


def default_path():
    override = os.environ.get("AVAS_GUI_SETTINGS")
    if override:
        return override
    return os.path.join(USER_DATA_DIR, "gui.json")


class Settings:
    def __init__(self, path=None):
        self.path = path or default_path()
        self._lock = threading.RLock()
        self._data = {}
        self._load()

    def _load(self):
        try:
            with open(self.path, encoding="utf-8-sig") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                self._data = data
        except (OSError, ValueError):
            self._data = {}

    def get(self, key, default=None):
        with self._lock:
            if key in self._data:
                return self._data[key]
            return DEFAULTS.get(key, default) if default is None else default

    def set(self, key, value):
        with self._lock:
            self._data[key] = value
            self._save()

    def update(self, values):
        with self._lock:
            self._data.update(values)
            self._save()

    def all(self):
        with self._lock:
            merged = dict(DEFAULTS)
            merged.update(self._data)
            return merged

    def _save(self):
        folder = os.path.dirname(self.path)
        if folder:
            os.makedirs(folder, exist_ok=True)
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(self._data, fh, ensure_ascii=False, indent=2)
        os.replace(tmp, self.path)
