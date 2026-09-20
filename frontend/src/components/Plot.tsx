import { pointerDevice } from "./pointer";
import { bindPlotWheel } from "./plotWheel";
// Plotly figure that follows the light/dark theme.  Figures are described
// without colours for chrome; semantic series colours ("r", "b", ...) are
// mapped to a palette readable on both backgrounds.
import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/app";
import { cssColor } from "../util";
import { Spinner } from "./ui";

type PlotlyModule = typeof import("plotly.js-dist-min");
let plotlyPromise: Promise<PlotlyModule> | null = null;
export function loadPlotly(): Promise<PlotlyModule> {
  if (!plotlyPromise) plotlyPromise = import("plotly.js-dist-min").then((m: any) => (m.default ?? m) as PlotlyModule);
  return plotlyPromise;
}

const PALETTE: Record<string, [string, string]> = {
  r: ["#d62728", "#ff6b6b"],
  red: ["#d62728", "#ff6b6b"],
  b: ["#1f5fd6", "#6aa9ff"],
  blue: ["#1f5fd6", "#6aa9ff"],
  g: ["#2a9d3f", "#5ad17a"],
  green: ["#2a9d3f", "#5ad17a"],
  m: ["#b0359f", "#e58ad8"],
  magenta: ["#b0359f", "#e58ad8"],
  blueviolet: ["#7b3fe4", "#b28cff"],
  c: ["#0e9aa7", "#4fd1db"],
  y: ["#b58900", "#e3c14d"],
  k: ["#222222", "#d4d4d4"],
  orange: ["#e07b20", "#f0a050"],
  lime: ["#43a047", "#8bd98f"],
  accent: ["#005fb8", "#3794ff"],
  fg: ["#3b3b3b", "#cccccc"],
};

export function seriesColor(name: string | undefined, dark: boolean): string {
  if (!name) return dark ? "#cccccc" : "#3b3b3b";
  const p = PALETTE[name.toLowerCase()];
  return p ? p[dark ? 1 : 0] : name;
}

/** Heat-map colour scale for field maps.  A magnitude is sequential (viridis, the
 *  same order of lightness in both themes); a signed component is diverging with
 *  the background tone in the middle, so zero reads as "no field" and the sign is
 *  visible at a glance.  Callers must lock the middle of a diverging scale to zero
 *  (`zmid: 0`), otherwise an asymmetric range moves the neutral colour off zero. */
export function fieldScale(dark: boolean, diverging: boolean): [number, string][] {
  if (diverging)
    return dark
      ? [[0, "#3b8fdd"], [0.25, "#2c5f8a"], [0.5, "#2b2b2b"], [0.75, "#a04733"], [1, "#f5805c"]]
      : [[0, "#2166ac"], [0.25, "#92bedd"], [0.5, "#f4f2ed"], [0.75, "#e08a72"], [1, "#b2182b"]];
  return dark
    ? [[0, "#2b2050"], [0.25, "#414a8c"], [0.5, "#2b8f8b"], [0.75, "#73c54c"], [1, "#f2e650"]]
    : [[0, "#440154"], [0.25, "#3b528b"], [0.5, "#21918c"], [0.75, "#5ec962"], [1, "#fde725"]];
}

export function themeLayout(dark: boolean): Partial<Plotly.Layout> {
  const fg = cssColor("--fg", dark ? "#cccccc" : "#3b3b3b");
  const grid = dark ? "#333333" : "#e6e6e6";
  const line = dark ? "#5a5a5a" : "#9a9a9a";
  const bg = cssColor("--editor-bg", dark ? "#1f1f1f" : "#ffffff");
  const axis = { gridcolor: grid, linecolor: line, zerolinecolor: line, tickcolor: line, showline: true, mirror: true, ticks: "outside" as const, automargin: true };
  return {
    paper_bgcolor: bg,
    plot_bgcolor: bg,
    font: { family: '"Segoe UI", "Microsoft YaHei UI", sans-serif', size: 12, color: fg },
    xaxis: axis,
    yaxis: axis,
    legend: { bgcolor: "rgba(0,0,0,0)", bordercolor: grid },
    colorway: ["r", "b", "g", "m", "blueviolet", "c", "orange"].map((c) => seriesColor(c, dark)),
    hoverlabel: { bgcolor: cssColor("--tooltip-bg"), bordercolor: cssColor("--tooltip-border"), font: { color: fg } },
    margin: { l: 64, r: 24, t: 24, b: 52 },
  };
}

function deepMerge(base: any, over: any): any {
  if (Array.isArray(over) || typeof over !== "object" || over === null) return over;
  const out: any = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(over)) out[k] = typeof v === "object" && v !== null && !Array.isArray(v) && !(ArrayBuffer.isView(v)) ? deepMerge(out[k], v) : v;
  return out;
}

