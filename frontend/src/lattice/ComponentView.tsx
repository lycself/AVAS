// Visual inspector of one lattice element: a drawing of the component whose
// handles and sliders change its physical parameters.  While dragging, the
// parent receives drafts (for the live linear preview); releasing commits one
// text edit (one undo step).
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { call } from "../bridge";
import { cx, Icon, IconButton } from "../components/ui";
import { pick, useT } from "../i18n";
import type { FieldSource } from "../files/FieldSlice";
import { crossSection, type ElementField } from "./analyticField";
import { useFieldWindow } from "./FieldWindow";
import { elementShape, fieldMapShape, polarity, type Shape } from "./glyphs";
import { choiceLabel, fmt6, type Keyword, type Statement } from "./types";

export type Draft = Record<number, string>;

type Props = {
  st: Statement;
  kw: Keyword | undefined;
  fieldDirs: string[] | null;
  readOnly?: boolean;
  /** Energy info of the element from the linear preview (MeV, deg). */
  energy?: { w_in?: number; w_out?: number; phase_s?: number | null; phase_rf?: number | null } | null;
  onDraft: (line: number, draft: Draft | null) => void;
  onCommit: (line: number, values: Draft) => void;
};

const num = (s: string | undefined) => {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
};

export function fmtValue(v: number) {
  if (!Number.isFinite(v)) return "0";
  if (v === 0) return "0";
  const s = Number(v.toPrecision(6));
  return String(s);
}

/* ------------------------------------------------------------------ field map profiles */
type Profile = { z: number[]; axis: number[]; peak: number[]; gradient?: number[]; length: number; error?: string };
const profileCache = new Map<string, Promise<Record<string, Profile>>>();

function useFieldProfile(name: string | undefined, fieldDirs: string[] | null) {
  const [data, setData] = useState<Record<string, Profile> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    setError(null);
    if (!name) return;
    const key = `${name}|${JSON.stringify(fieldDirs)}`;
    let p = profileCache.get(key);
    if (!p) {
      p = call<{ components: Record<string, Profile> }>("lattice.fieldProfile", { name, fieldDirs }).then((r) => r.components);
      profileCache.set(key, p);
      p.catch(() => profileCache.delete(key));
    }
    let alive = true;
    p.then((d) => alive && setData(d)).catch((e) => alive && setError(e?.message ?? String(e)));
    return () => {
      alive = false;
    };
  }, [name, JSON.stringify(fieldDirs)]);
  return { data, error };
}

/* ------------------------------------------------------------------ slider */
type SliderSpec = {
  index: number;
  label: string;
  unit: string;
  /** Half width of the range around the value when it is 0 (and minimum half width). */
  scale: number;
  min?: number;
  max?: number;
  absolute?: [number, number];
  hint?: ReactNode;
};

