"""Physical meaning of every keyword in the AVAS input files.

Single source of truth for the GUI editors (property forms, parameter grids,
keyword tables, tooltips) and for validation.  The content follows the user
manual ``docs/使用说明20260427.docx``; where the manual is silent the entry
says so instead of guessing.

Texts are bilingual ``(english, chinese)`` pairs, chosen at display time with
:func:`avas.i18n.pick`.
"""

# --------------------------------------------------------------------------- building blocks
FLOAT, INT, ENUM, FLAG, TEXT, FIELDMAP, FILE, RESERVED = (
    "float", "int", "enum", "flag", "text", "fieldmap", "file", "reserved")


class Param:
    """One positional parameter of a keyword."""

    __slots__ = ("key", "label", "unit", "kind", "doc", "choices")

    def __init__(self, key, label, unit="", kind=FLOAT, doc=("", ""), choices=None):
        self.key = key
        self.label = label            # (en, zh)
        self.unit = unit
        self.kind = kind
        self.doc = doc                # (en, zh)
        self.choices = choices or []  # [(value, (en, zh))]

    def choice_value(self, value):
        """The listed choice equal to *value* ("3.0" matches "3"), or None."""
        for v, _text in self.choices:
            if str(v).lower() == str(value).lower():
                return v
        try:
            number = float(value)
        except (TypeError, ValueError):
            return None
        for v, _text in self.choices:
            try:
                if float(v) == number:
                    return v
            except ValueError:
                continue
        return None

    def choice_label(self, value):
        v = self.choice_value(value)
        return dict(self.choices)[v] if v is not None else None


class Keyword:
    """A lattice command / element, or a keyword of beam.txt / input.txt."""

    __slots__ = ("key", "title", "category", "params", "doc", "min_params")

    def __init__(self, key, title, category, params=(), doc=("", ""), min_params=None):
        self.key = key
        self.title = title            # (en, zh)
        self.category = category
        self.params = list(params)
        self.doc = doc
        self.min_params = len(self.params) if min_params is None else min_params


def P(key, en, zh, unit="", kind=FLOAT, doc_en="", doc_zh="", choices=None):
    return Param(key, (en, zh), unit, kind, (doc_en, doc_zh), choices)


def reserved(doc_en="reserved, write 0", doc_zh="保留参数，写 0"):
    return Param("reserved", ("0", "0"), "", RESERVED, (doc_en, doc_zh))


# lattice categories
FIELD_ELEMENT = "field_element"      # t-code, needs a field map
MATRIX_ELEMENT = "matrix_element"    # z-code, transfer matrix
DIAG = "diag"
SUPERPOSE = "superpose"
STRUCTURE = "structure"
OUTPUT = "output"
ERROR = "error"
ERROR_SWITCH = "error_switch"
ADJUST = "adjust"
OTHER = "other"

ELEMENT_CATEGORIES = (FIELD_ELEMENT, MATRIX_ELEMENT, DIAG)

LENGTH = P("L", "Length L", "长度 L", "m")
APERTURE = P("R", "Aperture R", "半径 R", "m", doc_en="beam pipe radius used for loss detection",
             doc_zh="孔径半径，用于判断束流损失")
HV = P("HV", "Plane HV", "方向 HV", kind=ENUM,
       choices=[("0", ("horizontal (x)", "水平 (x)")), ("1", ("vertical (y)", "垂直 (y)"))])

FIELD_TYPES = [("1", ("RF field", "高频场")), ("2", ("static electric field", "静电场")),
               ("3", ("static magnetic field", "静磁场"))]
PHASE_REFS = [("0", ("synchronous phase", "同步相位")),
              ("1", ("RF phase at particle entry", "粒子到入口的 RF 相位")),
              ("2", ("RF phase at t = 0", "t=0 时刻的 RF 相位"))]
ERROR_DISTRIBUTIONS = [("0", ("fixed value", "固定值误差")), ("1", ("uniform", "均匀分布")),
                       ("2", ("Gaussian", "高斯分布")), ("-1", ("equal steps", "等步长误差（等价于 TraceWin 的 0 类型）"))]

N_FOLLOWING = P("N", "Elements N", "作用元件数 N", kind=INT,
                doc_en="number of following elements affected; use a large value for all",
                doc_zh="作用于命令下面元件的数量，想作用于所有元件可填写一个较大值")
