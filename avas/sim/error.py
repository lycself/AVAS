"""Error studies: static (``Errorstat``), dynamic (``ErrorDyn``) and combined (``Errorstatdyn``).

All three run the same schedule, :meth:`Error.run`:

1. ``get_group_time``: ``err_step`` (groups x runs) and the ``err_*_on`` switches from the run lattice.
2. The error-free reference run (``if_normal``) -> ``error_output/output_0_0`` and row 0 of ``errors_par.txt``.
3. For every group / time: ``prepare_step`` draws the errors (``generate_lattice_mulp_list``; the seeded RNG is
   consumed in lattice order, coupled commands first, then the uncoupled and beam commands) and, when the lattice has
   matching ``adjust`` / ``diag_*`` commands, optimises the correctors (:class:`avas.sim.err_adjust.Adjust_Error`);
   ``run_step`` writes the engine lattice (:meth:`Error.lattice_lines` is what differs between the modes) and runs
   the engine into ``error_middle/output_0``, which is then moved to ``error_output/output_<group>_<time>``;
   ``collect_step`` writes ``Error_Datas``, ``errors_par(_tot)``, ``Adjust_Datas`` and ``par_diag_datas``.

The class works inside the folder given as ``input_file`` (``lattice.txt`` is written there): ``avas run`` passes
the staged copy ``<output>/inputs`` (see :mod:`avas.api.basic`), so the user's InputFile is never touched.
"""
import copy
import logging
import os
import random

import avas.constants as global_varible
from avas.core.MultiParticle import MultiParticle
from avas.data.datasetparameter import DatasetParameter
from avas.data.latticeparameter import LatticeParameter
from avas.paths import lattice_source_path, resolve_io_dirs
from avas.post.analysis.extodensity import ExtoDensity, MergeDensityData
from avas.sim.diaginfo import DiagInfo
from avas.sim.err_adjust import Adjust_Error, apply_adjust_results, stat_to_dyn_lines, write_engine_lines
from avas.utils.exception import MissingcommandError
from avas.utils.readfile import read_lattice_mulp_with_name, read_txt
from avas.utils.tolattice import write_mulp_to_lattice_only_sim2
from avas.utils.tool import (add_element_end_index, add_to_txt, calculate_mean, calculate_rms,
                             delete_element_end_index, judge_command_on_element, write_to_txt)
from avas.utils.treat_directory import copy_directory, delete_directory, list_files_in_directory
from avas.utils.treatfile import copy_file

log = logging.getLogger(__name__)

# err_*_on switch lines -> attribute holding the flags (one per error column)
SWITCH_ATTRS = {
    "err_beam_stat_on": "err_beam_stat_on", "err_quad_stat_on": "err_quad_stat_on", "err_cav_stat_on": "err_cav_stat_on",
    "err_beam_dyn_on": "err_beam_dyn_on", "err_quad_dyn_on": "err_quad_dyn_on", "err_cav_dyn_on": "err_cav_dyn_on",
}
# error command -> (switch attribute, index of the first error column in the command)
COMMAND_SWITCH = {
    "err_quad_ncpl_stat": ("err_quad_stat_on", 3), "err_quad_cpl_stat": ("err_quad_stat_on", 3),
    "err_quad_ncpl_dyn": ("err_quad_dyn_on", 3), "err_quad_cpl_dyn": ("err_quad_dyn_on", 3),
    "err_cav_ncpl_stat": ("err_cav_stat_on", 3), "err_cav_cpl_stat": ("err_cav_stat_on", 3),
    "err_cav_ncpl_dyn": ("err_cav_dyn_on", 3), "err_cav_cpl_dyn": ("err_cav_dyn_on", 3),
    "err_beam_stat": ("err_beam_stat_on", 2), "err_beam_dyn": ("err_beam_dyn_on", 2),
}
CPL_TO_NCPL = {"err_cav_cpl_dyn": "err_cav_ncpl_dyn", "err_cav_cpl_stat": "err_cav_ncpl_stat",
               "err_quad_cpl_dyn": "err_quad_ncpl_dyn", "err_quad_cpl_stat": "err_quad_ncpl_stat"}
