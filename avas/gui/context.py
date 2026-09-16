"""Process-wide GUI state shared by the RPC services (one window, one project)."""
from avas.gui import app as gui_app
from avas.gui.project import Project

_project = None


def project():
    global _project
    if _project is None:
        _project = Project(gui_app.app_settings())
    return _project


def settings():
    return gui_app.app_settings()
