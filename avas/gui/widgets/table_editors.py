"""Table editors for the whitespace-separated text files in InputFile/.

:class:`TokenTableEditor` is a generic "one line = one row, one token = one
cell" editor with optional ``start``/``end`` wrapper lines, add/remove row
buttons and per-column captions.  Used for ``boundary.txt``, ``scanData.txt``
and ``SeParticle.txt``.  Lattices are edited with
:mod:`avas.gui.lattice_editor.structure_editor`.
"""
from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWidgets import (QAbstractItemView, QHBoxLayout, QHeaderView, QLabel, QPushButton, QTableWidget,
                             QTableWidgetItem, QVBoxLayout, QWidget)

COMMENT = "!"


def split_comment(line):
    """Return ``(code, comment)`` where *comment* includes the leading ``!``."""
    idx = line.find(COMMENT)
    if idx < 0:
        return line, ""
    return line[:idx], line[idx:]


# --------------------------------------------------------------------------- generic file table
class TokenTableEditor(QWidget):
    """Edit a whitespace-separated text file as a table.

    ``columns`` is a list of ``(caption, tooltip)``.  Lines that are blank,
    comments, or the ``start``/``end`` wrappers are kept verbatim around the
    table rows; every other line is one row (extra tokens beyond the declared
    columns get generic captions).
    """
    changed = pyqtSignal()

    def __init__(self, columns, wrap_start_end=False, row_labels=None, parent=None):
        super().__init__(parent)
        self.columns = list(columns)
        self.wrap = wrap_start_end
        self._row_labels = list(row_labels or [])
        self._head = []      # verbatim lines before the rows (comments, 'start')
        self._tail = []      # verbatim lines after the rows ('end', trailing comments)
        self._loading = False

        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(6)
        self.table = QTableWidget(0, len(self.columns))
        self.table.setAlternatingRowColors(True)
        self.table.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.table.setSelectionBehavior(QAbstractItemView.SelectItems)
        hdr = self.table.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.setStretchLastSection(True)
        hdr.setMinimumSectionSize(60)
        hdr.setDefaultSectionSize(96)
        self.table.verticalHeader().setDefaultSectionSize(26)
        self._apply_headers()
        self.table.itemChanged.connect(self._on_item_changed)
        lay.addWidget(self.table, 1)

        bar = QHBoxLayout()
        self.lbl_hint = QLabel("")
        self.lbl_hint.setObjectName("soft")
        bar.addWidget(self.lbl_hint, 1)
        self.btn_add = QPushButton(self.tr("Add row"))
        self.btn_add.setObjectName("flat")
        self.btn_add.clicked.connect(self.add_row)
        self.btn_del = QPushButton(self.tr("Remove selected"))
        self.btn_del.setObjectName("flat")
        self.btn_del.clicked.connect(self.remove_selected)
        bar.addWidget(self.btn_add)
        bar.addWidget(self.btn_del)
        lay.addLayout(bar)

    # ---- headers --------------------------------------------------------------
    def _apply_headers(self):
        self.table.setColumnCount(len(self.columns))
        for c, (caption, tip) in enumerate(self.columns):
            it = QTableWidgetItem(caption)
            it.setToolTip(tip or caption)
            self.table.setHorizontalHeaderItem(c, it)
        hdr = self.table.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.Stretch if len(self.columns) <= 4 else QHeaderView.Interactive)
        hdr.setStretchLastSection(len(self.columns) > 4)

    def _ensure_columns(self, n):
        while len(self.columns) < n:
            k = len(self.columns) + 1
            self.columns.append((f"V{k}", self.tr("extra value %d") % k))
        self._apply_headers()

    def set_row_labels(self, labels):
        self._row_labels = list(labels or [])
        self._refresh_row_labels()

    def _refresh_row_labels(self):
        for r in range(self.table.rowCount()):
            text = self._row_labels[r] if r < len(self._row_labels) else str(r + 1)
            self.table.setVerticalHeaderItem(r, QTableWidgetItem(text))

    # ---- text <-> table -------------------------------------------------------
    def set_text(self, text):
        self._loading = True
        try:
            rows, head, tail = [], [], []
            ended = False
            for line in text.splitlines():
                code, _comment = split_comment(line)
                tokens = code.split()
                wrapper = tokens[0].lower() if (self.wrap and len(tokens) == 1
                                                and tokens[0].lower() in ("start", "end")) else None
                if ended or wrapper == "end":
                    ended = True
                    tail.append(line)              # 'end' and everything after it, verbatim
                elif not tokens or wrapper == "start":
                    (head if not rows else tail).append(line)   # blank/comment/'start'
                else:
                    rows.append(tokens)
            if self.wrap and not any(t.strip().lower() == "start" for t in head):
                head.insert(0, "start")
            if self.wrap and not any(t.strip().lower() == "end" for t in tail):
                tail.append("end")
            self._head, self._tail = head, tail

            self.table.setRowCount(0)
            width = max([len(self.columns)] + [len(r) for r in rows])
            self._ensure_columns(width)
            self.table.setRowCount(len(rows))
            for r, tokens in enumerate(rows):
                for c in range(width):
                    self.table.setItem(r, c, QTableWidgetItem(tokens[c] if c < len(tokens) else ""))
            self._refresh_row_labels()
        finally:
            self._loading = False

    def text(self):
        out = list(self._head)
        for r in range(self.table.rowCount()):
            tokens = []
            for c in range(self.table.columnCount()):
                it = self.table.item(r, c)
                tokens.append(it.text().strip() if it is not None else "")
            while tokens and tokens[-1] == "":
                tokens.pop()
            if tokens:
                out.append(" ".join(t if t else "0" for t in tokens))
        out += list(self._tail)
        return "\n".join(out).rstrip("\n") + "\n"

    def rows(self):
        res = []
        for r in range(self.table.rowCount()):
            res.append([(self.table.item(r, c).text().strip() if self.table.item(r, c) else "")
                        for c in range(self.table.columnCount())])
        return res

    # ---- editing --------------------------------------------------------------
    def _on_item_changed(self, _item):
        if not self._loading:
            self.changed.emit()

    def add_row(self):
        r = self.table.rowCount()
        self._loading = True
        self.table.insertRow(r)
        template = None
        if r > 0:
            template = [self.table.item(r - 1, c).text() if self.table.item(r - 1, c) else ""
                        for c in range(self.table.columnCount())]
        for c in range(self.table.columnCount()):
            self.table.setItem(r, c, QTableWidgetItem(template[c] if template else "0"))
        self._refresh_row_labels()
        self._loading = False
        self.table.scrollToBottom()
        self.changed.emit()

    def remove_selected(self):
        rows = sorted({i.row() for i in self.table.selectedIndexes()}, reverse=True)
        if not rows:
            return
        self._loading = True
        for r in rows:
            self.table.removeRow(r)
        self._refresh_row_labels()
        self._loading = False
        self.changed.emit()


