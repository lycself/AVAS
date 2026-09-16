"""The currently open AVAS project (a directory with InputFile/ and OutputFile/)."""
import json
import os

from PyQt5.QtCore import QObject, pyqtSignal

from avas.api.qt.api import judge_if_is_avas_project
from avas.api.qt.createbasicfile import CreateBasicProject

RUN_INFO_FILE = "avas_run.json"
MAX_RECENT = 8


class Project(QObject):
    changed = pyqtSignal()  # emitted after open/create/close

    def __init__(self, settings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.path = None

    # ------------------------------------------------------------------ state
    @property
    def is_open(self):
        return bool(self.path)

    @property
    def name(self):
        return os.path.basename(self.path) if self.path else ""

    @property
    def input_dir(self):
        return os.path.join(self.path, "InputFile") if self.path else None

    @property
    def output_dir(self):
        return os.path.join(self.path, "OutputFile") if self.path else None

    def input_file(self, name):
        return os.path.join(self.input_dir, name)

    def output_file(self, name):
        return os.path.join(self.output_dir, name)

    def item(self):
        """The ``{"projectPath": ...}`` dict the config classes expect."""
        return {"projectPath": self.path}

    # ------------------------------------------------------------------ open / create
    def open(self, path):
        path = os.path.normpath(path)
        res = judge_if_is_avas_project({"projectPath": path})
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        self.path = path
        self._push_recent(path)
        self.changed.emit()

    def create(self, path):
        path = os.path.normpath(path)
        res = CreateBasicProject({"projectPath": path, "beamKeys": [], "inputKeys": []}, "qt").create_project()
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        self.open(path)

    def close(self):
        self.path = None
        self.changed.emit()

    # ------------------------------------------------------------------ recent
    def recent(self):
        items = self.settings.value("project/recent", [], type=list) or []
        return [p for p in items if isinstance(p, str) and os.path.isdir(p)]

    def _push_recent(self, path):
        items = [p for p in self.recent() if os.path.normcase(p) != os.path.normcase(path)]
        items.insert(0, path)
        self.settings.setValue("project/recent", items[:MAX_RECENT])
        self.settings.setValue("lastProjectPath", path)
        self.settings.sync()

    def last_path(self):
        return self.settings.value("lastProjectPath", "", type=str)

    # ------------------------------------------------------------------ run info
    def last_run(self):
        if not self.is_open:
            return {}
        p = os.path.join(self.output_dir, RUN_INFO_FILE)
        if not os.path.isfile(p):
            return {}
        try:
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)
        except (OSError, ValueError):
            return {}

    def write_run_info(self, info):
        if not self.is_open:
            return
        os.makedirs(self.output_dir, exist_ok=True)
        with open(os.path.join(self.output_dir, RUN_INFO_FILE), "w", encoding="utf-8") as fh:
            json.dump(info, fh, indent=2, ensure_ascii=False)

    def output_files(self, suffix=None):
        if not self.is_open or not os.path.isdir(self.output_dir):
            return []
        names = sorted(os.listdir(self.output_dir))
        if suffix:
            names = [n for n in names if n.lower().endswith(suffix)]
        return names
