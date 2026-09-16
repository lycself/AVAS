
import sys
import time

from PyQt5.QtCore import QTimer, QObject
from PyQt5.QtWidgets import QActionGroup, QScrollArea
from PyQt5.QtWidgets import QMainWindow, QAction, QToolBar, QVBoxLayout, QWidget, QPushButton, \
    QStackedWidget,QMenu, QLabel, QLineEdit, QTextEdit,  QGridLayout, QHBoxLayout,  QFrame, QFileDialog, QMessageBox,\
    QApplication, QGroupBox
import os
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import QStandardPaths, pyqtSignal, QSettings, QThread

from avas.utils.readfile import read_txt, read_dst
from avas.i18n import available_languages
from avas.gui.page_beam import PageBeam
from avas.gui.page_lattice import PageLattice
from avas.gui.page_analysis import PageAnalysis
from avas.gui.page_input import PageInput
from avas.gui.page_error import PageError
from avas.gui.page_match import PageMatch
from avas.gui.page_others import PageOthers
from avas.gui.page_output import PageOutput
from avas.gui.page_tool import PageTool


from avas.gui.page_data import PageData
import multiprocessing
from avas.gui.user_defined import treat_err, set_background
from avas.gui.page_acc import PageAccept
from send2trash import send2trash
from avas.utils.iniconfig import IniConfig
from avas.api.qt.SimMode import SimMode
from avas.api.qt.createbasicfile import CreateBasicProject
from avas.core.MultiParticle import MultiParticle
from multiprocessing import Process, Queue
from avas.api.qt.api import judge_if_is_avas_project
import traceback
from avas.utils.exception import BaseError
from concurrent.futures import ProcessPoolExecutor
from avas.api.qt.api import project_check

# def basic_run(project_path, queue):
#     try:
#         item = {"projectPath": project_path}
#         obj = SimMode(item)
#         obj.run()
#     except Exception as e:
#         queue.put(str(e))
#     finally:
#         queue.close()


# class SimThread(QThread):
#     finished = pyqtSignal()  # 任务完成信号
#     sim_error_signal = pyqtSignal(str)
#
#     def __init__(self, project_path):
#         super().__init__()
#         self.project_path = project_path
#         self.process = None
#
#     def run(self):
#         try:
#             print("Thread started")
#             item = {"projectPath": self.project_path}
#
#             queue = Queue()  # 创建队列用于传递异常信息
#
#             # 创建进程并传递队列
#             self.process = Process(target=basic_run, args=(self.project_path, queue,))
#             self.process.start()
#             self.process.join()
#
#             # 检查子进程是否有异常
#             if not queue.empty():
#                 error_message = queue.get()
#                 raise Exception(f"Subprocess Error: {error_message}")
#
#             self.finished.emit()
#             print("Thread finished")
#
#         except Exception as e:
#             self.sim_error_signal.emit(str(e))
#
#     def stop(self):
#         if self.process and self.process.is_alive():
#             print("Stopping process...")
#             self.process.terminate()  # 强制终止子进程
#             self.process.join()       # 等待子进程结束
#             print("Process stopped")
#
#         self.quit()  # 让 QThread 退出
#         self.wait()  # 确保线程彻底结束





def basic_run(project_path, queue):
    try:
        item = {"projectPath": project_path}
        obj = SimMode(item)
        obj.run()
    except Exception as e:
        queue.put(str(e))
    finally:
        queue.close()


