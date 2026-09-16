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
    from PyQt5.QtCore import QSettings
    QSettings("AVAS-test", "AVAS-test").clear()     # isolated from the user's real preferences
    from avas.gui.theme import apply_theme
    apply_theme(app)
    return app


@pytest.fixture(scope="module")
def project_dir():
    """The example project with fresh results (example outputs are not kept in the repository)."""
    import subprocess
    shutil.rmtree(WORK, ignore_errors=True)
    shutil.copytree(os.path.join(EXAMPLE, "InputFile"), os.path.join(WORK, "InputFile"))
    env = dict(os.environ)
    env.pop("AVAS_LATTICE", None)
    # a separate process keeps the engine and the matplotlib backend away from the Qt test process
    res = subprocess.run([sys.executable, "-m", "avas", "run", "--input", os.path.join(WORK, "InputFile"),
                          "--output", os.path.join(WORK, "OutputFile")],
                         cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
    assert res.returncode == 0, res.stdout[-2000:] + res.stderr[-2000:]
    assert os.path.isfile(os.path.join(WORK, "OutputFile", "DataSet.txt"))
    return WORK


def test_main_window_opens_project_and_plots(app, project_dir):
    from PyQt5.QtCore import Qt
    from avas.gui.main_window import MainWindow

    w = MainWindow()
    w.open_project(project_dir)
    assert w.project.is_open
    assert w.page_beam.values()["particlenumber"] == "5260"
    assert w.page_settings.values()["steppercycle"] == 50
    assert len(w.page_lattice.structure.document().elements()) == 1
    assert not w.page_lattice.is_dirty()
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

    # lattice: physical-parameter editor bound to the text (grid, form, undo, schematic)
    page = w.page_lattice
    se = page.structure
    text = page.editor.editor
    grid = se.grid
    grid.combo.setCurrentIndex(grid.combo.findData("field"))
    assert grid.table.rowCount() == 1
    assert "L" in grid.table.horizontalHeaderItem(grid.FIXED_COLS).text()
    grid.table.item(0, grid.FIXED_COLS).setText("0.123")               # length L
    assert "field 0.123 0.02" in text.toPlainText()
    field = next(st for st in se.document().statements if st.key == "field")
    se.select_line(field.line_no)
    assert se.panel._st.key == "field"
    aperture = next(wdg for k, _g, _s, wdg in se.panel._widgets if k == 1)
    aperture.setText("0.031")
    aperture.editingFinished.emit()
    assert "field 0.123 0.031" in text.toPlainText()
    field_type = next(wdg for k, _g, _s, wdg in se.panel._widgets if k == 3)
    assert field_type.currentData() == "1"                               # RF
    se.panel.edit_name.setText("CAV1")
    se.panel.edit_name.editingFinished.emit()
    assert "CAV1 : field 0.123 0.031" in text.toPlainText()
    assert se.document().elements()[0].name == "CAV1"
    text.undo()
    assert "CAV1" not in text.toPlainText() and "field 0.123 0.031" in text.toPlainText()
    assert page.is_dirty()
    assert se.beamline._items and se.beamline._items[0].token == "el_rf"
    page.save()
    assert not page.is_dirty()
    with open(os.path.join(project_dir, "InputFile", "lattice_mulp.txt"), encoding="utf-8") as fh:
        assert "field 0.123 0.031" in fh.read()

    # files page groups InputFile/ by content and opens scanData.txt as a table
    files = w.page_files
    assert sum(1 for _ in files._file_items()) > 5
    files._select_path(os.path.join(project_dir, "InputFile", "scanData.txt"))
    assert files._table is not None and files._table.table.rowCount() >= 1
    files._table.add_row()
    assert files.is_dirty()
    files.reload()
    assert not files.is_dirty()
    # real button clicks: clicked(bool) must not leak "checked" into @guarded slots
    errors_before = w.log_panel.counts()[0]
    files._table.add_row()
    files.btn_reload.click()
    assert not files.is_dirty()
    files._table.add_row()
    files.btn_save.click()
    assert not files.is_dirty()
    w.page_lattice.btn_apply.click()
    assert w.log_panel.counts()[0] == errors_before

    # beam.txt as a keyword table with meaning and units
    from avas.data import filekinds as fk
    files._select_path(os.path.join(project_dir, "InputFile", "beam.txt"))
    assert files._kind == fk.KIND_BEAM
    kt = files._table
    row = next(r for r in range(kt.table.rowCount()) if kt.table.item(r, 0).text() == "current")
    assert "mA" in kt.table.item(row, 1).text()
    kt.table.item(row, 2).setText("0.5")
    assert files.is_dirty() and "current 0.5" in files.current_text()
    files.reload()

    # binary data is shown with physics, not as bytes
    files._select_path(os.path.join(project_dir, "InputFile", "part_rfq.dst"))
    assert files._kind == fk.KIND_PARTICLES and files.info_view is not None
    assert files.info_view._data["number"] > 1 and not files.btn_save.isVisible()
    files._select_path(os.path.join(project_dir, "InputFile", "sol.bsz"))
    assert files._kind == fk.KIND_FIELDMAP and files.info_view._fm.nz == 200

    # another lattice file can be chosen for the run; the Settings page keeps that choice
    from avas import paths
    inp = os.path.join(project_dir, "InputFile")
    with open(os.path.join(inp, "lattice_alt.txt"), "w", encoding="utf-8") as fh:
        fh.write("start\ndrift 0.05 0.02 0\nfield 0.21 0.02 0 1 162.5e6 -33 1.36 -1.36 efield\nend\n")
    files.refresh()
    files._select_path(os.path.join(inp, "lattice_alt.txt"))
    assert files._kind == fk.KIND_LATTICE and files.btn_action.isVisibleTo(files)
    files.btn_action.click()
    assert w.project.lattice_name() == "lattice_alt.txt"
    assert paths.lattice_source_name(inp) == "lattice_alt.txt"
    assert w.page_lattice._loaded_name == "lattice_alt.txt"
    assert len(w.page_lattice.structure.document().elements()) == 2
    w.page_settings.save()
    assert paths.lattice_source_name(inp) == "lattice_alt.txt"
    w.page_lattice.switch_to("lattice_mulp.txt")
    assert paths.lattice_source_name(inp) == "lattice_mulp.txt"
    assert w.page_lattice.combo.currentData() == "lattice_mulp.txt"

    # collapsible / resizable chrome and live UI scale
    w.sidebar.set_collapsed(True)
    assert w.sidebar.width() < 100 and w.act_sidebar.isChecked()
    w.sidebar.set_collapsed(False)
    assert w.sidebar.width() >= 150
    w.hsplit.moveSplitter(320, 1)
    assert abs(w.sidebar.width() - 320) <= 2 and not w.sidebar.is_collapsed()
    w.hsplit.moveSplitter(60, 1)              # dragged below the snap width: icon strip
    assert w.sidebar.is_collapsed() and w.sidebar.width() < 100
    w.act_sidebar.setChecked(False)
    assert abs(w.sidebar.width() - 320) <= 2  # the last dragged width comes back
    w.log_panel.visibility_requested.emit(False)
    assert w.log_panel.isHidden() and not w.act_log.isChecked()
    w.status.problems_clicked.emit()
    assert not w.log_panel.isHidden()
    w._set_panel_maximized(True)
    assert w.log_panel.height() > w.stack.height()
    w._set_panel_maximized(False)
    w.set_ui_scale(125)
    assert app.font().pointSizeF() > 11
    w.set_ui_scale(100)

    # light / dark theme switch is live; saved figures are always light
    from avas.gui import theme
    import matplotlib
    w.set_theme("dark")
    assert theme.is_dark() and matplotlib.rcParams["axes.facecolor"] != "#ffffff"
    assert w.page_results.plots.widget(0).fig.get_facecolor()[0] < 0.5
    png = os.path.join(WORK, "dark_export.png")
    w.page_results.plots.widget(0).fig.savefig(png)
    from matplotlib.image import imread
    assert imread(png)[2, 2, :3].min() > 0.95      # corner pixel is white
    assert w.page_results.plots.widget(0).fig.get_facecolor()[0] < 0.5   # restored on screen
    w.set_theme("light")
    assert not theme.is_dark()

    # a 1-particle beam is refused before the engine starts
    w.page_beam.edit_number.setText("1")
    assert any("2 particles" in e for e in w.page_beam.validate())
    w.page_beam.edit_number.setText("5260")

    # live language switch rebuilds the window
    w.set_language("zh_CN")
    w2 = app._avas_main_window
    assert w2 is not w and w2.project.path == project_dir
    w2.set_language("en")
    app._avas_main_window._silent_close = True
    app._avas_main_window.close()
