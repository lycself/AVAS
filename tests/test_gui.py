"""Headless GUI smoke test (offscreen Qt platform, no dialogs, no simulation run)."""
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010")
WORK = os.path.join(ROOT, "tests", "_output", "gui_project")

sys.path.insert(0, ROOT)
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
os.environ["AVAS_GUI_NO_DIALOGS"] = "1"
os.environ.setdefault("MPLBACKEND", "Agg")

pytest.importorskip("PyQt5")


@pytest.fixture(scope="module")
def app():
    from PyQt5.QtWidgets import QApplication
    app = QApplication.instance() or QApplication([])
    app.setOrganizationName("AVAS-test")
    app.setApplicationName("AVAS-test")
    from avas.gui.theme import apply_theme
    apply_theme(app)
    return app


@pytest.fixture(scope="module")
def project_dir():
    shutil.rmtree(WORK, ignore_errors=True)
    shutil.copytree(os.path.join(EXAMPLE, "InputFile"), os.path.join(WORK, "InputFile"))
    shutil.copytree(os.path.join(EXAMPLE, "OutputFile"), os.path.join(WORK, "OutputFile"))
    return WORK


def test_main_window_opens_project_and_plots(app, project_dir):
    from PyQt5.QtCore import Qt
    from avas.gui.main_window import MainWindow

    w = MainWindow()
    w.open_project(project_dir)
    assert w.project.is_open
    assert w.page_beam.values()["particlenumber"] == "5260"
    assert w.page_settings.values()["steppercycle"] == 50
    assert w.page_lattice.table.rowCount() == 1
    assert w.save_all()

    # every results entry must open without raising; data-dependent ones show a message instead
    tree = w.page_results.tree
    keys = []
    for g in range(tree.topLevelItemCount()):
        grp = tree.topLevelItem(g)
        for i in range(grp.childCount()):
            item = grp.child(i)
            keys.append(item.data(0, Qt.UserRole))
            w.page_results._activate(item)
    assert w.page_results.plots.count() == len(keys)
    tab = w.page_results.plots.widget(0)
    assert tab.status.text() == ""  # envelope plot drew without error

    # live language switch rebuilds the window
    w.set_language("zh_CN")
    w2 = app._avas_main_window
    assert w2 is not w and w2.project.path == project_dir
    w2.set_language("en")
    app._avas_main_window._silent_close = True
    app._avas_main_window.close()
