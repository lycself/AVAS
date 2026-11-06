"""GUI back-end tests of what the Beam and Simulation settings pages edit besides their own keywords:
the secondary beam (input.txt switch + particle file), boundary.txt and scanData.txt, restoring a
file-history version into the form (beam.parse / settings.parse), and the field-map facts the
element's field window shows (lattice.fieldInfo). No engine run is needed.
"""
import json
import os
import shutil
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)


def rpc(method, **params):
    from avas.gui import bridge
    return json.loads(bridge.dispatch(method, params))


def ok(method, **params):
    reply = rpc(method, **params)
    assert reply["ok"], f"{method}: {reply.get('error')}\n{reply.get('detail', '')}"
    return reply["result"]


@pytest.fixture(scope="module")
def project(tmp_path_factory):
    root = tmp_path_factory.mktemp("inputpages")
    os.environ["AVAS_GUI_SETTINGS"] = str(root / "gui-settings.json")
    shutil.copytree(EXAMPLE, root / "proj" / "InputFile")
    os.makedirs(root / "proj" / "OutputFile")
    from avas.gui import services  # noqa: F401 - registers the handlers
    assert ok("project.open", path=str(root / "proj"))["open"]
    yield root / "proj" / "InputFile"
    ok("project.close")


def read(path):
    """The file as the pages get it (line endings kept: a Windows checkout has CRLF)."""
    from avas.gui.textio import read_text
    return read_text(path)


def keyword_lines(path, keyword):
    return [line.strip() for line in read(path).splitlines() if line.split() and line.split()[0].lower() == keyword]


def test_secondary_beam(project):
    data = ok("beam.load")
    sec = data["secondary"]
    assert sec["on"] is False and sec["exists"] is False and sec["name"] == "SeParticle.txt"
    assert data["inputPath"] == str(project / "input.txt") and data["text"] == read(project / "beam.txt")

    # an empty table with the switch off writes nothing
    ok("beam.save", form=data["form"], secondary={"on": False, "text": ""})
    assert not (project / "SeParticle.txt").exists() and keyword_lines(project / "input.txt", "secondarybeam") == []

    rows = "0 0 0 0 0 1e6 1 938.272 1 0 1\n"
    saved = ok("beam.save", form=data["form"], secondary={"on": True, "text": rows})
    assert saved["secondary"]["on"] is True and saved["secondary"]["text"] == rows
    assert keyword_lines(project / "input.txt", "secondarybeam") == ["secondarybeam 1"]
    # the settings page keeps the switch it does not manage
    settings = ok("settings.load")
    ok("settings.save", form=settings["form"], meta=settings["meta"])
    assert keyword_lines(project / "input.txt", "secondarybeam") == ["secondarybeam 1"]

    off = ok("beam.save", form=data["form"], secondary={"on": False, "text": rows})
    assert off["secondary"]["on"] is False and keyword_lines(project / "input.txt", "secondarybeam") == ["secondarybeam 0"]


def test_beam_restore_from_history(project):
    data = ok("beam.load")
    assert ok("beam.parse", text=data["text"]) == data["form"]
    # an older version: the page takes its values into the form, nothing is written yet
    original = data["text"]
    ok("beam.save", form={**data["form"], "current": "0.75"})
    versions = ok("history.list", path=data["path"])
    source = next(v for v in versions if ok("history.version", path=data["path"], revision=v["id"])["text"] == original)
    restored = ok("beam.parse", text=ok("history.version", path=data["path"], revision=source["id"])["text"])
    assert restored == data["form"] and keyword_lines(project / "beam.txt", "current")[0] == "current 0.75"
    # saving the restored form records where it came from
    ok("beam.save", form=restored, restoredFrom=source["id"])
    latest = ok("history.list", path=data["path"])[0]
    assert latest["restored_from"] == source["id"] and latest["source"] in ("restore", "restore-edited")


def test_settings_companion_tables(project):
    # CRLF on disk, as in a Windows checkout: the page gets the file as it is
    with open(project / "scanData.txt", "rb") as fh:
        raw = fh.read()
    with open(project / "scanData.txt", "wb") as fh:
        fh.write(raw.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"))
    data = ok("settings.load")
    comp = data["companions"]
    assert comp["scanData"]["exists"] is True and comp["boundary"]["exists"] is False
    assert comp["scanData"]["text"] == read(project / "scanData.txt")

    # unchanged tables are not rewritten, even when the table hands back LF line endings;
    # an empty boundary table does not create the file
    mtime = os.path.getmtime(project / "scanData.txt")
    for text in (comp["scanData"]["text"], comp["scanData"]["text"].replace("\r\n", "\n")):
        ok("settings.save", form=data["form"], meta=data["meta"], companions={"boundary": "", "scanData": text})
    assert os.path.getmtime(project / "scanData.txt") == mtime and not (project / "boundary.txt").exists()

    boundary = "start\n1 copper 0.5 0.02 0.02 RLP 0 0 0 0 0 0\nend\n"
    scan = comp["scanData"]["text"].replace("\r\n", "\n").rstrip("\n") + "\n"
    saved = ok("settings.save", form={**data["form"], "boundary": True}, meta=data["meta"],
               companions={"boundary": boundary, "scanData": scan + "-30 0\n"})
    assert saved["form"]["boundary"] is True
    assert read(project / "boundary.txt") == boundary and read(project / "scanData.txt").endswith("-30 0\n")
    assert saved["companions"]["boundary"]["exists"] is True

    import re
    form = ok("settings.parse", text=re.sub(r"(?m)^steppercycle .*$", "steppercycle 77", data["text"]))
    assert form["steppercycle"] == "77" and form["error_type"] == saved["form"]["error_type"]


def test_field_info(project):
    info = ok("lattice.fieldInfo", name="sol")
    exts = [c["ext"] for c in info["components"]]
    assert exts == ["bsx", "bsy", "bsz"]
    bsz = info["components"][2]
    assert bsz["path"] == str(project / "sol.bsz") and bsz["nz"] > 0 and bsz["points"] > 0
    assert bsz["meaning"][0] and bsz["length"] > 0
    assert rpc("lattice.fieldInfo", name="no_such_map")["ok"] is False


def test_unreadable_versions_are_user_errors(project):
    for method in ("beam.parse", "settings.parse"):
        reply = rpc(method, text="current abc\nsteppercycle abc\n")
        assert reply["ok"] is False and reply.get("user") is True, reply