# families of one element error: stat and dyn of the same element may not both be attached to it
ERROR_FAMILIES = [["err_quad_ncpl_stat", "err_quad_cpl_stat"], ["err_quad_ncpl_dyn", "err_quad_cpl_dyn"],
                  ["err_cav_ncpl_stat", "err_cav_cpl_stat"], ["err_cav_ncpl_dyn", "err_cav_cpl_dyn"]]

ERRORS_PAR_TOT_TITLE = [
    "step_err",                                                              # group_time
    "ratio_loss",                                                            # lost / total macro-particles
    "emit_x_increase", "emit_y_increase", "emit_z_increase",                 # eps/eps0 - 1
    "x_center(m)", "y_center(m)", "x_'(rad)", "y_'(rad)",                    # 5..8
    "rms_x(m)", "rms_y(m)", "rms_x'(rad)", "rms_y'(rad)",                    # 9..12
    "delat_energy(MeV)",                                                     # 13, relative to the reference run
    "alpha_xx'", "beta_xx'", "alpha_yy'", "beta_yy'", "alpha_zz'", "beta_zz'",
]
ERRORS_PAR_TITLE = (
    ["step_err"]
    + [f"ave({c})" for c in ERRORS_PAR_TOT_TITLE[1:13]] + ["ave(delat_energy)"]        # 1..13 means
    + [f"rms({c})" for c in ERRORS_PAR_TOT_TITLE[5:13]] + ["rms(delat_energy(MeV))"]   # 14..22 spreads
)
FAILED_ROW_LENGTH = 14              # a lost beam is reported as ratio_loss 1 and zeros
SUMMARY_LENGTH = 23


