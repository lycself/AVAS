"""Lattice page: the lattice file used for the run, as text and as physical parameters.

The drop-down chooses which AVAS lattice of InputFile/ the run uses (stored as
``[lattice] source`` in ini.ini, see :mod:`avas.paths`); the text editor and
the structure editor on the right show the same document.
"""
import logging
import os

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (QComboBox, QHBoxLayout, QLabel, QMessageBox, QPushButton, QSizePolicy, QSplitter,
                             QVBoxLayout, QWidget)

from avas.data.filekinds import lattice_files
from avas.gui.lattice_editor.lattice_ide import CodeEditorWithLineNumbers
from avas.gui.lattice_editor.structure_editor import StructureEditor
from avas.gui.widgets.common import guarded, page_header

log = logging.getLogger("avas.gui")


def read_text(path):
    with open(path, "rb") as fh:
        raw = fh.read()
    for enc in ("utf-8-sig", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


class LatticePage(QWidget):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._loaded_text = ""
        self._loaded_name = None
        self._switching = False
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(10)
        root.addWidget(page_header(self.tr("Lattice"),
                                   self.tr("The lattice file used for the run. Edit it as text on the left or by "
                                           "physical parameters on the right; both show the same file. Parameter "
                                           "meanings and checks follow the user manual.")))

        bar = QHBoxLayout()
        bar.setSpacing(8)
        lab = QLabel(self.tr("Lattice used for the run"))
        lab.setObjectName("muted")
        bar.addWidget(lab)
        self.combo = QComboBox()
        self.combo.setMinimumWidth(260)
        self.combo.setToolTip(self.tr("Every AVAS-format lattice found in InputFile/. The choice is stored in "
                                      "ini.ini and used by the GUI and by 'avas run'."))
        self.combo.activated.connect(self._on_combo)
        bar.addWidget(self.combo)
        self.lbl_file = QLabel("")
        self.lbl_file.setObjectName("soft")
        self.lbl_file.setSizePolicy(QSizePolicy.Ignored, QSizePolicy.Preferred)   # long paths must not widen the page
        bar.addWidget(self.lbl_file, 1)
        self.btn_apply = QPushButton(self.tr("Save"))
        self.btn_apply.setObjectName("primary")
        self.btn_apply.setToolTip(self.tr("Save the lattice file (Ctrl+S saves all pages)"))
        self.btn_apply.clicked.connect(self.apply)
        bar.addWidget(self.btn_apply)
        root.addLayout(bar)

        split = QSplitter(Qt.Horizontal)
        self.editor = CodeEditorWithLineNumbers()
        split.addWidget(self.editor)
        self.structure = StructureEditor()
        self.structure.attach(self.editor)
        split.addWidget(self.structure)
        split.setStretchFactor(0, 2)
        split.setStretchFactor(1, 3)
        split.setSizes([420, 680])
        root.addWidget(split, 1)
        self.editor.editor.textChanged.connect(self._update_dirty_mark)

    # ------------------------------------------------------------------ data
    def _fill_combo(self):
        active = self.project.lattice_name()
        names = lattice_files(self.project.input_dir)
        if active not in names:
            names.insert(0, active)
        self.combo.blockSignals(True)
        self.combo.clear()
        for n in names:
            missing = not os.path.isfile(self.project.input_file(n))
            self.combo.addItem(n + (self.tr("  (missing)") if missing else ""), n)
        self.combo.setCurrentIndex(max(0, self.combo.findData(active)))
        self.combo.blockSignals(False)

    def load(self):
        if not self.project.is_open:
            self.combo.clear()
            self._set_text("")
            self.lbl_file.setText("")
            self._loaded_name = None
            return
        self._fill_combo()
        path = self.project.lattice_path()
        self._loaded_name = self.project.lattice_name()
        self.lbl_file.setText(path)
        self.lbl_file.setToolTip(path)
        self.structure.set_field_dirs(self.project.field_dirs())
        self._set_text(read_text(path) if os.path.isfile(path) else "")

    def _set_text(self, text):
        self.editor.setPlainText(text)
        self._loaded_text = self.editor.toPlainText()      # normalised line endings
        self.structure.reparse()
        self._update_dirty_mark()

    def is_dirty(self):
        return self.project.is_open and self.editor.toPlainText() != self._loaded_text

    def _update_dirty_mark(self):
        name = self._loaded_name or ""
        idx = self.combo.findData(name)
        if idx >= 0:
            self.combo.setItemText(idx, name + (" •" if self.is_dirty() else ""))

    def save(self):
        if not self.project.is_open or self._loaded_name is None:
            return
        text = self.editor.toPlainText()
        if text and not text.endswith("\n"):
            text += "\n"
        with open(self.project.input_file(self._loaded_name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        self._loaded_text = self.editor.toPlainText()
        self._update_dirty_mark()

    @guarded
    def apply(self):
        self.save()
        log.info("lattice saved: %s", self._loaded_name)

    def _on_combo(self, _index):
        name = self.combo.currentData()
        if not name or name == self._loaded_name:
            return
        if self.is_dirty():
            reply = QMessageBox.question(self, self.tr("Unsaved changes"),
                                         self.tr("Save changes to %s?") % self._loaded_name,
                                         QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel, QMessageBox.Save)
            if reply == QMessageBox.Cancel:
                self.combo.setCurrentIndex(self.combo.findData(self._loaded_name))
                return
            if reply == QMessageBox.Save:
                self.save()
        self.switch_to(name)

    @guarded
    def switch_to(self, name):
        """Use *name* (a file in InputFile/) as the lattice of the run and load it."""
        self._switching = True
        try:
            self.project.set_lattice_name(name)
        finally:
            self._switching = False
        self.load()
        log.info("lattice used for the run: %s", name)

    def on_lattice_changed(self, name):
        """Another page switched the lattice file, or saved the current one."""
        if self._switching:
            return
        if name == self._loaded_name:
            # the same file was written elsewhere (Files page)
            if self.is_dirty():
                log.warning("%s was saved on the Files page, but the Lattice page has unsaved edits of it; "
                            "the Lattice page was not reloaded", name)
                return
            self.load()
            return
        if self.is_dirty() and self._loaded_name and os.path.isfile(self.project.input_file(self._loaded_name)):
            self.save()
            log.info("saved %s before switching the lattice", self._loaded_name)
        self.load()

    def validate(self):
        if self.project.is_open and not self.editor.toPlainText().strip():
            return [self.tr("Lattice: %s is empty") % (self._loaded_name or "")]
        return []
