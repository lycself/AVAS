"""Tables that show what each line of a keyword file means.

* :class:`KeywordTable` - ``beam.txt`` / ``input.txt``: one row per keyword,
  values in columns, meaning and unit of every value from the manual
  (:mod:`avas.data.schema`), drop-down lists for enumerated values.
* :class:`IniTable` - ``ini.ini``: section / key / value / meaning.
* :class:`TraceWinTable` - read-only element list of a TraceWin ``.dat``.
* :class:`SeParticleTable` - ``SeParticle.txt`` columns with units.

All of them follow the protocol of the Files page: ``set_text(text)``,
``text()`` and a ``changed`` signal; comment and blank lines are kept.
"""
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import (QAbstractItemView, QComboBox, QHBoxLayout, QHeaderView, QInputDialog, QLabel,
                             QPushButton, QStyledItemDelegate, QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget)

from avas.data import schema
from avas.data.filekinds import TRACEWIN_WORDS
from avas.gui import theme
from avas.gui.widgets.table_editors import TokenTableEditor
from avas.i18n import pick

RAW_ROLE = Qt.UserRole + 1


def _param_tip(p):
    text = pick(p.label) + (f" ({p.unit})" if p.unit else "")
    doc = pick(p.doc)
    return f"{text}: {doc}" if doc else text


class _KeywordDelegate(QStyledItemDelegate):
    def __init__(self, table):
        super().__init__(table.table)
        self.owner = table

    def createEditor(self, parent, option, index):  # noqa: N802 (Qt naming)
        p = self.owner.param_at(index.row(), index.column())
        if p is not None and p.kind == schema.ENUM:
            combo = QComboBox(parent)
            combo.setEditable(False)
            for v, text in p.choices:
                combo.addItem(v if pick(text) == v else f"{v} — {pick(text)}", v)
            return combo
        return super().createEditor(parent, option, index)

    def setEditorData(self, editor, index):  # noqa: N802 (Qt naming)
        if isinstance(editor, QComboBox):
            p = self.owner.param_at(index.row(), index.column())
            value = p.choice_value(index.data(RAW_ROLE) or "")
            editor.setCurrentIndex(max(0, editor.findData(value)))
        else:
            super().setEditorData(editor, index)

    def setModelData(self, editor, model, index):  # noqa: N802 (Qt naming)
        if isinstance(editor, QComboBox):
            model.setData(index, editor.currentData(), RAW_ROLE)
            model.setData(index, editor.currentText(), Qt.DisplayRole)
        else:
            model.setData(index, None, RAW_ROLE)
            super().setModelData(editor, model, index)


