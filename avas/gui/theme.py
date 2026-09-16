"""Application-wide look: Fusion style, a VS Code-like light / dark palette.

Design rules
------------
* Colours are *tokens* (``editor_bg``, ``fg_muted``, ``accent`` ...) defined
  once per theme in :data:`PALETTES`, modelled on VS Code "Light Modern" and
  "Dark Modern".  Nothing outside this module hard-codes a colour; widgets
  call :func:`color` and re-read it when :func:`notifier` emits ``changed``.
* Layered surfaces: editor (pages) > side bar / panel / status bar, separated
  by 1 px borders - the same grammar VS Code uses.
* 8 px spacing grid, 32 px page gutters.
* Every size in the sheet is derived from the UI scale so *View > UI scale*
  really scales the whole interface.
* ``apply_theme`` sets the style sheet **and** a QPalette: the palette is what
  Fusion uses for check boxes, arrows, popups and matplotlib toolbar icons.

The theme mode is ``"system"`` (follow Windows), ``"light"`` or ``"dark"``.
"""
import sys

from PyQt5.QtCore import QEvent, QObject, QTimer, pyqtSignal
from PyQt5.QtGui import QColor, QGuiApplication, QPalette
from PyQt5.QtWidgets import QApplication

DEFAULT_POINT_SIZE = 10
DEFAULT_SCALE = 100          # percent
SCALES = (90, 100, 110, 125, 150)
MODES = ("system", "light", "dark")

