"""Navigation side bar (VS Code style).

Expanded: codicon + label per page, width set by dragging the sash (the main
window owns the splitter).  Collapsed: an icon strip, the label becomes the
tooltip; clicking the active icon expands the bar again.
"""
from PyQt5.QtCore import QSize, Qt, pyqtSignal
from PyQt5.QtGui import QPainter
from PyQt5.QtWidgets import (QButtonGroup, QHBoxLayout, QLabel, QPushButton, QStyle, QStyleOption, QVBoxLayout,
                             QWidget)

from avas.gui import icons, theme

COLLAPSED_WIDTH = 48          # at 100 % UI scale
DEFAULT_WIDTH = 210
MIN_EXPANDED_WIDTH = 150
MAX_WIDTH = 420
SNAP_WIDTH = 110              # dragging narrower than this collapses the bar
HEADER_HEIGHT = 35
ICON_PX = 20


class Sidebar(QWidget):
    current_changed = pyqtSignal(int)
    collapsed_changed = pyqtSignal(bool)
    expand_requested = pyqtSignal()

    def paintEvent(self, event):  # noqa: N802 (Qt naming)
        """A QWidget *subclass* only paints a style-sheet background if it asks the style to."""
        opt = QStyleOption()
        opt.initFrom(self)
        painter = QPainter(self)
        self.style().drawPrimitive(QStyle.PE_Widget, opt, painter, self)
        super().paintEvent(event)

    def __init__(self, title="AVAS", parent=None):
        super().__init__(parent)
        self.setObjectName("sidebar")
        self._collapsed = False
        self._items = []
        self._icons = []
        self._busy_index = None
        self._last_index = -1

        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        self.header = QWidget()
        head = QHBoxLayout(self.header)
        head.setContentsMargins(0, 0, 0, 0)
        self.lbl_title = QLabel(title)
        self.lbl_title.setObjectName("sidebarTitle")
        head.addWidget(self.lbl_title, 1)
        root.addWidget(self.header)

        self._nav = QVBoxLayout()
        self._nav.setContentsMargins(0, 0, 0, 0)
        self._nav.setSpacing(0)
        root.addLayout(self._nav)
        root.addStretch(1)

        self._group = QButtonGroup(self)
        self._group.setExclusive(True)
        self._group.buttonClicked[int].connect(self._on_clicked)
        self.setMinimumWidth(theme.px(COLLAPSED_WIDTH))
        self.setMaximumWidth(theme.px(MAX_WIDTH))
        theme.notifier().changed.connect(self._on_theme)
        self._on_theme()

    # ------------------------------------------------------------------ items
    def add_item(self, label, icon_name):
        # QPushButton (not QToolButton): it honours "text-align: left" in style sheets
        btn = QPushButton(label)
        btn.setObjectName("navItem")
        btn.setCheckable(True)
        btn.setFlat(True)
        btn.setIconSize(QSize(theme.px(ICON_PX), theme.px(ICON_PX)))
        btn.setCursor(Qt.PointingHandCursor)
        btn.setFocusPolicy(Qt.NoFocus)
        btn.setProperty("label", label)
        icons.bind(btn, icon_name, "icon_inactive", role_on="fg_strong")
        idx = len(self._items)
        self._group.addButton(btn, idx)
        self._items.append(btn)
        self._icons.append(icon_name)
        self._nav.addWidget(btn)
        return idx

    def _on_clicked(self, idx):
        if idx == self._last_index:
            if self._collapsed:
                self.expand_requested.emit()
            return
        self._last_index = idx
        self.current_changed.emit(idx)

    def current_index(self):
        return self._group.checkedId()

    def set_current_index(self, idx):
        if 0 <= idx < len(self._items) and self._last_index != idx:
            self._items[idx].setChecked(True)
            self._last_index = idx
            self.current_changed.emit(idx)

    def item(self, idx):
        return self._items[idx]

    def set_busy(self, idx, busy):
        """Mark a page as active (e.g. the Run page while a simulation runs): spinning icon."""
        if self._busy_index is not None and self._busy_index != idx:
            self._restore_icon(self._busy_index)
        self._busy_index = idx if busy else None
        if busy:
            icons.bind(self._items[idx], "loading", "accent", role_on="accent", spin=True)
        else:
            self._restore_icon(idx)

    def _restore_icon(self, idx):
        icons.bind(self._items[idx], self._icons[idx], "icon_inactive", role_on="fg_strong")

    # ------------------------------------------------------------------ collapse
    def is_collapsed(self):
        return self._collapsed

    def collapsed_width(self):
        return theme.px(COLLAPSED_WIDTH)

    def set_collapsed(self, collapsed):
        """Switch between icon strip and full bar.  The main window resizes the splitter."""
        collapsed = bool(collapsed)
        if collapsed == self._collapsed:
            return
        self._collapsed = collapsed
        self.lbl_title.setVisible(not collapsed)
        for btn in self._items:
            label = btn.property("label")
            btn.setText("" if collapsed else label)
            btn.setToolTip(label if collapsed else "")
            btn.setProperty("collapsed", collapsed)
            btn.style().unpolish(btn)
            btn.style().polish(btn)
        self.collapsed_changed.emit(collapsed)

    def _on_theme(self):
        self.header.setFixedHeight(theme.px(HEADER_HEIGHT))
        self.setMinimumWidth(theme.px(COLLAPSED_WIDTH))
        self.setMaximumWidth(theme.px(MAX_WIDTH))
        for btn in self._items:
            btn.setIconSize(QSize(theme.px(ICON_PX), theme.px(ICON_PX)))

    def set_title(self, text):
        self.lbl_title.setText(text)