class KeywordTable(QWidget):
    changed = pyqtSignal()
    VALUE_COLS = 3

    def __init__(self, keywords, parent=None):
        super().__init__(parent)
        self.keywords = keywords          # schema.BEAM_KEYWORDS or schema.INPUT_KEYWORDS
        self._layout = []                 # ("raw", text) | ("row", None)
        self._loading = False
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(6)
        self.table = QTableWidget(0, 0)
        self.table.verticalHeader().setVisible(False)
        self.table.verticalHeader().setDefaultSectionSize(theme.px(26))
        self.table.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.table.setItemDelegate(_KeywordDelegate(self))
        self.table.itemChanged.connect(self._on_item_changed)
        self.table.currentCellChanged.connect(lambda r, c, _pr, _pc: self._show_detail(r, c))
        lay.addWidget(self.table, 1)
        self.lbl_detail = QLabel("")
        self.lbl_detail.setObjectName("muted")
        self.lbl_detail.setWordWrap(True)
        self.lbl_detail.setTextFormat(Qt.RichText)
        lay.addWidget(self.lbl_detail)
        bar = QHBoxLayout()
        bar.addStretch(1)
        self.btn_add = QPushButton(self.tr("Add keyword..."))
        self.btn_add.setObjectName("flat")
        self.btn_add.clicked.connect(self.add_keyword)
        self.btn_del = QPushButton(self.tr("Remove selected"))
        self.btn_del.setObjectName("flat")
        self.btn_del.clicked.connect(self.remove_selected)
        bar.addWidget(self.btn_add)
        bar.addWidget(self.btn_del)
        lay.addLayout(bar)
        self._set_columns(self.VALUE_COLS)

    def _set_columns(self, n):
        headers = [self.tr("Keyword"), self.tr("Meaning")] + [self.tr("Value %d") % (i + 1) for i in range(n)]
        self.table.setColumnCount(len(headers))
        self.table.setHorizontalHeaderLabels(headers)
        hdr = self.table.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.setStretchLastSection(True)
        self.table.setColumnWidth(0, theme.px(170))
        self.table.setColumnWidth(1, theme.px(170))
        for c in range(2, len(headers)):
            self.table.setColumnWidth(c, theme.px(150))

    def spec_at(self, row):
        it = self.table.item(row, 0)
        return self.keywords.get(it.text().strip().lower()) if it is not None else None

    def param_at(self, row, col):
        spec = self.spec_at(row)
        k = col - 2
        return spec.params[k] if spec is not None and 0 <= k < len(spec.params) else None

    # ---- text <-> table ---------------------------------------------------------------
    def set_text(self, text):
        self._loading = True
        try:
            rows, layout = [], []
            for line in text.splitlines():
                code = line.split("!", 1)[0].split()
                if not code:
                    layout.append(("raw", line))
                else:
                    layout.append(("row", None))
                    rows.append(code)
            self._layout = layout
            width = max([self.VALUE_COLS] + [len(r) - 1 for r in rows] +
                        [len(self.keywords[r[0].lower()].params) for r in rows if r[0].lower() in self.keywords])
            self.table.setRowCount(0)
            self._set_columns(width)
            self.table.setRowCount(len(rows))
            for r, tokens in enumerate(rows):
                self._fill_row(r, tokens)
        finally:
            self._loading = False

    def _fill_row(self, r, tokens):
        keyword = tokens[0]
        spec = self.keywords.get(keyword.lower())
        it = QTableWidgetItem(keyword)
        if spec is None:
            it.setForeground(theme.qcolor("warning"))
            it.setToolTip(self.tr("Not in the manual; kept as it is."))
        else:
            it.setToolTip(pick(spec.doc) or pick(spec.title))
        self.table.setItem(r, 0, it)
        title = pick(spec.title) if spec else ""
        if spec is not None and any(p.unit for p in spec.params):
            title += "  [" + ", ".join(p.unit or "–" for p in spec.params) + "]"
        meaning = QTableWidgetItem(title)
        meaning.setFlags(Qt.ItemIsSelectable | Qt.ItemIsEnabled)
        meaning.setForeground(theme.qcolor("fg_muted"))
        self.table.setItem(r, 1, meaning)
        for c in range(2, self.table.columnCount()):
            k = c - 2
            value = tokens[k + 1] if k + 1 < len(tokens) else ""
            p = spec.params[k] if spec is not None and k < len(spec.params) else None
            cell = QTableWidgetItem()
            cell.setData(RAW_ROLE, value)
            display = value
            if p is not None:
                if p.kind == schema.ENUM and value:
                    label = p.choice_label(value)
                    display = f"{value} — {pick(label)}" if label and pick(label) != value else value
                cell.setToolTip(_param_tip(p))
            elif spec is not None:
                cell.setFlags(Qt.ItemIsSelectable | Qt.ItemIsEnabled | Qt.ItemIsEditable)
                cell.setBackground(theme.qcolor("cell_unused"))
            cell.setData(Qt.DisplayRole, display)
            self.table.setItem(r, c, cell)

    def _row_tokens(self, r):
        tokens = [self.table.item(r, 0).text().strip()] if self.table.item(r, 0) else [""]
        for c in range(2, self.table.columnCount()):
            it = self.table.item(r, c)
            if it is None:
                tokens.append("")
                continue
            raw = it.data(RAW_ROLE)
            p = self.param_at(r, c)
            if p is not None and p.kind == schema.ENUM and raw:
                tokens.append(str(raw))
            else:
                tokens.append(it.text().split(" — ")[0].strip())
        while tokens and tokens[-1] == "":
            tokens.pop()
        return [t if t else "0" for t in tokens]

    def text(self):
        out, r = [], 0
        for kind, raw in self._layout:
            if kind == "raw":
                out.append(raw)
            else:
                if r < self.table.rowCount():
                    tokens = self._row_tokens(r)
                    if tokens and tokens[0]:
                        out.append(" ".join(tokens))
                r += 1
        for extra in range(r, self.table.rowCount()):
            tokens = self._row_tokens(extra)
            if tokens and tokens[0]:
                out.append(" ".join(tokens))
        return "\n".join(out).rstrip("\n") + "\n"

    # ---- editing ----------------------------------------------------------------------
    def _on_item_changed(self, item):
        if self._loading:
            return
        if item.column() == 0:          # keyword renamed: refresh meaning and tooltips
            self._loading = True
            try:
                self._fill_row(item.row(), self._row_tokens(item.row()))
            finally:
                self._loading = False
        self.changed.emit()

    def _show_detail(self, row, col):
        spec = self.spec_at(row) if row >= 0 else None
        if spec is None:
            self.lbl_detail.setText("")
            return
        rows = [f"<b>{spec.key}</b> — {pick(spec.title)}" + (f": {pick(spec.doc)}" if pick(spec.doc) else "")]
        for k, p in enumerate(spec.params):
            mark = "▸ " if col - 2 == k else ""
            rows.append(f"{mark}{self.tr('Value %d') % (k + 1)}: {_param_tip(p)}")
        self.lbl_detail.setText("<br>".join(rows))

    def add_keyword(self):
        present = {self.table.item(r, 0).text().lower() for r in range(self.table.rowCount()) if self.table.item(r, 0)}
        options = [f"{k}  —  {pick(s.title)}" for k, s in self.keywords.items() if k not in present]
        if not options:
            return
        choice, ok = QInputDialog.getItem(self, self.tr("Add keyword"), self.tr("Keyword"), options, 0, False)
        if not ok:
            return
        key = choice.split()[0]
        spec = self.keywords[key]
        r = self.table.rowCount()
        self._loading = True
        try:
            self.table.insertRow(r)
            self._fill_row(r, [key] + ["0" if p.kind != schema.ENUM else str(p.choices[0][0]) for p in spec.params])
        finally:
            self._loading = False
        self.table.setCurrentCell(r, 2)
        self.changed.emit()

    def remove_selected(self):
        rows = sorted({i.row() for i in self.table.selectedIndexes()}, reverse=True)
        if not rows:
            return
        for r in rows:
            self.table.removeRow(r)
            # drop the matching "row" slot from the layout
            seen = -1
            for i, (kind, _raw) in enumerate(self._layout):
                if kind == "row":
                    seen += 1
                    if seen == r:
                        del self._layout[i]
                        break
        self.changed.emit()

    def set_editable(self, editable):
        self.table.setEditTriggers(QAbstractItemView.DoubleClicked | QAbstractItemView.EditKeyPressed
                                   | QAbstractItemView.AnyKeyPressed if editable else QAbstractItemView.NoEditTriggers)
        self.btn_add.setEnabled(editable)
        self.btn_del.setEnabled(editable)


