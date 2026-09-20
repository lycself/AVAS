// The transverse field of the matrix-model elements, worked out from their own
// lattice parameters.  This is the *shape* of the field, not data: the engine
// never writes it and there is no field map behind it, so every view built on
// it has to say that it is a schematic.  Field-map elements show the file.

export type ElementField =
  /** Normal quadrupole of gradient *g* (T/m): Bx = g y, By = g x. */
  | { kind: "quadrupole"; g: number }
  /** Dipole of field *b*, bending in y when *vertical*; *index* is the lattice's N, *rho* the radius (m). */
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
      // the field index tilts the flat dipole field: B(x) = B0 (1 - N x / rho)
      const across = f.vertical ? y : x;
      const b = f.rho ? f.b * (1 - (f.index * across) / f.rho) : f.b;
      return f.vertical ? { bx: b, by: 0, bz: 0 } : { bx: 0, by: b, bz: 0 };
    }
    case "steerer":
      return { bx: f.bx, by: f.by, bz: 0 };
    case "solenoid":
      return { bx: 0, by: 0, bz: f.b };
  }
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
