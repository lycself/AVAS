import { describe, expect, it, vi } from "vitest";

// live.ts talks to the back end through bridge.ts, which reads the page URL at import time
vi.mock("../bridge", () => ({ call: vi.fn(), on: vi.fn(() => () => undefined) }));

import { appendRows, emptyArrays, lastFinite, LIVE_KEYS, toArrays } from "./live";

describe("emptyArrays", () => {
  it("has every column", () => {
    const a = emptyArrays();
    for (const k of LIVE_KEYS) expect(a[k]).toEqual([]);
  });
});

describe("appendRows", () => {
  it("appends in place and turns null into NaN", () => {
    const a = emptyArrays();
    appendRows(a, { z: [0, 0.1], rmsX: [1, null], alive: [100, 99] });
    appendRows(a, { z: [0.2], rmsX: [1.5], alive: [98] });
    expect(a.z).toEqual([0, 0.1, 0.2]);
    expect(a.rmsX[0]).toBe(1);
    expect(a.rmsX[1]).toBeNaN();
    expect(a.rmsX[2]).toBe(1.5);
    expect(a.alive).toEqual([100, 99, 98]);
    expect(a.rmsY).toEqual([]);
  });
  it("ignores columns it does not know", () => {
    const a = emptyArrays();
    appendRows(a, { z: [1], bogus: [2] });
    expect(a.z).toEqual([1]);
    expect((a as any).bogus).toBeUndefined();
  });
});

describe("toArrays", () => {
  it("copies typed arrays and lists, NaN for gaps, empty for missing", () => {
    const out = toArrays({ z: new Float64Array([0, 1]), energy: [2.5, null], rmsX: undefined });
    expect(out.z).toEqual([0, 1]);
    expect(out.energy[0]).toBe(2.5);
    expect(out.energy[1]).toBeNaN();
    expect(out.rmsX).toEqual([]);
    expect(toArrays(null).z).toEqual([]);
  });
});

describe("lastFinite", () => {
  it("skips trailing NaN", () => {
    expect(lastFinite([1, 2, NaN])).toBe(2);
    expect(lastFinite([NaN])).toBeNaN();
    expect(lastFinite([])).toBeNaN();
    expect(lastFinite(new Float32Array([3, 4]))).toBe(4);
  });
});
