"""Linear beam model of AVAS (moments up to second order through the lattice).

The visual lattice editor calls :func:`linear_preview` while parameters are
dragged, so the model is deliberately simple and linear; the multi-particle
engine stays the reference.

Model
-----
* Reference particle: kinetic energy W and time t integrated along z through
  the summed on-axis Ez of RF and static-electric field maps.  An RF map acts
  as ``Ke·Ez(s)·cos(ω(t − t_in) + φ0)`` with φ0 the RF phase when the reference
  particle enters the map.  The phase parameter of ``field`` depends on V3:
  0 synchronous phase φs = atan2(∫E·sinφ dz, ∫E·cosφ dz) (φ0 is solved for:
  fixed-point iteration, else a scan of φ0 with bisection; far below the
  cavity's design β some φs cannot be reached: then, like the engine, the
  decelerating solution φs + 180° is taken, else the closest φs, with a warning), 1 entry phase φ0, 2 phase at t = 0 (φ0 = φ + 360°·f·t_in).
* Second moments of (x, x', y, y', z, δ = Δp/p) are pushed with 6×6 matrices.
  Field maps are cut into 1 mm slices for the reference particle and 4 mm
  slices for the optics (all maps of a superpose block summed); each optics
  slice is a solenoid edge, a half step in the slice-mean Bz (solenoid body),
  a thin kick from the near-axis gradients of the maps (∂Ex/∂x, ∂Ey/∂y,
  ∂By/∂x, ∂Bx/∂y and the skew terms) and the linear RF bunching, another half
  step and an edge.  The solenoid fringe (the radial part ∂Bx/∂x + ∂By/∂y of
  the static magnetic field) is −∂Bz/∂z of the summed Bz, carried by the
  edges, so the Bz part is exactly symplectic; a map's own Bx, By only add
  their divergence-free part.  Momentum gain damps x', y',
  δ and scales z.  drift / quad / solenoid / bend (sector, field index) / edge
  use the usual matrices; steerers and diagnostics are identities.
* Space charge (optional): linear kick of the rms-equivalent uniform ellipsoid
  (bunched beam, charge I/f) or elliptical cylinder (``beamtype dc``), applied
  every ``SC_GROUP`` steps.

Conventions calibrated against the engine (AVAS.dll): E maps in MV/m scaled
by Ke, B maps in T scaled by Kb; the RF magnetic field is
``Kb·B(s)·sin(ω(t − t_in) + φ0)``; maps are stored z outermost (decided per
map from the data, see :func:`_map_group`); beam Twiss β in mm/mrad with
normalised rms emittances (z plane: z in mm, δ = Δp/p in mrad).  The RF phase
of the transverse fields is the one of the reference particle.
Not modelled: dipole / steering content of maps (a warning is given),
superposeout offsets, chromatic and non-linear effects (e.g. the growth of
the longitudinal emittance in low-energy cavities), losses, ``scanphase`` of
input.txt.
"""
from avas.model.beam import read_beam  # noqa: E402
from avas.model.common import PreviewError  # noqa: E402
from avas.model.model import LinearModel, ModelError, ModelResult  # noqa: E402

__all__ = ["LinearModel", "ModelError", "ModelResult", "PreviewError", "read_beam"]
