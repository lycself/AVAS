// Plotly figure that follows the light/dark theme.  Figures are described
// without colours for chrome; semantic series colours ("r", "b", ...) are
// mapped to a palette readable on both backgrounds.
import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/app";
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

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function themeLayout(dark: boolean): Partial<Plotly.Layout> {
  const fg = cssVar("--fg") || (dark ? "#cccccc" : "#3b3b3b");
  const grid = dark ? "#333333" : "#e6e6e6";
  const line = dark ? "#5a5a5a" : "#9a9a9a";
  const bg = cssVar("--editor-bg") || (dark ? "#1f1f1f" : "#ffffff");
  const axis = { gridcolor: grid, linecolor: line, zerolinecolor: line, tickcolor: line, showline: true, mirror: true, ticks: "outside" as const, automargin: true };
  return {
    paper_bgcolor: bg,
    plot_bgcolor: bg,
    font: { family: '"Segoe UI", "Microsoft YaHei UI", sans-serif', size: 12, color: fg },
    xaxis: axis,
    yaxis: axis,
    legend: { bgcolor: "rgba(0,0,0,0)", bordercolor: grid },
    colorway: ["r", "b", "g", "m", "blueviolet", "c", "orange"].map((c) => seriesColor(c, dark)),
    hoverlabel: { bgcolor: cssVar("--tooltip-bg"), bordercolor: cssVar("--tooltip-border"), font: { color: fg } },
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
};

export function Plot({ data, layout, config, className, style, onRelayout, onClick, onReady }: PlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [plotly, setPlotly] = useState<PlotlyModule | null>(null);
  const handlers = useRef({ onRelayout, onClick, onReady });
  handlers.current = { onRelayout, onClick, onReady };

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
    plotly.react(el, data as any, fullLayout as any, {
      responsive: true,
      displaylogo: false,
      scrollZoom: true,
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toImage"],
      ...(config ?? {}),
    } as any);
    if (!el.__avasBound) {
      el.__avasBound = true;
      el.on("plotly_relayout", (e: any) => handlers.current.onRelayout?.(e, el));
      el.on("plotly_click", (e: any) => handlers.current.onClick?.(e));
    }
    handlers.current.onReady?.(el);
  }, [plotly, data, layout, config, dark]);

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
    <div className={className} style={{ position: "relative", minHeight: 120, ...style }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      {!plotly && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner size={22} />
        </div>
      )}
    </div>
  );
}
