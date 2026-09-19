"""Corrector optimisation for static error studies, plus the lattice-line helpers shared with :mod:`avas.sim.error`.

An ``adjust 0 v n lo hi u`` command in front of an element marks parameter ``v`` of that element as a knob;
``diag_position`` / ``diag_size`` / ``diag_energy`` commands give targets.  Knobs and targets with the same
number ``N`` form one correction: :meth:`Adjust_Error.opti_one_time_different_group` optimises them in order
of ``N`` (SLSQP on the engine, every evaluation is one run into ``<output>/error_adjust``) and returns the
values found as ``{"<element index>_<parameter index>": value}``.
"""
import copy
import logging
import os
import random
from collections import namedtuple

import numpy as np
from scipy.optimize import minimize

import avas.constants as global_varible
from avas.core.MultiParticle import MultiParticle
from avas.paths import lattice_source_path, resolve_io_dirs
from avas.sim.diaginfo import DiagInfo
from avas.utils.tool import delete_element_end_index, judge_command_on_element
from avas.utils.treatlist import flatten_list

log = logging.getLogger(__name__)

GOOD_ENOUGH_LOSS = 0.05                # the optimiser stops as soon as the mean diagnostic loss is below this

# static error commands / switches and their dynamic names: the engine only knows the dynamic ones, so a static
# error study writes the drawn (fixed) values under the dynamic keyword
STAT_TO_DYN = {
    "err_beam_stat": "err_beam_dyn",
    "err_quad_ncpl_stat": "err_quad_ncpl_dyn",
    "err_cav_ncpl_stat": "err_cav_ncpl_dyn",
    "err_quad_stat_on": "err_quad_dyn_on",
    "err_cav_stat_on": "err_cav_dyn_on",
}
STAT_TO_DYN_BEAM_SWITCH = {"err_beam_stat_on": "err_beam_dyn_on"}

AdjustSpec = namedtuple("AdjustSpec", "elements initial params ranges groups use_init")
"""Knobs of one correction: per element (``elements[i]`` is the element index) the lists of the initial values,
parameter indices, ``[lo, hi]`` ranges, link groups ``n`` (knobs with the same non-zero ``n`` share a value) and
use-initial-value flags.  The flat order (element by element, knob by knob) is the optimiser's ``x`` order."""


# --------------------------------------------------------------------------- lattice-line helpers
def write_engine_lines(path, lines):
    """Write the lines the engine understands (``err_write_command``) as ``lattice.txt``."""
    with open(path, "w", encoding="utf-8") as fh:
        for line in lines:
            if line[0] in global_varible.err_write_command:
                fh.write(" ".join(map(str, line)) + "\n")


def stat_to_dyn_lines(lines, beam_switch=True):
    """Static errors as fixed dynamic errors: drop the dynamic error commands, rename the static ones.

    *beam_switch* also drops ``err_beam_dyn_on`` and renames ``err_beam_stat_on`` (the study runs do this;
    the corrector optimisation runs historically left both beam switches alone, so they keep ``beam_switch=False``).
    The lines are copied.
    """
    dropped = set(global_varible.error_elemment_command_dyn_ncpl + global_varible.error_beam_dyn
                  + global_varible.error_elemment_dyn_on)
    rename = dict(STAT_TO_DYN)
    if beam_switch:
        dropped.add("err_beam_dyn_on")
        rename.update(STAT_TO_DYN_BEAM_SWITCH)
    out = []
    for line in lines:
        if line[0] in dropped:
            continue
        line = list(line)
        line[0] = rename.get(line[0], line[0])
        out.append(line)
    return out


def apply_adjust_results(lattice, results):
    """A copy of the indexed *lattice* with the corrector values *results* (``{"<element>_<param>": value}``) set."""
    lattice = copy.deepcopy(lattice)
    for key, value in results.items():
        log.info("%s %s", key, value)
        element, param = key.split("_")
        for com in lattice:
            if com[-1] == f"element_{element}":
                com[int(param)] = value
                break
    return lattice


def _set_knobs(lattice, spec, values):
    """Set the flat knob *values* into the indexed *lattice* in place (``spec`` order)."""
    k = 0
    for element, params in zip(spec.elements, spec.params):
        for param in params:
            for com in lattice:
                if com[-1] == f"element_{element}":
                    com[param] = values[k]
                    break
            k += 1


