// Beamline layout of the visual editor (and, compact, of the Run page): element
// glyphs on top, the beam envelope below on the same z axis (x above the axis, y
// mirrored below, as in TraceWin), pipe apertures and particle losses, with the
// last run, the linear preview, the run in progress and its schematic bunch, the
// previous run, finished error seeds and a segment run's result.
//
// Wheel = zoom, drag = pan, double-click = fit (the view follows the bunch again),
// click = select the element, or highlight the curve under the cursor.  Legend
// entries highlight their curve (click) or show only it (double-click); Esc
// clears both; the × on the left of an entry hides that curve (remembered in
// localStorage).  Palette items can be dropped onto the beamline.
import { useEffect, useMemo, useRef, useState } from "react";
import { assignLanes, drawGroups, laneAt, laneCenter, LANE_HEIGHT, LANE_TOP } from "./layoutLanes";
import { ViewNavigation } from "./ViewNavigation";
import { cx, Icon } from "../components/ui";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import type { LiveBandItem } from "../store/live";
import { subscribeBunch, useMotion, type BunchFrame } from "./bunchPlayer";
import { cssColor, niceStep } from "../util";
import { aperture, drawGlyph, elementShape, polarity, type Shape } from "./glyphs";
import { dropMarker, type NewElementKind } from "./structureOps";
import { elementColorVar, fmt6, worstIssue, type LatticeDoc, type Schema } from "./types";
import { sampleAt, type Preview, type RunEnvelope } from "./usePreview";

export type LayoutShow = {
  run: boolean;
  preview: boolean;
  aperture: boolean;
  losses: boolean;
  max: boolean;
  energy: boolean;
  scale: "beam" | "pipe";
  /** the run before the last one, after a run in this session */
  compare?: boolean;
  /** finished seeds of an error study */
  band?: boolean;
};

type Arr = ArrayLike<number>;

/** A beam envelope drawn in the layout: z (m), sizes (mm), energy (MeV), losses. */
export type EnvelopeCurves = { z: Arr; rmsX: Arr; rmsY: Arr; maxX?: Arr; maxY?: Arr; energy?: Arr; losses?: { z: number; n: number }[] };

type Item = { line: number; z0: number; z1: number; color: string; shape: Shape; pol: number; label: string; typeTitle: string; lane: number; block: number | null; apertureBase: boolean; issue: "error" | "warning" | null; r: number | null };

type Series = {
  /** legend key: the x and y of one envelope have their own keys, all band curves share one */
  key: string;
  label: string;
  color: string;
  z: Arr;
  v: Arr;
  sign: 1 | -1;
  axis: "size" | "energy";
  width: number;
  dash: number[];
  alpha: number;
};

export const PALETTE_MIME = "application/x-avas-element";

type Props = {
  doc: LatticeDoc;
  schema: Schema;
  selected: number | null;
  onSelect?: (line: number) => void;
  run: RunEnvelope | null;
  preview: Preview | null;
  show: LayoutShow;
  /** the run in progress (or just finished), in full colour */
  live?: EnvelopeCurves | null;
  liveLabel?: string;
  /** changes whenever rows were appended to *live* (the arrays grow in place) */
  liveVersion?: number;
  /** the run before, as a thin grey reference */
  previous?: EnvelopeCurves | null;
  previousLabel?: string;
  band?: LiveBandItem[];
  /** a segment run's result, z on the project's beam line */
  segment?: (EnvelopeCurves & { label: string }) | null;
  /** draw the schematic bunch of these run kinds (replays always, a live run while it runs) */
  bunchKinds?: BunchFrame["kind"][];
  /** also keep the bunch of a finished live run (at its end) */
  bunchWhenDone?: boolean;
  onDropElement?: (z: number, kind: NewElementKind) => void;
  readOnly?: boolean;
  compact?: boolean;
  /** z range to emphasise (a segment on the Run page) */
  range?: [number, number] | null;
};

const AXIS_H = 22;
const HIT_PX = 6;
const HIDDEN_KEY = "avas.layout.hidden"; // legend entries hidden with their × (shared by every layout view)

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveHidden(keys: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...keys]));
  } catch {
    /* storage unavailable */
  }
}
const FLASH_MS = 1500;

// fixed pseudo-random normal pairs (and a keep threshold) for the schematic particle cloud
const CLOUD = (() => {
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 160; i++) {
    const r = Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd())));
    const a = 2 * Math.PI * rnd();
    pts.push([r * Math.cos(a), r * Math.sin(a), rnd()]);
  }
  return pts;
})();

