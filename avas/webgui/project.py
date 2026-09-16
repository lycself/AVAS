"""The currently open AVAS project (a directory with InputFile/ and OutputFile/)."""
import configparser
import json
import os
import threading

from avas import paths
from avas.api.qt.api import judge_if_is_avas_project
from avas.api.qt.createbasicfile import CreateBasicProject

RUN_INFO_FILE = "avas_run.json"
MAX_RECENT = 8


class Project:
    def __init__(self, settings):
        self.settings = settings
        self.path = None
        self.lock = threading.RLock()

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

    # ------------------------------------------------------------------ lattice source
    def lattice_name(self):
        return paths.lattice_source_name(self.input_dir) if self.is_open else paths.DEFAULT_LATTICE

    def lattice_path(self):
        return paths.lattice_source_path(self.input_dir) if self.is_open else ""

    def set_lattice_name(self, name):
        paths.set_lattice_source(self.input_dir, name)

    def field_dirs(self):
        """Where field maps are looked up: ini.ini's fieldSource, InputFile and InputFile/field."""
        if not self.is_open:
            return []
        dirs = [self.input_dir, os.path.join(self.input_dir, "field")]
        ini = os.path.join(self.input_dir, "ini.ini")
        if os.path.isfile(ini):
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

    # ------------------------------------------------------------------ open / create
    def require(self):
        if not self.is_open:
            from avas.webgui.bridge import UserError
            raise UserError("Open a project first.")
        return self

    def open(self, path):
        path = os.path.normpath(os.path.abspath(path))
        res = judge_if_is_avas_project({"projectPath": path})
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        self.path = path
        self._push_recent(path)

    def create(self, path):
        path = os.path.normpath(os.path.abspath(path))
        res = CreateBasicProject({"projectPath": path, "beamKeys": [], "inputKeys": []}, "qt").create_project()
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        self.open(path)

    def close(self):
        self.path = None

    # ------------------------------------------------------------------ recent
    def recent(self):
        items = self.settings.get("project/recent") or []
        return [p for p in items if isinstance(p, str) and os.path.isdir(p)]

    def _push_recent(self, path):
        items = [p for p in self.recent() if os.path.normcase(p) != os.path.normcase(path)]
        items.insert(0, path)
        self.settings.update({"project/recent": items[:MAX_RECENT], "project/last": path,
                              "project/lastDir": os.path.dirname(path)})

    def remove_recent(self, path):
        items = [p for p in (self.settings.get("project/recent") or []) if os.path.normcase(p) != os.path.normcase(path)]
        self.settings.set("project/recent", items)

    def last_path(self):
        return self.settings.get("project/last") or ""

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

    # ------------------------------------------------------------------ summary for the page
    def summary(self):
        if not self.is_open:
            return {"open": False, "recent": self.recent(), "lastDir": self.settings.get("project/lastDir") or ""}
        inputs = []
        for name in ("beam.txt", "input.txt", self.lattice_name(), "boundary.txt", "scanData.txt", "ini.ini"):
            inputs.append({"name": name, "exists": os.path.isfile(self.input_file(name))})
        out_dir = self.output_dir
        try:
            entries = os.listdir(out_dir)
            n_files = sum(1 for e in entries if os.path.isfile(os.path.join(out_dir, e)))
            n_dirs = len(entries) - n_files
        except OSError:
            n_files = n_dirs = 0
        return {
            "open": True,
            "path": self.path,
            "name": self.name,
            "inputDir": self.input_dir,
            "outputDir": out_dir,
            "latticeName": self.lattice_name(),
            "latticePath": self.lattice_path(),
            "fieldDirs": self.field_dirs(),
            "inputs": inputs,
            "outputFiles": n_files,
            "outputDirs": n_dirs,
            "lastRun": self.last_run(),
            "recent": self.recent(),
            "lastDir": self.settings.get("project/lastDir") or os.path.dirname(self.path),
        }
