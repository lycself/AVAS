import { describe, expect, it } from "vitest";
import { createWheelClassifier, moveRange, pointerDevice, wheelPixels } from "./pointer";

const swipe = { deltaX: 4, deltaY: 8, deltaMode: 0, ctrlKey: false };
const wheel = { ...swipe, deltaX: 0, deltaY: 100, wheelDeltaY: -120 };

describe("global pointer gestures", () => {
  it("retains old 3D preferences until the global selection overrides them", () => {
    expect(pointerDevice({ "ui/b3dPointer": "mouse" })).toBe("mouse");
    expect(pointerDevice({ "ui/b3dPointer": "mouse", "ui/pointerDevice": "auto" })).toBe("auto");
    expect(pointerDevice({ "ui/pointerDevice": "invalid" })).toBe("auto");
  });
  it("switches between devices across gestures but keeps momentum within a gesture", () => {
    const classify = createWheelClassifier();
    expect(classify(wheel, "auto", 0)).toBe("zoom");
    expect(classify(swipe, "auto", 400)).toBe("pan");
    expect(classify(wheel, "auto", 450)).toBe("pan");
    expect(classify(wheel, "auto", 900)).toBe("zoom");
  });
  it("always zooms pinches and respects manual modes", () => {
    const classify = createWheelClassifier();
    expect(classify(swipe, "mouse")).toBe("zoom");
    expect(classify(wheel, "touchpad")).toBe("pan");
    expect(classify({ ...swipe, ctrlKey: true }, "touchpad")).toBe("zoom");
    expect(classify({ ...swipe, deltaMode: 1 }, "auto")).toBe("zoom");
  });
  it("normalizes wheel units and preserves reversed axes and zoom anchors", () => {
    expect(wheelPixels({ ...swipe, deltaMode: 1 }, 600)).toEqual({ x: 64, y: 128 });
    expect(moveRange([10, 0], 0.1)).toEqual([9, -1]);
    expect(moveRange([0, 100], 0, 0.5, 0.25)).toEqual([12.5, 62.5]);
  });
});
