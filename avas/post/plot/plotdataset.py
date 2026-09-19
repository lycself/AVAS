"""Curves along z from DataSet.txt (envelopes, emittances, energy ...).

The plot types are declared in :mod:`avas.post.plot.dataset_plots`; this class
turns one of them into x / y lists and draws them with :class:`PicturePlot_2D`.
"""
import os

import matplotlib

from avas.data.datasetparameter import DatasetParameter
from avas.data.latticeparameter import LatticeParameter
from avas.paths import lattice_source_path
from avas.post.plot.dataset_plots import DATASET_PLOTS, MISSING_CURVE, dataset_curves
from avas.post.plot.initialplot import CompoundShape, PicturePlot_2D
from avas.utils.tool import get_list_interval


class PlotDataSet(PicturePlot_2D):
    """
    dataset文件的可视化
    """
    def __init__(self, dataset_path, picture_name, sample_interval=1, project_path=None, input_dir=None):
        super().__init__()
        self.picture_name = picture_name
        self.sample_interval = sample_interval
        self.BaseMassInMeV = 0
        self.freq = 0

        self.project_path = project_path or None
        self.dataset_path = dataset_path
        self.input_dir = input_dir or (os.path.join(self.project_path, "InputFile") if self.project_path else None)
        if self.input_dir:
            self.lattice_mulp_path = lattice_source_path(self.input_dir)

    def get_x_y(self):
        spec = DATASET_PLOTS.get(self.picture_name)
        if spec is None:
            raise ValueError(f"unknown DataSet plot type '{self.picture_name}' "
                             f"(expected one of {', '.join(DATASET_PLOTS)})")

        dataset_obj = DatasetParameter(self.dataset_path, self.project_path, input_dir=self.input_dir)
        dataset_obj.get_parameter()
        curves = dataset_curves(dataset_obj)

        for key in spec.y:
            if curves.get(key) is None:
                raise ValueError(MISSING_CURVE.get(self.picture_name, f"DataSet.txt has no '{key}' data"))

        self.x = curves["z"]
        self.y = [curves[key] for key in spec.y]
        self.xlabel = spec.xlabel
        self.ylabel = spec.ylabel(curves) if callable(spec.ylabel) else spec.ylabel
        if spec.labels is not None:
            self.labels = list(spec.labels)
        if spec.colors is not None:
            self.colors = list(spec.colors)
        self.set_legend = spec.set_legend
        if spec.ylim is not None:
            self.ylim = spec.ylim(curves) if callable(spec.ylim) else list(spec.ylim)

        # 根据sample_interval
        self.x = get_list_interval(self.x, self.sample_interval)
        self.y = get_list_interval(self.y, self.sample_interval)

        # 判断是否需要对y再嵌套一层
        if not isinstance(self.y[0], list):
            self.y = [self.y]
        if not isinstance(self.x[0], list):
            self.x = [self.x]

        if len(self.x) != len(self.y):
            self.x = self.x * len(self.y)

        return self.x, self.y

    def need_element(self, aper=1):

        obj_compound = CompoundShape()
        patch_list = []

        # 获取lattice参数
        lattice_res = LatticeParameter(self.lattice_mulp_path)
        lattice_res.get_parameter()
        aperture = [i * 1000 for i in lattice_res.aperture]

        for i in range(len(lattice_res.v_name)):

            height = aperture[i] * 2

            element = ''
            if lattice_res.v_name[i] == "field" and lattice_res.phi_syn[i]:
                element = "cav"
            elif lattice_res.v_name[i] == "field" and not lattice_res.phi_syn[i]:
                element = "sol"

            if element:
                square_origin = [lattice_res.v_start[i], -0.5 * height]
                patch_list.append(obj_compound.create_shapes(square_origin, lattice_res.v_len[i], height, element))

        self.labels = self.labels + [None, None]
        edge = matplotlib.rcParams["axes.edgecolor"]
        self.colors += [edge, edge]

        self.patch_list = patch_list

        if aper == 0:
            self.x = self.x[:-2]

            self.y = self.y[:-2]
            self.labels = self.labels[:-2]
            self.colors = self.colors[:-2]