class SimThread(QObject):
    finished = pyqtSignal()
    sim_error_signal = pyqtSignal(str)

    def __init__(self, project_path):
        super().__init__()
        self.project_path = project_path
        self.process = None
        self.queue = None
        self.check_timer = QTimer()
        self.check_timer.timeout.connect(self.check_process)

    def start(self):
        self.queue = Queue()
        self.process = Process(target=basic_run, args=(self.project_path, self.queue))
        self.process.start()
        self.check_timer.start(1000)  # 更快响应 UI

    def check_process(self):
        if not self.process.is_alive():
            self.process.join()
            self.process = None
            self.check_timer.stop()

            if not self.queue.empty():
                error_msg = self.queue.get()
                self.sim_error_signal.emit(f"Process Error: {error_msg}")
            else:
                self.finished.emit()

            if self.queue:
                self.queue.close()
                self.queue = None

    def stop(self):
        if self.process and self.process.is_alive():
            print("Force killing simulation process.")
            self.process.terminate()
            self.process.join()
            self.process = None

        if self.check_timer.isActive():
            self.check_timer.stop()

        if self.queue:
            self.queue.close()
            self.queue = None


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.project_path = ''

        self.input_signal = None
        self.match_signal = None
        self.error_signal = None

        self.sim_thread = None
        # stored per user (registry on Windows, ~/.config on Linux) instead of a file in the CWD
        self.settings = QSettings('AVAS', 'AVAS')

        self.initUI()

    def initUI(self):
        self.setGeometry(800, 500, 600, 700)
        self.setWindowTitle(self.tr('AVAS'))
        self.setWindowIcon(QIcon('web.png'))
        set_background(self, 253, 253, 253)
        main_layout = QVBoxLayout(self)

        menubar = self.menuBar()
        fileMenu = menubar.addMenu(self.tr('File'))

        newAct = QAction(self.tr('New'), self)
        newAct.triggered.connect(self.create_project)

        openAct = QAction(self.tr('open'), self)
        openAct.triggered.connect(self.open_project)

        saveAct = QAction(self.tr('save'), self)
        saveAct.triggered.connect(self.save_project)

        # impMenu = QMenu('Import', self)
        # impAct = QAction('Import mail', self)
        # impMenu.addAction(impAct)


        fileMenu.addAction(newAct)
        fileMenu.addAction(openAct)
        fileMenu.addAction(saveAct)
######################
        refreshMenu = menubar.addMenu(self.tr('refresh'))

        refresh_beam_act = QAction(self.tr('beam'), self)
        refresh_beam_act.triggered.connect(self.refresh_beam)

        refresh_input_act = QAction(self.tr('input'), self)
        refresh_input_act.triggered.connect(self.refresh_input)

        refresh_lattice_act = QAction(self.tr('lattice'), self)
        refresh_lattice_act.triggered.connect(self.refresh_lattice)

        refreshMenu.addAction(refresh_beam_act)
        refreshMenu.addAction(refresh_input_act)
        refreshMenu.addAction(refresh_lattice_act)

        self._build_settings_menu(menubar)

########################
        # runMenu = menubar.addMenu('run')
        #
        # run_act = QAction('run', self)
        # run_act.triggered.connect(self.run)
        #
        # run_stop_act = QAction('stop', self)
        # run_stop_act.triggered.connect(self.stop_all)
        #
        #
        # runMenu.addAction(run_act)
        #
        # runMenu.addAction(run_stop_act)
        # runMenu.addAction(run_stop_act)

        self.run_control_groupbox = QGroupBox()
        layout = QHBoxLayout()

        run_btn_size = 28
        # ▶ Run 按钮
        self.run_btn = QPushButton('▶')
        self.run_btn.setFixedSize(run_btn_size, run_btn_size)
        self.run_btn.setFont(QFont('Arial', 14))
        self.run_btn.setStyleSheet("background-color: lightgreen;")
        self.run_btn.clicked.connect(self.run)

        # ■ Stop 按钮
        self.stop_btn = QPushButton('■')
        self.stop_btn.setFixedSize(run_btn_size, run_btn_size)
        self.stop_btn.setFont(QFont('Arial', 14))
        self.stop_btn.setStyleSheet("background-color: lightgray;")
        self.stop_btn.clicked.connect(self.stop_all)
        self.stop_btn.setEnabled(False)

        layout.addWidget(self.run_btn)
        layout.addStretch(1)
        layout.addWidget(self.stop_btn)
        layout.addStretch(20)
        self.run_control_groupbox.setLayout(layout)