ERR_R = P("r", "Distribution r", "误差类型 r", kind=ENUM, choices=ERROR_DISTRIBUTIONS)

# error columns, in file order (after N and r); the *_on switches reuse the same order
BEAM_ERRORS = [
    P("dx", "dx", "dx", "mm"), P("dy", "dy", "dy", "mm"), P("dphi", "dφ", "dφ", "°"),
    P("dxp", "dx'", "dx'", "mrad"), P("dyp", "dy'", "dy'", "mrad"), P("dE", "dE", "dE", "MeV"),
    P("dEx", "dεx", "dεx", "%", doc_en="emittance error", doc_zh="发射度误差"),
    P("dEy", "dεy", "dεy", "%", doc_en="emittance error", doc_zh="发射度误差"),
    P("dEz", "dεz", "dεz", "%", doc_en="emittance error", doc_zh="发射度误差"),
    P("mx", "mx", "mx", doc_en="not described in the manual", doc_zh="手册未说明"),
    P("my", "my", "my", doc_en="not described in the manual", doc_zh="手册未说明"),
    P("mz", "mz", "mz", doc_en="not described in the manual", doc_zh="手册未说明"),
    P("dIb", "dIb", "dIb", "mA", doc_en="beam current error", doc_zh="流强误差"),
]
QUAD_ERRORS = [
    P("dx", "dx", "dx", "mm"), P("dy", "dy", "dy", "mm"), P("dphix", "dφx", "dφx", "°"),
    P("dphiy", "dφy", "dφy", "°"), P("dphiz", "dφz", "dφz", "°"),
    P("dG", "dG", "dG", "%", doc_en="field / gradient error", doc_zh="场强（梯度）误差"),
    P("dz", "dz", "dz", "mm"),
    P("Nb", "Nb", "Nb", kind=TEXT, doc_en="not described in the manual", doc_zh="手册未说明"),
]
CAV_ERRORS = [
    P("dx", "dx", "dx", "mm"), P("dy", "dy", "dy", "mm"), P("dphix", "dφx", "dφx", "°"),
    P("dphiy", "dφy", "dφy", "°"),
    P("kekb", "ke/kb", "ke/kb", "%", doc_en="field amplitude error", doc_zh="场幅值误差"),
    P("phis", "φs", "φs", "°", doc_en="phase error", doc_zh="相位误差"),
    P("dz", "dz", "dz", "mm"),
    P("Nb", "Nb", "Nb", kind=TEXT, doc_en="not described in the manual", doc_zh="手册未说明"),
]


def _switches(columns):
    return [Param(p.key, p.label, "", FLAG, ("0: off, 1: on", "0 关闭，1 开启")) for p in columns]


SUPERPOSE_PARAMS = [
    P("z0", "z0", "z0", "m", doc_en="entrance of the next element relative to the first superpose",
      doc_zh="下一个元件入口相对于第一条 superpose 后元件入口的纵向位置"),
    P("x0", "x0", "x0", "m", doc_en="only used when the block ends with superposeout",
      doc_zh="仅当以 superposeout 结束时生效"),
    P("y0", "y0", "y0", "m", doc_en="only used when the block ends with superposeout",
      doc_zh="仅当以 superposeout 结束时生效"),
    P("thz0", "θz0", "θz0", "°", doc_en="only used when the block ends with superposeout",
      doc_zh="仅当以 superposeout 结束时生效"),
    P("thx0", "θx0", "θx0", "°", doc_en="only used when the block ends with superposeout",
      doc_zh="仅当以 superposeout 结束时生效"),
    P("thy0", "θy0", "θy0", "°", doc_en="only used when the block ends with superposeout",
      doc_zh="仅当以 superposeout 结束时生效"),
]

_SUPERPOSE_DOC = (
    "Overlapping fields.  The first superpose of a block must be all zeros; every element inside the block "
    "needs exactly one superpose in front of it; end the block with superposeend or superposeout "
    "(only superposeout makes x0, y0 and the angles effective).  At most one RF cavity per block.",
    "叠加场。第一条 superpose 的参数必须全为 0，作为其他 superpose 的零点；叠加场中每个元件前有且只有一个 "
    "superpose；以 superposeend 或 superposeout 结束，只有以 superposeout 结束时 z0 以外的参数才生效；"
    "一组叠加场中最多一个射频腔。")

