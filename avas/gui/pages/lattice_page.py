"""Lattice page: text editor for ``lattice_mulp.txt`` with the element table beside it."""
import logging

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (QHBoxLayout, QHeaderView, QLabel, QPushButton, QSplitter, QTableWidget,
                             QTableWidgetItem, QVBoxLayout, QWidget)

import avas.constants as global_varible
from avas.data.latticeparameter import LatticeParameter
from avas.gui.lattice_editor.lattice_ide import CodeEditorWithLineNumbers
from avas.gui.widgets.common import guarded, page_header
from avas.utils.latticeconfig import LatticeConfig

log = logging.getLogger("avas.gui")


class LatticePage(QWidget):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self.decimals = 5
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 18, 24, 18)
        root.setSpacing(10)
        root.addWidget(page_header(self.tr("Lattice"),
                                   self.tr("Edit lattice_mulp.txt on the left; the element table on the right is "
                                           "rebuilt from the saved file.")))

        bar = QHBoxLayout()
        self.lbl_file = QLabel("")
        self.lbl_file.setObjectName("muted")
        bar.addWidget(self.lbl_file, 1)
        self.btn_apply = QPushButton(self.tr("Save && update table"))
        self.btn_apply.clicked.connect(self.apply)
        bar.addWidget(self.btn_apply)
        root.addLayout(bar)

        split = QSplitter(Qt.Horizontal)
        self.editor = CodeEditorWithLineNumbers()
        split.addWidget(self.editor)

        table_box = QWidget()
        tl = QVBoxLayout(table_box)
        tl.setContentsMargins(0, 0, 0, 0)
        phi = global_varible.greek_letters_upper["phi"]
        self.headers = ["#", self.tr("Type"), self.tr("Length (m)"), f"{phi} RF (deg)", f"{phi} synch. (deg)",
                        "W (MeV)", self.tr("End (m)"), f"{phi} abs (deg)"]
        self.table = QTableWidget(0, len(self.headers))
        self.table.setHorizontalHeaderLabels(self.headers)
        hdr = self.table.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.ResizeToContents)
        hdr.setStretchLastSection(True)
        hdr.setMinimumSectionSize(48)
        self.table.verticalHeader().setVisible(False)
        self.table.setAlternatingRowColors(True)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.lbl_summary = QLabel("")
        self.lbl_summary.setObjectName("muted")
        tl.addWidget(self.table, 1)
        tl.addWidget(self.lbl_summary)
        split.addWidget(table_box)
        split.setStretchFactor(0, 1)
        split.setStretchFactor(1, 1)
        root.addWidget(split, 1)

    # ------------------------------------------------------------------ data
    def load(self):
        if not self.project.is_open:
            self.editor.setPlainText("")
            self.table.setRowCount(0)
            self.lbl_file.setText("")
            self.lbl_summary.setText("")
            return
        path = self.project.input_file("lattice_mulp.txt")
        self.lbl_file.setText(path)
        res = LatticeConfig().create_from_file(self.project.item())
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])
        self.editor.setPlainText(res["data"]["latticeParams"])
        self.refresh_table()

    def save(self):
        if not self.project.is_open:
            return
        cfg = LatticeConfig()
        cfg.set_param({"latticeInfo": self.editor.toPlainText()})
        item = dict(self.project.item(), sim_type="mulp")
        res = cfg.write_to_file(item)
        if res["code"] != 0:
            raise ValueError(res["data"]["msg"])

    @guarded
    def apply(self):
        self.save()
        self.refresh_table()
        log.info("lattice saved")

    def refresh_table(self):
        self.table.setRowCount(0)
        try:
            obj = LatticeParameter(self.project.input_file("lattice_mulp.txt"))
            obj.get_parameter()
        except Exception as exc:  # noqa: BLE001 - table is informational
            self.lbl_summary.setText(self.tr("Cannot parse lattice: %s") % exc)
            return
        names = obj.v_name
        self.table.setRowCount(len(names))
        total = 0.0
        for i, name in enumerate(names):
            end = obj.v_start[i] + obj.v_len[i]
            total = max(total, end)
            phi_syn = obj.phi_syn[i] if i < len(obj.phi_syn) else ""
            row = [str(i + 1), name, self._fmt(obj.v_len[i]), "", str(phi_syn), "", self._fmt(end), ""]
            for c, val in enumerate(row):
                it = QTableWidgetItem(val)
                if c != 1:
                    it.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                self.table.setItem(i, c, it)
        self.lbl_summary.setText(self.tr("%d elements, total length %s m") % (len(names), self._fmt(total)))

    def _fmt(self, num):
        try:
            num = float(num)
        except (TypeError, ValueError):
            return str(num)
        if 0 < abs(num) <= 1e-5:
            return f"{num:e}"
        return str(round(num, self.decimals))

    def validate(self):
        if self.project.is_open and not self.editor.toPlainText().strip():
            return [self.tr("Lattice: lattice_mulp.txt is empty")]
        return []
