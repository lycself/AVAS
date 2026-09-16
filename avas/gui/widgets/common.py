"""Small reusable widgets and helpers shared by the pages."""
import inspect
import logging
import os
import traceback

from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QDoubleValidator, QIntValidator
from PyQt5.QtWidgets import (QButtonGroup, QFileDialog, QFormLayout, QHBoxLayout, QLabel, QLineEdit,
                             QMessageBox, QPushButton, QRadioButton, QVBoxLayout, QWidget)

from avas.gui import icons

log = logging.getLogger("avas.gui")


# --------------------------------------------------------------------------- errors
def report_error(parent, exc, title=None):
    """Log the exception with traceback and show a short message box."""
    log.error("%s", exc)
    log.debug("".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
    if os.environ.get("AVAS_GUI_NO_DIALOGS"):  # headless tests: log only
        return
    QMessageBox.warning(parent, title or "Error", str(exc))


def guarded(func):
    """Decorator for slots: exceptions become a message box + log entry.

    Surplus positional arguments are dropped, the way PyQt treats a plain
    method: ``button.clicked`` sends ``checked``, which ``def save(self)`` must
    not receive.  (The wrapper itself takes ``*args``, so PyQt cannot do it.)
    """
    params = inspect.signature(func).parameters.values()
    if any(p.kind == p.VAR_POSITIONAL for p in params):
        max_args = None
    else:
        max_args = sum(p.kind in (p.POSITIONAL_ONLY, p.POSITIONAL_OR_KEYWORD) for p in params)

    def inner(*args, **kwargs):
        if max_args is not None:
            args = args[:max_args]
        try:
            return func(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - GUI boundary
            owner = args[0] if args else kwargs.get("_self")
            report_error(owner if isinstance(owner, QWidget) else None, exc)
            return None
    inner.__name__ = func.__name__
    inner.__doc__ = func.__doc__
    return inner


# --------------------------------------------------------------------------- inputs
def float_edit(text="", width=None):
    edit = QLineEdit(text)
    edit.setValidator(QDoubleValidator())
    if width:
        edit.setMaximumWidth(width)
    return edit


def int_edit(text="", width=None):
    edit = QLineEdit(text)
    edit.setValidator(QIntValidator())
    if width:
        edit.setMaximumWidth(width)
    return edit


def with_unit(widget, unit):
    """Return a row widget: input + unit label."""
    row = QWidget()
    lay = QHBoxLayout(row)
    lay.setContentsMargins(0, 0, 0, 0)
    lay.addWidget(widget, 1)
    if unit:
        lab = QLabel(unit)
        lab.setObjectName("muted")
        lay.addWidget(lab)
    return row


def form_layout():
    form = QFormLayout()
    form.setLabelAlignment(Qt.AlignRight | Qt.AlignVCenter)
    form.setFieldGrowthPolicy(QFormLayout.ExpandingFieldsGrow)
    form.setHorizontalSpacing(14)
    form.setVerticalSpacing(8)
    return form


def page_header(title, hint=None):
    box = QWidget()
    lay = QVBoxLayout(box)
    lay.setContentsMargins(0, 0, 0, 6)
    lay.setSpacing(2)
    t = QLabel(title)
    t.setObjectName("pageTitle")
    lay.addWidget(t)
    if hint:
        h = QLabel(hint)
        h.setObjectName("pageHint")
        h.setWordWrap(True)
        lay.addWidget(h)
    return box


class RadioGroup(QWidget):
    """Mutually exclusive choice rendered as radio buttons.

    ``options`` is a list of ``(value, label)``.  :meth:`value` returns the
    selected value, :meth:`set_value` selects one.
    """
    changed = pyqtSignal(object)

    def __init__(self, options, horizontal=True, parent=None):
        super().__init__(parent)
        lay = QHBoxLayout(self) if horizontal else QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(16 if horizontal else 4)
        self._group = QButtonGroup(self)
        self._buttons = {}
        for value, label in options:
            btn = QRadioButton(label)
            self._buttons[value] = btn
            self._group.addButton(btn)
            lay.addWidget(btn)
            btn.toggled.connect(self._on_toggled)
        if horizontal:
            lay.addStretch(1)
        if options:
            self._buttons[options[0][0]].setChecked(True)

    def _on_toggled(self, checked):
        if checked:
            self.changed.emit(self.value())

    def value(self):
        for value, btn in self._buttons.items():
            if btn.isChecked():
                return value
        return None

    def set_value(self, value):
        btn = self._buttons.get(value)
        if btn is not None:
            btn.setChecked(True)

    def button(self, value):
        return self._buttons[value]

    def set_option_enabled(self, value, enabled, tooltip=None):
        btn = self._buttons[value]
        btn.setEnabled(enabled)
        if tooltip is not None:
            btn.setToolTip(tooltip)


class PathPicker(QWidget):
    """Line edit with a browse button (file or directory)."""
    changed = pyqtSignal(str)

    def __init__(self, mode="file", caption="", name_filter="", parent=None, read_only=False):
        super().__init__(parent)
        self.mode = mode
        self.caption = caption
        self.name_filter = name_filter
        self.start_dir = ""
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(4)
        self.edit = QLineEdit()
        self.edit.setReadOnly(read_only)
        self.edit.textChanged.connect(self.changed)
        self.button = QPushButton("")
        icons.bind(self.button, "folder-opened" if mode == "dir" else "go-to-file")
        self.button.setToolTip(self.tr("Browse..."))
        self.button.setFixedWidth(34)
        self.button.clicked.connect(self.browse)
        lay.addWidget(self.edit, 1)
        lay.addWidget(self.button)

    def text(self):
        return self.edit.text().strip()

    def setText(self, text):  # noqa: N802 (Qt naming)
        self.edit.setText(text or "")

    def browse(self):
        start = self.start_dir if os.path.isdir(self.start_dir or "") else ""
        if self.mode == "dir":
            path = QFileDialog.getExistingDirectory(self, self.caption or self.tr("Select directory"), start)
        else:
            path, _ = QFileDialog.getOpenFileName(self, self.caption or self.tr("Select file"), start, self.name_filter)
        if path:
            self.edit.setText(os.path.normpath(path))