# --------------------------------------------------------------------------- lattice keywords
_LATTICE = [
    # ---- field-model elements (t-code) --------------------------------------------------
    Keyword("drift", ("Drift", "漂移段"), FIELD_ELEMENT, [LENGTH, APERTURE, reserved()],
            ("Field-free drift.", "漂移段（场模型元件，t-code）。")),
    Keyword("field", ("Field map", "场图元件"), FIELD_ELEMENT, [
        LENGTH, APERTURE,
        P("V3", "Phase reference V3", "相位含义 V3", kind=ENUM, choices=PHASE_REFS,
          doc_en="what the phase parameter means", doc_zh="决定后面“相位”参数的含义"),
        P("type", "Field type", "场类型", kind=ENUM, choices=FIELD_TYPES,
          doc_en="for static fields write 0 for the RF-only parameters",
          doc_zh="对于静磁场，不存在的参数写 0 即可"),
        P("f", "Frequency", "频率", "Hz", doc_en="RF only, 0 for static fields", doc_zh="仅高频场，静态场写 0"),
        P("phase", "Phase", "相位", "°", doc_en="meaning set by V3", doc_zh="含义由 V3 决定"),
        P("Ke", "Ke", "Ke", doc_en="electric field factor", doc_zh="电场系数"),
        P("Kb", "Kb", "Kb", doc_en="magnetic field factor", doc_zh="磁场系数"),
        P("file", "Field map", "场文件名", kind=FIELDMAP,
          doc_en="base name of the field map files (.edx/.bdx/.bsx ...), without extension",
          doc_zh="场分布文件名（不含扩展名）"),
    ], ("Element described by a field map, tracked with the t-code.",
        "用户给出元件的电磁场分布文件，AVAS 采用 t-code 模拟。")),
    # ---- matrix-model elements (z-code) -----------------------------------------------
    Keyword("quad", ("Quadrupole", "四极铁"), MATRIX_ELEMENT,
            [LENGTH, APERTURE, reserved(), P("G", "Gradient G", "磁场梯度 G", "T/m")],
            ("Matrix-model element (z-code).  Avoid as first or last element of a multi-particle lattice.",
             "矩阵模型元件（z-code）。多粒子模型第一个和最后一个元件避免使用矩阵模型元件。")),
    Keyword("solenoid", ("Solenoid", "螺线管"), MATRIX_ELEMENT,
            [LENGTH, APERTURE, reserved(), P("B", "Field B", "磁场 B", "T")],
            ("Matrix-model element (z-code).", "矩阵模型元件（z-code）。")),
    Keyword("bend", ("Dipole", "二极铁"), MATRIX_ELEMENT, [
        P("arc", "|αρ|", "|αρ|", "m", doc_en="write 0, the length is computed from α and ρ",
          doc_zh="长度，写 0 即可，程序根据 α 和 ρ 自动计算"),
        APERTURE, reserved(),
        P("alpha", "Bend angle α", "偏转角 α", "°", doc_en="bending angle in the rotation plane",
          doc_zh="旋转平面上的弯曲角度"),
        P("rho", "Radius ρ", "曲率半径 ρ", "m", doc_en="curvature radius of the reference orbit",
          doc_zh="中心轨迹的曲率半径"),
        P("N", "Field index N", "场梯度指数 N"),
        HV,
    ], ("Matrix-model element (z-code).", "矩阵模型元件（z-code）。")),
    Keyword("steerer", ("Steerer", "校正铁"), MATRIX_ELEMENT, [
        reserved("length must be 0: it acts over the next element, centred on it",
                 "长度必须为 0，默认长度等于下个元件长度并位于下个元件中间"),
        APERTURE, reserved(),
        P("Bx", "Bx / Ex", "Bx / Ex", "T or V/m"), P("By", "By / Ey", "By / Ey", "T or V/m"),
        P("kind", "Kind", "类型", kind=ENUM, choices=[("0", ("magnetic", "磁场校正铁")),
                                                     ("1", ("electric", "电场校正铁"))]),
        P("max", "Maximum", "最大值"),
    ], ("Corrector acting over the next element.", "校正铁，作用于下一个元件。")),
    Keyword("edge", ("Dipole edge", "二极铁边缘"), MATRIX_ELEMENT, [
        reserved(), APERTURE, reserved(),
        P("beta", "Pole-face angle β", "极面旋转角 β", "°"),
        P("rho", "Radius ρ", "曲率半径 ρ", "m"),
        P("G", "Gap G", "磁体总间隙 G", "m"),
        P("K1", "K1", "K1", doc_en="fringe-field factor", doc_zh="边缘场因子"),
        P("K2", "K2", "K2", doc_en="fringe-field factor", doc_zh="边缘场因子"),
        HV,
    ], ("Dipole entrance/exit edge.", "二极铁边缘。")),
    # ---- diagnostics ------------------------------------------------------------------
    Keyword("diag_energy", ("Energy target", "能量束诊"), DIAG, [
        reserved("meaningless, write 0", "无意义，填写 0"), P("W", "Target energy W", "目标能量 W", "MeV"),
        reserved("meaningless, write 0", "无意义，填写 0")],
        ("Diagnostic used by the error correction.", "束诊命令，供误差校正使用。")),
    Keyword("diag_size", ("Size target", "包络束诊"), DIAG, [
        reserved(), P("sx", "sx", "sx", "mm", doc_en="x envelope", doc_zh="x 方向包络"),
        P("sy", "sy", "sy", "mm", doc_en="y envelope", doc_zh="y 方向包络"), reserved()],
        ("Diagnostic used by the error correction.", "束诊命令，供误差校正使用。")),
    Keyword("diag_position", ("Position target", "位置束诊"), DIAG, [
        reserved(), P("x", "x", "x", "mm", doc_en="x centre", doc_zh="x 方向中心位置"),
        P("y", "y", "y", "mm", doc_en="y centre", doc_zh="y 方向中心位置"), reserved()],
        ("Diagnostic used by the error correction.", "束诊命令，供误差校正使用。")),
    # ---- superpose ------------------------------------------------------------------
    Keyword("superpose", ("Superpose", "叠加场"), SUPERPOSE, SUPERPOSE_PARAMS, _SUPERPOSE_DOC, min_params=1),
    Keyword("superposeend", ("Superpose end", "叠加场结束"), SUPERPOSE, [], _SUPERPOSE_DOC),
    Keyword("superposeout", ("Superpose out", "叠加场结束（含偏移）"), SUPERPOSE, SUPERPOSE_PARAMS, _SUPERPOSE_DOC,
            min_params=0),
    # ---- structure ------------------------------------------------------------------
    Keyword("start", ("Start", "lattice 开始"), STRUCTURE, [],
            ("Only lines between the first start and the first end are simulated.",
             "只模拟第一个 start 之后到第一个 end 之前的内容。")),
    Keyword("end", ("End", "lattice 结束"), STRUCTURE, [],
            ("Only lines between the first start and the first end are simulated.",
             "只模拟第一个 start 之后到第一个 end 之前的内容。")),
    Keyword("lattice", ("Period start", "lattice 周期起点"), STRUCTURE, [
        P("n1", "Elements per period", "每个基础 lattice 的元件数", kind=INT),
        P("n2", "n2", "n2", kind=INT, doc_en="write 1", doc_zh="写为 1")],
        ("Start of a periodic lattice (used by the phase-advance analysis).", "lattice 起点（相移分析使用）。")),
    Keyword("lattice_end", ("Period end", "lattice 周期终点"), STRUCTURE, []),
    # ---- output ---------------------------------------------------------------------
    Keyword("outputplane", ("Output plane", "输出平面"), OUTPUT, [
        P("V1", "Relative position", "相对位置", "m", doc_en="downstream (>0) or upstream (<0) of this line",
          doc_zh="在关键字所在位置的下游（正值）或上游（负值）输出束流分布")],
        ("Dump the beam distribution at a plane.", "输出束流分布。")),
    Keyword("automaticoutput", ("Automatic output planes", "自动输出平面"), OUTPUT, [
        P("V1", "First plane", "第一个输出平面位置", "m"), P("V2", "Spacing", "输出平面间距", "m"),
        P("V3", "Maximum span", "第一个到最后一个的最大间距", "m")],
        ("Insert equally spaced output planes.", "按等间距批量插入输出平面。")),
    Keyword("spacechargecomp", ("Space-charge compensation", "空间电荷补偿"), OTHER, [],
            ("Not described in the manual.", "手册未说明。"), min_params=0),
    # ---- errors ---------------------------------------------------------------------
    Keyword("err_step", ("Error groups", "误差分组"), ERROR, [
        P("a", "Groups", "分组数", kind=INT), P("b", "Runs per group", "每组运行次数", kind=INT)],
        ("Error study: results go to OutputFile/error_output.", "误差分析，结果放在 OutputFile/error_output 下。")),
    Keyword("err_beam_dyn", ("Beam error (dynamic)", "初始束团误差（动态）"), ERROR, [ERR_R] + BEAM_ERRORS,
            ("Unfilled trailing parameters mean no error.", "不需要写满参数，后续空置参数默认不设置误差。"),
            min_params=1),
    Keyword("err_beam_stat", ("Beam error (static)", "初始束团误差（静态）"), ERROR, [reserved()] + BEAM_ERRORS,
            ("Unfilled trailing parameters mean no error.", "不需要写满参数，后续空置参数默认不设置误差。"),
            min_params=1),
]
for _mode, _mode_title in (("dyn", ("dynamic", "动态")), ("stat", ("static", "静态"))):
    for _cpl, _cpl_title in (("ncpl", ("", "")), ("cpl", (", coupled", "，耦合"))):
        _doc = ("Unfilled trailing parameters mean no error." if _cpl == "ncpl"
                else "Coupled variant; not described in the manual, same columns as ncpl.",
                "不需要写满参数，后续空置参数默认不设置误差。" if _cpl == "ncpl"
                else "耦合误差，手册未说明，参数与 ncpl 相同。")
        _LATTICE.append(Keyword(
            f"err_quad_{_cpl}_{_mode}",
            (f"Static-field element error ({_mode_title[0]}{_cpl_title[0]})", f"静磁元件误差（{_mode_title[1]}{_cpl_title[1]}）"),
            ERROR, [N_FOLLOWING, ERR_R] + QUAD_ERRORS, _doc, min_params=2))
        _LATTICE.append(Keyword(
            f"err_cav_{_cpl}_{_mode}",
            (f"RF cavity error ({_mode_title[0]}{_cpl_title[0]})", f"射频腔误差（{_mode_title[1]}{_cpl_title[1]}）"),
            ERROR, [N_FOLLOWING, ERR_R] + CAV_ERRORS, _doc, min_params=2))
    _LATTICE += [
        Keyword(f"err_beam_{_mode}_on", (f"Beam error switches ({_mode_title[0]})", f"束团误差开关（{_mode_title[1]}）"),
                ERROR_SWITCH, _switches(BEAM_ERRORS),
                ("0 disables, 1 enables the error in the same column.", "每个参数只能写 0 或 1，0 关闭、1 开启对应误差。"),
                min_params=1),
        Keyword(f"err_quad_{_mode}_on", (f"Static element error switches ({_mode_title[0]})",
                                         f"静磁元件误差开关（{_mode_title[1]}）"),
                ERROR_SWITCH, _switches(QUAD_ERRORS[:-1]),
                ("0 disables, 1 enables the error in the same column.", "每个参数只能写 0 或 1，0 关闭、1 开启对应误差。"),
                min_params=1),
        Keyword(f"err_cav_{_mode}_on", (f"RF cavity error switches ({_mode_title[0]})", f"射频腔误差开关（{_mode_title[1]}）"),
                ERROR_SWITCH, _switches(CAV_ERRORS[:-1]),
                ("0 disables, 1 enables the error in the same column.", "每个参数只能写 0 或 1，0 关闭、1 开启对应误差。"),
                min_params=1),
    ]