########################
        toolbar = QToolBar(self.tr("Pages"))

        self.page_beam = PageBeam(self.project_path)
        self.page_lattice = PageLattice(self.project_path)
        self.page_analysis = PageAnalysis(self.project_path)
        self.page_input = PageInput(self.project_path)
        # self.page_function = PageFunction(self.project_path)
        self.page_match = PageMatch(self.project_path)
        self.page_others = PageOthers(self.project_path)

        self.page_data = PageData(self.project_path)
        self.page_error = PageError(self.project_path)
        # self.page_longdistance = PageLongdistance(self.project_path)
        self.page_output = PageOutput(self.project_path)
        self.page_accept = PageAccept(self.project_path)
        self.page_tool = PageTool(self.project_path)

        page_beam_action = QAction(self.tr("beam"), self)
        page_lattice_action = QAction(self.tr("lattice"), self)
        page_analysis_action = QAction(self.tr('analysis'), self)
        page_input_action = QAction(self.tr('setting'), self)
        # page_function_action = QAction('function', self)
        # page_match_action = QAction('match', self)
        page_others_action = QAction(self.tr('others'), self)

        page_data_action = QAction(self.tr('data'), self)
        page_error_action = QAction(self.tr('error'), self)
        page_output_action = QAction(self.tr('output'), self)
        page_accept_action = QAction(self.tr('accept'), self)
        page_tool_action = QAction(self.tr('tool'), self)

        # page_longdistance_action = QAction('long distance', self)


        self.stacked_widget = QStackedWidget()
        self.stacked_widget.addWidget(self.page_beam)
        self.stacked_widget.addWidget(self.page_lattice)
        self.stacked_widget.addWidget(self.page_analysis)
        self.stacked_widget.addWidget(self.page_input)
        # self.stacked_widget.addWidget(self.page_function)
        self.stacked_widget.addWidget(self.page_match)

        self.stacked_widget.addWidget(self.page_data)
        self.stacked_widget.addWidget(self.page_error)
        self.stacked_widget.addWidget(self.page_output)
        self.stacked_widget.addWidget(self.page_accept)
        self.stacked_widget.addWidget(self.page_tool)


        # self.stacked_widget.addWidget(self.page_others)

        # self.stacked_widget.addWidget(self.page_longdistance)


        page_beam_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_beam))
        page_lattice_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_lattice))
        page_analysis_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_analysis))
        page_input_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_input))
        # page_function_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_function))
        # page_match_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_match))

        page_data_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_data))
        self.stacked_widget.currentChanged.connect(self.handle_page_change)

        page_error_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_error))
        # page_others_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_others))
        page_output_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_output))
        page_accept_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_accept))

        page_tool_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_tool))

        # page_longdistance_action.triggered.connect(lambda: self.stacked_widget.setCurrentWidget(self.page_longdistance))

        toolbar.addAction(page_beam_action)
        toolbar.addAction(page_lattice_action)
        toolbar.addAction(page_input_action)
        # toolbar.addAction(page_function_action)
        # toolbar.addAction(page_match_action)
        toolbar.addAction(page_error_action)

        toolbar.addAction(page_output_action)
        toolbar.addAction(page_data_action)
        toolbar.addAction(page_analysis_action)
        toolbar.addAction(page_accept_action)
        toolbar.addAction(page_tool_action)

        # toolbar.addAction(page_others_action)
        # toolbar.addAction(page_longdistance_action)


        frame = QFrame()  # 创建外边框小部件

        # 设置框架的边框样式


        hbox = QHBoxLayout()

        label = QLabel(self.tr("project path"))
        # label.setStyleSheet("background-color: rgb(225, 225, 225); border: 0px solid black;")

        self.path_text = QLineEdit("")
        self.path_text.setReadOnly(True)  # 设置为只读模式

        hbox.addWidget(label)
        hbox.addWidget(self.path_text)
        self.path_text.setStyleSheet("background-color: rgb(240, 240, 240);")

        # 创建用于表示线的QFrame
        line_frame = QFrame()
        line_frame.setFrameShape(QFrame.HLine)  # 设置为水平线
        line_frame.setFrameShadow(QFrame.Sunken)  # 设置阴影效果

        central_widget = QWidget()  # 创建一个中央部件

        central_layout = QVBoxLayout()  # 在中央部件上设置一个垂直布局
        central_layout.addWidget(self.run_control_groupbox)
        central_layout.addWidget(toolbar)
        central_layout.addLayout(hbox)  # 将带有边框的框架添加到布局中
        central_layout.addWidget(line_frame)  # 将表示线的框架添加到布局中
        # pages live in a scroll area: the window may be shrunk below the page
        # height and the content scrolls instead of forcing a minimum size
        self.page_scroll = QScrollArea()
        self.page_scroll.setWidgetResizable(True)
        self.page_scroll.setFrameShape(QFrame.NoFrame)
        self.page_scroll.setWidget(self.stacked_widget)
        central_layout.addWidget(self.page_scroll)

        self.page_input.input_signal.connect(self.get_input_signal)
        #
        self.page_error.error_signal.connect(self.get_error_signal)
        self.page_match.match_signal.connect(self.get_match_signal)

        # self.basci_mulp_process = multiprocessing.Process()
        # self.basci_env_process = multiprocessing.Process()
        # self.err_process = multiprocessing.Process()
        # self.match_process = multiprocessing.Process()

        central_widget.setLayout(central_layout)  # 将布局设置给中央部件

        self.setCentralWidget(central_widget)  # 将中央部件设置为主窗口的中央部件
        self.show()
        self.initialize_page()

        self.timer1 = QTimer()
        self.timer1.timeout.connect(self.activate_output)


    # ------------------------------------------------------------------
    # Settings menu: UI language and font size (both stored in QSettings,
    # applied on the next start)
    # ------------------------------------------------------------------
    def _build_settings_menu(self, menubar):
        settings_menu = menubar.addMenu(self.tr('Settings'))

        lang_menu = settings_menu.addMenu(self.tr('Language'))
        current_lang = self.settings.value('ui/language', 'en')
        lang_group = QActionGroup(self)
        lang_group.setExclusive(True)
        for code, name in available_languages().items():
            act = QAction(name, self, checkable=True)
            act.setChecked(code == current_lang)
            act.triggered.connect(lambda _checked, c=code: self._set_language(c))
            lang_group.addAction(act)
            lang_menu.addAction(act)

        font_menu = settings_menu.addMenu(self.tr('Font size'))
        current_size = self.settings.value('ui/fontPointSize', 0, type=int)
        font_group = QActionGroup(self)
        font_group.setExclusive(True)
        for size in (0, 9, 10, 11, 12, 14, 16):
            label = self.tr('System default') if size == 0 else f'{size} pt'
            act = QAction(label, self, checkable=True)
            act.setChecked(size == current_size)
            act.triggered.connect(lambda _checked, n=size: self._set_font_size(n))
            font_group.addAction(act)
            font_menu.addAction(act)

    def _set_language(self, code):
        """Switch UI language immediately by rebuilding the main window."""
        if code == self.settings.value('ui/language', 'en'):
            return
        if self.sim_thread is not None:
            QMessageBox.information(self, self.tr('Language'),
                                    self.tr('Please stop the running simulation before changing the language.'))
            return
        self.settings.setValue('ui/language', code)
        self.settings.sync()

        from avas.i18n import install_translator
        app = QApplication.instance()
        for tr_ in getattr(app, '_avas_translators', []):
            app.removeTranslator(tr_)
        install_translator(app, code)

        # every page builds its texts in initUI() from tr(), so a fresh window
        # comes up fully translated; project path is restored from QSettings
        new_window = MainWindow()
        new_window.setGeometry(self.geometry())
        app._avas_main_window = new_window
        self._silent_close = True
        self.close()

    def _set_font_size(self, size):
        """Apply the font size immediately (0 = default)."""
        self.settings.setValue('ui/fontPointSize', size)
        self.settings.sync()
        from avas.gui.app import _apply_font
        _apply_font(QApplication.instance(), self.settings)

    def create_project(self):
        desktop_path = QStandardPaths.writableLocation(QStandardPaths.DesktopLocation)
        default_folder_path = desktop_path

        new_folder_path, _ = QFileDialog.getSaveFileName(self, self.tr("Create New Folder"), default_folder_path, filter="Folders (*)")
        new_folder_path = os.path.normpath(new_folder_path)

        if new_folder_path:

            self.project_path = new_folder_path
            self.path_text.setText(self.project_path)
            self.path_text.setText(self.project_path)
            self.refresh_page_project_path()


            item = {
                "projectPath": self.project_path,
                "beamKeys": [],
                "inputkeys": []
            }
            create_project_obj = CreateBasicProject(item, 'qt')
            res = create_project_obj.create_project()
            if res['code'] == -1:
                raise Exception(res["data"]['msg'])
                return -1
            self.page_fill_parameter()

        self.settings.setValue("lastProjectPath", self.project_path)


    def open_project(self):
        # desktop_path = QStandardPaths.writableLocation(QStandardPaths.DesktopLocation)
        # default_folder_path = desktop_path
        #
        # folder_path, _ = QFileDialog.getOpenFileName(self, "Create New Folder", default_folder_path,
        #                                                  filter="Folders (*)")
        options = QFileDialog.Options()
        options |= QFileDialog.ShowDirsOnly | QFileDialog.DontResolveSymlinks
        folder_path = QFileDialog.getExistingDirectory(self, self.tr("Select Directory"), options=options)
        folder_path = os.path.normpath(folder_path)

        if folder_path:
            item = {"projectPath": folder_path}
            res = judge_if_is_avas_project(item)
            # print(343, res)
            if res['code'] == 0:
                pass
            else:
                raise Exception(res["data"]['msg'])



            self.project_path = folder_path
            self.path_text.setText(self.project_path)

            # self.create_backup_file()
            self.refresh_page_project_path()
            self.page_fill_parameter()
            self.settings.setValue("lastProjectPath", self.project_path)




    def refresh_page_project_path(self):
        self.page_beam.updatePath(self.project_path)
        self.page_lattice.updatePath(self.project_path)
        self.page_input.updatePath(self.project_path)
        # self.page_function.updatePath(self.project_path)
        self.page_match.updatePath(self.project_path)

        self.page_data.updatePath(self.project_path)
        self.page_analysis.updatePath(self.project_path)
        self.page_error.updatePath(self.project_path)
        # self.page_longdistance.updatePath(self.project_path)
        self.page_others.updatePath(self.project_path)
        self.page_output.updatePath(self.project_path)
        self.page_accept.updatePath(self.project_path)
        self.page_tool.updatePath(self.project_path)





    def page_fill_parameter(self):
        self.page_beam.fill_parameter()
        self.page_lattice.fill_parameter()
        self.page_input.fill_parameter()
        # self.page_longdistance.fill_parameter()
        self.page_error.fill_parameter()


    def save_project(self):
        if not self.project_path:
            raise Exception('No project')

        self.page_beam.save_beam()
        self.page_lattice.save_all_lattice()
        self.page_input.save_input()
        self.save_ini()


    def save_ini(self):
        item = {"projectPath": self.project_path}
        ini_obj = IniConfig()
        ini_obj.create_from_file(item)
        set_dict = {'input': self.input_signal,
                    'match': self.match_signal,
                    'error': self.error_signal,
        }
        set_dict = {k: v for k, v in set_dict.items() if v}
        res = ini_obj.set_param(**set_dict)
        if res["code"] == -1:
            raise Exception(res['data']['msg'])

        ini_path = os.path.join(self.project_path, "inputFile", 'ini.ini')
        res = ini_obj.write_to_file(item)
        if res["code"] == -1:
            raise Exception(res['data']['msg'])


    def run_btn_state(self, runing):
        if runing == 1:
            # 运行时，run变灰，stop变绿
            self.run_btn.setStyleSheet("background-color: lightgray;")
            self.stop_btn.setStyleSheet("background-color: lightgreen;")
            self.run_btn.setEnabled(False)
            self.stop_btn.setEnabled(True)
        #停止
        elif runing == 0:
            self.run_btn.setStyleSheet("background-color: lightgreen;")
            self.stop_btn.setStyleSheet("background-color: lightgray;")
            self.run_btn.setEnabled(True)
            self.stop_btn.setEnabled(False)

    def run(self):
        self.stop_all()
        self.run_btn_state(1)


        try:
            self.save_project()
        except Exception as e:
            self.handle_error(str(e))
            return False

        # self.page_data.fill_parameter()

        item ={"projectPath": self.project_path}

        project_check(item)
        self.sim_thread = SimThread(self.project_path)
        #完成
        self.sim_thread.finished.connect(self.on_task_finished)
        #模拟出错
        self.sim_thread.sim_error_signal.connect(self.handle_error)

        self.sim_thread.start()
        self.timer1.start(2000)


    def handle_error(self, error_message):
        self.sim_thread = None
        self.stop_all()
        # 显示异常消息

        raise Exception(error_message)

    def activate_output(self, ):
        # print(445, self.sim_thread)
        self.page_output.update_progress()  # @treat_err

        #如果output
        self.page_output.schedule_error_signal.connect(self.stop_output)
        if self.sim_thread:
            pass
        else:
            self.timer1.stop()