class Error():
    """One error study; see the module docstring.  Subclasses set the hooks below."""

    SWITCHES = tuple(SWITCH_ATTRS)                       # switch attributes that must not all be zero
    MISSING_SWITCH_MESSAGE = "Missing error on command"
    SUPPORTS_ADJUST = True                               # static errors can be corrected with adjust / diag commands

    def __init__(self, item):
        self.item = item
        self.project_path = item.get("project_path")
        self.if_normal = item.get("if_normal")
        self.field_path = item.get("field_path")
        self.if_generate_density_file = item.get("if_generate_density_file")
        self.restart = item.get("restart", 0)
        self.device = item.get("device")

        # own generator: the same seed gives the same error sequence, independent of other random users
        self.rng = random.Random(item.get("seed"))

        # input / output directories may be given explicitly (CLI) or derived
        # from the classic <project>/InputFile, <project>/OutputFile layout (GUI)
        self.input_path, self.output_path = resolve_io_dirs(
            self.project_path, item.get("input_file"), item.get("output_file"))
        os.makedirs(self.output_path, exist_ok=True)

        self.lattice_mulp_path = lattice_source_path(self.input_path)
        self.lattice_path = os.path.join(self.input_path, 'lattice.txt')

        self.error_middle_path = os.path.join(self.output_path, 'error_middle')
        self.error_middle_output0_path = os.path.join(self.output_path, 'error_middle', 'output_0')
        self.error_output_path = os.path.join(self.output_path, 'error_output')
        self.normal_out_path = os.path.join(self.error_output_path, 'output_0_0')
        self.err_adjust_path = os.path.join(self.output_path, "error_adjust")

        self.errors_par_tot_path = os.path.join(self.output_path, "errors_par_tot.txt")
        self.errors_par_path = os.path.join(self.output_path, "errors_par.txt")

        self.all_group = 1
        self.all_time = 1
        self.err_step_command = []
        self.err_beam_stat_on = [0] * 13
        self.err_quad_stat_on = [0] * 7
        self.err_cav_stat_on = [0] * 7
        self.err_beam_dyn_on = [0] * 13
        self.err_quad_dyn_on = [0] * 7
        self.err_cav_dyn_on = [0] * 7
        self.opti = 0
        self.decimal = 5  # decimals kept for drawn errors

        if self.restart == 0:
            for path in (self.error_middle_path, self.error_output_path, self.err_adjust_path):
                if os.path.exists(path):
                    delete_directory(path)
                os.makedirs(path)

        v = LatticeParameter(self.lattice_mulp_path)
        v.get_parameter()
        self.lattice_total_length = v.total_length

    # ------------------------------------------------------------------ lattice: groups, switches, error drawing
    def get_group_time(self):
        """Read ``err_step`` and the ``err_*_on`` switches from the run lattice."""
        input_lines, _ = read_lattice_mulp_with_name(self.lattice_mulp_path)
        for line in input_lines:
            if line[0] == 'err_step':
                if len(line) != 3:
                    raise Exception("The err_step command miss parameters.")
                if int(line[1]) <= 0:
                    raise Exception("The group parameter of the err_step command must be a positive integer.")
                if int(line[2]) <= 0:
                    raise Exception("The time parameter of the err_step command must be a positive integer.")
                self.err_step_command = line
                self.all_group = int(line[1])
                self.all_time = int(line[2])
            elif line[0] in SWITCH_ATTRS:
                flags = getattr(self, SWITCH_ATTRS[line[0]])
                for j in range(1, len(line)):
                    flags[j - 1] = int(line[j])

    def check_switches(self):
        if len(self.err_step_command) == 0:
            raise MissingcommandError("err_step")
        if all(set(getattr(self, name)) == {0} for name in self.SWITCHES):
            raise Exception(self.MISSING_SWITCH_MESSAGE)

    def increase_error(self, input_lines):
        """Attach one coupled error command to the N following elements of its kind (recursive, one command a pass)."""
        N = -1
        command = []
        error_use_index = 0
        res = copy.deepcopy(input_lines)

        for i in range(len(input_lines)):
            if input_lines[i][0] in global_varible.error_elemment_command and N == -1 and input_lines[i][-1] is False:
                N = int(input_lines[i][1])
                command = input_lines[i]
                command[1] = 1
                error_use_index = i
            elif N == -1:
                continue
            elif N == 0 or input_lines[i][0] == 'end':
                res[error_use_index][-1] = True
                err_judge = [line[-1] for line in res if line[0] in global_varible.error_elemment_command]
                if all(err_judge):
                    return res
                return self.increase_error(res)
            elif input_lines[i][0] in global_varible.mulpud_element and N > 0:
                # static-field map: quadrupole errors; RF field map: cavity errors
                if input_lines[i][0] == 'field' and input_lines[i][4] == '3':
                    if command[0] in (global_varible.error_elemment_command_quad
                                      + global_varible.error_elemment_command_quad_cpl):
                        res[i].append(command)
                if input_lines[i][0] == 'field' and input_lines[i][4] == '1':
                    if command[0] in (global_varible.error_elemment_command_cav
                                      + global_varible.error_elemment_command_cav_cpl):
                        res[i].append(command)
                N -= 1

    def get_dimension(self, lst):
        if not isinstance(lst, list):
            return 0
        return 1 + max(self.get_dimension(item) for item in lst)

    def set_error_to_lattice(self, lattice):
        """Append every error command (numbered ``err_<k>``) to the N elements of its kind that follow it."""
        lattice = add_element_end_index(copy.deepcopy(lattice))

        err_command = []
        for index, line in enumerate(line for line in lattice if line[0] in global_varible.error_elemment_command):
            line.append(f"err_{index}")
            err_command.append(line)

        # the element indices each error command acts on
        err_command_action_scope = []
        for command in err_command:
            N = int(lattice[lattice.index(command)][1])
            command_on_element = judge_command_on_element(lattice, command)
            if command_on_element is not None:
                err_command_action_scope.append(list(range(command_on_element, command_on_element + N)))
            else:
                err_command_action_scope.append([])

        for i, command in enumerate(err_command):
            if command[0] in global_varible.error_elemment_command_quad:
                for j in lattice:
                    if j[0] == 'field' and int(float(j[4])) == 3:
                        if int(j[-1].split("_")[-1]) in err_command_action_scope[i]:
                            j.insert(-1, command)
                    elif j[0] == "quad":
                        if int(j[-1].split("_")[-1]) in err_command_action_scope[i]:
                            j.insert(-1, command)
            elif command[0] in global_varible.error_elemment_command_cav:
                for j in lattice:
                    if j[0] == 'field' and int(float(j[4])) == 1:
                        if int(j[-1].split("_")[-1]) in err_command_action_scope[i]:
                            j.insert(-1, command)

        return delete_element_end_index(lattice)

    def generate_lattice_mulp_list(self, group):
        """The run lattice with the errors of *group* drawn: one error command (N = 1) per element, elements indexed."""
        input_lines, _ = read_lattice_mulp_with_name(self.lattice_mulp_path)

        # coupled errors are drawn once per command, then every command is attached to its elements
        input_lines_copy = self.generate_error(input_lines, group, 'cpl')
        lattice = self.set_error_to_lattice(input_lines_copy)
        lattice = [i for i in lattice if i[0] not in global_varible.error_elemment_command]

        # unfold the attached commands in front of their element; an element keeps at most one command per family
        res_treat = []
        for i in lattice:
            if self.get_dimension(i) == 1:
                res_treat.append(i)
                continue
            lis = []
            err_command_exist = []
            i_copy = copy.deepcopy(i)
            for j in i[::-1]:
                if isinstance(j, list) and j[0] not in err_command_exist:
                    lis.append(j)
                    for family in ERROR_FAMILIES:
                        if j[0] in family:
                            err_command_exist.extend(family)
                            break
                    i_copy.pop()
                elif isinstance(j, list) and j[0] in err_command_exist:
                    i_copy.pop()
                else:
                    lis.append(i_copy)
                    break
            for k in lis:
                res_treat.append(copy.deepcopy(k))

        for i in res_treat:
            if i[0] in global_varible.error_elemment_command:
                i.pop()                                       # the err_<k> number

        # uncoupled (and beam) errors are drawn per element, then every command becomes an uncoupled N = 1 one
        res_treat = self.generate_error(res_treat, group, 'ncpl')
        for i in res_treat:
            i[0] = CPL_TO_NCPL.get(i[0], i[0])
            if i[0] in global_varible.error_elemment_command:
                i[1] = 1

        self.lattice_mulp_list = add_element_end_index(res_treat)
        return self.lattice_mulp_list

    def generate_error_base(self, input, group):
        """Draw the values of one error command for *group* (amplitude ``value / all_group * group``)."""
        input = copy.deepcopy(input)
        target = None

        if input[0] in global_varible.error_elemment_command:
            for i in range(3, len(input)):
                input[i] = float(input[i])
            input = input + [0] * (10 - len(input))
            target = input
            kind = int(input[2])
            if kind == 0:
                target = input
            elif kind == 1:
                for i in range(3, len(input) - 1):
                    dx = float(input[i]) / self.all_group
                    target[i] = round(self.rng.uniform(-1 * dx * (group), dx * (group)), self.decimal)
                target[2] = 0
            elif kind == 2:
                for i in range(3, len(input) - 1):
                    dx = float(input[i]) / self.all_group
                    target[i] = round(self.rng.gauss(0, dx * (group)), self.decimal)
                target[2] = 0
            elif kind == -1:
                for i in range(3, len(input) - 1):
                    dx = float(input[i]) / self.all_group
                    target[i] = dx * (group)
                target[2] = 0

        if input[0] in global_varible.error_beam_command:
            for i in range(2, len(input)):
                input[i] = float(input[i])
            input = input + [0] * (15 - len(input))
            target = input
            kind = int(input[1])
            if kind == 0:
                target = input
            elif kind == 1:
                for i in range(2, len(input)):
                    dx = float(input[i]) / self.all_group
                    target[i] = round(self.rng.uniform(-1 * dx * group, dx * group), self.decimal)
                target[1] = 0
            elif kind == 2:
                for i in range(2, len(input)):
                    dx = float(input[i]) / self.all_group
                    target[i] = round(self.rng.gauss(0, dx * group), self.decimal)
                target[1] = 0
            elif kind == -1:
                for i in range(2, len(input)):
                    dx = float(input[i]) / self.all_group
                    target[i] = dx * (group + 1)
                target[1] = 0

        # columns whose switch is off carry no error
        if input[0] in COMMAND_SWITCH:
            switch, first = COMMAND_SWITCH[input[0]]
            for i, on in enumerate(getattr(self, switch)):
                if int(on) == 0:
                    target[i + first] = 0

        return target

    def generate_error(self, input_lines, group, kind):
        """Draw the errors of every ``kind`` (``'cpl'`` or ``'ncpl'`` + beam) command; ``err_step`` becomes ``1 1``."""
        input_lines = copy.deepcopy(input_lines)
        if kind == 'ncpl':
            for i in range(len(input_lines)):
                if len(input_lines[i]) == 0:
                    continue
                elif input_lines[i][0] == 'err_step':
                    input_lines[i] = ['err_step', '1', '1']
                elif input_lines[i][0] in global_varible.error_elemment_command_ncpl or \
                        input_lines[i][0] in global_varible.error_beam_command:
                    input_lines[i] = self.generate_error_base(input_lines[i], group)
        elif kind == 'cpl':
            for i in range(len(input_lines)):
                if len(input_lines[i]) == 0:
                    continue
                elif input_lines[i][0] in global_varible.error_elemment_command_stat_cpl or \
                        input_lines[i][0] in global_varible.error_elemment_command_dyn_cpl:
                    input_lines[i] = self.generate_error_base(input_lines[i], group)
        return input_lines

    # ------------------------------------------------------------------ engine runs
    def run_multiparticle(self, output_dir, if_error=1):
        item = {
            "project_path": self.project_path,
            "input_file": self.input_path,
            "output_file": output_dir,
            "field_path": self.field_path,
            "device": self.device,
            "if_error": if_error,
        }
        return MultiParticle(item).run()

    def finish_run(self, group, time):
        """Keep the lattice with the results and move ``error_middle/output_0`` to ``error_output/output_<g>_<t>``."""
        copy_file(self.lattice_path, self.error_middle_output0_path)
        copy_directory(self.error_middle_output0_path, self.error_output_path, f'output_{group}_{time}')
        delete_directory(self.error_middle_output0_path)

    def run_normal(self):
        """The error-free reference run -> ``error_output/output_0_0``."""
        write_mulp_to_lattice_only_sim2(self.lattice_mulp_path, self.lattice_path)
        os.makedirs(self.error_middle_output0_path, exist_ok=True)          # restart=1 keeps the previous folder
        # the plain lattice has no err_step, so the engine writes into the folder itself (if_error=0)
        self.run_multiparticle(self.error_middle_output0_path, if_error=0)
        self.write_density_every_time(0, 0)
        self.finish_run(0, 0)

    def run_error_lattice(self, group, time):
        """Run the engine on the ``lattice.txt`` just written (``err_step 1 1`` makes it write ``output_0``)."""
        if os.path.exists(self.error_middle_output0_path):
            delete_directory(self.error_middle_output0_path)
        self.run_multiparticle(self.error_middle_path)
        self.write_density_every_time(group, time)
        self.finish_run(group, time)

    # ------------------------------------------------------------------ the study
    def judge_opti(self):
        """1 when an ``adjust`` and a ``diag_*`` command share a number N (corrector optimisation wanted)."""
        lattice_mulp_list, _ = read_lattice_mulp_with_name(self.lattice_mulp_path)
        all_adjust_N = [i[1] for i in lattice_mulp_list if i[0].lower() == "adjust"]
        all_diag_N = [i[1] for i in lattice_mulp_list if i[0].lower().startswith("diag")]
        return 1 if set(all_adjust_N) & set(all_diag_N) else 0

    def run(self):
        self.get_group_time()
        self.check_switches()
        self.opti = self.judge_opti() if self.SUPPORTS_ADJUST else 0
        if self.restart == 0:
            self.write_err_par_title()
            self.write_err_par_tot_title()
            if self.if_normal == 1:
                self.run_normal()
                self.write_err_par_every_time(0, 0)
        for group in range(1, self.all_group + 1):
            for time in range(1, self.all_time + 1):
                log.info("error study: group %s, run %s", group, time)
                plan = self.prepare_step(group, time)
                self.run_step(group, time, plan)
                self.collect_step(group, time, plan)

    def prepare_step(self, group, time):
        """Draw this run's errors (and optimise the correctors); returns ``(indexed lattice, corrector values)``."""
        lattice = self.generate_lattice_mulp_list(group)
        opti_res = self.optimize_correctors(group, time, lattice) if self.opti else None
        return lattice, opti_res

    def optimize_correctors(self, group, time, lattice):
        v = Adjust_Error(self.project_path, self.field_path, self.input_path, self.output_path, rng=self.rng)
        opti_res, loss = v.opti_one_time_different_group(group, time, lattice)
        log.info("%s %s", opti_res, loss)
        return opti_res

    def run_step(self, group, time, plan):
        lattice, opti_res = plan
        write_engine_lines(self.lattice_path, self.lattice_lines(lattice, opti_res))
        self.run_error_lattice(group, time)

    def lattice_lines(self, lattice, opti_res):
        """The lines to simulate for the drawn, indexed *lattice* (mode specific)."""
        raise NotImplementedError

    def collect_step(self, group, time, plan):
        _lattice, opti_res = plan
        self.write_err_datas(group, time)
        self.write_err_par_every_time(group, time)
        if self.opti:
            self.write_adjust_datas(group, time, opti_res)
        self.write_diag_datas(group, time)

    # ------------------------------------------------------------------ result files
    def write_err_par_tot_title(self):
        write_to_txt(self.errors_par_tot_path, [ERRORS_PAR_TOT_TITLE])

    def write_err_par_title(self):
        write_to_txt(self.errors_par_path, [ERRORS_PAR_TITLE])

    def reference_energy(self):
        """Final energy of the reference run (0 without one)."""
        if self.if_normal != 1:
            return 0
        dataset_obj = DatasetParameter(os.path.join(self.normal_out_path, "DataSet.txt"), self.project_path,
                                       input_dir=self.input_path)
        dataset_obj.get_parameter()
        return dataset_obj.ek[-1]

    def run_summary_row(self, group, time):
        """The ``errors_par_tot`` row of one run (formatted); a lost beam gives ``ratio_loss`` 1 and zeros."""
        output = self.normal_out_path if time == 0 else os.path.join(self.error_output_path, f"output_{group}_{time}")
        normal_ek = self.reference_energy()
        dataset_obj = DatasetParameter(os.path.join(output, "DataSet.txt"), self.project_path, input_dir=self.input_path)
        ok = dataset_obj.get_parameter()
        if ok is False or dataset_obj.z[-1] < (self.lattice_total_length - 0.05):
            row = [f"{group}_{time}", 1] + [0] * (FAILED_ROW_LENGTH - 2)
        else:
            row = [
                f"{group}_{time}",
                dataset_obj.loss[-1] / dataset_obj.num_of_particle,
                dataset_obj.emit_x[-1] / dataset_obj.emit_x[0] - 1,
                dataset_obj.emit_y[-1] / dataset_obj.emit_y[0] - 1,
                dataset_obj.emit_z[-1] / dataset_obj.emit_z[0] - 1,
                dataset_obj.x[-1], dataset_obj.y[-1], dataset_obj.x_1[-1], dataset_obj.y_1[-1],
                dataset_obj.rms_x[-1], dataset_obj.rms_y[-1], dataset_obj.rms_x1[-1], dataset_obj.rms_y1[-1],
                dataset_obj.ek[-1] - normal_ek,
                dataset_obj.alpha_x[-1], dataset_obj.beta_x[-1],
                dataset_obj.alpha_y[-1], dataset_obj.beta_y[-1],
                dataset_obj.alpha_z[-1], dataset_obj.beta_z[-1],
            ]
        return [row[0]] + ["{:.5e}".format(v) for v in row[1:]]

    def group_summary_row(self, group):
        """The ``errors_par`` row of *group*: means of columns 1..13, spreads of 5..13 over its runs."""
        rows = read_txt(self.errors_par_tot_path, out="list")
        runs = [j for j in rows[1:] if int(j[0].split("_")[0]) == group]
        if len(runs) == 1:
            row = [float(v) for v in [group] + runs[0][1:] + [0] * 9]
        elif len(runs) > 1:
            row = [0] * SUMMARY_LENGTH
            row[0] = group
            for c in range(1, 14):
                column = [float(j[c]) for j in runs]
                row[c] = calculate_mean(column)
                if c >= 5:
                    row[c + 9] = calculate_rms(column)
        else:
            row = [0] * SUMMARY_LENGTH
        return [row[0]] + ["{:.5e}".format(v) for v in row[1:]]

    def write_err_par_every_time(self, group, time):
        """Append the run to ``errors_par_tot.txt``; row 0 / the group summary to ``errors_par.txt``."""
        row = self.run_summary_row(group, time)
        add_to_txt(self.errors_par_tot_path, [row])
        if time == 0:
            add_to_txt(self.errors_par_path, [[0] + row[1:] + [0] * 9])
        elif time == self.all_time:
            add_to_txt(self.errors_par_path, [self.group_summary_row(group)])

    def write_density_every_time(self, group, time):
        """Density file of one run (needs ``pchistogram``), merged per group and over all groups at the end."""
        if not (self.if_normal == 1 and self.if_generate_density_file == 1):
            return 0
        exdata_path = os.path.join(self.error_middle_output0_path, "PCHistogram.dat")
        if not os.path.isfile(exdata_path):
            # the engine writes PCHistogram.dat only with `pchistogram 1 ...` in input.txt
            log.info("no PCHistogram.dat in %s (pchistogram is off): density files skipped", self.error_middle_output0_path)
            return 0

        dataset_path = os.path.join(self.error_middle_output0_path, "DataSet.txt")
        target_density_path = os.path.join(self.output_path, f"density_par_{group}_{time}.dat")
        if group == 0:
            ExtoDensity(exdata_path, dataset_path, target_density_path).generate_density_file_onestep(1)
        else:
            normal_density_path = os.path.join(self.output_path, "density_par_0_0.dat")
            ExtoDensity(exdata_path, dataset_path, target_density_path, normal_density_path,
                        self.project_path).generate_density_file_onestep(0)

        if time == self.all_time:
            files = [p for p in list_files_in_directory(self.output_path) if f'density_par_{group}' in p]
            MergeDensityData(files, os.path.join(self.output_path, f"density_tot_par_{group}.dat")).generate_density_file()
        if group == self.all_group and time == self.all_time:
            files = [p for p in list_files_in_directory(self.output_path) if 'density_tot_par' in p]
            MergeDensityData(files, os.path.join(self.output_path, "density_tot_par.dat")).generate_density_file()

    def write_err_datas(self, group, time):
        """``Error_Datas_<g>_<t>.txt``: the error values applied to every cavity / quadrupole of this run."""
        lines, _ = read_lattice_mulp_with_name(self.lattice_path)
        lines = add_element_end_index(lines)
        names = {"err_cav_ncpl_dyn": "CAV_ERROR", "err_quad_ncpl_dyn": "QUAD_ERROR"}
        res = []
        for i, line in enumerate(lines):
            if line[0] in names:
                index = lines[i + 1][-1].split('_')[-1]           # the element that follows the command
                res.append([f"{names[line[0]]}[{index}]"] + line[3:])
        write_to_txt(os.path.join(self.output_path, f"Error_Datas_{group}_{time}.txt"), res)

    def write_adjust_datas(self, group, time, opti_res):
        res = [[f"element_adjust[{k}]", round(v, 5)] for k, v in opti_res.items()]
        write_to_txt(os.path.join(self.output_path, f"Adjust_Datas_{group}_{time}.txt"), res)

    def write_diag_datas(self, group, time):
        """``par_diag_datas_<g>_<t>.txt``: beam parameters at the ``diag_*`` commands of this run."""
        item = {
            "project_path": self.project_path,
            "input_file": self.input_path,
            "output_file": os.path.join(self.error_output_path, f"output_{group}_{time}"),
            "diag_file_path": os.path.join(self.output_path, f"par_diag_datas_{group}_{time}.txt"),
        }
        DiagInfo(item).write_diag_info_to_file()


