"""Main window, VS Code layout: side bar | (pages / log panel), tool bar on top, status bar below.

Both sashes can be dragged: dragging the side bar narrower than
``SNAP_WIDTH`` collapses it to an icon strip, dragging the strip outwards
expands it again; double-clicking the side bar sash toggles it, double-clicking
the panel sash maximizes the log panel.
"""
import logging
import os

from PyQt5.QtCore import QSettings, QSize, Qt
from PyQt5.QtWidgets import (QAction, QActionGroup, QApplication, QFileDialog, QMainWindow, QMenu, QMessageBox,
                             QScrollArea, QSizePolicy, QStackedWidget, QToolBar, QWidget)

from avas import __version__
from avas.api.qt.api import project_check
from avas.gui.pages.beam_page import BeamPage
from avas.gui.pages.files_page import FilesPage
from avas.gui.pages.lattice_page import LatticePage
from avas.gui.pages.project_page import ProjectPage
from avas.gui.pages.results_page import ResultsPage
from avas.gui.pages.run_page import RunPage
from avas.gui.pages.settings_page import SettingsPage
from avas.gui.project import Project
from avas.gui.runner import SimulationRunner
from avas.gui import icons, theme
from avas.gui.theme import SCALES
from avas.gui.widgets.common import report_error
from avas.gui.widgets.log_panel import HEADER_HEIGHT, LogPanel
from avas.gui.widgets.sidebar import DEFAULT_WIDTH, MIN_EXPANDED_WIDTH, SNAP_WIDTH, Sidebar
from avas.gui.widgets.splitter import Splitter
from avas.gui.widgets.status_bar import StatusBar
from avas.i18n import available_languages

log = logging.getLogger("avas.gui")

ORG_NAME = "AVAS"
APP_NAME = "AVAS"