_LATTICE.append(Keyword("adjust", ("Correction knob", "静态误差校正"), ADJUST, [
    reserved("meaningless for now, write 0", "目前无意义，写 0 即可"),
    P("v", "Parameter index v", "修改第 v 个参数", kind=INT, doc_en="which parameter of the next element is varied",
      doc_zh="修改下面元件的第 v 个参数"),
    P("n", "Group n", "联动编号 n", kind=INT, doc_en="elements with the same n get the same value (default 0)",
      doc_zh="具有相同 n 的元件矫正时取相同的值，默认为 0"),
    P("min", "Minimum", "最小值"), P("max", "Maximum", "最大值"),
    P("first_step", "Start from current value", "使用初值", kind=ENUM,
      choices=[("0", ("no", "不使用元件初值")), ("1", ("yes", "使用元件初值作为梯度下降初始值"))]),
], ("Static error correction knob for the next element.", "静态误差校正，作用于下面的元件。")))

LATTICE_KEYWORDS = {k.key: k for k in _LATTICE}
ELEMENT_KEYWORDS = [k.key for k in _LATTICE if k.category in ELEMENT_CATEGORIES]


def lattice_keyword(name):
    return LATTICE_KEYWORDS.get((name or "").lower())


# --------------------------------------------------------------------------- beam.txt
_BEAM = [
    Keyword("readparticledistribution", ("Particle file", "粒子分布文件"), "beam",
            [P("file", "File", "文件", kind=FILE)],
            ("Existing distribution (.dst/.edst); when used, every keyword except numofcharge is ignored.",
             "导入已有束团分布的文件；导入时除 numofcharge 外的关键字均不生效。")),
    Keyword("use_dst", ("Use particle file", "使用粒子文件"), "beam",
            [P("V1", "Use", "使用", kind=ENUM, choices=[("0", ("generate", "按参数生成")),
                                                        ("1", ("read file", "读取粒子文件"))])],
            ("GUI switch for readparticledistribution (not in the manual).", "界面使用的开关（手册未收录）。")),
    Keyword("numofcharge", ("Charge state", "电荷数"), "beam", [P("V1", "Charge", "电荷", "e")],
            ("Charge of the particles in units of e.", "束团电荷量（单位 e）。")),
    Keyword("particlerestmass", ("Rest mass", "静止质量"), "beam", [P("V1", "Mass", "质量", "MeV")]),
    Keyword("particlenumber", ("Macro particles", "宏粒子数"), "beam", [P("V1", "Number", "数量", kind=INT)],
            ("1 switches to single-particle tracking.", "设置为 1 时进行单粒子输运。")),
    Keyword("kindofparticle", ("Particle kind", "粒子种类"), "beam", [P("V1", "Kind", "种类", kind=TEXT)]),
    Keyword("distribution", ("Distribution", "分布类型"), "beam", [
        P("V1", "Transverse", "横向", kind=ENUM, choices=[(d, (d, d)) for d in ("KV", "GS", "PB", "WB")]),
        P("V2", "Longitudinal", "纵向", kind=ENUM, choices=[(d, (d, d)) for d in ("KV", "GS", "PB", "WB")])]),
    Keyword("twissx", ("Twiss x", "Twiss x"), "beam", [
        P("alpha", "α", "α"), P("beta", "β", "β", "mm/π·mrad"), P("emit", "ε", "ε", "π·mm·mrad")]),
    Keyword("twissy", ("Twiss y", "Twiss y"), "beam", [
        P("alpha", "α", "α"), P("beta", "β", "β", "mm/π·mrad"), P("emit", "ε", "ε", "π·mm·mrad")]),
    Keyword("twissz", ("Twiss z", "Twiss z"), "beam", [
        P("alpha", "α", "α"), P("beta", "β", "β", doc_en="same convention as x/y", doc_zh="同上"),
        P("emit", "ε", "ε", doc_en="same convention as x/y", doc_zh="同上")]),
    Keyword("frequency", ("Beam frequency", "束流频率"), "beam", [P("V1", "f", "f", "Hz")]),
    Keyword("current", ("Beam current", "束流电流"), "beam", [P("V1", "I", "I", "mA")]),
    Keyword("kneticenergy", ("Kinetic energy", "动能"), "beam", [P("V1", "W", "W", "MeV")],
            ("Not in the manual table; written by the Beam page.", "手册表格未收录，由束流页写入。")),
    Keyword("beamtype", ("Beam type", "束流类型"), "beam", [
        P("V1", "Type", "类型", kind=ENUM, choices=[("dc", ("DC beam", "直流束")), ("notdc", ("bunched", "束团"))])],
        ("dc generates a DC beam.", "设置为 dc 时生成直流束流。")),
    Keyword("randomseed", ("Random seed", "随机数种子"), "beam", [P("V1", "Seed", "种子", kind=INT)],
            ("Seed used when generating the beam.", "生成束流时所用的随机数。")),
    Keyword("initpos", ("Initial offset", "初始位置偏移"), "beam", [
        P("x", "x", "x", "mm"), P("y", "y", "y", "mm"), P("z", "z", "z", "mm")]),
    Keyword("initmom", ("Initial angle", "初始角度偏移"), "beam", [
        P("xp", "x'", "x'", "mrad"), P("yp", "y'", "y'", "mrad"), P("zp", "z'", "z'", "mrad")]),
    Keyword("displacepos", ("Single-particle offset", "单粒子位置偏移"), "beam", [
        P("dx", "dx", "dx", "m"), P("dy", "dy", "dy", "m"), P("dz", "dz", "dz", "m")],
        ("Single-particle mode (particlenumber 1).", "单粒子模拟时生效。")),
    Keyword("displacedpos", ("Single-particle momentum offset", "单粒子动量偏移"), "beam", [
        P("dpx", "dpx", "dpx", "%"), P("dpy", "dpy", "dpy", "%"), P("dpz", "dpz", "dpz", "%")],
        ("Single-particle mode (particlenumber 1).", "单粒子模拟时生效。")),
]

