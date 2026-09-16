"""Physical-parameter editor for AVAS lattice files, bound to a text editor.

::

    ┌ beamline schematic (click = select) ──────────────────────────────────┐
    ├ [Structure] [Parameter table] ─────────────────────────────────────────┤
    │ search / filter          │ Field map · field                          │
    │ ▾ buncher1               │ Length L      [0.4      ] m                 │
    │     MEBT_Q1  field …     │ Field type    [3 — static magnetic field ▾] │
    │     …                    │ Field map     [q120 ▾]  ✓ .bsx .bsy .bsz    │
    └──────────────────────────┴────────────────────────────────────────────┘

The text document is the only data: every edit made here rewrites exactly one
line through QTextCursor, so undo works in the
text editor and comments survive (names kept in a ``!name`` line are edited there).  The document is re-parsed after edits and
after typing (debounced).
"""
import os

from PyQt5.QtCore import QRegExp, QSize, Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QColor, QIcon, QPainter, QPixmap, QRegExpValidator, QTextCursor
from PyQt5.QtWidgets import (QAbstractItemView, QCheckBox, QComboBox, QFormLayout, QHBoxLayout, QHeaderView,
                             QInputDialog, QLabel, QLineEdit, QPushButton, QScrollArea, QSplitter,
                             QStyledItemDelegate, QTableWidget, QTableWidgetItem, QTabWidget, QTreeWidget,
                             QTreeWidgetItem, QVBoxLayout, QWidget)

from avas.data import schema
from avas.data.fieldmap import EXT_MEANING
from avas.data.lattice_doc import ERROR, Group, LatticeDocument, format_statement, rename_edits, to_float
from avas.gui import icons, theme
from avas.gui.lattice_editor.beamline_view import BeamlineView, element_color_token
from avas.i18n import pick

LINE_ROLE = Qt.UserRole
RAW_ROLE = Qt.UserRole + 1
FLOAT_RE = QRegExp(r"^[-+]?(\d+\.?\d*|\.\d+)?([eE][-+]?\d*)?$")
INT_RE = QRegExp(r"^[-+]?\d*$")


def _fmt(v, digits=6):
    return f"{v:.{digits}g}" if v is not None else "–"


def statement_summary(st):
    """Short physical description used in the tree."""
    p = st.param
    key = st.key
    try:
        if key == "field":
            spec = schema.LATTICE_KEYWORDS["field"]
            kind = spec.params[3].choice_label(p(3))
            parts = [pick(kind) if kind else f"type {p(3)}"]
            if p(8):
                parts.append(p(8))
            if st.field_type() == "1":
                parts.append(f"{to_float(p(4)) / 1e6:g} MHz")
                parts.append(f"φ={p(5)}°")
            return " · ".join(parts)
        if key == "drift":
            return f"L={p(0)} m"
        if key == "quad":
            return f"L={p(0)} m · G={p(3)} T/m"
        if key == "solenoid":
            return f"L={p(0)} m · B={p(3)} T"
        if key == "bend":
            return f"α={p(3)}° · ρ={p(4)} m"
        if key == "steerer":
            return f"Bx/Ex={p(3)} · By/Ey={p(4)}"
        if key in ("superpose", "superposeout") and st.params:
            return f"z0={p(0)} m"
        if st.spec and st.spec.category == schema.ERROR and len(st.params) >= 2 and st.spec.params[1].key == "r":
            label = st.spec.params[1].choice_label(p(1))
            return f"N={p(0)} · {pick(label) if label else p(1)}"
    except (IndexError, ValueError):
        pass
    return " ".join(st.params)


def _compact(combo):
    """Long choice texts must not make the form wider than its column."""
    combo.setSizeAdjustPolicy(QComboBox.AdjustToMinimumContentsLengthWithIcon)
    combo.setMinimumContentsLength(8)


def swatch(token, size=12):
    pix = QPixmap(size * 2, size * 2)
    pix.setDevicePixelRatio(2.0)
    pix.fill(Qt.transparent)
    painter = QPainter(pix)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setPen(Qt.NoPen)
    painter.setBrush(QColor(theme.color(token)))
    painter.drawRoundedRect(1, 3, size - 2, size - 6, 2, 2)
    painter.end()
    return QIcon(pix)


def fieldmap_bases(dirs):
    """``{base name: set(ext)}`` of all field maps in *dirs*."""
    res = {}
    for d in dirs:
        try:
            names = os.listdir(d)
        except OSError:
            continue
        for n in names:
            base, ext = os.path.splitext(n)
            ext = ext.lstrip(".").lower()
            if ext in EXT_MEANING:
                res.setdefault(base, set()).add(ext)
    return res


