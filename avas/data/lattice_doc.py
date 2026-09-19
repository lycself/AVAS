"""Structured view of an AVAS lattice file (lattice_mulp.txt and friends).

The text stays the single source of truth: :class:`LatticeDocument` parses it
into statements with names, groups, z positions and validation issues, and
:func:`format_statement` produces the new text of one line when a parameter
changes, keeping indentation, the ``name :`` prefix and trailing comments.

Rules come from ``docs/使用说明20260427.docx``:

* only lines between the first ``start`` and the first ``end`` are simulated;
* inside ``superpose ... superposeend/superposeout`` every element is
  preceded by one ``superpose z0 ...``; z0 is measured from the block start;
* steerers have length 0 and act over the next element, the length of a bend
  is |α|·ρ when written as 0;
* ``section NAME {`` ... ``}`` is a folding group, ``lattice n1 n2`` ...
  ``lattice_end`` a period.

Names come from a ``name : keyword ...`` prefix or from a ``!name NAME``
comment line right before the statement (TraceWin exports).  Comments made of
a word decorated with ``;;;`` / ``...`` / ``---`` become group headings.

This is the only lattice tokeniser: the positional readers used by the run
path (``avas.utils.readfile.read_lattice_mulp*``) are adapters over
:meth:`LatticeDocument.all_lines` and :attr:`Statement.tokens`.
"""
import math
import os
import re

from avas.data import schema

ERROR, WARNING = "error", "warning"
_NUMBER = re.compile(r"^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$")
_INT = re.compile(r"^[-+]?\d+$")
_HEADING = re.compile(r"^[\s;:.\-=_*~#/|+]{3,}\s*([^\s;:.\-=_*~#/|+].*?)\s*[\s;:.\-=_*~#/|+]*$")
FIELDMAP_TRIPLETS = {
    "1": (("edx", "edy", "edz"), ("bdx", "bdy", "bdz")),     # RF: electric and/or magnetic
    "2": (("esx", "esy", "esz"),),                          # static electric
    "3": (("bsx", "bsy", "bsz"),),                          # static magnetic
}
FIELDMAP_EXTENSIONS = {ext for groups in FIELDMAP_TRIPLETS.values() for triplet in groups for ext in triplet}


def is_number(text):
    return bool(_NUMBER.match(text or ""))


def to_float(text, default=0.0):
    try:
        return float(text)
    except (TypeError, ValueError):
        return default


def split_comment(line):
    idx = line.find("!")
    if idx < 0:
        return line, ""
    return line[:idx], line[idx:]


class Issue:
    __slots__ = ("level", "text")

    def __init__(self, level, text):
        self.level = level
        self.text = text          # (en, zh)


class Statement:
    """One non-blank, non-comment line."""

    def __init__(self, line_no, raw):
        self.line_no = line_no
        self.raw = raw
        code, self.comment = split_comment(raw)
        self.indent = re.match(r"\s*", raw).group(0)
        # ":" is always its own token, so "name : kw", "name: kw" and "name:kw" are the same
        tokens = code.replace(":", " : ").split()
        self.tokens = list(tokens)      # the whole code part, name prefix included (legacy readers use this)
        self.prefix_name = ""
        if len(tokens) >= 3 and tokens[1] == ":":
            self.prefix_name, tokens = tokens[0], tokens[2:]
        self.keyword = tokens[0] if tokens else ""
        self.key = self.keyword.lower()
        self.params = tokens[1:]
        self.spec = schema.lattice_keyword(self.key)
        self.comment_name = ""          # from a preceding "!name X" line
        self.comment_name_line = None
        self.active = False             # between start and end
        self.group = None
        self.z_start = None
        self.z_end = None
        self.length = 0.0
        self.block = None               # superpose block index
        self.issues = []

    # ---- naming ---------------------------------------------------------------------
    @property
    def name(self):
        return self.prefix_name or self.comment_name

    @property
    def category(self):
        return self.spec.category if self.spec else schema.OTHER

    @property
    def is_element(self):
        return self.category in schema.ELEMENT_CATEGORIES

    def param(self, k, default=""):
        return self.params[k] if k < len(self.params) else default

    def field_type(self):
        """"1" RF, "2" static electric, "3" static magnetic ("3.0" is normalised)."""
        if self.key != "field":
            return ""
        value = self.param(3)
        return schema.LATTICE_KEYWORDS["field"].params[3].choice_value(value) or value

    def worst_issue(self):
        if any(i.level == ERROR for i in self.issues):
            return ERROR
        if self.issues:
            return WARNING
        return None


