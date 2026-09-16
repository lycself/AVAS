"""Run page: start/stop, live progress and the outcome of the last run."""
import time

from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import QGridLayout, QGroupBox, QHBoxLayout, QLabel, QProgressBar, QPushButton, QVBoxLayout, QWidget

from avas.gui import icons
from avas.gui.widgets.common import page_header


def _stat(caption):
    """A small 'caption over value' block used in the inline statistics row."""
    box = QWidget()
    lay = QVBoxLayout(box)
    lay.setContentsMargins(0, 0, 0, 0)
    lay.setSpacing(1)
    cap = QLabel(caption)
    cap.setObjectName("soft")
    val = QLabel("–")
    val.setObjectName("kpi")
    lay.addWidget(cap)
    lay.addWidget(val)
    return box, val


def fmt_seconds(s):
    if s is None:
        return "–"
    s = int(round(s))
    if s < 60:
        return f"{s} s"
    m, s = divmod(s, 60)
    if m < 60:
        return f"{m} min {s:02d} s"
    h, m = divmod(m, 60)
    return f"{h} h {m:02d} min"


class RunPage(QWidget):
    run_requested = pyqtSignal()
    stop_requested = pyqtSignal()

    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._running = False
        self._build()

    # ------------------------------------------------------------------ ui
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(8)

        # header: title left, primary actions right
        head = QHBoxLayout()
        head.setSpacing(8)
        head.addWidget(page_header(self.tr("Run"),
                                   self.tr("All pages are saved and checked before the simulation starts. "
                                           "Results are written to OutputFile/ inside the project.")), 1)
        self.btn_run = QPushButton(self.tr("Run simulation"))
        self.btn_run.setObjectName("primary")
        icons.bind(self.btn_run, "play", "on_accent")
        self.btn_run.setMinimumWidth(160)
        self.btn_run.clicked.connect(self.run_requested)
        self.btn_stop = QPushButton(self.tr("Stop"))
        self.btn_stop.setObjectName("danger")
        icons.bind(self.btn_stop, "debug-stop", "danger")
        self.btn_stop.setEnabled(False)
        self.btn_stop.clicked.connect(self.stop_requested)
        head.addWidget(self.btn_run, 0, Qt.AlignTop)
        head.addWidget(self.btn_stop, 0, Qt.AlignTop)
        root.addLayout(head)

        # meta: project / mode / output
        meta = QGridLayout()
        meta.setHorizontalSpacing(16)
        meta.setVerticalSpacing(4)
        self.lbl_project = QLabel("–")
        self.lbl_mode = QLabel("–")
        self.lbl_output = QLabel("–")
        for r, (name, w) in enumerate(((self.tr("Project"), self.lbl_project),
                                       (self.tr("Mode"), self.lbl_mode),
                                       (self.tr("Output"), self.lbl_output))):
            k = QLabel(name)
            k.setObjectName("muted")
            w.setTextInteractionFlags(Qt.TextSelectableByMouse)
            meta.addWidget(k, r, 0)
            meta.addWidget(w, r, 1)
        meta.setColumnStretch(1, 1)
        root.addLayout(meta)

        # progress section
        prog = QGroupBox(self.tr("Progress"))
        pl = QVBoxLayout()
        pl.setSpacing(8)
        top = QHBoxLayout()
        self.lbl_state = QLabel(self.tr("idle"))
        self.lbl_state.setObjectName("stateIdle")
        self.lbl_percent = QLabel("")
        self.lbl_percent.setObjectName("kpi")
        top.addWidget(self.lbl_state)
        top.addStretch(1)
        top.addWidget(self.lbl_percent)
        pl.addLayout(top)
        self.bar = QProgressBar()
        self.bar.setRange(0, 1000)
        self.bar.setValue(0)
        self.bar.setTextVisible(False)
        pl.addWidget(self.bar)

        stats = QHBoxLayout()
        stats.setSpacing(32)
        box, self.lbl_length = _stat(self.tr("Position"))
        stats.addWidget(box)
        box, self.lbl_step = _stat(self.tr("Step"))
        stats.addWidget(box)
        box, self.lbl_elapsed = _stat(self.tr("Elapsed"))
        stats.addWidget(box)
        box, self.lbl_eta = _stat(self.tr("Remaining"))
        stats.addWidget(box)
        stats.addStretch(1)
        pl.addLayout(stats)

        self.lbl_engine = QLabel("")
        self.lbl_engine.setObjectName("mono")
        self.lbl_engine.setTextInteractionFlags(Qt.TextSelectableByMouse)
        pl.addWidget(self.lbl_engine)
        prog.setLayout(pl)
        root.addWidget(prog)

        # last run section
        last = QGroupBox(self.tr("Last run"))
        ll = QHBoxLayout()
        ll.setSpacing(8)
        self.lbl_last_badge = QLabel("")
        self.lbl_last_badge.setObjectName("badge")
        self.lbl_last = QLabel("–")
        self.lbl_last.setWordWrap(True)
        self.lbl_last.setTextInteractionFlags(Qt.TextSelectableByMouse)
        ll.addWidget(self.lbl_last_badge, 0, Qt.AlignTop)
        ll.addWidget(self.lbl_last, 1)
        last.setLayout(ll)
        root.addWidget(last)
        root.addStretch(1)

    # ------------------------------------------------------------------ state
    def refresh(self, mode_text=""):
        if self.project.is_open:
            self.lbl_project.setText(self.project.path)
            self.lbl_output.setText(self.project.output_dir)
        else:
            self.lbl_project.setText("–")
            self.lbl_output.setText("–")
        self.lbl_mode.setText(mode_text or "–")
        info = self.project.last_run()
        if info:
            status = str(info.get("status", "?"))
            self.lbl_last_badge.setText(self._status_text(status))
            self.lbl_last_badge.setObjectName({"finished": "badgeSuccess", "failed": "badgeDanger",
                                               "running": "badgeAccent"}.get(status, "badge"))
            self._repolish(self.lbl_last_badge)
            parts = [info.get("started", ""), info.get("mode") or "basic"]
            if info.get("elapsed_s") is not None:
                parts.append(fmt_seconds(info["elapsed_s"]))
            if info.get("error"):
                parts.append(str(info["error"]))
            self.lbl_last.setText("   ·   ".join(str(p) for p in parts if p))
            self.lbl_last_badge.setVisible(True)
        else:
            self.lbl_last_badge.setVisible(False)
            self.lbl_last.setText(self.tr("no run recorded for this project"))

    def _status_text(self, status):
        return {"finished": self.tr("finished"), "failed": self.tr("failed"), "running": self.tr("running"),
                "stopped": self.tr("stopped")}.get(status, status)

    @staticmethod
    def _repolish(widget):
        widget.style().unpolish(widget)
        widget.style().polish(widget)

    def _set_state(self, text, name):
        self.lbl_state.setText(text)
        self.lbl_state.setObjectName(name)
        self._repolish(self.lbl_state)

    def set_running(self, running):
        self._running = running
        self.btn_run.setEnabled(not running and self.project.is_open)
        self.btn_stop.setEnabled(running)
        if running:
            self.bar.setValue(0)
            self.lbl_percent.setText("0 %")
            for w in (self.lbl_length, self.lbl_step, self.lbl_eta):
                w.setText("–")
            self.lbl_elapsed.setText("0 s")
            self.lbl_engine.setText(self.tr("waiting for the engine..."))
            self._set_state(self.tr("running"), "stateRunning")

    def on_progress(self, state):
        pct = float(state.get("percent") or 0.0)
        self.bar.setValue(int(pct * 10))
        self.lbl_percent.setText(f"{pct:.1f} %")
        pos = state.get("pos_m")
        self.lbl_length.setText(f"{pos:.3f} m" if pos is not None else "–")
        step, all_step = state.get("step"), state.get("all_step")
        self.lbl_step.setText(f"{step} / {all_step}" if step is not None and all_step else "–")
        self.lbl_elapsed.setText(fmt_seconds(state.get("elapsed_s")))
        self.lbl_eta.setText(fmt_seconds(state.get("eta_s")))
        if state.get("line"):
            self.lbl_engine.setText(state["line"])

    def on_finished(self, ok, message):
        if ok:
            self.bar.setValue(1000)
            self.lbl_percent.setText("100 %")
            self.lbl_eta.setText("0 s")
            self._set_state(self.tr("finished"), "stateOk")
        elif message == "stopped by user":
            self._set_state(self.tr("stopped"), "stateIdle")
        else:
            self._set_state(self.tr("failed"), "stateFail")
            self.lbl_engine.setText(message)
        self.set_running(False)
        self.refresh(self.lbl_mode.text())

    def summary_line(self, state):
        """One-line progress text for the status bar."""
        pct = float(state.get("percent") or 0.0)
        parts = [f"{pct:.0f} %"]
        if state.get("step") is not None and state.get("all_step"):
            parts.append(f"{state['step']}/{state['all_step']}")
        if state.get("eta_s") is not None:
            parts.append(self.tr("%s left") % fmt_seconds(state["eta_s"]))
        return self.tr("Simulation running") + "  ·  " + "  ·  ".join(parts)