#停止运行output页面输出
    def stop_output(self, schedule_error_info):
        self.timer1.stop()

#停止程序所有的运行
    def stop_all(self):
        # 改变按钮状态
        self.run_btn_state(0)

        try:
            if self.sim_thread and self.sim_thread.process and self.sim_thread.process.is_alive():
                self.sim_thread.stop()
        except Exception as e:
            raise Exception(f"SimThread stop error: {e}")
        finally:
            self.sim_thread = None
            self.timer1.stop()
            print("结束进程")

    def on_task_finished(self):
        print("Task finished.")
        self.run_btn_state(0)
        self.sim_thread = None




#################################

    def func_sim(self):
        obj = SimMode(self.project_path)
        if not self.sim_process.is_alive():
            self.sim_process = multiprocessing.Process(target=obj.run, )
            self.sim_process.start()

    def check_basci_mulp_process_status(self):
        if self.basci_mulp_process is not None:
            if self.basci_mulp_process.is_alive():
                # 进程仍在运行
                self.button_simulation.setEnabled(False)  # 禁用按钮
            else:
                # 进程已结束
                self.button_simulation.setEnabled(True)  # 启用按钮
                # 停止监测器



#####################################
    def closeEvent(self, event):
        if getattr(self, "_silent_close", False):
            event.accept()
            return

        reply = QMessageBox.question(self, self.tr('Message'),
                                     self.tr("Are you sure to quit?"), QMessageBox.Yes |
                                     QMessageBox.No, QMessageBox.No)

        if reply == QMessageBox.Yes:
            event.accept()
        else:
            event.ignore()

    #
    def refresh_beam(self):
        self.page_beam.fill_parameter()


    def refresh_lattice(self):
        self.page_lattice.fill_parameter()


    def refresh_input(self):
        self.page_input.fill_parameter()

    def get_input_signal(self, signal):
        self.input_signal = signal
        # print(self.input_signal)
    def get_error_signal(self, signal):
        self.error_signal = signal
        # print(self.error_signal)
    def get_match_signal(self, signal):
        self.match_signal = signal
        # print(self.match_signal)

    def initialize_page(self):
        # print(self.settings.value("lastProjectPath", None))
        if self.settings.value("lastProjectPath", None) is None:
            pass

        else:
            self.project_path = self.settings.value("lastProjectPath", "")
            # print(self.project_path)

            if os.path.exists(self.project_path):
                self.path_text.setText(self.project_path)
                self.refresh_page_project_path()
                self.page_fill_parameter()

            else:
                print(f"{self.project_path} not exist")

    def inspect(self):
        r1 = self.page_beam.inspect()
        r2 = self.page_lattice.inspect()
        r3 = self.page_input.inspect()
        # r4 = self.page_function.inspect()
        return all([r1, r2, r3])

    def handle_page_change(self, index):
        # print(1)
        # 获取当前显示的页面名称
        current_page_name = self.stacked_widget.widget(index).objectName()
        # print(current_page_name)
        # 如果当前页面是 'data'，则设置窗口大小
        if current_page_name == 'page_data' and self.width() < 1200:
            self.resize(1200, self.height())

if __name__ == '__main__':
    from avas.gui.app import main
    sys.exit(main())

