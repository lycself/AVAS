"""Beamline schematic: every element of the lattice drawn along z.

Mouse: wheel zooms around the cursor, drag pans, click selects, double-click
fits the whole lattice.  Superposed elements share the same z range and are
drawn as nested boxes so each one stays visible and clickable.
"""
import math

from PyQt5.QtCore import QPointF, QRectF, Qt, pyqtSignal
from PyQt5.QtGui import QColor, QFont, QPainter, QPen
from PyQt5.QtWidgets import QSizePolicy, QToolTip, QWidget

from avas.data import schema
from avas.gui import theme
from avas.i18n import pick

LANE_HEIGHTS = (1.0, 0.72, 0.48, 0.3)


def element_color_token(st):
    key = st.key
    if key == "field":
        return {"1": "el_rf", "2": "el_efield", "3": "el_bmag"}.get(st.field_type(), "el_other")
    return {"drift": "el_drift", "quad": "el_quad", "solenoid": "el_solenoid", "bend": "el_bend",
            "edge": "el_bend", "steerer": "el_steerer"}.get(key, "el_diag" if st.category == schema.DIAG else "el_other")


def element_label(st):
    return st.name or (st.param(8) if st.key == "field" else "") or st.keyword


class _Item:
    __slots__ = ("line_no", "z0", "z1", "token", "lane", "label", "tooltip", "kind", "issue")