# --------------------------------------------------------------------------- input.txt
_ONOFF = [("0", ("off", "关闭")), ("1", ("on", "开启"))]
_INPUT = [
    Keyword("sim_type", ("Model", "模拟类型"), "input", [
        P("V1", "Model", "模型", kind=ENUM, choices=[("mulp", ("multi-particle", "多粒子")),
                                                     ("env", ("envelope", "包络"))])]),
    Keyword("multithreading", ("Multithreading", "多线程"), "input", [P("V1", "On", "开关", kind=ENUM, choices=_ONOFF)]),
    Keyword("steppercycle", ("Steps per RF period", "推进步长"), "input", [
        P("V1", "Main beam V1", "主束 V1", kind=INT, doc_en="Δt = 1/T × 1/V1", doc_zh="Δt = 1/T × 1/V1"),
        P("V2", "Secondary V2", "次级粒子 V2", doc_en="Δt = V2/Vb (secondary particles)", doc_zh="Δt = V2/Vb（次级粒子传输）")],
        min_params=1),
    Keyword("scanphase", ("Phase scan", "相位扫描"), "input", [
        P("V1", "Mode", "方式", kind=ENUM, choices=[("0", ("no scan", "不扫描")), ("1", ("scan", "扫描相位")),
                                                    ("2", ("read scanData.txt", "从文件读取相位"))])]),
    Keyword("spacecharge", ("Space charge", "空间电荷效应"), "input", [P("V1", "On", "开关", kind=ENUM, choices=_ONOFF)]),
    Keyword("scmethod", ("Space-charge solver", "空间电荷算法"), "input", [
        P("V1", "Solver", "算法", kind=ENUM, choices=[("FFT", ("FFT", "FFT")), ("PICNIC", ("PICNIC", "PICNIC")),
                                                      ("SPICNIC", ("SPICNIC", "SPICNIC"))])]),
    Keyword("numofgrid", ("Grid points", "网格数"), "input", [
        P("Nx", "Nx", "Nx", kind=INT), P("Ny", "Ny", "Ny", kind=INT), P("Nz", "Nz", "Nz", kind=INT)]),
    Keyword("meshrms", ("Grid size", "网格边长"), "input", [
        P("V1", "x factor", "x 系数", doc_en="Lx = V1 × x RMS × 2", doc_zh="Lx = V1 × x 方向 RMS 尺寸 × 2"),
        P("V2", "y factor", "y 系数", doc_en="Ly = V2 × y RMS × 2", doc_zh="Ly = V2 × y 方向 RMS 尺寸 × 2"),
        P("V3", "z factor", "z 系数", doc_en="Lz = V3 × z RMS × 2", doc_zh="Lz = V3 × z 方向 RMS 尺寸 × 2")]),
    Keyword("dumpperiodicity", ("Dump every N steps", "输出间隔"), "input", [
        P("V1", "N", "N", kind=INT, doc_en="0 = no dump", doc_zh="每 V1 步输出一次，0 表示不输出")]),
    Keyword("longlimits", ("Longitudinal loss limits", "纵向损失边界"), "input", [
        P("V1", "Enabled", "启用", kind=ENUM, choices=[("0", ("disabled", "禁用")), ("1", ("enabled", "启用"))]),
        P("V2", "Phase limit", "相位边界", "°"), P("V3", "Energy limit", "能量边界", "MeV")]),
    Keyword("boundary", ("Separate loss boundary", "单独设置损失边界"), "input", [
        P("V1", "Use boundary.txt", "使用 boundary.txt", kind=ENUM, choices=[("0", ("no", "否")), ("1", ("yes", "是"))])],
        ("When on, lattice apertures are ignored and boundary.txt is used.",
         "单独设置边界时，lattice 中的半径不再生效，按 boundary.txt 判断束流损失。")),
    Keyword("pchistogram", ("Particle histogram", "粒子分布直方图"), "input", [
        P("V1", "Enabled", "启用", kind=ENUM, choices=_ONOFF), P("V2", "Bins", "份数", kind=INT)],
        ("Writes pchistogram.dat.", "V1 为 1 时生成 pchistogram.dat，每个方向分为 V2 等份。"), min_params=1),
    Keyword("secondarybeam", ("Secondary beam", "二次粒子输运"), "input", [
        P("V1", "On", "开关", kind=ENUM, choices=_ONOFF)],
        ("Reads SeParticle.txt; synchronous particle still needed in beam.txt.",
         "读取 SeParticle.txt，仍需在 beam.txt 中设置同步粒子信息。")),
    Keyword("randomseed", ("Random seed", "随机数种子"), "input", [P("V1", "Seed", "种子", kind=INT)]),
    Keyword("spacechargelong", ("Space-charge step (envelope)", "空间电荷步长（包络）"), "input",
            [P("V1", "Step", "步长", "m")], ("Envelope model only.", "只对包络模型起效。")),
    Keyword("spacechargetype", ("Space charge (envelope)", "空间电荷（包络）"), "input",
            [P("V1", "Type", "类型", kind=INT)], ("Envelope model only.", "只对包络模型起效。")),
]

