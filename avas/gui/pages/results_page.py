"""Results page: a tree of available analyses on the left, embedded plots on the right."""
import logging
import multiprocessing
import os

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (QComboBox, QFileDialog, QFormLayout, QGroupBox, QHBoxLayout, QLabel, QLineEdit,
                             QPushButton, QSplitter, QTreeWidget, QTreeWidgetItem, QVBoxLayout, QWidget)

from avas.api import basic as api
from avas.gui.widgets.common import PathPicker, RadioGroup, guarded, int_edit, page_header
from avas.gui.widgets.plot_area import PlotArea
from avas.utils.readfile import read_lattice_mulp_with_name

log = logging.getLogger("avas.gui")

ENVELOPE_TYPES = ["rms_x", "rms_y", "rms_xy", "max_x", "max_y", "max_xy", "c_x", "c_y", "c_xy", "phi",
                  "beta_x", "beta_y", "beta_z", "beta_xyz", "alpha_x"]
EMITTANCE_TYPES = ["emittance_x", "emittance_y", "emittance_z"]
ERROR_OUT_TYPES = [("xy", "X & Y"), ("x1y1", "X' & Y'"), ("rms_xy", "rms(X) & rms(Y)"),
                   ("rms_x1y1", "rms(X') & rms(Y')"), ("ek", "Energy change")]
DENSITY_TYPES = [("density", "Density"), ("density_level", "Density level"), ("centroid", "Centroid"),
                 ("emit", "Emittance"), ("rms_size", "Rms size"), ("rms_size_max", "Rms size max")]
ACC_PLANES = [(0, "x-x'"), (1, "y-y'"), (2, "z-z'"), (3, "φ-E")]


def _combo(items, current=None):
    c = QComboBox()
    for it in items:
        if isinstance(it, tuple):
            c.addItem(it[1], it[0])
        else:
            c.addItem(it, it)
    if current is not None:
        idx = c.findData(current)
        if idx >= 0:
            c.setCurrentIndex(idx)
    return c


def _options_row(label, widget):
    row = QWidget()
    lay = QHBoxLayout(row)
    lay.setContentsMargins(0, 0, 0, 0)
    lay.setSpacing(8)
    lab = QLabel(label)
    lab.setObjectName("muted")
    lay.addWidget(lab)
    lay.addWidget(widget)
    lay.addStretch(1)
    return row