PALETTES = {
    "light": {
        "editor_bg": "#ffffff",
        "sidebar_bg": "#f8f8f8",
        "panel_bg": "#f8f8f8",
        "statusbar_bg": "#f8f8f8",
        "toolbar_bg": "#f8f8f8",
        "border": "#e5e5e5",
        "border_strong": "#cecece",
        "fg": "#3b3b3b",
        "fg_strong": "#1f1f1f",
        "fg_muted": "#616161",
        "fg_soft": "#8b8b8b",
        "icon": "#424242",
        "icon_inactive": "#868686",
        "accent": "#005fb8",
        "accent_hover": "#0258a8",
        "accent_soft": "#dbe9f7",
        "accent_disabled": "#a9c8e6",
        "on_accent": "#ffffff",
        "list_hover": "#ececec",
        "list_active": "#e4e6f1",
        "input_bg": "#ffffff",
        "input_border": "#cecece",
        "button_bg": "#ffffff",
        "button_hover": "#f2f2f2",
        "button_pressed": "#e5e5e5",
        "badge_bg": "#e5e5e5",
        "badge_fg": "#3b3b3b",
        "danger": "#c72e2e",
        "danger_soft": "#fbe3e3",
        "success": "#388a34",
        "success_soft": "#dff0dd",
        "warning": "#b27c00",
        "status_running_bg": "#0078d4",
        "scrollbar": "rgba(100, 100, 100, 0.40)",
        "scrollbar_hover": "rgba(100, 100, 100, 0.70)",
        "tooltip_bg": "#f8f8f8",
        "tooltip_border": "#c8c8c8",
        "current_line": "#f3f3f3",
        # lattice editor syntax (VS Code Light+)
        "syn_default": "#3b3b3b",
        "syn_field": "#098658",
        "syn_magnet": "#0070c1",
        "syn_bound": "#a31515",
        "syn_inactive": "#a0a0a0",
        "syn_fold": "#005fb8",
        "gutter_fg": "#8b8b8b",
        # table tints
        "row_element": "#eef4fb",
        "row_command": "#f5f5f5",
        "cell_unused": "#fafafa",
        # log levels
        "log_time": "#8b8b8b",
        "log_debug": "#8b8b8b",
        "log_info": "#3b3b3b",
        "log_warning": "#9a6700",
        "log_error": "#c72e2e",
        # beamline schematic
        "el_drift": "#a0a0a0",
        "el_rf": "#d19a00",
        "el_bmag": "#2f7ed8",
        "el_efield": "#8e5bd0",
        "el_quad": "#1f9d6b",
        "el_solenoid": "#d0543c",
        "el_bend": "#e07b20",
        "el_steerer": "#13a3a3",
        "el_diag": "#7d8a96",
        "el_other": "#9aa5b1",
        "beamline_bg": "#fbfbfb",
    },
    "dark": {
        "editor_bg": "#1f1f1f",
        "sidebar_bg": "#181818",
        "panel_bg": "#181818",
        "statusbar_bg": "#181818",
        "toolbar_bg": "#181818",
        "border": "#2b2b2b",
        "border_strong": "#3c3c3c",
        "fg": "#cccccc",
        "fg_strong": "#e7e7e7",
        "fg_muted": "#9d9d9d",
        "fg_soft": "#6e7681",
        "icon": "#c5c5c5",
        "icon_inactive": "#868686",
        "accent": "#0078d4",
        "accent_hover": "#026ec1",
        "accent_soft": "#04395e",
        "accent_disabled": "#1d3b56",
        "on_accent": "#ffffff",
        "list_hover": "#2a2d2e",
        "list_active": "#37373d",
        "input_bg": "#313131",
        "input_border": "#3c3c3c",
        "button_bg": "#2b2b2b",
        "button_hover": "#353535",
        "button_pressed": "#3c3c3c",
        "badge_bg": "#3c3c3c",
        "badge_fg": "#e7e7e7",
        "danger": "#f14c4c",
        "danger_soft": "#4b1d1d",
        "success": "#89d185",
        "success_soft": "#1f3a1f",
        "warning": "#cca700",
        "status_running_bg": "#0078d4",
        "scrollbar": "rgba(121, 121, 121, 0.40)",
        "scrollbar_hover": "rgba(100, 100, 100, 0.70)",
        "tooltip_bg": "#202020",
        "tooltip_border": "#454545",
        "current_line": "#282828",
        # lattice editor syntax (VS Code Dark+)
        "syn_default": "#cccccc",
        "syn_field": "#4ec9b0",
        "syn_magnet": "#569cd6",
        "syn_bound": "#f48771",
        "syn_inactive": "#6a6a6a",
        "syn_fold": "#3794ff",
        "gutter_fg": "#6e7681",
        # table tints
        "row_element": "#1c2b3a",
        "row_command": "#262626",
        "cell_unused": "#1a1a1a",
        # log levels
        "log_time": "#6e7681",
        "log_debug": "#6e7681",
        "log_info": "#cccccc",
        "log_warning": "#cca700",
        "log_error": "#f14c4c",
        # beamline schematic
        "el_drift": "#6e6e6e",
        "el_rf": "#e2b340",
        "el_bmag": "#4d9bf0",
        "el_efield": "#b38af0",
        "el_quad": "#3cc48c",
        "el_solenoid": "#f07a63",
        "el_bend": "#f0a050",
        "el_steerer": "#40c8c8",
        "el_diag": "#9aa5b1",
        "el_other": "#8a949e",
        "beamline_bg": "#1b1b1b",
    },
}

# matplotlib rc per theme.  Every dark value is distinct so an exported figure
# can be recoloured back to the light values (see avas.gui.plot_style).
PLOT_RC = {
    "light": {
        "figure.facecolor": "#ffffff",
        "figure.edgecolor": "#ffffff",
        "axes.facecolor": "#ffffff",
        "axes.edgecolor": "#000000",
        "axes.labelcolor": "#000000",
        "axes.titlecolor": "auto",
        "text.color": "#000000",
        "xtick.color": "#000000",
        "ytick.color": "#000000",
        "xtick.labelcolor": "inherit",
        "ytick.labelcolor": "inherit",
        "grid.color": "#b0b0b0",
        "legend.facecolor": "inherit",
        "legend.edgecolor": "#cccccc",
        "savefig.facecolor": "auto",
    },
    "dark": {
        "figure.facecolor": "#1f1f1f",
        "figure.edgecolor": "#1f1f1f",
        "axes.facecolor": "#1e1e1e",
        "axes.edgecolor": "#8a8a8a",
        "axes.labelcolor": "#cbcbcb",
        "axes.titlecolor": "auto",
        "text.color": "#cccccc",
        "xtick.color": "#8b8b8b",
        "ytick.color": "#8c8c8c",
        "xtick.labelcolor": "#cdcdcd",
        "ytick.labelcolor": "#cecece",
        "grid.color": "#3c3c3c",
        "legend.facecolor": "#252526",
        "legend.edgecolor": "#454545",
        "savefig.facecolor": "auto",
    },
}


