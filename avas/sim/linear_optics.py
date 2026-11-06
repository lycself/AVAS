"""Fast linear envelope preview of a lattice ("linear preview (approximate)").

The visual lattice editor, the primer, the assistant and ``avas`` commands call
:func:`linear_preview`; the model itself lives in :mod:`avas.model` (see its
docstring).  The names below are re-exported for older callers.
"""
from avas.model.beam import _beam_from_dst, _check_beam, _sigma0, read_beam  # noqa: F401
from avas.model.common import (BLOWUP, C_LIGHT, EPS0, MEV_TM, PreviewError, _kin, _to_int,  # noqa: F401
                               _Warnings, _wrap)
from avas.model.elements import (_cs, _prefix_products, _solenoid4, _solenoid_body4, bend_matrix,  # noqa: F401
                                 drift_matrix, edge_matrix, quad_matrix, solenoid_matrix)
from avas.model.fieldmaps import _MAP_CACHE, clear_cache  # noqa: F401
from avas.model.model import APERTURE_SIGMAS, LinearModel  # noqa: F401
from avas.model.spacecharge import SC_GROUP, _longitudinal_factor, _propagate_sc, _space_charge_setup  # noqa: F401
from avas.model.tracker import _APERTURE_KEYS, _sections, _track, _Tracker  # noqa: F401


def linear_preview(lattice_text, beam, field_dirs, space_charge=None, max_points=3000):
    """Linear envelope of *lattice_text* (the editor text) for *beam* (see :func:`read_beam`).

    *field_dirs*: directory or list of directories searched for field maps.
    *space_charge*: None = on when the beam current is positive.

    Returns plain data: ``z`` [m], ``rms_x``, ``rms_y``, ``rms_z`` [mm],
    ``energy`` [MeV] (numpy arrays, at most *max_points* points), ``elements``
    (one dict per active element: line, key, name, z0, z1, w_in, w_out,
    phase_rf, phase_s, aperture), ``warnings`` [(en, zh)] and ``model``.
    Raises :class:`PreviewError` only for unusable input.
    """
    model = LinearModel(lattice_text, beam, field_dirs, centroid=False, cache_size=0)
    return model.evaluate(space_charge=space_charge).preview(max_points)