class BeamlineView(QWidget):
    line_clicked = pyqtSignal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMouseTracking(True)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self._items = []
        self._total = 1.0
        self._v0, self._v1 = 0.0, 1.0
        self._selected = None
        self._drag = None
        theme.notifier().changed.connect(self._on_theme)
        self._on_theme()

    def _on_theme(self):
        self.setFixedHeight(theme.px(104))
        self.update()

    # ------------------------------------------------------------------ data
    def set_document(self, doc, keep_view=True):
        items = []
        lanes = {}
        for st in doc.statements:
            if not st.active or not st.is_element or st.z_start is None:
                continue
            it = _Item()
            it.line_no = st.line_no
            it.z0, it.z1 = st.z_start, st.z_end
            it.token = element_color_token(st)
            if st.block is not None:
                lane = lanes.get(st.block, 0)
                lanes[st.block] = lane + 1
                it.lane = min(lane, len(LANE_HEIGHTS) - 1)
            else:
                it.lane = 0
            it.label = element_label(st)
            it.kind = "marker" if st.z_end - st.z_start <= 0 else ("line" if st.key == "drift" else "box")
            spec_title = pick(st.spec.title) if st.spec else st.keyword
            it.tooltip = f"<b>{it.label}</b> · {spec_title}<br>z = {st.z_start:.6g} … {st.z_end:.6g} m"
            it.issue = st.worst_issue()
            items.append(it)
        self._items = items
        old_total = self._total
        self._total = max(doc.total_length, max((i.z1 for i in items), default=0.0), 1e-6)
        if not keep_view or abs(old_total - self._total) > 1e-9 or self._v1 <= self._v0:
            self.fit()
        self.update()

    def select_line(self, line_no, ensure_visible=True):
        self._selected = line_no
        if ensure_visible:
            it = next((i for i in self._items if i.line_no == line_no), None)
            if it is not None and (it.z1 < self._v0 or it.z0 > self._v1):
                span = self._v1 - self._v0
                centre = (it.z0 + it.z1) / 2
                self._v0, self._v1 = centre - span / 2, centre + span / 2
        self.update()

    def fit(self):
        pad = self._total * 0.01
        self._v0, self._v1 = -pad, self._total + pad
        self.update()

    # ------------------------------------------------------------------ geometry
    def _plot_rect(self):
        m = theme.px(10)
        return QRectF(m, theme.px(8), self.width() - 2 * m, self.height() - theme.px(30))

    def _x(self, z, rect):
        return rect.left() + (z - self._v0) / (self._v1 - self._v0) * rect.width()

    def _z(self, x, rect):
        return self._v0 + (x - rect.left()) / rect.width() * (self._v1 - self._v0)

    def _item_rect(self, it, rect):
        x0, x1 = self._x(it.z0, rect), self._x(it.z1, rect)
        h = rect.height() * LANE_HEIGHTS[it.lane]
        cy = rect.center().y()
        if it.kind == "marker":
            return QRectF(x0 - 3, rect.top(), 6, rect.height())
        return QRectF(x0, cy - h / 2, max(2.0, x1 - x0), h)

    def _hit(self, pos):
        rect = self._plot_rect()
        hits = [it for it in self._items if self._item_rect(it, rect).adjusted(-2, 0, 2, 0).contains(pos)]
        if not hits:
            return None
        # prefer the innermost (highest lane) and the shortest element
        return sorted(hits, key=lambda i: (-i.lane, i.kind == "line", i.z1 - i.z0))[0]

    # ------------------------------------------------------------------ painting
    def paintEvent(self, _event):  # noqa: N802 (Qt naming)
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        p.fillRect(self.rect(), theme.qcolor("beamline_bg"))
        p.setPen(QPen(theme.qcolor("border"), 1))
        p.drawRect(QRectF(self.rect()).adjusted(0.5, 0.5, -0.5, -0.5))
        rect = self._plot_rect()
        cy = rect.center().y()
        p.setPen(QPen(theme.qcolor("el_drift"), 1))
        p.drawLine(QPointF(rect.left(), cy), QPointF(rect.right(), cy))

        p.setClipRect(rect.adjusted(-4, -4, 4, 4))
        order = sorted(self._items, key=lambda i: (i.kind != "line", i.lane))
        for it in order:
            if it.z1 < self._v0 or it.z0 > self._v1:
                continue
            color = theme.qcolor(it.token)
            r = self._item_rect(it, rect)
            if it.kind == "line":
                p.setPen(QPen(color, 2))
                p.drawLine(QPointF(r.left(), cy), QPointF(r.right(), cy))
            elif it.kind == "marker":
                p.setPen(QPen(color, 2))
                p.drawLine(QPointF(r.center().x(), rect.top() + 4), QPointF(r.center().x(), rect.bottom() - 4))
            else:
                fill = QColor(color)
                fill.setAlpha(150 if it.lane else 110)
                p.setPen(QPen(color, 1))
                p.setBrush(fill)
                p.drawRoundedRect(r, 2, 2)
            if it.issue:
                p.setPen(Qt.NoPen)
                p.setBrush(theme.qcolor("danger" if it.issue == "error" else "warning"))
                p.drawEllipse(QPointF(r.center().x(), rect.top() + 3), 3, 3)
        p.setBrush(Qt.NoBrush)
        sel = next((i for i in self._items if i.line_no == self._selected), None)
        if sel is not None:
            r = self._item_rect(sel, rect)
            if sel.kind == "line":
                r = QRectF(r.left(), cy - rect.height() * 0.2, r.width(), rect.height() * 0.4)
            p.setPen(QPen(theme.qcolor("accent"), 2))
            p.drawRect(r.adjusted(-2, -2, 2, 2))
        p.setClipping(False)
        self._paint_axis(p, rect)

    def _paint_axis(self, p, rect):
        span = self._v1 - self._v0
        step = _nice_step(span / max(1, rect.width() / theme.px(90)))
        font = QFont(self.font())
        font.setPointSizeF(max(6.0, font.pointSizeF() * 0.8))
        p.setFont(font)
        p.setPen(QPen(theme.qcolor("fg_soft"), 1))
        y = rect.bottom() + theme.px(4)
        z = math.ceil(self._v0 / step) * step
        while z <= self._v1:
            x = self._x(z, rect)
            p.drawLine(QPointF(x, y), QPointF(x, y + 3))
            if x < rect.right() - theme.px(56):         # keep clear of the "z (m)" caption
                p.drawText(QRectF(x - 40, y + 3, 80, theme.px(16)), Qt.AlignHCenter | Qt.AlignTop, f"{z:g}")
            z += step
        p.drawText(QRectF(rect.right() - 60, y + 3, 60, theme.px(16)), Qt.AlignRight | Qt.AlignTop, "z (m)")

    # ------------------------------------------------------------------ interaction
    def wheelEvent(self, event):  # noqa: N802 (Qt naming)
        rect = self._plot_rect()
        z = self._z(event.pos().x(), rect)
        factor = 0.8 if event.angleDelta().y() > 0 else 1.25
        span = min(max((self._v1 - self._v0) * factor, 1e-4), self._total * 1.2)
        frac = (z - self._v0) / (self._v1 - self._v0)
        self._v0 = z - frac * span
        self._v1 = self._v0 + span
        self.update()
        event.accept()

    def mousePressEvent(self, event):  # noqa: N802 (Qt naming)
        if event.button() == Qt.LeftButton:
            self._drag = (event.pos().x(), self._v0, self._v1, False)

    def mouseMoveEvent(self, event):  # noqa: N802 (Qt naming)
        rect = self._plot_rect()
        if self._drag is not None and event.buttons() & Qt.LeftButton:
            x0, v0, v1, _moved = self._drag
            dx = event.pos().x() - x0
            if abs(dx) > 3:
                dz = dx / rect.width() * (v1 - v0)
                self._v0, self._v1 = v0 - dz, v1 - dz
                self._drag = (x0, v0, v1, True)
                self.update()
            return
        hit = self._hit(event.pos())
        if hit is not None:
            QToolTip.showText(event.globalPos(), hit.tooltip, self)
        else:
            QToolTip.hideText()

    def mouseReleaseEvent(self, event):  # noqa: N802 (Qt naming)
        if event.button() == Qt.LeftButton and self._drag is not None:
            moved = self._drag[3]
            self._drag = None
            if not moved:
                hit = self._hit(event.pos())
                if hit is not None:
                    self._selected = hit.line_no
                    self.update()
                    self.line_clicked.emit(hit.line_no)

    def mouseDoubleClickEvent(self, _event):  # noqa: N802 (Qt naming)
        self.fit()


def _nice_step(raw):
    if raw <= 0:
        return 1.0
    exp = math.floor(math.log10(raw))
    base = raw / 10 ** exp
    for nice in (1, 2, 5, 10):
        if base <= nice:
            return nice * 10 ** exp
    return 10 ** (exp + 1)