class _State:
    scale = DEFAULT_SCALE
    mode = "system"
    resolved = "light"


_state = _State()


class ThemeNotifier(QObject):
    """Emits ``changed`` after the theme or the UI scale was (re)applied."""
    changed = pyqtSignal()


_notifier = None


def notifier():
    global _notifier
    if _notifier is None:
        _notifier = ThemeNotifier()
    return _notifier


# --------------------------------------------------------------------------- queries
def current_mode():
    """The user's choice: ``system``, ``light`` or ``dark``."""
    return _state.mode


def resolved_mode():
    """What is actually shown: ``light`` or ``dark``."""
    return _state.resolved


def is_dark():
    return _state.resolved == "dark"


def tokens(name=None):
    return PALETTES[name or _state.resolved]


def color(token):
    """Colour string of *token* in the active theme."""
    return PALETTES[_state.resolved][token]


def qcolor(token):
    return QColor(color(token))


def scale():
    return _state.scale


def px(x):
    """Pixel size *x* at the active UI scale."""
    return max(1, int(round(x * _state.scale / 100.0)))


def base_point_size(scale=DEFAULT_SCALE):
    return max(6.0, round(DEFAULT_POINT_SIZE * scale / 100.0, 1))


def system_prefers_dark():
    """Windows: *Settings > Personalization > Colors > app mode*.  Elsewhere: guess from the platform palette."""
    if sys.platform == "win32":
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                                 r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize")
            value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
            winreg.CloseKey(key)
            return value == 0
        except OSError:
            return False
    app = QApplication.instance()
    if app is None:
        return False
    return app.style().standardPalette().color(QPalette.Window).lightness() < 128


def resolve(mode):
    if mode == "system":
        return "dark" if system_prefers_dark() else "light"
    return mode if mode in PALETTES else "light"


