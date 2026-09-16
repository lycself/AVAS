"""matplotlib look that follows the GUI theme, while saved images stay light.

* :func:`apply` updates the global ``rcParams`` of the GUI process, so every
  figure drawn afterwards (embedded tabs and the plot dialogs) matches the
  light or dark theme.  The command line never calls it and keeps matplotlib's
  defaults.
* Saving is always "publication style": :func:`install_save_hook` wraps
  ``Figure.savefig`` so that in dark mode the figure is recoloured to the light
  values for the duration of the save and restored afterwards.  This covers
  the *Save image* buttons, the matplotlib toolbar and every dialog.
* Plot code that needs the foreground colour should read it from ``rcParams``
  (``text.color``, ``axes.edgecolor``) instead of hard-coding ``"black"``.
"""
import contextlib
import functools

import matplotlib
from matplotlib.collections import Collection
from matplotlib.colors import to_hex, to_rgba
from matplotlib.figure import Figure
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
from matplotlib.text import Text

from avas.gui.theme import PLOT_RC

_active = {"mode": "light"}

# rc keys whose value is a concrete colour in both themes, with the light
# fallback for "inherit"/"auto"
_FALLBACK = {"legend.facecolor": "#ffffff", "axes.titlecolor": None, "savefig.facecolor": None,
             "xtick.labelcolor": "#000000", "ytick.labelcolor": "#000000"}


def apply(mode):
    _active["mode"] = mode
    matplotlib.rcParams.update(PLOT_RC.get(mode, PLOT_RC["light"]))
    install_save_hook()


def _hex(c):
    try:
        return to_hex(to_rgba(c), keep_alpha=False).lower()
    except (ValueError, TypeError):
        return None


def _light_map():
    """dark colour (hex) -> light colour, built from the two rc tables."""
    mapping = {}
    for key, dark in PLOT_RC["dark"].items():
        light = PLOT_RC["light"].get(key)
        if light in ("inherit", "auto"):
            light = _FALLBACK.get(key)
        d = _hex(dark)
        if d and light and _hex(light):
            mapping[d] = light
    return mapping


def _swap(value, mapping):
    """Return the light replacement for *value* (keeping its alpha) or None."""
    h = _hex(value)
    if h is None or h not in mapping:
        return None
    alpha = to_rgba(value)[3]
    r, g, b, _ = to_rgba(mapping[h])
    return (r, g, b, alpha)


@contextlib.contextmanager
def light_colors(fig):
    """Temporarily recolour a figure drawn in the dark theme to the light theme."""
    mapping = _light_map()
    undo = []

    def swap_single(getter, setter):
        old = getter()
        new = _swap(old, mapping)
        if new is not None:
            setter(new)
            undo.append((setter, old))

    def swap_array(getter, setter):
        old = getter()
        try:
            rows = [tuple(r) for r in old]
        except TypeError:
            return
        new_rows = [_swap(r, mapping) or r for r in rows]
        if new_rows != rows:
            setter(new_rows)
            undo.append((setter, old))

    swap_single(fig.patch.get_facecolor, fig.patch.set_facecolor)
    swap_single(fig.patch.get_edgecolor, fig.patch.set_edgecolor)
    for obj in fig.findobj(include_self=False):
        if isinstance(obj, Text):
            swap_single(obj.get_color, obj.set_color)
        elif isinstance(obj, Line2D):
            swap_single(obj.get_color, obj.set_color)
            swap_single(obj.get_markerfacecolor, obj.set_markerfacecolor)
            swap_single(obj.get_markeredgecolor, obj.set_markeredgecolor)
        elif isinstance(obj, Patch):
            swap_single(obj.get_facecolor, obj.set_facecolor)
            swap_single(obj.get_edgecolor, obj.set_edgecolor)
        elif isinstance(obj, Collection):
            swap_array(obj.get_facecolor, obj.set_facecolor)
            swap_array(obj.get_edgecolor, obj.set_edgecolor)
    try:
        with matplotlib.rc_context(PLOT_RC["light"]):
            yield
    finally:
        for setter, old in reversed(undo):
            try:
                setter(old)
            except Exception:  # noqa: BLE001 - best effort restore
                pass


def install_save_hook():
    if getattr(Figure.savefig, "_avas_light_export", False):
        return
    original = Figure.savefig

    @functools.wraps(original)     # pyplot checks the qualified name when it is imported later
    def savefig(self, *args, **kwargs):
        if _active["mode"] != "dark":
            return original(self, *args, **kwargs)
        with light_colors(self):
            result = original(self, *args, **kwargs)
        if self.canvas is not None:
            self.canvas.draw_idle()
        return result

    savefig._avas_light_export = True
    Figure.savefig = savefig


def refresh_toolbar_icons(toolbar):
    """Re-pick black/white matplotlib toolbar icons after a theme switch."""
    try:
        for _text, _tip, image, callback in toolbar.toolitems:
            action = toolbar._actions.get(callback)
            if action is not None and image:
                action.setIcon(toolbar._icon(image + ".png"))
    except Exception:  # noqa: BLE001 - private matplotlib API, cosmetic only
        pass