class Group:
    def __init__(self, title, kind, parent=None, line_no=None):
        self.title = title
        self.kind = kind                # heading | section | superpose | period
        self.parent = parent
        self.line_no = line_no
        self.children = []              # Statement or Group

    def statements(self):
        for child in self.children:
            if isinstance(child, Group):
                yield from child.statements()
            else:
                yield child


class LatticeDocument:
    def __init__(self, text="", field_dirs=()):
        self.field_dirs = [d for d in field_dirs if d]
        self.lines = []
        self.statements = []
        self.layout = []                 # "section NAME {", "{" and "}" lines (folding only, not simulated)
        self.by_line = {}
        self.root = Group("", "root")
        self.issues = []                 # document-level
        self.total_length = 0.0
        self.parse(text)

    # ------------------------------------------------------------------ parsing
    def parse(self, text):
        self.lines = text.splitlines()
        self.statements, self.by_line = [], {}
        self.layout = []
        self.root = Group("", "root")
        self.issues = []
        pending_name = None
        started = ended = False
        group_stack = [self.root]          # sections / periods / superpose nest here
        heading = None                     # current heading group (flat, top level)
        block = None                       # current superpose Group
        block_count = 0

        def container():
            return group_stack[-1] if len(group_stack) > 1 or heading is None else heading

        for no, raw in enumerate(self.lines):
            stripped = raw.strip()
            if not stripped:
                continue
            if stripped.startswith("!"):
                body = stripped[1:].strip()
                low = body.lower()
                if low.startswith("name ") and len(body.split()) >= 2:
                    pending_name = (body.split()[1], no)
                    continue
                m = _HEADING.match(body)
                if m and len(group_stack) == 1 and block is None:
                    heading = Group(m.group(1).strip(" ;"), "heading", self.root, no)
                    self.root.children.append(heading)
                continue
            # folding: "section NAME {" / "section NAME" + "{" / "}"
            low = stripped.lower()
            if low.startswith("section") and (len(low) == 7 or low[7] in " \t{"):
                title = stripped[7:].replace("{", "").strip() or "section"
                grp = Group(title, "section", container(), no)
                container().children.append(grp)
                group_stack.append(grp)
                self.layout.append(Statement(no, raw))
                continue
            if stripped == "{":
                self.layout.append(Statement(no, raw))
                continue
            if stripped == "}":
                if len(group_stack) > 1 and group_stack[-1].kind == "section":
                    group_stack.pop()
                self.layout.append(Statement(no, raw))
                continue

            st = Statement(no, raw)
            if not st.keyword:
                continue
            if pending_name is not None:
                st.comment_name, st.comment_name_line = pending_name
                pending_name = None
            if st.key == "start" and not started:
                started = True
            st.active = started and not ended
            if st.key == "end" and started and not ended:
                ended = True
                st.active = True

            if st.key == "lattice":
                grp = Group(st.name or "lattice", "period", container(), no)
                container().children.append(grp)
                grp.children.append(st)
                group_stack.append(grp)
                st.group = grp
            elif st.key == "lattice_end":
                if len(group_stack) > 1 and group_stack[-1].kind == "period":
                    group_stack[-1].children.append(st)
                    st.group = group_stack[-1]
                    group_stack.pop()
                else:
                    container().children.append(st)
                    st.group = container()
            elif st.key == "superpose" and block is None:
                block = Group("superpose", "superpose", container(), no)
                block.index = block_count
                block_count += 1
                container().children.append(block)
                block.children.append(st)
                group_stack.append(block)
                st.group, st.block = block, block.index
            elif block is not None:
                block.children.append(st)
                st.group, st.block = block, block.index
                if st.key in ("superposeend", "superposeout"):
                    group_stack.pop()
                    block = None
            else:
                container().children.append(st)
                st.group = container()
            self.statements.append(st)
            self.by_line[no] = st

        if not started:
            self.issues.append(Issue(WARNING, ("No 'start' line: nothing will be simulated.",
                                               "没有 start 行，不会模拟任何元件。")))
        elif not ended:
            self.issues.append(Issue(WARNING, ("No 'end' line.", "没有 end 行。")))
        for grp in self._all_groups(self.root):
            if grp.kind == "superpose":
                n = sum(1 for s in grp.statements() if s.is_element)
                grp.title = f"superpose ({n})"
        self._positions()
        self._validate()

    def _all_groups(self, grp):
        for child in grp.children:
            if isinstance(child, Group):
                yield child
                yield from self._all_groups(child)

    # ------------------------------------------------------------------ geometry
    @staticmethod
    def element_length(st):
        key = st.key
        if key in ("steerer", "edge") or st.category == schema.DIAG:
            return 0.0
        if key == "bend":
            arc = abs(to_float(st.param(0)))
            if arc == 0:
                arc = abs(math.radians(to_float(st.param(3)))) * abs(to_float(st.param(4)))
            return arc
        return max(0.0, to_float(st.param(0)))

    def _positions(self):
        z = 0.0
        block_start = block_end = 0.0
        in_block = False
        offset = None
        for st in self.statements:
            if not st.active:
                continue
            if st.key == "superpose":
                if not in_block:
                    in_block, block_start, block_end = True, z, z
                offset = block_start + to_float(st.param(0))
                st.z_start = st.z_end = offset
                continue
            if st.key in ("superposeend", "superposeout"):
                if in_block:
                    z = max(block_end, z)
                in_block, offset = False, None
                st.z_start = st.z_end = z
                continue
            if not st.is_element:
                st.z_start = st.z_end = offset if in_block and offset is not None else z
                continue
            st.length = self.element_length(st)
            if in_block:
                start = offset if offset is not None else block_start
                st.z_start, st.z_end = start, start + st.length
                block_end = max(block_end, st.z_end)
                offset = None
            else:
                st.z_start, st.z_end = z, z + st.length
                z = st.z_end
        if in_block:
            z = max(z, block_end)
        self.total_length = z

    # ------------------------------------------------------------------ field maps
    def fieldmap_status(self, st):
        """``(found_extensions, missing_triplet_text)`` for a field element."""
        name = st.param(8)
        if not name:
            return set(), ""
        found = set()
        for d in self.field_dirs:
            for ext in FIELDMAP_EXTENSIONS:
                if os.path.isfile(os.path.join(d, f"{name}.{ext}")):
                    found.add(ext)
        groups = FIELDMAP_TRIPLETS.get(st.field_type())
        if not groups:
            return found, ""
        if any(all(ext in found for ext in triplet) for triplet in groups):
            return found, ""
        return found, " / ".join("." + ",.".join(t) for t in groups)

    # ------------------------------------------------------------------ validation
    def _validate(self):
        elements = [s for s in self.statements if s.active and s.is_element]
        for st in self.statements:
            spec = st.spec
            if spec is None:
                st.issues.append(Issue(WARNING, (f"Unknown keyword '{st.keyword}' (not in the manual).",
                                                 f"未知关键字“{st.keyword}”（手册中没有）。")))
                continue
            if len(st.params) < spec.min_params:
                st.issues.append(Issue(ERROR, (f"{spec.min_params} parameters expected, {len(st.params)} given.",
                                               f"需要 {spec.min_params} 个参数，实际 {len(st.params)} 个。")))
            for k, value in enumerate(st.params[:len(spec.params)]):
                p = spec.params[k]
                label = p.label[0]
                if p.kind in (schema.FLOAT, schema.RESERVED) and not is_number(value):
                    st.issues.append(Issue(ERROR, (f"{label}: '{value}' is not a number.",
                                                   f"{p.label[1]}：“{value}”不是数字。")))
                elif p.kind in (schema.INT, schema.FLAG) and not _INT.match(value):
                    st.issues.append(Issue(ERROR, (f"{label}: '{value}' is not an integer.",
                                                   f"{p.label[1]}：“{value}”不是整数。")))
                elif p.kind == schema.FLAG and value not in ("0", "1"):
                    st.issues.append(Issue(WARNING, (f"{label}: switches are 0 or 1.", f"{p.label[1]}：开关只能写 0 或 1。")))
                elif p.kind == schema.ENUM and p.choice_label(value) is None:
                    st.issues.append(Issue(WARNING, (f"{label}: unexpected value '{value}'.",
                                                     f"{p.label[1]}：取值“{value}”不在手册列出的选项中。")))
            if st.is_element and st.key not in ("steerer", "edge") and st.category != schema.DIAG:
                if is_number(st.param(0)) and to_float(st.param(0)) < 0:
                    st.issues.append(Issue(ERROR, ("Negative length.", "长度为负。")))
            if st.key == "steerer" and st.params and is_number(st.param(0)) and to_float(st.param(0)) != 0:
                st.issues.append(Issue(WARNING, ("A steerer must have length 0.", "校正铁长度必须为 0。")))
            if st.key == "field" and len(st.params) >= 9 and self.field_dirs:
                _found, missing = self.fieldmap_status(st)
                if missing:
                    st.issues.append(Issue(WARNING, (f"Field map '{st.param(8)}' not found ({missing}).",
                                                     f"找不到场图“{st.param(8)}”（需要 {missing}）。")))

        # superpose blocks
        for grp in self._all_groups(self.root):
            if grp.kind != "superpose":
                continue
            items = list(grp.statements())
            first = items[0]
            if first.active and any(is_number(v) and to_float(v) != 0 for v in first.params):
                first.issues.append(Issue(WARNING, ("The first superpose of a block must be all zeros.",
                                                    "一组叠加场中第一条 superpose 的参数必须全为 0。")))
            if items[-1].key not in ("superposeend", "superposeout"):
                first.issues.append(Issue(ERROR, ("Superpose block is not closed by superposeend / superposeout.",
                                                  "叠加场没有以 superposeend 或 superposeout 结束。")))
            previous = None
            for st in items:
                if st.is_element and (previous is None or previous.key != "superpose"):
                    st.issues.append(Issue(ERROR, ("Every element in a superpose block needs one superpose before it.",
                                                   "叠加场中每个元件前要有且只有一个 superpose。")))
                if st.key == "superpose" and previous is not None and previous.key == "superpose":
                    st.issues.append(Issue(ERROR, ("Two superpose lines in a row.", "连续两条 superpose。")))
                previous = st
            rf = [s for s in items if s.key == "field" and s.field_type() == "1"]
            for st in rf[1:]:
                st.issues.append(Issue(WARNING, ("More than one RF cavity in this superpose block.",
                                                 "一组叠加场中只能存在不超过一个射频腔。")))

        if elements:
            for st in (elements[0], elements[-1]):
                if st.category == schema.MATRIX_ELEMENT:
                    st.issues.append(Issue(WARNING, (
                        "Avoid a matrix-model element as first or last element (add a very short drift).",
                        "多粒子模型第一个和最后一个元件避免使用矩阵模型元件，可以加一个极短的 drift。")))

    # ------------------------------------------------------------------ queries
    def elements(self, active_only=True):
        return [s for s in self.statements if s.is_element and (s.active or not active_only)]

    def issue_count(self):
        return sum(len(s.issues) for s in self.statements) + len(self.issues)

    def rf_cavities(self):
        return [s for s in self.statements if s.active and s.key == "field" and s.field_type() == "1"]

    def statement_at(self, line_no):
        return self.by_line.get(line_no)

    def all_lines(self):
        """Every non-blank, non-comment line in file order: statements plus the folding lines.

        This is what the positional readers of ``avas.utils.readfile`` are built on.
        """
        return sorted(self.statements + self.layout, key=lambda s: s.line_no)