def _end_after_last_diag(lines):
    """Insert ``end`` right after the last ``diag_*`` line, unless a diag is one of the last two lines."""
    lines = copy.deepcopy(lines)
    for back, line in enumerate(lines[::-1]):
        index = -back - 1
        if line[0].startswith("diag"):
            if index not in (-1, -2):
                lines.insert(index + 1, ["end"])
            break
    return lines


# --------------------------------------------------------------------------- diagnostic losses
def _loss_position(command, data):
    target_x, target_y = float(command[2]), float(command[3])
    center_x, center_y = float(data["center"][0]), float(data["center"][1])
    return (center_x - target_x) ** 2 + (center_y - target_y) ** 2


def _loss_size(command, data):
    target_x, target_y = float(command[2]), float(command[3])
    rms_x, rms_y = float(data["rms_size"][0]), float(data["rms_size"][1])
    return (rms_x - target_x) ** 2 + (rms_y - target_y) ** 2


def _loss_energy(command, data):
    return (float(command[2]) - float(data["energy"][0])) ** 2


DIAG_LOSS = {"diag_position": _loss_position, "diag_size": _loss_size, "diag_energy": _loss_energy}


class _GoodEnough(Exception):
    """Raised inside the goal function when the loss is already below GOOD_ENOUGH_LOSS."""