export function LayoutView({
  doc,
  schema,
  selected,
  onSelect,
  run,
  preview,
  show,
  live,
  liveLabel,
  liveVersion,
  previous,
  previousLabel,
  band,
  segment,
  bunchKinds,
  bunchWhenDone,
  onDropElement,
  readOnly,
  compact,
  range,
}: Props) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const theme = useApp((s) => s.resolvedTheme);
  const motion = useMotion();
  const [size, setSize] = useState({ w: 800, h: 360 });
  const [view, setView] = useState<[number, number]>([0, 1]);
  const [hover, setHover] = useState<{ x: number; y: number; z: number } | null>(null);
  const [drop, setDrop] = useState<{ z: number; kind: string } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [solo, setSolo] = useState<string | null>(null);
  const [hidden, setHiddenState] = useState<Set<string>>(loadHidden);
  const setHidden = (next: Set<string>) => {
    saveHidden(next);
    setHiddenState(next);
  };
  const toggleHidden = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHidden(next);
  };
  const fitted = useRef(true);
  const follow = useRef(true);
  const lastTotal = useRef(-1);
  const drag = useRef<{ x: number; v0: number; v1: number; moved: boolean } | null>(null);
  const lastFrame = useRef<BunchFrame | null>(null);
  const titles = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k.title])), [schema]);

  const items = useMemo<Item[]>(() => {
    const blockOrder = new Map<number, number>();
    return assignLanes(doc.statements
      .filter((s) => s.active && s.isElement && s.zStart != null)
      .map((s) => {
        let lane = 0;
        if (s.block != null) {
          const n = blockOrder.get(s.block) ?? 0;
          blockOrder.set(s.block, n + 1);
          lane = n;
        }
        const title = titles.get(s.key);
        return {
          line: s.line,
          z0: s.zStart!,
          z1: s.zEnd ?? s.zStart!,
          color: elementColorVar(s),
          shape: elementShape(s),
          pol: polarity(s),
          label: s.name || (s.key === "field" ? s.params[8] : "") || s.keyword,
          typeTitle: title ? pick(title) : s.keyword,
          lane,
          block: s.block,
          apertureBase: lane === 0,
          issue: worstIssue(s),
          r: aperture(s),
        };
      }));
  }, [doc, titles]);
  const laneCount = Math.max(1, ...items.map((it) => it.lane + 1));
  const layered = laneCount > 1 || items.some((it) => it.block != null);
  const GLYPH_H = layered ? LANE_TOP + laneCount * LANE_HEIGHT + 18 : compact ? 46 : 76;
  const itemCy = (it: Item) => layered ? laneCenter(it.lane) : GLYPH_H / 2 + 4;
  const itemH = layered ? 12 : GLYPH_H / 2 - 6;

  // ---- the curves, back to front
  const series = useMemo<Series[]>(() => {
    const out: Series[] = [];
    const envelope = (group: string, label: string, env: EnvelopeCurves, o: { cx: string; cy: string; width: number; dash?: number[]; alpha?: number; max?: boolean }) => {
      const alpha = o.alpha ?? 1;
      const dash = o.dash ?? [];
      out.push({ key: `${group}.x`, label: `${label} · x`, color: o.cx, z: env.z, v: env.rmsX, sign: 1, axis: "size", width: o.width, dash, alpha });
      out.push({ key: `${group}.y`, label: `${label} · y`, color: o.cy, z: env.z, v: env.rmsY, sign: -1, axis: "size", width: o.width, dash, alpha });
      if (o.max && env.maxX && env.maxY) {
        out.push({ key: `${group}.maxx`, label: `${label} · ${t("max")} x`, color: o.cx, z: env.z, v: env.maxX, sign: 1, axis: "size", width: 1, dash: [4, 3], alpha });
        out.push({ key: `${group}.maxy`, label: `${label} · ${t("max")} y`, color: o.cy, z: env.z, v: env.maxY, sign: -1, axis: "size", width: 1, dash: [4, 3], alpha });
      }
      if (show.energy && env.energy) out.push({ key: `${group}.w`, label: `${label} · W`, color: o.cx, z: env.z, v: env.energy, sign: 1, axis: "energy", width: 1.2, dash: [2, 2], alpha });
    };
    if (show.band !== false && band?.length) {
      const label = t("finished seeds ({n})", { n: band.length });
      for (const b of band) {
        out.push({ key: "band", label, color: "--el-bmag", z: b.rows.z, v: b.rows.rmsX, sign: 1, axis: "size", width: 1, dash: [], alpha: 0.28 });
        out.push({ key: "band", label, color: "--el-quad", z: b.rows.z, v: b.rows.rmsY, sign: -1, axis: "size", width: 1, dash: [], alpha: 0.28 });
      }
    }
    if (previous) envelope("previous", previousLabel ?? t("previous run"), previous, { cx: "--curve-previous", cy: "--curve-previous", width: 1.1, alpha: 0.9 });
    if (segment) envelope("segment", segment.label, segment, { cx: "--curve-segment", cy: "--curve-segment", width: 1.5, max: show.max });
    if (show.run && run) envelope("run", t("last run"), run, { cx: "--el-bmag", cy: "--el-quad", width: 1.6, max: show.max });
    if (show.preview && preview) envelope("preview", t("linear preview"), { z: preview.z, rmsX: preview.rms_x, rmsY: preview.rms_y, energy: preview.energy }, { cx: "--el-rf", cy: "--el-rf", width: 1.8, dash: [6, 3] });
    if (live) envelope("live", liveLabel ?? t("this run"), live, { cx: "--el-bmag", cy: "--el-quad", width: 2, max: show.max });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, preview, live, liveVersion, previous, previousLabel, band, segment, show, liveLabel, t]);

  const lossSets = useMemo(() => {
    const sets: { z: number; n: number }[][] = [];
    if (show.losses) {
      if (show.run && run?.losses.length) sets.push(run.losses);
      if (live?.losses?.length) sets.push(live.losses);
      if (segment?.losses?.length) sets.push(segment.losses);
    }
    return sets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.losses, show.run, run, live, liveVersion, segment]);

  // a highlighted curve that disappeared is forgotten
  useEffect(() => {
    if (pinned && (!series.some((s) => s.key === pinned) || hidden.has(pinned))) setPinned(null);
    if (solo && (!series.some((s) => s.key === solo) || hidden.has(solo))) setSolo(null);
  }, [series, pinned, solo, hidden]);

  const total = Math.max(doc.totalLength ?? 0, ...items.map((i) => i.z1), 1e-6);
  const fit = () => {
    const pad = total * 0.01;
    setView([-pad, total + pad]);
    fitted.current = true;
    follow.current = true;
  };
  const zoom = (direction: 1 | -1) => {
    setView(([start, end]) => {
      const center = (start + end) / 2;
      const span = Math.min(Math.max((end - start) * Math.pow(1.25, -direction), 1e-4), total * 1.2);
      return [center - span / 2, center + span / 2];
    });
    fitted.current = false;
    follow.current = false;
  };
  useEffect(() => {
    if (Math.abs(total - lastTotal.current) > 1e-9) {
      lastTotal.current = total;
      if (fitted.current) fit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const it = items.find((i) => i.line === selected);
    if (!it) return;
    const [v0, v1] = view;
    if (it.z1 < v0 || it.z0 > v1) {
      const span = v1 - v0;
      const c = (it.z0 + it.z1) / 2;
      setView([c - span / 2, c + span / 2]);
      fitted.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    const it = items.find((item) => item.line === selected);
    const viewport = wrapRef.current?.parentElement;
    if (!it || !layered || !viewport) return;
    const top = 36 + itemCy(it) - 16;
    const bottom = top + LANE_HEIGHT;
    if (top < viewport.scrollTop + 36) viewport.scrollTop = Math.max(0, top - 36);
    else if (bottom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = bottom - viewport.clientHeight;
  }, [selected, items, layered]);

  const plot = { left: 56, right: show.energy ? 56 : 16, top: GLYPH_H + 8, bottom: AXIS_H + 6 };
  const pw = Math.max(10, size.w - plot.left - plot.right);
  const ph = Math.max(40, size.h - plot.top - plot.bottom);
  const xOf = (z: number) => plot.left + ((z - view[0]) / (view[1] - view[0])) * pw;
  const zOf = (x: number) => view[0] + ((x - plot.left) / pw) * (view[1] - view[0]);
  const glyphCy = GLYPH_H / 2 + 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const x = e.clientX - canvas.getBoundingClientRect().left;
      const frac = (x - plot.left) / pw;
      const f = e.deltaY < 0 ? 0.8 : 1.25;
      setView(([start, end]) => {
        const zc = start + frac * (end - start);
        const span = Math.min(Math.max((end - start) * f, 1e-4), total * 1.2);
        return [zc - frac * span, zc - frac * span + span];
      });
      fitted.current = false;
      follow.current = false;
    };
    // A non-passive native listener lets zoom cancel the page's default scroll.
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [plot.left, pw, total]);

  // vertical scale (mm) from what is visible
  const yMax = useMemo(() => {
    let m = 0;
    for (const s of series) {
      if (s.axis !== "size" || (solo && s.key !== solo) || hidden.has(s.key)) continue;
      for (let i = 0; i < s.z.length; i++) if (s.z[i] >= view[0] && s.z[i] <= view[1] && Number.isFinite(s.v[i])) m = Math.max(m, Math.abs(s.v[i]));
    }
    if (show.scale === "pipe" || m === 0) for (const it of items) if (it.r && it.z1 >= view[0] && it.z0 <= view[1]) m = Math.max(m, it.r * 1000);
    return m > 0 ? m * 1.15 : 1;
  }, [series, show.scale, items, view, solo, hidden]);

  const eRange = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of series) {
      if (s.axis !== "energy") continue;
      for (let i = 0; i < s.v.length; i++)
        if (Number.isFinite(s.v[i]) && s.v[i] > -1e6) {
          lo = Math.min(lo, s.v[i]);
          hi = Math.max(hi, s.v[i]);
        }
    }
    if (!Number.isFinite(lo)) return null;
    if (hi - lo < 1e-9) return [lo - 1, hi + 1] as [number, number];
    const pad = (hi - lo) * 0.05;
    return [lo - pad, hi + pad] as [number, number];
  }, [series]);

  const cyPlot = plot.top + ph / 2;
  const yOf = (mm: number) => cyPlot - (mm / yMax) * (ph / 2);
  const eY = (w: number) => (eRange ? plot.top + ph - ((w - eRange[0]) / (eRange[1] - eRange[0])) * ph : NaN);

  const inPlot = (x: number, y: number) => x >= plot.left && x <= plot.left + pw && y >= plot.top && y <= plot.top + ph;
  const hitSeries = (x: number, y: number): string | null => {
    if (!inPlot(x, y)) return null;
    const z = zOf(x);
    let best: string | null = null;
    let bestD = HIT_PX;
    for (const s of series) {
      if (solo && s.key !== solo) continue;
      if (s.axis === "energy" && !eRange) continue;
      const v = sampleAt(s.z, s.v, z);
      if (!Number.isFinite(v)) continue;
      const d = Math.abs((s.axis === "size" ? yOf(s.sign * v) : eY(v)) - y);
      if (d < bestD) {
        bestD = d;
        best = s.key;
      }
    }
    return best;
  };
  const hoverKey = hover ? hitSeries(hover.x, hover.y) : null;
  const highlight = hoverKey ?? pinned;

  // geometry for the bunch overlay, which draws between React renders
  const geo = useRef({ xOf, yOf, plot, pw, ph, size, span: view[1] - view[0] });
  geo.current = { xOf, yOf, plot, pw, ph, size, span: view[1] - view[0] };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = {
      bg: cssColor("--beamline-bg"),
      grid: cssColor("--border"),
      soft: cssColor("--fg-soft"),
      fg: cssColor("--fg"),
      accent: cssColor("--accent"),
      danger: cssColor("--danger"),
      warning: cssColor("--warning"),
      pipe: cssColor("--border-strong"),
      drift: cssColor("--el-drift"),
    };
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, size.w, size.h);
    ctx.font = "11px 'Segoe UI', 'Microsoft YaHei UI', sans-serif";

    // ---- z grid
    const span = view[1] - view[0];
    const step = niceStep(span / Math.max(1, pw / 100));
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    for (let z = Math.ceil(view[0] / step) * step; z <= view[1] + 1e-12; z += step) {
      const x = Math.round(xOf(z)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, plot.top + ph);
      ctx.stroke();
    }

    // ---- selection band
    const sel = items.find((i) => i.line === selected);
    if (sel) {
      const x0 = xOf(sel.z0);
      const x1 = Math.max(xOf(sel.z1), x0 + 2);
      ctx.fillStyle = c.accent;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(x0, 0, x1 - x0, size.h - AXIS_H);
      ctx.globalAlpha = 1;
    }

    // ---- glyph lane
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.left - 2, 0, pw + 4, GLYPH_H + 4);
    ctx.clip();
    ctx.strokeStyle = c.drift;
    ctx.beginPath();
    ctx.moveTo(plot.left, (layered ? laneCenter(0) : glyphCy) + 0.5);
    ctx.lineTo(plot.left + pw, (layered ? laneCenter(0) : glyphCy) + 0.5);
    ctx.stroke();
    const ordered = [...items].sort((a, b) => Number(a.shape !== "drift") - Number(b.shape !== "drift") || a.lane - b.lane);
    if (layered) {
      ctx.fillStyle = c.drift;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(t("Display lanes only — no transverse offset"), plot.left, 1);
      drawGroups(ctx, items, xOf, c.drift);
    }
    for (const it of ordered) {
      if (it.z1 < view[0] || it.z0 > view[1]) continue;
      const x0 = xOf(it.z0);
      const x1 = xOf(it.z1);
      const zero = it.z1 <= it.z0;
      drawGlyph(ctx, it.shape, it.pol, x0, zero ? x0 : x1, itemCy(it), itemH, cssColor(it.color), { alpha: 0.5 });
      if (it.issue && !compact) {
        ctx.fillStyle = it.issue === "error" ? c.danger : c.warning;
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, layered ? itemCy(it) - 13 : 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (sel) {
      const x0 = xOf(sel.z0);
      const x1 = Math.max(xOf(sel.z1), x0 + 4);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 - 2, layered ? itemCy(sel) - 15 : 4, x1 - x0 + 4, layered ? 30 : GLYPH_H - 4);
      ctx.fillStyle = c.accent;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lbl = `${sel.label} · ${sel.typeTitle}`;
      ctx.fillText(lbl, Math.min(Math.max(plot.left, x0), plot.left + pw - ctx.measureText(lbl).width), GLYPH_H - 10);
    }
    ctx.restore();

    // ---- plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.left, plot.top, pw, ph);
    ctx.clip();
    if (show.aperture) {
      ctx.fillStyle = c.pipe;
      ctx.globalAlpha = 0.45;
      for (const it of items) {
        if (!it.r || !it.apertureBase || it.z1 < view[0] || it.z0 > view[1] || it.z1 <= it.z0) continue;
        const x0 = xOf(it.z0);
        const x1 = xOf(it.z1);
        const yt = yOf(it.r * 1000);
        const yb = yOf(-it.r * 1000);
        if (yt > plot.top) ctx.fillRect(x0, plot.top, x1 - x0, yt - plot.top);
        if (yb < plot.top + ph) ctx.fillRect(x0, yb, x1 - x0, plot.top + ph - yb);
      }
      ctx.globalAlpha = 1;
    }
    if (range) {
      // outside the emphasised range the plot is dimmed
      ctx.fillStyle = c.bg;
      ctx.globalAlpha = 0.6;
      const xa = xOf(range[0]);
      const xb = xOf(range[1]);
      if (xa > plot.left) ctx.fillRect(plot.left, plot.top, xa - plot.left, ph);
      if (xb < plot.left + pw) ctx.fillRect(xb, plot.top, plot.left + pw - xb, ph);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = c.soft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.left, Math.round(cyPlot) + 0.5);
    ctx.lineTo(plot.left + pw, Math.round(cyPlot) + 0.5);
    ctx.stroke();

    const curve = (s: Series, color: string, width: number, alpha: number) => {
      const map = s.axis === "size" ? (v: number) => yOf(s.sign * v) : eY;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.setLineDash(s.dash);
      ctx.beginPath();
      let pen = false;
      // pixel-level min/max decimation keeps spikes visible when zoomed out
      let lastPx = -1;
      let lo = 0;
      let hi = 0;
      const flush = (px: number) => {
        if (!pen) {
          ctx.moveTo(px, map(lo));
          pen = true;
        } else ctx.lineTo(px, map(lo));
        if (hi !== lo) ctx.lineTo(px, map(hi));
      };
      let started = false;
      const { z, v } = s;
      for (let i = 0; i < z.length; i++) {
        const val = v[i];
        if (!Number.isFinite(val) || (s.axis === "energy" && val < -1e6)) {
          if (started) flush(lastPx);
          started = false;
          pen = false;
          continue;
        }
        const zi = z[i];
        if (zi < view[0] - span * 0.02 || zi > view[1] + span * 0.02) continue;
        const px = Math.round(xOf(zi));
        if (!started) {
          lastPx = px;
          lo = hi = val;
          started = true;
        } else if (px === lastPx) {
          lo = Math.min(lo, val);
          hi = Math.max(hi, val);
        } else {
          flush(lastPx);
          lastPx = px;
          lo = hi = val;
        }
      }
      if (started) flush(lastPx);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };
    const colors = new Map<string, string>();
    const colorOf = (name: string) => {
      if (!colors.has(name)) colors.set(name, cssColor(name));
      return colors.get(name)!;
    };
    const visible = series.filter((s) => (!solo || s.key === solo) && !hidden.has(s.key) && (s.axis === "size" || (show.energy && eRange)));
    // the highlighted curve is drawn last, on top
    visible.sort((a, b) => Number(a.key === highlight) - Number(b.key === highlight));
    for (const s of visible) {
      const emph = highlight === s.key;
      curve(s, colorOf(s.color), s.width + (emph ? 1.6 : 0), s.alpha * (highlight && !emph ? 0.25 : 1));
    }
    if (lossSets.length) {
      ctx.fillStyle = c.danger;
      const byPx = new Map<number, number>();
      for (const set of lossSets)
        for (const l of set) {
          if (l.z < view[0] || l.z > view[1]) continue;
          const px = Math.round(xOf(l.z));
          byPx.set(px, (byPx.get(px) ?? 0) + l.n);
        }
      const maxN = Math.max(1, ...byPx.values());
      for (const [px, n] of byPx) {
        const len = 6 + 22 * Math.sqrt(n / maxN);
        ctx.fillRect(px - 1, plot.top + ph - len, 2, len);
      }
    }
    ctx.restore();

    // energy scale on the right
    if (show.energy && eRange) {
      ctx.fillStyle = c.soft;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const es = niceStep((eRange[1] - eRange[0]) / 4);
      for (let w = Math.ceil(eRange[0] / es) * es; w <= eRange[1]; w += es) ctx.fillText(String(Number(w.toPrecision(5))), plot.left + pw + 6, eY(w));
      ctx.save();
      ctx.translate(size.w - 8, plot.top + ph / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(t("W (MeV)"), 0, 0);
      ctx.restore();
    }

    // ---- axes
    ctx.fillStyle = c.soft;
    ctx.strokeStyle = c.soft;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ys = niceStep(yMax / (compact ? 2 : 3));
    for (let v = 0; v <= yMax; v += ys) {
      ctx.fillText(String(Number(v.toPrecision(4))), plot.left - 6, yOf(v));
      if (v > 0) ctx.fillText(String(Number(v.toPrecision(4))), plot.left - 6, yOf(-v));
    }
    ctx.save();
    ctx.translate(12, plot.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(t("y  ←  (mm)  →  x"), 0, 0);
    ctx.restore();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const ay = size.h - AXIS_H + 4;
    for (let z = Math.ceil(view[0] / step) * step; z <= view[1] + 1e-12; z += step) {
      const x = xOf(z);
      if (x < plot.left - 1 || x > plot.left + pw + 1) continue;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, ay - 4);
      ctx.lineTo(x + 0.5, ay - 1);
      ctx.stroke();
      if (x < plot.left + pw - 40) ctx.fillText(String(Number(z.toPrecision(6))), x, ay);
    }
    ctx.textAlign = "right";
    ctx.fillText(t("z (m)"), plot.left + pw, ay);
    drawBunch(lastFrame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, view, size, selected, theme, series, lossSets, show, yMax, eRange, highlight, solo, hidden, range, compact]);

  // ---- hover crosshair and drop marker on their own canvas: moving the mouse never redraws the curves
  const hoverX = hover?.x ?? null;
  const dropZ = drop?.z ?? null;
  useEffect(() => {
    const canvas = markerRef.current;
    if (!canvas) return;
    const g = geo.current;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(g.size.w * dpr);
    const h = Math.round(g.size.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, g.size.w, g.size.h);
    if (hoverX != null && hoverX >= g.plot.left && hoverX <= g.plot.left + g.pw) {
      ctx.strokeStyle = cssColor("--fg");
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(Math.round(hoverX) + 0.5, 0);
      ctx.lineTo(Math.round(hoverX) + 0.5, g.size.h - AXIS_H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (dropZ != null) {
      const x = g.xOf(dropZ);
      ctx.strokeStyle = cssColor("--accent");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, g.size.h - AXIS_H);
      ctx.stroke();
    }
  }, [hoverX, dropZ, size, view, theme, show.energy, compact]);

  // ---- the schematic bunch, on its own canvas redrawn per animation frame
  function drawBunch(f: BunchFrame | null) {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const g = geo.current;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(g.size.w * dpr);
    const h = Math.round(g.size.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, g.size.w, g.size.h);
    if (!f || !bunchKinds?.includes(f.kind) || !Number.isFinite(f.z) || (f.source === "live" && !f.running && !bunchWhenDone)) return;
    const p = g.plot;
    const x = g.xOf(f.z);
    const color = cssColor("--bunch");
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.left, 0, g.pw, g.size.h - AXIS_H);
    ctx.clip();
    // losses the bunch just passed
    const danger = cssColor("--danger");
    for (const fl of f.flashes) {
      const k = fl.age / FLASH_MS;
      ctx.strokeStyle = danger;
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(g.xOf(fl.z), p.top + g.ph - 8, 4 + 16 * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    // position line, and a pointer above the glyph lane
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, 2);
    ctx.lineTo(Math.round(x) + 0.5, g.size.h - AXIS_H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 6, 1);
    ctx.lineTo(x + 6, 1);
    ctx.lineTo(x, 9);
    ctx.closePath();
    ctx.fill();
    // the bunch: ±rms x above the axis, ±rms y below, its rms length along z (at least a few pixels)
    const cy = p.top + g.ph / 2;
    const sx = Number.isFinite(f.rmsX) ? Math.abs(g.yOf(f.rmsX) - cy) : 6;
    const sy = Number.isFinite(f.rmsY) ? Math.abs(g.yOf(-f.rmsY) - cy) : 6;
    const sz = Math.max(3, Math.min(18, Number.isFinite(f.rmsZ) ? (f.rmsZ / 1000 / g.span) * g.pw : 4));
    const frac = f.particles0 > 0 && Number.isFinite(f.alive) ? Math.max(0, Math.min(1, f.alive / f.particles0)) : 1;
    ctx.fillStyle = color;
    if (motion === "full") {
      ctx.globalAlpha = 0.8;
      for (const [gx, gy, keep] of CLOUD) {
        if (keep > frac) continue; // the share of lost macro-particles is left out
        ctx.beginPath();
        ctx.arc(x + gx * sz, gy >= 0 ? cy - gy * sx : cy - gy * sy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(x, cy - sx / 2, sz, sx / 2 + 1, 0, 0, Math.PI * 2);
      ctx.ellipse(x, cy + sy / 2, sz, sy / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const kindsKey = (bunchKinds ?? []).join(",");
  useEffect(() => {
    if (!kindsKey) {
      lastFrame.current = null;
      drawBunch(null);
      return;
    }
    return subscribeBunch(
      (f) => {
        lastFrame.current = f;
        drawBunch(f);
        // keep the bunch in view while zoomed in, until the user pans or zooms
        if (f && bunchKinds?.includes(f.kind) && Number.isFinite(f.z) && follow.current && !fitted.current) {
          const g = geo.current;
          const x = g.xOf(f.z);
          if (x < g.plot.left || x > g.plot.left + g.pw * 0.85) setView([f.z - g.span * 0.3, f.z + g.span * 0.7]);
        }
      },
      () => !!wrapRef.current && wrapRef.current.offsetParent !== null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindsKey, motion]);

  const hitItem = (x: number, y: number): Item | null => {
    const z = zOf(x);
    const tol = ((view[1] - view[0]) / pw) * 4;
    const hits = items.filter((it) => z >= it.z0 - tol && z <= it.z1 + tol && (!layered || y > GLYPH_H + 4 || it.lane === laneAt(y)));
    if (!hits.length) return null;
    if (y > GLYPH_H + 4) {
      // in the plot area pick the element under the cursor, preferring real ones over drifts
      hits.sort((a, b) => Number(a.shape === "drift") - Number(b.shape === "drift") || a.z1 - a.z0 - (b.z1 - b.z0));
      return hits[0];
    }
    hits.sort((a, b) => b.lane - a.lane || Number(a.shape === "drift") - Number(b.shape === "drift") || a.z1 - a.z0 - (b.z1 - b.z0));
    return hits[0];
  };

  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ---- legend: one entry per key
  const legend = useMemo(() => {
    const seen = new Map<string, Series>();
    for (const s of series) if (!seen.has(s.key)) seen.set(s.key, s);
    return [...seen.values()];
  }, [series]);

  // ---- hover read-out, the highlighted curve first
  const readout = (z: number, y: number) => {
    const rows: { k: string; v: string; strong?: boolean }[] = [{ k: "z", v: `${fmt6(z)} m` }];
    const it = hitItem(xOf(z), y);
    if (it) rows.push({ k: t("Element"), v: `${it.label} · ${it.typeTitle}` });
    const coincident = items.filter((item) => z >= item.z0 && z <= item.z1);
    if (coincident.length > 1) {
      for (const item of coincident) rows.push({ k: t("Overlapping element"), v: `${item.label} · ${item.typeTitle} (${t("Line")} ${item.line + 1})`, strong: item.line === it?.line });
    }
    if (it?.r) rows.push({ k: t("Aperture"), v: `${fmt6(it.r * 1000)} mm` });
    const values: { k: string; v: string; strong?: boolean }[] = [];
    for (const s of legend) {
      if (s.key === "band" || (solo && s.key !== solo) || hidden.has(s.key)) continue;
      const v = sampleAt(s.z, s.v, z);
      if (Number.isFinite(v)) values.push({ k: s.label, v: s.axis === "energy" ? `${fmt6(v)} MeV` : `${fmt6(v)} mm`, strong: s.key === highlight });
    }
    values.sort((a, b) => Number(!!b.strong) - Number(!!a.strong));
    return rows.concat(values);
  };
  const hoverInfo = hover && hover.x >= plot.left ? readout(hover.z, hover.y) : null;

  return (
    <div className={cx("layout-view", compact && "compact")} style={{ overflow: "auto" }}>
      <div className="view-navigation" onPointerDown={(e) => e.stopPropagation()}>
        <ViewNavigation onZoom={zoom} onFit={fit} />
      </div>
    <div
      className="layout-plot"
      style={{ minHeight: layered ? GLYPH_H + 140 : undefined }}
      ref={wrapRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && (pinned || solo)) {
          setPinned(null);
          setSolo(null);
          e.stopPropagation();
        }
      }}
      onDragOver={(e) => {
        if (readOnly || !onDropElement || !e.dataTransfer.types.includes(PALETTE_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        const { x } = local(e);
        const m = dropMarker(doc, zOf(x));
        setDrop({ z: m.z, kind: m.kind });
      }}
      onDragLeave={() => setDrop(null)}
      onDrop={(e) => {
        const kind = e.dataTransfer.getData(PALETTE_MIME) as NewElementKind;
        setDrop(null);
        if (!kind || !onDropElement) return;
        e.preventDefault();
        const { x } = local(e);
        onDropElement(Math.max(0, zOf(x)), kind);
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: hoverKey ? "pointer" : undefined }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          wrapRef.current?.focus({ preventScroll: true });
          drag.current = { x: e.clientX, v0: view[0], v1: view[1], moved: false };
        }}
        onMouseMove={(e) => {
          const d = drag.current;
          if (d && e.buttons & 1) {
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 3) d.moved = true;
            if (d.moved) {
              const dz = (dx / pw) * (d.v1 - d.v0);
              setView([d.v0 - dz, d.v1 - dz]);
              fitted.current = false;
              follow.current = false;
              setHover(null);
            }
            return;
          }
          const { x, y } = local(e);
          setHover({ x, y, z: zOf(x) });
        }}
        onMouseUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) {
            const { x, y } = local(e);
            const key = hitSeries(x, y);
            if (key) {
              setPinned((p) => (p === key ? null : key));
              return;
            }
            setPinned(null);
            const it = hitItem(x, y);
            if (it && onSelect) onSelect(it.line);
          }
        }}
        onMouseLeave={() => {
          drag.current = null;
          setHover(null);
        }}
        onDoubleClick={fit}
      />
      <canvas ref={markerRef} className="layout-overlay" />
      <canvas ref={overlayRef} className="layout-overlay" />
      {hover && hoverInfo && (
        <div className="layout-tip" style={{ left: Math.min(hover.x + 14, size.w - 280), top: Math.max(4, Math.min(hover.y + 14, size.h - 20 - hoverInfo.length * 18)) }}>
          {hoverInfo.map((r, i) => (
            <div key={i} className={r.strong ? "strong" : undefined}>
              <span className="soft">{r.k}</span> {r.v}
            </div>
          ))}
        </div>
      )}
      {drop && (
        <div className="layout-drop-hint" style={{ left: Math.min(Math.max(8, xOf(drop.z) + 8), size.w - 200) }}>
          {drop.kind === "split" ? t("split the drift here") : drop.kind === "superpose" ? t("superpose in this block") : t("insert here")}
        </div>
      )}
      {legend.length > 0 && (
        <div className="layout-legend" data-tip={t("Click: highlight the curve · double-click: show only this curve · ×: hide it · Esc: clear")}>
          {legend.map((s) => {
            const off = hidden.has(s.key);
            return (
              <span key={s.key} className={cx("lg-item", off && "hidden", highlight === s.key && "active", solo === s.key && "solo", !!highlight && highlight !== s.key && "dim")}>
                <button type="button" className="lg-hide" data-tip={off ? t("Show this curve") : t("Hide this curve")} aria-label={off ? t("Show this curve") : t("Hide this curve")} onClick={() => toggleHidden(s.key)}>
                  <Icon name={off ? "eye" : "close"} />
                </button>
                <button
                  type="button"
                  className="lg-name"
                  onClick={() => !off && setPinned((p) => (p === s.key ? null : s.key))}
                  onDoubleClick={() => {
                    if (off) return;
                    setSolo((v) => (v === s.key ? null : s.key));
                    setPinned(null);
                  }}
                >
                  <i
                    className={cx("lg-line", s.dash.length > 0 && "dashed")}
                    style={s.dash.length ? { borderColor: `var(${s.color})`, opacity: Math.max(0.5, s.alpha) } : { background: `var(${s.color})`, opacity: Math.max(0.5, s.alpha) }}
                  />
                  {s.label}
                </button>
              </span>
            );
          })}
          {legend.some((s) => hidden.has(s.key)) && (
            <button type="button" className="lg-item lg-all" onClick={() => setHidden(new Set([...hidden].filter((k) => !legend.some((s) => s.key === k))))}>
              <Icon name="eye" /> {t("Show all curves")}
            </button>
          )}
          {lossSets.length > 0 && (
            <span className="lg-item static">
              <i className="lg-line" style={{ background: "var(--danger)", width: 3, height: 10 }} /> {t("losses")}
            </span>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