# --------------------------------------------------------------------------- property form
class PropertyPanel(QWidget):
    edits_requested = pyqtSignal(object)      # [(line_no, text)]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._st = None
        self._doc = None
        self._read_only = False
        self._widgets = []          # (param index, getter, setter, widget)
        self._fieldmaps = {}
        self._signature = None
        self._root = QVBoxLayout(self)
        self._root.setContentsMargins(12, 8, 12, 8)
        self._root.setSpacing(6)
        self._body = None
        self.show_statement(None)

    def set_fieldmaps(self, bases):
        self._fieldmaps = bases

    # ---- build ----------------------------------------------------------------------
    def _clear(self):
        if self._body is not None:
            self._body.setParent(None)
            self._body.deleteLater()
        self._body = QWidget()
        self._root.addWidget(self._body)
        self._widgets = []
        self.lbl_fieldmap = None
        return self._body

    def show_statement(self, st, doc=None, read_only=False):
        self._doc = doc
        self._read_only = read_only
        signature = self._make_signature(st)
        if st is not None and signature == self._signature and self._body is not None:
            self._st = st
            self._refresh_values(st)
            return
        self._st = st
        self._signature = signature
        body = self._clear()
        lay = QVBoxLayout(body)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(6)
        if st is None:
            hint = QLabel(self.tr("Select an element or command in the list, the schematic or the text."))
            hint.setObjectName("soft")
            hint.setWordWrap(True)
            lay.addWidget(hint)
            lay.addStretch(1)
            return
        spec = st.spec
        title = QLabel((pick(spec.title) if spec else self.tr("Unknown keyword")) + f"   <span style='color:"
                       f"{theme.color('fg_soft')}'>{st.keyword}</span>")
        title.setObjectName("kpi")
        title.setWordWrap(True)
        lay.addWidget(title)
        if spec and pick(spec.doc):
            doc_label = QLabel(pick(spec.doc))
            doc_label.setObjectName("muted")
            doc_label.setWordWrap(True)
            lay.addWidget(doc_label)
        if not st.active:
            inactive = QLabel(self.tr("Outside start … end: not simulated."))
            inactive.setObjectName("soft")
            lay.addWidget(inactive)

        form = QFormLayout()
        form.setLabelAlignment(Qt.AlignRight | Qt.AlignVCenter)
        form.setFieldGrowthPolicy(QFormLayout.ExpandingFieldsGrow)
        form.setHorizontalSpacing(12)
        form.setVerticalSpacing(6)

        self.edit_name = QLineEdit(st.name)
        self.edit_name.setPlaceholderText(self.tr("optional"))
        self.edit_name.setToolTip(self.tr("Written as 'name : keyword …', or kept in the '!name' comment line."))
        self.edit_name.editingFinished.connect(self._commit_name)
        self.edit_name.setReadOnly(read_only)
        if spec is None or spec.category in schema.ELEMENT_CATEGORIES:
            form.addRow(self.tr("Name"), self.edit_name)

        params = spec.params if spec else []
        count = max(len(params), len(st.params))
        for k in range(count):
            p = params[k] if k < len(params) else None
            value = st.param(k)
            label = pick(p.label) if p else f"P{k + 1}"
            widget, getter, setter = self._param_widget(p, value, k)
            row = QWidget()
            rl = QHBoxLayout(row)
            rl.setContentsMargins(0, 0, 0, 0)
            rl.setSpacing(6)
            rl.addWidget(widget, 1)
            if p is not None and p.unit:
                unit = QLabel(p.unit)
                unit.setObjectName("muted")
                unit.setMinimumWidth(theme.px(44))
                rl.addWidget(unit)
            if p is not None and p.kind == schema.FIELDMAP:
                self.lbl_fieldmap = QLabel("")
                self.lbl_fieldmap.setObjectName("soft")
                rl.addWidget(self.lbl_fieldmap)
            lab = QLabel(label)
            tip = pick(p.doc) if p else self.tr("parameter not described in the manual")
            if tip:
                lab.setToolTip(tip)
                widget.setToolTip(tip)
            form.addRow(lab, row)
            self._widgets.append((k, getter, setter, widget))
        self.edit_comment = QLineEdit(st.comment.lstrip("!").strip())
        self.edit_comment.setPlaceholderText(self.tr("no comment"))
        self.edit_comment.editingFinished.connect(self._commit_params)
        self.edit_comment.setReadOnly(read_only)
        form.addRow(self.tr("Comment"), self.edit_comment)
        lay.addLayout(form)

        self.lbl_position = QLabel("")
        self.lbl_position.setObjectName("mono")
        self.lbl_position.setWordWrap(True)
        self.lbl_position.setTextInteractionFlags(Qt.TextSelectableByMouse)
        lay.addWidget(self.lbl_position)
        self.lbl_issues = QLabel("")
        self.lbl_issues.setWordWrap(True)
        self.lbl_issues.setTextFormat(Qt.RichText)
        lay.addWidget(self.lbl_issues)
        lay.addStretch(1)
        self._refresh_values(st, values=False)

    def _make_signature(self, st):
        if st is None:
            return None
        return (st.line_no, st.key, len(st.params), bool(st.comment_name), self._read_only)

    def _param_widget(self, p, value, k):
        kind = p.kind if p is not None else schema.FLOAT
        if kind == schema.ENUM:
            combo = QComboBox()
            _compact(combo)
            for v, text in p.choices:
                combo.addItem(v if pick(text) == v else f"{v} — {pick(text)}", v)
            self._set_combo(combo, p, value)
            combo.activated.connect(lambda _i: self._commit_params())
            combo.setEnabled(not self._read_only)
            return combo, lambda c=combo: c.currentData() or "", lambda v, c=combo, p=p: self._set_combo(c, p, v)
        if kind == schema.FLAG:
            box = QCheckBox(self.tr("on"))
            box.setChecked(value == "1")
            box.toggled.connect(lambda _on: self._commit_params())
            box.setEnabled(not self._read_only)
            return box, lambda b=box: "1" if b.isChecked() else "0", lambda v, b=box: b.setChecked(v == "1")
        if kind == schema.FIELDMAP:
            combo = QComboBox()
            _compact(combo)
            combo.setEditable(True)
            combo.setInsertPolicy(QComboBox.NoInsert)
            for base in sorted(self._fieldmaps, key=str.lower):
                combo.addItem(base)
            combo.setEditText(value)
            combo.lineEdit().editingFinished.connect(self._commit_params)
            combo.activated.connect(lambda _i: self._commit_params())
            combo.setEnabled(not self._read_only)
            return combo, lambda c=combo: c.currentText().strip(), lambda v, c=combo: c.setEditText(v)
        edit = QLineEdit(value)
        if kind == schema.RESERVED:
            edit.setReadOnly(True)
            edit.setObjectName("reserved")
        else:
            if kind in (schema.FLOAT,):
                edit.setValidator(QRegExpValidator(FLOAT_RE, edit))
            elif kind == schema.INT:
                edit.setValidator(QRegExpValidator(INT_RE, edit))
            edit.setReadOnly(self._read_only)
            edit.editingFinished.connect(self._commit_params)
        return edit, lambda e=edit: e.text().strip(), lambda v, e=edit: e.setText(v)

    @staticmethod
    def _set_combo(combo, p, value):
        v = p.choice_value(value)
        if v is None and value != "":
            idx = combo.findData(value)
            if idx < 0:
                combo.addItem(f"{value} — ?", value)
            combo.setCurrentIndex(combo.findData(value))
        elif v is not None:
            combo.setCurrentIndex(combo.findData(v))
        else:
            combo.setCurrentIndex(-1)

    # ---- values / computed info ------------------------------------------------------
    def _refresh_values(self, st, values=True):
        if values:
            for k, _getter, setter, widget in self._widgets:
                if not widget.hasFocus() and not (isinstance(widget, QComboBox) and widget.isEditable()
                                                  and widget.lineEdit().hasFocus()):
                    widget.blockSignals(True)
                    setter(st.param(k))
                    widget.blockSignals(False)
            if not self.edit_name.hasFocus():
                self.edit_name.setText(st.name)
        lines = []
        if st.active and st.z_start is not None:
            if st.is_element:
                lines.append(self.tr("z = %s … %s m   (length %s m)") % (_fmt(st.z_start), _fmt(st.z_end), _fmt(st.length)))
                if st.key == "bend" and to_float(st.param(0)) == 0:
                    lines.append(self.tr("arc length |α|·ρ = %s m (computed)") % _fmt(st.length))
            else:
                lines.append(self.tr("at z = %s m") % _fmt(st.z_start))
        if st.key == "field":
            ref = schema.LATTICE_KEYWORDS["field"].params[2].choice_label(st.param(2))
            if ref:
                lines.append(self.tr("phase parameter = %s") % pick(ref))
            if self.lbl_fieldmap is not None and self._doc is not None:
                found, missing = self._doc.fieldmap_status(st)
                exts = " ".join("." + e for e in sorted(found))
                if missing:
                    self.lbl_fieldmap.setText(f"<span style='color:{theme.color('danger')}'>✗</span> {exts}")
                    self.lbl_fieldmap.setToolTip(self.tr("missing: %s") % missing)
                elif found:
                    self.lbl_fieldmap.setText(f"<span style='color:{theme.color('success')}'>✓</span> {exts}")
                    self.lbl_fieldmap.setToolTip("\n".join(f".{e}: {pick(EXT_MEANING[e])}" for e in sorted(found)))
                else:
                    self.lbl_fieldmap.setText("")
        self.lbl_position.setText("\n".join(lines))
        if st.issues:
            rows = []
            for issue in st.issues:
                color = theme.color("danger" if issue.level == ERROR else "warning")
                mark = "✗" if issue.level == ERROR else "⚠"
                rows.append(f"<span style='color:{color}'>{mark}</span> {pick(issue.text)}")
            self.lbl_issues.setText("<br>".join(rows))
            self.lbl_issues.setVisible(True)
        else:
            self.lbl_issues.setVisible(False)

    # ---- commit ---------------------------------------------------------------------
    def _commit_params(self):
        st = self._st
        if st is None or self._read_only:
            return
        values = [""] * max(len(st.params), len(self._widgets))
        for k, getter, _setter, _w in self._widgets:
            values[k] = getter()
        comment = self.edit_comment.text().strip()
        comment = ("! " + comment) if comment else ""
        text = format_statement(st, params=values, comment=comment)
        if text != st.raw:
            self.edits_requested.emit([(st.line_no, text)])

    def _commit_name(self):
        st = self._st
        if st is None or self._read_only or self.edit_name.text().strip() == st.name:
            return
        self.edits_requested.emit(rename_edits(st, self.edit_name.text()))