class ResultsPage(QWidget):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        self.project = project
        self._change_num_process = None
        self._dialogs = []
        self._build()

    # ------------------------------------------------------------------ ui
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(10)
        root.addWidget(page_header(self.tr("Results"),
                                   self.tr("Plots are drawn from OutputFile/ of the current project. "
                                           "Open several tabs and use Refresh after a new run.")))
        split = QSplitter(Qt.Horizontal)
        self.tree = QTreeWidget()
        self.tree.setHeaderHidden(True)
        self.tree.setMinimumWidth(220)
        self.tree.setMaximumWidth(320)
        self.tree.itemActivated.connect(self._activate)
        self.tree.itemClicked.connect(self._activate)
        self._fill_tree()
        split.addWidget(self.tree)
        self.plots = PlotArea()
        split.addWidget(self.plots)
        split.setStretchFactor(0, 0)
        split.setStretchFactor(1, 1)
        root.addWidget(split, 1)

    def _fill_tree(self):
        def group(title, items):
            g = QTreeWidgetItem([title])
            g.setFlags(g.flags() & ~Qt.ItemIsSelectable)
            for key, label in items:
                it = QTreeWidgetItem([label])
                it.setData(0, Qt.UserRole, key)
                g.addChild(it)
            self.tree.addTopLevelItem(g)
            g.setExpanded(True)

        group(self.tr("Beam along the lattice"), [
            ("envelope", self.tr("Envelope / centroid / beta")),
            ("emittance", self.tr("Emittance")),
            ("loss", self.tr("Particle loss")),
            ("energy", self.tr("Energy")),
            ("phase_advance", self.tr("Phase advance")),
            ("syn_phase", self.tr("Synchronous phase")),
            ("cavity_voltage", self.tr("Cavity voltage")),
        ])
        group(self.tr("Phase space"), [
            ("dst_viewer", self.tr("Particle file viewer (.dst)")),
            ("plt_viewer", self.tr("Step viewer (.plt)")),
        ])
        group(self.tr("Error study"), [
            ("err_emit_loss", self.tr("Emittance growth and loss")),
            ("err_out", self.tr("Output parameters")),
            ("err_density", self.tr("Density")),
        ])
        group(self.tr("Tools"), [
            ("acceptance", self.tr("Acceptance")),
            ("expand", self.tr("Expand particle number")),
            ("plt2dst", self.tr("Convert plt step to dst")),
        ])

    # ------------------------------------------------------------------ dispatch
    @guarded
    def _activate(self, item, _col=0):
        key = item.data(0, Qt.UserRole)
        if not key:
            return
        if not self.project.is_open:
            raise ValueError(self.tr("Open a project first."))
        handler = getattr(self, f"open_{key}")
        handler()

    def refresh_all(self):
        self.plots.refresh_all()

    def _dataset_plot(self, title, types, default):
        combo = _combo(types, default)
        opts = _options_row(self.tr("Quantity"), combo)

        def draw(fig):
            api.plot_dataset(projectPath=self.project.path, pictureType=combo.currentData(), show_=0, fig=fig,
                             platform="qt", sampleInterval=1)
        tab = self.plots.add_plot(title, draw, opts)
        combo.currentIndexChanged.connect(tab.refresh)

    # ------------------------------------------------------------------ beam along lattice
    def open_envelope(self):
        self._dataset_plot(self.tr("Envelope"), ENVELOPE_TYPES, "rms_x")

    def open_emittance(self):
        self._dataset_plot(self.tr("Emittance"), EMITTANCE_TYPES, "emittance_x")

    def open_loss(self):
        self._dataset_plot(self.tr("Loss"), ["loss"], "loss")

    def open_energy(self):
        self._dataset_plot(self.tr("Energy"), ["energy"], "energy")

    def open_phase_advance(self):
        combo = _combo([("period", self.tr("per period")), ("meter", self.tr("per meter"))], "period")
        opts = _options_row(self.tr("Unit"), combo)

        def draw(fig):
            api.plot_phase_advance(projectPath=self.project.path, pictureType=combo.currentData(), show_=0, fig=fig)
        tab = self.plots.add_plot(self.tr("Phase advance"), draw, opts)
        combo.currentIndexChanged.connect(tab.refresh)

    def open_syn_phase(self):
        def draw(fig):
            api.plot_cavity_syn_phase(projectPath=self.project.path, show_=0, fig=fig)
        self.plots.add_plot(self.tr("Synchronous phase"), draw)

    def open_cavity_voltage(self):
        lattice = self.project.lattice_path()
        info, _ = read_lattice_mulp_with_name(lattice)
        fields = [row[9] for row in info if row and row[0] == "field" and float(row[4]) == 1]
        if not fields:
            raise ValueError(self.tr("No field elements in the lattice."))
        opts = QWidget()
        lay = QHBoxLayout(opts)
        lay.setContentsMargins(0, 0, 0, 0)
        lab = QLabel(self.tr("Voltage ratio per field"))
        lab.setObjectName("muted")
        lay.addWidget(lab)
        edits = {}
        for name in dict.fromkeys(fields):
            e = QLineEdit("1")
            e.setMaximumWidth(60)
            edits[name] = e
            lay.addWidget(QLabel(name))
            lay.addWidget(e)
        lay.addStretch(1)

        def draw(fig):
            ratio = {k: float(e.text() or 1) for k, e in edits.items()}
            api.plot_cavity_voltage(self.project.path, ratio, show_=0, fig=fig)
        self.plots.add_plot(self.tr("Cavity voltage"), draw, opts)

    # ------------------------------------------------------------------ phase space
    def open_dst_viewer(self):
        from avas.gui.dialogs.dstdialog import DstPlotDialog
        panel = QWidget()
        form = QFormLayout(panel)
        combo = QComboBox()
        for name in self.project.output_files(".dst"):
            combo.addItem(self.tr("OutputFile / %s") % name, self.project.output_file(name))
        for name in sorted(os.listdir(self.project.input_dir)):
            if name.lower().endswith(".dst"):
                combo.addItem(self.tr("InputFile / %s") % name, self.project.input_file(name))
        picker = PathPicker(mode="file", caption=self.tr("Select particle file"), name_filter="DST (*.dst)")
        picker.start_dir = self.project.output_dir
        form.addRow(self.tr("Project file"), combo)
        form.addRow(self.tr("Other file"), picker)
        btn = QPushButton(self.tr("Open viewer"))
        btn.setObjectName("primary")
        form.addRow("", btn)
        hint = QLabel(self.tr("The viewer shows x-x', y-y', φ-W and z-z' planes and computes emittances."))
        hint.setObjectName("muted")
        form.addRow("", hint)

        @guarded
        def open_(_self=self):
            path = picker.text() or combo.currentData()
            if not path or not os.path.isfile(path):
                raise ValueError(_self.tr("Select a .dst file."))
            dlg = DstPlotDialog(path)
            dlg.plot_image()
            dlg.show()
            _self._dialogs.append(dlg)
        btn.clicked.connect(lambda: open_())
        self.plots.add_widget(self.tr("Particle viewer"), panel)

    def open_plt_viewer(self):
        from avas.gui.dialogs.pltdialog import PltPlotDialog
        from avas.post.analysis.treatplt import TreatPlt
        panel = QWidget()
        form = QFormLayout(panel)
        picker = PathPicker(mode="file", caption=self.tr("Select plt file"), name_filter="PLT (*.plt)")
        picker.start_dir = self.project.output_dir
        default = self.project.output_file("BeamSet.plt")
        if os.path.isfile(default):
            picker.setText(default)
        form.addRow(self.tr("plt file"), picker)
        lbl_steps = QLabel("-")
        form.addRow(self.tr("Steps in file"), lbl_steps)
        step = int_edit("0", 100)
        form.addRow(self.tr("Step"), step)
        lbl_z = QLabel("-")
        form.addRow(self.tr("Position (m)"), lbl_z)
        btn = QPushButton(self.tr("Open viewer"))
        btn.setObjectName("primary")
        form.addRow("", btn)

        def info():
            if not picker.text():
                return None
            obj = TreatPlt({"project_path": self.project.path, "plt_path": picker.text()})
            n = obj.get_dataset_plt_base_info()
            lbl_steps.setText(str(n))
            return obj

        @guarded
        def on_step(_self=self):
            obj = info()
            if obj is None:
                return
            i = int(step.text() or 0)
            zs = obj.dataset_z_list
            lbl_z.setText(str(zs[i]) if 0 <= i < len(zs) else "-")

        @guarded
        def open_(_self=self):
            if not picker.text():
                raise ValueError(_self.tr("Select a .plt file."))
            dlg = PltPlotDialog({"plt_path": picker.text(), "project_path": _self.project.path,
                                 "num": int(step.text() or 0)})
            dlg.plot_image()
            dlg.show()
            _self._dialogs.append(dlg)
        picker.changed.connect(lambda _t: on_step())
        step.editingFinished.connect(lambda: on_step())
        btn.clicked.connect(lambda: open_())
        on_step()
        self.plots.add_widget(self.tr("Step viewer"), panel)

    # ------------------------------------------------------------------ error study
    def _error_file_picker(self, caption):
        picker = PathPicker(mode="file", caption=caption)
        picker.start_dir = self.project.output_dir
        return picker

    def open_err_emit_loss(self):
        picker = self._error_file_picker(self.tr("Select errors_par file"))
        opts = _options_row(self.tr("File"), picker)
        picker.setMinimumWidth(320)

        def draw(fig):
            if not picker.text():
                raise ValueError(self.tr("Choose an error-study result file (OutputFile/errors_par*.txt)."))
            api.plot_error_emit_loss(filePath=picker.text(), pictureType="par", show_=0, fig=fig)
        tab = self.plots.add_plot(self.tr("Emittance growth and loss"), draw, opts)
        picker.changed.connect(lambda _t: tab.refresh())

    def open_err_out(self):
        picker = self._error_file_picker(self.tr("Select error output file"))
        picker.setMinimumWidth(260)
        stat = _combo([("average", self.tr("average")), ("rms", self.tr("rms"))], "average")
        kind = _combo(ERROR_OUT_TYPES, "xy")
        opts = QWidget()
        lay = QHBoxLayout(opts)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(picker, 1)
        lay.addWidget(_options_row(self.tr("Statistic"), stat))
        lay.addWidget(_options_row(self.tr("Quantity"), kind))

        def draw(fig):
            if not picker.text():
                raise ValueError(self.tr("Choose an error-study result file."))
            api.plot_error_out(filePath=picker.text(), statMethod=stat.currentData(),
                               pictureType=kind.currentData(), show_=0, fig=fig)
        tab = self.plots.add_plot(self.tr("Error output"), draw, opts)
        picker.changed.connect(lambda _t: tab.refresh())
        stat.currentIndexChanged.connect(tab.refresh)
        kind.currentIndexChanged.connect(tab.refresh)

    def open_err_density(self):
        picker = self._error_file_picker(self.tr("Select density file"))
        picker.setMinimumWidth(260)
        plane = _combo([("x", "x"), ("y", "y"), ("r", "r"), ("z", "z")], "x")
        kind = _combo([(k, self.tr(l)) for k, l in DENSITY_TYPES], "density")
        opts = QWidget()
        lay = QHBoxLayout(opts)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(picker, 1)
        lay.addWidget(_options_row(self.tr("Plane"), plane))
        lay.addWidget(_options_row(self.tr("Plot"), kind))

        def draw(fig):
            if not picker.text():
                raise ValueError(self.tr("Choose a density file (OutputFile/density_*.dat)."))
            item = {"filePath": picker.text(), "desnityPlane": plane.currentData(), "sampleInterval": 1,
                    "show_": 0, "fig": fig}
            k = kind.currentData()
            if k == "density":
                api.plot_density(**item)
            elif k == "density_level":
                api.plot_density_level(**item)
            else:
                api.plot_density_process(pictureType=k, **item)
        tab = self.plots.add_plot(self.tr("Density"), draw, opts)
        picker.changed.connect(lambda _t: tab.refresh())
        plane.currentIndexChanged.connect(tab.refresh)
        kind.currentIndexChanged.connect(tab.refresh)

    # ------------------------------------------------------------------ tools
    def _require_plt_steps(self):
        """BeamSet.plt only has particle dumps when 'Output every N steps (plt)' > 0."""
        from avas.post.analysis.plttodstfile import Plttozcode
        plt_path = self.project.output_file("BeamSet.plt")
        steps = Plttozcode(plt_path).get_all_step() - 1 if os.path.isfile(plt_path) else 0
        if steps <= 0:
            raise ValueError(self.tr("BeamSet.plt contains no particle dumps. Set 'Output every N steps (plt)' "
                                     "to a value > 0 on the Settings page and run the simulation again."))
        return steps

    def open_acceptance(self):
        from avas.post.plot.plotacc import PlotAcc
        panel = QWidget()
        lay = QVBoxLayout(panel)
        lay.setContentsMargins(0, 0, 0, 0)
        rg = RadioGroup(ACC_PLANES)
        lay.addWidget(_options_row(self.tr("Plane"), rg))
        res_box = QGroupBox(self.tr("Result"))
        rform = QFormLayout(res_box)
        lbl_emit, lbl_norm, lbl_min1, lbl_min2 = QLabel("-"), QLabel("-"), QLabel("-"), QLabel("-")
        rform.addRow(self.tr("Acceptance (π mm mrad)"), lbl_emit)
        rform.addRow(self.tr("Normalised"), lbl_norm)
        rform.addRow(self.tr("Min. position"), lbl_min1)
        rform.addRow(self.tr("Min. angle"), lbl_min2)
        lay.addWidget(res_box)

        def draw(fig):
            self._require_plt_steps()
            obj = PlotAcc(self.project.path)
            loss_min_emit, norm_emit, x_min, xx_min = obj.cal_accptance(rg.value())
            lbl_emit.setText(f"{loss_min_emit:.5g}")
            lbl_norm.setText("-" if norm_emit is None else f"{norm_emit:.5g}")
            lbl_min1.setText(f"{x_min:.5g}")
            lbl_min2.setText(f"{xx_min:.5g}")
            obj.plot(fig, obj.t_alpha, obj.t_beta, obj.t_gamma, loss_min_emit, obj.loss_particles, rg.value())
        tab = self.plots.add_plot(self.tr("Acceptance"), draw, panel)
        rg.changed.connect(lambda _v: tab.refresh())

    def open_expand(self):
        panel = QWidget()
        form = QFormLayout(panel)
        picker = PathPicker(mode="file", caption=self.tr("Select particle file"), name_filter="DST (*.dst)")
        picker.start_dir = self.project.output_dir
        form.addRow(self.tr("Input .dst"), picker)
        ratio = int_edit("10", 100)
        form.addRow(self.tr("Multiply particle number by"), ratio)
        out = QLabel(self.project.output_file("change_num_result.dst"))
        out.setObjectName("muted")
        form.addRow(self.tr("Output"), out)
        btn = QPushButton(self.tr("Start"))
        btn.setObjectName("primary")
        stop = QPushButton(self.tr("Stop"))
        row = QHBoxLayout()
        row.addWidget(btn)
        row.addWidget(stop)
        row.addStretch(1)
        form.addRow("", row)

        @guarded
        def start(_self=self):
            if not picker.text():
                raise ValueError(_self.tr("Select a .dst file."))
            if _self._change_num_process is not None and _self._change_num_process.is_alive():
                raise ValueError(_self.tr("An expansion is already running."))
            _self._change_num_process = multiprocessing.Process(
                target=api.change_particle_number, args=(picker.text(), out.text(), int(ratio.text() or 1)))
            _self._change_num_process.start()
            log.info("expanding %s x%s -> %s", picker.text(), ratio.text(), out.text())

        def stop_(_self=self):
            p = _self._change_num_process
            if p is not None and p.is_alive():
                p.terminate()
                p.join()
                log.warning("particle expansion stopped")
        btn.clicked.connect(lambda: start())
        stop.clicked.connect(lambda: stop_())
        self.plots.add_widget(self.tr("Expand particles"), panel)

    def open_plt2dst(self):
        from avas.post.analysis.plttodstfile import Plttozcode
        panel = QWidget()
        form = QFormLayout(panel)
        plt_path = self.project.output_file("BeamSet.plt")
        lbl = QLabel(plt_path)
        lbl.setObjectName("muted")
        form.addRow(self.tr("plt file"), lbl)
        lbl_steps = QLabel("-")
        form.addRow(self.tr("Steps in file"), lbl_steps)
        step = int_edit("0", 100)
        form.addRow(self.tr("Step to export"), step)
        btn = QPushButton(self.tr("Write dst"))
        btn.setObjectName("primary")
        form.addRow("", btn)

        @guarded
        def count(_self=self):
            if os.path.isfile(plt_path):
                lbl_steps.setText(str(Plttozcode(plt_path).get_all_step() - 1))

        @guarded
        def run(_self=self):
            if not os.path.isfile(plt_path):
                raise ValueError(_self.tr("BeamSet.plt not found in OutputFile."))
            Plttozcode(plt_path).write_to_dst(int(step.text() or 0))
            log.info("step %s of %s written to dst", step.text(), plt_path)
        btn.clicked.connect(lambda: run())
        count()
        self.plots.add_widget(self.tr("plt to dst"), panel)
