import { describe, expect, it } from "vitest";
import { formatBuildTime } from "./buildTime";

describe("build timestamps", () => {
  it("converts equivalent UTC and offset timestamps to the same local time", () => {
    const utc = formatBuildTime("2026-09-21T23:06:00Z");
    expect(utc).toBe(formatBuildTime("2026-09-22T07:06:00+08:00"));
    const date = new Date("2026-09-21T23:06:00Z");
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(utc).toContain(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`);
    expect(utc).toMatch(/\(UTC[+-]\d+(?::\d{2})?\)$/);
  });

  it("does not guess the timezone of legacy or invalid stamps", () => {
    expect(formatBuildTime("2026-09-21 10:06")).toBeNull();
    expect(formatBuildTime("invalidZ")).toBeNull();
  });
});
