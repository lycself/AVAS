// Slices through a field: a heat map of one component or of |F|, with optional
// arrows for the vector in the plane.  Three sources feed it — a field-map file
// (files page), the map an element refers to, and a matrix-model element's
// field computed from its parameters — normalised to one shape by ./slice.
// For a real map the cube stays on the back end; only the plane asked for
// travels over the wire.
import { useEffect, useMemo, useState } from "react";
import { call } from "../bridge";
import { fieldScale, Plot } from "../components/Plot";
import { Checkbox, Segmented, Select, Spinner } from "../components/ui";
import { fmtG } from "../format";
import { pick, useT } from "../i18n";
import type { ElementField } from "../lattice/analyticField";
import { useApp } from "../store/app";
import { cssColor } from "../util";
import { quiver } from "./quiver";
import { analyticSlice, fromPayload, MAGNITUDE, PLANE_AXES, type Plane, type Slice } from "./slice";

export type FieldSource =
  /** A field-map file opened on the files page. */
  | { kind: "file"; path: string }
  /** The map an element refers to, by name. */
  | { kind: "map"; name: string; fieldDirs: string[] | null }
  /** A matrix-model element: no file, the field comes from its own parameters. */
  | { kind: "analytic"; field: ElementField; length: number; r: number; name: string; unit: string };

const sourceKey = (s: FieldSource) => JSON.stringify(s);

