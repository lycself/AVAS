"""Serialize update reservation with simulation starts (including AI/scan)."""
import threading

lock = threading.RLock()
updating = False


def require_idle_update():
    if updating:
        from avas.gui.bridge import UserError
        raise UserError("An update is being prepared; wait for it to finish.")