# --------------------------------------------------------------------------- editing helpers
def format_statement(st, keyword=None, params=None, name=None, comment=None):
    """Text of *st*'s line with some parts replaced (indent, prefix style and comment kept)."""
    keyword = st.keyword if keyword is None else keyword
    params = list(st.params if params is None else params)
    while params and params[-1] == "":
        params.pop()
    params = [p if p != "" else "0" for p in params]
    prefix_name = st.prefix_name if name is None else name
    if name is not None and st.comment_name and not st.prefix_name:
        prefix_name = ""            # the name lives in a "!name" comment line
    comment = st.comment if comment is None else comment
    if comment and not comment.startswith("!"):
        comment = "! " + comment
    code = (f"{prefix_name} : " if prefix_name else "") + " ".join([keyword] + params)
    return st.indent + code + ((" " + comment) if comment else "")


def rename_edits(st, new_name):
    """List of ``(line_no or None, new_text)`` edits that give *st* the name *new_name*.

    ``line_no`` None means "insert a new line before st.line_no".
    """
    new_name = new_name.strip().replace(" ", "_")
    if st.comment_name and not st.prefix_name:
        if not new_name:
            return [(st.comment_name_line, "")]
        return [(st.comment_name_line, f"{st.indent}!name {new_name}")]
    return [(st.line_no, format_statement(st, name=new_name))]
