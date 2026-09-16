"""Main window: sidebar navigation, toolbar, pages, log dock and status bar."""
import logging
import os

from PyQt5.QtCore import QSettings, QSize, Qt
from PyQt5.QtWidgets import (QAction, QActionGroup, QApplication, QDockWidget, QFileDialog, QHBoxLayout, QLabel,
                             QListWidget, QListWidgetItem, QMainWindow, QMenu, QMessageBox, QProgressBar,
                             QScrollArea, QSizePolicy, QStackedWidget, QStyle, QToolBar, QVBoxLayout, QWidget)

from avas import __version__
from avas.api.qt.api import project_check
from avas.gui.pages.beam_page import BeamPage
from avas.gui.pages.lattice_page import LatticePage
from avas.gui.pages.project_page import ProjectPage
from avas.gui.pages.results_page import ResultsPage
from avas.gui.pages.run_page import RunPage
from avas.gui.pages.settings_page import SettingsPage
from avas.gui.project import Project
from avas.gui.runner import SimulationRunner
from avas.gui.widgets.common import report_error
from avas.gui.widgets.log_panel import LogPanel
from avas.i18n import available_languages

log = logging.getLogger("avas.gui")

ORG_NAME = "AVAS"
APP_NAME = "AVAS"


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.settings = QSettings(ORG_NAME, APP_NAME)
        self.project = Project(self.settings, self)
        self.runner = SimulationRunner(self)
        self._silent_close = False

        self.setWindowTitle("AVAS")
        self.resize(1180, 820)
        self._build_pages()
        self._build_layout()
        self._build_menus()
        self._build_toolbar()
        self._build_log_dock()
        self._build_statusbar()
        self._wire()
        self.show()
        self._restore_last_project()

    # ------------------------------------------------------------------ build
    def _build_pages(self):
        self.page_project = ProjectPage(self.project)
        self.page_beam = BeamPage(self.project)
        self.page_lattice = LatticePage(self.project)
        self.page_settings = SettingsPage(self.project)
        self.page_run = RunPage(self.project)
        self.page_results = ResultsPage(self.project)
        self.config_pages = [self.page_beam, self.page_lattice, self.page_settings]
        self.pages = [
            (self.tr("Project"), self.page_project, True),
            (self.tr("Beam"), self.page_beam, True),
            (self.tr("Lattice"), self.page_lattice, False),
            (self.tr("Settings"), self.page_settings, True),
            (self.tr("Run"), self.page_run, True),
            (self.tr("Results"), self.page_results, False),
        ]

    def _build_layout(self):
        central = QWidget()
        lay = QHBoxLayout(central)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)

        side = QWidget()
        side.setFixedWidth(200)
        sl = QVBoxLayout(side)
        sl.setContentsMargins(0, 0, 0, 0)
        sl.setSpacing(0)
        title = QLabel("AVAS")
        title.setObjectName("sidebarTitle")
        sub = QLabel(self.tr("Linac simulation") + f"  ·  v{__version__}")
        sub.setObjectName("sidebarSub")
        self.nav = QListWidget()
        self.nav.setObjectName("sidebar")
        self.nav.setFocusPolicy(Qt.NoFocus)
        self.nav.setIconSize(QSize(18, 18))
        for name, _page, _scroll in self.pages:
            QListWidgetItem(name, self.nav)
        sl.addWidget(title)
        sl.addWidget(sub)
        sl.addWidget(self.nav, 1)
        lay.addWidget(side)

        self.stack = QStackedWidget()
        for _name, page, scroll in self.pages:
            if scroll:
                area = QScrollArea()
                area.setWidgetResizable(True)
                area.setWidget(page)
                self.stack.addWidget(area)
            else:
                self.stack.addWidget(page)
        lay.addWidget(self.stack, 1)
        self.setCentralWidget(central)
        self.nav.currentRowChanged.connect(self.stack.setCurrentIndex)
        self.nav.setCurrentRow(0)

    def _build_menus(self):
        mb = self.menuBar()
        m_file = mb.addMenu(self.tr("&File"))
        self.act_new = QAction(self.tr("&New project..."), self)
        self.act_new.setShortcut("Ctrl+N")
        self.act_new.triggered.connect(self.new_project)
        self.act_open = QAction(self.tr("&Open project..."), self)
        self.act_open.setShortcut("Ctrl+O")
        self.act_open.triggered.connect(lambda: self.open_project(""))
        self.menu_recent = QMenu(self.tr("Open &recent"), self)
        self.act_save = QAction(self.tr("&Save"), self)
        self.act_save.setShortcut("Ctrl+S")
        self.act_save.triggered.connect(self.save_all)
        act_quit = QAction(self.tr("E&xit"), self)
        act_quit.setShortcut("Ctrl+Q")
        act_quit.triggered.connect(self.close)
        m_file.addAction(self.act_new)
        m_file.addAction(self.act_open)
        m_file.addMenu(self.menu_recent)
        m_file.addSeparator()
        m_file.addAction(self.act_save)
        m_file.addSeparator()
        m_file.addAction(act_quit)

        m_run = mb.addMenu(self.tr("&Run"))
        self.act_run = QAction(self.tr("&Run simulation"), self)
        self.act_run.setShortcut("F5")
        self.act_run.triggered.connect(self.run_simulation)
        self.act_stop = QAction(self.tr("&Stop"), self)
        self.act_stop.setShortcut("Shift+F5")
        self.act_stop.setEnabled(False)
        self.act_stop.triggered.connect(self.stop_simulation)
        m_run.addAction(self.act_run)
        m_run.addAction(self.act_stop)

        self.m_view = mb.addMenu(self.tr("&View"))

        m_settings = mb.addMenu(self.tr("&Settings"))
        lang_menu = m_settings.addMenu(self.tr("Language"))
        current_lang = self.settings.value("ui/language", "en")
        lang_group = QActionGroup(self)
        for code, name in available_languages().items():
            act = QAction(name, self, checkable=True)
            act.setChecked(code == current_lang)
            act.triggered.connect(lambda _c, c=code: self.set_language(c))
            lang_group.addAction(act)
            lang_menu.addAction(act)
        font_menu = m_settings.addMenu(self.tr("Font size"))
        current_size = self.settings.value("ui/fontPointSize", 0, type=int)
        font_group = QActionGroup(self)
        for size in (0, 9, 10, 11, 12, 14, 16):
            act = QAction(self.tr("Default") if size == 0 else f"{size} pt", self, checkable=True)
            act.setChecked(size == current_size)
            act.triggered.connect(lambda _c, n=size: self.set_font_size(n))
            font_group.addAction(act)
            font_menu.addAction(act)

        m_help = mb.addMenu(self.tr("&Help"))
        act_about = QAction(self.tr("About AVAS"), self)
        act_about.triggered.connect(self.about)
        m_help.addAction(act_about)

    def _build_toolbar(self):
        tb = QToolBar(self.tr("Main"))
        tb.setMovable(False)
        tb.setToolButtonStyle(Qt.ToolButtonTextBesideIcon)
        st = self.style()
        self.act_open.setIcon(st.standardIcon(QStyle.SP_DirOpenIcon))
        self.act_save.setIcon(st.standardIcon(QStyle.SP_DialogSaveButton))
        self.act_run.setIcon(st.standardIcon(QStyle.SP_MediaPlay))
        self.act_stop.setIcon(st.standardIcon(QStyle.SP_MediaStop))
        tb.addAction(self.act_open)
        tb.addAction(self.act_save)
        tb.addSeparator()
        tb.addAction(self.act_run)
        tb.addAction(self.act_stop)
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        tb.addWidget(spacer)
        self.lbl_project = QLabel(self.tr("No project"))
        self.lbl_project.setObjectName("muted")
        tb.addWidget(self.lbl_project)
        self.addToolBar(tb)

    def _build_log_dock(self):
        self.log_panel = LogPanel()
        self.dock = QDockWidget(self.tr("Log"), self)
        self.dock.setObjectName("logDock")
        self.dock.setWidget(self.log_panel)
        self.dock.setAllowedAreas(Qt.BottomDockWidgetArea)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.dock)
        self.dock.setMinimumHeight(90)
        self.resizeDocks([self.dock], [140], Qt.Vertical)
        act = self.dock.toggleViewAction()
        act.setText(self.tr("Log panel"))
        self.m_view.addAction(act)

    def _build_statusbar(self):
        sb = self.statusBar()
        self.status_progress = QProgressBar()
        self.status_progress.setRange(0, 100)
        self.status_progress.setFixedWidth(180)
        self.status_progress.setVisible(False)
        sb.addPermanentWidget(self.status_progress)
        sb.showMessage(self.tr("Ready"))

    def _wire(self):
        self.project.changed.connect(self.on_project_changed)
        self.page_project.new_requested.connect(self.new_project)
        self.page_project.open_requested.connect(self.open_project)
        self.page_run.run_requested.connect(self.run_simulation)
        self.page_run.stop_requested.connect(self.stop_simulation)
        self.runner.progress.connect(self.on_progress)
        self.runner.finished.connect(self.on_run_finished)
        self.nav.currentRowChanged.connect(self._on_page_changed)
        self._update_recent_menu()
        self._set_project_actions(False)

    # ------------------------------------------------------------------ project handling
    def _restore_last_project(self):
        last = self.project.last_path()
        if last and os.path.isdir(last):
            try:
                self.project.open(last)
            except ValueError as exc:
                log.warning("%s", exc)
        self.page_project.refresh()

    def _set_project_actions(self, enabled):
        self.act_save.setEnabled(enabled)
        self.act_run.setEnabled(enabled and not self.runner.is_running)
        self.page_run.btn_run.setEnabled(enabled and not self.runner.is_running)

    def _update_recent_menu(self):
        self.menu_recent.clear()
        for p in self.project.recent():
            act = self.menu_recent.addAction(p)
            act.triggered.connect(lambda _c, path=p: self.open_project(path))
        self.menu_recent.setEnabled(bool(self.menu_recent.actions()))

    def new_project(self):
        start = self.settings.value("project/lastDir", os.path.expanduser("~"), type=str)
        path, _ = QFileDialog.getSaveFileName(self, self.tr("Create new project (choose a folder name)"),
                                              os.path.join(start, "avas_project"), self.tr("Folder (*)"))
        if not path:
            return
        try:
            self.project.create(path)
            self.settings.setValue("project/lastDir", os.path.dirname(path))
            log.info("project created: %s", path)
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("New project"))

    def open_project(self, path=""):
        if self.runner.is_running:
            QMessageBox.information(self, self.tr("Run"), self.tr("Stop the running simulation first."))
            return
        if not path:
            start = self.settings.value("project/lastDir", os.path.expanduser("~"), type=str)
            path = QFileDialog.getExistingDirectory(self, self.tr("Open project directory"), start)
            if not path:
                return
        try:
            self.project.open(path)
            self.settings.setValue("project/lastDir", os.path.dirname(path))
            log.info("project opened: %s", path)
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("Open project"))

    def on_project_changed(self):
        ok = self.project.is_open
        self.lbl_project.setText(self.project.path if ok else self.tr("No project"))
        self.setWindowTitle(f"AVAS - {self.project.name}" if ok else "AVAS")
        self._set_project_actions(ok)
        self._update_recent_menu()
        for page in self.config_pages:
            try:
                page.load()
            except Exception as exc:  # noqa: BLE001
                report_error(self, exc, self.tr("Load project"))
        self.page_project.refresh()
        self.page_run.refresh(self._mode_text())
        self.page_results.refresh_all()
        if ok and self.nav.currentRow() == 0:
            self.nav.setCurrentRow(1)

    def _on_page_changed(self, row):
        if row == 4:
            self.page_run.refresh(self._mode_text())
        elif row == 0:
            self.page_project.refresh()

    def _mode_text(self):
        if not self.project.is_open:
            return ""
        sim = self.page_settings.rg_sim.value() or "mulp"
        err = self.page_settings.error_mode()
        text = self.tr("multi-particle") if sim == "mulp" else self.tr("envelope")
        if err:
            names = {"stat": self.tr("static errors"), "dyn": self.tr("dynamic errors"),
                     "stat_dyn": self.tr("static + dynamic errors")}
            text += "  +  " + names.get(err, err)
        return text

    # ------------------------------------------------------------------ save / run
    def save_all(self):
        if not self.project.is_open:
            return False
        try:
            for page in self.config_pages:
                page.save()
            self.page_lattice.refresh_table()
            self.statusBar().showMessage(self.tr("Project saved"), 3000)
            log.info("project saved")
            return True
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("Save"))
            return False

    def run_simulation(self):
        if not self.project.is_open or self.runner.is_running:
            return
        errors = []
        for page in self.config_pages:
            errors += page.validate()
        if errors:
            QMessageBox.warning(self, self.tr("Cannot run"), "\n".join(errors))
            return
        if not self.save_all():
            return
        try:
            project_check(self.project.item())
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("Project check"))
            return
        try:
            self.runner.start(self.project, self.page_settings.error_mode() or "basic")
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("Run"))
            return
        self.act_run.setEnabled(False)
        self.act_stop.setEnabled(True)
        self.page_run.refresh(self._mode_text())
        self.page_run.set_running(True)
        self.status_progress.setValue(0)
        self.status_progress.setVisible(True)
        self.statusBar().showMessage(self.tr("Simulation running..."))
        self.nav.setCurrentRow(4)

    def stop_simulation(self):
        self.runner.stop()

    def on_progress(self, sched):
        self.page_run.on_progress(sched)
        self.status_progress.setValue(self.page_run.bar.value())

    def on_run_finished(self, ok, message):
        self.act_run.setEnabled(self.project.is_open)
        self.act_stop.setEnabled(False)
        self.status_progress.setVisible(False)
        self.page_run.on_finished(ok, message)
        self.page_project.refresh()
        if ok:
            self.statusBar().showMessage(self.tr("Simulation finished"), 5000)
            self.page_results.refresh_all()
        else:
            self.statusBar().showMessage(self.tr("Simulation failed: %s") % message, 8000)
            if message != "stopped by user":
                QMessageBox.warning(self, self.tr("Simulation failed"), message)

    # ------------------------------------------------------------------ settings
    def set_language(self, code):
        if code == self.settings.value("ui/language", "en"):
            return
        if self.runner.is_running:
            QMessageBox.information(self, self.tr("Language"),
                                    self.tr("Stop the running simulation before changing the language."))
            return
        self.settings.setValue("ui/language", code)
        self.settings.sync()
        from avas.i18n import install_translator
        app = QApplication.instance()
        for tr_ in getattr(app, "_avas_translators", []):
            app.removeTranslator(tr_)
        install_translator(app, code)
        self.log_panel.detach()
        new_window = MainWindow()
        new_window.setGeometry(self.geometry())
        app._avas_main_window = new_window
        self._silent_close = True
        self.close()

    def set_font_size(self, size):
        self.settings.setValue("ui/fontPointSize", size)
        self.settings.sync()
        from avas.gui.app import _apply_font
        _apply_font(QApplication.instance(), self.settings)

    def about(self):
        QMessageBox.about(self, self.tr("About AVAS"),
                          f"<b>AVAS {__version__}</b><br>Advanced Virtual Accelerator Software<br><br>"
                          "C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)")

    # ------------------------------------------------------------------ close
    def closeEvent(self, event):
        if self._silent_close:
            event.accept()
            return
        if self.runner.is_running:
            reply = QMessageBox.question(self, self.tr("Quit"),
                                         self.tr("A simulation is running. Stop it and quit?"),
                                         QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if reply != QMessageBox.Yes:
                event.ignore()
                return
            self.runner.stop()
        self.settings.setValue("ui/geometry", self.saveGeometry())
        self.log_panel.detach()
        event.accept()
