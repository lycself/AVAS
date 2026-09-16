"""Inspectors for binary input data: particle distributions and field maps.

These files hold measured or computed physics (a beam from the RFQ, a 3D
field map), so they are shown, not edited: header values, derived beam
parameters and plots.
"""
import os
import struct

import numpy as np
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import QHBoxLayout, QLabel, QPushButton, QVBoxLayout, QWidget

from avas.data.fieldmap import EXT_MEANING, FieldMap, components
from avas.gui import theme
from avas.i18n import pick

MAX_SCATTER = 20000


class _PlotBox(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        self.fig = Figure(figsize=(7, 3), dpi=100)
        self.canvas = FigureCanvas(self.fig)
        self.canvas.setMinimumHeight(theme.px(260))
        lay.addWidget(self.canvas)

    def redraw(self, draw):
        import matplotlib
        self.fig.clf()
        self.fig.set_facecolor(matplotlib.rcParams["figure.facecolor"])
        draw(self.fig)
        try:
            self.fig.tight_layout()
        except Exception:  # noqa: BLE001 - cosmetic
            pass
        self.canvas.draw_idle()


class DstView(QWidget):
    """``.dst`` / ``.edst`` particle distribution: header, beam parameters, phase-space plots."""
    use_as_beam = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._path = None
        self._data = None
        self.lay = QVBoxLayout(self)
        self.lay.setContentsMargins(0, 8, 0, 0)
        self.lay.setSpacing(8)
        bar = QHBoxLayout()
        self.lbl_title = QLabel("")
        self.lbl_title.setObjectName("muted")
        self.lbl_title.setWordWrap(True)
        bar.addWidget(self.lbl_title, 1)
        self.btn_use = QPushButton(self.tr("Use as initial beam"))
        self.btn_use.setToolTip(self.tr("Set this file as readparticledistribution on the Beam page"))
        self.btn_use.clicked.connect(lambda: self.use_as_beam.emit(os.path.basename(self._path or "")))
        bar.addWidget(self.btn_use)
        self.lay.addLayout(bar)
        self.info = QLabel("")
        self.info.setTextFormat(Qt.RichText)
        self.info.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.info.setWordWrap(True)
        self.lay.addWidget(self.info)
        self.plot = _PlotBox()
        self.lay.addWidget(self.plot, 1)
        theme.notifier().changed.connect(self._draw)

    def set_path(self, path):
        self._path = path
        extended = path.lower().endswith(".edst")
        self.btn_use.setVisible(not extended)
        self._data = read_edst(path) if extended else read_dst(path)
        d = self._data
        self.lbl_title.setText(self.tr("Particle distribution (TraceWin %s format), read-only.")
                               % (".edst" if extended else ".dst"))
        rows = [
            (self.tr("Particles"), f"{d['number']:,}"),
            (self.tr("Beam current"), f"{d['ib']:g} mA"),
            (self.tr("Frequency"), f"{d['freq']:g} MHz"),
            (self.tr("Rest mass"), f"{d['mc2']:.6g} MeV"),
            (self.tr("Mean kinetic energy"), f"{d['energy']:.6g} MeV"),
        ]
        if extended:
            species = d.get("species", [])
            rows.append((self.tr("Species (charge e, mass MeV)"),
                         ", ".join(f"{q:g}/{m:.6g}" for q, m in species[:8]) + (" …" if len(species) > 8 else "")))
        for plane, (a, b, e) in d["twiss"].items():
            rows.append((f"Twiss {plane}", f"α = {a:.5g},  β = {b:.5g} mm/π·mrad,  ε = {e:.5g} π·mm·mrad"))
        self.info.setText("<table cellspacing='0' cellpadding='2'>" + "".join(
            f"<tr><td style='color:{theme.color('fg_muted')};padding-right:16px'>{k}</td><td>{v}</td></tr>"
            for k, v in rows) + "</table>")
        self._draw()

    def _draw(self):
        d = self._data
        if d is None:
            return
        p = d["particles"]
        if len(p) > MAX_SCATTER:
            idx = np.random.default_rng(0).choice(len(p), MAX_SCATTER, replace=False)
            p = p[idx]
        planes = [(p[:, 0] * 10, p[:, 1] * 1000, "x (mm)", "x' (mrad)"),
                  (p[:, 2] * 10, p[:, 3] * 1000, "y (mm)", "y' (mrad)"),
                  (np.degrees(p[:, 4]), p[:, 5], "φ (deg)", "W (MeV)")]

        def draw(fig):
            color = theme.color("accent")
            for i, (u, v, xl, yl) in enumerate(planes):
                ax = fig.add_subplot(1, 3, i + 1)
                ax.scatter(u, v, s=0.3, c=color, alpha=0.35, linewidths=0, rasterized=True)
                ax.set_xlabel(xl)
                ax.set_ylabel(yl)
        self.plot.redraw(draw)


class FieldMapView(QWidget):
    """Field map: grid header, sibling components, elements using it, longitudinal profile."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._fm = None
        self._profiles = None
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 8, 0, 0)
        lay.setSpacing(8)
        self.info = QLabel("")
        self.info.setTextFormat(Qt.RichText)
        self.info.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.info.setWordWrap(True)
        lay.addWidget(self.info)
        self.plot = _PlotBox()
        lay.addWidget(self.plot, 1)
        theme.notifier().changed.connect(self._draw)

    def set_path(self, path, field_dirs=(), used_by=()):
        base = os.path.splitext(os.path.basename(path))[0]
        fm = FieldMap(path).read()
        self._fm = fm
        self._profiles = fm.profiles()
        found = components(list(field_dirs) or [os.path.dirname(path)], base)
        rows = [
            (self.tr("Component"), f".{fm.ext}: {pick(EXT_MEANING.get(fm.ext, ('', '')))}"),
            (self.tr("Storage"), self.tr("binary (float32)") if fm.binary else self.tr("text")),
            (self.tr("Length"), f"{fm.length:g} m"),
            (self.tr("Grid"), f"Nz = {fm.nz}, Nx = {fm.nx}, Ny = {fm.ny}  "
                              f"({fm.points:,} " + self.tr("points") + ")"),
            (self.tr("Transverse range"), f"x ∈ [{fm.x_range[0]:g}, {fm.x_range[1]:g}] m,  "
                                          f"y ∈ [{fm.y_range[0]:g}, {fm.y_range[1]:g}] m"),
            (self.tr("Normalisation"), f"{fm.norm:g}"),
            (self.tr("Files of '%s'") % base, "  ".join("." + e for e in sorted(found)) or "–"),
            (self.tr("Used by"), ", ".join(used_by) if used_by else self.tr("no element of the lattice used for the run")),
        ]
        self.info.setText("<table cellspacing='0' cellpadding='2'>" + "".join(
            f"<tr><td style='color:{theme.color('fg_muted')};padding-right:16px'>{k}</td><td>{v}</td></tr>"
            for k, v in rows) + "</table>")
        self._draw()

    def _draw(self):
        if self._profiles is None:
            return
        z, axis, peak = self._profiles
        fm = self._fm

        def draw(fig):
            ax = fig.add_subplot(1, 1, 1)
            ax.plot(z, peak, color=theme.color("accent"), label=self.tr("max |F| over the cross-section"))
            ax.plot(z, axis, color=theme.color("el_rf"), label=self.tr("on axis (x = y = 0)"))
            ax.set_xlabel("z (m)")
            ax.set_ylabel(f".{fm.ext} " + self.tr("(file units)"))
            ax.legend(loc="best", fontsize="small")
            ax.grid(True, alpha=0.3)
        self.plot.redraw(draw)


# --------------------------------------------------------------------------- readers
def _twiss(u, up):
    u = u - u.mean()
    up = up - up.mean()
    uu, pp, upu = float(np.mean(u * u)), float(np.mean(up * up)), float(np.mean(u * up))
    emit = np.sqrt(max(uu * pp - upu * upu, 0.0))
    if emit == 0:
        return 0.0, 0.0, 0.0
    return -upu / emit, uu / emit, emit


def _summary(particles, mc2):
    energy = float(particles[:, 5].mean()) if len(particles) else 0.0
    gamma = 1 + energy / mc2 if mc2 else 1.0
    beta = np.sqrt(max(1 - 1 / gamma ** 2, 0.0))
    bg = beta * gamma
    twiss = {}
    for plane, (i, j, su, sp) in {"x": (0, 1, 10.0, 1000.0), "y": (2, 3, 10.0, 1000.0)}.items():
        a, b, e = _twiss(particles[:, i] * su, particles[:, j] * sp)          # mm, mrad
        twiss[plane] = (a, b, e * bg)                                         # β in mm/mrad, normalised ε
    return energy, twiss


def read_dst(path):
    with open(path, "rb") as fh:
        fh.read(2)
        number = struct.unpack("<i", fh.read(4))[0]
        ib = struct.unpack("<d", fh.read(8))[0]
        freq = struct.unpack("<d", fh.read(8))[0]
        fh.read(1)
        particles = np.fromfile(fh, dtype="<f8", count=6 * number).reshape(number, 6)
        mc2 = struct.unpack("<d", fh.read(8))[0]
    energy, twiss = _summary(particles, mc2)
    try:    # same numbers as "Fill parameters from file" on the Beam page
        from avas.api.qt.api import cal_beam_parameter
        res = cal_beam_parameter({"dstPath": path})
        if res.get("code") == 0:
            bp = res["data"]["beamParams"]
            twiss = {pl: (bp[f"alpha_{pl}"], bp[f"beta_{pl}"], bp[f"emit_{pl}"]) for pl in ("x", "y", "z")}
    except Exception:  # noqa: BLE001 - fall back to the plain rms estimate
        pass
    return {"number": number, "ib": ib, "freq": freq, "mc2": mc2, "energy": energy, "twiss": twiss,
            "particles": particles}


def read_edst(path):
    """Extended distribution: (Np+1) × 9 doubles, the last row is the synchronous particle."""
    with open(path, "rb") as fh:
        fh.read(2)
        number = struct.unpack("<i", fh.read(4))[0]
        ib = struct.unpack("<d", fh.read(8))[0]
        freq = struct.unpack("<d", fh.read(8))[0]
        fh.read(1)
        raw = np.fromfile(fh, dtype="<f8", count=9 * (number + 1)).reshape(number + 1, 9)
        tail = fh.read(8)
        mc2 = struct.unpack("<d", tail)[0] if len(tail) == 8 else float(raw[-1, 7])
    particles = raw[:-1, :6]
    species = sorted({(float(q), float(m)) for q, m in raw[:-1, 6:8]})
    energy, twiss = _summary(particles, mc2)
    return {"number": number, "ib": ib, "freq": freq, "mc2": mc2, "energy": energy, "twiss": twiss,
            "particles": particles, "species": species}