class ErrorDyn(Error):
    """Dynamic errors only: the static commands are left out, the engine applies the drawn values."""

    SWITCHES = ("err_beam_dyn_on", "err_quad_dyn_on", "err_cav_dyn_on")
    MISSING_SWITCH_MESSAGE = "Missing dynamic error on command"
    SUPPORTS_ADJUST = False

    def lattice_lines(self, lattice, opti_res):
        # write_engine_lines keeps only the dynamic commands and switches
        return delete_element_end_index(lattice)


class Errorstat(Error):
    """Static errors: the drawn values are written as fixed dynamic errors (optionally corrected first)."""

    SWITCHES = ("err_beam_stat_on", "err_quad_stat_on", "err_cav_stat_on")
    MISSING_SWITCH_MESSAGE = "Missing static error on command"

    def lattice_lines(self, lattice, opti_res):
        if opti_res:
            lattice = apply_adjust_results(lattice, opti_res)
        return stat_to_dyn_lines(delete_element_end_index(lattice), beam_switch=True)


class Errorstatdyn(Errorstat):
    """Static and dynamic errors together: per element the two commands are summed into one dynamic command,
    the beam errors likewise, and the switches are the union of the static and dynamic ones."""

    SWITCHES = tuple(SWITCH_ATTRS)
    MISSING_SWITCH_MESSAGE = "Missing error on command"

    def lattice_lines(self, lattice, opti_res):
        lines = apply_adjust_results(lattice, opti_res) if opti_res else copy.deepcopy(lattice)
        beam_stat, beam_dyn = self.merge_element_errors(lines)
        self.insert_merged_beam_error(lines, beam_stat, beam_dyn)
        lines = delete_element_end_index(lines)
        return [i for i in lines if i[0] is not False]

    def merge_element_errors(self, lines):
        """Sum the static and dynamic command in front of each element (in place; dropped lines get ``False`` at
        index 0), mark all switch lines for removal and return the beam error lines found."""
        ncpl = global_varible.error_elemment_command_ncpl
        stat_to_dyn = dict(zip(global_varible.error_elemment_command_stat_ncpl,
                               global_varible.error_elemment_command_dyn_ncpl))
        switches = (global_varible.error_elemment_dyn_on + global_varible.error_elemment_stat_on
                    + global_varible.error_beam_dyn_on + global_varible.error_beam_stat_on)
        beam_stat, beam_dyn = [], []
        for i in range(len(lines)):
            head = lines[i][0]
            if head in global_varible.mulpud_element:
                if lines[i - 1][0] in ncpl and lines[i - 2][0] in ncpl:
                    # two error commands before an element: one static, one dynamic
                    for j in range(3, len(lines[i - 2])):
                        lines[i - 2][j] += lines[i - 1][j]
                    lines[i - 1].insert(0, False)
                    lines[i - 2][0] = stat_to_dyn.get(lines[i - 2][0], lines[i - 2][0])
                elif lines[i - 1][0] in ncpl:
                    lines[i - 1][0] = stat_to_dyn.get(lines[i - 1][0], lines[i - 1][0])
            elif head in switches:
                lines[i].insert(0, False)
            elif head == 'err_beam_stat':
                beam_stat = copy.deepcopy(lines[i])
                lines[i].insert(0, False)
            elif head == 'err_beam_dyn':
                beam_dyn = copy.deepcopy(lines[i])
                lines[i].insert(0, False)
        return beam_stat, beam_dyn

    def insert_merged_beam_error(self, lines, beam_stat, beam_dyn):
        """Insert (after ``start`` / ``err_step``) the union switches and the summed beam error."""
        def union(stat_on, dyn_on):
            return [1 if a == 1 or b == 1 else 0 for a, b in zip(stat_on, dyn_on)]

        quad_on = ['err_quad_dyn_on'] + union(self.err_quad_stat_on, self.err_quad_dyn_on)
        cav_on = ['err_cav_dyn_on'] + union(self.err_cav_stat_on, self.err_cav_dyn_on)
        beam_on = ['err_beam_dyn_on'] + union(self.err_beam_stat_on, self.err_beam_dyn_on)
        if set(cav_on[1:]) != {0}:
            lines.insert(2, cav_on)
        if set(quad_on[1:]) != {0}:
            lines.insert(2, quad_on)

        beam = ['err_beam_dyn', 0]
        if beam_stat and beam_dyn:
            beam += [float(beam_stat[i]) + float(beam_dyn[i]) for i in range(2, len(beam_stat))]
        elif beam_dyn:
            beam += [float(beam_dyn[i]) for i in range(2, len(beam_dyn))]
        elif beam_stat:
            beam += [float(beam_stat[i]) for i in range(2, len(beam_stat))]
        if len(beam) != 2:
            lines.insert(2, beam)
        if set(beam_on[1:]) != {0}:
            lines.insert(2, beam_on)
