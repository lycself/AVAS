# -- coding: utf-8 --
"""Simulation entry points used by ``avas run`` (the GUI runs simulations through the CLI).

Only the run functions live here; plot helpers are in :mod:`avas.api.plotting`.
The engine wrapper, post-processing and matplotlib are imported inside the
functions so that ``import avas.api.basic`` stays cheap.
"""
import logging
import os

from avas.paths import lattice_source_path, resolve_io_dirs

log = logging.getLogger(__name__)

STAGED_INPUTS_DIR = "inputs"        # <output_dir>/inputs/: text inputs + the generated lattice.txt


def stage_inputs(input_dir, output_dir):
    """Copy the text inputs of *input_dir* to ``<output_dir>/inputs`` and generate ``lattice.txt`` there.

    The engine runs on this copy, so the user's input folder is never rewritten.
    Field maps are not copied (the engine gets the original folder as field path).
    Returns the staged folder.
    """
    from avas.data.inputs import copy_text_inputs
    from avas.utils.tolattice import write_mulp_to_lattice_only_sim2

    staged = os.path.join(output_dir, STAGED_INPUTS_DIR)
    copy_text_inputs(input_dir, staged)
    write_mulp_to_lattice_only_sim2(lattice_source_path(input_dir), os.path.join(staged, "lattice.txt"))
    return staged


# 基础运行
def basic_mulp(**item):
    """
    :param project_path:
    :return:
    多粒子模拟
    """
    from avas.core.MultiParticle import MultiParticle
    from avas.sim.diaginfo import DiagInfo
    from avas.utils.inputconfig import InputConfig

    project_path = item.get('project_path')
    # explicit directories (CLI) or the classic <project>/InputFile|OutputFile layout (GUI)
    input_dir, output_dir = resolve_io_dirs(project_path, item.get("input_file"), item.get("output_file"))
    os.makedirs(output_dir, exist_ok=True)
    field_path = item.get("field_path") or input_dir

    staged_dir = stage_inputs(input_dir, output_dir)
    item = dict(item, input_file=staged_dir, output_file=output_dir, field_path=field_path)

    multiparticle_obj = MultiParticle(item)
    multiparticle_obj.run()

    # 生成束诊文件
    diag_item = {
        "project_path": project_path,
        "input_file": input_dir,
        "output_file": output_dir,
        "diag_file_path": os.path.join(output_dir, 'par_diag1.txt'),
    }
    obj = DiagInfo(diag_item)
    obj.write_diag_info_to_file()

    input_info = InputConfig()
    input_info = input_info.create_from_file({"otherPath": os.path.join(input_dir, "input.txt")})
    input_info = input_info["data"]["inputParams"]

    if input_info.get("pchistogram_start") == 1 and input_info.get("pchistogram_grid") > 0:
        from avas.post.analysis.extodensity import ExtoDensity

        # 生成密度文件
        exdata_path = os.path.join(output_dir, "PCHistogram.dat")
        dataset_path = os.path.join(output_dir, "DataSet.txt")
        target_density_path = os.path.join(output_dir, "density_par.dat")

        density_obj = ExtoDensity(exdata_path, dataset_path, target_density_path)
        density_obj.generate_density_file_onestep(1)

    log.info('simulation finished')
    return True


# 粒子数扩充
def change_particle_number(infile_path, outfile_path, ratio):
    """
    :param infile_path: 输入
    :param outfile_path: 输出
    :param ratio: 扩大的比例
    :return:
    扩充经粒子数
    """
    from avas.sim.changeNp import ChangeNp

    v = ChangeNp(infile_path, outfile_path, ratio)
    v.run()
    return None


_ERROR_DEFAULTS = {
    "project_path": None,
    "seed": 50,
    "if_normal": 1,
    "field_path": None,
    "if_generate_density_file": 1,
}


def _error_study(study_class, item):
    """Run an error study on a staged copy of the text inputs, exactly like :func:`basic_mulp`.

    The study rewrites ``lattice.txt`` for every seed; that happens in ``<output>/inputs``
    (the field maps are read from the original folder), so the user's input folder is never touched.
    """
    from avas.data.inputs import copy_text_inputs

    study = dict(_ERROR_DEFAULTS)
    study.update(item)
    input_dir, output_dir = resolve_io_dirs(study.get("project_path"), study.get("input_file"), study.get("output_file"))
    os.makedirs(output_dir, exist_ok=True)
    field_path = study.get("field_path") or input_dir
    staged = copy_text_inputs(input_dir, os.path.join(output_dir, STAGED_INPUTS_DIR))
    study.update(input_file=staged, output_file=output_dir, field_path=field_path)
    return study_class(study).run()


def err_dyn(**item):
    """Dynamic error study (the static error commands are left out)."""
    from avas.sim.error import ErrorDyn

    res = _error_study(ErrorDyn, item)
    log.info('dynamic error study finished')
    return res


def err_stat(**item):
    """Static error study; correctors are optimised when the lattice has matching adjust / diag commands."""
    from avas.sim.error import Errorstat

    _error_study(Errorstat, item)


def err_stat_dyn(**item):
    """Static and dynamic errors together."""
    from avas.sim.error import Errorstatdyn

    _error_study(Errorstatdyn, item)
    return None
