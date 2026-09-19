import { describe, expect, it } from "vitest";
import { fmtG, fmtSeconds, humanSize } from "./format";

describe("fmtG", () => {
  it("handles missing and zero", () => {
    expect(fmtG(null)).toBe("–");
    expect(fmtG(undefined)).toBe("–");
    expect(fmtG(NaN)).toBe("–");
    expect(fmtG(Infinity)).toBe("–");
    expect(fmtG(0)).toBe("0");
  });
  it("uses fixed notation with trailing zeros stripped", () => {
    expect(fmtG(1234.5678)).toBe("1234.57");
    expect(fmtG(100)).toBe("100");
    expect(fmtG(0.5)).toBe("0.5");
    expect(fmtG(-2.5, 3)).toBe("-2.5");
    expect(fmtG(0.0001)).toBe("0.0001");
    expect(fmtG(99999.9)).toBe("99999.9");
  });
  it("switches to exponent notation like %g", () => {
    expect(fmtG(0.000012345)).toBe("1.2345e-05");
    expect(fmtG(1e7)).toBe("1e+07");
    expect(fmtG(123456789, 8)).toBe("1.2345679e+08");
    expect(fmtG(-1.5e-9, 3)).toBe("-1.5e-09");
  });
  it("respects the digit count", () => {
    expect(fmtG(Math.PI, 3)).toBe("3.14");
    expect(fmtG(Math.PI, 8)).toBe("3.1415927");
    expect(fmtG(12345, 3)).toBe("1.23e+04");
  });
});

describe("fmtSeconds", () => {
  it("handles missing", () => {
    expect(fmtSeconds(null)).toBe("–");
    expect(fmtSeconds(undefined)).toBe("–");
    expect(fmtSeconds(NaN)).toBe("–");
  });
  it("formats seconds, minutes and hours", () => {
    expect(fmtSeconds(0)).toBe("0 s");
    expect(fmtSeconds(12.4)).toBe("12 s");
    expect(fmtSeconds(59.6)).toBe("1 min 00 s");
    expect(fmtSeconds(125)).toBe("2 min 05 s");
    expect(fmtSeconds(3599)).toBe("59 min 59 s");
    expect(fmtSeconds(3720)).toBe("1 h 02 min");
    expect(fmtSeconds(7 * 3600 + 15 * 60 + 40)).toBe("7 h 15 min");
  });
});

describe("humanSize", () => {
  it("picks the unit", () => {
    expect(humanSize(0)).toBe("0 B");
    expect(humanSize(512)).toBe("512 B");
    expect(humanSize(1024)).toBe("1.0 KB");
    expect(humanSize(1536)).toBe("1.5 KB");
    expect(humanSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(humanSize(3 * 1024 ** 3)).toBe("3.0 GB");
  });
  it("does not go beyond GB", () => {
    expect(humanSize(2 * 1024 ** 4)).toBe("2048.0 GB");
  });
});
