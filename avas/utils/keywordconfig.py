"""Types, choices and file rows of beam.txt / input.txt keywords, derived from ``avas.data.schema``.

``BeamConfig`` and ``InputConfig`` present the files as flat dictionaries:
multi-value keywords are split into named components (``twissx`` becomes
``alpha_x``, ``beta_x``, ``emit_x``).  :class:`KeywordTable` does the mapping in
both directions and turns the ``Param.kind`` / ``Param.choices`` of the schema
into Python types and validation, so no key list or type list is written by hand.
"""
from avas.data import schema
from avas.utils.exception import TypeError as KeyTypeError, ValueChooseError
from avas.utils.tool import convert_to_othertype_dict


def _is_int_text(text):
    try:
        return float(text).is_integer()
    except (TypeError, ValueError):
        return False


def python_type(param):
    """``int`` / ``float`` / ``str`` for one schema Param; None keeps the file text."""
    kind = param.kind
    if kind in (schema.INT, schema.FLAG):
        return int
    if kind in (schema.FLOAT, schema.RESERVED):
        return float
    if kind == schema.ENUM:
        return int if param.choices and all(_is_int_text(v) for v, _ in param.choices) else str
    if kind in (schema.TEXT, schema.FILE, schema.FIELDMAP):
        return str
    return None


class KeywordTable:
    def __init__(self, keywords, split=()):
        self.keywords = keywords                       # schema.BEAM_KEYWORDS or schema.INPUT_KEYWORDS
        self.split = dict(split)                       # keyword -> component keys
        self.component = {c: (kw, i) for kw, comps in self.split.items() for i, c in enumerate(comps)}
        self.keys = []                                 # flattened keys in schema order
        for kw in keywords:
            self.keys.extend(self.split.get(kw, (kw,)))

    # ---- schema lookup ------------------------------------------------------------------
    def param(self, key, index=0):
        """Schema Param of a flattened key (component, or position *index* of a keyword), or None."""
        if key in self.component:
            kw, index = self.component[key]
            key = kw
        keyword = self.keywords.get(key)
        if keyword is None or index >= len(keyword.params):
            return None
        return keyword.params[index]

    # ---- reading -------------------------------------------------------------------------
    def flatten(self, raw):
        """``{keyword: text | [text, ...]}`` from a file -> ``{flattened key: value}`` with Python types."""
        out = {}
        for key, value in raw.items():
            if key in self.split:
                values = value if isinstance(value, list) else [value]
                for i, comp in enumerate(self.split[key]):
                    out[comp] = self.coerce(comp, values[i] if i < len(values) else None)
            else:
                out[key] = self.coerce(key, value)
        return out

    def coerce(self, key, value):
        if value is None:
            return None
        if isinstance(value, list):
            keyword = self.keywords.get(key)
            if keyword is None or key in self.component:
                return value                                   # unknown keyword: keep the text
            if len(keyword.params) <= 1:
                value = value[0] if value else None            # scalar keyword written with extra tokens
                return self._cast(key, value, self.param(key))
            return [self._cast(key, v, self.param(key, i)) for i, v in enumerate(value)]
        return self._cast(key, value, self.param(key))

    @staticmethod
    def _cast(key, value, param):
        target = python_type(param) if param is not None else None
        if target is None or value is None:
            return value
        return convert_to_othertype_dict(key, value, target)

    # ---- validation (set_param) ------------------------------------------------------------
    def validate(self, key, value):
        if value is None:
            return
        if isinstance(value, list):
            for i, v in enumerate(value):
                self._check(key, v, self.param(key, i))
        else:
            self._check(key, value, self.param(key))

    @staticmethod
    def _check(key, value, param):
        if param is None or value is None:
            return
        target = python_type(param)
        if target is int and not isinstance(value, int):
            raise KeyTypeError(key, int, type(value))
        if target is float and not isinstance(value, (int, float)):
            raise KeyTypeError(key, float, type(value))
        if target is str and not isinstance(value, str):
            raise KeyTypeError(key, str, type(value))
        if param.kind == schema.ENUM and param.choice_value(value) is None:
            raise ValueChooseError(key, [v for v, _ in param.choices], value)

    # ---- writing -------------------------------------------------------------------------
    def rows(self, params, order=()):
        """``[[keyword, value, ...], ...]`` for the file: components regrouped, keywords with a None dropped.

        *order* (keywords as they were read from a file) comes first, then the other schema
        keywords in schema order, then unknown keywords.
        """
        seen = set()
        keywords = []
        for kw in list(order) + list(self.keywords) + list(params):
            if kw in seen or kw in self.component:
                continue
            seen.add(kw)
            keywords.append(kw)
        rows = []
        for kw in keywords:
            if kw in self.split:
                values = [params.get(c) for c in self.split[kw]]
            elif kw in params:
                v = params[kw]
                values = list(v) if isinstance(v, list) else [v]
            else:
                continue
            if any(v is None for v in values):
                continue
            rows.append([kw] + values)
        return rows
