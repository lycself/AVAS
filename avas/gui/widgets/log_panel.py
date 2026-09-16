"""Bottom log panel fed by the ``avas`` logger."""
import logging
import time

from PyQt5.QtCore import QObject, pyqtSignal
from PyQt5.QtWidgets import QHBoxLayout, QPlainTextEdit, QPushButton, QVBoxLayout, QWidget

COLORS = {
    logging.DEBUG: "#6b7280",
    logging.INFO: "#111827",
    logging.WARNING: "#b45309",
    logging.ERROR: "#b91c1c",
    logging.CRITICAL: "#b91c1c",
}


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
    def __init__(self, parent=None):
        super().__init__(parent)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(4, 2, 4, 4)
        lay.setSpacing(2)
        self.view = QPlainTextEdit()
        self.view.setObjectName("log")
        self.view.setReadOnly(True)
        self.view.setMaximumBlockCount(5000)
        lay.addWidget(self.view)

        bar = QHBoxLayout()
        bar.addStretch(1)
        clear = QPushButton(self.tr("Clear"))
        clear.setObjectName("flat")
        clear.clicked.connect(self.view.clear)
        bar.addWidget(clear)
        lay.addLayout(bar)

        self.handler = QtLogHandler()
        self.handler.setLevel(logging.INFO)
        self.handler.setFormatter(logging.Formatter("%(message)s"))
        self.handler.bridge.record.connect(self.append)
        root = logging.getLogger("avas")
        root.setLevel(min(root.level or logging.INFO, logging.INFO))
        root.addHandler(self.handler)

    def append(self, level, text):
        color = COLORS.get(level, COLORS[logging.INFO])
        stamp = time.strftime("%H:%M:%S")
        safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br>")
        self.view.appendHtml(f'<span style="color:#9ca3af">{stamp}</span> <span style="color:{color}">{safe}</span>')

    def detach(self):
        logging.getLogger("avas").removeHandler(self.handler)