# --------------------------------------------------------------------------- style sheet
def build_stylesheet(scale=DEFAULT_SCALE, mode="light", images=None):
    """Return the style sheet for a UI scale in percent and a resolved mode.

    *images* (from :func:`avas.gui.icons.style_images`) supplies arrow and close
    button pictures; without it Fusion's defaults are used.
    """
    c = PALETTES[mode]

    def pt(x):
        return f"{round(x * scale / 100.0, 1)}pt"

    def px_(x):
        return f"{max(1, int(round(x * scale / 100.0)))}px"

    img = images or {}
    extra = ""
    if img:
        extra = f"""
QComboBox::down-arrow {{ image: url({img['arrow_down']}); width: {px_(12)}; height: {px_(12)}; }}
QComboBox::down-arrow:disabled {{ image: url({img['arrow_down_disabled']}); }}
QSpinBox::up-button, QDoubleSpinBox::up-button, QSpinBox::down-button, QDoubleSpinBox::down-button {{
    border: none; background: transparent; width: {px_(16)}; }}
QSpinBox::up-arrow, QDoubleSpinBox::up-arrow {{ image: url({img['arrow_up']}); width: {px_(10)}; height: {px_(10)}; }}
QSpinBox::down-arrow, QDoubleSpinBox::down-arrow {{ image: url({img['arrow_down']}); width: {px_(10)};
                                                  height: {px_(10)}; }}
QTabBar::close-button {{ image: url({img['close']}); subcontrol-position: right; width: {px_(14)};
                         height: {px_(14)}; border-radius: {px_(3)}; margin-left: {px_(4)}; }}
QTabBar::close-button:hover {{ image: url({img['close_hover']}); background: {c['list_hover']}; }}
"""

    return extra + f"""
* {{ font-size: {pt(10)}; }}
QMainWindow, QDialog {{ background: {c['editor_bg']}; color: {c['fg']}; }}
QWidget {{ color: {c['fg']}; }}
QWidget#pageContainer, QStackedWidget#pageContainer {{ background: {c['editor_bg']}; }}
QScrollArea {{ border: none; background: transparent; }}
QScrollArea > QWidget > QWidget {{ background: transparent; }}
QToolTip {{ background: {c['tooltip_bg']}; color: {c['fg']}; border: 1px solid {c['tooltip_border']};
            padding: {px_(4)} {px_(8)}; }}
QLabel {{ background: transparent; }}

/* ---- side bar ---------------------------------------------------------- */
QWidget#sidebar {{ background: {c['sidebar_bg']}; }}
QLabel#sidebarTitle {{ color: {c['fg_muted']}; font-size: {pt(8.5)}; font-weight: 600; letter-spacing: 1px;
                       padding: 0 {px_(14)}; }}
QPushButton#navItem {{
    color: {c['fg_muted']}; background: transparent; border: none;
    border-left: {px_(2)} solid transparent; border-radius: 0;
    padding: {px_(7)} {px_(14)}; font-size: {pt(10)}; text-align: left; min-height: {px_(22)};
}}
QPushButton#navItem[collapsed="true"] {{ text-align: center; padding: {px_(9)} 0; }}
QPushButton#navItem:hover {{ background: {c['list_hover']}; color: {c['fg_strong']}; }}
QPushButton#navItem:checked {{ background: {c['list_active']}; color: {c['fg_strong']};
                               border-left: {px_(2)} solid {c['accent']}; }}
QPushButton#navItem:disabled {{ color: {c['fg_soft']}; }}

/* ---- tool bar and menus ------------------------------------------------ */
QToolBar {{ background: transparent; border: none; spacing: {px_(2)}; }}
QToolBar#mainToolbar {{ background: {c['toolbar_bg']}; border-bottom: 1px solid {c['border']};
                        padding: {px_(2)} {px_(8)}; }}
QToolBar QToolButton {{ padding: {px_(4)}; border-radius: {px_(5)}; color: {c['fg']}; background: transparent;
                        border: none; }}
QToolBar QToolButton:hover {{ background: {c['list_hover']}; }}
QToolBar QToolButton:pressed, QToolBar QToolButton:checked {{ background: {c['button_pressed']}; }}
QToolBar QToolButton:disabled {{ color: {c['fg_soft']}; }}
QToolBar::separator {{ width: 1px; background: {c['border']}; margin: {px_(6)} {px_(6)}; }}
QMenuBar {{ background: {c['toolbar_bg']}; color: {c['fg']}; border: none; }}
QMenuBar::item {{ padding: {px_(4)} {px_(9)}; background: transparent; border-radius: {px_(4)}; }}
QMenuBar::item:selected {{ background: {c['list_hover']}; }}
QMenu {{ background: {c['editor_bg']}; color: {c['fg']}; border: 1px solid {c['border_strong']};
         padding: {px_(4)}; }}
QMenu::item {{ padding: {px_(5)} {px_(24)} {px_(5)} {px_(12)}; border-radius: {px_(4)}; }}
QMenu::item:selected {{ background: {c['accent']}; color: {c['on_accent']}; }}
QMenu::item:disabled {{ color: {c['fg_soft']}; }}
QMenu::separator {{ height: 1px; background: {c['border']}; margin: {px_(4)} {px_(8)}; }}

/* ---- status bar -------------------------------------------------------- */
QStatusBar {{ background: {c['statusbar_bg']}; color: {c['fg']}; border-top: 1px solid {c['border']};
              min-height: {px_(22)}; max-height: {px_(24)}; }}
QStatusBar[running="true"] {{ background: {c['status_running_bg']}; border-top: 1px solid {c['status_running_bg']}; }}
QStatusBar::item {{ border: none; }}
QStatusBar QToolButton#statusItem {{ color: {c['fg']}; background: transparent; border: none; border-radius: 0;
                                     padding: 0 {px_(6)}; font-size: {pt(9)}; min-height: {px_(22)}; }}
QStatusBar QToolButton#statusItem:hover {{ background: {c['list_hover']}; }}
QStatusBar[running="true"] QToolButton#statusItem {{ color: {c['on_accent']}; }}
QStatusBar[running="true"] QToolButton#statusItem:hover {{ background: rgba(255, 255, 255, 0.12); }}
QStatusBar QLabel#statusText {{ color: {c['fg']}; font-size: {pt(9)}; padding: 0 {px_(6)}; }}
QStatusBar QLabel#statusText[error="true"] {{ color: {c['danger']}; }}
QStatusBar[running="true"] QLabel#statusText {{ color: {c['on_accent']}; }}

/* ---- page content ------------------------------------------------------ */
QLabel#pageTitle {{ font-size: {pt(17)}; font-weight: 700; color: {c['fg_strong']}; }}
QLabel#pageHint {{ color: {c['fg_muted']}; }}
QLabel#muted {{ color: {c['fg_muted']}; }}
QLabel#soft {{ color: {c['fg_soft']}; font-size: {pt(9)}; }}
QLabel#kpi {{ font-size: {pt(13)}; font-weight: 600; color: {c['fg_strong']}; }}
QLabel#mono {{ font-family: Consolas, "Courier New", monospace; color: {c['fg_muted']}; font-size: {pt(9)}; }}
QLabel#badge {{ background: {c['badge_bg']}; color: {c['badge_fg']}; border-radius: {px_(9)};
                padding: {px_(1)} {px_(8)}; font-size: {pt(8.5)}; }}
QLabel#badgeAccent {{ background: {c['accent_soft']}; color: {c['fg_strong']}; border-radius: {px_(9)};
                      padding: {px_(1)} {px_(8)}; font-size: {pt(8.5)}; font-weight: 600; }}
QLabel#badgeDanger {{ background: {c['danger_soft']}; color: {c['danger']}; border-radius: {px_(9)};
                      padding: {px_(1)} {px_(8)}; font-size: {pt(8.5)}; font-weight: 600; }}
QLabel#badgeSuccess {{ background: {c['success_soft']}; color: {c['success']}; border-radius: {px_(9)};
                       padding: {px_(1)} {px_(8)}; font-size: {pt(8.5)}; font-weight: 600; }}
QLabel#stateRunning {{ color: {c['accent']}; font-weight: 700; font-size: {pt(12)}; }}
QLabel#stateOk {{ color: {c['success']}; font-weight: 700; font-size: {pt(12)}; }}
QLabel#stateFail {{ color: {c['danger']}; font-weight: 700; font-size: {pt(12)}; }}
QLabel#stateIdle {{ color: {c['fg_muted']}; font-weight: 600; font-size: {pt(12)}; }}
QFrame#hline {{ background: {c['border']}; max-height: 1px; min-height: 1px; border: none; }}

/* a section: small caption over a hair line - no box, no nesting */
QGroupBox {{
    border: none; border-top: 1px solid {c['border']}; background: transparent;
    margin-top: {px_(22)}; padding: {px_(12)} 0 {px_(4)} 0;
    font-weight: 600; color: {c['fg_muted']}; font-size: {pt(9)};
}}
QGroupBox::title {{ subcontrol-origin: margin; subcontrol-position: top left; left: 0; top: {px_(2)};
                    padding: 0 {px_(8)} 0 0; background: {c['editor_bg']}; color: {c['fg_muted']}; }}
QGroupBox QLabel, QGroupBox QCheckBox, QGroupBox QRadioButton {{ font-size: {pt(10)}; font-weight: normal;
                                                                 color: {c['fg']}; }}
QGroupBox QLabel#muted {{ color: {c['fg_muted']}; }}
QGroupBox QLabel#soft {{ color: {c['fg_soft']}; font-size: {pt(9)}; }}
QGroupBox QLabel#mono {{ color: {c['fg_muted']}; font-size: {pt(9)}; }}
QGroupBox QLabel#kpi {{ font-size: {pt(13)}; font-weight: 600; color: {c['fg_strong']}; }}
QGroupBox QLabel#stateRunning {{ color: {c['accent']}; font-weight: 700; font-size: {pt(12)}; }}
QGroupBox QLabel#stateOk {{ color: {c['success']}; font-weight: 700; font-size: {pt(12)}; }}
QGroupBox QLabel#stateFail {{ color: {c['danger']}; font-weight: 700; font-size: {pt(12)}; }}
QGroupBox QLabel#stateIdle {{ color: {c['fg_muted']}; font-weight: 600; font-size: {pt(12)}; }}
QGroupBox QLabel#badge {{ font-size: {pt(8.5)}; color: {c['badge_fg']}; }}
QGroupBox QLabel#badgeAccent {{ font-size: {pt(8.5)}; font-weight: 600; color: {c['fg_strong']}; }}
QGroupBox QLabel#badgeDanger {{ font-size: {pt(8.5)}; font-weight: 600; color: {c['danger']}; }}
QGroupBox QLabel#badgeSuccess {{ font-size: {pt(8.5)}; font-weight: 600; color: {c['success']}; }}

QPushButton {{
    padding: {px_(5)} {px_(14)}; border: 1px solid {c['input_border']}; border-radius: {px_(4)};
    background: {c['button_bg']}; color: {c['fg']}; min-height: {px_(20)};
}}
QPushButton:hover {{ background: {c['button_hover']}; }}
QPushButton:pressed {{ background: {c['button_pressed']}; }}
QPushButton:disabled {{ color: {c['fg_soft']}; background: {c['sidebar_bg']}; border-color: {c['border']}; }}
QPushButton#primary {{ background: {c['accent']}; color: {c['on_accent']}; border: 1px solid {c['accent']};
                       font-weight: 600; }}
QPushButton#primary:hover {{ background: {c['accent_hover']}; border-color: {c['accent_hover']}; }}
QPushButton#primary:disabled {{ background: {c['accent_disabled']}; border-color: {c['accent_disabled']};
                                color: {c['on_accent']}; }}
QPushButton#danger {{ background: transparent; color: {c['danger']}; border: 1px solid {c['danger']};
                      font-weight: 600; }}
QPushButton#danger:hover {{ background: {c['danger_soft']}; }}
QPushButton#danger:disabled {{ color: {c['fg_soft']}; border-color: {c['border']}; background: transparent; }}
QPushButton#flat {{ border: none; background: transparent; color: {c['accent']}; padding: {px_(4)} {px_(8)}; }}
QPushButton#flat:hover {{ background: {c['list_hover']}; }}
QPushButton#flat:disabled {{ color: {c['fg_soft']}; background: transparent; }}
QPushButton#ghost {{ border: none; background: transparent; color: {c['fg_muted']}; padding: {px_(4)} {px_(8)}; }}
QPushButton#ghost:hover {{ background: {c['list_hover']}; color: {c['fg_strong']}; }}

QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, QPlainTextEdit, QTextEdit {{
    padding: {px_(4)} {px_(7)}; border: 1px solid {c['input_border']}; border-radius: {px_(4)};
    background: {c['input_bg']}; color: {c['fg']};
    selection-background-color: {c['accent']}; selection-color: {c['on_accent']};
}}
QPlainTextEdit, QTextEdit, QTextBrowser {{ background: {c['editor_bg']}; }}
QLineEdit:focus, QComboBox:focus, QPlainTextEdit:focus, QTextEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus {{
    border: 1px solid {c['accent']};
}}
QLineEdit:disabled, QComboBox:disabled, QSpinBox:disabled, QDoubleSpinBox:disabled {{
    background: {c['sidebar_bg']}; color: {c['fg_soft']}; border-color: {c['border']};
}}
QLineEdit:read-only {{ background: {c['sidebar_bg']}; color: {c['fg_muted']}; }}
QComboBox::drop-down {{ border: none; width: {px_(22)}; }}
QComboBox QAbstractItemView {{ border: 1px solid {c['border_strong']}; background: {c['editor_bg']}; color: {c['fg']};
                               selection-background-color: {c['accent']}; selection-color: {c['on_accent']};
                               outline: none; }}
QCheckBox, QRadioButton {{ background: transparent; }}
QCheckBox::indicator, QRadioButton::indicator {{ width: {px_(15)}; height: {px_(15)}; }}

QTableWidget, QTableView, QTreeWidget, QTreeView, QListWidget, QListView {{
    border: 1px solid {c['border']}; border-radius: {px_(4)}; background: {c['editor_bg']}; color: {c['fg']};
    alternate-background-color: {c['sidebar_bg']}; gridline-color: {c['border']};
    selection-background-color: {c['accent_soft']}; selection-color: {c['fg_strong']}; outline: none;
}}
QTableWidget::item, QTreeWidget::item {{ padding: {px_(2)} {px_(4)}; }}
QTreeView::item:hover, QListView::item:hover {{ background: {c['list_hover']}; }}
QTreeView::item:selected, QListView::item:selected {{ background: {c['accent_soft']}; color: {c['fg_strong']}; }}
QHeaderView {{ background: {c['sidebar_bg']}; }}
QHeaderView::section {{ background: {c['sidebar_bg']}; color: {c['fg_muted']}; padding: {px_(5)} {px_(8)}; border: none;
                        border-bottom: 1px solid {c['border']}; border-right: 1px solid {c['border']};
                        font-weight: 600; }}
QHeaderView::section:last {{ border-right: none; }}
QTableCornerButton::section {{ background: {c['sidebar_bg']}; border: none; border-bottom: 1px solid {c['border']}; }}

QTabWidget::pane {{ border: none; border-top: 1px solid {c['border']}; background: transparent; top: -1px; }}
QTabBar {{ background: transparent; }}
QTabBar::tab {{ padding: {px_(6)} {px_(14)}; border: none; border-bottom: 1px solid transparent;
                background: transparent; color: {c['fg_muted']}; margin-right: {px_(2)}; }}
QTabBar::tab:hover {{ color: {c['fg_strong']}; }}
QTabBar::tab:selected {{ color: {c['fg_strong']}; border-bottom: 1px solid {c['accent']}; }}
QTabBar QToolButton {{ background: {c['editor_bg']}; border: none; }}

QProgressBar {{ border: none; border-radius: {px_(3)}; background: {c['border']}; height: {px_(6)};
                max-height: {px_(6)}; text-align: center; color: transparent; }}
QProgressBar::chunk {{ background: {c['accent']}; border-radius: {px_(3)}; }}

QSplitter::handle {{ background: {c['border']}; }}
QSplitter::handle:horizontal {{ width: 1px; }}
QSplitter::handle:vertical {{ height: 1px; }}
QSplitter::handle:hover {{ background: {c['accent']}; }}
QSplitter#sash::handle:horizontal {{ width: {px_(4)}; }}
QSplitter#sash::handle:vertical {{ height: {px_(4)}; }}

QScrollBar:vertical {{ background: transparent; width: {px_(10)}; margin: 0; }}
QScrollBar::handle:vertical {{ background: {c['scrollbar']}; min-height: {px_(24)}; }}
QScrollBar::handle:vertical:hover {{ background: {c['scrollbar_hover']}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QScrollBar::add-page, QScrollBar::sub-page {{ background: transparent; }}
QScrollBar:horizontal {{ background: transparent; height: {px_(10)}; margin: 0; }}
QScrollBar::handle:horizontal {{ background: {c['scrollbar']}; min-width: {px_(24)}; }}
QScrollBar::handle:horizontal:hover {{ background: {c['scrollbar_hover']}; }}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{ width: 0; }}
QAbstractScrollArea::corner {{ background: transparent; }}

/* ---- bottom panel (log) ------------------------------------------------ */
QWidget#logPanel {{ background: {c['panel_bg']}; }}
QWidget#logHeader {{ background: {c['panel_bg']}; }}
QLabel#logTitle {{ color: {c['fg_strong']}; font-size: {pt(8.5)}; font-weight: 600; letter-spacing: 1px;
                   padding: {px_(6)} {px_(2)} {px_(4)} {px_(2)}; border-bottom: 1px solid {c['accent']}; }}
QToolButton#panelButton {{ border: none; background: transparent; padding: {px_(3)}; border-radius: {px_(4)}; }}
QToolButton#panelButton:hover {{ background: {c['list_hover']}; }}
QPlainTextEdit#log {{ font-family: Consolas, "Courier New", monospace; font-size: {pt(9)}; border: none;
                      border-radius: 0; background: {c['panel_bg']}; padding: {px_(2)} {px_(12)}; }}
"""