PAGE_PROJECT, PAGE_BEAM, PAGE_LATTICE, PAGE_SETTINGS, PAGE_FILES, PAGE_RUN, PAGE_RESULTS = range(7)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        # the application's names (set in app.main) decide where settings live, so tests that
        # rename the QApplication never touch the user's real preferences
        app = QApplication.instance()
        self.settings = QSettings(app.organizationName() or ORG_NAME, app.applicationName() or APP_NAME)
        self.project = Project(self.settings, self)
        self.runner = SimulationRunner(self)
        self._silent_close = False

        self.setWindowTitle("AVAS")
        self.resize(1180, 820)
        self._build_pages()
        self._build_layout()
        self._build_menus()
        self._build_toolbar()
        self._wire()
        self._restore_ui_state()
        self.show()
        self._restore_last_project()

    # ------------------------------------------------------------------ build
    def _build_pages(self):
        self.page_project = ProjectPage(self.project)
        self.page_beam = BeamPage(self.project)
        self.page_lattice = LatticePage(self.project)
        self.page_settings = SettingsPage(self.project)
        self.page_files = FilesPage(self.project)
        self.page_run = RunPage(self.project)
        self.page_results = ResultsPage(self.project)
        self.config_pages = [self.page_beam, self.page_lattice, self.page_settings]
        # (label, codicon, page)
        self.pages = [
            (self.tr("Project"), "home", self.page_project),
            (self.tr("Beam"), "pulse", self.page_beam),
            (self.tr("Lattice"), "list-ordered", self.page_lattice),
            (self.tr("Settings"), "settings-gear", self.page_settings),
            (self.tr("Files"), "files", self.page_files),
            (self.tr("Run"), "play-circle", self.page_run),
            (self.tr("Results"), "graph-line", self.page_results),
        ]

    def _build_layout(self):
        self.sidebar = Sidebar(f"AVAS  v{__version__}")
        for label, icon_name, _page in self.pages:
            self.sidebar.add_item(label, icon_name)

        self.stack = QStackedWidget()
        self.stack.setObjectName("pageContainer")
        for _label, _icon, page in self.pages:
            # every page scrolls when the window is smaller than the page's minimum size, so the
            # side bar and panel sashes are never blocked by a wide page (e.g. the lattice toolbar)
            area = QScrollArea()
            area.setWidgetResizable(True)
            area.setWidget(page)
            self.stack.addWidget(area)
        self.stack.setMinimumSize(theme.px(360), theme.px(160))

        self.log_panel = LogPanel()
        self.log_panel.setMinimumHeight(theme.px(HEADER_HEIGHT) + theme.px(40))
        self.vsplit = Splitter(Qt.Vertical, fill_token="panel_bg", line_edge="start")
        self.vsplit.addWidget(self.stack)
        self.vsplit.addWidget(self.log_panel)
        self.vsplit.setStretchFactor(0, 1)
        self.vsplit.setStretchFactor(1, 0)
        self.vsplit.setSizes([640, 200])

        self.hsplit = Splitter(Qt.Horizontal, fill_token="sidebar_bg", line_edge="end")
        self.hsplit.addWidget(self.sidebar)
        self.hsplit.addWidget(self.vsplit)
        self.hsplit.setStretchFactor(0, 0)
        self.hsplit.setStretchFactor(1, 1)
        self.setCentralWidget(self.hsplit)
        self._sidebar_width = theme.px(DEFAULT_WIDTH)
        self._log_height = 200
        self._set_sidebar_width(self._sidebar_width)

        self.status = StatusBar()
        self.setStatusBar(self.status)

        self.sidebar.current_changed.connect(self.stack.setCurrentIndex)
        self.sidebar.set_current_index(PAGE_PROJECT)

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

        m_view = mb.addMenu(self.tr("&View"))
        self.act_sidebar = QAction(self.tr("Collapse sidebar"), self, checkable=True)
        self.act_sidebar.setShortcut("Ctrl+B")
        self.act_sidebar.toggled.connect(self.sidebar.set_collapsed)
        m_view.addAction(self.act_sidebar)
        self.act_log = QAction(self.tr("Show log panel"), self, checkable=True)
        self.act_log.setChecked(True)
        self.act_log.setShortcut("Ctrl+J")
        self.act_log.toggled.connect(self._set_panel_visible)
        m_view.addAction(self.act_log)
        m_view.addSeparator()
        theme_menu = m_view.addMenu(self.tr("Theme"))
        self._theme_group = QActionGroup(self)
        current_theme = self.settings.value("ui/theme", "system", type=str)
        for mode, text in (("system", self.tr("Follow system")), ("light", self.tr("Light")),
                           ("dark", self.tr("Dark"))):
            act = QAction(text, self, checkable=True)
            act.setChecked(mode == current_theme)
            act.setData(mode)
            act.triggered.connect(lambda _c, m=mode: self.set_theme(m))
            self._theme_group.addAction(act)
            theme_menu.addAction(act)
        scale_menu = m_view.addMenu(self.tr("UI scale"))
        from avas.gui.app import ui_scale
        current = ui_scale(self.settings)
        self._scale_group = QActionGroup(self)
        for scale in SCALES:
            act = QAction(f"{scale} %", self, checkable=True)
            act.setChecked(scale == current)
            act.setData(scale)
            act.triggered.connect(lambda _c, s=scale: self.set_ui_scale(s))
            self._scale_group.addAction(act)
            scale_menu.addAction(act)
        scale_menu.addSeparator()
        act_in = QAction(self.tr("Zoom in"), self)
        act_in.setShortcuts(["Ctrl+=", "Ctrl++"])
        act_in.triggered.connect(lambda: self.step_ui_scale(+1))
        act_out = QAction(self.tr("Zoom out"), self)
        act_out.setShortcut("Ctrl+-")
        act_out.triggered.connect(lambda: self.step_ui_scale(-1))
        act_reset = QAction(self.tr("Reset zoom"), self)
        act_reset.setShortcut("Ctrl+0")
        act_reset.triggered.connect(lambda: self.set_ui_scale(100))
        scale_menu.addActions([act_in, act_out, act_reset])
        self.addActions([act_in, act_out, act_reset])   # shortcuts work even when the menu is closed

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

        m_help = mb.addMenu(self.tr("&Help"))
        act_about = QAction(self.tr("About AVAS"), self)
        act_about.triggered.connect(self.about)
        m_help.addAction(act_about)

    def _build_toolbar(self):
        tb = QToolBar(self.tr("Main"))
        tb.setObjectName("mainToolbar")
        tb.setMovable(False)
        tb.setFloatable(False)
        tb.toggleViewAction().setVisible(False)
        tb.setToolButtonStyle(Qt.ToolButtonIconOnly)
        self.toolbar = tb
        icons.bind(self.act_open, "folder-opened")
        icons.bind(self.act_save, "save")
        icons.bind(self.act_run, "play", "success")
        icons.bind(self.act_stop, "debug-stop", "danger")
        for act in (self.act_open, self.act_save, self.act_run, self.act_stop):
            act.setToolTip(f"{act.text().replace('&', '')}  ({act.shortcut().toString()})")
            tb.addAction(act)
            if act is self.act_save:
                tb.addSeparator()
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        tb.addWidget(spacer)
        self.act_tb_sidebar = QAction(self.tr("Toggle sidebar (Ctrl+B)"), self)
        self.act_tb_sidebar.triggered.connect(self.act_sidebar.toggle)
        self.act_tb_panel = QAction(self.tr("Toggle log panel (Ctrl+J)"), self)
        self.act_tb_panel.triggered.connect(self.act_log.toggle)
        tb.addAction(self.act_tb_sidebar)
        tb.addAction(self.act_tb_panel)
        self._update_layout_icons()
        self.addToolBar(tb)

    def _wire(self):
        self.project.changed.connect(self.on_project_changed)
        self.project.lattice_changed.connect(self.on_lattice_changed)
        self.page_files.navigate_requested.connect(self.sidebar.set_current_index)
        self.page_files.use_particles_requested.connect(self.use_particles)
        self.page_project.new_requested.connect(self.new_project)
        self.page_project.open_requested.connect(self.open_project)
        self.page_run.run_requested.connect(self.run_simulation)
        self.page_run.stop_requested.connect(self.stop_simulation)
        self.runner.progress.connect(self.on_progress)
        self.runner.output.connect(self.on_engine_output)
        self.runner.finished.connect(self.on_run_finished)
        self.sidebar.current_changed.connect(self._on_page_changed)
        self.sidebar.collapsed_changed.connect(self._on_sidebar_collapsed)
        self.sidebar.expand_requested.connect(lambda: self.act_sidebar.setChecked(False))
        self.hsplit.splitterMoved.connect(self._on_hsplit_moved)
        self.hsplit.handle_double_clicked.connect(lambda _i: self.act_sidebar.toggle())
        self.vsplit.splitterMoved.connect(self._on_vsplit_moved)
        self.vsplit.handle_double_clicked.connect(
            lambda _i: self._set_panel_maximized(not self.log_panel.is_maximized()))
        self.log_panel.visibility_requested.connect(self.act_log.setChecked)
        self.log_panel.maximize_requested.connect(self._set_panel_maximized)
        self.log_panel.message.connect(lambda level, text: self.status.show_message(text, level))
        self.log_panel.counts_changed.connect(self.status.set_counts)
        self.status.project_clicked.connect(lambda: self.sidebar.set_current_index(PAGE_PROJECT))
        self.status.problems_clicked.connect(lambda: self.act_log.setChecked(True))
        self.status.theme_toggle_clicked.connect(lambda: self.set_theme("light" if theme.is_dark() else "dark"))
        theme.notifier().changed.connect(self._on_theme_changed)
        self._on_theme_changed()
        self._update_recent_menu()
        self._set_project_actions(False)

    # ------------------------------------------------------------------ persisted UI state
    def _restore_ui_state(self):
        geo = self.settings.value("ui/geometry")
        if geo is not None:
            self.restoreGeometry(geo)
        self._sidebar_width = self.settings.value("ui/sidebarWidth", theme.px(DEFAULT_WIDTH), type=int)
        if self.settings.value("ui/sidebarCollapsed", False, type=bool):
            self.act_sidebar.setChecked(True)
        else:
            self._set_sidebar_width(self._sidebar_width)
        self._log_height = max(80, self.settings.value("ui/logHeight", 200, type=int))
        self._apply_log_height(self._log_height)
        if self.settings.value("ui/logCollapsed", False, type=bool):
            self.act_log.setChecked(False)

    # ---- side bar
    def _set_sidebar_width(self, width):
        total = sum(self.hsplit.sizes()) or self.width()
        self.hsplit.setSizes([width, max(1, total - width)])

    def _on_sidebar_collapsed(self, collapsed):
        self.settings.setValue("ui/sidebarCollapsed", collapsed)
        if self.act_sidebar.isChecked() != collapsed:
            self.act_sidebar.setChecked(collapsed)
        self._set_sidebar_width(self.sidebar.collapsed_width() if collapsed else self._sidebar_width)
        self._update_layout_icons()

    def _on_hsplit_moved(self, _pos, _index):
        width = self.hsplit.sizes()[0]
        strip = self.sidebar.collapsed_width()
        if self.sidebar.is_collapsed():
            if width > strip + theme.px(40):
                self._sidebar_width = max(width, theme.px(MIN_EXPANDED_WIDTH))
                self.act_sidebar.setChecked(False)
            else:
                self._set_sidebar_width(strip)
        elif width < theme.px(SNAP_WIDTH):
            self.act_sidebar.setChecked(True)
        else:
            self._sidebar_width = width

    # ---- log panel
    def _apply_log_height(self, height):
        total = sum(self.vsplit.sizes()) or self.height()
        self.vsplit.setSizes([max(200, total - height), height])

    def _set_panel_visible(self, visible):
        visible = bool(visible)
        if not visible and self.log_panel.isVisible() and not self.log_panel.is_maximized():
            self._log_height = self.log_panel.height()
        if not visible and self.log_panel.is_maximized():
            self.log_panel.set_maximized(False)
        self.log_panel.setVisible(visible)
        if visible:
            self._apply_log_height(self._log_height)
        self.settings.setValue("ui/logCollapsed", not visible)
        if self.act_log.isChecked() != visible:
            self.act_log.setChecked(visible)
        self._update_layout_icons()

    def _set_panel_maximized(self, maximized):
        maximized = bool(maximized)
        if maximized and not self.act_log.isChecked():
            self.act_log.setChecked(True)
        if maximized:
            if not self.log_panel.is_maximized():
                self._log_height = self.log_panel.height()
            total = sum(self.vsplit.sizes())
            self.vsplit.setSizes([1, max(1, total - 1)])
        else:
            self._apply_log_height(self._log_height)
        self.log_panel.set_maximized(maximized)

    def _on_vsplit_moved(self, _pos, _index):
        if self.log_panel.is_maximized():
            self.log_panel.set_maximized(False)
        self._log_height = self.log_panel.height()

    # ---- chrome icons / theme
    def _update_layout_icons(self):
        if not hasattr(self, "act_tb_sidebar"):
            return
        icons.bind(self.act_tb_sidebar,
                   "layout-sidebar-left-off" if self.sidebar.is_collapsed() else "layout-sidebar-left")
        icons.bind(self.act_tb_panel, "layout-panel" if self.act_log.isChecked() else "layout-panel-off")

    def _on_theme_changed(self):
        self.toolbar.setIconSize(QSize(theme.px(18), theme.px(18)))
        mode = theme.current_mode()
        for act in self._theme_group.actions():
            act.setChecked(act.data() == mode)

    def set_theme(self, mode):
        """``system``, ``light`` or ``dark``; applied live and remembered."""
        self.settings.setValue("ui/theme", mode)
        self.settings.sync()
        theme.apply_theme(QApplication.instance(), mode=mode)

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
        self.status.set_project(self.project.name if ok else "", self.project.path if ok else "")
        self.status.set_mode(self._mode_text())
        self.setWindowTitle(f"AVAS - {self.project.name}" if ok else "AVAS")
        self._set_project_actions(ok)
        self._update_recent_menu()
        for page in self.config_pages + [self.page_files]:
            try:
                page.load()
            except Exception as exc:  # noqa: BLE001
                report_error(self, exc, self.tr("Load project"))
        self.page_project.refresh()
        self.page_run.refresh(self._mode_text())
        self.page_results.refresh_all()
        if ok and self.sidebar.current_index() == PAGE_PROJECT:
            self.sidebar.set_current_index(PAGE_BEAM)

    def on_lattice_changed(self, name):
        """The lattice used for the run was switched (Lattice page or Files page)."""
        self.page_lattice.on_lattice_changed(name)
        self.page_project.refresh()
        if self.sidebar.current_index() == PAGE_FILES:
            self.page_files.refresh()

    def use_particles(self, name):
        """Files page: make *name* the initial particle distribution (beam.txt)."""
        if not self.project.is_open or not name:
            return
        page = self.page_beam
        page.cb_use_dst.setChecked(True)
        page.edit_dst.setText(name)
        try:
            page.save()
        except Exception as exc:  # noqa: BLE001
            report_error(self, exc, self.tr("Beam"))
            return
        log.info("initial beam read from %s", name)
        self.sidebar.set_current_index(PAGE_BEAM)

    def _on_page_changed(self, row):
        self.status.set_mode(self._mode_text())
        if row == PAGE_RUN:
            self.page_run.refresh(self._mode_text())
        elif row == PAGE_PROJECT:
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
            if self.page_files.is_dirty():
                self.page_files.save()
            for page in self.config_pages:
                page.save()
            self.status.set_text(self.tr("Project saved"))
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
        self.sidebar.set_busy(PAGE_RUN, True)
        self.status.set_running(True, self.tr("Simulation running..."))
        self.sidebar.set_current_index(PAGE_RUN)

    def stop_simulation(self):
        self.runner.stop()

    def on_progress(self, state):
        self.page_run.on_progress(state)
        self.status.set_progress(self.page_run.summary_line(state))

    def on_engine_output(self, line):
        if line.startswith("[avas]"):
            log.info("%s", line)
        else:
            log.debug("engine: %s", line)

    def on_run_finished(self, ok, message):
        self.act_run.setEnabled(self.project.is_open)
        self.act_stop.setEnabled(False)
        self.sidebar.set_busy(PAGE_RUN, False)
        self.page_run.on_finished(ok, message)
        self.page_project.refresh()
        self.status.set_running(False)
        if ok:
            self.status.set_text(self.tr("Simulation finished"))
            self.page_results.refresh_all()
        else:
            self.status.set_text(self.tr("Simulation failed: %s") % message, error=True)
            if message != "stopped by user" and not os.environ.get("AVAS_GUI_NO_DIALOGS"):
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
        self._save_ui_state()
        self.log_panel.detach()
        new_window = MainWindow()
        new_window.setGeometry(self.geometry())
        app._avas_main_window = new_window
        self._silent_close = True
        self.close()

    def set_ui_scale(self, scale):
        scale = min(SCALES, key=lambda s: abs(s - scale))
        self.settings.setValue("ui/uiScale", scale)
        self.settings.remove("ui/fontPointSize")
        self.settings.sync()
        for act in self._scale_group.actions():
            act.setChecked(act.data() == scale)
        from avas.gui.app import apply_ui_scale
        apply_ui_scale(QApplication.instance(), self.settings)
        log.info("UI scale %d %%", scale)

    def step_ui_scale(self, direction):
        from avas.gui.app import ui_scale
        current = ui_scale(self.settings)
        idx = SCALES.index(min(SCALES, key=lambda s: abs(s - current)))
        idx = max(0, min(len(SCALES) - 1, idx + direction))
        self.set_ui_scale(SCALES[idx])

    def about(self):
        QMessageBox.about(self, self.tr("About AVAS"),
                          f"<b>AVAS {__version__}</b><br>Advanced Virtual Accelerator Software<br><br>"
                          "C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)")

    # ------------------------------------------------------------------ close
    def _save_ui_state(self):
        self.settings.setValue("ui/geometry", self.saveGeometry())
        self.settings.setValue("ui/sidebarCollapsed", self.sidebar.is_collapsed())
        self.settings.setValue("ui/sidebarWidth", self._sidebar_width)
        visible = self.act_log.isChecked()
        self.settings.setValue("ui/logCollapsed", not visible)
        if visible and not self.log_panel.is_maximized():
            self._log_height = self.log_panel.height()
        self.settings.setValue("ui/logHeight", self._log_height)
        self.settings.sync()

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
        if self.page_files.is_dirty():
            reply = QMessageBox.question(self, self.tr("Unsaved changes"),
                                         self.tr("Save changes to %s?") % os.path.basename(self.page_files._current or ""),
                                         QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel, QMessageBox.Save)
            if reply == QMessageBox.Cancel:
                event.ignore()
                return
            if reply == QMessageBox.Save:
                self.page_files.save()
        self._save_ui_state()
        self.log_panel.detach()
        event.accept()
