"""Embedded matplotlib plots in closable tabs."""
import logging
import traceback

import matplotlib
matplotlib.use("Qt5Agg")
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas  # noqa: E402
from matplotlib.backends.backend_qt5agg import NavigationToolbar2QT as NavigationToolbar  # noqa: E402
from matplotlib.figure import Figure  # noqa: E402
from PyQt5.QtCore import Qt  # noqa: E402
from PyQt5.QtWidgets import (QFileDialog, QHBoxLayout, QLabel, QPushButton, QTabWidget,  # noqa: E402
                             QVBoxLayout, QWidget)

log = logging.getLogger("avas.gui")


class PlotTab(QWidget):
    """One figure with an optional options bar above it.

    ``draw_fn(fig)`` must draw into the given figure; it is re-invoked by
    :meth:`refresh` (e.g. after the user changes an option or re-runs).
    """

    def __init__(self, draw_fn, options_widget=None, parent=None):
        super().__init__(parent)
        self.draw_fn = draw_fn
        self.fig = Figure(figsize=(7, 4.5), dpi=100)
        self.canvas = FigureCanvas(self.fig)
        self.canvas.setFocusPolicy(Qt.ClickFocus)
        self.toolbar = NavigationToolbar(self.canvas, self)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(6, 6, 6, 6)
        lay.setSpacing(4)

        top = QHBoxLayout()
        if options_widget is not None:
            top.addWidget(options_widget, 1)
        else:
            top.addStretch(1)
        self.refresh_btn = QPushButton(self.tr("Refresh"))
        self.refresh_btn.clicked.connect(self.refresh)
        top.addWidget(self.refresh_btn)
        save_btn = QPushButton(self.tr("Save image"))
        save_btn.clicked.connect(self.save_image)
        top.addWidget(save_btn)
        lay.addLayout(top)

        self.status = QLabel("")
        self.status.setObjectName("muted")
        self.status.setWordWrap(True)
        lay.addWidget(self.toolbar)
        lay.addWidget(self.canvas, 1)
        lay.addWidget(self.status)

    def refresh(self):
        self.fig.clf()
        self.status.setText("")
        try:
            self.draw_fn(self.fig)
            try:
                self.fig.tight_layout()
            except Exception:  # noqa: BLE001 - layout is cosmetic
                pass
        except Exception as exc:  # noqa: BLE001 - GUI boundary
            log.error("plot failed: %s", exc)
            log.debug("".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
            self.fig.clf()
            ax = self.fig.add_subplot(111)
            ax.axis("off")
            ax.text(0.5, 0.5, str(exc), ha="center", va="center", wrap=True, color="#b91c1c")
            self.status.setText(str(exc))
        self.canvas.draw_idle()

    def save_image(self):
        path, _ = QFileDialog.getSaveFileName(self, self.tr("Save image"), "", "PNG (*.png);;PDF (*.pdf);;SVG (*.svg)")
        if path:
            self.fig.savefig(path, dpi=200, bbox_inches="tight")
            log.info("saved %s", path)


class PlotArea(QTabWidget):
    """Closable tabs holding :class:`PlotTab` or any other widget."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setTabsClosable(True)
        self.setMovable(True)
        self.setDocumentMode(True)
        self.tabCloseRequested.connect(self._close)
        self._placeholder = QLabel(self.tr("Pick an item on the left to open a plot here."))
        self._placeholder.setAlignment(Qt.AlignCenter)
        self._placeholder.setObjectName("muted")
        self.addTab(self._placeholder, self.tr("Start"))

    def _close(self, index):
        w = self.widget(index)
        self.removeTab(index)
        if w is not self._placeholder:
            w.deleteLater()
        if self.count() == 0:
            self.addTab(self._placeholder, self.tr("Start"))

    def add_widget(self, title, widget):
        if self.count() == 1 and self.widget(0) is self._placeholder:
            self.removeTab(0)
        index = self.addTab(widget, title)
        self.setCurrentIndex(index)
        return widget

    def add_plot(self, title, draw_fn, options_widget=None):
        tab = PlotTab(draw_fn, options_widget)
        self.add_widget(title, tab)
        tab.refresh()
        return tab

    def refresh_all(self):
        for i in range(self.count()):
            w = self.widget(i)
            if isinstance(w, PlotTab):
                w.refresh()
