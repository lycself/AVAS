// Pure geometry / model code for the 3D beamline view (no three.js here, so it
// is cheap to import and easy to test).  Beam coordinates: x horizontal, y up,
// z along the reference orbit; lengths in metres.
import { elementColorVar, type LatticeDoc, type Statement } from "./types";

export type Vec3 = [number, number, number];
/** Position and orthonormal frame (x, y transverse; z tangent) on the orbit. */
export type Pose = { p: Vec3; x: Vec3; y: Vec3; z: Vec3 };

export type Shape =
  | "drift"
  | "quad"
  | "solenoid"
  | "rf"
  | "efield"
  | "dipole" // dipole-like magnet box (field map)
  | "corrector" // steerer / corrector with a length (field map)
  | "magnet" // generic static magnet (field map)
  | "bend"
  | "edge"
  | "steerer"
  | "diag"
  | "box" // unknown element with a length
  | "marker"; // unknown zero-length element

/** Outer radius of each shape in units of the (exaggerated) aperture. */
export const OUTER: Record<Shape, number> = {
  drift: 1,
  quad: 3.0,
  solenoid: 2.15,
  rf: 3.2,
  efield: 1.9,
  dipole: 3.4,
  corrector: 2.4,
  magnet: 2.5,
  bend: 3.4,
  edge: 3.4,
  steerer: 3.3,
  diag: 1.8,
  box: 2,
  marker: 1.8,
};

export type Elem = {
  line: number;
  st: Statement;
  shape: Shape;
  s0: number;
  s1: number;
  len: number;
  /** aperture radius in m (always > 0) */
  r: number;
  colorVar: string;
  label: string;
  /** sign of the gradient / field (quads, solenoids), 0 if unknown */
  sign: number;
  /** bend / edge plane: 0 horizontal (x), 1 vertical (y) */
  hv: 0 | 1;
  /** bend angle or edge pole-face angle, radians */
  angle: number;
  block: number | null;
  /** drawn translucent (outer element of a superpose block) */
  ghost: boolean;
  /** transverse scale multiplier (nesting inside a superpose block) */
  radial: number;
  /** guessed magnet kind of a static magnetic field map, "" otherwise */
  guess: "" | "solenoid" | "quad" | "dipole" | "corrector" | "magnet";
};

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function guessMagnet(file: string): Exclude<Elem["guess"], ""> {
  const f = (file || "").toLowerCase().replace(/^.*[\\/]/, "");
  if (f.includes("sol")) return "solenoid";
  if (/(^q\d|ql|quad)/.test(f)) return "quad";
  if (/(^d\d|_d\d|dip|bend)/.test(f)) return "dipole";
  if (/(^v\d|steer|dc[hv])/.test(f)) return "corrector";
  return "magnet";
}

const APERTURE_KEYS = new Set(["drift", "field", "quad", "solenoid", "bend", "steerer", "edge"]);

function classify(s: Statement): Pick<Elem, "shape" | "sign" | "hv" | "angle" | "guess"> {
  const p = s.params;
  const len = Math.max(0, (s.zEnd ?? s.zStart ?? 0) - (s.zStart ?? 0));
  const base = { sign: 0, hv: 0 as 0 | 1, angle: 0, guess: "" as Elem["guess"] };
  switch (s.key) {
    case "drift":
      return { ...base, shape: "drift" };
    case "quad":
      return { ...base, shape: "quad", sign: Math.sign(num(p[3])) };
    case "solenoid":
      return { ...base, shape: "solenoid", sign: Math.sign(num(p[3])) };
    case "bend":
      return { ...base, shape: len > 0 ? "bend" : "edge", hv: p[6]?.trim() === "1" ? 1 : 0, angle: (num(p[3]) * Math.PI) / 180 };
    case "edge":
      return { ...base, shape: "edge", hv: p[8]?.trim() === "1" ? 1 : 0, angle: (num(p[3]) * Math.PI) / 180 };
    case "steerer":
      return { ...base, shape: len > 0 ? "corrector" : "steerer" };
    case "field": {
      if (s.fieldType === "1") return { ...base, shape: "rf" };
      if (s.fieldType === "2") return { ...base, shape: "efield" };
      if (s.fieldType === "3") {
        const guess = guessMagnet(p[8] ?? "");
        const shape: Shape = guess === "quad" ? "quad" : guess;
        return { ...base, shape, guess, sign: Math.sign(num(p[7])) || 1 };
      }
      return { ...base, shape: len > 0 ? "box" : "marker" };
    }
  }
  if (s.category === "diag" || s.key.startsWith("diag_")) return { ...base, shape: "diag" };
  return { ...base, shape: len > 0 ? "box" : "marker" };
}

