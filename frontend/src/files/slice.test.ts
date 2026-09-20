import { describe, expect, it } from "vitest";
import { analyticSlice, fieldUnit, MAGNITUDE, type Plane } from "./slice";
import type { ElementField } from "../lattice/analyticField";

const quad: ElementField = { kind: "quadrupole", g: 12 };
const base = { length: 0.2, r: 0.02, name: "q1", unit: "T", at: null as number | null };

function slice(field: ElementField, plane: Plane, over: Partial<typeof base> = {}) {
  return analyticSlice(field, { ...base, ...over, plane });
}

/** Value of *ext* at the grid point nearest (u, v). */
function at(s: ReturnType<typeof slice>, ext: string, u: number, v: number) {
  const nearest = (a: ArrayLike<number>, q: number) => {
    let best = 0;
    for (let i = 1; i < a.length; i++) if (Math.abs(a[i] - q) < Math.abs(a[best] - q)) best = i;
    return best;
  };
  const i = nearest(s.u, u);
  const j = nearest(s.v, v);
  return s.components[ext].values![j * s.u.length + i];
}

describe("analyticSlice", () => {
  it("stops the field dead at both ends of the element", () => {
    const s = slice(quad, "zx");
    expect(s.length).toBe(0.2);
    expect(s.u[0]).toBeLessThan(0); // reaches past both ends so the edges show
    expect(s.u[s.u.length - 1]).toBeGreaterThan(0.2);
    expect(at(s, "By", 0.1, 0.015)).toBeCloseTo(12 * 0.015); // inside
    expect(at(s, "By", -0.02, 0.015)).toBe(0); // before it
    expect(at(s, "By", 0.22, 0.015)).toBe(0); // after it
  });

  it("reports no in-plane arrows for a quadrupole cut along z", () => {
    // B of a normal quadrupole is purely By on y = 0, i.e. normal to the z–x plane
    const s = slice(quad, "zx");
    expect(s.arrows).toBeNull();
    expect(s.ext).toBe("By"); // so it shows the component that does exist
    const cross = slice(quad, "xy");
    expect(cross.arrows).toEqual(["Bx", "By"]); // the cross-section does have them
  });

  it("follows the beam axis for a solenoid and offers arrows along z", () => {
    const s = slice({ kind: "solenoid", b: 2.5 }, "zx");
    expect(s.arrows).toEqual(["Bz", "Bx"]);
    expect(at(s, "Bz", 0.1, 0.01)).toBe(2.5);
    expect(at(s, "Bz", 0.3, 0.01)).toBe(0);
    expect(s.magnitude).toBeNull(); // only one component is non-zero
  });

  it("cuts a cross-section where it is asked to, and only inside the element", () => {
    const inside = slice(quad, "xy", { at: 0.1 });
    expect(inside.fixed).toBe("z");
    expect(inside.at).toBeCloseTo(0.1);
    expect(at(inside, "By", 0.015, 0)).toBeCloseTo(12 * 0.015);
    expect(inside.atRange).toEqual([0, 0.2]);
    const outside = slice(quad, "xy", { at: 5 }); // clamped to the element
    expect(outside.at).toBe(0.2);
  });

  it("leaves a zero-length corrector with only its cross-section", () => {
    const s = slice({ kind: "steerer", bx: 0.01, by: -0.02 }, "zx", { length: 0 });
    expect(s.planes).toEqual(["xy"]);
    expect(s.plane).toBe("xy"); // the asked-for plane does not exist here
    expect(at(s, "Bx", 0.01, 0)).toBeCloseTo(0.01);
    expect(s.magnitude?.of).toEqual(["Bx", "By"]);
  });

  it("marks itself a schematic and carries the unit it was given", () => {
    expect(slice(quad, "zx").schematic).toBe(true);
    expect(slice(quad, "zx", { unit: "V/m" }).unit).toBe("V/m");
    expect(MAGNITUDE).toBe("|F|");
    expect([fieldUnit("bs"), fieldUnit("ed")]).toEqual(["T", "MV/m"]);
  });
});