class IniTable(QWidget):
    """``ini.ini`` as section / key / value / meaning; only values are editable."""
    changed = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self._lines = []
        self._rows = []           # line index per row
        self._loading = False
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        self.table = QTableWidget(0, 4)
        self.table.setHorizontalHeaderLabels([self.tr("Section"), self.tr("Key"), self.tr("Value"), self.tr("Meaning")])
        self.table.verticalHeader().setVisible(False)
        hdr = self.table.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.setStretchLastSection(True)
        self.table.setColumnWidth(0, theme.px(100))
        self.table.setColumnWidth(1, theme.px(150))
        self.table.setColumnWidth(2, theme.px(200))
        self.table.itemChanged.connect(lambda _i: None if self._loading else self.changed.emit())
        lay.addWidget(self.table, 1)
        hint = QLabel(self.tr("Settings used by the GUI and by 'avas run' (run mode, error study, lattice file, "
                              "field-map directory). Most are also set on the Settings and Lattice pages."))
        hint.setObjectName("soft")
        hint.setWordWrap(True)
        lay.addWidget(hint)

    def set_text(self, text):
        self._loading = True
        try:
            self._lines = text.splitlines()
            self._rows = []
            section = ""
            entries = []
            for i, line in enumerate(self._lines):
                s = line.strip()
                if s.startswith("[") and s.endswith("]"):
                    section = s[1:-1]
                elif "=" in s and not s.startswith(("#", ";")):
                    key, value = s.split("=", 1)
                    entries.append((i, section, key.strip(), value.strip()))
            self.table.setRowCount(len(entries))
            for r, (i, section, key, value) in enumerate(entries):
                self._rows.append(i)
                meaning = schema.INI_KEYS.get((section, key))
                for c, text_ in enumerate((section, key, value, pick(meaning[0]) if meaning else "")):
                    it = QTableWidgetItem(text_)
                    if c != 2:
                        it.setFlags(Qt.ItemIsSelectable | Qt.ItemIsEnabled)
                        if c == 3:
                            it.setForeground(theme.qcolor("fg_muted"))
                    self.table.setItem(r, c, it)
        finally:
            self._loading = False

    def text(self):
        lines = list(self._lines)
        for r, i in enumerate(self._rows):
            key = self.table.item(r, 1).text()
            value = self.table.item(r, 2).text().strip()
            lines[i] = f"{key} = {value}" if value else f"{key} = "
        return "\n".join(lines).rstrip("\n") + "\n"

    def set_editable(self, editable):
        self.table.setEditTriggers(QAbstractItemView.DoubleClicked | QAbstractItemView.EditKeyPressed
                                   if editable else QAbstractItemView.NoEditTriggers)