def build_palette(mode="light"):
    c = PALETTES[mode]
    p = QPalette()
    roles = {
        QPalette.Window: c["editor_bg"],
        QPalette.WindowText: c["fg"],
        QPalette.Base: c["input_bg"],
        QPalette.AlternateBase: c["sidebar_bg"],
        QPalette.ToolTipBase: c["tooltip_bg"],
        QPalette.ToolTipText: c["fg"],
        QPalette.PlaceholderText: c["fg_soft"],
        QPalette.Text: c["fg"],
        QPalette.Button: c["button_bg"],
        QPalette.ButtonText: c["fg"],
        QPalette.BrightText: c["danger"],
        QPalette.Highlight: c["accent"],
        QPalette.HighlightedText: c["on_accent"],
        QPalette.Link: c["accent"],
        QPalette.LinkVisited: c["accent_hover"],
        QPalette.Light: c["border_strong"],
        QPalette.Midlight: c["border"],
        QPalette.Mid: c["border_strong"],
        QPalette.Dark: c["border_strong"],
        QPalette.Shadow: "#000000",
    }
    for role, value in roles.items():
        p.setColor(role, QColor(value))
    for role in (QPalette.WindowText, QPalette.Text, QPalette.ButtonText):
        p.setColor(QPalette.Disabled, role, QColor(c["fg_soft"]))
    p.setColor(QPalette.Disabled, QPalette.Base, QColor(c["sidebar_bg"]))
    p.setColor(QPalette.Disabled, QPalette.Button, QColor(c["sidebar_bg"]))
    return p


