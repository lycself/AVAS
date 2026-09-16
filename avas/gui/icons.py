"""Codicons (VS Code's icon font, bundled with qtawesome) coloured by the theme.

``bind(target, name, role)`` sets the icon now and again after every theme
switch, so callers never deal with colours::

    icons.bind(action_run, "play", "success")
    icons.bind(button, "folder-opened")

*role* is a colour token of :mod:`avas.gui.theme` (``icon``, ``accent``,
``success``, ``danger``, ``on_accent`` ...); the disabled state always uses
``fg_soft``.  ``role_on`` optionally colours the checked state.
"""
import os
import tempfile

import qtawesome as qta
from PyQt5 import sip
from PyQt5.QtCore import QSize

from avas.gui import theme

_bound = []          # [(target, name, role, role_on, spin)]
_connected = False


def icon(name, role="icon", role_on=None, spin_parent=None):
    c = theme.color(role)
    opts = {"color": c, "color_active": c, "color_selected": c, "color_disabled": theme.color("fg_soft")}
    if role_on:
        on = theme.color(role_on)
        opts.update(color_on=on, color_on_active=on, color_on_selected=on)
    if spin_parent is not None:
        opts["animation"] = qta.Spin(spin_parent, interval=40, step=12)
    return qta.icon(f"msc.{name}", **opts)


def bind(target, name, role="icon", role_on=None, spin=False):
    """Give *target* (anything with ``setIcon``) a themed codicon; replaces an earlier binding."""
    global _connected
    if not _connected:
        theme.notifier().changed.connect(_refresh)
        _connected = True
    unbind(target)
    _bound.append((target, name, role, role_on, spin))
    target.setIcon(icon(name, role, role_on, target if spin else None))


def style_images(mode):
    """PNG files for style-sheet sub-controls (``url(...)`` needs a file), in the colours of *mode*.

    Returns a dict name -> forward-slash path.  Files live in the temp directory
    and are rewritten when missing.
    """
    tokens = theme.tokens(mode)
    folder = os.path.join(tempfile.gettempdir(), "avas-gui-icons")
    os.makedirs(folder, exist_ok=True)
    specs = {
        "arrow_down": ("chevron-down", "fg_muted"),
        "arrow_up": ("chevron-up", "fg_muted"),
        "arrow_down_disabled": ("chevron-down", "fg_soft"),
        "close": ("close", "fg_muted"),
        "close_hover": ("close", "fg_strong"),
    }
    paths = {}
    for key, (name, token) in specs.items():
        color = tokens[token]
        path = os.path.join(folder, f"{key}_{color.lstrip('#')}.png")
        if not os.path.isfile(path):
            qta.icon(f"msc.{name}", color=color).pixmap(QSize(32, 32)).save(path)
        paths[key] = path.replace("\\", "/")
    return paths


def unbind(target):
    _bound[:] = [b for b in _bound if b[0] is not target]


def _refresh():
    alive = []
    for entry in _bound:
        target, name, role, role_on, spin = entry
        try:
            if sip.isdeleted(target):
                continue
        except TypeError:
            pass
        target.setIcon(icon(name, role, role_on, target if spin else None))
        alive.append(entry)
    _bound[:] = alive
