// Turn the backend's figure descriptions (avas/webgui/services/results.py) into Plotly data/layout.
import { seriesColor } from "../components/Plot";

export type Trace = { x: ArrayLike<number>; y: ArrayLike<number>; color?: string | null; name?: string | null; markers?: boolean; legend?: boolean; y2?: boolean };
export type LinesFig = { kind: "lines"; traces: Trace[]; xlabel: string; ylabel: string; ylabel2?: string; xlim?: number[] | null; ylim?: number[] | null; legend?: boolean; xdtick?: number; yPlain?: boolean };
export type BarFig = { kind: "bar"; traces: Trace[]; xlabel: string; ylabel: string };
export type DensityFig = { kind: "density"; x: ArrayLike<number>; y: ArrayLike<number>; z: Float32Array; rows: number; cols: number; xlabel: string; ylabel: string; colorscale: [number, string][] };
export type AcceptanceFig = {
  kind: "acceptance";
  scatter: { x: ArrayLike<number>; y: ArrayLike<number> };
  ellipse: { x: ArrayLike<number>; y: ArrayLike<number> };
  xlabel: string;
  ylabel: string;
  result: { emit: number; norm: number | null; pos: number; angle: number };
};
export type Figure = LinesFig | BarFig | DensityFig | AcceptanceFig;

function arr(a: ArrayLike<number>): number[] {
  return Array.from(a);
}

export function toPlotly(fig: Figure, dark: boolean): { data: any[]; layout: any } {
  if (fig.kind === "lines") {
    const data = fig.traces.map((t) => ({
      type: "scattergl",
      mode: t.markers ? "lines+markers" : "lines",
      x: t.x,
      y: t.y,
      name: t.name ?? undefined,
      showlegend: !!t.legend,
      line: { color: seriesColor(t.color ?? undefined, dark), width: 1.6 },
      marker: { size: 6, color: seriesColor(t.color ?? undefined, dark) },
      yaxis: t.y2 ? "y2" : "y",
      hovertemplate: `%{x:.6g}, %{y:.6g}<extra>${t.name ?? ""}</extra>`,
    }));
    const layout: any = {
      xaxis: { title: { text: fig.xlabel }, ...(fig.xlim ? { range: fig.xlim } : {}), ...(fig.xdtick ? { dtick: fig.xdtick } : {}) },
      yaxis: { title: { text: fig.ylabel }, ...(fig.ylim ? { range: fig.ylim } : {}), exponentformat: "none" },
      showlegend: !!fig.legend,
      legend: { x: 1, xanchor: "right", y: 1 },
      hovermode: "closest",
    };
    if (fig.ylabel2) {
      layout.yaxis2 = { title: { text: fig.ylabel2 }, overlaying: "y", side: "right", showgrid: false, mirror: false };
      layout.legend = { x: 0.01, xanchor: "left", y: 0.99 };
      layout.margin = { r: 64 };
    }
    return { data, layout };
  }
  if (fig.kind === "bar") {
    return {
      data: fig.traces.map((t) => ({ type: "bar", x: t.x, y: t.y, marker: { color: seriesColor(t.color ?? "r", dark) }, width: 0.8 })),
      layout: { xaxis: { title: { text: fig.xlabel }, dtick: 1 }, yaxis: { title: { text: fig.ylabel } }, showlegend: false, bargap: 0.2 },
    };
  }
  if (fig.kind === "density") {
    const z: number[][] = [];
    for (let r = 0; r < fig.rows; r++) z.push(arr(fig.z.subarray(r * fig.cols, (r + 1) * fig.cols)));
    return {
      data: [{ type: "heatmap", x: fig.x, y: fig.y, z, zmin: 0, zmax: 1, colorscale: fig.colorscale, zsmooth: false, colorbar: { title: { text: "Density" }, thickness: 14 }, hovertemplate: "z=%{x:.4g} m<br>%{y:.4g}<br>%{z:.3f}<extra></extra>" }],
      layout: { xaxis: { title: { text: fig.xlabel } }, yaxis: { title: { text: fig.ylabel } } },
    };
  }
  return {
    data: [
      { type: "scattergl", mode: "markers", x: fig.scatter.x, y: fig.scatter.y, name: "lost particles (at the entrance)", marker: { size: 3, color: seriesColor("fg", dark), opacity: 0.8 } },
      { type: "scatter", mode: "lines", x: fig.ellipse.x, y: fig.ellipse.y, name: "acceptance", line: { color: seriesColor("r", dark), width: 2 } },
    ],
    layout: { xaxis: { title: { text: fig.xlabel } }, yaxis: { title: { text: fig.ylabel } }, legend: { x: 1, xanchor: "right", y: 1 } },
  };
}
