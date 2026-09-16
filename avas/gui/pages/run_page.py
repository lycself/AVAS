"""Run page: start/stop, progress and the outcome of the last run."""
import time

from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWidgets import QGridLayout, QGroupBox, QHBoxLayout, QLabel, QProgressBar, QPushButton, QVBoxLayout, QWidget

from avas.gui.widgets.common import page_header


class RunPage(QWidget):
    run_requested = pyqtSignal()
    stop_requested = pyqtSignal()

    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._t0 = None
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 18, 24, 18)
        root.setSpacing(12)
        root.addWidget(page_header(self.tr("Run"),
                                   self.tr("All pages are saved and checked before the simulation starts. "
                                           "Results are written to OutputFile/ inside the project.")))

        box = QGroupBox(self.tr("Simulation"))
        grid = QGridLayout()
        grid.setHorizontalSpacing(14)
        grid.setVerticalSpacing(8)
        self.lbl_project = QLabel("-")
        self.lbl_mode = QLabel("-")
        self.lbl_output = QLabel("-")
        for r, (name, w) in enumerate(((self.tr("Project"), self.lbl_project),
                                       (self.tr("Mode"), self.lbl_mode),
                                       (self.tr("Output"), self.lbl_output))):
            k = QLabel(name)
            k.setObjectName("muted")
            grid.addWidget(k, r, 0)
            grid.addWidget(w, r, 1)
        grid.setColumnStretch(1, 1)

        btns = QHBoxLayout()
        self.btn_run = QPushButton(self.tr("▶  Run simulation"))
        self.btn_run.setObjectName("primary")
        self.btn_run.setMinimumWidth(180)
        self.btn_run.clicked.connect(self.run_requested)
        self.btn_stop = QPushButton(self.tr("■  Stop"))
        self.btn_stop.setObjectName("danger")
        self.btn_stop.setEnabled(False)
        self.btn_stop.clicked.connect(self.stop_requested)
        btns.addWidget(self.btn_run)
        btns.addWidget(self.btn_stop)
        btns.addStretch(1)
        grid.addLayout(btns, 3, 0, 1, 2)
        box.setLayout(grid)
        root.addWidget(box)

        prog = QGroupBox(self.tr("Progress"))
        pl = QVBoxLayout()
        self.bar = QProgressBar()
        self.bar.setRange(0, 100)
        self.bar.setValue(0)
        pl.addWidget(self.bar)
        stats = QGridLayout()
        self.lbl_length = QLabel("-")
        self.lbl_step = QLabel("-")
        self.lbl_elapsed = QLabel("-")
        self.lbl_state = QLabel(self.tr("idle"))
        self.lbl_state.setObjectName("kpi")
        for c, (name, w) in enumerate(((self.tr("Position"), self.lbl_length), (self.tr("Step"), self.lbl_step),
                                       (self.tr("Elapsed"), self.lbl_elapsed), (self.tr("State"), self.lbl_state))):
            k = QLabel(name)
            k.setObjectName("muted")
            stats.addWidget(k, 0, c)
            stats.addWidget(w, 1, c)
        pl.addLayout(stats)
        prog.setLayout(pl)
        root.addWidget(prog)

        last = QGroupBox(self.tr("Last run"))
        ll = QVBoxLayout()
        self.lbl_last = QLabel("-")
        self.lbl_last.setWordWrap(True)
        ll.addWidget(self.lbl_last)
        last.setLayout(ll)
        root.addWidget(last)
        root.addStretch(1)

    # ------------------------------------------------------------------ state
    def refresh(self, mode_text=""):
        if self.project.is_open:
            self.lbl_project.setText(self.project.path)
            self.lbl_output.setText(self.project.output_dir)
        else:
            self.lbl_project.setText("-")
            self.lbl_output.setText("-")
        self.lbl_mode.setText(mode_text or "-")
        info = self.project.last_run()
        if info:
            parts = [f"{info.get('status', '?')}", info.get("started", ""), info.get("mode") or "basic"]
            if info.get("elapsed_s") is not None:
                parts.append(f"{info['elapsed_s']} s")
            if info.get("error"):
                parts.append(str(info["error"]))
            self.lbl_last.setText("  ·  ".join(str(p) for p in parts if p))
        else:
            self.lbl_last.setText(self.tr("no run recorded for this project"))

    def set_running(self, running):
        self.btn_run.setEnabled(not running and self.project.is_open)
        self.btn_stop.setEnabled(running)
        if running:
            self._t0 = time.time()
            self.bar.setValue(0)
            self.lbl_length.setText("-")
            self.lbl_step.setText("-")
            self.lbl_state.setText(self.tr("running"))
        else:
            self._t0 = None

    def on_progress(self, sched):
        try:
            cur, tot = float(sched["currentLength"]), float(sched["totalLength"])
            self.lbl_length.setText(f"{cur:.3f} / {tot:.3f} m")
            self.lbl_step.setText(f"{sched.get('currentStep', '-')} / {sched.get('allStep', '-')}")
            if tot > 0:
                self.bar.setValue(int(min(cur / tot, 1.0) * 100))
        except (KeyError, TypeError, ValueError):
            pass
        if self._t0:
            self.lbl_elapsed.setText(f"{time.time() - self._t0:.0f} s")

    def on_finished(self, ok, message):
        self.lbl_state.setText(self.tr("finished") if ok else self.tr("failed"))
        if ok:
            self.bar.setValue(100)
        if self._t0:
            self.lbl_elapsed.setText(f"{time.time() - self._t0:.0f} s")
        self.set_running(False)
        self.refresh(self.lbl_mode.text())
