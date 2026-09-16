"""Simulation settings page: ``input.txt`` plus the ``ini.ini`` run options."""
import logging
import os

from PyQt5.QtWidgets import QCheckBox, QGroupBox, QHBoxLayout, QLabel, QVBoxLayout, QWidget

from avas.api.qt.api import create_from_file_input_ini, write_to_file_input_ini
from avas.gui.widgets.common import PathPicker, RadioGroup, float_edit, form_layout, int_edit, page_header, with_unit
from avas.utils.iniconfig import IniConfig
from avas.utils.tool import safe_float, safe_int, safe_str

log = logging.getLogger("avas.gui")

ERROR_MODES = [("", "None"), ("stat", "Static"), ("dyn", "Dynamic"), ("stat_dyn", "Static + dynamic")]


class SettingsPage(QWidget):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._device = "cpu"
        self._had_threads_key = False
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(12)
        root.addWidget(page_header(self.tr("Simulation settings"),
                                   self.tr("Tracking options written to input.txt, and the run mode stored in ini.ini.")))
        cols = QHBoxLayout()
        cols.setSpacing(16)
        left = QVBoxLayout()
        right = QVBoxLayout()
        cols.addLayout(left, 1)
        cols.addLayout(right, 1)
        root.addLayout(cols)
        root.addStretch(1)

        # --- model ----------------------------------------------------------
        model = QGroupBox(self.tr("Model"))
        mform = form_layout()
        self.rg_sim = RadioGroup([("mulp", self.tr("Multi-particle tracking")), ("env", self.tr("Envelope"))])
        self.rg_sim.set_option_enabled("env", False, self.tr("Envelope mode is not available in this version"))
        mform.addRow(self.tr("Simulation type"), self.rg_sim)
        self.edit_step = int_edit()
        mform.addRow(self.tr("Steps per βλ"), self.edit_step)
        self.edit_dump = int_edit()
        mform.addRow(self.tr("Output every N steps (plt)"), self.edit_dump)
        self.edit_seed = int_edit()
        mform.addRow(self.tr("Random seed of input beam"), self.edit_seed)
        self.cb_threads = QCheckBox(self.tr("Multi-threaded tracking (multithreading)"))
        self.cb_threads.setToolTip(self.tr("Lets the engine use several CPU cores for one run."))
        mform.addRow("", self.cb_threads)
        self.rg_scan = RadioGroup([("default", self.tr("engine default")), (0, self.tr("off")),
                                   (1, self.tr("scan")), (2, self.tr("from scanData.txt"))])
        self.rg_scan.setToolTip(self.tr("scanphase keyword: 0 = fixed phases, 1 = scan cavity phases, "
                                        "2 = read entry phases from scanData.txt. 'engine default' leaves it out."))
        mform.addRow(self.tr("Phase scan"), self.rg_scan)
        model.setLayout(mform)
        left.addWidget(model)

        # --- space charge ------------------------------------------------------
        sc = QGroupBox(self.tr("Space charge"))
        sform = form_layout()
        self.cb_sc = QCheckBox(self.tr("Include space charge"))
        self.cb_sc.toggled.connect(self._toggle_sc)
        sform.addRow("", self.cb_sc)
        self.rg_sc_method = RadioGroup([("FFT", "FFT"), ("SPICNIC", "SPICNIC")])
        sform.addRow(self.tr("Solver"), self.rg_sc_method)
        self.edit_grid = [int_edit("", 70) for _ in range(3)]
        sform.addRow(self.tr("Grid Nx Ny Nz"), self._triple(self.edit_grid, self.tr("empty = engine default")))
        self.edit_mesh = [float_edit("", 70) for _ in range(3)]
        sform.addRow(self.tr("Mesh size (x 2 rms)"), self._triple(self.edit_mesh, self.tr("empty = engine default")))
        sc.setLayout(sform)
        left.addWidget(sc)

        # --- field maps ----------------------------------------------------------
        fld = QGroupBox(self.tr("Field maps"))
        fform = form_layout()
        self.pick_field = PathPicker(mode="dir", caption=self.tr("Select field map directory"))
        self.pick_field.edit.setPlaceholderText(self.tr("empty = InputFile/"))
        fform.addRow(self.tr("Directory"), self.pick_field)
        fld.setLayout(fform)
        left.addWidget(fld)

        # --- limits / extras ---------------------------------------------------------
        extra = QGroupBox(self.tr("Limits and extra output"))
        eform = form_layout()
        self.cb_longlimits = QCheckBox(self.tr("Longitudinal limits"))
        eform.addRow("", self.cb_longlimits)
        self.edit_ll_phase = float_edit()
        self.edit_ll_energy = float_edit()
        eform.addRow(self.tr("Phase limit"), with_unit(self.edit_ll_phase, "deg"))
        eform.addRow(self.tr("Energy limit"), with_unit(self.edit_ll_energy, "MeV"))
        self.cb_boundary = QCheckBox(self.tr("Apply boundary (boundary.txt)"))
        eform.addRow("", self.cb_boundary)
        self.cb_density = QCheckBox(self.tr("Write density file"))
        eform.addRow("", self.cb_density)
        self.edit_density_grid = int_edit()
        eform.addRow(self.tr("Density grid"), self.edit_density_grid)
        extra.setLayout(eform)
        right.addWidget(extra)

        # --- error study ---------------------------------------------------------------
        err = QGroupBox(self.tr("Error study"))
        rform = form_layout()
        self.rg_error = RadioGroup([(v, self.tr(l)) for v, l in ERROR_MODES], horizontal=False)
        self.rg_error.changed.connect(self._toggle_error)
        rform.addRow(self.tr("Errors"), self.rg_error)
        self.edit_err_seed = int_edit("50")
        rform.addRow(self.tr("Seed"), self.edit_err_seed)
        hint = QLabel(self.tr("Error amplitudes are defined by err_* commands in the lattice file."))
        hint.setObjectName("muted")
        hint.setWordWrap(True)
        rform.addRow("", hint)
        err.setLayout(rform)
        right.addWidget(err)
        right.addStretch(1)

        self._toggle_sc(False)
        self._toggle_error("")

    @staticmethod
    def _triple(edits, hint):
        row = QWidget()
        lay = QHBoxLayout(row)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(6)
        for e in edits:
            lay.addWidget(e)
        lab = QLabel(hint)
        lab.setObjectName("soft")
        lay.addWidget(lab)
        lay.addStretch(1)
        return row

    @staticmethod
    def _read_triple(edits, conv):
        vals = [e.text().strip() for e in edits]
        if not all(vals):
            return None
        try:
            return [conv(v) for v in vals]
        except ValueError:
            return None

    @staticmethod
    def _fill_triple(edits, values):
        if values in (None, ""):
            vals = []
        elif isinstance(values, (list, tuple)):
            vals = list(values)
        else:
            vals = [values]
        for i, e in enumerate(edits):
            e.setText(safe_str(vals[i], "") if i < len(vals) else "")

    def _toggle_sc(self, on):
        self.rg_sc_method.setEnabled(on)
        for e in self.edit_grid + self.edit_mesh:
            e.setEnabled(on)

    def _toggle_error(self, mode):
        self.edit_err_seed.setEnabled(bool(mode))

    # ------------------------------------------------------------------ data
    def error_mode(self):
        return self.rg_error.value() or ""

    def load(self):
        if not self.project.is_open:
            return
        item = self.project.item()
        p = create_from_file_input_ini(item)["data"]["inputiniParams"]
        self.rg_sim.set_value(p.get("sim_type") or "mulp")
        self.edit_step.setText(safe_str(p.get("steppercycle"), "100"))
        self.edit_dump.setText(safe_str(p.get("dumpperiodicity"), "0"))
        self.edit_seed.setText(safe_str(p.get("randomseed"), "0"))
        self.cb_sc.setChecked(safe_int(p.get("spacecharge"), 1) == 1)
        self.rg_sc_method.set_value(p.get("scmethod") or "SPICNIC")
        self.pick_field.setText(safe_str(p.get("fieldSource"), ""))
        self.cb_longlimits.setChecked(safe_int(p.get("longlimits_start"), 0) == 1)
        self.edit_ll_phase.setText(safe_str(p.get("longlimits_phase"), "0"))
        self.edit_ll_energy.setText(safe_str(p.get("longlimits_energy"), "0"))
        self.cb_boundary.setChecked(safe_int(p.get("boundary"), 0) == 1)
        self.cb_density.setChecked(safe_int(p.get("pchistogram_start"), 0) == 1)
        self.edit_density_grid.setText(safe_str(p.get("pchistogram_grid"), "300"))
        self._device = p.get("device") or "cpu"
        self._had_threads_key = p.get("multithreading") is not None
        self.cb_threads.setChecked(safe_int(p.get("multithreading"), 0) == 1)
        self.rg_scan.set_value("default" if p.get("scanphase") is None else safe_int(p.get("scanphase"), 0))
        self._fill_triple(self.edit_grid, p.get("numofgrid"))
        self._fill_triple(self.edit_mesh, p.get("meshrms"))

        ini = IniConfig().create_from_file(item)
        if isinstance(ini, dict) and ini.get("code", 0) == 0:
            err = ini["data"]["iniParams"].get("error", {})
            self.rg_error.set_value(err.get("error_type") or "")
            self.edit_err_seed.setText(safe_str(err.get("seed"), "50"))

    def values(self):
        return {
            "sim_type": self.rg_sim.value() or "mulp",
            "scmethod": self.rg_sc_method.value() or "SPICNIC",
            "spacecharge": 1 if self.cb_sc.isChecked() else 0,
            "steppercycle": safe_int(self.edit_step.text(), 100),
            "dumpperiodicity": safe_int(self.edit_dump.text(), 0),
            "pchistogram_start": 1 if self.cb_density.isChecked() else 0,
            "pchistogram_grid": safe_int(self.edit_density_grid.text(), 300),
            "fieldSource": self.pick_field.text(),
            "longlimits_start": 1 if self.cb_longlimits.isChecked() else 0,
            "longlimits_phase": safe_float(self.edit_ll_phase.text(), 0),
            "longlimits_energy": safe_float(self.edit_ll_energy.text(), 0),
            "boundary": 1 if self.cb_boundary.isChecked() else 0,
            "randomseed": safe_int(self.edit_seed.text(), 0),
            "spacechargelong": None,
            "spacechargetype": None,
            "device": self._device,
            # keywords absent from input.txt keep the engine's own default: only write
            # them when the user asked for a value (or turned a previously set one off)
            "multithreading": 1 if self.cb_threads.isChecked() else (0 if self._had_threads_key else None),
            "scanphase": None if self.rg_scan.value() in (None, "default") else self.rg_scan.value(),
            "numofgrid": self._read_triple(self.edit_grid, int),
            "meshrms": self._read_triple(self.edit_mesh, float),
        }

    def validate(self):
        errors = []
        if not self.edit_step.text():
            errors.append(self.tr("Settings: steps per βλ is missing"))
        for edits, name in ((self.edit_grid, "numofgrid"), (self.edit_mesh, "meshrms")):
            vals = [e.text().strip() for e in edits]
            if any(vals) and not all(vals):
                errors.append(self.tr("Settings: %s needs all three values (or none)") % name)
        if (self.rg_scan.value() == 2 and self.project.is_open
                and not os.path.isfile(self.project.input_file("scanData.txt"))):
            errors.append(self.tr("Settings: phase scan mode 2 needs InputFile/scanData.txt"))
        if self.error_mode() and not self.edit_err_seed.text():
            errors.append(self.tr("Settings: error seed is missing"))
        return errors

    def save(self):
        if not self.project.is_open:
            return
        item = self.project.item()
        res = write_to_file_input_ini(item, self.values())
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        ini = IniConfig()
        ini.create_from_file(item)
        res = ini.set_param(error={"error_type": self.error_mode(),
                                   "seed": safe_int(self.edit_err_seed.text(), 50), "if_normal": 1})
        if isinstance(res, dict) and res.get("code", 0) != 0:
            raise ValueError(res["data"]["msg"])
        res = ini.write_to_file(item)
        if isinstance(res, dict) and res.get("code", 0) != 0:
            raise ValueError(res["data"]["msg"])
