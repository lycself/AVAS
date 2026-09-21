"""Independent update drawing and handoff, without modifying an installation."""
import math

from avas.update_status import StatusWindow
from avas.update_view import fit_bounds, map_panel_rect, normalize_presentation, scene


def test_handoff_uses_client_origin_zoom_and_negative_monitor_coordinates():
    rect = map_panel_rect({"x": 100, "y": 50, "width": 680, "height": 610},
                          {"width": 1000, "height": 800}, (-1800, 40, 1500, 1200))
    assert rect == [-1650, 115, 1020, 915, 1.5]
    assert map_panel_rect({"x": 0, "y": 0, "width": 680, "height": 610}, {"width": 0, "height": 800}, (0, 0, 1000, 800)) is None


def test_untrusted_handoff_is_bounded_and_palette_is_validated():
    result = normalize_presentation({"theme": "dark", "colours": {"accent": "url(secret)", "bg": "#123456"},
                                     "bounds": [math.nan, 0, 680, 610, 1]})
    assert result["colours"]["accent"] == "#5bd7ed"
    assert result["colours"]["bg"] == "#123456"
    assert result["bounds"] is None
    assert normalize_presentation({"bounds": [0, 0, 680, 610, 100]})["bounds"] is None
    assert map_panel_rect({"x": -100, "y": 0, "width": 600, "height": 500}, {"width": 800, "height": 600}, (0, 0, 800, 600)) is None


def test_panel_is_clamped_to_selected_monitor_work_area():
    x, y, width, height, scale = fit_bounds([-2000, -200, 1200, 1200, 2], (-1920, 0, 0, 1080), 2)
    assert (x, y, width, height, scale) == (-1920, 0, 1200, 1080, 2)


def test_stages_stay_continuous_and_never_invent_overall_progress():
    status = StatusWindow("zh_CN", enabled=False, versions={"current": "old", "target": "new"})
    for stage, expected in [("waiting", 2), ("checking", 2), ("backup", 3), ("installing", 3),
                            ("dependencies", 3), ("checking_startup", 3), ("restarting", 4)]:
        status.set(stage, .4); status.drain()
        model = status.model()
        assert model["step"] == expected
        assert model["value"] == (.4 if stage in ("backup", "installing") else None)
        labels = [c[3] for c in scene(model, 680, 610) if c[0] == "text"]
        assert "old" in labels and "new" in labels
        assert "下载" in labels and "重启" in labels
        assert any("40%" in label for label in labels) == (stage in ("backup", "installing"))


def test_compact_scene_keeps_progress_above_footer():
    status = StatusWindow("en", enabled=False)
    commands = scene(status.model(), 340, 380)
    status_labels = [c for c in commands if c[0] == "text" and c[3] == "Working…"]
    assert status_labels[0][1][3] <= 380-64