export function FieldSliceView({ source }: { source: FieldSource }) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [plane, setPlane] = useState<Plane>("zx");
  const [at, setAt] = useState<number | null>(null); // null: the default plane
  const [show, setShow] = useState(""); // "": the component the source picks
  const [withArrows, setWithArrows] = useState(true);
  const [equal, setEqual] = useState(false);
  const [remote, setRemote] = useState<Slice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = sourceKey(source);

  const analytic = source.kind === "analytic";
  const local = useMemo(
    () => (source.kind === "analytic" ? analyticSlice(source.field, { ...source, plane, at }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, plane, at],
  );

  useEffect(() => {
    if (analytic) return;
    let alive = true;
    // dragging the position slider would otherwise ask for a plane per frame
    const timer = window.setTimeout(() => {
      const [method, params] =
        source.kind === "file"
          ? ["files.fieldSlice", { path: source.path, plane, at }]
          : ["lattice.fieldSlice", { name: source.name, fieldDirs: source.fieldDirs, plane, at }];
      call<any>(method, params)
        .then((d) => {
          if (!alive) return;
          setRemote(fromPayload(d));
          setError(null);
        })
        .catch((e) => alive && setError(e.message));
    }, 120);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, plane, at, analytic]);

  const data = local ?? remote;

  const pickPlane = (p: Plane) => {
    setPlane(p);
    setAt(null);
    if (!analytic) setRemote(null);
    if (p === "xy") setEqual(true); // a cross-section is a real shape; a longitudinal cut is not
  };

  const shown = show && (show === MAGNITUDE ? data?.magnitude : data?.components[show]?.values) ? show : data?.ext;
  const field = useMemo(() => {
    if (!data || !shown) return null;
    if (shown === MAGNITUDE)
      return data.magnitude && { values: data.magnitude.values, max: data.magnitude.max, diverging: false };
    const c = data.components[shown];
    return c?.values ? { values: c.values, max: Math.max(Math.abs(c.min ?? 0), Math.abs(c.max ?? 0)), diverging: true } : null;
  }, [data, shown]);

  const rows = useMemo(() => {
    if (!data || !field) return [];
    const nu = data.u.length;
    const all = field.values;
    return Array.from({ length: data.v.length }, (_, j) =>
      ArrayBuffer.isView(all) ? (all as any).subarray(j * nu, (j + 1) * nu) : (all as number[]).slice(j * nu, (j + 1) * nu),
    );
  }, [data, field]);

  const arrowsTrace = useMemo(() => {
    if (!data || !withArrows || !data.arrows) return null;
    const fu = data.components[data.arrows[0]]?.values;
    const fv = data.components[data.arrows[1]]?.values;
    if (!fu || !fv) return null;
    // one arrow per two grid lines at most: a map with a coarse grid would
    // otherwise get an arrow per point and turn into a thicket
    const density = (n: number, most: number) => Math.min(most, Math.max(6, Math.round(n / 2)));
    const q = quiver({ u: data.u, v: data.v, fu, fv }, { nu: density(data.u.length, 24), nv: density(data.v.length, 13) });
    return q.count ? q : null;
  }, [data, withArrows]);

  if (error) return <div className="danger-text">{error}</div>;
  if (!data || !field || !shown) return <Spinner />;

  // the source has the last word: a zero-length element only has a cross-section
  const drawn = data.plane;
  const [uName, vName] = PLANE_AXES[drawn];
  const unit = data.unit;
  const options = [
    ...Object.keys(data.components)
      .filter((e) => data.components[e].values)
      .map((e) => ({ value: e, label: analytic ? e : `${pick(data.meanings[e] ?? ["", ""])} (.${e})` })),
    ...(data.magnitude
      ? [{ value: MAGNITUDE, label: t("magnitude of {list}", { list: data.magnitude.of.map((e) => (analytic ? e : `.${e}`)).join(" ") }) }]
      : []),
  ];
  const [lo, hi] = data.atRange;
  const traces: any[] = [
    {
      type: "heatmap",
      x: data.u,
      y: data.v,
      z: rows,
      colorscale: fieldScale(dark, field.diverging),
      ...(field.diverging ? { zmid: 0, zmin: -field.max, zmax: field.max } : { zmin: 0 }),
      colorbar: { title: { text: unit, side: "right" }, thickness: 12, outlinewidth: 0 },
      hovertemplate: `${uName} = %{x:.4g} m<br>${vName} = %{y:.4g} m<br>%{z:.4g} ${unit}<extra></extra>`,
    },
  ];
  if (arrowsTrace) {
    // drawn twice: a wide stroke in the page's background colour keeps the thin
    // arrows readable over any colour of the scale underneath
    const arrow = (colour: string, width: number) => ({
      type: "scatter",
      mode: "lines",
      x: arrowsTrace.x,
      y: arrowsTrace.y,
      line: { color: colour, width, shape: "linear" },
      hoverinfo: "skip",
      showlegend: false,
    });
    traces.push(arrow(cssColor("--editor-bg"), 3), arrow(cssColor("--fg"), 1.1));
  }
  const inPlaneZero = !arrowsTrace && withArrows && drawn !== "xy";

  return (
    <div className="col" style={{ gap: 8, flex: 1, minHeight: 0 }}>
      <div className="row wrap" style={{ gap: 12, alignItems: "center" }}>
        {data.planes.length > 1 && (
          <Segmented
            value={drawn}
            onChange={pickPlane}
            options={data.planes.map((p) => ({
              value: p,
              label: PLANE_AXES[p].join("–"),
              tip: p === "xy" ? t("Cross-section at a fixed z") : p === "zx" ? t("Longitudinal cut at a fixed y") : t("Longitudinal cut at a fixed x"),
            }))}
          />
        )}
        <Select value={shown} options={options} onChange={setShow} style={{ minWidth: analytic ? 120 : 180 }} />
        {hi > lo && (
          <label className="row" style={{ gap: 6, alignItems: "center" }}>
            <span className="muted">{`${data.fixed} =`}</span>
            <input type="range" min={lo} max={hi} step={(hi - lo) / 400} value={at ?? data.at} onChange={(e) => setAt(Number(e.target.value))} style={{ width: 130 }} />
            <span className="mono">{`${fmtG(data.at, 4)} m`}</span>
          </label>
        )}
        <Checkbox
          checked={withArrows}
          onChange={setWithArrows}
          label={t("Arrows")}
          disabled={!data.arrows}
          tip={data.arrows ? t("In-plane direction of the field, sampled on a coarse grid") : t("Needs both in-plane components of the map")}
        />
        <Checkbox checked={equal} onChange={setEqual} label={t("Equal scales")} tip={t("True shape and true field direction; a long element becomes a thin strip")} />
      </div>
      <Plot
        data={traces}
        layout={
          {
            xaxis: { title: { text: `${uName} (m)` } },
            yaxis: { title: { text: `${vName} (m)` }, ...(equal ? { scaleanchor: "x", constrain: "domain" } : {}) },
            margin: { l: 64, r: 16, t: 16, b: 52 },
          } as any
        }
        style={{ flex: 1, minHeight: 200 }}
      />
      {data.schematic && (
        <div className="hint">
          {data.length > 0 && drawn !== "xy"
            ? t("Schematic from the element's parameters: the matrix model has hard edges, so the field stops dead at both ends instead of falling off.")
            : t("Schematic from the element's parameters, not field-map data or an engine result.")}
        </div>
      )}
      {inPlaneZero && (
        <div className="hint">{t("No arrows: this field has no component inside the plane. Switch to the x–y cross-section to see its direction.")}</div>
      )}
      {!equal && arrowsTrace && (
        <div className="hint">{t("Arrows follow the picture: with the axes scaled differently they are stretched like the map. Tick “Equal scales” for the true direction.")}</div>
      )}
    </div>
  );
}
