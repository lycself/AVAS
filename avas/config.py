"""Runtime configuration and small lookup tables.

Merged from the former ``conf/setting.py`` and ``conf/contants.py``.
"""
import sys

# 运行环境: windows 或 linux（由解释器平台决定）
run_env = "windows" if sys.platform.startswith("win") else "linux"

# 1 = write log files under avas.paths.LOG_DIR, 0 = disable logging
if_logger = 1

dst_picture_title_dict = {
    "x": "X(mm)",
    "y": "Y(mm)",
    "z": "Z(mm)",
    "x1": "X'(mrad)",
    "y1": "Y'(mrad)",
    "z1": "Z'(mrad)",
    "phi": "Φ(deg)",
    "w": "W(MeV)",
    "w_minus_mean": "W(MeV)",
    "dp_p_100": "dp/p(%)",
    "dp_p": "dp/p",
}

option_type_dict = {
    "X": "x",
    "Y": "y",
    "Z": "z",
    "X'": "x1",
    "Y'": "y1",
    "Z'": "z1",
    "Φ": "phi",
    "W": "w_minus_mean",
    "dp/p": "dp_p_100",
}