# --------------------------------------------------------------------------- Windows title bar
def set_dark_title_bar(widget, dark):
    """Win10 2004+ / Win11: native title bar follows the theme (DWMWA_USE_IMMERSIVE_DARK_MODE)."""
    if sys.platform != "win32" or QGuiApplication.platformName() != "windows":
        return
    try:
        import ctypes
        from ctypes import wintypes
        hwnd = wintypes.HWND(int(widget.winId()))
        value = ctypes.c_int(1 if dark else 0)
        dwm = ctypes.windll.dwmapi
        for attribute in (20, 19):   # 19 on builds before 20H1
            if dwm.DwmSetWindowAttribute(hwnd, attribute, ctypes.byref(value), ctypes.sizeof(value)) == 0:
                break
        # SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED: repaint the frame now
        ctypes.windll.user32.SetWindowPos(hwnd, None, 0, 0, 0, 0, 0x0002 | 0x0001 | 0x0004 | 0x0010 | 0x0020)
    except Exception:  # noqa: BLE001 - cosmetic only
        pass


class _TitleBarFilter(QObject):
    """Applies the title bar colour to every top-level window when it is shown."""

    def eventFilter(self, obj, event):  # noqa: N802 (Qt naming)
        if event.type() == QEvent.Show and getattr(obj, "isWindow", None) and obj.isWindow():
            set_dark_title_bar(obj, is_dark())
        return False