# --------------------------------------------------------------------------- file-specific tables
BOUNDARY_COLUMNS = [
    ("type", "int - boundary type"),
    ("material", "string - e.g. copper"),
    ("length (m)", "double - length along z"),
    ("r1 (m)", "double - aperture at the entrance"),
    ("r2 (m)", "double - aperture at the exit"),
    ("RLP", "string - shape keyword (RLP)"),
    ("z0 (m)", "double - z offset"),
    ("x0 (m)", "double - x offset"),
    ("y0 (m)", "double - y offset"),
    ("θz0 (deg)", "double - rotation about z"),
    ("θx0 (deg)", "double - rotation about x"),
    ("θy0 (deg)", "double - rotation about y"),
]

SCANDATA_COLUMNS = [
    ("entry phase (deg)", "RF phase at the cavity entrance"),
    ("entry time (s)", "arrival time at the cavity entrance"),
]


class BoundaryTable(TokenTableEditor):
    """``boundary.txt`` - one row per boundary element, wrapped in start/end."""

    def __init__(self, parent=None):
        super().__init__(BOUNDARY_COLUMNS, wrap_start_end=True, parent=parent)
        self.lbl_hint.setText(self.tr("Used when 'Apply boundary' is enabled in Settings; lattice apertures are then ignored."))


class ScanDataTable(TokenTableEditor):
    """``scanData.txt`` - one row per RF cavity, in lattice order."""

    def __init__(self, parent=None):
        super().__init__(SCANDATA_COLUMNS, wrap_start_end=False, parent=parent)
        self.lbl_hint.setText(self.tr("Read when phase scan mode is 2 (Settings); rows follow the RF cavities in lattice order."))
