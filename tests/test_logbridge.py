"""The page log keeps actionable messages and omits internal diagnostics."""
import logging


def test_page_handler_omits_records_marked_as_internal(monkeypatch):
    from avas.gui import bridge, logbridge

    emitted = []
    monkeypatch.setattr(bridge, "emit", lambda name, payload: emitted.append((name, payload)))
    logbridge.clear_history()
    handler = logbridge.PageHandler()
    hidden = logging.LogRecord("avas.gui", logging.INFO, __file__, 1, "routine request", (), None)
    hidden.hide_from_gui_log = True
    visible = logging.LogRecord("avas.gui", logging.WARNING, __file__, 2, "request failed", (), None)

    handler.emit(hidden)
    handler.emit(visible)

    assert [entry[1]["msg"] for entry in emitted] == ["request failed"]
    assert [entry["msg"] for entry in logbridge.history()] == ["request failed"]
    logbridge.clear_history()