function ParamSlider({ spec, value, readOnly, onDraft, onCommit }: { spec: SliderSpec; value: number; readOnly?: boolean; onDraft: (v: number) => void; onCommit: (v: number) => void }) {
  const [range, setRange] = useState<[number, number]>(() => rangeFor(spec, value));
  const [local, setLocal] = useState<number | null>(null);
  const [text, setText] = useState<string | null>(null);
  const dragging = local !== null;
  useEffect(() => {
    if (!dragging) setRange(rangeFor(spec, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, spec.index]);
  const v = local ?? value;
  const [lo, hi] = range;
  const frac = hi > lo ? (v - lo) / (hi - lo) : 0.5;
  const zeroFrac = lo < 0 && hi > 0 ? -lo / (hi - lo) : null;
  const trackRef = useRef<HTMLDivElement>(null);

  const valueAt = (clientX: number, fine: boolean, start: { x: number; v: number }) => {
    const el = trackRef.current!;
    const w = el.getBoundingClientRect().width || 1;
    const dv = ((clientX - start.x) / w) * (hi - lo) * (fine ? 0.1 : 1);
    let nv = start.v + dv;
    if (spec.min != null) nv = Math.max(spec.min, nv);
    if (spec.max != null) nv = Math.min(spec.max, nv);
    return Number(nv.toPrecision(6));
  };

  const down = (e: React.PointerEvent) => {
    if (readOnly || e.button !== 0) return;
    e.preventDefault();
    const el = trackRef.current!;
    const r = el.getBoundingClientRect();
    // clicking the track jumps there, then dragging is relative
    let startV = v;
    if (!(e.target as HTMLElement).classList.contains("cv-thumb")) {
      startV = Number((lo + ((e.clientX - r.left) / r.width) * (hi - lo)).toPrecision(6));
      if (spec.min != null) startV = Math.max(spec.min, startV);
      if (spec.max != null) startV = Math.min(spec.max, startV);
      setLocal(startV);
      onDraft(startV);
    }
    const start = { x: e.clientX, v: startV };
    let last = startV;
    const move = (ev: PointerEvent) => {
      last = valueAt(ev.clientX, ev.shiftKey, start);
      setLocal(last);
      onDraft(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setLocal(null);
      setRange(rangeFor(spec, last));
      onCommit(last);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const commitText = () => {
    if (text === null) return;
    const n = Number(text);
    setText(null);
    if (text.trim() !== "" && Number.isFinite(n) && n !== value) onCommit(n);
  };

  return (
    <div className={cx("cv-slider", readOnly && "disabled")} data-tip={typeof spec.hint === "string" ? spec.hint : undefined}>
      <span className="cv-slider-label">{spec.label}</span>
      <div className="cv-track" ref={trackRef} onPointerDown={down}>
        {zeroFrac !== null && <div className="cv-zero" style={{ left: `${zeroFrac * 100}%` }} />}
        <div className="cv-fill" style={zeroFrac !== null ? { left: `${Math.min(zeroFrac, frac) * 100}%`, width: `${Math.abs(frac - zeroFrac) * 100}%` } : { left: 0, width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
        <div className="cv-thumb" style={{ left: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
      </div>
      <input
        className="input mono num cv-number"
        value={text ?? fmtValue(v)}
        disabled={readOnly}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        onWheel={(e) => {
          if (readOnly || document.activeElement !== e.currentTarget) return;
          const step = Math.max(Math.abs(value) * (e.shiftKey ? 0.001 : 0.01), spec.scale * 1e-3);
          onCommit(Number((value + (e.deltaY < 0 ? step : -step)).toPrecision(6)));
        }}
      />
      <span className="cv-unit">{spec.unit}</span>
    </div>
  );
}

function rangeFor(spec: SliderSpec, v: number): [number, number] {
  if (spec.absolute) return spec.absolute;
  const half = Math.max(Math.abs(v), spec.scale);
  let lo = v - half;
  let hi = v + half;
  if (spec.min != null) lo = Math.max(spec.min, lo);
  if (spec.max != null) hi = Math.min(spec.max, hi);
  if (hi <= lo) hi = lo + spec.scale;
  return [lo, hi];
}

/* ------------------------------------------------------------------ drag handles in SVG */
/** Pointer-down handler that reports drag deltas in SVG units (not a hook: safe inside branches). */
function svgDrag(onDelta: (dx: number, dy: number, fine: boolean) => void, onEnd: () => void, disabled?: boolean) {
  return (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const scale = svg.viewBox.baseVal.width / (svg.getBoundingClientRect().width || 1);
    const x0 = e.clientX;
    const y0 = e.clientY;
    document.body.classList.add("dragging");
    const move = (ev: PointerEvent) => onDelta((ev.clientX - x0) * scale, (ev.clientY - y0) * scale, ev.shiftKey);
    const up = () => {
      document.body.classList.remove("dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onEnd();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}

function Handle({ x, y, cursor, tip, onPointerDown }: { x: number; y: number; cursor: string; tip: string; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <g className="cv-handle" style={{ cursor }} onPointerDown={onPointerDown}>
      <title>{tip}</title>
      <circle cx={x} cy={y} r={9} className="cv-handle-hit" />
      <circle cx={x} cy={y} r={5} className="cv-handle-dot" />
    </g>
  );
}

function Dim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g className="cv-dim">
      <line x1={x1} y1={y} x2={x2} y2={y} markerStart="url(#cv-arrow)" markerEnd="url(#cv-arrow)" />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function VDim({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g className="cv-dim">
      <line x1={x} y1={y1} x2={x} y2={y2} markerStart="url(#cv-arrow)" markerEnd="url(#cv-arrow)" />
      <text x={x + 8} y={(y1 + y2) / 2 + 4}>
        {label}
      </text>
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <marker id="cv-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="cv-arrowhead" />
      </marker>
      <marker id="cv-force" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="cv-forcehead" />
      </marker>
      <marker id="cv-field" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="cv-fieldhead" />
      </marker>
    </defs>
  );
}

/* ------------------------------------------------------------------ beam direction */
/** ⊙ on the axis: every cross-section in this view is drawn from downstream, so
 *  the beam comes out of the screen.  Keeping one direction lets a field and the
 *  force beside it be checked against each other with F = qv × B. */
function BeamOut({ cx: x, cy: y, r = 5.5 }: { cx: number; cy: number; r?: number }) {
  const t = useT();
  return (
    <g>
      <title>{t("beam out of the screen")}</title>
      <circle cx={x} cy={y} r={r} className="cv-beam-ring" />
      <circle cx={x} cy={y} r={Math.max(1.5, r * 0.33)} className="cv-center" />
    </g>
  );
}

/* ------------------------------------------------------------------ schematic field */
/** The field across a bore, worked out from the element's own parameters
 *  (`analyticField`): shade for the strength, arrows for the direction.  It is
 *  a schematic and not data of any kind, so callers put `schematicNote` under
 *  it.  *rPix* is the drawn radius, *rM* the aperture it stands for. */
function FieldGrid({ cx: x0, cy: y0, rPix, rM, field, colour, n = 7 }: { cx: number; cy: number; rPix: number; rM: number; field: ElementField; colour: string; n?: number }) {
  const cs = crossSection(field, Math.max(rM, 1e-6), n);
  if (!cs.max) return null;
  const clip = `cv-bore-${Math.round(x0)}-${Math.round(y0)}`;
  const cell = (2 * rPix) / (n - 1);
  const at = (s: { x: number; y: number }) => [x0 + (s.x / Math.max(rM, 1e-6)) * rPix, y0 - (s.y / Math.max(rM, 1e-6)) * rPix]; // SVG y grows downwards
  return (
    <g className="cv-fieldgrid">
      <clipPath id={clip}>
        <circle cx={x0} cy={y0} r={rPix} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {cs.samples.map((s, i) => {
          const [px, py] = at(s);
          return (
            <rect
              key={`c${i}`}
              x={px - cell / 2}
              y={py - cell / 2}
              width={cell}
              height={cell}
              className="cv-fieldcell"
              style={{ fill: colour, fillOpacity: 0.12 + (0.68 * Math.hypot(s.bx, s.by)) / cs.max }}
            />
          );
        })}
        {cs.samples.map((s, i) => {
          const b = Math.hypot(s.bx, s.by);
          if (b / cs.max < 0.12) return null; // too short to read: leave the cell bare
          const [px, py] = at(s);
          const len = (cell * 0.82 * b) / cs.max;
          const dx = (s.bx / b) * len;
          const dy = -(s.by / b) * len;
          return <line key={`a${i}`} x1={px - dx / 2} y1={py - dy / 2} x2={px + dx / 2} y2={py + dy / 2} markerEnd="url(#cv-field)" />;
        })}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ profile plot */
function ProfilePlot({ x, y, w, h, z, values, color, label, length }: { x: number; y: number; w: number; h: number; z: number[]; values: number[]; color: string; label: string; length: number }) {
  const max = Math.max(1e-30, ...values.map((v) => Math.abs(v)));
  const zmax = length || z[z.length - 1] || 1;
  const pts = z.map((zi, i) => `${x + (zi / zmax) * w},${y + h / 2 - (values[i] / max) * (h / 2)}`).join(" ");
  return (
    <g className="cv-profile">
      <rect x={x} y={y} width={w} height={h} className="cv-plot-bg" />
      <line x1={x} x2={x + w} y1={y + h / 2} y2={y + h / 2} className="cv-plot-axis" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} />
      <text x={x + 4} y={y + 12} className="cv-plot-label">
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ the view */
export function ComponentView({ st, kw, fieldDirs, readOnly, energy, onDraft, onCommit }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  useEffect(() => {
    setDraft(null);
    draftRef.current = null;
  }, [st.line, st.raw]);

  const p = (k: number) => (draft && draft[k] !== undefined ? draft[k] : st.params[k] ?? "");
  const pn = (k: number) => num(p(k));
  const shape: Shape = elementShape(st);
  const fieldName = st.key === "field" ? st.params[8] : undefined;
  const profile = useFieldProfile(fieldName, fieldDirs);

  const setDraftValues = (values: Draft) => {
    const next = { ...(draftRef.current ?? {}), ...values };
    draftRef.current = next;
    setDraft(next);
    onDraft(st.line, next);
  };
  const commitDraft = () => {
    const d = draftRef.current;
    draftRef.current = null;
    onDraft(st.line, null);
    if (d && Object.entries(d).some(([k, v]) => (st.params[Number(k)] ?? "") !== v)) onCommit(st.line, d);
    else setDraft(null);
  };
  const slider = (spec: SliderSpec) => (
    <ParamSlider
      key={spec.index}
      spec={spec}
      value={num(st.params[spec.index])}
      readOnly={readOnly}
      onDraft={(v) => setDraftValues({ [spec.index]: fmtValue(v) })}
      onCommit={(v) => {
        draftRef.current = { ...(draftRef.current ?? {}), [spec.index]: fmtValue(v) };
        commitDraft();
      }}
    />
  );
  const label = (k: number, fallback: string) => (kw?.params[k] ? pick(kw.params[k].label) : fallback);
  const unit = (k: number, fallback = "") => kw?.params[k]?.unit ?? fallback;

  // what the "Field" button opens: the map behind a field element, or the
  // schematic field of a matrix element worked out from its own parameters
  const fieldSource = (): FieldSource | null => {
    const L = Math.max(0, pn(0));
    const R = Math.max(1e-4, pn(1));
    if (st.key === "field") return fieldName ? { kind: "map", name: fieldName, fieldDirs } : null;
    const analytic = (field: ElementField, length: number, u = "T"): FieldSource => ({ kind: "analytic", field, length, r: R, name: st.name || st.keyword, unit: u });
    if (st.key === "quad") return pn(3) ? analytic({ kind: "quadrupole", g: pn(3) }, L) : null;
    if (st.key === "solenoid") return pn(3) ? analytic({ kind: "solenoid", b: pn(3) }, L) : null;
    if (st.key === "bend")
      return analytic({ kind: "dipole", b: Math.sign(pn(3)) || 1, index: pn(5), rho: Math.max(1e-6, pn(4)), vertical: p(6) === "1" }, Math.abs(pn(3)) * (Math.PI / 180) * Math.max(1e-6, pn(4)));
    // a corrector has no length of its own: only its cross-section means anything
    if (st.key === "steerer") return pn(3) || pn(4) ? analytic({ kind: "steerer", bx: pn(3), by: pn(4) }, 0, p(5) === "1" ? "V/m" : "T") : null;
    return null;
  };
  const source = fieldSource();
  const windowTitle = st.name ? `${st.name} (${st.keyword})` : t("{kw}, line {n}", { kw: st.keyword, n: st.line + 1 });
  const openField = () => source && useFieldWindow.getState().show(source, windowTitle);
  // While the field window is open it follows this view: another element replaces
  // it, and a dragged slider redraws the field live (the title is unchanged, so
  // the window keeps the plane and component the user chose).
  const sourceKey = source ? JSON.stringify(source) : "";
  useEffect(() => {
    const w = useFieldWindow.getState();
    if (w.source && source) w.show(source, windowTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, windowTitle]);

  // ------------------------------------------------ geometry shared by the side views
  const W = 560;
  const H = 230;
  const L = Math.max(0, pn(0));
  const R = Math.max(0, pn(1));
  const lengthScale = useMemo(() => 300 / Math.max(num(st.params[0]) * 1.25, 0.05), [st.line, st.raw]);
  const radiusScale = useMemo(() => 42 / Math.max(num(st.params[1]), 0.005), [st.line, st.raw]);
  const x0 = 90;
  const cy = 108;
  const bodyW = Math.max(6, Math.min(420, L * lengthScale));
  const pipeR = Math.max(4, Math.min(80, R * radiusScale));

  const dragLength = svgDrag(
    (dx, _dy, fine) => {
      const base = num(st.params[0]);
      const v = Math.max(0, base + (dx / lengthScale) * (fine ? 0.1 : 1));
      setDraftValues({ 0: fmtValue(v) });
    },
    commitDraft,
    readOnly,
  );
  const dragRadius = svgDrag(
    (_dx, dy, fine) => {
      const base = num(st.params[1]);
      const v = Math.max(1e-4, base - (dy / radiusScale) * (fine ? 0.1 : 1));
      setDraftValues({ 1: fmtValue(v) });
    },
    commitDraft,
    readOnly,
  );

  const pipe = (
    <g className="cv-pipe">
      <rect x={30} y={cy - pipeR} width={W - 60} height={2 * pipeR} className="cv-pipe-bore" />
      <line x1={30} x2={W - 30} y1={cy - pipeR} y2={cy - pipeR} className="cv-pipe-wall" />
      <line x1={30} x2={W - 30} y1={cy + pipeR} y2={cy + pipeR} className="cv-pipe-wall" />
      <line x1={20} x2={W - 20} y1={cy} y2={cy} className="cv-beam-axis" />
    </g>
  );
  const lengthDims = L > 0 && (
    <>
      <Dim x1={x0} x2={x0 + bodyW} y={H - 26} label={`L = ${fmt6(L)} m`} />
      {!readOnly && <Handle x={x0 + bodyW} y={H - 26} cursor="ew-resize" tip={t("Drag to change the length (Shift: fine)")} onPointerDown={dragLength} />}
    </>
  );
  const radiusDims = R > 0 && (
    <>
      <VDim x={W - 44} y1={cy} y2={cy - pipeR} label={`R = ${fmt6(R * 1000)} mm`} />
      {!readOnly && <Handle x={W - 44} y={cy - pipeR} cursor="ns-resize" tip={t("Drag to change the aperture radius (Shift: fine)")} onPointerDown={dragRadius} />}
    </>
  );

  let drawing: ReactNode = null;
  const sliders: ReactNode[] = [];
  const facts: [string, string][] = [];

  const colorVar = (name: string) => `var(${name})`;

  if (shape === "drift") {
    drawing = (
      <>
        {pipe}
        <rect x={x0} y={cy - pipeR - 3} width={bodyW} height={2 * pipeR + 6} className="cv-drift-span" />
        {lengthDims}
        {radiusDims}
      </>
    );
  } else if (st.key === "quad" || (st.key === "field" && shape === "quad")) {
    const isMap = st.key === "field";
    const kIndex = isMap ? 7 : 3;
    const g = pn(kIndex);
    const mapGrad = isMap && profile.data ? profile.data.bsy?.gradient ?? profile.data.bsx?.gradient : undefined;
    const peakMap = mapGrad ? Math.max(...mapGrad.map(Math.abs)) : null;
    const gEff = isMap ? (peakMap != null ? g * peakMap * Math.sign(mapGrad![Math.floor(mapGrad!.length / 2)] || 1) : null) : g;
    const pol = Math.sign(isMap ? (gEff ?? g) : g) || polarity(st);
    const gShow = (isMap ? gEff : g) ?? 0;      // the gradient the schematic field is drawn from
    const csx = 440;
    const csr = 44;
    const poles = [45, 135, 225, 315].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      const north = (i % 2 === 0) === pol >= 0;
      const px = csx + Math.cos(rad) * (csr + 14);
      const py = cy - Math.sin(rad) * (csr + 14);
      return (
        <g key={a} transform={`rotate(${-a} ${px} ${py})`}>
          <path d={`M ${px - 12} ${py - 16} Q ${px - 3} ${py} ${px - 12} ${py + 16} L ${px + 18} ${py + 20} L ${px + 18} ${py - 20} Z`} className={north ? "cv-pole-n" : "cv-pole-s"} />
        </g>
      );
    });
    const sideW = Math.min(bodyW, 250);
    drawing = (
      <>
        <g className="cv-pipe">
          <line x1={20} x2={330} y1={cy} y2={cy} className="cv-beam-axis" />
          <line x1={20} x2={330} y1={cy - Math.min(pipeR, 40)} y2={cy - Math.min(pipeR, 40)} className="cv-pipe-wall" />
          <line x1={20} x2={330} y1={cy + Math.min(pipeR, 40)} y2={cy + Math.min(pipeR, 40)} className="cv-pipe-wall" />
        </g>
        <rect x={x0} y={cy - Math.min(pipeR, 40) - 34} width={sideW} height={28} rx={3} style={{ fill: colorVar("--el-quad") }} className={cx("cv-body", pol < 0 && "dim")} />
        <rect x={x0} y={cy + Math.min(pipeR, 40) + 6} width={sideW} height={28} rx={3} style={{ fill: colorVar("--el-quad") }} className={cx("cv-body", pol > 0 && "dim")} />
        {/* cross-section */}
        <circle cx={csx} cy={cy} r={csr + 36} className="cv-yoke" />
        {poles}
        <circle cx={csx} cy={cy} r={csr - 6} className="cv-bore" />
        {gShow !== 0 && <FieldGrid cx={csx} cy={cy} rPix={csr - 6} rM={R} field={{ kind: "quadrupole", g: gShow }} colour={colorVar("--el-quad")} />}
        {/* forces on a positive particle: focusing along x when G > 0 */}
        {pol !== 0 && (
          <g className="cv-force">
            <line x1={csx + (pol > 0 ? 34 : 12)} y1={cy} x2={csx + (pol > 0 ? 12 : 34)} y2={cy} markerEnd="url(#cv-force)" />
            <line x1={csx - (pol > 0 ? 34 : 12)} y1={cy} x2={csx - (pol > 0 ? 12 : 34)} y2={cy} markerEnd="url(#cv-force)" />
            <line x1={csx} y1={cy - (pol > 0 ? 12 : 34)} x2={csx} y2={cy - (pol > 0 ? 34 : 12)} markerEnd="url(#cv-force)" />
            <line x1={csx} y1={cy + (pol > 0 ? 12 : 34)} x2={csx} y2={cy + (pol > 0 ? 34 : 12)} markerEnd="url(#cv-force)" />
          </g>
        )}
        <BeamOut cx={csx} cy={cy} />
        <text x={csx} y={24} textAnchor="middle" className="cv-caption">
          {pol > 0 ? t("focusing in x, defocusing in y") : pol < 0 ? t("defocusing in x, focusing in y") : t("no gradient")}
        </text>
        {gShow !== 0 && (
          <text x={csx} y={cy + csr + 52} textAnchor="middle" className="cv-schematic">
            {t("B in the bore: schematic from G")}
          </text>
        )}
        {L > 0 && <Dim x1={x0} x2={x0 + sideW} y={H - 26} label={`L = ${fmt6(L)} m`} />}
        {!readOnly && L > 0 && !isMap && <Handle x={x0 + sideW} y={H - 26} cursor="ew-resize" tip={t("Drag to change the length (Shift: fine)")} onPointerDown={dragLength} />}
        {mapGrad && profile.data && (
          <ProfilePlot x={x0} y={8} w={sideW} h={40} z={(profile.data.bsy ?? profile.data.bsx)!.z} values={mapGrad} color="var(--el-quad)" label="G(z)" length={(profile.data.bsy ?? profile.data.bsx)!.length} />
        )}
      </>
    );
    if (isMap) {
      sliders.push(slider({ index: 7, label: t("Field factor Kb"), unit: "", scale: Math.max(10, Math.abs(g) * 0.5), hint: t("Scales the static magnetic field map") }));
      if (peakMap != null) facts.push([t("Peak gradient"), `${fmt6(Math.abs(gEff ?? 0))} T/m`]);
    } else {
      sliders.push(slider({ index: 3, label: label(3, "G"), unit: unit(3, "T/m"), scale: 10 }));
    }
  } else if (st.key === "solenoid" || (st.key === "field" && shape === "solenoid")) {
    const isMap = st.key === "field";
    const bz = isMap && profile.data?.bsz ? profile.data.bsz : null;
    const peak = bz ? Math.max(...bz.axis.map(Math.abs)) * pn(7) : pn(3);
    const turns = Math.max(4, Math.min(24, Math.round(bodyW / 12)));
    const coilR = Math.min(pipeR, 46) + 16;
    drawing = (
      <>
        {pipe}
        <rect x={x0} y={cy - coilR - 12} width={bodyW} height={2 * coilR + 24} rx={8} style={{ fill: colorVar("--el-solenoid") }} className="cv-body translucent" />
        {Array.from({ length: turns }, (_, i) => {
          const x = x0 + ((i + 0.5) / turns) * bodyW;
          return <ellipse key={i} cx={x} cy={cy} rx={4} ry={coilR} className="cv-coil" style={{ stroke: colorVar("--el-solenoid") }} />;
        })}
        <g className="cv-force">
          <line x1={x0 + 10} y1={cy} x2={x0 + bodyW - 10} y2={cy} markerEnd={peak >= 0 ? "url(#cv-force)" : undefined} markerStart={peak < 0 ? "url(#cv-force)" : undefined} />
        </g>
        <text x={x0 + bodyW / 2} y={cy - coilR - 20} textAnchor="middle" className="cv-caption">
          {`B${isMap ? "z,max" : ""} = ${fmt6(peak)} T`}
        </text>
        {lengthDims}
        {radiusDims}
        {bz && <ProfilePlot x={x0} y={H - 64} w={bodyW} h={30} z={bz.z} values={bz.axis} color="var(--el-solenoid)" label="Bz(z)" length={bz.length} />}
      </>
    );
    if (isMap) sliders.push(slider({ index: 7, label: t("Field factor Kb"), unit: "", scale: 0.5, hint: t("Scales the static magnetic field map") }));
    else sliders.push(slider({ index: 3, label: label(3, "B"), unit: unit(3, "T"), scale: 0.5 }));
  } else if (shape === "cavity" || shape === "efield") {
    const isRf = shape === "cavity";
    const ez = profile.data?.[isRf ? "edz" : "esz"];
    const phase = pn(5);
    const ke = pn(6);
    const dialX = 470;
    const dialR = 42;
    const rad = ((phase - 90) * Math.PI) / 180;
    const phaseRef = kw ? choiceLabel(kw.params[2], st.params[2] ?? "") : null;
    const cavTop = cy - Math.min(pipeR, 30) - 46;
    const cavBot = cy + Math.min(pipeR, 30) + 46;
    const cw = Math.min(bodyW, 300);
    drawing = (
      <>
        <g className="cv-pipe">
          <line x1={20} x2={360} y1={cy} y2={cy} className="cv-beam-axis" />
        </g>
        {isRf ? (
          <path
            d={`M ${x0} ${cy - 14} C ${x0 + cw * 0.08} ${cavTop}, ${x0 + cw * 0.92} ${cavTop}, ${x0 + cw} ${cy - 14} L ${x0 + cw} ${cy + 14} C ${x0 + cw * 0.92} ${cavBot}, ${x0 + cw * 0.08} ${cavBot}, ${x0} ${cy + 14} Z`}
            style={{ fill: colorVar("--el-rf") }}
            className="cv-body translucent"
          />
        ) : (
          <>
            <rect x={x0} y={cavTop} width={cw} height={16} style={{ fill: colorVar("--el-efield") }} className="cv-body" />
            <rect x={x0} y={cavBot - 16} width={cw} height={16} style={{ fill: colorVar("--el-efield") }} className="cv-body" />
          </>
        )}
        {ez && <ProfilePlot x={x0} y={cy - 26} w={cw} h={52} z={ez.z} values={ez.axis.map((v) => v * ke)} color={isRf ? "var(--el-rf)" : "var(--el-efield)"} label="Ez(z)" length={ez.length} />}
        {L > 0 && <Dim x1={x0} x2={x0 + cw} y={H - 18} label={`L = ${fmt6(L)} m`} />}
        {isRf && (
          <g className="cv-dial">
            <circle cx={dialX} cy={cy} r={dialR} className="cv-dial-face" />
            {[-180, -90, 0, 90].map((a) => {
              const r2 = ((a - 90) * Math.PI) / 180;
              return (
                <g key={a}>
                  <line x1={dialX + Math.cos(r2) * (dialR - 6)} y1={cy + Math.sin(r2) * (dialR - 6)} x2={dialX + Math.cos(r2) * dialR} y2={cy + Math.sin(r2) * dialR} className="cv-dial-tick" />
                  <text x={dialX + Math.cos(r2) * (dialR + 14)} y={cy + Math.sin(r2) * (dialR + 14) + 4} textAnchor="middle" className="cv-dial-text">
                    {a}°
                  </text>
                </g>
              );
            })}
            <line x1={dialX} y1={cy} x2={dialX + Math.cos(rad) * (dialR - 8)} y2={cy + Math.sin(rad) * (dialR - 8)} className="cv-dial-needle" />
            <PhaseHandle cx={dialX} cy={cy} r={dialR - 8} phase={phase} readOnly={readOnly} onDraft={(v) => setDraftValues({ 5: fmtValue(v) })} onEnd={commitDraft} tip={t("Drag around the dial to change the phase (Shift: 0.1° steps)")} />
            <text x={dialX} y={cy + dialR + 32} textAnchor="middle" className="cv-caption">
              {`φ = ${fmt6(phase)}°`}
            </text>
          </g>
        )}
      </>
    );
    if (isRf) {
      sliders.push(slider({ index: 5, label: label(5, "phase"), unit: "°", scale: 180, absolute: [-180, 180], min: -360, max: 360 }));
      sliders.push(slider({ index: 6, label: label(6, "Ke"), unit: "", scale: 1 }));
      sliders.push(slider({ index: 7, label: label(7, "Kb"), unit: "", scale: 1 }));
      facts.push([t("Frequency"), `${fmt6(pn(4) / 1e6)} MHz`]);
      if (phaseRef) facts.push([t("Phase means"), pick(phaseRef)]);
      if (ez) facts.push([t("Peak Ez × Ke"), `${fmt6(Math.max(...ez.axis.map(Math.abs)) * ke)}`]);
      if (energy?.w_in != null && energy?.w_out != null) {
        facts.push([t("Energy (linear preview)"), `${fmt6(energy.w_in)} → ${fmt6(energy.w_out)} MeV (Δ ${fmt6(energy.w_out - energy.w_in)})`]);
        if (energy.phase_s != null) facts.push([t("Synchronous phase (preview)"), `${fmt6(energy.phase_s)}°`]);
      }
    } else {
      sliders.push(slider({ index: 6, label: label(6, "Ke"), unit: "", scale: 1 }));
    }
  } else if (st.key === "field") {
    // other static magnetic maps: dipoles, correctors, unknown magnets
    const comps = profile.data ? Object.entries(profile.data).filter(([, v]) => !v.error) : [];
    const kind = fieldMapShape(st.params[8] ?? "");
    const body = kind === "steerer" ? "--el-steerer" : kind === "dipole" ? "--el-bend" : "--el-bmag";
    drawing = (
      <>
        {pipe}
        <rect x={x0} y={cy - Math.min(pipeR, 40) - 30} width={bodyW} height={2 * Math.min(pipeR, 40) + 60} rx={4} style={{ fill: colorVar(body) }} className="cv-body translucent" />
        {comps.slice(0, 3).map(([ext, v], i) => (
          <ProfilePlot key={ext} x={x0 + 4} y={16 + i * 44} w={Math.max(120, bodyW - 8)} h={38} z={v.z} values={v.axis.some((a) => a !== 0) ? v.axis : v.gradient ?? v.axis} color="var(--accent)" label={`.${ext}`} length={v.length} />
        ))}
        {lengthDims}
        {radiusDims}
      </>
    );
    sliders.push(slider({ index: 7, label: t("Field factor Kb"), unit: "", scale: 1, hint: t("Scales the static magnetic field map") }));
  } else if (st.key === "bend") {
    const alpha = pn(3);
    const rho = Math.max(1e-6, pn(4));
    const [bcx, bcy, bcr] = [450, 112, 46];      // cross-section, clear of the orbit sector on the left
    const scale = 150 / Math.max(num(st.params[4]), 0.1);
    const r = Math.min(170, rho * scale);
    const ax = 110;
    const ay = 200;
    const a = (Math.min(Math.abs(alpha), 180) * Math.PI) / 180;
    // the orbit enters horizontally at the top of a circle centred at (ax, ay)
    const ex = ax + r * Math.sin(a);
    const arc = `M ${ax} ${ay - r} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ay - r * Math.cos(a)}`;
    const dragAngle = svgDrag(
      (dx, dy, fine) => {
        const base = num(st.params[3]);
        setDraftValues({ 3: fmtValue(base + ((dx - dy) / 3) * (fine ? 0.1 : 1)) });
      },
      commitDraft,
      readOnly,
    );
    const dragRho = svgDrag(
      (_dx, dy, fine) => {
        const base = num(st.params[4]);
        setDraftValues({ 4: fmtValue(Math.max(1e-3, base + (dy / scale) * (fine ? 0.1 : 1))) });
      },
      commitDraft,
      readOnly,
    );
    drawing = (
      <>
        <path d={`M ${ax} ${ay} L ${ax} ${ay - r} ${arc.slice(arc.indexOf("A"))} Z`} className="cv-sector" />
        <path d={arc} className="cv-orbit" />
        <line x1={20} y1={ay - r} x2={ax} y2={ay - r} className="cv-beam-axis" />
        <text x={ax + 12} y={ay - r / 2} className="cv-caption">{`ρ = ${fmt6(rho)} m`}</text>
        <text x={ex + 10} y={ay - r * Math.cos(a) - 8} className="cv-caption">{`α = ${fmt6(alpha)}°`}</text>
        {!readOnly && <Handle x={ex} y={ay - r * Math.cos(a)} cursor="grab" tip={t("Drag to change the bend angle (Shift: fine)")} onPointerDown={dragAngle} />}
        {!readOnly && <Handle x={ax} y={ay - r} cursor="ns-resize" tip={t("Drag to change the bending radius (Shift: fine)")} onPointerDown={dragRho} />}
        <text x={W - 20} y={30} textAnchor="end" className="cv-caption">
          {t("arc length {v} m", { v: fmt6(Math.abs(alpha) * (Math.PI / 180) * rho) })}
        </text>
        {/* cross-section: the only place the field index N is visible */}
        <g>
          <rect x={bcx - 54} y={bcy - 74} width={108} height={22} rx={3} style={{ fill: colorVar("--el-bend") }} className="cv-body translucent" />
          <rect x={bcx - 54} y={bcy + 52} width={108} height={22} rx={3} style={{ fill: colorVar("--el-bend") }} className="cv-body translucent" />
          <circle cx={bcx} cy={bcy} r={bcr} className="cv-bore" />
          <FieldGrid cx={bcx} cy={bcy} rPix={bcr} rM={R} field={{ kind: "dipole", b: Math.sign(alpha) || 1, index: pn(5), rho, vertical: p(6) === "1" }} colour={colorVar("--el-bend")} />
          <BeamOut cx={bcx} cy={bcy} />
          <text x={bcx} y={bcy + 90} textAnchor="middle" className="cv-schematic">
            {/* N acts over rho, so across an aperture it is usually a per-cent effect: say how much, rather than let the eye hunt for it */}
            {pn(5)
              ? t("B in the bore: schematic; N changes it by {p}% over ±R", { p: fmt6(Math.round((Math.abs(pn(5)) * R * 1000) / rho) / 10) })
              : t("B in the bore: schematic, uniform without a field index")}
          </text>
        </g>
      </>
    );
    sliders.push(slider({ index: 3, label: label(3, "α"), unit: "°", scale: 30, min: -360, max: 360 }));
    sliders.push(slider({ index: 4, label: label(4, "ρ"), unit: "m", scale: 1, min: 1e-3 }));
  } else if (st.key === "steerer") {
    const bx = pn(3);
    const by = pn(4);
    const m = Math.max(Math.abs(bx), Math.abs(by), 1e-12);
    const csx = 280;
    // a positive particle coming out of the screen, like every cross-section here:
    // F = qv × B with v along +z, so By kicks along -x and Bx along +y
    const kx = (-by / m) * 60;
    const ky = (bx / m) * 60;
    drawing = (
      <>
        <path d={`M ${csx - 80} ${cy - 60} h 160 v 30 h -120 v 60 h 120 v 30 h -160 z`} style={{ fill: colorVar("--el-steerer") }} className="cv-body translucent" />
        <circle cx={csx} cy={cy} r={Math.min(pipeR, 24)} className="cv-bore" />
        <FieldGrid cx={csx} cy={cy} rPix={Math.min(pipeR, 24)} rM={R} field={{ kind: "steerer", bx, by }} colour={colorVar("--el-steerer")} n={5} />
        {(bx !== 0 || by !== 0) && (
          <g className="cv-force">
            <line x1={csx} y1={cy} x2={csx + kx} y2={cy - ky} markerEnd="url(#cv-force)" />
          </g>
        )}
        <BeamOut cx={csx} cy={cy} />
        <text x={csx} y={H - 16} textAnchor="middle" className="cv-caption">
          {t("kick direction for a positive particle (beam out of the screen)")}
        </text>
        {(bx !== 0 || by !== 0) && (
          <text x={csx} y={H - 32} textAnchor="middle" className="cv-schematic">
            {t("thin arrows: the field itself, uniform across the bore")}
          </text>
        )}
      </>
    );
    sliders.push(slider({ index: 3, label: label(3, "Bx"), unit: unit(3), scale: 0.01 }));
    sliders.push(slider({ index: 4, label: label(4, "By"), unit: unit(4), scale: 0.01 }));
  } else if (st.key === "edge") {
    const beta = pn(3);
    const b = (beta * Math.PI) / 180;
    drawing = (
      <>
        <rect x={80} y={50} width={200} height={120} style={{ fill: colorVar("--el-bend") }} className="cv-body translucent" />
        <line x1={280 - 60 * Math.tan(b)} y1={50} x2={280 + 60 * Math.tan(b)} y2={170} className="cv-edge-face" />
        <line x1={20} x2={W - 20} y1={110} y2={110} className="cv-beam-axis" />
        <text x={300} y={40} className="cv-caption">{`β = ${fmt6(beta)}°`}</text>
      </>
    );
    sliders.push(slider({ index: 3, label: label(3, "β"), unit: "°", scale: 30, min: -89, max: 89 }));
  } else if (st.category === "diag") {
    drawing = (
      <>
        <line x1={20} x2={W - 20} y1={cy} y2={cy} className="cv-beam-axis" />
        {[46, 32, 18].map((r) => (
          <circle key={r} cx={W / 2} cy={cy} r={r} className="cv-target" />
        ))}
        <text x={W / 2} y={H - 18} textAnchor="middle" className="cv-caption">
          {kw ? pick(kw.title) : st.keyword}
        </text>
      </>
    );
  }

  if (!drawing) {
    return (
      <div className="cv-empty muted">
        <Icon name="info" /> {t("No drawing for this keyword; edit its parameters below.")}
      </div>
    );
  }

  return (
    <div className="component-view">
      <svg className="cv-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <Defs />
        {drawing}
      </svg>
      {source && (
        <IconButton
          icon="screen-full"
          className="cv-expand"
          tip={source.kind === "map" ? t("Open the field map in a window: slices, components and direction") : t("Open the field in a window: cross-section, cut along z and direction")}
          onClick={openField}
        />
      )}
      {(sliders.length > 0 || facts.length > 0) && (
        <div className="cv-controls">
          {sliders}
          {facts.length > 0 && (
            <div className="cv-facts">
              {facts.map(([k, v]) => (
                <span key={k}>
                  <span className="soft">{k}</span> {v}
                </span>
              ))}
            </div>
          )}
          {profile.error && <div className="warning-text cv-facts">{profile.error}</div>}
        </div>
      )}
      {draft && <IconButton icon="loading" className="cv-busy" tip={t("Preview")} />}
    </div>
  );
}

function PhaseHandle({ cx: x, cy: y, r, phase, readOnly, onDraft, onEnd, tip }: { cx: number; cy: number; r: number; phase: number; readOnly?: boolean; onDraft: (v: number) => void; onEnd: () => void; tip: string }) {
  const rad = ((phase - 90) * Math.PI) / 180;
  const hx = x + Math.cos(rad) * r;
  const hy = y + Math.sin(rad) * r;
  const down = (e: React.PointerEvent) => {
    if (readOnly || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const svg = (e.currentTarget as SVGElement).ownerSVGElement!;
    const toSvg = (ev: PointerEvent) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: ev.clientX, y: ev.clientY };
    };
    document.body.classList.add("dragging");
    const move = (ev: PointerEvent) => {
      const q = toSvg(ev);
      let deg = (Math.atan2(q.y - y, q.x - x) * 180) / Math.PI + 90;
      if (deg > 180) deg -= 360;
      deg = ev.shiftKey ? Math.round(deg * 10) / 10 : Math.round(deg);
      onDraft(deg);
    };
    const up = () => {
      document.body.classList.remove("dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onEnd();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  if (readOnly) return null;
  return <Handle x={hx} y={hy} cursor="grab" tip={tip} onPointerDown={down} />;
}

/** Whether the component view has a drawing for this statement. */
export function hasComponentView(st: Statement): boolean {
  return st.isElement;
}
