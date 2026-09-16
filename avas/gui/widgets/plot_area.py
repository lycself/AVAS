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

from avas.gui import plot_style, theme  # noqa: E402

log = logging.getLogger("avas.gui")


class PlotTab(QWidget):
    """One figure with an optional options bar above it.

    ``draw_fn(fig)`` must draw into the given figure; it is re-invoked by
    :meth:`refresh` (e.g. after the user changes an option or re-runs).
    """

    def __init__(self, draw_fn, options_widget=None, parent=None):
        super().__init__(parent)
        self.draw_fn = draw_fn
        self.stale = False
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
        self.stale = False
        self.fig.clf()
        self.fig.set_facecolor(matplotlib.rcParams["figure.facecolor"])
        self.fig.set_edgecolor(matplotlib.rcParams["figure.edgecolor"])
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
            ax.text(0.5, 0.5, str(exc), ha="center", va="center", wrap=True, color=theme.color("danger"))
            self.status.setText(str(exc))
        self.canvas.draw_idle()

    def save_image(self):
        """Saved images always use the light (publication) style, see avas.gui.plot_style."""
        path, _ = QFileDialog.getSaveFileName(self, self.tr("Save image"), "", "PNG (*.png);;PDF (*.pdf);;SVG (*.svg)")
        if path:
            self.fig.savefig(path, dpi=200, bbox_inches="tight")
            log.info("saved %s", path)

    def on_theme_changed(self):
        plot_style.refresh_toolbar_icons(self.toolbar)
        if self.isVisible():
            self.refresh()
        else:
            self.stale = True


class PlotArea(QTabWidget):
    """Closable tabs holding :class:`PlotTab` or any other widget."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setTabsClosable(True)
        self.setMovable(True)
        self.setDocumentMode(True)
        self.tabCloseRequested.connect(self._close)
        self.currentChanged.connect(self._on_current_changed)
        theme.notifier().changed.connect(self._on_theme_changed)
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

    def _on_theme_changed(self):
        for i in range(self.count()):
            w = self.widget(i)
            if isinstance(w, PlotTab):
                w.on_theme_changed()

    def _on_current_changed(self, index):
        w = self.widget(index)
        if isinstance(w, PlotTab) and w.stale:
            w.refresh()

    def refresh_all(self):
        for i in range(self.count()):
            w = self.widget(i)
            if isinstance(w, PlotTab):
                w.refresh()
