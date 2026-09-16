"""VS Code style status bar.

Left:  project name (opens the Project page) · run mode · error/warning counts
       (open the log panel).
Right: latest message or live run progress · theme toggle.

While a simulation runs the whole bar turns accent-coloured, like VS Code
does while debugging.
"""
import logging

from PyQt5.QtCore import QSize, Qt, pyqtSignal
from PyQt5.QtWidgets import QLabel, QSizePolicy, QStatusBar, QToolButton

from avas.gui import icons, theme


class StatusBar(QStatusBar):
    project_clicked = pyqtSignal()
    problems_clicked = pyqtSignal()
    theme_toggle_clicked = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setSizeGripEnabled(False)
        self._running = False
        self._errors = 0
        self._warnings = 0

        self.btn_project = self._item("root-folder", self.project_clicked)
        self.btn_mode = self._item("beaker", None)
        self.btn_errors = self._item("error", self.problems_clicked)
        self.btn_warnings = self._item("warning", self.problems_clicked)
        tip = self.tr("Errors and warnings in the log (click to show the log)")
        self.btn_errors.setToolTip(tip)
        self.btn_warnings.setToolTip(tip)
        self.addWidget(self.btn_project)
        self.addWidget(self.btn_mode)
        self.addWidget(self.btn_errors)
        self.addWidget(self.btn_warnings)

        self.lbl_message = QLabel("")
        self.lbl_message.setObjectName("statusText")
        self.lbl_message.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.lbl_message.setSizePolicy(QSizePolicy.Ignored, QSizePolicy.Preferred)   # never widen the window
        self.btn_progress = self._item("loading", None)
        self.btn_progress.setVisible(False)
        self.btn_theme = self._item("color-mode", self.theme_toggle_clicked)
        self.addPermanentWidget(self.lbl_message, 1)
        self.addPermanentWidget(self.btn_progress)
        self.addPermanentWidget(self.btn_theme)

        self.set_project("", "")
        self.set_mode("")
        self.set_counts(0, 0)
        theme.notifier().changed.connect(self._on_theme)
        self._on_theme()

    def _item(self, icon_name, signal):
        b = QToolButton()
        b.setObjectName("statusItem")
        b.setToolButtonStyle(Qt.ToolButtonTextBesideIcon)
        b.setAutoRaise(True)
        b.setFocusPolicy(Qt.NoFocus)
        b.setProperty("iconName", icon_name)
        if signal is not None:
            b.setCursor(Qt.PointingHandCursor)
            b.clicked.connect(signal)
        return b

    def _bind_icons(self):
        role = "on_accent" if self._running else "icon"
        icons.bind(self.btn_project, "root-folder", role)
        icons.bind(self.btn_mode, "beaker", role)
        icons.bind(self.btn_errors, "error", role)
        icons.bind(self.btn_warnings, "warning", role)
        icons.bind(self.btn_theme, "color-mode", role)
        if self._running:
            icons.bind(self.btn_progress, "loading", "on_accent", spin=True)
        else:
            icons.unbind(self.btn_progress)

    def _on_theme(self):
        size = QSize(theme.px(14), theme.px(14))
        for b in (self.btn_project, self.btn_mode, self.btn_errors, self.btn_warnings, self.btn_progress,
                  self.btn_theme):
            b.setIconSize(size)
        self._bind_icons()
        dark = theme.is_dark()
        self.btn_theme.setToolTip(self.tr("Switch to light theme") if dark else self.tr("Switch to dark theme"))

    # ------------------------------------------------------------------ content
    def set_project(self, name, path):
        self.btn_project.setText(name or self.tr("No project"))
        self.btn_project.setToolTip(path or self.tr("Open or create a project"))

    def set_mode(self, text):
        self.btn_mode.setText(text)
        self.btn_mode.setVisible(bool(text))

    def set_counts(self, errors, warnings):
        self._errors, self._warnings = errors, warnings
        self.btn_errors.setText(str(errors))
        self.btn_warnings.setText(str(warnings))

    def show_message(self, text, level=logging.INFO):
        """Latest log line; ignored while a run is reporting progress."""
        if self._running:
            return
        self._set_text(text, error=level >= logging.ERROR)

    def set_text(self, text, error=False):
        self._set_text(text, error)

    def _set_text(self, text, error=False):
        self.lbl_message.setText(text)
        self.lbl_message.setToolTip(text)
        self.lbl_message.setProperty("error", bool(error) and not self._running)
        self._repolish(self.lbl_message)

    def set_running(self, running, text=""):
        self._running = bool(running)
        self.setProperty("running", self._running)
        self.btn_progress.setVisible(self._running)
        self._bind_icons()
        self._repolish(self)
        for child in self.findChildren(QToolButton) + self.findChildren(QLabel):
            self._repolish(child)
        self._set_text(text)

    def set_progress(self, text):
        if self._running:
            self._set_text(text)

    def is_running(self):
        return self._running

    @staticmethod
    def _repolish(widget):
        widget.style().unpolish(widget)
        widget.style().polish(widget)
        widget.update()