class Adjust_Error():
    """Corrector optimisation on one perturbed lattice (see the module docstring)."""

    def __init__(self, project_path, field_path, input_path=None, output_path=None, rng=None):
        # rng: the error study's random.Random (shared so one seed fixes the whole study)
        self.rng = rng if rng is not None else random.Random()
        self.project_path = project_path
        self.input_path, self.output_path = resolve_io_dirs(project_path, input_path, output_path)
        self.lattice_mulp_path = lattice_source_path(self.input_path)
        self.lattice_path = os.path.join(self.input_path, "lattice.txt")
        self.field_path = field_path
        self.err_adjust_path = os.path.join(self.output_path, "error_adjust")
        self.ini_this = []             # knob values tried by the current optimisation
        self.loss_this = []            # and their losses

    def run_multiparticle(self, output_dir):
        item = {
            "project_path": self.project_path,
            "input_file": self.input_path,
            "output_file": output_dir,
            "field_path": self.field_path,
        }
        return MultiParticle(item).run()

    # ------------------------------------------------------------------ knobs
    def generate_adjust_parameter(self, input_lines):
        """The knobs (:class:`AdjustSpec`) declared by the ``adjust`` commands of the indexed *input_lines*."""
        lattice = copy.deepcopy(input_lines)
        elements = []
        for n, line in enumerate(line for line in lattice if line[0] == "adjust"):
            line.append(f"adjust_{n}")            # identical adjust lines must stay distinguishable below
        for line in lattice:
            if line[0] == "adjust":
                on_element = judge_command_on_element(lattice, line)
                line.append(on_element)
                if on_element not in elements:
                    elements.append(on_element)

        params = [[] for _ in elements]
        ranges = [[] for _ in elements]
        groups = [[] for _ in elements]
        use_init = [[] for _ in elements]
        for line in lattice:
            if line[0] == "adjust":
                index = elements.index(line[-1])
                params[index].append(int(line[2]))
                ranges[index].append([float(line[4]), float(line[5])])
                groups[index].append(int(line[3]))
                use_init[index].append(int(line[6]))

        initial = [[] for _ in elements]
        log.info("adjust elements %s", elements)
        for i, element in enumerate(elements):
            for line in lattice:
                if line[0] in global_varible.mulpud_element and int(line[-1].split("_")[-1]) == element:
                    for param in params[i]:
                        initial[i].append(float(line[param]))
        return AdjustSpec(elements, initial, params, ranges, groups, use_init)

    # ------------------------------------------------------------------ loss
    def treat_diag(self, group, time, NN):
        """Mean loss of the diagnostics with number *NN* (all diagnostics when None) of the last correction run."""
        item = {
            "project_path": self.project_path,
            "input_file": self.input_path,
            "output_file": os.path.join(self.err_adjust_path, "output_0"),
            "diag_file_path": None,
        }
        diags = DiagInfo(item).generate_all_diag_info()
        losses = [DIAG_LOSS[d["diag_command"][0]](d["diag_command"], d["diag_data"])
                  for d in diags
                  if (NN is None or int(d["diag_command"][1]) == NN) and d["diag_command"][0] in DIAG_LOSS]
        return sum(losses) / len(losses)

    def get_goal(self, error_lattice, spec, group, time, NN):
        """The optimiser's objective: set the knobs, run the engine up to the last diagnostic, return the loss."""
        def goal(x):
            log.info("--------------------")
            log.info("x %s", x)
            self.ini_this.append(x)
            _set_knobs(error_lattice, spec, x)
            lines = _end_after_last_diag(delete_element_end_index(error_lattice))
            write_engine_lines(self.lattice_path, stat_to_dyn_lines(lines, beam_switch=False))
            self.run_multiparticle(self.err_adjust_path)
            loss = self.treat_diag(group, time, NN)
            log.info("loss %s", loss)
            self.loss_this.append(loss)
            log.info("--------------------")
            if loss < GOOD_ENOUGH_LOSS:
                raise _GoodEnough(f"loss {loss} < {GOOD_ENOUGH_LOSS}")
            return loss

        return goal

    # ------------------------------------------------------------------ optimisation
    def optimize_one_group(self, group, time, error_lattice, spec, NN):
        """SLSQP over the knobs of *spec*; returns ``(values, loss)`` (the last evaluation when it stops early)."""
        error_lattice = copy.deepcopy(error_lattice)
        lattice_initial_value = flatten_list(spec.initial)
        parameter_range = np.array(flatten_list(spec.ranges)).reshape(-1, 2)

        # random start inside the range (drawn from the study's RNG), or the lattice value where asked
        initial_value = [self.rng.uniform(lo, hi) for lo, hi in parameter_range]
        use_initial_value = np.hstack(spec.use_init)
        for i in range(len(initial_value)):
            if use_initial_value[i] == 1:
                initial_value[i] = lattice_initial_value[i]
        log.info("initial_value %s", initial_value)

        # knobs with the same non-zero link number keep one value
        links = flatten_list(spec.groups)
        unique_elements, unique_indices = np.unique(links, return_index=True)
        log.info("%s %s", unique_elements, unique_indices)
        constraints = []
        for n in unique_elements:
            if n == 0:
                continue
            members = [index for index, element in enumerate(links) if element == n]
            for j in members[1:]:
                initial_value[j] = initial_value[members[0]]
                constraints.append({"type": "eq", "fun": lambda x, a=j, b=members[0]: x[a] - x[b]})

        goal = self.get_goal(error_lattice, spec, group, time, NN)
        options = {"maxiter": 100, "eps": 10 ** -1, "ftol": 10 ** -4}
        try:
            result = minimize(fun=goal, x0=initial_value, constraints=constraints, bounds=parameter_range,
                              method="SLSQP", options=options)
            return result.x, result.fun
        except _GoodEnough as exc:
            log.info("optimisation stopped: %s", exc)
        except Exception:  # noqa: BLE001 - keep the best effort of a failed engine run, as before
            log.exception("optimisation aborted, keeping the last evaluated knobs")
        return self.ini_this[-1], self.loss_this[-1]

    def opti_one_time_different_group(self, group, time, lattice_mulp_list):
        """Optimise every correction number N in turn on the indexed *lattice_mulp_list*.

        Returns ``({"<element>_<param>": value}, loss)`` with the loss over all diagnostics after the last run.
        """
        lattice_mulp_list = copy.deepcopy(lattice_mulp_list)
        adjust_numbers = {int(line[1]) for line in lattice_mulp_list if line[0].lower() == "adjust"}
        diag_numbers = {int(line[1]) for line in lattice_mulp_list if line[0].lower().startswith("diag")}

        results = {}
        for NN in sorted(adjust_numbers & diag_numbers):
            # only this correction's knobs and targets take part
            t_lattice = [line for line in copy.deepcopy(lattice_mulp_list)
                         if not ((line[0].lower() == "adjust" or line[0].lower().startswith("diag")) and int(line[1]) != NN)]
            spec = self.generate_adjust_parameter(t_lattice)
            log.info("%s", spec)
            self.ini_this = []
            self.loss_this = []
            values, _loss = self.optimize_one_group(group, time, t_lattice, spec, NN)
            _set_knobs(lattice_mulp_list, spec, values)       # later corrections start from the corrected lattice
            k = 0
            for element, params in zip(spec.elements, spec.params):
                for param in params:
                    results[f"{element}_{param}"] = values[k]
                    k += 1

        return results, self.treat_diag(group, time, None)
