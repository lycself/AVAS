// The transverse field of the matrix-model elements, worked out from their own
// lattice parameters.  This is the *shape* of the field, not data: the engine
// never writes it and there is no field map behind it, so every view built on
// it has to say that it is a schematic.  Field-map elements show the file.

export type ElementField =
  /** Normal quadrupole of gradient *g* (T/m): Bx = g y, By = g x. */
  | { kind: "quadrupole"; g: number }
  /**
   * Dipole with the on-axis bending field *b* (By, or Bx when *vertical*, signed); *index* is the
   * lattice's N, *rho* the radius (m).  The picture is for a positive particle; see {@link bendField}.
   */
  | { kind: "dipole"; b: number; index: number; rho: number; vertical: boolean }
  /** Corrector with the field written in the lattice (T, or V/m for an electric one). */
  | { kind: "steerer"; bx: number; by: number }
  /** Solenoid of field *b* (T) along the beam; it has no transverse field inside a hard edge. */
  | { kind: "solenoid"; b: number };

export type Vector = { bx: number; by: number; bz: number };

export type Sample = Vector & {
  /** Position in the bore (m). */
  x: number;
  y: number;
};

export type CrossSection = { samples: Sample[]; max: number };

/** The field at (x, y) metres from the axis, inside the element. */
export function fieldAt(f: ElementField, x: number, y: number): Vector {
  switch (f.kind) {
    case "quadrupole":
      // the normal quadrupole: a positive gradient focuses a positive particle in x
      return { bx: f.g * y, by: f.g * x, bz: 0 };
    case "dipole": {
      // The field index: B = B0 (1 - N r / rho) with r pointing away from the centre of curvature,
      // and the Maxwell partner (curl B = 0) of that gradient across the bending plane.  The
      // gradient does not depend on which way the beam bends (nor does the bend matrix): By>0
      // bends a positive particle to -x, so r = x there, and Bx>0 bends it to +y, so r = -y.
      const g = f.rho ? (f.index * Math.abs(f.b)) / f.rho : 0;
      return f.vertical ? { bx: f.b + g * y, by: g * x, bz: 0 } : { bx: -g * y, by: f.b - g * x, bz: 0 };
    }
    case "steerer":
      return { bx: f.bx, by: f.by, bz: 0 };
    case "solenoid":
      return { bx: 0, by: 0, bz: f.b };
  }
}

/**
 * The dipole field of a `bend` (angle in degrees, field index, radius in m, HV = 1 for vertical),
 * relative to the on-axis field.  The direction follows the preview's bend matrix (R16 > 0 for a
 * positive angle): a positive angle bends a positive particle to -x, or to -y when vertical.
 * The manual does not state AVAS's direction; only the sign of the on-axis field depends on it.
 */
export function bendField(angleDeg: number, index: number, rho: number, vertical: boolean): ElementField {
  const s = Math.sign(angleDeg) || 1;
  return { kind: "dipole", b: vertical ? -s : s, index, rho, vertical };
}

/**
 * The field on a square grid of *n* by *n* points across a bore of radius *r*
 * (m), the points outside the circle left out.  A dipole's own B is not in the
 * lattice (it follows from the beam momentum), so pass 1 for it and read the
 * result as a relative field.
 */
export function crossSection(f: ElementField, r: number, n = 9): CrossSection {
  const samples: Sample[] = [];
  let max = 0;
  const m = Math.max(2, Math.floor(n));
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < m; i++) {
      const x = r * (-1 + (2 * i) / (m - 1));
      const y = r * (-1 + (2 * j) / (m - 1));
      if (x * x + y * y > r * r * 1.0001) continue;
      const { bx, by, bz } = fieldAt(f, x, y);
      samples.push({ x, y, bx, by, bz });
      max = Math.max(max, Math.hypot(bx, by));
    }
  }
  return { samples, max };
}