class TraceWinTable(QWidget):
    """Read-only element list of a TraceWin lattice (units are millimetres)."""
    changed = pyqtSignal()
    MAX_PARAMS = 10

    def __init__(self, parent=None):
        super().__init__(parent)
        self._text = ""
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        self.table = QTableWidget(0, 2 + self.MAX_PARAMS)
        self.table.setHorizontalHeaderLabels([self.tr("Line"), self.tr("Keyword")] +
                                             [f"P{i + 1}" for i in range(self.MAX_PARAMS)])
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self.table.horizontalHeader().setDefaultSectionSize(theme.px(90))
        self.table.setColumnWidth(0, theme.px(52))
        self.table.setColumnWidth(1, theme.px(150))
        lay.addWidget(self.table, 1)
        self.lbl = QLabel(self.tr("TraceWin lattice (lengths in mm). AVAS cannot run it directly; it is shown "
                                  "read-only. Hover a value for its meaning where it is known."))
        self.lbl.setObjectName("soft")
        self.lbl.setWordWrap(True)
        lay.addWidget(self.lbl)

    def set_text(self, text):
        self._text = text
        rows = []
        for no, line in enumerate(text.splitlines()):
            code = line.split(";", 1)[0].split()
            if code:
                rows.append((no, code))
        self.table.setRowCount(len(rows))
        for r, (no, code) in enumerate(rows):
            key = code[0]
            captions = schema.TRACEWIN_PARAMS.get(key.lower(), [])
            items = [QTableWidgetItem(str(no + 1)), QTableWidgetItem(key)]
            if key.lower() not in TRACEWIN_WORDS:
                items[1].setForeground(theme.qcolor("fg_muted"))
            for k, value in enumerate(code[1:1 + self.MAX_PARAMS]):
                it = QTableWidgetItem(value)
                if k < len(captions):
                    name, unit = captions[k]
                    it.setToolTip(f"{name} ({unit})" if unit else name)
                items.append(it)
            for c, it in enumerate(items):
                self.table.setItem(r, c, it)

    def text(self):
        return self._text

    def set_editable(self, _editable):
        pass


class SeParticleTable(TokenTableEditor):
    """``SeParticle.txt``: one secondary particle per row."""

    def __init__(self, parent=None):
        columns = [(f"{pick(label)} ({unit})" if unit else pick(label), pick(label)) for label, unit in
                   schema.SEPARTICLE_COLUMNS]
        super().__init__(columns, wrap_start_end=False, parent=parent)
        self.lbl_hint.setText(self.tr("Secondary particles, read when secondarybeam is 1 in input.txt."))