function median(values: number[], fallback: number) {
  if (!values.length) return fallback;
  const v = [...values].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}

export type Model = {
  elems: Elem[];
  byLine: Map<number, Elem>;
  orbit: Orbit;
  total: number;
  medianR: number;
  medianLen: number;
  maxR: number;
};

export function buildModel(doc: LatticeDoc | null): Model {
  const sts = doc ? doc.statements.filter((s) => s.active && s.isElement && s.zStart != null) : [];
  const elems: Elem[] = sts.map((s) => {
    const s0 = s.zStart!;
    const s1 = Math.max(s0, s.zEnd ?? s0);
    const c = classify(s);
    const r = APERTURE_KEYS.has(s.key) ? Math.abs(num(s.params[1])) : 0;
    return {
      line: s.line,
      st: s,
      ...c,
      s0,
      s1,
      len: s1 - s0,
      r,
      colorVar: elementColorVar(s),
      label: s.name || (s.key === "field" ? s.params[8] ?? "" : "") || s.keyword,
      block: s.block,
      ghost: false,
      radial: 1,
    };
  });

  const medianR = median(elems.filter((e) => e.r > 0).map((e) => e.r), 0.02);
  const medianLen = median(elems.filter((e) => e.len > 0).map((e) => e.len), 0.2);
  // zero-length elements (and missing apertures): take the next element's aperture, else the previous one
  const next: number[] = new Array(elems.length).fill(0);
  let carry = 0;
  for (let i = elems.length - 1; i >= 0; i--) {
    next[i] = carry;
    if (elems[i].r > 0 && elems[i].len > 0) carry = elems[i].r;
  }
  carry = 0;
  for (let i = 0; i < elems.length; i++) {
    const e = elems[i];
    if (!(e.r > 0)) e.r = (e.len === 0 ? next[i] || carry : carry || next[i]) || medianR;
    else if (e.len > 0) carry = e.r;
  }
  // clamp absurd apertures so one typo does not swamp the view
  for (const e of elems) e.r = Math.min(Math.max(e.r, medianR * 0.2), medianR * 8);

  // superpose blocks: innermost element solid, the others translucent and nested outside
  const blocks = new Map<number, Elem[]>();
  for (const e of elems) if (e.block != null) blocks.set(e.block, [...(blocks.get(e.block) ?? []), e]);
  for (const members of blocks.values()) {
    if (members.length < 2) continue;
    const order = [...members].sort((a, b) => Number(b.shape === "rf") - Number(a.shape === "rf") || b.len - a.len);
    let outer = OUTER[order[0].shape] * order[0].r;
    for (let k = 1; k < order.length; k++) {
      const e = order[k];
      e.ghost = true;
      e.radial = Math.max(1, (outer * 1.22) / (OUTER[e.shape] * e.r));
      outer = OUTER[e.shape] * e.r * e.radial;
    }
  }

  const total = Math.max(doc?.totalLength ?? 0, ...elems.map((e) => e.s1), 0);
  return {
    elems,
    byLine: new Map(elems.map((e) => [e.line, e])),
    orbit: new Orbit(elems.filter((e) => e.shape === "bend")),
    total,
    medianR,
    medianLen,
    maxR: Math.max(medianR, ...elems.map((e) => e.r * e.radial)),
  };
}

/** Transverse exaggeration that keeps the fitted beamline readable. */
export function autoExaggeration(m: Model): number {
  const target = Math.max(m.total / 250, m.medianLen * 0.3, m.medianR);
  const ex = target / m.medianR;
  return roundNice(Math.min(500, Math.max(1, ex)));
}

export function roundNice(v: number) {
  if (v < 10) return Math.round(v * 10) / 10;
  return Number(v.toPrecision(2));
}