/** Apply the theme to every axis in *layout* (xaxis2, yaxis3 ...). */
export function withTheme(layout: Partial<Plotly.Layout>, dark: boolean): Partial<Plotly.Layout> {
  const theme = themeLayout(dark);
  let merged = deepMerge(theme, layout);
  for (const key of Object.keys(layout)) {
    if (/^[xy]axis\d+$/.test(key)) merged[key] = deepMerge(theme[key.startsWith("x") ? "xaxis" : "yaxis"], (layout as any)[key]);
  }
  return merged;
}

export type PlotProps = {
  data: Partial<Plotly.Data>[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
  style?: React.CSSProperties;
  onRelayout?: (e: Plotly.PlotRelayoutEvent, el: HTMLElement) => void;
  onClick?: (e: Plotly.PlotMouseEvent) => void;
  /** Called with the graph div once drawn (for image export etc.). */
  onReady?: (el: HTMLElement) => void;
  /** Curve highlighting (default: on for plots of two or more line traces without images). */
  highlight?: boolean;
};

const HIGHLIGHT_DIM = 0.22;

/** Line plots: clicking a curve or its legend entry highlights it (the others fade); Esc clears.
 *  Double-clicking a legend entry shows only that curve (Plotly's own behaviour). */
function highlighted(data: Partial<Plotly.Data>[], pinned: number | null): Partial<Plotly.Data>[] {
  if (pinned == null || pinned >= data.length) return data;
  return data.map((d: any, i) => {
    if (i === pinned) return { ...d, opacity: 1, line: { ...(d.line ?? {}), width: (d.line?.width ?? 2) + 1.5 } };
    return { ...d, opacity: (d.opacity ?? 1) * HIGHLIGHT_DIM };
  });
}

export function Plot({ data, layout, config, className, style, onRelayout, onClick, onReady, highlight }: PlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const device = useApp((s) => pointerDevice(s.settings));
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [plotly, setPlotly] = useState<PlotlyModule | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const canHighlight =
    highlight ?? (data.length >= 2 && data.every((d: any) => !d.type || d.type === "scatter" || d.type === "scattergl") && data.some((d: any) => String(d.mode ?? "lines").includes("lines")));
  const canHighlightRef = useRef(canHighlight);
  canHighlightRef.current = canHighlight;
  const handlers = useRef({ onRelayout, onClick, onReady });
  handlers.current = { onRelayout, onClick, onReady };
  // a different figure forgets the highlighted curve
  const traceKey = data.map((d: any) => d.name ?? "").join("|") + `#${data.length}`;
  useEffect(() => setPinned(null), [traceKey]);

  useEffect(() => {
    let alive = true;
    loadPlotly().then((m) => alive && setPlotly(m));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current as any;
    if (!plotly || !el) return;
    const fullLayout = withTheme({ autosize: true, ...(layout ?? {}) }, dark);
    plotly.react(el, (canHighlight ? highlighted(data, pinned) : data) as any, fullLayout as any, {
      responsive: true,
      displaylogo: false,
      scrollZoom: true,
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toImage"],
      ...(config ?? {}),
    } as any);
    if (!el.__avasBound) {
      el.__avasBound = true;
      el.on("plotly_relayout", (e: any) => handlers.current.onRelayout?.(e, el));
      el.on("plotly_click", (e: any) => {
        const curve = e?.points?.[0]?.curveNumber;
        if (canHighlightRef.current && typeof curve === "number") setPinned((p) => (p === curve ? null : curve));
        handlers.current.onClick?.(e);
      });
      el.on("plotly_legendclick", (e: any) => {
        if (!canHighlightRef.current) return true;
        setPinned((p) => (p === e.curveNumber ? null : e.curveNumber));
        return false; // instead of hiding the curve
      });
    }
    handlers.current.onReady?.(el);
  }, [plotly, data, layout, config, dark, pinned, canHighlight]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !plotly || config?.staticPlot || config?.scrollZoom === false) return;
    return bindPlotWheel(el, device, (update) => { void plotly.relayout(el, update as any); });
  }, [plotly, device, config?.staticPlot, config?.scrollZoom]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !plotly) return;
    // redraw once the size settles, not on every frame of a window drag
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if ((el as any)._fullLayout) plotly.Plots.resize(el as any);
      }, 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, [plotly]);

  useEffect(
    () => () => {
      if (ref.current && plotly) plotly.purge(ref.current as any);
    },
    [plotly],
  );

  return (
    <div
      className={className}
      style={{ position: "relative", minHeight: 120, outline: "none", ...style }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && pinned != null) {
          setPinned(null);
          e.stopPropagation();
        }
      }}
    >
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      {!plotly && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner size={22} />
        </div>
      )}
    </div>
  );
}
