"""Golden tests for the legacy lattice readers ``read_lattice_mulp`` / ``read_lattice_mulp_with_name``.

The run path, the error study and the post-processing consume the positional
lists these two functions return.  ``tests/fixtures/lattice_parsers_golden.json``
records, for every lattice file listed in ``CANDIDATES`` that exists, exactly
what they returned before the readers were rebuilt on top of
``avas.data.lattice_doc.LatticeDocument``: token lists, token types, the names
list, or the exception.  Regenerate on purpose only::

    .venv\\Scripts\\python.exe tests/test_lattice_parsers.py --regen
"""
import json
import os
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from avas.utils import readfile  # noqa: E402

GOLDEN = os.path.join(ROOT, "tests", "fixtures", "lattice_parsers_golden.json")
# relative to the repository root; absent files are skipped
CANDIDATES = [
    "examples/hwr010/InputFile/lattice_mulp.txt",
    "examples/hwr010/InputFile/lattice.txt",
    "examples/hwr010/InputFile/lattice_env.txt",
    "examples/hwr010/InputFile/match_no_command.txt",
    "tests/_output_gui/project/InputFile/lattice_mulp.txt",
    "tests/_output_gui/project/InputFile/lattice_env.txt",
    "InputFile1/InputFile/lattice_mulp.txt",          # CAFe 48Ca linac, when the user's copy is present
    "InputFile1/InputFile/lattice_init.txt",
    "tests/fixtures/lattice_odd_cases.txt",           # BOM, CRLF, tabs, !name, sections, periods, superpose
    "tests/fixtures/lattice_no_start.txt",
]


def _plain(rows):
    """JSON-comparable copy of the rows (numpy floats become floats)."""
    return json.loads(json.dumps(rows))


def _record_call(fn, path):
    try:
        result = fn(path)
    except Exception as exc:  # noqa: BLE001 - the exception is part of the golden behaviour
        return {"error": f"{type(exc).__name__}: {exc}"}
    if isinstance(result, tuple):
        rows, names = result
    else:
        rows, names = result, None
    rec = {"rows": _plain(rows), "types": [[type(v).__name__ for v in row] for row in rows]}
    if names is not None:
        rec["names"] = list(names)
    return rec


def record(rel_path):
    path = os.path.join(ROOT, rel_path)
    return {"read_lattice_mulp": _record_call(readfile.read_lattice_mulp, path),
            "read_lattice_mulp_with_name": _record_call(readfile.read_lattice_mulp_with_name, path)}


def present():
    return [p for p in CANDIDATES if os.path.isfile(os.path.join(ROOT, p))]


def regen():
    golden = {p: record(p) for p in present()}
    with open(GOLDEN, "w", encoding="utf-8") as fh:
        json.dump(golden, fh, indent=1, ensure_ascii=False)
    print(f"{len(golden)} files recorded in {GOLDEN}")


@pytest.fixture(scope="module")
def golden():
    with open(GOLDEN, encoding="utf-8") as fh:
        return json.load(fh)


@pytest.mark.parametrize("rel_path", present())
def test_legacy_readers_match_golden(golden, rel_path):
    assert rel_path in golden, f"{rel_path} is not in the golden file; run tests/test_lattice_parsers.py --regen"
    got = record(rel_path)
    for fn in ("read_lattice_mulp", "read_lattice_mulp_with_name"):
        assert got[fn] == golden[rel_path][fn], fn


def test_odd_cases_are_covered_by_the_fixture():
    """The fixture exercises the cases the readers must keep handling."""
    rows, names = readfile.read_lattice_mulp_with_name(os.path.join(ROOT, "tests", "fixtures", "lattice_odd_cases.txt"))
    keys = [r[0] for r in rows]
    assert keys[0] == "automaticoutput" and "err_step" in keys          # commands before start are kept
    assert keys[-1] == "end" and "drift" in keys                        # the reader stops at the first end
    assert keys.count("end") == 1
    assert ["section", "LEBT", "{"] in rows and ["}"] in rows and ["{"] in rows   # folding lines pass through
    assert [";;;buncher1;;;"] in rows                                   # bare marker line (no '!') is a token
    assert ["drift", "0.085", "0.02", "0"] == rows[keys.index("drift")]  # tabs, upper case, trailing comment
    assert rows[keys.index("quad")] == ["quad", "0.1", "0.02", "0", "12.5"]
    by_name = dict(zip(names, rows))
    assert by_name["Q1"][0] == "quad" and by_name["Q2"][0] == "quad" and by_name["Q3"][0] == "quad"
    assert by_name["cav1"][0] == "field" and by_name["CAV2"][0] == "field"
    assert names[keys.index("drift")] == "no_name" and names[keys.index("section")] is None
    assert "BUN1" not in names and "SOL1" not in names                   # !name comments are not names here
    bends = [r for r in rows if r[0] == "bend"]
    assert bends[0][1] == pytest.approx(abs(45 / 180 * 3.141592653589793 * 1.5))
    assert bends[1][1] == pytest.approx(abs(-30 / 180 * 3.141592653589793 * 2))   # written arc is overridden
    assert keys.count("superpose") == 4 and "superposeout" in keys and "lattice_end" in keys
    plain = readfile.read_lattice_mulp(os.path.join(ROOT, "tests", "fixtures", "lattice_odd_cases.txt"))
    # the plain reader keeps the name tokens and only lowercases the first one
    assert ["q1", ":", "quad", "0.15", "0.02", "0", "-8.2"] in plain
    assert plain[-1][0] == "end"


def test_missing_file():
    from avas.utils.exception import CustomFileNotFoundError
    with pytest.raises(CustomFileNotFoundError):
        readfile.read_lattice_mulp(os.path.join(ROOT, "tests", "fixtures", "does_not_exist.txt"))
    with pytest.raises(CustomFileNotFoundError):
        readfile.read_lattice_mulp_with_name(os.path.join(ROOT, "tests", "fixtures", "does_not_exist.txt"))


if __name__ == "__main__":
    if "--regen" in sys.argv:
        regen()
    else:
        print(__doc__)
