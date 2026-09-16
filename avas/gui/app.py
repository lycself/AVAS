"""GUI entry point: ``avas gui`` / ``python -m avas gui`` / ``avas-gui``.

Responsibilities that used to live in the old root ``main.py``:

* enable Qt high-DPI scaling *before* the ``QApplication`` exists, so the UI
  is readable on 150 % / 200 % Windows displays;
* install the UI translation chosen in *Settings > Language*;
* apply the user's UI scale (font size + style sheet);
* show uncaught exceptions in a dialog instead of silently dying.
"""
import multiprocessing
import os
import sys
import traceback

from PyQt5.QtCore import Qt, QSettings
from PyQt5.QtGui import QFont, QFontDatabase, QGuiApplication
from PyQt5.QtWidgets import QApplication, QMessageBox

ORG_NAME = "AVAS"
APP_NAME = "AVAS"


def _enable_high_dpi():
    """Must run before QApplication is constructed."""
    os.environ.setdefault("QT_ENABLE_HIGHDPI_SCALING", "1")
    os.environ.setdefault("QT_AUTO_SCREEN_SCALE_FACTOR", "1")
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    # Qt 5.14+: honour fractional scale factors (125 %, 150 %) exactly instead of
    # rounding them, which would make everything either too small or too large.
    policy = getattr(Qt, "HighDpiScaleFactorRoundingPolicy", None)
    if policy is not None and hasattr(QGuiApplication, "setHighDpiScaleFactorRoundingPolicy"):
        QGuiApplication.setHighDpiScaleFactorRoundingPolicy(policy.PassThrough)


def _install_excepthook():
    def exception_handler(exc_type, value, tb):
        QMessageBox.critical(None, "Critical Error", f"An unexpected error occurred:\n{value}")
        traceback.print_exception(exc_type, value, tb)

    sys.excepthook = exception_handler


# Real UI fonts to try, in order.  CJK-capable families first so Chinese text
# does not fall back to a raster font.
PREFERRED_FAMILIES = [
    "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI",       # Windows
    "PingFang SC", "Helvetica Neue",                            # macOS
    "Noto Sans CJK SC", "Noto Sans", "DejaVu Sans", "Arial",    # Linux / generic
]


def ui_scale(settings):
    """UI scale in percent from QSettings (``ui/uiScale``).

    Older builds stored an absolute ``ui/fontPointSize``; it is converted once
    so an existing preference is not lost.
    """
    from avas.gui.theme import DEFAULT_POINT_SIZE, DEFAULT_SCALE, SCALES
    scale = settings.value("ui/uiScale", 0, type=int)
    if not scale:
        old_pt = settings.value("ui/fontPointSize", 0, type=int)
        scale = int(round(old_pt / DEFAULT_POINT_SIZE * 100)) if old_pt else DEFAULT_SCALE
        scale = min(SCALES, key=lambda s: abs(s - scale))
        settings.setValue("ui/uiScale", scale)
    return scale


def _apply_font(app, settings):
    """Give the application an explicit, readable font.

    Qt's Windows platform theme resolves the default widget font from the
    system "message font"; on Chinese Windows with display scaling this comes
    back as *SimSun 5 pt* (measured), which is why the old GUI was unreadable
    on high-DPI screens even though the menu bar (which uses a separate theme
    font) looked fine.  Picking a real UI family and size here makes every
    widget inherit something sane.  The size follows *View > UI scale*.
    """
    from avas.gui.theme import base_point_size
    families = set(QFontDatabase().families())
    font = app.font()
    for family in PREFERRED_FAMILIES:
        if family in families:
            font.setFamily(family)
            break
    font.setPointSizeF(base_point_size(ui_scale(settings)))
    font.setStyleStrategy(QFont.PreferAntialias)
    app.setFont(font)


def apply_ui_scale(app, settings):
    """(Re)apply font, theme (light / dark / follow system) and style sheet for the stored UI scale.

    Setting a new style sheet re-polishes every existing widget, which is what
    makes a live scale change take effect everywhere (a bare ``setFont`` after
    the windows exist only reaches widgets created later, e.g. popup menus).
    """
    from avas.gui.theme import apply_theme
    _apply_font(app, settings)
    apply_theme(app, ui_scale(settings), settings.value("ui/theme", "system", type=str))


def main(argv=None, language=None):
    multiprocessing.freeze_support()
    _enable_high_dpi()

    app = QApplication(sys.argv if argv is None else [sys.argv[0]] + list(argv))
    app.setOrganizationName(ORG_NAME)
    app.setApplicationName(APP_NAME)

    settings = QSettings(ORG_NAME, APP_NAME)
    lang = language or settings.value("ui/language", "en")

    apply_ui_scale(app, settings)

    from avas.i18n import install_translator
    install_translator(app, lang)
    _install_excepthook()

    # imported after the translator is installed so tr() strings resolve
    from avas.gui.main_window import MainWindow

    # kept on the app object so the window can replace itself (language switch)
    app._avas_main_window = MainWindow()
    return app.exec_()


if __name__ == "__main__":
    sys.exit(main())