# --------------------------------------------------------------------------- parameter grid
class _EnumDelegate(QStyledItemDelegate):
    def __init__(self, grid):
        super().__init__(grid)
        self.grid = grid

    def createEditor(self, parent, option, index):  # noqa: N802 (Qt naming)
        p = self.grid.param_for_column(index.column())
        if p is None or p.kind != schema.ENUM:
            return super().createEditor(parent, option, index)
        combo = QComboBox(parent)
        for v, text in p.choices:
            combo.addItem(v if pick(text) == v else f"{v} — {pick(text)}", v)
        return combo

    def setEditorData(self, editor, index):  # noqa: N802 (Qt naming)
        if isinstance(editor, QComboBox):
            idx = editor.findData(index.data(RAW_ROLE))
            editor.setCurrentIndex(max(idx, 0))
        else:
            super().setEditorData(editor, index)

    def setModelData(self, editor, model, index):  # noqa: N802 (Qt naming)
        if isinstance(editor, QComboBox):
            model.setData(index, editor.currentData(), RAW_ROLE)
            model.setData(index, editor.currentText(), Qt.DisplayRole)
        else:
            super().setModelData(editor, model, index)


class ParamGrid(QWidget):
    edits_requested = pyqtSignal(object)
    line_selected = pyqtSignal(int)

    FIXED_COLS = 2      # line, name

    def __init__(self, parent=None):
        super().__init__(parent)
        self._doc = None
        self._rows = []
        self._params = []
        self._read_only = False
        self._loading = False
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 6, 0, 0)
        lay.setSpacing(6)
        bar = QHBoxLayout()
        bar.addWidget(QLabel(self.tr("Keyword")))
        self.combo = QComboBox()
        _compact(self.combo)
        self.combo.setMinimumContentsLength(24)
        self.combo.currentIndexChanged.connect(lambda _i: self._fill())
        bar.addWidget(self.combo)
        bar.addStretch(1)
        self.btn_set = QPushButton(self.tr("Set selected cells..."))
        self.btn_set.setObjectName("flat")
        self.btn_set.setToolTip(self.tr("Give every selected cell of the table the same value"))
        self.btn_set.clicked.connect(self._set_selected)
        bar.addWidget(self.btn_set)
        lay.addLayout(bar)
        self.table = QTableWidget(0, 0)
        self.table.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.table.verticalHeader().setVisible(False)
        self.table.verticalHeader().setDefaultSectionSize(theme.px(26))
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self.table.horizontalHeader().setDefaultSectionSize(theme.px(96))
        self.table.setItemDelegate(_EnumDelegate(self))
        self.table.itemChanged.connect(self._on_item_changed)
        self.table.currentCellChanged.connect(self._on_current_cell)
        lay.addWidget(self.table, 1)
        self.lbl_hint = QLabel(self.tr("Double-click a cell to edit; the lattice text is updated immediately. "
                                       "Hover a column header for the meaning of the parameter."))
        self.lbl_hint.setObjectName("soft")
        self.lbl_hint.setWordWrap(True)
        lay.addWidget(self.lbl_hint)

    def param_for_column(self, col):
        k = col - self.FIXED_COLS
        return self._params[k] if 0 <= k < len(self._params) else None

    def set_document(self, doc, read_only=False):
        self._doc = doc
        self._read_only = read_only
        counts = {}
        for st in doc.statements:
            counts[st.key] = counts.get(st.key, 0) + 1
        current = self.combo.currentData()
        self.combo.blockSignals(True)
        self.combo.clear()
        order = sorted(counts, key=lambda k: (0 if k in schema.ELEMENT_KEYWORDS else 1, -counts[k], k))
        for key in order:
            spec = schema.lattice_keyword(key)
            title = pick(spec.title) if spec else self.tr("unknown")
            self.combo.addItem(f"{key}  ·  {title}  ({counts[key]})", key)
        if current is None:
            current = "field" if "field" in counts else (order[0] if order else None)
        idx = self.combo.findData(current)
        self.combo.setCurrentIndex(max(idx, 0))
        self.combo.blockSignals(False)
        self.btn_set.setEnabled(not read_only)
        self._fill()

    def _fill(self):
        key = self.combo.currentData()
        self._loading = True
        try:
            doc = self._doc
            rows = [st for st in doc.statements if st.key == key] if doc and key else []
            spec = schema.lattice_keyword(key) if key else None
            width = max([len(spec.params) if spec else 0] + [len(st.params) for st in rows])
            self._params = [spec.params[k] if spec and k < len(spec.params) else None for k in range(width)]
            self._rows = rows
            headers = [self.tr("Line"), self.tr("Name")]
            tips = ["", ""]
            for k, p in enumerate(self._params):
                if p is None:
                    headers.append(f"P{k + 1}")
                    tips.append(self.tr("parameter not described in the manual"))
                else:
                    headers.append(pick(p.label) + (f"\n({p.unit})" if p.unit else ""))
                    tips.append(pick(p.doc))
            self.table.clear()
            self.table.setColumnCount(len(headers))
            self.table.setRowCount(len(rows))
            for c, (h, tip) in enumerate(zip(headers, tips)):
                it = QTableWidgetItem(h)
                it.setToolTip(tip or h)
                self.table.setHorizontalHeaderItem(c, it)
            self.table.setColumnWidth(0, theme.px(52))
            self.table.setColumnWidth(1, theme.px(120))
            editable = Qt.ItemIsSelectable | Qt.ItemIsEnabled | (0 if self._read_only else Qt.ItemIsEditable)
            for r, st in enumerate(rows):
                line = QTableWidgetItem(str(st.line_no + 1))
                line.setFlags(Qt.ItemIsSelectable | Qt.ItemIsEnabled)
                line.setForeground(theme.qcolor("fg_soft"))
                line.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                if st.issues:
                    bad = st.worst_issue() == ERROR
                    line.setIcon(icons.icon("error" if bad else "warning", "danger" if bad else "warning"))
                    line.setToolTip("\n".join(pick(i.text) for i in st.issues))
                self.table.setItem(r, 0, line)
                name = QTableWidgetItem(st.name)
                name.setFlags(Qt.ItemIsSelectable | Qt.ItemIsEnabled |
                              (0 if self._read_only or not (spec and spec.category in schema.ELEMENT_CATEGORIES)
                               else Qt.ItemIsEditable))
                if not st.active:
                    name.setForeground(theme.qcolor("fg_soft"))
                self.table.setItem(r, 1, name)
                for k, p in enumerate(self._params):
                    value = st.param(k, None)
                    it = QTableWidgetItem()
                    it.setData(RAW_ROLE, value or "")
                    display = value or ""
                    if p is not None and p.kind == schema.ENUM and value is not None:
                        label = p.choice_label(value)
                        display = f"{value} — {pick(label)}" if label and pick(label) != value else value
                    it.setData(Qt.DisplayRole, display)
                    it.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter if p is None or p.kind not in
                                        (schema.ENUM, schema.FIELDMAP, schema.TEXT) else Qt.AlignLeft | Qt.AlignVCenter)
                    flags = editable
                    if p is not None and p.kind == schema.RESERVED:
                        flags = Qt.ItemIsSelectable | Qt.ItemIsEnabled
                        it.setForeground(theme.qcolor("fg_soft"))
                    if value is None:
                        it.setBackground(theme.qcolor("cell_unused"))
                    it.setFlags(flags)
                    self.table.setItem(r, self.FIXED_COLS + k, it)
        finally:
            self._loading = False

    def _cell_value(self, item):
        raw = item.data(RAW_ROLE)
        text = item.text().strip()
        p = self.param_for_column(item.column())
        if p is not None and p.kind == schema.ENUM:
            return (raw if raw is not None else text.split(" ")[0]).strip()
        return text

    def _row_edits(self, r, overrides):
        st = self._rows[r]
        values = [st.param(k) for k in range(max(len(st.params), len(self._params)))]
        name = None
        for col, value in overrides.items():
            if col == 1:
                name = value
            else:
                k = col - self.FIXED_COLS
                while len(values) <= k:
                    values.append("0")
                values[k] = value
        edits = rename_edits(st, name) if name is not None and name != st.name else []
        prefix_name = name if name is not None and not (st.comment_name and not st.prefix_name) else None
        text = format_statement(st, params=values, name=prefix_name)
        if any(line == st.line_no for line, _t in edits):
            edits = [(line, text if line == st.line_no else t) for line, t in edits]
        elif text != st.raw:
            edits.append((st.line_no, text))
        return edits

    def _on_item_changed(self, item):
        if self._loading or item.column() == 0 or item.row() >= len(self._rows):
            return
        edits = self._row_edits(item.row(), {item.column(): self._cell_value(item)})
        if edits:
            self.edits_requested.emit(edits)

    def _set_selected(self):
        cells = [i for i in self.table.selectedItems() if i.column() >= 1 and i.flags() & Qt.ItemIsEditable]
        if not cells:
            return
        value, ok = QInputDialog.getText(self, self.tr("Set selected cells"),
                                         self.tr("Value for %d cells:") % len(cells))
        if not ok:
            return
        per_row = {}
        for it in cells:
            per_row.setdefault(it.row(), {})[it.column()] = value.strip()
        edits = []
        for r, overrides in per_row.items():
            edits += self._row_edits(r, overrides)
        if edits:
            self.edits_requested.emit(edits)

    def _on_current_cell(self, row, _col, _prow, _pcol):
        if not self._loading and 0 <= row < len(self._rows):
            self.line_selected.emit(self._rows[row].line_no)

    def select_line(self, line_no):
        st = self._doc.statement_at(line_no) if self._doc else None
        if st is None:
            return
        if st.key != self.combo.currentData():
            return
        for r, row in enumerate(self._rows):
            if row.line_no == line_no:
                self._loading = True
                self.table.setCurrentCell(r, max(1, self.table.currentColumn()))
                self._loading = False
                break


