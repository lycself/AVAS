"""Project page: create / open / recent projects and a summary of the current one."""
import os

from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import (QGridLayout, QGroupBox, QHBoxLayout, QLabel, QListWidget, QListWidgetItem,
                             QPushButton, QVBoxLayout, QWidget)

from avas.gui.widgets.common import page_header


class ProjectPage(QWidget):
    open_requested = pyqtSignal(str)   # "" = show a directory dialog
    new_requested = pyqtSignal()

    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 18, 24, 18)
        root.setSpacing(12)
        root.addWidget(page_header(self.tr("Project"),
                                   self.tr("An AVAS project is a directory with InputFile/ (beam, lattice, settings) "
                                           "and OutputFile/ (results).")))

        cols = QHBoxLayout()
        cols.setSpacing(16)
        root.addLayout(cols, 1)

        left = QVBoxLayout()
        cols.addLayout(left, 1)
        actions = QGroupBox(self.tr("Start"))
        al = QHBoxLayout()
        self.btn_new = QPushButton(self.tr("New project..."))
        self.btn_new.setObjectName("primary")
        self.btn_new.clicked.connect(self.new_requested)
        self.btn_open = QPushButton(self.tr("Open project..."))
        self.btn_open.clicked.connect(lambda: self.open_requested.emit(""))
        al.addWidget(self.btn_new)
        al.addWidget(self.btn_open)
        al.addStretch(1)
        actions.setLayout(al)
        left.addWidget(actions)

        recent = QGroupBox(self.tr("Recent projects"))
        rl = QVBoxLayout()
        self.list_recent = QListWidget()
        self.list_recent.itemDoubleClicked.connect(self._open_recent)
        self.list_recent.setMinimumHeight(160)
        rl.addWidget(self.list_recent)
        hint = QLabel(self.tr("Double-click to open"))
        hint.setObjectName("muted")
        rl.addWidget(hint)
        recent.setLayout(rl)
        left.addWidget(recent, 1)

        right = QVBoxLayout()
        cols.addLayout(right, 1)
        summary = QGroupBox(self.tr("Current project"))
        grid = QGridLayout()
        grid.setHorizontalSpacing(14)
        grid.setVerticalSpacing(8)
        self.lbl_path = QLabel("-")
        self.lbl_path.setWordWrap(True)
        self.lbl_path.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.lbl_inputs = QLabel("-")
        self.lbl_outputs = QLabel("-")
        self.lbl_last = QLabel("-")
        self.lbl_last.setWordWrap(True)
        rows = ((self.tr("Path"), self.lbl_path), (self.tr("Input files"), self.lbl_inputs),
                (self.tr("Output files"), self.lbl_outputs), (self.tr("Last run"), self.lbl_last))
        for r, (name, w) in enumerate(rows):
            k = QLabel(name)
            k.setObjectName("muted")
            k.setAlignment(Qt.AlignTop)
            grid.addWidget(k, r, 0)
            grid.addWidget(w, r, 1)
        grid.setColumnStretch(1, 1)
        summary.setLayout(grid)
        right.addWidget(summary)
        right.addStretch(1)

    def _open_recent(self, item):
        self.open_requested.emit(item.data(Qt.UserRole))

    def refresh(self):
        self.list_recent.clear()
        for p in self.project.recent():
            it = QListWidgetItem(f"{os.path.basename(p)}    {p}")
            it.setData(Qt.UserRole, p)
            it.setToolTip(p)
            self.list_recent.addItem(it)

        if not self.project.is_open:
            for w in (self.lbl_path, self.lbl_inputs, self.lbl_outputs, self.lbl_last):
                w.setText("-")
            return
        self.lbl_path.setText(self.project.path)
        present = []
        for name in ("beam.txt", "input.txt", "lattice_mulp.txt", "ini.ini"):
            ok = os.path.isfile(self.project.input_file(name))
            present.append(f"{'✓' if ok else '✗'} {name}")
        self.lbl_inputs.setText("    ".join(present))
        outs = self.project.output_files()
        self.lbl_outputs.setText(self.tr("%d files") % len(outs) if outs else self.tr("none yet"))
        info = self.project.last_run()
        if info:
            self.lbl_last.setText(f"{info.get('status', '?')}  ·  {info.get('started', '')}  ·  {info.get('mode') or 'basic'}")
        else:
            self.lbl_last.setText("-")
