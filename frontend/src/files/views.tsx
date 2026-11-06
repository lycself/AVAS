import { createRestorationTracker, type RestorationHandle } from "./restorationOrigin";
// Read-only viewers for particle distributions and field maps, and a plain text editor.
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { call } from "../bridge";
import { reportError } from "../components/overlays";
import { Plot, seriesColor } from "../components/Plot";
import { Button, Spinner, Tabs } from "../components/ui";
import { fmtG } from "../format";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import { defineThemes, monaco } from "../lattice/monaco";
import { FieldSliceView } from "./FieldSlice";

function InfoTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <table className="info-table selectable">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="muted">{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The rms ellipse of points (x, y) from their covariance: ⟨(u−ū)²⟩ etc., centred on the mean. */
export function rmsEllipse(x: ArrayLike<number>, y: ArrayLike<number>, n = 160) {
  const m = Math.min(x.length, y.length);
  let mx = 0;
  let my = 0;
  for (let i = 0; i < m; i++) {
    mx += x[i];
    my += y[i];
  }
  mx /= m || 1;
  my /= m || 1;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < m; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= m || 1;
  syy /= m || 1;
  sxy /= m || 1;
  const ex: number[] = [];
  const ey: number[] = [];
  if (!(sxx > 0) || !(syy > 0)) return { x: ex, y: ey };
  // points of Σ^½·(cos θ, sin θ): the Cholesky factor of the covariance maps the unit circle onto the ellipse
  const a = Math.sqrt(sxx);
  const b = sxy / a;
  const c = Math.sqrt(Math.max(syy - b * b, 0));
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n;
    ex.push(mx + a * Math.cos(th));
    ey.push(my + b * Math.cos(th) + c * Math.sin(th));
  }
  return { x: ex, y: ey };
}

export function ParticlesView({ path, onUseAsBeam, plotHeight, ellipses }: { path: string; onUseAsBeam?: () => void; plotHeight?: number; ellipses?: boolean }) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    call<any>("files.particles", { path })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [path]);
  const traces = useMemo(() => {
    if (!data) return [];
    const color = seriesColor("accent", dark);
    const mk = (x: ArrayLike<number>, y: ArrayLike<number>, ax: string) => ({
      type: "scattergl",
      mode: "markers",
      x,
      y,
      xaxis: `x${ax}`,
      yaxis: `y${ax}`,
      marker: { size: 2, color, opacity: 0.5 },
      hoverinfo: "skip",
    });
    const pairs: [ArrayLike<number>, ArrayLike<number>, string][] = [[data.x, data.xp, ""], [data.y, data.yp, "2"], [data.phi, data.w, "3"]];
    const ring = seriesColor("r", dark);
    const rings = ellipses
      ? pairs.map(([x, y, ax]) => ({ ...rmsEllipse(x, y), type: "scatter", mode: "lines", xaxis: `x${ax}`, yaxis: `y${ax}`, line: { color: ring, width: 1.5 }, hoverinfo: "skip" }))
      : [];
    return [...pairs.map(([x, y, ax]) => mk(x, y, ax)), ...rings] as any[];
  }, [data, dark, ellipses]);
  if (error) return <div className="danger-text">{error}</div>;
  if (!data) return <Spinner />;
  const twissRow = (pl: string) => {
    const tw = data.twiss[pl];
    if (!tw) return null;
    return [`Twiss ${pl}`, `α = ${fmtG(tw[0], 5)},  β = ${fmtG(tw[1], 5)} mm/π·mrad,  ε = ${fmtG(tw[2], 5)} π·mm·mrad`] as [string, string];
  };
  const rows: [string, React.ReactNode][] = [
    [t("Particles"), data.number.toLocaleString()],
    [t("Beam current"), `${fmtG(data.ib)} mA`],
    [t("Frequency"), `${fmtG(data.freq)} MHz`],
    [t("Rest mass"), `${fmtG(data.mc2)} MeV`],
    [t("Mean kinetic energy"), `${fmtG(data.energy)} MeV`],
  ];
  if (data.extended) rows.push([t("Species (charge e, mass MeV)"), data.species.map((s: number[]) => `${fmtG(s[0])}/${fmtG(s[1])}`).join(", ") + (data.moreSpecies ? " …" : "")]);
  for (const pl of ["x", "y", "z"]) {
    const r = twissRow(pl);
    if (r) rows.push(r);
  }
  const layout: any = {
    grid: { rows: 1, columns: 3, pattern: "independent" },
    showlegend: false,
    margin: { l: 56, r: 12, t: 12, b: 48 },
    xaxis: { title: { text: "x (mm)" } },
    yaxis: { title: { text: "x' (mrad)" } },
    xaxis2: { title: { text: "y (mm)" } },
    yaxis2: { title: { text: "y' (mrad)" } },
    xaxis3: { title: { text: "φ (deg)" } },
    yaxis3: { title: { text: "W (MeV)" } },
  };
  return (
    <div className="col" style={{ gap: 10, flex: 1, minHeight: 0 }}>
      <div className="row">
        <span className="muted grow">
          {t("Particle distribution (TraceWin {fmt} format), read-only.", { fmt: data.extended ? ".edst" : ".dst" })}
          {data.shown < data.number ? "  " + t("Plots show {n} randomly chosen particles.", { n: data.shown.toLocaleString() }) : ""}
          {ellipses ? "  " + t("The red curve is the rms ellipse of the particles shown.") : ""}
        </span>
        {!data.extended && onUseAsBeam && (
          <Button icon="arrow-right" onClick={onUseAsBeam} tip={t("Set this file as readparticledistribution on the Beam page")}>
            {t("Use as initial beam")}
          </Button>
        )}
      </div>
      <InfoTable rows={rows} />
      <Plot data={traces} layout={layout} style={plotHeight ? { height: plotHeight } : { flex: 1, minHeight: 280 }} />
    </div>
  );
}

