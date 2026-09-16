// Phase-space viewer for a .dst file or one step of a .plt file:
// four density panels with the rms ellipse, percent emittances, zoom re-binning.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { reportError } from "../components/overlays";
import { Plot } from "../components/Plot";
import { Button, Icon, IconButton, Select, Spinner, TextInput } from "../components/ui";
import { fmtG } from "../format";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { exportFigure } from "./PlotTab";

const COORDS: { value: string; label: string }[] = [
  { value: "x", label: "X" },
  { value: "y", label: "Y" },
  { value: "z", label: "Z" },
  { value: "x1", label: "X'" },
  { value: "y1", label: "Y'" },
  { value: "z1", label: "Z'" },
  { value: "phi", label: "Φ" },
  { value: "w_minus_mean", label: "W" },
  { value: "dp_p_100", label: "dp/p" },
];
const DEFAULT_PLANES: [string, string][] = [
  ["x", "x1"],
  ["y", "y1"],
  ["phi", "w_minus_mean"],
  ["x", "y"],
];

type Panel = {
  plane: [string, string];
  title: string;
  xTitle: string;
  yTitle: string;
  image: Float32Array;
  w: number;
  h: number;
  extent: number[];
  range: number[];
  ellipse: { x: ArrayLike<number>; y: ArrayLike<number> } | null;
  twiss: number[] | null;
};
type Panels = { panels: Panel[]; number: number; energy: number; twissText: string; colorscale: [number, string][] };

type Source =
  | { kind: "dst"; files: string[]; initial?: string }
  | { kind: "plt"; files: string[]; initial?: string };

function basename(p: string) {
  return p.split(/[\\/]/).pop() ?? p;
}

function toRows(img: Float32Array, w: number, h: number) {
  const rows: number[][] = [];
  for (let r = 0; r < h; r++) rows.push(Array.from(img.subarray(r * w, (r + 1) * w)));
  return rows;
}