BEAM_KEYWORDS = {k.key: k for k in _BEAM}
INPUT_KEYWORDS = {k.key: k for k in _INPUT}

# --------------------------------------------------------------------------- ini.ini (GUI settings)
INI_KEYS = {
    ("project", "project_path"): (("Old project path (unused)", "旧版项目路径（不再使用）"), TEXT),
    ("project", "fieldSource"): (("Field-map directory; empty = InputFile", "场图目录，空表示 InputFile"), TEXT),
    ("lattice", "length"): (("Unused", "未使用"), TEXT),
    ("lattice", "source"): (("Lattice file used for the run; empty = lattice_mulp.txt",
                             "运行时使用的结构文件，空表示 lattice_mulp.txt"), TEXT),
    ("input", "sim_type"): (("mulp = multi-particle, env = envelope", "mulp 多粒子，env 包络"), TEXT),
    ("input", "device"): (("cpu or gpu", "cpu 或 gpu"), TEXT),
    ("match", "cal_input_twiss"): (("Matching option", "匹配选项"), TEXT),
    ("match", "match_with_twiss"): (("Matching option", "匹配选项"), TEXT),
    ("match", "use_initial_value"): (("Matching option", "匹配选项"), TEXT),
    ("error", "error_type"): (("Error study: empty, stat, dyn or stat_dyn", "误差分析：空、stat、dyn、stat_dyn"), TEXT),
    ("error", "seed"): (("Random seed of the error study", "误差分析随机种子"), TEXT),
    ("error", "if_normal"): (("1 = also run the error-free reference", "1 表示同时运行无误差参考"), TEXT),
}

# --------------------------------------------------------------------------- tables
SEPARTICLE_COLUMNS = [
    (("x", "x"), "m"), (("y", "y"), "m"), (("z", "z"), "m"), (("vx", "vx"), "m/s"), (("vy", "vy"), "m/s"),
    (("vz", "vz"), "m/s"), (("charge", "电荷"), "e"), (("mass", "质量"), "MeV"), (("weight", "权重"), ""),
    (("time", "时间"), "s"), (("kind", "种类"), ""),
]

# TraceWin lattice (read-only view); only captions we are sure about
TRACEWIN_PARAMS = {
    "drift": [("L", "mm"), ("R", "mm"), ("Ry", "mm"), ("Rx shift", "mm"), ("Ry shift", "mm")],
    "field_map": [("geom", ""), ("L", "mm"), ("θ", "°"), ("R", "mm"), ("kb", ""), ("ke", ""), ("ki", ""),
                  ("ka", ""), ("file", ""), ("P", "")],
    "quad": [("L", "mm"), ("G", "T/m"), ("R", "mm")],
    "solenoid": [("L", "mm"), ("B", "T"), ("R", "mm")],
    "superpose_map": [("z0", "mm")],
}