export function niceStep(raw: number) {
  if (!(raw > 0)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = raw / 10 ** exp;
  for (const n of [1, 2, 5, 10]) if (base <= n) return n * 10 ** exp;
  return 10 ** (exp + 1);
}

/* ------------------------------------------------------------------ reference orbit */
type Seg = { s0: number; s1: number; pose: Pose; k: number; plane: 0 | 1 };

const add = (a: Vec3, b: Vec3, f: number): Vec3 => [a[0] + b[0] * f, a[1] + b[1] * f, a[2] + b[2] * f];
const lin = (a: Vec3, fa: number, b: Vec3, fb: number): Vec3 => [a[0] * fa + b[0] * fb, a[1] * fa + b[1] * fb, a[2] * fa + b[2] * fb];

export class Orbit {
  readonly segs: Seg[] = [];
  readonly bent: boolean;

  constructor(bends: Elem[]) {
    let pose: Pose = { p: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
    let s = 0;
    const sorted = bends.filter((b) => b.len > 0 && Math.abs(b.angle) > 1e-9).sort((a, b) => a.s0 - b.s0);
    for (const b of sorted) {
      if (b.s0 < s - 1e-9) continue; // overlapping bends: ignore the later one
      if (b.s0 > s) {
        this.segs.push({ s0: s, s1: b.s0, pose, k: 0, plane: 0 });
        pose = this.pose(b.s0);
      }
      this.segs.push({ s0: b.s0, s1: b.s1, pose, k: b.angle / b.len, plane: b.hv });
      s = b.s1;
      pose = this.pose(b.s1);
    }
    this.segs.push({ s0: s, s1: Infinity, pose, k: 0, plane: 0 });
    this.bent = sorted.length > 0;
  }

  private find(s: number): Seg {
    const segs = this.segs;
    let lo = 0;
    let hi = segs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (segs[mid].s0 <= s) lo = mid;
      else hi = mid - 1;
    }
    return segs[lo];
  }

  pose(s: number): Pose {
    const seg = this.find(s);
    const f = seg.pose;
    const u = s - seg.s0;
    if (seg.k === 0) return { p: add(f.p, f.z, u), x: f.x, y: f.y, z: f.z };
    const uc = Math.min(Math.max(u, 0), seg.s1 - seg.s0);
    const phi = seg.k * uc;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    const a = (1 - c) / seg.k;
    const b = sn / seg.k;
    let out: Pose;
    if (seg.plane === 0) {
      out = { p: add(add(f.p, f.x, a), f.z, b), x: lin(f.x, c, f.z, -sn), y: f.y, z: lin(f.z, c, f.x, sn) };
    } else {
      out = { p: add(add(f.p, f.y, a), f.z, b), x: f.x, y: lin(f.y, c, f.z, -sn), z: lin(f.z, c, f.y, sn) };
    }
    if (u !== uc) out.p = add(out.p, out.z, u - uc);
    return out;
  }

  /** Points along the orbit from s = a to s = b (straight parts are 2 points). */
  samples(a: number, b: number, arcStep = 0.05): number[] {
    const pts: number[] = [];
    const push = (s: number) => {
      const p = this.pose(s).p;
      pts.push(s, p[0], p[1], p[2]);
    };
    push(a);
    for (const seg of this.segs) {
      if (seg.s1 <= a || seg.s0 >= b) continue;
      if (seg.k !== 0) {
        const s0 = Math.max(a, seg.s0);
        const s1 = Math.min(b, seg.s1);
        const n = Math.max(2, Math.ceil(Math.abs(seg.k * (s1 - s0)) / arcStep));
        for (let i = 1; i <= n; i++) push(s0 + ((s1 - s0) * i) / n);
      } else if (seg.s1 < b) {
        push(seg.s1);
      }
    }
    push(b);
    return pts; // flat [s, x, y, z, ...]
  }
}

/* ------------------------------------------------------------------ envelope */
export type EnvelopeSamples = { s: Float64Array; x: Float64Array; y: Float64Array; n: number };

/** Bucket the envelope to at most *maxRings* rings, keeping the maxima of each bucket. */
export function downsampleEnvelope(z: ArrayLike<number>, x: ArrayLike<number>, y: ArrayLike<number>, maxRings = 1500): EnvelopeSamples {
  const n = Math.min(z.length, x.length, y.length);
  const bucket = Math.max(1, Math.ceil(n / maxRings));
  const m = Math.ceil(n / bucket);
  const out = { s: new Float64Array(m), x: new Float64Array(m), y: new Float64Array(m), n: 0 };
  for (let i = 0; i < n; i += bucket) {
    let zs = 0;
    let zc = 0;
    let xm = 0;
    let ym = 0;
    for (let j = i; j < Math.min(n, i + bucket); j++) {
      const zz = z[j];
      if (Number.isFinite(zz)) {
        zs += zz;
        zc++;
      }
      const xx = Math.abs(x[j]);
      const yy = Math.abs(y[j]);
      if (Number.isFinite(xx) && xx > xm) xm = xx;
      if (Number.isFinite(yy) && yy > ym) ym = yy;
    }
    if (!zc) continue;
    const k = out.n++;
    out.s[k] = zs / zc;
    out.x[k] = xm;
    out.y[k] = ym;
  }
  return out;
}