# --------------------------------------------------------------------------- the editor
class StructureEditor(QWidget):
    edited = pyqtSignal()              # the text was changed from this widget
    document_changed = pyqtSignal()    # re-parsed (after typing or an edit)

    FILTER_ALL, FILTER_ELEMENTS, FILTER_COMMANDS, FILTER_ISSUES = "all", "elements", "commands", "issues"

    def __init__(self, read_only=False, parent=None):
        super().__init__(parent)
        self._text = None
        self._read_only = read_only
        self._field_dirs = []
        self._doc = LatticeDocument("")
        self._selected = None
        self._syncing = False
        self._expansion = {}          # group key -> expanded (remembered across re-parses)
        self._timer = QTimer(self)
        self._timer.setSingleShot(True)
        self._timer.setInterval(350)
        self._timer.timeout.connect(self.reparse)
        self._build()
        theme.notifier().changed.connect(self._refresh_views)

    # ---- ui ---------------------------------------------------------------------------
    def _build(self):
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(6)
        self.beamline = BeamlineView()
        self.beamline.line_clicked.connect(lambda n: self.select_line(n, source="beamline"))
        lay.addWidget(self.beamline)

        self.tabs = QTabWidget()
        self.tabs.setDocumentMode(True)
        lay.addWidget(self.tabs, 1)

        split = QSplitter(Qt.Horizontal)
        left = QWidget()
        ll = QVBoxLayout(left)
        ll.setContentsMargins(0, 6, 0, 0)
        ll.setSpacing(6)
        fl = QHBoxLayout()
        self.search = QLineEdit()
        self.search.setPlaceholderText(self.tr("Search name, keyword or field map"))
        self.search.setClearButtonEnabled(True)
        self.search.textChanged.connect(lambda _t: self._rebuild_tree())
        fl.addWidget(self.search, 1)
        self.filter = QComboBox()
        self.filter.addItem(self.tr("All"), self.FILTER_ALL)
        self.filter.addItem(self.tr("Elements"), self.FILTER_ELEMENTS)
        self.filter.addItem(self.tr("Commands"), self.FILTER_COMMANDS)
        self.filter.addItem(self.tr("With problems"), self.FILTER_ISSUES)
        self.filter.currentIndexChanged.connect(lambda _i: self._rebuild_tree())
        fl.addWidget(self.filter)
        ll.addLayout(fl)
        self.tree = QTreeWidget()
        self.tree.setHeaderLabels([self.tr("Name"), self.tr("Type"), self.tr("Parameters"), "z (m)"])
        self.tree.setUniformRowHeights(True)
        self.tree.setIconSize(QSize(theme.px(14), theme.px(14)))
        hdr = self.tree.header()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.resizeSection(0, theme.px(150))
        hdr.resizeSection(1, theme.px(110))
        hdr.resizeSection(2, theme.px(200))
        hdr.setStretchLastSection(True)
        self.tree.currentItemChanged.connect(self._on_tree_current)
        self.tree.itemCollapsed.connect(lambda it: self._expansion.__setitem__(it.data(0, RAW_ROLE), False))
        self.tree.itemExpanded.connect(lambda it: self._expansion.__setitem__(it.data(0, RAW_ROLE), True))
        ll.addWidget(self.tree, 1)
        split.addWidget(left)

        self.panel = PropertyPanel()
        self.panel.edits_requested.connect(self.apply_edits)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setWidget(self.panel)
        split.addWidget(scroll)
        split.setStretchFactor(0, 1)
        split.setStretchFactor(1, 1)
        self.tabs.addTab(split, self.tr("Structure"))

        self.grid = ParamGrid()
        self.grid.edits_requested.connect(self.apply_edits)
        self.grid.line_selected.connect(lambda n: self.select_line(n, source="grid"))
        self.tabs.addTab(self.grid, self.tr("Parameter table"))

        self.lbl_status = QLabel("")
        self.lbl_status.setObjectName("soft")
        self.lbl_status.setWordWrap(True)
        lay.addWidget(self.lbl_status)

    # ---- binding ----------------------------------------------------------------------
    def attach(self, text_edit):
        """Bind to a QPlainTextEdit (or a wrapper exposing ``.editor``)."""
        self._text = getattr(text_edit, "editor", text_edit)
        self._text.textChanged.connect(self._on_text_changed)
        self._text.cursorPositionChanged.connect(self._on_cursor_moved)
        self.reparse()

    def set_read_only(self, read_only):
        self._read_only = read_only
        self._refresh_views()

    def set_field_dirs(self, dirs):
        self._field_dirs = list(dirs)
        self.reparse()

    def document(self):
        return self._doc

    def _on_text_changed(self):
        if not self._syncing:
            self._timer.start()

    def reparse(self):
        self._timer.stop()
        text = self._text.toPlainText() if self._text is not None else ""
        self._doc = LatticeDocument(text, self._field_dirs)
        self.panel.set_fieldmaps(fieldmap_bases(self._field_dirs))
        self._refresh_views()
        self.document_changed.emit()

    def _refresh_views(self):
        doc = self._doc
        self.beamline.set_document(doc)
        self._rebuild_tree()
        self.grid.set_document(doc, self._read_only)
        st = doc.statement_at(self._selected) if self._selected is not None else None
        self.panel.show_statement(st, doc, self._read_only)
        if st is not None:
            self.beamline.select_line(st.line_no, ensure_visible=False)
        elements = doc.elements()
        issues = doc.issue_count()
        parts = [self.tr("%d elements") % len(elements), self.tr("total length %s m") % _fmt(doc.total_length),
                 self.tr("%d RF cavities") % len(doc.rf_cavities())]
        if issues:
            parts.append(f"<span style='color:{theme.color('warning')}'>" + self.tr("%d problems") % issues + "</span>")
        for issue in doc.issues:
            parts.append(pick(issue.text))
        self.lbl_status.setText("  ·  ".join(parts))

    # ---- tree -------------------------------------------------------------------------
    def _matches(self, st):
        mode = self.filter.currentData()
        if mode == self.FILTER_ELEMENTS and not st.is_element:
            return False
        if mode == self.FILTER_COMMANDS and st.is_element:
            return False
        if mode == self.FILTER_ISSUES and not st.issues:
            return False
        needle = self.search.text().strip().lower()
        if needle:
            hay = " ".join([st.name, st.keyword, " ".join(st.params)]).lower()
            return needle in hay
        return True

    def _statement_item(self, st):
        spec = st.spec
        it = QTreeWidgetItem([st.name or st.keyword, pick(spec.title) if spec else st.keyword,
                              statement_summary(st), _fmt(st.z_start) if st.active and st.z_start is not None else ""])
        it.setData(0, LINE_ROLE, st.line_no)
        worst = st.worst_issue()
        if worst:
            bad = worst == ERROR
            it.setIcon(0, icons.icon("error" if bad else "warning", "danger" if bad else "warning"))
            it.setToolTip(0, "\n".join(pick(i.text) for i in st.issues))
        elif st.is_element:
            it.setIcon(0, swatch(element_color_token(st)))
        if not st.active or not st.is_element:
            for c in range(4):
                it.setForeground(c, theme.qcolor("fg_soft" if not st.active else "fg_muted"))
        it.setTextAlignment(3, Qt.AlignRight | Qt.AlignVCenter)
        return it

    def _rebuild_tree(self):
        tree = self.tree
        tree.blockSignals(True)
        tree.clear()
        filtered = self.filter.currentData() != self.FILTER_ALL or self.search.text().strip()
        if filtered:
            for st in self._doc.statements:
                if self._matches(st):
                    tree.addTopLevelItem(self._statement_item(st))
        else:
            self._add_children(tree.invisibleRootItem(), self._doc.root)
        tree.blockSignals(False)
        if self._selected is not None:
            self._select_tree_line(self._selected)

    def _add_children(self, parent, group):
        for child in group.children:
            if isinstance(child, Group):
                if next(iter(child.statements()), None) is None:
                    continue            # a heading comment with nothing under it
                key = f"{child.kind}:{child.line_no}"
                n = sum(1 for s in child.statements() if s.is_element)
                title = child.title if child.kind != "superpose" else self.tr("superpose (%d elements)") % n
                item = QTreeWidgetItem([title, {"heading": self.tr("group"), "section": "section",
                                                "superpose": "superpose", "period": "lattice"}.get(child.kind, ""),
                                        "", ""])
                item.setData(0, RAW_ROLE, key)
                first = next(iter(child.statements()), None)
                if first is not None:
                    item.setData(0, LINE_ROLE, first.line_no)
                    if first.active and first.z_start is not None:
                        item.setText(3, _fmt(first.z_start))
                        item.setTextAlignment(3, Qt.AlignRight | Qt.AlignVCenter)
                font = item.font(0)
                font.setBold(child.kind in ("heading", "section", "period"))
                item.setFont(0, font)
                parent.addChild(item)
                self._add_children(item, child)
                item.setExpanded(self._expansion.get(key, child.kind != "superpose"))
            else:
                parent.addChild(self._statement_item(child))

    def _select_tree_line(self, line_no):
        found = None
        stack = [self.tree.invisibleRootItem()]
        while stack and found is None:
            node = stack.pop()
            for i in range(node.childCount()):
                child = node.child(i)
                if child.data(0, RAW_ROLE) is None and child.data(0, LINE_ROLE) == line_no:
                    found = child
                    break
                stack.append(child)
        if found is None:
            return
        self.tree.blockSignals(True)
        parent = found.parent()
        while parent is not None:
            parent.setExpanded(True)
            parent = parent.parent()
        self.tree.setCurrentItem(found)
        self.tree.scrollToItem(found)
        self.tree.blockSignals(False)

    def _on_tree_current(self, item, _prev):
        if item is None:
            return
        line = item.data(0, LINE_ROLE)
        if line is not None:
            self.select_line(line, source="tree")

    # ---- selection --------------------------------------------------------------------
    def select_line(self, line_no, source=None):
        st = self._doc.statement_at(line_no)
        if st is None:
            return
        self._selected = line_no
        if source != "tree":
            self._select_tree_line(line_no)
        if source != "beamline":
            self.beamline.select_line(line_no)
        if source != "grid":
            self.grid.select_line(line_no)
        self.panel.show_statement(st, self._doc, self._read_only)
        if source != "text" and self._text is not None:
            self._syncing = True
            try:
                block = self._text.document().findBlockByNumber(line_no)
                if block.isValid():
                    self._text.setTextCursor(QTextCursor(block))
                    self._text.centerCursor()
            finally:
                self._syncing = False

    def selected_statement(self):
        return self._doc.statement_at(self._selected) if self._selected is not None else None

    def _on_cursor_moved(self):
        if self._syncing or self._text is None:
            return
        line = self._text.textCursor().blockNumber()
        if self._doc.statement_at(line) is not None and line != self._selected:
            self.select_line(line, source="text")

    # ---- editing ----------------------------------------------------------------------
    def apply_edits(self, edits):
        """Replace lines: ``[(line_no, text)]``, applied as one undo step of the text editor."""
        if self._text is None or self._read_only or not edits:
            return
        doc = self._text.document()
        cursor = QTextCursor(doc)
        cursor.beginEditBlock()
        self._syncing = True
        try:
            for line_no, text in sorted(edits, key=lambda e: e[0], reverse=True):
                block = doc.findBlockByNumber(line_no)
                if not block.isValid():
                    continue
                cursor.setPosition(block.position())
                cursor.movePosition(QTextCursor.EndOfBlock, QTextCursor.KeepAnchor)
                cursor.insertText(text)
        finally:
            cursor.endEditBlock()
            self._syncing = False
        self.reparse()
        self.edited.emit()

