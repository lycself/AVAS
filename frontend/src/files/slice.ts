// One plane of a field, in the shape the viewer draws.  Two things produce it:
// the back end (a real field-map file, `files.fieldSlice` / `lattice.fieldSlice`)
// and `analyticSlice` below (a matrix-model element, computed from its own
// parameters).  Normalising both here lets one view render either.
import { fieldAt, type ElementField } from "../lattice/analyticField";

export type Plane = "zx" | "zy" | "xy";
export const PLANE_AXES: Record<Plane, [string, string]> = { zx: ["z", "x"], zy: ["z", "y"], xy: ["x", "y"] };
export const MAGNITUDE = "|F|";

export type Component = { values?: ArrayLike<number>; min?: number; max?: number; error?: string };

export type Slice = {
  base: string;
  /** The component this slice was asked for. */
  ext: string;
  family: string;
  plane: Plane;
  /** Axis held fixed ("x", "y" or "z") and where it was cut (m). */
  fixed: string;
  at: number;
  atRange: [number, number];
  /** Planes worth offering for this field. */
  planes: Plane[];
  length: number;
  u: ArrayLike<number>;
  v: ArrayLike<number>;
  components: Record<string, Component>;
  magnitude: { values: ArrayLike<number>; max: number; of: string[] } | null;
  /** Components along (u, v), when the map has both. */
  arrows: [string, string] | null;
  meanings: Record<string, [string, string]>;
  /** Computed from lattice parameters rather than read from a file. */
  schematic: boolean;
  unit: string;
};

/** Unit of the values in a field map file, before the element's Ke / Kb. */
export function fieldUnit(family: string) {
  return family[0] === "e" ? "MV/m" : "T";
}

/** A back-end payload, with the two fields the pages add themselves. */
export function fromPayload(payload: any): Slice {
  return { ...payload, schematic: false, unit: fieldUnit(payload.family) };
}

/** How far past each end of the element the longitudinal cuts reach. */
const MARGIN = 0.14;

/**
 * The plane of a matrix-model element's field, worked out from its parameters.
 *
 * The model has hard edges: the field is what `fieldAt` gives inside [0, L] and
 * exactly zero outside, which is the point of showing it next to a real map.
 * A longitudinal cut therefore reaches a little past both ends so the edges are
 * visible.  Units follow the parameter the field comes from, and a dipole's own
 * B is not in the lattice, so it is given relative to its value on the axis.
 */
export function analyticSlice(
  field: ElementField,
  opts: { length: number; r: number; name: string; unit: string; plane: Plane; at: number | null; nu?: number; nv?: number },
): Slice {
  const { length, r, name, unit } = opts;
  // a zero-length element (a corrector acts over the next one) has no z to cut
  const planes: Plane[] = length > 0 ? ["zx", "zy", "xy"] : ["xy"];
  const plane = planes.includes(opts.plane) ? opts.plane : planes[0];
  const long = plane !== "xy";
  const nu = Math.max(4, Math.floor(opts.nu ?? (long ? 121 : 41)));
  const nv = Math.max(4, Math.floor(opts.nv ?? 41));

  const zLo = -MARGIN * length;
  const zHi = length * (1 + MARGIN);
  const axis = (n: number, lo: number, hi: number) => Float64Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1));
  const u = long ? axis(nu, zLo, zHi) : axis(nu, -r, r);
  const v = axis(nv, -r, r);
  const atRange: [number, number] = plane === "xy" ? [0, length] : [-r, r];
  const want = opts.at == null ? (plane === "xy" ? length / 2 : 0) : opts.at;
  const at = Math.min(atRange[1], Math.max(atRange[0], want));

  const names = ["Bx", "By", "Bz"];
  const values = names.map(() => new Float64Array(nu * nv));
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      // the third axis is the one the plane holds fixed
      const z = plane === "xy" ? at : u[i];
      const x = plane === "zy" ? at : plane === "xy" ? u[i] : v[j];
      const y = plane === "zx" ? at : v[j];
      const inside = z >= 0 && z <= length;
      const b = inside ? fieldAt(field, x, y) : { bx: 0, by: 0, bz: 0 };
      const k = j * nu + i;
      values[0][k] = b.bx;
      values[1][k] = b.by;
      values[2][k] = b.bz;
    }
  }

  const components: Record<string, Component> = {};
  let present: string[] = [];
  names.forEach((n, i) => {
    const a = values[i];
    let lo = Infinity;
    let hi = -Infinity;
    for (const x of a) {
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    }
    components[n] = { values: a, min: lo, max: hi };
    if (lo !== 0 || hi !== 0) present.push(n);
  });
  if (!present.length) present = [names[1]];

  const mag = new Float64Array(nu * nv);
  let magMax = 0;
  for (let k = 0; k < mag.length; k++) {
    mag[k] = Math.hypot(values[0][k], values[1][k], values[2][k]);
    if (mag[k] > magMax) magMax = mag[k];
  }
  const pair = plane === "zx" ? ["Bz", "Bx"] : plane === "zy" ? ["Bz", "By"] : ["Bx", "By"];
  return {
    base: name,
    // show a component the element actually has, preferring one in the plane
    ext: pair.find((p) => present.includes(p)) ?? present[0],
    family: unit === "T" ? "b" : "e",
    plane,
    fixed: plane === "zx" ? "y" : plane === "zy" ? "x" : "z",
    at,
    atRange,
    planes,
    length,
    u,
    v,
    components,
    magnitude: present.length > 1 ? { values: mag, max: magMax, of: present } : null,
    arrows: pair.some((p) => present.includes(p)) ? (pair as [string, string]) : null,
    meanings: { Bx: ["Bx", "Bx"], By: ["By", "By"], Bz: ["Bz", "Bz"] },
    schematic: true,
    unit,
  };
}