export function FieldMapView({ path }: { path: string }) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"profile" | "slice">("profile");
  useEffect(() => {
    setData(null);
    setError(null);
    call<any>("files.fieldmap", { path })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [path]);
  if (error) return <div className="danger-text">{error}</div>;
  if (!data) return <Spinner />;
  const users = data.usedBy.map((u: any) => (typeof u === "string" ? u : t("line {n}", { n: u.line })));
  const shown = users.length > 12 ? [...users.slice(0, 12), t("… {n} more", { n: users.length - 12 })] : users;
  const rows: [string, React.ReactNode][] = [
    [t("Component"), `.${data.ext}: ${pick(data.meaning)}`],
    [t("Storage"), data.binary ? t("binary (float32)") : t("text")],
    [t("Length"), `${fmtG(data.length)} m`],
    [t("Grid"), `Nz = ${data.nz}, Nx = ${data.nx}, Ny = ${data.ny}  (${data.points.toLocaleString()} ${t("points")})`],
    [t("Transverse range"), `x ∈ [${fmtG(data.xRange[0])}, ${fmtG(data.xRange[1])}] m,  y ∈ [${fmtG(data.yRange[0])}, ${fmtG(data.yRange[1])}] m`],
    [t("Normalisation"), fmtG(data.norm)],
    [t("Files of '{name}'", { name: data.base }), data.found.map((e: string) => `.${e}`).join("  ") || "–"],
    [t("Used by"), shown.length ? shown.join(", ") : t("no element of the lattice used for the run")],
  ];
  const traces: any[] = [
    { type: "scatter", mode: "lines", x: data.z, y: data.peak, name: t("max |F| over the cross-section"), line: { color: seriesColor("accent", dark) } },
    { type: "scatter", mode: "lines", x: data.z, y: data.axis, name: t("on axis (x = y = 0)"), line: { color: seriesColor("orange", dark) } },
  ];
  const flat = !data.nx && !data.ny;      // a map with no transverse grid has nothing to slice
  return (
    <div className="col" style={{ gap: 10, flex: 1, minHeight: 0 }}>
      <InfoTable rows={rows} />
      {!flat && (
        <Tabs
          value={view}
          onChange={setView}
          tabs={[
            { value: "profile" as const, label: t("Along z"), tip: t("Field on the axis and the largest value of each cross-section") },
            { value: "slice" as const, label: t("Slices"), tip: t("Heat map through the map; a storage order guessed wrong shows up as stripes along z") },
          ]}
        />
      )}
      {view === "profile" || flat ? (
        <Plot
          data={traces}
          layout={{ xaxis: { title: { text: "z (m)" } }, yaxis: { title: { text: `.${data.ext} ${t("(file units)")}` } }, legend: { x: 1, xanchor: "right", y: 1 } } as any}
          style={{ flex: 1, minHeight: 260 }}
        />
      ) : (
        <FieldSliceView key={path} source={{ kind: "file", path }} />
      )}
    </div>
  );
}

export type PlainEditorHandle = RestorationHandle & { getText: () => string; setText: (t: string, revision?: string) => void };

export const PlainEditor = forwardRef<PlainEditorHandle, { initialText: string; readOnly?: boolean; onChange: (text: string) => void }>(function PlainEditor({ initialText, readOnly, onChange }, ref) {
  const restoration = useRef(createRestorationTracker());
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const syncing = useRef(false);
  const cb = useRef(onChange);
  cb.current = onChange;
  const theme = useApp((s) => s.resolvedTheme);
  useEffect(() => {
    defineThemes();
    const ed = monaco.editor.create(host.current!, {
      value: initialText,
      language: "plaintext",
      automaticLayout: true,
      fontFamily: '"Cascadia Mono", Consolas, "Courier New", monospace',
      fontSize: 13,
      minimap: { enabled: false },
      readOnly: !!readOnly,
      scrollBeyondLastLine: false,
      unicodeHighlight: { ambiguousCharacters: false },
    });
    editor.current = ed;
    ed.onDidChangeModelContent((event) => {
      restoration.current.change(ed.getModel()!.getAlternativeVersionId(), event);
      if (!syncing.current) cb.current(ed.getValue());
    });
    return () => {
      ed.getModel()?.dispose();
      ed.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => defineThemes(), [theme]);
  useEffect(() => editor.current?.updateOptions({ readOnly: !!readOnly }), [readOnly]);
  useImperativeHandle(ref, () => ({
    getText: () => editor.current?.getValue() ?? "",
    getRestoration: () => restoration.current.get(),
    finishHistorySave: (origin) => restoration.current.saved(origin),
    setText: (text, revision) => {
      const ed = editor.current;
      if (!ed || ed.getValue() === text) return;
      syncing.current = true;
      try {
        // keep undo history: replace through an edit
        ed.pushUndoStop();
        ed.executeEdits("table", [{ range: ed.getModel()!.getFullModelRange(), text }]);
        ed.pushUndoStop();
        if (revision) restoration.current.restored(ed.getModel()!.getAlternativeVersionId(), revision);
      } finally {
        syncing.current = false;
      }
    },
  }));
  return <div ref={host} className="monaco-host" />;
});

export async function useParticlesAsBeam(name: string) {
  try {
    await call("beam.useParticles", { name });
  } catch (e) {
    reportError(e);
  }
}
