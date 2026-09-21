import { describe, expect, it } from "vitest";
import { updateStep } from "./updatePhase";

describe("update stage display", () => {
  it("does not invent progress before downloading or after cancellation", () => {
    expect(updateStep("preparing", "prepare")).toBe(-1);
    expect(updateStep("idle", "download")).toBe(-1);
  });
  it("maps actual stages, including a baseline download after extraction", () => {
    expect(["download", "verify", "extract", "download", "preflight"].map(s => updateStep("preparing", s))).toEqual([0, 1, 2, 0, 2]);
    expect(updateStep("preparing", "retry")).toBe(0);
    expect(updateStep("preparing", "fetch")).toBe(0);
    expect(updateStep("ready")).toBe(2);
    expect(updateStep("installing")).toBe(3);
  });
});
