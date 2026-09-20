import { describe, expect, it } from "vitest";
import { quiver, type Grid } from "./quiver";

/** A slice with the field given by *f* at each grid point. */
function grid(uN: number, vN: number, uMax: number, vMax: number, f: (u: number, v: number) => [number, number]): Grid {
  const u = Array.from({ length: uN }, (_, i) => (i / (uN - 1)) * uMax);
  const v = Array.from({ length: vN }, (_, j) => -vMax + (2 * j * vMax) / (vN - 1));
  const fu = new Float64Array(uN * vN);
  const fv = new Float64Array(uN * vN);
  for (let j = 0; j < vN; j++)
    for (let i = 0; i < uN; i++) {
      const [a, b] = f(u[i], v[j]);
      fu[j * uN + i] = a;
      fv[j * uN + i] = b;
    }
  return { u, v, fu, fv };
}

/** The arrows as (tail, tip) pairs; every arrow is 6 points, the last one NaN. */
function arrows(q: { x: number[]; y: number[] }) {
  const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
  for (let i = 0; i + 5 < q.x.length; i += 6) {
    expect(Number.isNaN(q.x[i + 5])).toBe(true);
    out.push({ x0: q.x[i], y0: q.y[i], x1: q.x[i + 1], y1: q.y[i + 1] });
  }
  return out;
}

describe("quiver", () => {
  it("points along the field and reports its size", () => {
    const q = quiver(grid(40, 20, 0.2, 0.02, () => [3, 0]), { nu: 8, nv: 4 });
    expect(q.count).toBe(32);
    expect(q.max).toBeCloseTo(3);
    for (const a of arrows(q)) {
      expect(a.x1).toBeGreaterThan(a.x0); // +u
      expect(a.y1).toBeCloseTo(a.y0); // and nothing along v
    }
  });

  it("keeps the ratio of the components in data units, whatever the axes span", () => {
    // arrows are drawn in data units, so on screen they take the same slope as a
    // field line of the heat map even though u spans 0.2 and v only 0.04
    const even = arrows(quiver(grid(40, 20, 0.2, 0.02, () => [1, 1]), { nu: 8, nv: 4 }))[0];
    expect(even.x1 - even.x0).toBeCloseTo(even.y1 - even.y0, 12);
    const skew = arrows(quiver(grid(40, 20, 0.2, 0.02, () => [2, 1]), { nu: 8, nv: 4 }))[0];
    expect(skew.x1 - skew.x0).toBeCloseTo(2 * (skew.y1 - skew.y0), 12);
  });

  it("scales the longest arrow to the spacing and leaves the zero of a quadrupole bare", () => {
    const fill = 0.8;
    const nu = 10;
    const q = quiver(grid(41, 21, 0.2, 0.02, (u, v) => [v, u - 0.1]), { nu, nv: 5, fill });
    const longest = Math.max(...arrows(q).map((a) => Math.abs(a.x1 - a.x0) / 0.2));
    expect(longest).toBeLessThanOrEqual(fill / 5 + 1e-9); // the tighter axis sets the scale
    // the sampled point closest to the centre carries almost no field
    const centre = arrows(q).reduce((best, a) => (Math.hypot(a.x0 - 0.1, a.y0) < Math.hypot(best.x0 - 0.1, best.y0) ? a : best));
    expect(Math.hypot(centre.x1 - centre.x0, centre.y1 - centre.y0)).toBeLessThan(0.01);
  });

  it("draws nothing for a field that is zero everywhere or a degenerate slice", () => {
    expect(quiver(grid(10, 10, 0.2, 0.02, () => [0, 0])).count).toBe(0);
    expect(quiver({ u: [1], v: [1], fu: [1], fv: [1] }).count).toBe(0);
  });
});
