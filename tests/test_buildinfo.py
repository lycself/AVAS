from datetime import datetime, timezone

from avas import buildinfo


def test_frontend_timestamp_has_timezone(tmp_path, monkeypatch):
    web = tmp_path / "gui" / "web" / "index.html"
    web.parent.mkdir(parents=True)
    web.write_text("test", encoding="utf-8")
    monkeypatch.setattr(buildinfo, "PACKAGE_DIR", str(tmp_path))
    monkeypatch.setattr(buildinfo, "STAMP", str(tmp_path / "missing.json"))
    monkeypatch.setattr(buildinfo, "git_stamp", lambda root: {})
    buildinfo.build_info.cache_clear()
    try:
        stamp = datetime.fromisoformat(buildinfo.build_info()["frontend"])
        assert stamp.tzinfo == timezone.utc
        assert abs(stamp.timestamp() - web.stat().st_mtime) < 1
    finally:
        buildinfo.build_info.cache_clear()