class _SystemWatcher(QObject):
    """Polls the OS light/dark setting while the mode is ``system``."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._timer = QTimer(self)
        self._timer.setInterval(2000)
        self._timer.timeout.connect(self._check)

    def sync(self):
        if _state.mode == "system":
            self._timer.start()
        else:
            self._timer.stop()

    def _check(self):
        app = QApplication.instance()
        if app is not None and resolve("system") != _state.resolved:
            apply_theme(app, _state.scale, "system")


# --------------------------------------------------------------------------- apply
def apply_theme(app: QApplication, scale=None, mode=None):
    """(Re)apply style, palette, style sheet and plot style; notify listeners."""
    if scale is not None:
        _state.scale = scale
    if mode is not None:
        _state.mode = mode if mode in MODES else "system"
    _state.resolved = resolve(_state.mode)

    from avas.gui import icons
    app.setStyle("Fusion")
    app.setPalette(build_palette(_state.resolved))
    app.setStyleSheet(build_stylesheet(_state.scale, _state.resolved, icons.style_images(_state.resolved)))

    from avas.gui import plot_style
    plot_style.apply(_state.resolved)

    if not hasattr(app, "_avas_title_filter"):
        app._avas_title_filter = _TitleBarFilter(app)
        app.installEventFilter(app._avas_title_filter)
        app._avas_theme_watcher = _SystemWatcher(app)
    app._avas_theme_watcher.sync()
    for w in app.topLevelWidgets():
        if w.isVisible():
            set_dark_title_bar(w, is_dark())

    notifier().changed.emit()


def stylesheet():
    """The sheet for the active theme and scale."""
    from avas.gui import icons
    return build_stylesheet(_state.scale, _state.resolved, icons.style_images(_state.resolved))
