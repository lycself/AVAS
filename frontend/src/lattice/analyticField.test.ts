import { describe, expect, it } from "vitest";
import { bendField, crossSection, fieldAt, type ElementField } from "./analyticField";

const quad: ElementField = { kind: "quadrupole", g: 12 };

describe("fieldAt", () => {
  it("gives the quadrupole its zero on the axis and a field growing with the radius", () => {
    expect(fieldAt(quad, 0, 0)).toEqual({ bx: 0, by: 0, bz: 0 });
    expect(fieldAt(quad, 0.02, 0)).toEqual({ bx: 0, by: 12 * 0.02, bz: 0 }); // By on the x axis
    expect(fieldAt(quad, 0, 0.02)).toEqual({ bx: 12 * 0.02, by: 0, bz: 0 }); // Bx on the y axis
    // v x B on a positive particle travelling along +z is -g x in x: focusing for g > 0
    expect(fieldAt(quad, 0.01, 0).by).toBeGreaterThan(0);
    expect(fieldAt({ kind: "quadrupole", g: -12 }, 0.01, 0).by).toBeLessThan(0);
  });

  it("keeps a dipole flat without a field index and tilts it with one", () => {
    const flat: ElementField = { kind: "dipole", b: 1, index: 0, rho: 0.5, vertical: false };
    expect(fieldAt(flat, 0.02, 0.01)).toEqual({ bx: -0, by: 1, bz: 0 });
    expect(fieldAt(flat, -0.02, -0.01).by).toBe(1);
    const tilted: ElementField = { ...flat, index: 0.5 };
    // By > 0 bends a positive particle to -x: the outside is +x, where N > 0 weakens the field
    expect(fieldAt(tilted, 0.05, 0).by).toBeCloseTo(1 - (0.5 * 0.05) / 0.5);
    expect(fieldAt(tilted, -0.05, 0).by).toBeGreaterThan(fieldAt(tilted, 0.05, 0).by);
    // rho = 0 would divide by zero; the field stays flat instead
    expect(fieldAt({ ...tilted, rho: 0 }, 0.05, 0.05)).toEqual({ bx: -0, by: 1, bz: 0 });
  });

  // dBy/dx and dBx/dy by central differences
  const grad = (f: ElementField) => {
    const h = 1e-4;
    return {
      dBydx: (fieldAt(f, h, 0).by - fieldAt(f, -h, 0).by) / (2 * h),
      dBxdy: (fieldAt(f, 0, h).bx - fieldAt(f, 0, -h).bx) / (2 * h),
      dBxdx: (fieldAt(f, h, 0).bx - fieldAt(f, -h, 0).bx) / (2 * h),
      dBydy: (fieldAt(f, 0, h).by - fieldAt(f, 0, -h).by) / (2 * h),
    };
  };
  const cases = [-60, 30].flatMap((angle) => [false, true].map((vertical) => ({ angle, vertical })));

  it.each(cases)("satisfies Maxwell across the bore (angle $angle, vertical $vertical)", ({ angle, vertical }) => {
    const g = grad(bendField(angle, 0.7, 1.3, vertical));
    expect(g.dBxdy).toBeCloseTo(g.dBydx, 9); // curl B = 0
    expect(g.dBxdx + g.dBydy).toBeCloseTo(0, 9); // div B = 0 (no Bz)
    expect(Math.abs(g.dBydx)).toBeCloseTo(0.7 / 1.3, 9);
  });

  it.each(cases)("focuses out of the bending plane for N > 0 whichever way it bends (angle $angle, vertical $vertical)", ({ angle, vertical }) => {
    // force on a positive particle along +z: Fx = -By, Fy = +Bx; N > 0 focuses across the bending plane
    const f = bendField(angle, 0.5, 1, vertical);
    if (vertical) expect(-fieldAt(f, 0.01, 0).by).toBeLessThan(0);
    else expect(fieldAt(f, 0, 0.01).bx).toBeLessThan(0);
    // and weakens the field on the outside of the bend
    const out = vertical ? Math.sign(fieldAt(f, 0, 0).bx) * -1 : Math.sign(fieldAt(f, 0, 0).by);
    const onAxis = Math.hypot(fieldAt(f, 0, 0).bx, fieldAt(f, 0, 0).by);
    const outside = vertical ? fieldAt(f, 0, 0.02 * out).bx : fieldAt(f, 0.02 * out, 0).by;
    expect(Math.abs(outside)).toBeLessThan(onAxis);
  });

  it("bends a positive angle to -x, or to -y when vertical, as the preview's bend matrix does", () => {
    // Fx = -By, Fy = +Bx for a positive particle along +z
    expect(-fieldAt(bendField(30, 0, 1, false), 0, 0).by).toBeLessThan(0);
    expect(fieldAt(bendField(30, 0, 1, true), 0, 0).bx).toBeLessThan(0);
    expect(-fieldAt(bendField(-30, 0, 1, false), 0, 0).by).toBeGreaterThan(0);
    expect(fieldAt(bendField(-30, 0, 1, true), 0, 0).bx).toBeGreaterThan(0);
  });

  it("gives a corrector the same field everywhere", () => {
    const st: ElementField = { kind: "steerer", bx: 0.01, by: -0.02 };
    expect(fieldAt(st, 0, 0)).toEqual(fieldAt(st, 0.03, -0.01));
  });

  it("puts a solenoid's field along the beam and none across it", () => {
    expect(fieldAt({ kind: "solenoid", b: 2.5 }, 0.01, -0.01)).toEqual({ bx: 0, by: 0, bz: 2.5 });
  });
});

describe("crossSection", () => {
  it("samples the bore and nothing outside it", () => {
    const r = 0.02;
    const cs = crossSection(quad, r, 9);
    expect(cs.samples.length).toBeGreaterThan(40);
    expect(cs.samples.length).toBeLessThan(81);
    for (const s of cs.samples) expect(Math.hypot(s.x, s.y)).toBeLessThanOrEqual(r * 1.001);
    expect(cs.max).toBeCloseTo(12 * r); // strongest at the pole tips
  });

  it("reports no field when there is none", () => {
    expect(crossSection({ kind: "steerer", bx: 0, by: 0 }, 0.02).max).toBe(0);
  });
});
