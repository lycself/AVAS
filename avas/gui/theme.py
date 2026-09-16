"""Application-wide look: Fusion style plus a light style sheet.

Only *type* selectors are used, so popup menus and item views keep their
native highlight colours (a selector-less ``background-color`` on a parent
widget would be inherited by them).
"""
from PyQt5.QtWidgets import QApplication

ACCENT = "#2563eb"
ACCENT_DARK = "#1d4ed8"
DANGER = "#dc2626"
SIDEBAR_BG = "#1f2937"
SIDEBAR_FG = "#d1d5db"
BORDER = "#d0d7de"
PAGE_BG = "#f7f8fa"

STYLESHEET = f"""
QMainWindow, QDialog {{ background: {PAGE_BG}; }}
QScrollArea {{ border: none; background: transparent; }}
QScrollArea > QWidget > QWidget {{ background: transparent; }}

/* ---- sidebar ---------------------------------------------------------- */
QListWidget#sidebar {{
    background: {SIDEBAR_BG}; color: {SIDEBAR_FG}; border: none; outline: 0;
    font-size: 11pt; padding-top: 8px;
}}
QListWidget#sidebar::item {{ padding: 10px 18px; border-left: 3px solid transparent; }}
QListWidget#sidebar::item:hover {{ background: #374151; }}
QListWidget#sidebar::item:selected {{ background: #111827; color: white; border-left: 3px solid {ACCENT}; }}
QLabel#sidebarTitle {{ color: white; font-size: 15pt; font-weight: 600; padding: 14px 18px 6px 18px; background: {SIDEBAR_BG}; }}
QLabel#sidebarSub {{ color: #9ca3af; font-size: 9pt; padding: 0 18px 10px 18px; background: {SIDEBAR_BG}; }}

/* ---- toolbar / status ------------------------------------------------- */
QToolBar {{ background: white; border-bottom: 1px solid {BORDER}; spacing: 6px; padding: 4px 8px; }}
QToolBar QToolButton {{ padding: 5px 10px; border-radius: 4px; }}
QToolBar QToolButton:hover {{ background: #eef2f7; }}
QToolBar QToolButton:disabled {{ color: #9ca3af; }}
QStatusBar {{ background: white; border-top: 1px solid {BORDER}; }}

/* ---- page content ------------------------------------------------------ */
QLabel#pageTitle {{ font-size: 15pt; font-weight: 600; color: #111827; }}
QLabel#pageHint {{ color: #6b7280; }}
QLabel#muted {{ color: #6b7280; }}
QLabel#kpi {{ font-size: 13pt; font-weight: 600; }}

QGroupBox {{
    font-weight: 600; color: #111827;
    border: 1px solid {BORDER}; border-radius: 6px; background: white;
    margin-top: 14px; padding: 10px 10px 6px 10px;
}}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 4px; }}

QPushButton {{
    padding: 5px 14px; border: 1px solid #c8ced6; border-radius: 4px; background: #f6f8fa; min-height: 18px;
}}
QPushButton:hover {{ background: #eaeef2; }}
QPushButton:pressed {{ background: #dfe5ec; }}
QPushButton:disabled {{ color: #9ca3af; background: #f3f4f6; }}
QPushButton#primary {{ background: {ACCENT}; color: white; border: none; font-weight: 600; }}
QPushButton#primary:hover {{ background: {ACCENT_DARK}; }}
QPushButton#primary:disabled {{ background: #93c5fd; }}
QPushButton#danger {{ background: {DANGER}; color: white; border: none; font-weight: 600; }}
QPushButton#danger:disabled {{ background: #fca5a5; }}
QPushButton#flat {{ border: none; background: transparent; color: {ACCENT}; }}
QPushButton#flat:hover {{ text-decoration: underline; }}

QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, QPlainTextEdit, QTextEdit {{
    padding: 3px 6px; border: 1px solid #c8ced6; border-radius: 4px; background: white;
    selection-background-color: {ACCENT};
}}
QLineEdit:focus, QComboBox:focus, QPlainTextEdit:focus {{ border: 1px solid {ACCENT}; }}
QLineEdit:disabled, QComboBox:disabled {{ background: #f3f4f6; color: #6b7280; }}
QLineEdit:read-only {{ background: #f3f4f6; }}
QComboBox::drop-down {{ border: none; width: 22px; }}

QTableWidget, QTreeWidget, QListWidget {{ border: 1px solid {BORDER}; background: white; alternate-background-color: #f9fafb; }}
QHeaderView::section {{ background: #f3f4f6; padding: 4px; border: none; border-bottom: 1px solid {BORDER}; font-weight: 600; }}

QTabWidget::pane {{ border: 1px solid {BORDER}; background: white; top: -1px; }}
QTabBar::tab {{ padding: 6px 14px; border: 1px solid {BORDER}; border-bottom: none; background: #f3f4f6; margin-right: 2px; }}
QTabBar::tab:selected {{ background: white; font-weight: 600; }}

QProgressBar {{ border: 1px solid {BORDER}; border-radius: 4px; text-align: center; background: white; height: 18px; }}
QProgressBar::chunk {{ background: {ACCENT}; border-radius: 3px; }}

QDockWidget {{ titlebar-close-icon: none; }}
QDockWidget::title {{ background: #f3f4f6; padding: 4px 8px; border-top: 1px solid {BORDER}; }}
QPlainTextEdit#log {{ font-family: Consolas, "Courier New", monospace; font-size: 9pt; }}
"""


def apply_theme(app: QApplication):
    app.setStyle("Fusion")
    app.setStyleSheet(STYLESHEET)
