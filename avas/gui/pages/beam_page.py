"""Beam page: writes/reads ``InputFile/beam.txt``."""
import logging
import os

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (QCheckBox, QComboBox, QFileDialog, QGroupBox, QHBoxLayout, QLabel, QLineEdit,
                             QMessageBox, QPushButton, QVBoxLayout, QWidget)

from avas.api.qt.api import cal_beam_parameter
from avas.gui.dialogs.phaseellipse_dialog import PhaseEllipseWidget
from avas.gui.widgets.common import float_edit, form_layout, guarded, int_edit, page_header, with_unit
from avas.utils.beamconfig import BeamConfig
from avas.utils.tool import safe_float, safe_int
from avas.utils.treatfile import copy_file, file_in_directory, split_file

log = logging.getLogger("avas.gui")

DISTRIBUTIONS = ["GS", "WB", "PB", "KV"]


class BeamPage(QWidget):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self.decimals = 5
        self._ellipse = None
        self._build()

    # ------------------------------------------------------------------ ui
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(12)
        root.addWidget(page_header(self.tr("Beam"),
                                   self.tr("Initial beam: either generated from the parameters below or read from a particle (.dst) file.")))

        cols = QHBoxLayout()
        cols.setSpacing(16)
        left = QVBoxLayout()
        right = QVBoxLayout()
        cols.addLayout(left, 3)
        cols.addLayout(right, 2)
        root.addLayout(cols)
        root.addStretch(1)

        # --- particle source ------------------------------------------------
        src = QGroupBox(self.tr("Particle source"))
        src_form = form_layout()
        self.cb_use_dst = QCheckBox(self.tr("Read particles from a .dst file"))
        self.cb_use_dst.toggled.connect(self._toggle_dst)
        src_form.addRow("", self.cb_use_dst)
        row = QHBoxLayout()
        self.edit_dst = QLineEdit()
        self.edit_dst.setReadOnly(True)
        self.edit_dst.setPlaceholderText(self.tr("file inside InputFile/"))
        self.btn_dst = QPushButton(self.tr("Choose..."))
        self.btn_dst.clicked.connect(self.select_dst_file)
        self.btn_import = QPushButton(self.tr("Fill parameters from file"))
        self.btn_import.setToolTip(self.tr("Read mass, current, energy and Twiss parameters from the .dst file"))
        self.btn_import.clicked.connect(self.import_beam_parameter)
        row.addWidget(self.edit_dst, 1)
        row.addWidget(self.btn_dst)
        row.addWidget(self.btn_import)
        src_form.addRow(self.tr("Particle file"), row)
        src.setLayout(src_form)
        left.addWidget(src)

        # --- basic parameters ---------------------------------------------
        basic = QGroupBox(self.tr("Beam parameters"))
        form = form_layout()
        self.edit_charge = int_edit()
        self.edit_mass = float_edit()
        self.edit_current = float_edit()
        self.edit_number = int_edit()
        self.edit_frequency = float_edit()
        self.edit_energy = float_edit()
        form.addRow(self.tr("Charge"), with_unit(self.edit_charge, "e"))
        form.addRow(self.tr("Rest mass"), with_unit(self.edit_mass, "MeV"))
        form.addRow(self.tr("Current"), with_unit(self.edit_current, "mA"))
        form.addRow(self.tr("Number of particles"), self.edit_number)
        form.addRow(self.tr("Frequency"), with_unit(self.edit_frequency, "Hz"))
        form.addRow(self.tr("Kinetic energy"), with_unit(self.edit_energy, "MeV"))
        self.cb_cw = QCheckBox(self.tr("CW (DC) beam - no longitudinal Twiss"))
        self.cb_cw.toggled.connect(self._toggle_cw)
        form.addRow("", self.cb_cw)
        basic.setLayout(form)
        left.addWidget(basic)

        # --- distribution ---------------------------------------------------
        dist = QGroupBox(self.tr("Distribution"))
        dform = form_layout()
        self.combo_trans = QComboBox()
        self.combo_trans.addItems(DISTRIBUTIONS)
        self.combo_longi = QComboBox()
        self.combo_longi.addItems(DISTRIBUTIONS)
        dform.addRow(self.tr("Transverse"), self.combo_trans)
        dform.addRow(self.tr("Longitudinal"), self.combo_longi)
        dist.setLayout(dform)
        right.addWidget(dist)

        # --- twiss ----------------------------------------------------------
        twiss = QGroupBox(self.tr("Twiss parameters and emittance"))
        tform = form_layout()
        self.twiss = {}
        for plane, sub in (("x", "xx'"), ("y", "yy'"), ("z", "zz'")):
            a, b, e = float_edit(), float_edit(), float_edit()
            self.twiss[plane] = (a, b, e)
            tform.addRow(f"α<sub>{sub}</sub>", a)
            tform.addRow(f"β<sub>{sub}</sub>", with_unit(b, "mm/π mrad"))
            tform.addRow(f"ε<sub>{sub}</sub>", with_unit(e, "π mm mrad"))
        self.btn_ellipse = QPushButton(self.tr("Preview rms ellipses"))
        self.btn_ellipse.clicked.connect(self.plot_phase_ellipse)
        tform.addRow("", self.btn_ellipse)
        twiss.setLayout(tform)
        right.addWidget(twiss)
        right.addStretch(1)

        for a, b, e in self.twiss.values():
            for w in (a, b, e):
                w.editingFinished.connect(self._twiss_changed)

        self._toggle_dst(False)

    # ------------------------------------------------------------------ behaviour
    def _toggle_dst(self, checked):
        self.edit_dst.setEnabled(checked)
        self.btn_dst.setEnabled(checked)
        self.btn_import.setEnabled(checked)

    def _toggle_cw(self, checked):
        for w in self.twiss["z"]:
            if checked:
                w.setText("0")
            w.setEnabled(not checked)

    def _twiss_values(self):
        d = {}
        for plane, (a, b, e) in self.twiss.items():
            d[f"alpha_{plane}"] = safe_float(a.text())
            d[f"beta_{plane}"] = safe_float(b.text())
            d[f"rms_emit_{plane}"] = safe_float(e.text())
        return d

    def _twiss_changed(self):
        if self._ellipse is not None:
            self._ellipse.parameter_changed(self._twiss_values())

    @guarded
    def plot_phase_ellipse(self):
        self._ellipse = PhaseEllipseWidget()
        self._ellipse.initUI()
        self._ellipse.show()
        self._twiss_changed()
        self._ellipse.closed.connect(self._on_ellipse_closed)

    def _on_ellipse_closed(self):
        self._ellipse = None

    @guarded
    def select_dst_file(self):
        if not self.project.is_open:
            return
        target_folder = self.project.input_dir
        path, _ = QFileDialog.getOpenFileName(self, self.tr("Select particle file"), target_folder,
                                              "DST (*.dst);;All files (*)")
        if not path:
            return
        name = split_file(path)[-1]
        target = os.path.join(target_folder, name)
        if file_in_directory(path, target_folder):
            pass  # already inside InputFile
        elif file_in_directory(target, target_folder):
            if QMessageBox.question(self, self.tr("File exists"),
                                    self.tr("A file with this name already exists in InputFile. Overwrite?"),
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No) != QMessageBox.Yes:
                return
            copy_file(path, target_folder)
        else:
            copy_file(path, target_folder)
        self.edit_dst.setText(name)
        log.info("particle file: %s", target)

    @guarded
    def import_beam_parameter(self):
        name = self.edit_dst.text().strip()
        if not name:
            QMessageBox.information(self, self.tr("Beam"), self.tr("Choose a particle file first."))
            return
        res = cal_beam_parameter({"dstPath": self.project.input_file(name)})
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        p = res["data"]["beamParams"]
        r = lambda k: str(round(p[k], self.decimals))  # noqa: E731
        self.edit_mass.setText(str(p.get("particlerestmass")))
        self.edit_current.setText(str(p.get("current")))
        self.edit_number.setText(str(p.get("particlenumber")))
        self.edit_frequency.setText(str(p.get("frequency")))
        self.edit_energy.setText(str(p.get("kneticenergy")))
        for plane, (a, b, e) in self.twiss.items():
            a.setText(r(f"alpha_{plane}"))
            b.setText(r(f"beta_{plane}"))
            e.setText(r(f"emit_{plane}"))
        self.combo_trans.setCurrentText(p.get("distribution_x", "GS"))
        self.combo_longi.setCurrentText(p.get("distribution_y", "GS"))
        log.info("beam parameters imported from %s", name)

    # ------------------------------------------------------------------ load / save
    def clear(self):
        for w in (self.edit_charge, self.edit_mass, self.edit_current, self.edit_number,
                  self.edit_frequency, self.edit_energy, self.edit_dst):
            w.clear()
        for a, b, e in self.twiss.values():
            a.clear(); b.clear(); e.clear()
        self.combo_trans.setCurrentIndex(0)
        self.combo_longi.setCurrentIndex(0)
        self.cb_use_dst.setChecked(False)
        self.cb_cw.setChecked(False)

    def load(self):
        if not self.project.is_open:
            self.clear()
            return
        res = BeamConfig().create_from_file(self.project.item())
        p = res["data"]["beamParams"]
        s = lambda k, d="": "" if p.get(k) is None else str(p.get(k))  # noqa: E731
        self.edit_dst.setText(s("readparticledistribution"))
        self.edit_charge.setText(s("numofcharge"))
        self.edit_mass.setText(s("particlerestmass"))
        self.edit_current.setText(s("current"))
        self.edit_number.setText(s("particlenumber"))
        self.edit_frequency.setText(s("frequency"))
        self.edit_energy.setText(s("kneticenergy"))
        for plane, (a, b, e) in self.twiss.items():
            a.setText(s(f"alpha_{plane}"))
            b.setText(s(f"beta_{plane}"))
            e.setText(s(f"emit_{plane}"))
        self.combo_trans.setCurrentText(s("distribution_x") or "GS")
        self.combo_longi.setCurrentText(s("distribution_y") or "GS")
        self.cb_use_dst.setChecked(safe_int(p.get("use_dst"), 0) == 1)
        self.cb_cw.setChecked(p.get("beamtype") == "dc")

    def values(self):
        d = {
            "readparticledistribution": self.edit_dst.text().strip(),
            "numofcharge": self.edit_charge.text(),
            "particlerestmass": self.edit_mass.text(),
            "current": self.edit_current.text(),
            "particlenumber": self.edit_number.text(),
            "frequency": self.edit_frequency.text(),
            "kneticenergy": self.edit_energy.text(),
            "distribution_x": self.combo_trans.currentText(),
            "distribution_y": self.combo_longi.currentText(),
            "use_dst": 1 if self.cb_use_dst.isChecked() else 0,
            "beamtype": "dc" if self.cb_cw.isChecked() else "notdc",
        }
        for plane, (a, b, e) in self.twiss.items():
            d[f"alpha_{plane}"] = a.text()
            d[f"beta_{plane}"] = b.text()
            d[f"emit_{plane}"] = e.text()
        return d

    def validate(self):
        errors = []
        if not self.edit_charge.text():
            errors.append(self.tr("Beam: charge is missing"))
        if self.cb_use_dst.isChecked() and not self.edit_dst.text().strip():
            errors.append(self.tr("Beam: no particle file selected"))
        if not self.cb_use_dst.isChecked():
            n = safe_int(self.edit_number.text(), 0)
            if n < 2:
                # rms sizes / emittances of a single particle are NaN and every result plot would be empty
                errors.append(self.tr("Beam: multi-particle tracking needs at least 2 particles (currently %d)") % n)
        return errors

    def save(self):
        if not self.project.is_open:
            return
        d = {k: (None if v == "" else v) for k, v in self.values().items()}
        cfg = BeamConfig()
        for k, v in d.items():
            if v is None:
                continue
            if k in cfg.int_keys:
                d[k] = int(v)
            elif k in cfg.float_keys:
                d[k] = float(v)
        cfg.set_param(**d)
        res = cfg.write_to_file(self.project.item())
        if isinstance(res, dict) and res.get("code", 0) != 0:
            raise ValueError(res["data"]["msg"])
