"""The currently open AVAS project (a directory with InputFile/ and OutputFile/)."""
import json
import os

from PyQt5.QtCore import QObject, pyqtSignal

from avas import paths
from avas.api.qt.api import judge_if_is_avas_project
from avas.api.qt.createbasicfile import CreateBasicProject

RUN_INFO_FILE = "avas_run.json"
MAX_RECENT = 8


class Project(QObject):
    changed = pyqtSignal()  # emitted after open/create/close
    lattice_changed = pyqtSignal(str)   # the lattice used for the run was switched

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

    # ------------------------------------------------------------------ lattice source
    def lattice_name(self):
        """File name of the lattice used for the run (``[lattice] source`` in ini.ini)."""
        return paths.lattice_source_name(self.input_dir) if self.is_open else paths.DEFAULT_LATTICE

    def lattice_path(self):
        return paths.lattice_source_path(self.input_dir) if self.is_open else ""

    def set_lattice_name(self, name):
        paths.set_lattice_source(self.input_dir, name)
        self.lattice_changed.emit(name)

    def field_dirs(self):
        """Where field maps are looked up: InputFile, InputFile/field and ini.ini's fieldSource."""
        if not self.is_open:
            return []
        dirs = [self.input_dir, os.path.join(self.input_dir, "field")]
        ini = os.path.join(self.input_dir, "ini.ini")
        if os.path.isfile(ini):
            import configparser
            cfg = configparser.ConfigParser()
            cfg.optionxform = str
            try:
                cfg.read(ini, encoding="utf-8")
                src = cfg.get("project", "fieldSource", fallback="").strip()
            except configparser.Error:
                src = ""
            if src:
                dirs.insert(0, src if os.path.isabs(src) else os.path.join(self.input_dir, src))
        return [d for d in dirs if os.path.isdir(d)]

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
