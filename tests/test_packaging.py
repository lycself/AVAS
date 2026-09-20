"""Packaging preflight must fail before expensive or mutating build steps."""
import importlib.util
from pathlib import Path

import pytest


spec = importlib.util.spec_from_file_location(
    "avas_packaging_build_test", Path(__file__).resolve().parents[1] / "packaging/build.py"
)
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


@pytest.mark.parametrize("content", [None, b"", b"[LangOptions]\n", b"\xff"])
def test_bad_language_fails_before_build(tmp_path, monkeypatch, content):
    monkeypatch.setattr(build, "ROOT", str(tmp_path))
    monkeypatch.setattr(build, "find_iscc", lambda explicit: "ISCC.exe")
    monkeypatch.setattr(build, "run", lambda *a, **k: pytest.fail("build started before preflight"))
    if content is not None:
        language = tmp_path / "packaging/languages/ChineseSimplified.isl"
        language.parent.mkdir(parents=True)
        language.write_bytes(content)
    with pytest.raises(RuntimeError, match="bundled installer language file"):
        build.main(["--require-installer"])
    assert not (tmp_path / "avas/_build.json").exists()


def test_bundled_language_is_readable():
    build.check_installer_inputs()


def test_required_compiler_fails_before_build(monkeypatch):
    monkeypatch.setattr(build, "find_iscc", lambda explicit: None)
    monkeypatch.setattr(build, "run", lambda *a, **k: pytest.fail("build started without compiler"))
    with pytest.raises(RuntimeError, match="Inno Setup is required"):
        build.main(["--require-installer"])
