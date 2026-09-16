"""Files page: every file in InputFile/, recognised by content, each with the editor that fits it.

==========================  =====================================================
file                        view
==========================  =====================================================
AVAS lattice (any name)     structure editor (physical parameters) + text
lattice.txt                 same, read-only (regenerated before every run)
TraceWin lattice (.dat)     read-only element table + text
beam.txt / input.txt        keyword table with meaning and units + text
ini.ini                     section / key / value / meaning + text
boundary / scanData /       column tables + text
SeParticle
.dst / .edst                beam parameters and phase-space plots
field maps                  grid, components, users and longitudinal profile
TraceWin .ini, binaries     description only
==========================  =====================================================

Structured views and the text are kept in sync; generated and binary files
are never written.
"""
import logging
import os
import subprocess
import sys
import time

from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import (QHBoxLayout, QHeaderView, QLabel, QMessageBox, QPushButton, QSplitter, QStackedWidget,
                             QTabWidget, QTreeWidget, QTreeWidgetItem, QVBoxLayout, QWidget)

from avas.data import filekinds as fk
from avas.data import schema
from avas.data.lattice_doc import LatticeDocument
from avas.gui import theme
from avas.gui.lattice_editor.lattice_ide import CodeEditorWithLineNumbers
from avas.gui.lattice_editor.structure_editor import StructureEditor
from avas.gui.widgets.common import guarded, page_header
from avas.gui.widgets.data_views import DstView, FieldMapView
from avas.gui.widgets.keyword_table import IniTable, KeywordTable, SeParticleTable, TraceWinTable
from avas.gui.widgets.table_editors import BoundaryTable, ScanDataTable

log = logging.getLogger("avas.gui")

MAX_EDIT_BYTES = 2 * 1024 * 1024
PATH_ROLE = Qt.UserRole
KIND_ROLE = Qt.UserRole + 1

# group order in the tree
GROUP_ENGINE, GROUP_LATTICES, GROUP_BEAM_DATA, GROUP_FIELDMAPS, GROUP_OTHER = range(5)
PAGE_BEAM, PAGE_SETTINGS = 1, 3        # main window page indices used by "open in page"


