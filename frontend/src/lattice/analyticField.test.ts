import { describe, expect, it } from "vitest";
import { crossSection, fieldAt, type ElementField } from "./analyticField";

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
    expect(fieldAt(flat, 0.02, 0)).toEqual({ bx: 0, by: 1, bz: 0 });
    expect(fieldAt(flat, -0.02, 0)).toEqual({ bx: 0, by: 1, bz: 0 });
    const tilted: ElementField = { ...flat, index: 0.5 };
    expect(fieldAt(tilted, 0.05, 0).by).toBeCloseTo(1 - (0.5 * 0.05) / 0.5);
    expect(fieldAt(tilted, -0.05, 0).by).toBeGreaterThan(fieldAt(tilted, 0.05, 0).by);
    // a vertical bend carries Bx instead, and reads the index across y
    const vertical: ElementField = { ...tilted, vertical: true };
    expect(fieldAt(vertical, 0.05, 0)).toEqual({ bx: 1, by: 0, bz: 0 });
    expect(fieldAt(vertical, 0, 0.05).bx).toBeCloseTo(1 - (0.5 * 0.05) / 0.5);
    // rho = 0 would divide by zero; the field stays flat instead
    expect(fieldAt({ ...tilted, rho: 0 }, 0.05, 0).by).toBe(1);
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
