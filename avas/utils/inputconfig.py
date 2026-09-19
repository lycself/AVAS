"""input.txt as a flat parameter dictionary.

Keys, types and choices come from ``avas.data.schema.INPUT_KEYWORDS`` through
:class:`avas.utils.keywordconfig.KeywordTable`; ``pchistogram`` and
``longlimits`` are split into the component keys the Settings page uses.
Every method returns ``{"code", "data": {"msg", "inputParams": {...}}}``.
Keywords whose value is None are not written (an absent keyword keeps the
engine's default; ``multithreading`` in particular must be 1 or absent).
"""
import copy
import os

from avas.data import schema
from avas.utils.exception import ValueRangeError
from avas.utils.keywordconfig import KeywordTable
from avas.utils.readfile import read_txt
from avas.utils.tool import format_output, write_to_txt

SPLIT = {
    "pchistogram": ("pchistogram_start", "pchistogram_grid"),
    "longlimits": ("longlimits_start", "longlimits_phase", "longlimits_energy"),
}
TABLE = KeywordTable(schema.INPUT_KEYWORDS, SPLIT)
# lower bounds the schema does not express
MINIMUM = {"steppercycle": 1, "dumpperiodicity": 0}
# the envelope model only reads these
ENV_KEYWORDS = ("sim_type", "spacechargelong", "spacechargetype")


class InputConfig():
    def __init__(self):
        self.input_parameter_keys = list(TABLE.keys)
        self.input_parameter = {k: None for k in TABLE.keys}
        self._order = []                  # keywords in the order of the file last read

    @staticmethod
    def _path(item):
        other_path = item.get("otherPath")
        if other_path is None:
            return os.path.join(item.get("projectPath"), "InputFile", "input.txt")
        return other_path

    def read_input_txt(self, path):
        """``{keyword: text | [text, ...]}`` in file order (the engine reads keywords case-insensitively)."""
        res = {}
        for tokens in read_txt(path, out='list', readdall=True, case_sensitive=True):
            key = tokens[0].lower()
            res[key] = tokens[1] if len(tokens) == 2 else tokens[1:]
        return res

    def create_from_file(self, item):
        raw = self.read_input_txt(self._path(item))
        self._order = list(raw)
        self.input_parameter.update(TABLE.flatten(raw))
        return format_output(inputParams=copy.deepcopy(self.input_parameter))

    def set_param(self, **kwargs):
        kwargs = {k: (None if v == '' else v) for k, v in kwargs.items()}
        self.validate_type(kwargs)
        self.input_parameter.update(kwargs)
        return format_output(inputParams=copy.deepcopy(self.input_parameter))

    def write_to_file(self, item):
        sim_type = self.input_parameter.get("sim_type")
        if sim_type == "mulp":
            params = dict(self.input_parameter)
        elif sim_type == "env":
            params = {k: self.input_parameter.get(k) for k in ENV_KEYWORDS}
        else:
            params = {}
        write_to_txt(self._path(item), TABLE.rows(params, self._order))
        return format_output(inputParams=copy.deepcopy(self.input_parameter))

    def validate_type(self, param):
        for k, v in param.items():
            TABLE.validate(k, v)
            first = v[0] if isinstance(v, list) and v else v
            if k in MINIMUM and first is not None and first < MINIMUM[k]:
                raise ValueRangeError(k, [str(MINIMUM[k]), "+inf"], first)
        return True

    def convert_v(self, k, v):
        return TABLE.coerce(k, v)

    def validate_run(self, item):
        pass
