import { afterEach, describe, expect, it, vi } from "vitest";
import { bindPlotWheel } from "./plotWheel";

function fixture(type = "linear") {
  let listener: (e: any) => void = () => {};
  let frame: () => void = () => {};
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => { frame = fn; return 1; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const x = { _name: "xaxis", _offset: 50, _length: 200, range: [0, 10], type };
  const y = { _name: "yaxis", _offset: 30, _length: 100, range: [10, 0], type: "linear", fixedrange: false };
  const other = { ...x, _name: "xaxis2", _offset: 400 };
  const el = {
    _fullLayout: { _plots: { xy: { xaxis: x, yaxis: y }, x2y: { xaxis: other, yaxis: y } } },
    getBoundingClientRect: () => ({ left: 0, top: 0, height: 200 }),
    addEventListener: (_: string, fn: any) => { listener = fn; }, removeEventListener: vi.fn(),
  };
  const relayout = vi.fn();
  const cleanup = bindPlotWheel(el as any, "touchpad", relayout);
  const event = (overrides = {}) => ({ clientX: 150, clientY: 80, deltaX: 20, deltaY: 10, deltaMode: 0, ctrlKey: false,
    preventDefault: vi.fn(), stopPropagation: vi.fn(), ...overrides });
  return { x, y, el, event, send: (e: any) => listener(e), flush: () => frame(), relayout, cleanup };
}
afterEach(() => vi.unstubAllGlobals());

describe("Plotly wheel integration", () => {
  it("accumulates swipes within a frame and changes only the hovered subplot", () => {
    const f = fixture();
    f.send(f.event()); f.send(f.event()); f.flush();
    expect(f.relayout).toHaveBeenCalledTimes(1);
    expect(f.relayout.mock.calls[0][0]).toEqual({ "xaxis.range": [2, 12], "yaxis.range": [12, 2], "xaxis.autorange": false, "yaxis.autorange": false });
  });
  it("zooms a pinch around the pointer and preserves fixed axes", () => {
    const f = fixture("log"); f.y.fixedrange = true;
    f.send(f.event({ ctrlKey: true, deltaY: -10 })); f.flush();
    const update = f.relayout.mock.calls[0][0];
    expect(update["xaxis.range"][0]).toBeGreaterThan(0);
    expect(update["xaxis.range"][1]).toBeLessThan(10);
    expect(update["yaxis.range"]).toBeUndefined();
  });
  it("leaves page scrolling outside the plotting area and removes listeners", () => {
    const f = fixture(); const event = f.event({ clientX: 10 });
    f.send(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(f.relayout).not.toHaveBeenCalled();
    f.cleanup(); expect(f.el.removeEventListener).toHaveBeenCalled();
  });
});
