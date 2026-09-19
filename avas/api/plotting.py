# -- coding: utf-8 --
"""Plot helpers used by ``avas plot`` (DataSet curves, cavity voltage / phase, phase space).

Moved out of :mod:`avas.api.basic` so that the run entry points do not import
matplotlib.  ``platform="qt"`` returns the matplotlib figure, ``platform="web"``
saves a picture and returns the legacy ``format_output`` dictionary.
"""
import os

from avas.paths import lattice_source_path, resolve_io_dirs
from avas.post.plot.plotdataset import PlotDataSet
from avas.post.plot.plotphase2 import PlotPhase2
from avas.post.plot.plotpicture import PlotCavitySynPhase, PlotCavityVoltage, PlotPhaseAdvance
from avas.utils.tool import format_output, generate_web_picture_param, generate_web_picture_path


# 画dataset中的数据
def plot_dataset(**item):
    """
    :param project_path:
    :param picture_name:
    :param show_:
    :return:
    dataset文件中数据的可视化
    """
    default_item = {"projectPath": None, "pictureType": None, "show_": 0, "fig": None, "platform": "qt",
                    "sampleInterval": 1,
                    "needData": False,
                    # optional explicit directories (CLI); override projectPath
                    "inputDir": None, "outputDir": None, "savePath": None,
                    }

    default_item.update(item)

    project_path = default_item.get("projectPath")
    picture_type = default_item.get("pictureType")
    show_ = default_item.get("show_")
    fig = default_item.get("fig")
    platform = default_item.get("platform")
    sample_interval = default_item.get("sampleInterval")
    need_data = default_item.get("needData")

    input_dir, output_dir = resolve_io_dirs(project_path, default_item.get("inputDir"), default_item.get("outputDir"))
    dataset_path = os.path.join(output_dir, "DataSet.txt")
    v = PlotDataSet(dataset_path, picture_type, sample_interval, input_dir=input_dir)
    v.get_x_y()

    if platform == "qt":
        output = v.run(show_, fig, default_item.get("savePath"))

    elif platform == "web":
        # 生成文件名
        save_path = generate_web_picture_path(project_path)
        v.run(show_, fig, save_path)

        # 生成返回信息
        picture_param = {"picturePath": save_path, "pictureInfo": {}}

        if need_data is True:
            data = generate_web_picture_param(v)
            picture_param["pictureInfo"] = data

        output = format_output(**picture_param)

    return output


# 第二种相图画法
def plot_dst(item):
    default_item = {"dst_path": None, "picture_type": [["x", "x1"]], "show_": 0, "fig": None, "platform": "qt",
                    "sampleInterval": 1, "needData": False, "projectPath": None, "location": "out",
                    "dst_dict": None, "twiss_dict": None,
                    }

    default_item.update(item)

    platform = default_item.get("platform")
    project_path = default_item.get("projectPath")
    fig = default_item.get("fig")
    location = default_item.get("location")
    show_ = default_item.get("show_")
    dst_dict = default_item.get("dst_dict")
    twiss_dict = default_item.get("twiss_dict")
    picture_type = default_item.get("picture_type")

    if platform == "qt":
        dst_path = default_item.get("dst_path")
    elif platform == "web":
        if location == "out":
            dst_path = os.path.join(project_path, "OutputFile", default_item.get("dst_path"))
        elif location == "in":
            dst_path = os.path.join(project_path, "InputFile", default_item.get("dst_path"))

    v = PlotPhase2()

    item = {
        "show_": show_,
        "fig": fig,
        "save_path": None,
        "picture_type": picture_type,
        "dst_path": dst_path,
        "dst_dict": dst_dict,
        "twiss_dict": twiss_dict,
    }

    if platform == "qt":
        output = v.run(item)
    elif platform == "web":
        try:
            save_path = generate_web_picture_path(project_path)
            item["save_path"] = save_path
            v.run(item)

            picture_param = {"picturePath": save_path}
            output = format_output(**picture_param)
        except Exception as e:
            code = -1
            msg = str(e)
            picture_param = {"picturePath": ""}
            output = format_output(code, msg=msg, **picture_param)
    return output


def plot_cavity_voltage(project_path, ratio, show_=1, fig=None, platform="qt", input_dir=None):
    """
    :param project_path:
    :param ratio: {} 场名：比例
    :param show_:
    :param input_dir: explicit input directory (overrides project_path/InputFile)
    :return:
    腔压图
    """
    input_dir, _ = resolve_io_dirs(project_path, input_dir, None)
    lattice_mulp_path = lattice_source_path(input_dir)
    v = PlotCavityVoltage(lattice_mulp_path, ratio)
    v.get_x_y()
    res = v.run(show_, fig)
    return res


def plot_cavity_syn_phase(**item):
    """
    :param project_path:
    :param show_:
    :return:
    腔体同步相位图
    """
    default_item = {"projectPath": None, "show_": 0, "fig": None, "platform": "qt", "needData": False,
                    "inputDir": None, "savePath": None}
    default_item.update(item)

    project_path = default_item.get("projectPath")
    show_ = default_item.get("show_")
    fig = default_item.get("fig")
    platform = default_item.get("platform")
    need_data = default_item.get("needData")

    input_dir, _ = resolve_io_dirs(project_path, default_item.get("inputDir"), None)
    lattice_mulp_path = lattice_source_path(input_dir)
    v = PlotCavitySynPhase(lattice_mulp_path)
    v.get_x_y()

    if platform == "qt":
        output = v.run(show_, fig, default_item.get("savePath"))

    elif platform == "web":
        # 生成文件名
        save_path = generate_web_picture_path(project_path)
        v.run(show_, fig, save_path)

        # 生成返回信息
        picture_param = {"picturePath": save_path, "pictureInfo": {}}

        if need_data is True:
            data = generate_web_picture_param(v)
            picture_param["pictureInfo"] = data

        output = format_output(**picture_param)

    return output


def plot_phase_advance(**item):
    """
    :param project_path:
    :param out_type:
    :param show_:
    :return:
    相移图
    """
    default_item = {"projectPath": None, "pictureType": "period", "show_": 0, "fig": None,
                    "platform": "qt", "needData": False,
                    "inputDir": None, "outputDir": None, "savePath": None}
    default_item.update(item)

    project_path = default_item.get("projectPath")
    picture_type = default_item.get("pictureType")
    show_ = default_item.get("show_")
    fig = default_item.get("fig")
    platform = default_item.get("platform")
    need_data = default_item.get("needData")
    v = PlotPhaseAdvance(project_path, picture_type,
                         input_dir=default_item.get("inputDir"), output_dir=default_item.get("outputDir"))
    v.get_x_y()

    if platform == "qt":
        output = v.run(show_, fig, default_item.get("savePath"))
    elif platform == "web":
        # 生成文件名
        save_path = generate_web_picture_path(project_path)
        v.run(show_, fig, save_path)

        # 生成返回信息
        picture_param = {"picturePath": save_path, "pictureInfo": {}}

        if need_data is True:
            data = generate_web_picture_param(v)
            picture_param["pictureInfo"] = data

        output = format_output(**picture_param)
    return output
