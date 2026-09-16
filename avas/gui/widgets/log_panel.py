"""Bottom panel with the log, fed by the ``avas`` logger (VS Code "Panel" style).

Layout::

    LOG ▔▔▔                                   [clear] [maximize] [close]
    12:01:03 project opened: ...

The panel is shown/hidden as a whole (``Ctrl+J`` or the close button); the
status bar keeps showing the latest message and the error/warning counts.
Records are kept so the text can be recoloured when the theme changes.
"""
import collections
import logging
import time

from PyQt5.QtCore import QObject, QSize, Qt, pyqtSignal
from PyQt5.QtGui import QPainter
from PyQt5.QtWidgets import (QHBoxLayout, QLabel, QPlainTextEdit, QStyle, QStyleOption, QToolButton,
                             QVBoxLayout, QWidget)

from avas.gui import icons, theme

LEVEL_TOKENS = {
    logging.DEBUG: "log_debug",
    logging.INFO: "log_info",
    logging.WARNING: "log_warning",
    logging.ERROR: "log_error",
    logging.CRITICAL: "log_error",
}

HEADER_HEIGHT = 35
MAX_RECORDS = 5000


class _Bridge(QObject):
    record = pyqtSignal(int, str)


class QtLogHandler(logging.Handler):
    """logging.Handler that forwards records to the GUI thread via a signal."""

    def __init__(self):
        super().__init__()
        self.bridge = _Bridge()

    def emit(self, record):
        try:
            self.bridge.record.emit(record.levelno, self.format(record))
        except RuntimeError:
            pass  # widget already destroyed


class LogPanel(QWidget):
    visibility_requested = pyqtSignal(bool)    # False: the close button was pressed
    maximize_requested = pyqtSignal(bool)
    message = pyqtSignal(int, str)             # level, first line - for the status bar
    counts_changed = pyqtSignal(int, int)      # errors, warnings

    def paintEvent(self, event):  # noqa: N802 (Qt naming)
        """A QWidget *subclass* only paints a style-sheet background if it asks the style to."""
        opt = QStyleOption()
        opt.initFrom(self)
        painter = QPainter(self)
        self.style().drawPrimitive(QStyle.PE_Widget, opt, painter, self)
        super().paintEvent(event)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("logPanel")
        self._errors = 0
        self._warnings = 0
        self._maximized = False
        self._records = collections.deque(maxlen=MAX_RECORDS)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)

        # ---- header ---------------------------------------------------------------
        self.header = QWidget()
        self.header.setObjectName("logHeader")
        hl = QHBoxLayout(self.header)
        hl.setContentsMargins(12, 0, 8, 0)
        hl.setSpacing(2)
        self.lbl_title = QLabel(self.tr("Log").upper())
        self.lbl_title.setObjectName("logTitle")
        hl.addWidget(self.lbl_title, 0, Qt.AlignBottom)
        hl.addStretch(1)
        self.btn_clear = self._tool_button("clear-all", self.tr("Clear log"), self.clear)
        self.btn_max = self._tool_button("chevron-up", self.tr("Maximize panel"),
                                         lambda: self.maximize_requested.emit(not self._maximized))
        self.btn_close = self._tool_button("close", self.tr("Hide panel (Ctrl+J)"),
                                           lambda: self.visibility_requested.emit(False))
        for b in (self.btn_clear, self.btn_max, self.btn_close):
            hl.addWidget(b)
        lay.addWidget(self.header)

        # ---- messages -------------------------------------------------------------
        self.view = QPlainTextEdit()
        self.view.setObjectName("log")
        self.view.setReadOnly(True)
        self.view.setMaximumBlockCount(MAX_RECORDS)
        self.view.setFrameShape(QPlainTextEdit.NoFrame)
        lay.addWidget(self.view, 1)

        self.handler = QtLogHandler()
        self.handler.setLevel(logging.INFO)
        self.handler.setFormatter(logging.Formatter("%(message)s"))
        self.handler.bridge.record.connect(self.append)
        root = logging.getLogger("avas")
        root.setLevel(min(root.level or logging.INFO, logging.INFO))
        root.addHandler(self.handler)

        theme.notifier().changed.connect(self._on_theme)
        self._on_theme()

    def _tool_button(self, icon_name, tip, slot):
        b = QToolButton()
        b.setObjectName("panelButton")
        b.setToolTip(tip)
        b.setCursor(Qt.PointingHandCursor)
        b.setAutoRaise(True)
        icons.bind(b, icon_name)
        b.clicked.connect(slot)
        return b

    # ------------------------------------------------------------------ messages
    def _html(self, stamp, level, text):
        color = theme.color(LEVEL_TOKENS.get(level, "log_info"))
        safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br>")
        return (f'<span style="color:{theme.color("log_time")}">{stamp}</span> '
                f'<span style="color:{color}">{safe}</span>')

    def append(self, level, text):
        stamp = time.strftime("%H:%M:%S")
        self._records.append((stamp, level, text))
        self.view.appendHtml(self._html(stamp, level, text))
        if level >= logging.ERROR:
            self._errors += 1
        elif level >= logging.WARNING:
            self._warnings += 1
        if level >= logging.WARNING:
            self.counts_changed.emit(self._errors, self._warnings)
        first = text.strip().splitlines()[0] if text.strip() else ""
        self.message.emit(level, first)

    def counts(self):
        return self._errors, self._warnings

    def clear(self):
        self.view.clear()
        self._records.clear()
        self._errors = 0
        self._warnings = 0
        self.counts_changed.emit(0, 0)
        self.message.emit(logging.INFO, "")

    def _rerender(self):
        bar = self.view.verticalScrollBar()
        at_end = bar.value() >= bar.maximum() - 2
        self.view.clear()
        for record in self._records:
            self.view.appendHtml(self._html(*record))
        if at_end:
            bar.setValue(bar.maximum())

    def _on_theme(self):
        self.header.setFixedHeight(theme.px(HEADER_HEIGHT))
        size = QSize(theme.px(16), theme.px(16))
        for b in (self.btn_clear, self.btn_max, self.btn_close):
            b.setIconSize(size)
        self._rerender()

    # ------------------------------------------------------------------ maximize
    def set_maximized(self, maximized):
        self._maximized = bool(maximized)
        icons.bind(self.btn_max, "chevron-down" if maximized else "chevron-up")
        self.btn_max.setToolTip(self.tr("Restore panel size") if maximized else self.tr("Maximize panel"))

    def is_maximized(self):
        return self._maximized

    def detach(self):
        logging.getLogger("avas").removeHandler(self.handler)
