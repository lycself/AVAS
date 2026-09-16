import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QAction, QToolBar, QVBoxLayout, QWidget, QPushButton, \
    QStackedWidget,QMenu, QLabel, QLineEdit, QTextEdit,  QGridLayout, QHBoxLayout,  QFrame, QFileDialog, QGroupBox, QMessageBox

import os
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QStandardPaths


gray240 = "rgb(240, 240, 240)"


def set_background(widget, r, g, b):
    """Give *widget* a flat background colour via the palette.

    A selector-less ``setStyleSheet("background-color: ...")`` is inherited by
    every child, including popup menus and combo-box lists, where it hides the
    highlighted item (white text on a near-white background).  The palette does
    not have that side effect.
    """
    from PyQt5.QtGui import QColor, QPalette
    pal = widget.palette()
    pal.setColor(QPalette.Window, QColor(r, g, b))
    widget.setPalette(pal)
    widget.setAutoFillBackground(True)
class MyQLineEdit(QLineEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet(
            "border: 1px solid black; border-radius: 3px; padding: 1px;"
        )
#判断一个他图片是否存在
def common_error(message=None):
    if message is None:
         message = "some mistakes"
    reply = QMessageBox.question('Message',
                                     message, QMessageBox.Yes |
                                     QMessageBox.No)
def treat_err(func):
    def inner(self):
        try:
            result = func(self)
            return result
        except Exception as e:
            QMessageBox.warning(None, 'Error', f'{str(e)}')
            return None
        # result = func(self)
        # return result
    return inner

def treat_err2(func):
    def inner(self, *args):
        try:
            result = func(self, *args)
            return result
        except Exception as e:
            QMessageBox.warning(None, 'Error', f'{str(e)}')
            return None
    return inner