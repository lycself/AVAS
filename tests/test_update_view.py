"""Independent update drawing and handoff, without modifying an installation."""
import math

from avas.update_status import StatusWindow
from avas.update_view import activity_segment, fit_bounds, frame_delay, map_panel_rect, normalize_presentation, progress_rect, scene


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
    for stage, expected in [("waiting", 3), ("checking", 3), ("backup", 3), ("installing", 3),
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


def test_waiting_moves_without_status_events_but_respects_motion_and_failure(monkeypatch):
    from avas import update_status
    status = StatusWindow(enabled=False)
    monkeypatch.setattr(update_status.time, "monotonic", lambda: 0.0)
    first = scene(status.model(), 680, 610)
    monkeypatch.setattr(update_status.time, "monotonic", lambda: 0.8)
    second = scene(status.model(), 680, 610)
    assert first != second and status.value is None
    assert not any("%" in cmd[3] for cmd in second if cmd[0] == "text")
    status.presentation["motion"] = "off"
    still = scene(status.model(), 680, 610)
    monkeypatch.setattr(update_status.time, "monotonic", lambda: 1.2)
    assert scene(status.model(), 680, 610) == still and not status.animating()
    status.presentation["motion"] = "full"
    status.set("installing", .3); status.drain()
    assert not status.animating() and status.value == .3
    status.set("failed"); status.drain()
    assert not status.animating()


def test_activity_segment_moves_only_right_and_reenters_from_left():
    positions = [activity_segment(100, n/100) for n in range(101)]
    assert all(a[0] <= b[0] and a[1] <= b[1] for a, b in zip(positions, positions[1:]))
    assert positions[0][1] < .001 and positions[-1][0] > 99.999
    assert all(0 <= left <= right <= 100 for left, right in positions)
    assert abs(positions[50][0]-35) < .01 and abs(positions[50][1]-65) < .01


def panel_layout():
    return {"width": 680, "height": 610, "header": [1, 1, 679, 44], "body": [1, 44, 679, 550],
            "footer": [1, 550, 679, 609], "message": [29, 330, 650, 370], "track": [29, 380, 650, 384],
            "nodes": [[60+i*120, 250, 89+i*120, 279] for i in range(5)], "grid": 40, "scroll": 0,
            "labels": [[60+i*120, 289, 89+i*120, 306] for i in range(5)], "title": [29, 100, 650, 130],
            "commands": [["text", [420, 420, 650, 438], "#9d9d9d", "2026-09-22 03:27 (UTC+8)", 12, "left", 400, [7]*len("2026-09-22 03:27 (UTC+8)")]],
            "rules": [[29, 400, 650, 401]]}


def test_handoff_keeps_local_timestamp_line_positions_and_only_animates_track():
    layout = panel_layout()
    status = StatusWindow("zh_CN", enabled=False, presentation={"layout": layout})
    assert status.presentation["layout"] is not None
    model = status.model()
    model["phase"] = .2
    before = scene(model, 680, 610)
    model["phase"] = .7
    after = scene(model, 680, 610)
    assert [cmd for cmd in before if cmd[0] != "activity"] == [cmd for cmd in after if cmd[0] != "activity"]
    assert before != after
    assert layout["commands"][0] in after
    assert progress_rect(model, 680, 610) == layout["track"]
    status.set("installing", .42); status.drain()
    installing = scene(status.model(), 680, 610)
    assert any(cmd[0] == "text" and "42%" in cmd[3] for cmd in installing)
    assert not any(cmd[0] == "activity" for cmd in installing)


def test_handoff_stage_labels_use_node_centred_columns_instead_of_tight_text_bounds():
    layout = panel_layout()
    layout["labels"] = [[72+i*120, 289, 96+i*120, 306] for i in range(5)]
    status = StatusWindow("zh_CN", enabled=False, presentation={"layout": layout})
    commands = scene(status.model(), 680, 610)
    labels = {cmd[3]: cmd for cmd in commands if cmd[0] == "text" and cmd[3] in ("下载", "校验", "准备", "安装", "重启")}
    assert set(labels) == {"下载", "校验", "准备", "安装", "重启"}
    assert all(cmd[1][2]-cmd[1][0] >= 120 for cmd in labels.values())
    assert [(cmd[1][1], cmd[1][3]) for cmd in labels.values()] == [(289, 306)]*5
    nodes = layout["nodes"]
    for index, label in enumerate(("下载", "校验", "准备", "安装", "重启")):
        label_rect, node_rect = labels[label][1], nodes[index]
        assert (label_rect[0]+label_rect[2])/2 == (node_rect[0]+node_rect[2])/2


def test_invalid_handoff_falls_back_without_executing_or_drawing_unbounded_content():
    for key, bad in [("width", math.inf), ("track", [1, 2, -1, 4]), ("grid", 0),
                     ("nodes", []), ("commands", [["html", [], "", "<script>"]])]:
        layout = panel_layout()
        layout[key] = bad
        assert normalize_presentation({"layout": layout})["layout"] is None
    layout = panel_layout()
    layout["commands"][0][-1] = [math.nan]*23
    assert normalize_presentation({"layout": layout})["layout"] is None


def test_frame_scheduling_subtracts_render_cost_and_avoids_catchup_bursts():
    assert abs(frame_delay(1, 1.004, True) - (1/60-.004)) < 1e-9
    assert frame_delay(1, 1.020, True) == 0
    assert abs(frame_delay(1, 1.004, False)-.046) < 1e-9


def test_animation_handoff_accounts_for_helper_startup_time(monkeypatch):
    from avas import update_status, update_view
    monkeypatch.setattr(update_view.time, "time", lambda: 1000.0)
    monkeypatch.setattr(update_status.time, "monotonic", lambda: 20.0)
    status = StatusWindow(enabled=False, presentation={"animationEpoch": 999700})
    assert abs(status.model()["phase"]-.25) < 1e-9
    monkeypatch.setattr(update_status.time, "monotonic", lambda: 20.3)
    assert abs(status.model()["phase"]-.5) < 1e-9
    assert normalize_presentation({"animationEpoch": math.inf})["animationEpoch"] is None
