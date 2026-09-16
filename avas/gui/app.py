"""GUI entry point: ``avas gui`` / ``python -m avas gui`` / ``avas-gui``.

Responsibilities that used to live in the old root ``main.py``:

* enable Qt high-DPI scaling *before* the ``QApplication`` exists, so the UI
  is readable on 150 % / 200 % Windows displays;
* install the UI translation chosen in *Settings > Language*;
* apply the optional user font size;
* show uncaught exceptions in a dialog instead of silently dying.
"""
import multiprocessing
import os
import sys
import traceback

from PyQt5.QtCore import Qt, QSettings
from PyQt5.QtGui import QFont, QGuiApplication
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


def _apply_font_size(app, settings):
    """Optional user override (points); default keeps the platform font."""
    size = settings.value("ui/fontPointSize", 0, type=int)
    if size and size > 0:
        font = app.font()
        font.setPointSize(size)
        app.setFont(font)


def main(argv=None, language=None):
    multiprocessing.freeze_support()
    _enable_high_dpi()

    app = QApplication(sys.argv if argv is None else [sys.argv[0]] + list(argv))
    app.setOrganizationName(ORG_NAME)
    app.setApplicationName(APP_NAME)

    settings = QSettings(ORG_NAME, APP_NAME)
    lang = language or settings.value("ui/language", "en")

    from avas.i18n import install_translator
    install_translator(app, lang)
    _apply_font_size(app, settings)
    _install_excepthook()

    # imported after the translator is installed so tr() strings resolve
    from avas.gui.user_pyqt import MainWindow

    window = MainWindow()  # noqa: F841 - keeps the window alive
    return app.exec_()


if __name__ == "__main__":
    sys.exit(main())
