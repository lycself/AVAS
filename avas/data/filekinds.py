"""Recognise what a file in InputFile/ is by its content, not only its name.

``detect(path)`` returns one of the ``KIND_*`` constants.  A lattice exported
under an arbitrary name (``lattice_init.txt``, ``48Ca_280MeV.txt``) is still a
lattice; a TraceWin ``.dat`` is recognised by its upper-case keywords and
millimetre units.
"""
import os

from avas.data import schema
from avas.data.fieldmap import EXT_MEANING

KIND_LATTICE = "lattice"                     # AVAS lattice syntax
KIND_GENERATED_LATTICE = "generated_lattice"  # lattice.txt, rewritten before every run
KIND_TRACEWIN_LATTICE = "tracewin_lattice"
KIND_BEAM = "beam"
KIND_INPUT = "input"
KIND_GUI_INI = "gui_ini"
KIND_BOUNDARY = "boundary"
KIND_SCANDATA = "scandata"
KIND_SEPARTICLE = "separticle"
KIND_PARTICLES = "particles"                 # .dst
KIND_PARTICLES_EXT = "particles_ext"         # .edst
KIND_PLT = "plt"
KIND_FIELDMAP = "fieldmap"
KIND_TRACEWIN_PROJECT = "tracewin_project"
KIND_TEXT = "text"
KIND_BINARY = "binary"

SNIFF_BYTES = 256 * 1024
TRACEWIN_WORDS = {"drift", "field_map", "superpose_map", "quad", "solenoid", "bend", "edge", "thin_steering",
                  "match_fam_grad", "match_fam_field", "match_fam_phase", "diag_twiss", "diag_size", "diag_position",
                  "diag_current", "diag_energy", "field_map_path", "lattice", "lattice_end", "end", "set_adv",
                  "freq", "steerer", "cavsin", "ncells", "dtl_cel", "gap", "chopper", "aperture", "error_quad_ncpl_stat"}


def read_head(path, size=SNIFF_BYTES):
    with open(path, "rb") as fh:
        return fh.read(size)


def decode(raw):
    """Text of *raw* or None when it looks binary."""
    if b"\x00" in raw:
        return None
    for enc in ("utf-8", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return None


def detect(path):
    name = os.path.basename(path)
    low = name.lower()
    ext = os.path.splitext(low)[1].lstrip(".")
    if ext in EXT_MEANING:
        return KIND_FIELDMAP
    if ext == "dst":
        return KIND_PARTICLES
    if ext == "edst":
        return KIND_PARTICLES_EXT
    if ext == "plt":
        return KIND_PLT
    try:
        raw = read_head(path)
    except OSError:
        return KIND_BINARY
    if raw.startswith(b"TraceWin_options_file"):
        return KIND_TRACEWIN_PROJECT
    text = decode(raw)
    if text is None:
        return KIND_BINARY
    if low == "ini.ini":
        return KIND_GUI_INI
    if low == "lattice.txt":
        return KIND_GENERATED_LATTICE
    if low == "boundary.txt":
        return KIND_BOUNDARY
    if low == "scandata.txt":
        return KIND_SCANDATA
    if low.startswith("separticle"):
        return KIND_SEPARTICLE
    return classify_text(text, ext)


def classify_text(text, ext=""):
    words, semicolon_comments, upper = [], 0, 0
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith(";"):
            semicolon_comments += 1
            continue
        code = s.split("!", 1)[0].split(";", 1)[0].split()
        if not code:
            continue
        first = code[0]
        if len(code) >= 3 and code[1] == ":":
            first = code[2]
        words.append(first.lower())
        if first.isupper():
            upper += 1
    if not words:
        return KIND_TEXT
    n = len(words)
    lattice_hits = sum(1 for w in words if w in schema.LATTICE_KEYWORDS)
    tracewin_hits = sum(1 for w in words if w in TRACEWIN_WORDS)
    beam_hits = sum(1 for w in words if w in schema.BEAM_KEYWORDS)
    input_hits = sum(1 for w in words if w in schema.INPUT_KEYWORDS)
    tracewin_only = sum(1 for w in words if w in ("field_map", "superpose_map") or w.startswith("match_fam"))
    if tracewin_only and (ext == "dat" or semicolon_comments or upper > n / 2):
        return KIND_TRACEWIN_LATTICE
    if ext == "dat" and tracewin_hits >= n * 0.5:
        return KIND_TRACEWIN_LATTICE
    if lattice_hits >= max(2, n * 0.6) and ("start" in words or any(w in schema.ELEMENT_KEYWORDS for w in words)):
        return KIND_LATTICE
    if beam_hits >= max(2, n * 0.6) and beam_hits >= input_hits:
        return KIND_BEAM
    if input_hits >= max(2, n * 0.6):
        return KIND_INPUT
    return KIND_TEXT


def is_lattice_file(path):
    try:
        return detect(path) == KIND_LATTICE
    except OSError:
        return False


def lattice_files(input_dir):
    """Names of the AVAS-syntax lattices in *input_dir* that can be chosen for the run."""
    if not input_dir or not os.path.isdir(input_dir):
        return []
    names = []
    for name in sorted(os.listdir(input_dir), key=str.lower):
        path = os.path.join(input_dir, name)
        if os.path.isfile(path) and name.lower() != "lattice.txt" and os.path.getsize(path) <= 20 * 1024 * 1024:
            if os.path.splitext(name)[1].lower() in (".txt", ".lat", ".dat", "") and is_lattice_file(path):
                names.append(name)
    return names
