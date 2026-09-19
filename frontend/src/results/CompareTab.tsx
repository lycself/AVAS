// Results page: one quantity of several runs (OutputFile, archived runs, segment runs) in one figure.
import { useEffect, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { Plot, seriesColor } from "../components/Plot";
import { Checkbox, Icon, IconButton, Select, Spinner } from "../components/ui";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import type { LinesFig } from "./figures";

export type CompareSource = { kind: string; label: string; outputDir: string; status?: string | null; time?: string | null; zStart?: number | null };

const PALETTE = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#e377c2", "#17becf"]; // design:allow-colour Plotly series palette, one colour per run

export function CompareTab({
  sources,
  initial,
  choices,
  refreshKey,
}: {
  sources: CompareSource[];
  initial: string[];
  choices: string[];
  refreshKey: number;
}) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [type, setType] = useState(choices[0] ?? "rms_x");
  const [selected, setSelected] = useState<string[]>(initial);
  const [alignZ, setAlignZ] = useState(true);
  const [figs, setFigs] = useState<Record<string, LinesFig | { error: string }>>({});
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  const usable = sources.filter((s) => s.status === "finished" || s.kind === "project");
  const key = selected.join("|");

  useEffect(() => {
    const my = ++seq.current;
    if (!selected.length) {
      setFigs({});
      return;
    }
    setLoading(true);
    (async () => {
      const out: Record<string, LinesFig | { error: string }> = {};
      await Promise.all(
        selected.map(async (dir) => {
          try {
            out[dir] = await call<LinesFig>("results.figure", { plot: "dataset", params: { type }, outputDir: dir });
          } catch (e: any) {
            out[dir] = { error: e?.message ?? String(e) };
          }
        }),
      );
      if (my !== seq.current) return;
      setFigs(out);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, type, refreshKey]);

  const plotly = useMemo(() => {
    const data: any[] = [];
    let xlabel = "";
    let ylabel = "";
    selected.forEach((dir, i) => {
      const src = usable.find((s) => s.outputDir === dir);
      const fig = figs[dir];
      if (!src || !fig || "error" in fig) return;
      xlabel = fig.xlabel;
      ylabel = fig.ylabel;
      const shift = alignZ && src.kind === "segment" && src.zStart ? src.zStart : 0;
      const color = PALETTE[i % PALETTE.length];
      fig.traces.forEach((tr, j) => {
        const x = shift ? Array.from(tr.x, (v) => v + shift) : tr.x;
        data.push({
          type: "scattergl",
          mode: "lines",
          x,
          y: tr.y,
          name: fig.traces.length > 1 ? `${sourceName(src, t)} · ${tr.name ?? j + 1}` : sourceName(src, t),
          legendgroup: dir,
          showlegend: true,
          line: { color: j === 0 ? color : seriesColor(tr.color ?? undefined, dark), width: 1.6, dash: j === 0 ? "solid" : j === 1 ? "dash" : "dot" },
          hovertemplate: `%{x:.6g}, %{y:.6g}<extra>${sourceName(src, t)}${tr.name ? " · " + tr.name : ""}</extra>`,
        });
      });
    });
    return {
      data,
      layout: { xaxis: { title: { text: xlabel } }, yaxis: { title: { text: ylabel }, exponentformat: "none" as const }, showlegend: true, legend: { x: 1, xanchor: "right" as const, y: 1 }, hovermode: "closest" as const },
    };
  }, [figs, selected, usable, alignZ, dark, t]);

  const errors = selected.map((dir) => ({ dir, fig: figs[dir] })).filter((e) => e.fig && "error" in e.fig) as { dir: string; fig: { error: string } }[];

  return (
    <div className="plot-tab">
      <div className="plot-options">
        <span className="opt">
          <span className="muted">{t("Quantity")}</span>
          <Select value={type} options={choices.map((c) => ({ value: c, label: c }))} onChange={setType} />
        </span>
        <Checkbox checked={alignZ} onChange={setAlignZ} label={t("Align segment runs to the full lattice (z)")} />
        <div className="grow" />
        {loading && <Spinner />}
        <IconButton icon="refresh" tip={t("Refresh")} onClick={() => setSelected((s) => [...s])} />
      </div>
      <div className="compare-layout">
        <div className="compare-sources">
          <div className="muted" style={{ marginBottom: 4 }}>
            {t("Runs to compare")}
          </div>
          {usable.length === 0 && <div className="muted">{t("no finished runs")}</div>}
          {usable.map((s) => (
            <Checkbox
              key={s.outputDir}
              checked={selected.includes(s.outputDir)}
              onChange={(v) => setSelected((cur) => (v ? [...cur, s.outputDir] : cur.filter((d) => d !== s.outputDir)))}
              label={
                <span className="compare-source-label">
                  <span>{sourceName(s, t)}</span>
                  {s.time && <span className="muted"> {s.time}</span>}
                </span>
              }
            />
          ))}
        </div>
        <div className="plot-body compare-plot">
          {selected.length === 0 ? (
            <div className="plot-error">
              <Icon name="info" />
              <span>{t("Tick at least one run on the left.")}</span>
            </div>
          ) : (
            <Plot data={plotly.data} layout={plotly.layout} style={{ position: "absolute", inset: 0 }} />
          )}
        </div>
      </div>
      {errors.length > 0 && (
        <div className="plot-footer warning-text">
          {errors.map((e) => (
            <span key={e.dir} className="selectable">
              {sourceName(usable.find((s) => s.outputDir === e.dir) ?? { kind: "", label: e.dir, outputDir: e.dir }, t)}: {e.fig.error}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function sourceName(s: CompareSource, t: (k: string, a?: Record<string, string | number>) => string): string {
  if (s.kind === "project") return `${t("Full lattice")} (OutputFile)`;
  if (s.kind === "archived") return s.label;
  if (s.kind === "segment") return t("Segment {label}", { label: s.label });
  return s.label;
}