def human_size(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024.0
    return f"{n:.1f} GB"


def read_text(path):
    with open(path, "rb") as fh:
        raw = fh.read()
    for enc in ("utf-8-sig", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


class FilesPage(QWidget):
    dirty_changed = pyqtSignal(bool)
    navigate_requested = pyqtSignal(int)          # main window page index
    use_particles_requested = pyqtSignal(str)     # file name inside InputFile/

    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._current = None          # absolute path of the open file
        self._kind = None
        self._dirty = False
        self._loading = False
        self._table = None            # structured view for the current file, if any
        self._table_live = False      # True: the view edits the text document directly
        self._expansion = {}
        self._build()
        theme.notifier().changed.connect(self.refresh)

    # ------------------------------------------------------------------ roles
    def describe(self, path, kind):
        """``(group, role label, badge style, description, editable)``."""
        name = os.path.basename(path)
        low = name.lower()
        if kind == fk.KIND_LATTICE:
            if low == self.project.lattice_name().lower():
                return (GROUP_ENGINE, self.tr("lattice (run)"), "badgeAccent",
                        self.tr("The lattice used for the run; also edited on the Lattice page."), True)
            env = self.tr(" Used by the envelope model.") if low == "lattice_env.txt" else ""
            return (GROUP_LATTICES, self.tr("lattice"), "badge",
                    self.tr("AVAS lattice not used for the run. 'Use for the run' switches to it.") + env, True)
        if kind == fk.KIND_GENERATED_LATTICE:
            return (GROUP_LATTICES, self.tr("generated"), "badge",
                    self.tr("Rewritten from %s before every run; read-only.") % self.project.lattice_name(), False)
        if kind == fk.KIND_TRACEWIN_LATTICE:
            return (GROUP_LATTICES, self.tr("TraceWin lattice"), "badge",
                    self.tr("TraceWin format (lengths in mm). AVAS cannot run it directly; read-only."), False)
        if kind == fk.KIND_BEAM:
            return (GROUP_ENGINE, self.tr("engine input"), "badgeAccent",
                    self.tr("Initial beam; also edited on the Beam page."), True)
        if kind == fk.KIND_INPUT:
            return (GROUP_ENGINE, self.tr("engine input"), "badgeAccent",
                    self.tr("Tracking options; also edited on the Settings page."), True)
        if kind == fk.KIND_BOUNDARY:
            return (GROUP_ENGINE, self.tr("engine input"), "badgeAccent",
                    self.tr("Loss boundary, used when boundary is 1 in input.txt; lattice apertures are then ignored."),
                    True)
        if kind == fk.KIND_SCANDATA:
            return (GROUP_ENGINE, self.tr("engine input"), "badgeAccent",
                    self.tr("Entry phase and time of every RF cavity, read when scanphase is 2."), True)
        if kind == fk.KIND_SEPARTICLE:
            return (GROUP_ENGINE, self.tr("engine input"), "badgeAccent",
                    self.tr("Secondary particles, read when secondarybeam is 1."), True)
        if kind == fk.KIND_GUI_INI:
            return (GROUP_ENGINE, self.tr("GUI settings"), "badge",
                    self.tr("Run mode, error study, lattice file and field-map directory."), True)
        if kind in (fk.KIND_PARTICLES, fk.KIND_PARTICLES_EXT):
            return (GROUP_BEAM_DATA, self.tr("particles"), "badge",
                    self.tr("Particle distribution; shown, not edited."), False)
        if kind == fk.KIND_PLT:
            return (GROUP_BEAM_DATA, self.tr("step data"), "badge",
                    self.tr("Beam at every dumped step; open it on the Results page."), False)
        if kind == fk.KIND_FIELDMAP:
            return (GROUP_FIELDMAPS, self.tr("field map"), "badge",
                    self.tr("3D field map referenced by 'field' elements; shown, not edited."), False)
        if kind == fk.KIND_TRACEWIN_PROJECT:
            return (GROUP_OTHER, self.tr("TraceWin project"), "badge",
                    self.tr("TraceWin binary options file; AVAS does not read it."), False)
        if kind == fk.KIND_TEXT:
            return (GROUP_OTHER, self.tr("reference"), "badge",
                    self.tr("Text file not read by the engine."), True)
        return GROUP_OTHER, self.tr("other"), "badge", self.tr("Binary file."), False

    def group_title(self, group):
        return {GROUP_ENGINE: self.tr("Engine inputs"), GROUP_LATTICES: self.tr("Other lattices"),
                GROUP_BEAM_DATA: self.tr("Particle data"), GROUP_FIELDMAPS: self.tr("Field maps"),
                GROUP_OTHER: self.tr("Other files")}[group]

    # ------------------------------------------------------------------ ui
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(8)
        root.addWidget(page_header(self.tr("Files"),
                                   self.tr("Everything in InputFile/, recognised by content. Every file opens in a "
                                           "view that shows the physical meaning of its values.")))

        split = QSplitter(Qt.Horizontal)
        self.tree = QTreeWidget()
        self.tree.setHeaderLabels([self.tr("File"), self.tr("Role"), self.tr("Size")])
        self.tree.setMinimumWidth(300)
        hdr = self.tree.header()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.setStretchLastSection(False)
        hdr.resizeSection(0, 230)
        hdr.resizeSection(1, 110)
        hdr.resizeSection(2, 70)
        self.tree.currentItemChanged.connect(self._on_select)
        self.tree.itemExpanded.connect(lambda it: self._expansion.__setitem__(it.text(0), True))
        self.tree.itemCollapsed.connect(lambda it: self._expansion.__setitem__(it.text(0), False))
        split.addWidget(self.tree)

        right = QWidget()
        rl = QVBoxLayout(right)
        rl.setContentsMargins(16, 0, 0, 0)
        rl.setSpacing(8)
        head = QHBoxLayout()
        head.setSpacing(8)
        self.lbl_name = QLabel(self.tr("Select a file"))
        self.lbl_name.setObjectName("kpi")
        self.lbl_role = QLabel("")
        self.lbl_role.setObjectName("badge")
        self.lbl_role.setVisible(False)
        head.addWidget(self.lbl_name)
        head.addWidget(self.lbl_role)
        head.addStretch(1)
        self.btn_action = QPushButton("")
        self.btn_action.setVisible(False)
        self.btn_action.clicked.connect(self._on_action)
        self.btn_folder = QPushButton(self.tr("Open folder"))
        self.btn_folder.setObjectName("ghost")
        self.btn_folder.clicked.connect(self.open_folder)
        self.btn_reload = QPushButton(self.tr("Reload"))
        self.btn_reload.setObjectName("ghost")
        self.btn_reload.clicked.connect(self.reload)
        self.btn_save = QPushButton(self.tr("Save"))
        self.btn_save.setObjectName("primary")
        self.btn_save.setEnabled(False)
        self.btn_save.clicked.connect(self.save)
        for b in (self.btn_action, self.btn_folder, self.btn_reload, self.btn_save):
            head.addWidget(b)
        rl.addLayout(head)
        self.lbl_desc = QLabel("")
        self.lbl_desc.setObjectName("muted")
        self.lbl_desc.setWordWrap(True)
        rl.addWidget(self.lbl_desc)

        self.stack = QStackedWidget()
        ph = QLabel(self.tr("Choose a file on the left."))
        ph.setObjectName("soft")
        ph.setAlignment(Qt.AlignCenter)
        self.stack.addWidget(ph)                          # 0 placeholder
        self.tabs = QTabWidget()
        self.tabs.setDocumentMode(True)
        self.editor = CodeEditorWithLineNumbers()
        self.editor.editor.textChanged.connect(self._on_text_changed)
        self.table_host = QWidget()
        self.table_host_layout = QVBoxLayout(self.table_host)
        self.table_host_layout.setContentsMargins(0, 8, 0, 0)
        self.tabs.addTab(self.table_host, self.tr("Table"))
        self.tabs.addTab(self.editor, self.tr("Text"))
        self.tabs.currentChanged.connect(self._on_tab_changed)
        self.stack.addWidget(self.tabs)                   # 1 structured view + text
        self.info_host = QWidget()
        self.info_layout = QVBoxLayout(self.info_host)
        self.info_layout.setContentsMargins(0, 0, 0, 0)
        self.info = QLabel("")
        self.info.setObjectName("muted")
        self.info.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.info.setWordWrap(True)
        self.info.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self.info_layout.addWidget(self.info)
        self.info_view = None
        self.stack.addWidget(self.info_host)              # 2 data view / description
        rl.addWidget(self.stack, 1)
        split.addWidget(right)
        split.setStretchFactor(0, 0)
        split.setStretchFactor(1, 1)
        split.setSizes([420, 760])
        root.addWidget(split, 1)

    # ------------------------------------------------------------------ list
    def load(self):
        """Project changed: rebuild the list and close the editor."""
        self._set_current(None)
        self.refresh()

    def refresh(self):
        current = self._current
        self.tree.blockSignals(True)
        self.tree.clear()
        select = None
        if self.project.is_open and os.path.isdir(self.project.input_dir):
            groups = {}
            entries = []
            for name in os.listdir(self.project.input_dir):
                path = os.path.join(self.project.input_dir, name)
                if not os.path.isfile(path):
                    continue
                kind = fk.detect(path)
                group, label, _style, desc, editable = self.describe(path, kind)
                entries.append((group, 0 if label == self.tr("lattice (run)") else 1,
                                name.lower(), name, path, kind, label, desc, editable))
            entries.sort()
            for group, _o, _k, name, path, kind, label, desc, editable in entries:
                parent = groups.get(group)
                if parent is None:
                    parent = QTreeWidgetItem([self.group_title(group), "", ""])
                    font = parent.font(0)
                    font.setBold(True)
                    parent.setFont(0, font)
                    parent.setFlags(Qt.ItemIsEnabled)
                    self.tree.addTopLevelItem(parent)
                    groups[group] = parent
                it = QTreeWidgetItem([name, label, human_size(os.path.getsize(path))])
                it.setData(0, PATH_ROLE, path)
                it.setData(0, KIND_ROLE, kind)
                it.setToolTip(0, desc or path)
                it.setTextAlignment(2, Qt.AlignRight | Qt.AlignVCenter)
                if not editable:
                    it.setForeground(0, theme.qcolor("fg_soft"))
                parent.addChild(it)
                if current and os.path.normcase(path) == os.path.normcase(current):
                    select = it
            for group, parent in groups.items():
                parent.setText(2, str(parent.childCount()))
                parent.setTextAlignment(2, Qt.AlignRight | Qt.AlignVCenter)
                parent.setExpanded(self._expansion.get(parent.text(0), group != GROUP_FIELDMAPS))
            if select is not None:
                select.parent().setExpanded(True)
                self.tree.setCurrentItem(select)
        self.tree.blockSignals(False)
        if self._current and select is None:
            self._set_current(None)

    def _file_items(self):
        for g in range(self.tree.topLevelItemCount()):
            group = self.tree.topLevelItem(g)
            for i in range(group.childCount()):
                yield group.child(i)

    def showEvent(self, event):  # noqa: N802 (Qt naming)
        super().showEvent(event)
        # other pages may have rewritten files meanwhile
        self.refresh()
        if self._current and not self._dirty and os.path.isfile(self._current):
            self._open(self._current, keep_tab=True)

    # ------------------------------------------------------------------ open / edit
    def _on_select(self, item, _prev):
        if item is None:
            return
        path = item.data(0, PATH_ROLE)
        if not path:
            return
        if self._dirty and self._current and os.path.normcase(path) != os.path.normcase(self._current):
            reply = QMessageBox.question(self, self.tr("Unsaved changes"),
                                         self.tr("Save changes to %s?") % os.path.basename(self._current),
                                         QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel, QMessageBox.Save)
            if reply == QMessageBox.Cancel:
                self.tree.blockSignals(True)
                self._select_path(self._current)
                self.tree.blockSignals(False)
                return
            if reply == QMessageBox.Save:
                self.save()
        self._open(path)

    def _select_path(self, path):
        for it in self._file_items():
            if os.path.normcase(it.data(0, PATH_ROLE)) == os.path.normcase(path):
                it.parent().setExpanded(True)
                self.tree.setCurrentItem(it)
                return

    def _set_current(self, path):
        self._current = path
        self._set_dirty(False)
        if path is None:
            self.lbl_name.setText(self.tr("Select a file"))
            self.lbl_role.setVisible(False)
            self.lbl_desc.setText("")
            self.stack.setCurrentIndex(0)
            self.btn_save.setEnabled(False)
            self.btn_reload.setEnabled(False)
            self.btn_action.setVisible(False)
            self._install_table(None)
            self._install_info(None)

    def _install_table(self, table, live=False, title=None):
        if self._table is not None:
            self.table_host_layout.removeWidget(self._table)
            self._table.hide()
            self._table.setParent(None)
            self._table.deleteLater()
        self._table = table
        self._table_live = live
        if table is not None:
            self.table_host_layout.addWidget(table)
            if not live:
                table.changed.connect(self._on_table_changed)
        self.tabs.setTabEnabled(0, table is not None)
        self.tabs.setTabText(0, title or self.tr("Table"))

    def _install_info(self, widget, text=""):
        if self.info_view is not None:
            self.info_layout.removeWidget(self.info_view)
            self.info_view.setParent(None)
            self.info_view.deleteLater()
        self.info_view = widget
        self.info.setVisible(widget is None)
        self.info.setText(text)
        if widget is not None:
            self.info_layout.addWidget(widget, 1)

    def _set_action(self, text=None):
        self.btn_action.setVisible(bool(text))
        if text:
            self.btn_action.setText(text)

    @guarded
    def _open(self, path, keep_tab=False):
        name = os.path.basename(path)
        kind = fk.detect(path)
        _group, label, style, desc, editable = self.describe(path, kind)
        self._kind = kind
        self._loading = True
        try:
            self.lbl_name.setText(name)
            self.lbl_role.setText(label)
            self.lbl_role.setObjectName(style)
            self.lbl_role.style().unpolish(self.lbl_role)
            self.lbl_role.style().polish(self.lbl_role)
            self.lbl_role.setVisible(True)
            self.lbl_desc.setText(desc)
            self.btn_reload.setEnabled(True)
            self.btn_save.setVisible(editable)
            self._set_action(None)
            self._current = path
            size = os.path.getsize(path)

            # ---- data views (binary) ----------------------------------------------------
            if kind in (fk.KIND_PARTICLES, fk.KIND_PARTICLES_EXT, fk.KIND_FIELDMAP):
                self._install_table(None)
                view = DstView() if kind != fk.KIND_FIELDMAP else FieldMapView()
                if kind == fk.KIND_FIELDMAP:
                    base = os.path.splitext(name)[0]
                    view.set_path(path, self.project.field_dirs(), self._fieldmap_users(base))
                else:
                    view.set_path(path)
                    view.use_as_beam.connect(self.use_particles_requested)
                self._install_info(view)
                self.stack.setCurrentIndex(2)
                self._set_dirty(False)
                return
            text_like = size <= MAX_EDIT_BYTES and kind not in (fk.KIND_BINARY, fk.KIND_TRACEWIN_PROJECT, fk.KIND_PLT)
            if not text_like:
                mtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(path)))
                why = desc if kind != fk.KIND_TEXT else self.tr("Larger than %s - open it with an external editor.") \
                    % human_size(MAX_EDIT_BYTES)
                self._install_table(None)
                self._install_info(None, f"{why}\n\n{self.tr('Size')}: {human_size(size)}\n"
                                         f"{self.tr('Modified')}: {mtime}\n{path}")
                self.stack.setCurrentIndex(2)
                self._set_dirty(False)
                return

            # ---- text with a structured view --------------------------------------------
            text = read_text(path)
            self.editor.setPlainText(text)
            self.editor.editor.setReadOnly(not editable)
            table, live, title = None, False, None
            if kind in (fk.KIND_LATTICE, fk.KIND_GENERATED_LATTICE):
                table = StructureEditor(read_only=not editable)
                table.set_field_dirs(self.project.field_dirs())
                table.attach(self.editor)
                live, title = True, self.tr("Parameters")
                if kind == fk.KIND_LATTICE and name.lower() != self.project.lattice_name().lower():
                    self._set_action(self.tr("Use for the run"))
            elif kind == fk.KIND_TRACEWIN_LATTICE:
                table, title = TraceWinTable(), self.tr("Elements")
            elif kind in (fk.KIND_BEAM, fk.KIND_INPUT):
                table = KeywordTable(schema.BEAM_KEYWORDS if kind == fk.KIND_BEAM else schema.INPUT_KEYWORDS)
                title = self.tr("Parameters")
                self._set_action(self.tr("Open Beam page") if kind == fk.KIND_BEAM else self.tr("Open Settings page"))
            elif kind == fk.KIND_GUI_INI:
                table, title = IniTable(), self.tr("Parameters")
            elif kind == fk.KIND_BOUNDARY:
                table = BoundaryTable()
            elif kind == fk.KIND_SCANDATA:
                table = ScanDataTable()
                table.set_row_labels(self._rf_cavity_names())
            elif kind == fk.KIND_SEPARTICLE:
                table = SeParticleTable()
            self._install_table(table, live, title)
            self._install_info(None)
            if table is not None and not live:
                table.set_text(text)
                if hasattr(table, "set_editable"):
                    table.set_editable(editable)
                elif hasattr(table, "btn_add"):
                    table.btn_add.setEnabled(editable)
                    table.btn_del.setEnabled(editable)
            if table is not None and not keep_tab:
                self.tabs.setCurrentIndex(0)
            elif table is None:
                self.tabs.setCurrentIndex(1)
            self.stack.setCurrentIndex(1)
            self._set_dirty(False)
        finally:
            self._loading = False

    def _lattice_document(self):
        path = self.project.lattice_path()
        if not path or not os.path.isfile(path):
            return None
        return LatticeDocument(read_text(path), self.project.field_dirs())

    def _rf_cavity_names(self):
        """Names of the RF 'field' elements in lattice order (for scanData rows)."""
        doc = self._lattice_document()
        if doc is None:
            return []
        return [st.name or st.param(8) or f"field {i + 1}" for i, st in enumerate(doc.rf_cavities())]

    def _fieldmap_users(self, base):
        doc = self._lattice_document()
        if doc is None:
            return []
        users = [st.name or f"{self.tr('line')} {st.line_no + 1}" for st in doc.statements
                 if st.active and st.key == "field" and st.param(8) == base]
        if len(users) > 12:
            users = users[:12] + [self.tr("… %d more") % (len(users) - 12)]
        return users

    def _on_text_changed(self):
        if not self._loading:
            self._set_dirty(True)

    def _on_table_changed(self):
        if not self._loading:
            self._set_dirty(True)

    def _on_tab_changed(self, index):
        """Keep table and text in sync when switching between them."""
        if self._table is None or self._loading or self._table_live:
            return
        self._loading = True
        try:
            if index == 1:      # table -> text
                self.editor.setPlainText(self._table.text())
            else:               # text -> table
                self._table.set_text(self.editor.toPlainText())
        finally:
            self._loading = False

    def _set_dirty(self, dirty):
        changed = dirty != self._dirty
        self._dirty = dirty
        self.btn_save.setEnabled(dirty and self._current is not None)
        if self._current:
            self.lbl_name.setText(os.path.basename(self._current) + (" •" if dirty else ""))
        if changed:
            self.dirty_changed.emit(dirty)

    def is_dirty(self):
        return self._dirty

    # ------------------------------------------------------------------ actions
    def current_text(self):
        if self._table is not None and not self._table_live and self.tabs.currentIndex() == 0:
            return self._table.text()
        return self.editor.toPlainText()

    @guarded
    def save(self):
        if not self._current or not self._dirty:
            return
        kind = fk.detect(self._current)
        editable = self.describe(self._current, kind)[4]
        if not editable:
            raise ValueError(self.tr("%s is generated or binary and cannot be edited here.")
                             % os.path.basename(self._current))
        text = self.current_text()
        if not text.endswith("\n"):
            text += "\n"
        with open(self._current, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        self._loading = True
        try:
            if self._table is not None and not self._table_live and self.tabs.currentIndex() == 0:
                self.editor.setPlainText(text)
            elif self._table is not None and not self._table_live:
                self._table.set_text(text)
        finally:
            self._loading = False
        self._set_dirty(False)
        log.info("saved %s", self._current)
        self.refresh()
        if os.path.normcase(self._current) == os.path.normcase(self.project.lattice_path()):
            self.project.lattice_changed.emit(self.project.lattice_name())

    @guarded
    def reload(self):
        if self._current:
            self._open(self._current, keep_tab=True)

    @guarded
    def _on_action(self):
        kind = self._kind
        if kind == fk.KIND_LATTICE and self._current:
            if self._dirty:
                self.save()
            self.project.set_lattice_name(os.path.basename(self._current))
            log.info("lattice used for the run: %s", os.path.basename(self._current))
            self.refresh()
            self._open(self._current, keep_tab=True)
        elif kind == fk.KIND_BEAM:
            self.navigate_requested.emit(PAGE_BEAM)
        elif kind in (fk.KIND_INPUT, fk.KIND_GUI_INI):
            self.navigate_requested.emit(PAGE_SETTINGS)

    @guarded
    def open_folder(self):
        if not self.project.is_open:
            return
        target = self.project.input_dir
        if sys.platform.startswith("win"):
            os.startfile(target)  # noqa: S606 - opens Explorer on the project folder
        elif sys.platform == "darwin":
            subprocess.Popen(["open", target])
        else:
            subprocess.Popen(["xdg-open", target])

    # ------------------------------------------------------------------ page protocol
    def validate(self):
        return []
