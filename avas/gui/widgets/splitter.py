"""VS Code style sash: a few pixels wide to grab, looks like a 1 px border.

The handle paints itself in the background colour of the neighbouring side
bar / panel with a 1 px border line towards the editor, and turns into an
accent-coloured bar while hovered or dragged.  Double-clicking it emits
:attr:`Splitter.handle_double_clicked`.
"""
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QPainter
from PyQt5.QtWidgets import QSplitter, QSplitterHandle

from avas.gui import theme

HANDLE_PX = 4


class SashHandle(QSplitterHandle):
    def __init__(self, orientation, parent):
        super().__init__(orientation, parent)
        self.setAttribute(Qt.WA_Hover, True)
        self.setMouseTracking(True)
        self._hover = False
        self._pressed = False

    def enterEvent(self, event):  # noqa: N802 (Qt naming)
        self._hover = True
        self.update()
        super().enterEvent(event)

    def leaveEvent(self, event):  # noqa: N802 (Qt naming)
        self._hover = False
        self.update()
        super().leaveEvent(event)

    def mousePressEvent(self, event):  # noqa: N802 (Qt naming)
        self._pressed = True
        self.update()
        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):  # noqa: N802 (Qt naming)
        self._pressed = False
        self.update()
        super().mouseReleaseEvent(event)

    def mouseDoubleClickEvent(self, event):  # noqa: N802 (Qt naming)
        split = self.splitter()
        for i in range(1, split.count()):
            if split.handle(i) is self:
                split.handle_double_clicked.emit(i)
                break
        event.accept()

    def paintEvent(self, _event):  # noqa: N802 (Qt naming)
        split = self.splitter()
        p = QPainter(self)
        r = self.rect()
        if self._hover or self._pressed:
            p.fillRect(r, theme.qcolor("accent"))
            return
        p.fillRect(r, theme.qcolor(split.fill_token))
        line = theme.qcolor("border")
        if self.orientation() == Qt.Horizontal:
            x = r.right() if split.line_edge == "end" else r.left()
            p.fillRect(x, r.top(), 1, r.height(), line)
        else:
            y = r.bottom() if split.line_edge == "end" else r.top()
            p.fillRect(r.left(), y, r.width(), 1, line)


class Splitter(QSplitter):
    handle_double_clicked = pyqtSignal(int)

    def __init__(self, orientation, fill_token="sidebar_bg", line_edge="end", parent=None):
        super().__init__(orientation, parent)
        self.fill_token = fill_token
        self.line_edge = line_edge
        self.setChildrenCollapsible(False)
        self.setObjectName("sash")      # the style sheet sizes #sash handles (HANDLE_PX)
        theme.notifier().changed.connect(self._on_theme)

    def createHandle(self):  # noqa: N802 (Qt naming)
        return SashHandle(self.orientation(), self)

    def _on_theme(self):
        for i in range(self.count()):
            self.handle(i).update()