export function PhaseViewer({ source, outputDir, refreshKey }: { source: Source; outputDir?: string; refreshKey: number }) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [file, setFile] = useState<string>(source.initial ?? source.files[0] ?? "");
  const [pltInfo, setPltInfo] = useState<{ steps: number; items: { step: number; location: number; index: number }[] } | null>(null);
  const [step, setStep] = useState(0);
  const [stepText, setStepText] = useState("0");
  const [handle, setHandle] = useState<{ handle: string; number: number; energy: number; location?: number; title: string } | null>(null);
  const [planes, setPlanes] = useState<[string, string][]>(DEFAULT_PLANES);
  const [percent, setPercent] = useState("100");
  const [data, setData] = useState<Panels | null>(null);
  const [zoomImages, setZoomImages] = useState<Record<number, { image: Float32Array; w: number; h: number; extent: number[] }>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showText, setShowText] = useState(true);
  const rebinTimer = useRef(0);

  // plt: list steps
  useEffect(() => {
    if (source.kind !== "plt" || !file) return;
    setPltInfo(null);
    call<any>("phase.pltInfo", { path: file })
      .then((info) => {
        setPltInfo(info);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [file, source.kind, refreshKey]);

  const open = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    try {
      const h = source.kind === "dst" ? await call<any>("phase.openDst", { path: file }) : await call<any>("phase.openPlt", { path: file, step, outputDir });
      setHandle(h);
      setError(null);
    } catch (e: any) {
      setHandle(null);
      setData(null);
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [file, step, source.kind, outputDir]);

  useEffect(() => {
    if (source.kind === "dst" || pltInfo) open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, step, pltInfo, refreshKey]);

  const ratio = Math.min(100, Math.max(1, Number(percent) || 100)) / 100;
  const planesKey = JSON.stringify(planes);
  useEffect(() => {
    if (!handle) return;
    let alive = true;
    setBusy(true);
    call<Panels>("phase.panels", { handle: handle.handle, planes, ratio })
      .then((d) => {
        if (!alive) return;
        setData(d);
        setZoomImages({});
        setError(null);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, planesKey, ratio]);

  const figure = useMemo(() => {
    if (!data) return null;
    const traces: any[] = [];
    const layout: any = {
      grid: { rows: 2, columns: 2, pattern: "independent", xgap: 0.16, ygap: 0.18 },
      margin: { l: 56, r: 20, t: 44, b: 36 },
      showlegend: false,
      annotations: [] as any[],
      // keep the user's zoom when re-binned images arrive
      uirevision: `${handle?.handle}:${planesKey}`,
    };
    data.panels.forEach((p, i) => {
      const s = i ? String(i + 1) : "";
      const z = zoomImages[i] ?? p;
      const [x0, x1, y0, y1] = z.extent;
      const col = i % 2;
      const row = Math.floor(i / 2);
      traces.push({
        type: "heatmap",
        z: toRows(z.image, z.w, z.h),
        x0,
        dx: (x1 - x0) / Math.max(1, z.w - 1),
        y0,
        dy: (y1 - y0) / Math.max(1, z.h - 1),
        zmin: 0,
        zmax: 1,
        zsmooth: false,
        colorscale: data.colorscale,
        showscale: true,
        colorbar: { thickness: 10, len: 0.38, x: col === 0 ? 0.43 : 1.0, y: row === 0 ? 0.8 : 0.2, tickfont: { size: 10 } },
        xaxis: `x${s}`,
        yaxis: `y${s}`,
        hovertemplate: `${p.xTitle}=%{x:.4g}<br>${p.yTitle}=%{y:.4g}<extra></extra>`,
      });
      if (p.ellipse) traces.push({ type: "scatter", mode: "lines", x: p.ellipse.x, y: p.ellipse.y, xaxis: `x${s}`, yaxis: `y${s}`, line: { color: "#ff2020", width: 1.6 }, hoverinfo: "skip" });
      layout[`xaxis${s}`] = { range: [p.range[0], p.range[1]], showgrid: true, griddash: "dash", zeroline: false };
      layout[`yaxis${s}`] = { range: [p.range[2], p.range[3]], showgrid: true, griddash: "dash", zeroline: false };
      layout.annotations.push({ text: `<b>${p.title}</b>`, xref: `x${s} domain`, yref: `y${s} domain`, x: 0.5, y: 1.08, showarrow: false, font: { size: 13 } });
    });
    return { traces, layout };
  }, [data, zoomImages, dark, handle, planesKey]);

  const onRelayout = (e: any, el: HTMLElement) => {
    if (!data || !handle) return;
    window.clearTimeout(rebinTimer.current);
    rebinTimer.current = window.setTimeout(async () => {
      const full = (el as any)?._fullLayout;
      if (!full) return;
      for (let i = 0; i < data.panels.length; i++) {
        const s = i ? String(i + 1) : "";
        const keys = Object.keys(e);
        if (!keys.some((k) => k.startsWith(`xaxis${s}.`) || k.startsWith(`yaxis${s}.`))) continue;
        if (keys.some((k) => k === `xaxis${s}.autorange` || k === `yaxis${s}.autorange`)) {
          setZoomImages((z) => {
            const n = { ...z };
            delete n[i];
            return n;
          });
          continue;
        }
        const xr = full[`xaxis${s}`].range;
        const yr = full[`yaxis${s}`].range;
        try {
          const r = await call<any>("phase.rebin", { handle: handle.handle, plane: data.panels[i].plane, xrange: xr, yrange: yr });
          setZoomImages((z) => ({ ...z, [i]: r }));
        } catch {
          /* keep the coarse image */
        }
      }
    }, 180);
  };

  const pltItem = pltInfo?.items[step];

  return (
    <div className="phase-viewer">
      <div className="plot-options wrap">
        <span className="muted">{source.kind === "dst" ? t("Particle file") : t("plt file")}</span>
        <Select
          value={file}
          style={{ minWidth: 220, maxWidth: 360 }}
          options={[...new Set([...source.files, ...(file ? [file] : [])])].map((f) => ({ value: f, label: `${basename(f)}  ·  ${f.split(/[\\/]/).slice(-2, -1)[0] ?? ""}` }))}
          onChange={setFile}
        />
        <IconButton
          icon="folder-opened"
          tip={t("Other file...")}
          onClick={async () => {
            try {
              const p = await call<string | null>("dialog.openFile", { directory: outputDir ?? "", filters: source.kind === "dst" ? ["DST (*.dst)"] : ["PLT (*.plt)"] });
              if (p) setFile(p);
            } catch (e) {
              reportError(e);
            }
          }}
        />
        {source.kind === "plt" && pltInfo && (
          <>
            <span className="muted">{t("Step")}</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, pltInfo.steps - 1)}
              value={step}
              onChange={(e) => {
                setStepText(e.target.value);
              }}
              onMouseUp={() => setStep(Number(stepText))}
              onKeyUp={() => setStep(Number(stepText))}
              style={{ width: 180 }}
            />
            <TextInput
              value={stepText}
              style={{ width: 56 }}
              onChange={(e) => setStepText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setStep(Math.max(0, Math.min(pltInfo.steps - 1, Number(stepText) || 0)));
              }}
            />
            <span className="muted">
              / {pltInfo.steps - 1}
              {pltItem ? `  ·  z = ${fmtG(pltItem.location, 5)} m` : ""}
            </span>
          </>
        )}
        <span className="divider-v" />
        <span className="muted">{t("Emittance (%)")}</span>
        <TextInput value={percent} style={{ width: 56 }} invalid={!(Number(percent) >= 1 && Number(percent) <= 100)} onChange={(e) => setPercent(e.target.value)} />
        <div className="grow" />
        {busy && <Spinner />}
        <IconButton icon="output" active={showText} tip={t("Twiss parameters and emittances")} onClick={() => setShowText(!showText)} />
        <Button small icon="save" disabled={!handle} onClick={() => handle && exportFigure("phase", { handle: handle.handle, planes, ratio }, outputDir, basename(file).replace(/\.\w+$/, ""))}>
          {t("Save image")}
        </Button>
      </div>
      <div className="plot-options wrap">
        {planes.map((pl, i) => (
          <span key={i} className="plane-pick">
            <span className="soft">P{i + 1}</span>
            <Select value={pl[0]} options={COORDS.filter((c) => c.value !== pl[1])} onChange={(v) => setPlanes((ps) => ps.map((p, k) => (k === i ? [v, p[1]] : p)))} />
            <span className="soft">–</span>
            <Select value={pl[1]} options={COORDS.filter((c) => c.value !== pl[0])} onChange={(v) => setPlanes((ps) => ps.map((p, k) => (k === i ? [p[0], v] : p)))} />
          </span>
        ))}
        {data && (
          <span className="muted" style={{ marginLeft: "auto" }}>
            {t("Particle number {n}, energy {e} MeV", { n: data.number.toLocaleString(), e: data.energy.toFixed(3) })}
          </span>
        )}
      </div>
      <div className="phase-body">
        <div className="phase-plot">
          {error ? (
            <div className="plot-error">
              <Icon name="warning" />
              <span className="selectable">{error}</span>
            </div>
          ) : figure ? (
            <Plot data={figure.traces} layout={figure.layout} onRelayout={onRelayout} style={{ position: "absolute", inset: 0 }} />
          ) : (
            <div className="plot-error">
              <Spinner size={22} />
            </div>
          )}
        </div>
        {showText && data && (
          <pre className="twiss-text selectable mono">
            {data.twissText}
            {"\n"}
            <span className="soft">{t("Ellipses: full emittance of the selected fraction, centred at 0.")}</span>
          </pre>
        )}
      </div>
    </div>
  );
}
