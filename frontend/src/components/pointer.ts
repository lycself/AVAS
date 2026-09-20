export type PointerDevice = "auto" | "mouse" | "touchpad";

/** Fall back to the saved 3D preference for installations predating the global setting. */
export function pointerDevice(settings: Record<string, unknown>): PointerDevice {
  const value = settings["ui/pointerDevice"] ?? settings["ui/b3dPointer"];
  return value === "mouse" || value === "touchpad" ? value : "auto";
}

export type WheelInput = Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode" | "ctrlKey"> & { wheelDeltaY?: number };

/** Each view keeps one detector, so a gesture retains its classification for 300 ms. */
export function createWheelClassifier() {
  let last: { kind: "mouse" | "touchpad"; time: number } | null = null;
  return (event: WheelInput, device: PointerDevice, now = performance.now()): "pan" | "zoom" => {
    if (event.ctrlKey) return "zoom"; // native trackpad pinch
    if (device !== "auto") return device === "touchpad" ? "pan" : "zoom";
    if (!last || now - last.time >= 300) {
      const legacy = event.wheelDeltaY;
      const mouse = event.deltaMode !== 0 || (event.deltaX === 0 && legacy != null && legacy !== 0 && Math.abs(legacy) % 120 === 0);
      last = { kind: mouse ? "mouse" : "touchpad", time: now };
    }
    last.time = now;
    return last.kind === "mouse" ? "zoom" : "pan";
  };
}

export function wheelPixels(event: WheelInput, pageSize: number) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageSize : 1;
  return { x: event.deltaX * unit, y: event.deltaY * unit };
}

/** Ranges are in axis coordinates (including log10 coordinates on logarithmic axes). */
export function moveRange(range: [number, number], shift: number, factor = 1, anchor = 0.5): [number, number] {
  const span = range[1] - range[0];
  const start = range[0] + span * (shift + anchor * (1 - factor));
  return [start, start + span * factor];
}

export function zoomFactor(delta: number) {
  return Math.exp(Math.max(-1, Math.min(1, delta * 0.006)));
}
