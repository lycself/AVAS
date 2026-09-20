import { createWheelClassifier, moveRange, wheelPixels, zoomFactor, type PointerDevice } from "./pointer";

/** Plotly exposes rendered axis geometry on _fullLayout; Cartesian plots share this adapter. */
export function bindPlotWheel(el: HTMLElement, device: PointerDevice, relayout: (update: Record<string, unknown>) => void) {
  const classify = createWheelClassifier();
  let frame = 0;
  let pending: Record<string, unknown> = {};
  const wheel = (event: WheelEvent) => {
    const layout = (el as any)._fullLayout;
    if (!layout || (event.target as Element)?.closest?.(".modebar, .legend")) return;
    const rect = el.getBoundingClientRect();
    const sx = el.clientWidth ? el.clientWidth / rect.width : 1;
    const sy = el.clientHeight ? el.clientHeight / rect.height : 1;
    const x = (event.clientX - rect.left) * sx, y = (event.clientY - rect.top) * sy;
    const axes = new Map<string, any>();
    // Restrict to the subplot under the pointer, including overlaid axes.
    for (const subplot of Object.values(layout._plots ?? {}) as any[]) {
      const xa = subplot.xaxis, ya = subplot.yaxis;
      if (!xa || !ya || x < xa._offset || x > xa._offset + xa._length || y < ya._offset || y > ya._offset + ya._length) continue;
      axes.set(xa._name, xa); axes.set(ya._name, ya);
    }
    if (!axes.size) return;
    const pan = classify(event, device) === "pan";
    const pixels = wheelPixels(event, rect.height);
    const update: Record<string, unknown> = {};
    for (const [name, axis] of axes) {
      if (axis.fixedrange || !axis._length) continue;
      const key = `${name}.range`;
      const range = (pending[key] ?? axis.range) as [number | string, number | string];
      const numeric = range.map((v) => axis.type === "date" ? new Date(v).getTime() : Number(v)) as [number, number];
      if (!numeric.every(Number.isFinite)) continue;
      const horizontal = name.startsWith("x");
      const anchor = horizontal ? (x - axis._offset) / axis._length : 1 - (y - axis._offset) / axis._length;
      const shift = pan ? (horizontal ? pixels.x : -pixels.y) / axis._length : 0;
      const next = moveRange(numeric, shift, pan ? 1 : zoomFactor(pixels.y), anchor);
      update[key] = axis.type === "date" ? next.map((v) => new Date(v).toISOString()) : next;
      update[`${name}.autorange`] = false;
    }
    if (!Object.keys(update).length) return;
    event.preventDefault(); event.stopPropagation();
    Object.assign(pending, update);
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      const batch = pending; pending = {};
      relayout(batch);
    });
  };
  el.addEventListener("wheel", wheel, { capture: true, passive: false });
  return () => { el.removeEventListener("wheel", wheel, true); cancelAnimationFrame(frame); };
}
