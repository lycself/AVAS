"""beam.txt as a flat parameter dictionary.

Keys, types and choices come from ``avas.data.schema.BEAM_KEYWORDS`` through
:class:`avas.utils.keywordconfig.KeywordTable`; the three-value Twiss keywords
and ``distribution`` are split into the component keys the Beam page uses.
Every method returns ``{"code", "data": {"msg", "beamParams": {...}}}``;
keywords whose value is None are not written to the file.
"""
import copy
import os

from avas.data import schema
from avas.utils.keywordconfig import KeywordTable
from avas.utils.readfile import read_txt
from avas.utils.tool import format_output, write_to_txt

SPLIT = {
    "twissx": ("alpha_x", "beta_x", "emit_x"),
    "twissy": ("alpha_y", "beta_y", "emit_y"),
    "twissz": ("alpha_z", "beta_z", "emit_z"),
    "distribution": ("distribution_x", "distribution_y"),
}
TABLE = KeywordTable(schema.BEAM_KEYWORDS, SPLIT)


class BeamConfig():
    def __init__(self):
        self.beam_parameter_keys = list(TABLE.keys)
        self.beam_parameter = {k: None for k in TABLE.keys}
        self._order = []                  # keywords in the order of the file last read

    @staticmethod
    def _path(item):
        other_path = item.get("otherPath")
        if other_path is None:
            return os.path.join(item.get("projectPath"), "InputFile", "beam.txt")
        return other_path

    def read_beam_txt(self, path):
        """``{keyword: text | [text, ...]}`` in file order (keywords are case-insensitive)."""
        res = {}
        for tokens in read_txt(path, out='list', case_sensitive=True):
            key = tokens[0].lower()
            res[key] = tokens[1] if len(tokens) == 2 else tokens[1:]
        return res

    def create_from_file(self, item):
        raw = self.read_beam_txt(self._path(item))
        if raw.get("readparticledistribution") == "unknown":
            raw["readparticledistribution"] = None
        self._order = list(raw)
        self.beam_parameter.update(TABLE.flatten(raw))
        return format_output(beamParams=copy.deepcopy(self.beam_parameter))

    def write_to_file(self, item):
        params = dict(self.beam_parameter)
        if params.get("use_dst") == 0:
            params["readparticledistribution"] = "unknown"      # the engine generates the beam
        write_to_txt(self._path(item), TABLE.rows(params, self._order))
        return format_output(beamParams=copy.deepcopy(self.beam_parameter))

    def set_param(self, **kwargs):
        kwargs = {k: (None if v == '' else v) for k, v in kwargs.items()}
        self.validate_type(kwargs)
        self.beam_parameter.update(kwargs)
        return format_output(beamParams=copy.deepcopy(self.beam_parameter))

    def convert_v(self, k, v):
        return TABLE.coerce(k, v)

    def validate_type(self, param):
        for k, v in param.items():
            TABLE.validate(k, v)
        return True

    def validate_run(self, item):
        pass
