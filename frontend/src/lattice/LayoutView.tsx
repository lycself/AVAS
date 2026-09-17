// Large beamline layout of the visual editor: element glyphs on top, the beam
// envelope below on the same z axis (x above the axis, y mirrored below, as in
// TraceWin), pipe apertures, particle losses, the linear preview and the last
// run.  Wheel = zoom, drag = pan, double-click = fit, click = select; palette
// items can be dropped onto the beamline.
import { useEffect, useMemo, useRef, useState } from "react";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import { aperture, cssColor, drawGlyph, elementShape, isZeroLength, niceStep, polarity, type Shape } from "./glyphs";
import { dropMarker, type NewElementKind } from "./structureOps";
import { elementColorVar, fmt6, worstIssue, type LatticeDoc, type Schema } from "./types";
import { sampleAt, type Preview, type RunEnvelope } from "./usePreview";

export type LayoutShow = { run: boolean; preview: boolean; aperture: boolean; losses: boolean; max: boolean; energy: boolean; scale: "beam" | "pipe" };

type Item = { line: number; z0: number; z1: number; color: string; shape: Shape; pol: number; label: string; typeTitle: string; lane: number; issue: "error" | "warning" | null; r: number | null };

export const PALETTE_MIME = "application/x-avas-element";

type Props = {
  doc: LatticeDoc;
  schema: Schema;
  selected: number | null;
  onSelect: (line: number) => void;
  run: RunEnvelope | null;
  preview: Preview | null;
  show: LayoutShow;
  onDropElement?: (z: number, kind: NewElementKind) => void;
  readOnly?: boolean;
  fitSignal?: number;
};

const GLYPH_H = 76;
const AXIS_H = 22;

export function LayoutView({ doc, schema, selected, onSelect, run, preview, show, onDropElement, readOnly, fitSignal }: Props) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const theme = useApp((s) => s.resolvedTheme);
  const [size, setSize] = useState({ w: 800, h: 360 });
  const [view, setView] = useState<[number, number]>([0, 1]);
  const [hover, setHover] = useState<{ x: number; y: number; z: number } | null>(null);
  const [drop, setDrop] = useState<{ z: number; kind: string } | null>(null);
  const fitted = useRef(true);
  const lastTotal = useRef(-1);
  const drag = useRef<{ x: number; v0: number; v1: number; moved: boolean } | null>(null);
  const titles = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k.title])), [schema]);

  const items = useMemo<Item[]>(() => {
    const blockOrder = new Map<number, number>();
    return doc.statements
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
          issue: worstIssue(s),
          r: aperture(s),
        };
      });
  }, [doc, titles]);

  const total = Math.max(doc.totalLength ?? 0, ...items.map((i) => i.z1), 1e-6);
  const fit = () => {
    const pad = total * 0.01;
    setView([-pad, total + pad]);
    fitted.current = true;
  };
  useEffect(() => {
    if (Math.abs(total - lastTotal.current) > 1e-9) {
      lastTotal.current = total;
      if (fitted.current) fit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);
  useEffect(() => {
    if (fitSignal) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

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

  const plot = { left: 56, right: show.energy ? 56 : 16, top: GLYPH_H + 8, bottom: AXIS_H + 6 };
  const pw = Math.max(10, size.w - plot.left - plot.right);
  const ph = Math.max(40, size.h - plot.top - plot.bottom);
  const xOf = (z: number) => plot.left + ((z - view[0]) / (view[1] - view[0])) * pw;
  const zOf = (x: number) => view[0] + ((x - plot.left) / pw) * (view[1] - view[0]);
  const glyphCy = GLYPH_H / 2 + 4;

  // vertical scale (mm) from what is visible
  const yMax = useMemo(() => {
    let m = 0;
    const scan = (z: ArrayLike<number>, v: ArrayLike<number>) => {
      for (let i = 0; i < z.length; i++) if (z[i] >= view[0] && z[i] <= view[1] && Number.isFinite(v[i])) m = Math.max(m, Math.abs(v[i]));
    };
    if (show.run && run) {
      if (show.max) {
        scan(run.z, run.maxX);
        scan(run.z, run.maxY);
      } else {
        scan(run.z, run.rmsX);
        scan(run.z, run.rmsY);
      }
    }
    if (show.preview && preview) {
      scan(preview.z, preview.rms_x);
      scan(preview.z, preview.rms_y);
    }
    if (show.scale === "pipe" || m === 0) for (const it of items) if (it.r && it.z1 >= view[0] && it.z0 <= view[1]) m = Math.max(m, it.r * 1000);
    return m > 0 ? m * 1.15 : 1;
  }, [run, preview, show, items, view]);

  const eRange = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const scan = (v?: ArrayLike<number>) => {
      if (!v) return;
      for (let i = 0; i < v.length; i++) if (Number.isFinite(v[i]) && v[i] > -1e6) {
        lo = Math.min(lo, v[i]);
        hi = Math.max(hi, v[i]);
      }
    };
    if (show.run && run) scan(run.energy);
    if (show.preview && preview) scan(preview.energy);
    if (!Number.isFinite(lo)) return null;
    if (hi - lo < 1e-9) return [lo - 1, hi + 1] as [number, number];
    const pad = (hi - lo) * 0.05;
    return [lo - pad, hi + pad] as [number, number];
  }, [run, preview, show.run, show.preview]);

  const cyPlot = plot.top + ph / 2;
  const yOf = (mm: number) => cyPlot - (mm / yMax) * (ph / 2);

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
      run: cssColor("--el-bmag"),
      runY: cssColor("--el-quad"),
      preview: cssColor("--el-rf"),
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
    ctx.moveTo(plot.left, glyphCy + 0.5);
    ctx.lineTo(plot.left + pw, glyphCy + 0.5);
    ctx.stroke();
    const ordered = [...items].sort((a, b) => Number(a.shape !== "drift") - Number(b.shape !== "drift") || a.lane - b.lane);
    for (const it of ordered) {
      if (it.z1 < view[0] || it.z0 > view[1]) continue;
      const x0 = xOf(it.z0);
      const x1 = xOf(it.z1);
      const zero = it.z1 - it.z0 <= 0 || isZeroLength(it.shape);
      const h = (GLYPH_H / 2 - 6) * (it.lane ? 0.78 : 1);
      drawGlyph(ctx, it.shape, it.pol, x0, zero ? x0 : x1, glyphCy, h, cssColor(it.color), { alpha: it.lane ? 0.55 : 0.42 });
      if (it.issue) {
        ctx.fillStyle = it.issue === "error" ? c.danger : c.warning;
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (sel) {
      const x0 = xOf(sel.z0);
      const x1 = Math.max(xOf(sel.z1), x0 + 4);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 - 2, 4, x1 - x0 + 4, GLYPH_H - 4);
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
    // pipe walls
    if (show.aperture) {
      ctx.fillStyle = c.pipe;
      ctx.globalAlpha = 0.45;
      for (const it of items) {
        if (!it.r || it.lane || it.z1 < view[0] || it.z0 > view[1] || it.z1 <= it.z0) continue;
        const x0 = xOf(it.z0);
        const x1 = xOf(it.z1);
        const yt = yOf(it.r * 1000);
        const yb = yOf(-it.r * 1000);
        if (yt > plot.top) ctx.fillRect(x0, plot.top, x1 - x0, yt - plot.top);
        if (yb < plot.top + ph) ctx.fillRect(x0, yb, x1 - x0, plot.top + ph - yb);
      }
      ctx.globalAlpha = 1;
    }
    // zero line
    ctx.strokeStyle = c.soft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.left, Math.round(cyPlot) + 0.5);
    ctx.lineTo(plot.left + pw, Math.round(cyPlot) + 0.5);
    ctx.stroke();

    const curve = (z: ArrayLike<number>, v: ArrayLike<number>, sign: 1 | -1, color: string, width: number, dash: number[] = []) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      let pen = false;
      // pixel-level min/max decimation keeps spikes visible when zoomed out
      let lastPx = -1;
      let lo = 0;
      let hi = 0;
      const flush = (px: number) => {
        if (!pen) {
          ctx.moveTo(px, yOf(sign * lo));
          pen = true;
        } else ctx.lineTo(px, yOf(sign * lo));
        if (hi !== lo) ctx.lineTo(px, yOf(sign * hi));
      };
      let started = false;
      for (let i = 0; i < z.length; i++) {
        const val = v[i];
        if (!Number.isFinite(val)) {
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
    };
    if (show.run && run) {
      if (show.max) {
        curve(run.z, run.maxX, 1, c.run, 1, [4, 3]);
        curve(run.z, run.maxY, -1, c.runY, 1, [4, 3]);
      }
      curve(run.z, run.rmsX, 1, c.run, 1.6);
      curve(run.z, run.rmsY, -1, c.runY, 1.6);
    }
    if (show.preview && preview) {
      curve(preview.z, preview.rms_x, 1, c.preview, 1.8, [6, 3]);
      curve(preview.z, preview.rms_y, -1, c.preview, 1.8, [6, 3]);
    }
    if (show.losses && run && run.losses.length) {
      ctx.fillStyle = c.danger;
      const byPx = new Map<number, number>();
      for (const l of run.losses) {
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

    // energy on the right axis
    if (show.energy && eRange) {
      const eY = (w: number) => plot.top + ph - ((w - eRange[0]) / (eRange[1] - eRange[0])) * ph;
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.left, plot.top, pw, ph);
      ctx.clip();
      const ecurve = (z: ArrayLike<number>, v: ArrayLike<number>, color: string, dash: number[]) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash(dash);
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < z.length; i++) {
          if (!Number.isFinite(v[i]) || v[i] < -1e6) {
            pen = false;
            continue;
          }
          const x = xOf(z[i]);
          if (!pen) ctx.moveTo(x, eY(v[i]));
          else ctx.lineTo(x, eY(v[i]));
          pen = true;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };
      if (show.run && run) ecurve(run.z, run.energy, c.soft, [2, 2]);
      if (show.preview && preview) ecurve(preview.z, preview.energy, c.preview, [2, 3]);
      ctx.restore();
      ctx.fillStyle = c.soft;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const es = niceStep((eRange[1] - eRange[0]) / 4);
      for (let w = Math.ceil(eRange[0] / es) * es; w <= eRange[1]; w += es) ctx.fillText(String(Number(w.toPrecision(5))), plot.left + pw + 6, eY(w));
      ctx.save();
      ctx.translate(size.w - 8, plot.top + ph / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("W (MeV)", 0, 0);
      ctx.restore();
    }

    // ---- axes
    ctx.fillStyle = c.soft;
    ctx.strokeStyle = c.soft;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ys = niceStep(yMax / 3);
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
    ctx.fillText("z (m)", plot.left + pw, ay);

    // ---- hover and drop markers
    if (hover && hover.x >= plot.left && hover.x <= plot.left + pw) {
      ctx.strokeStyle = c.fg;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(Math.round(hover.x) + 0.5, 0);
      ctx.lineTo(Math.round(hover.x) + 0.5, size.h - AXIS_H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (drop) {
      const x = xOf(drop.z);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.h - AXIS_H);
      ctx.stroke();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, view, size, selected, theme, run, preview, show, hover, drop, yMax, eRange]);

  const hitItem = (x: number, y: number): Item | null => {
    const z = zOf(x);
    const tol = ((view[1] - view[0]) / pw) * 4;
    const hits = items.filter((it) => z >= it.z0 - tol && z <= it.z1 + tol);
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

  const hoverInfo = hover ? readout(hover.z) : null;
  function readout(z: number) {
    const it = hitItem(xOf(z), hover!.y);
    const rows: [string, string][] = [["z", `${fmt6(z)} m`]];
    if (it) rows.push([t("Element"), `${it.label} · ${it.typeTitle}`]);
    if (it?.r) rows.push([t("Aperture"), `${fmt6(it.r * 1000)} mm`]);
    if (show.run && run) {
      const x = sampleAt(run.z, run.rmsX, z);
      const y = sampleAt(run.z, run.rmsY, z);
      if (Number.isFinite(x)) rows.push([t("Run rms x / y"), `${fmt6(x)} / ${fmt6(y)} mm`]);
      const w = sampleAt(run.z, run.energy, z);
      if (Number.isFinite(w)) rows.push([t("Run energy"), `${fmt6(w)} MeV`]);
    }
    if (show.preview && preview) {
      const x = sampleAt(preview.z, preview.rms_x, z);
      const y = sampleAt(preview.z, preview.rms_y, z);
      if (Number.isFinite(x)) rows.push([t("Preview rms x / y"), `${fmt6(x)} / ${fmt6(y)} mm`]);
      const w = sampleAt(preview.z, preview.energy, z);
      if (Number.isFinite(w)) rows.push([t("Preview energy"), `${fmt6(w)} MeV`]);
    }
    return rows;
  }

  return (
    <div
      className="layout-view"
      ref={wrapRef}
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
        style={{ width: "100%", height: "100%", display: "block" }}
        onWheel={(e) => {
          const { x } = local(e);
          const zc = zOf(x);
          const f = e.deltaY < 0 ? 0.8 : 1.25;
          const span = Math.min(Math.max((view[1] - view[0]) * f, 1e-4), total * 1.2);
          const frac = (x - plot.left) / pw;
          setView([zc - frac * span, zc - frac * span + span]);
          fitted.current = false;
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
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
            const it = hitItem(x, y);
            if (it) onSelect(it.line);
          }
        }}
        onMouseLeave={() => {
          drag.current = null;
          setHover(null);
        }}
        onDoubleClick={fit}
      />
      {hover && hoverInfo && hover.x >= plot.left && (
        <div className="layout-tip" style={{ left: Math.min(hover.x + 14, size.w - 250), top: Math.min(hover.y + 14, size.h - 20 - hoverInfo.length * 18) }}>
          {hoverInfo.map(([k, v]) => (
            <div key={k}>
              <span className="soft">{k}</span> {v}
            </div>
          ))}
        </div>
      )}
      {drop && (
        <div className="layout-drop-hint" style={{ left: Math.min(Math.max(8, xOf(drop.z) + 8), size.w - 200) }}>
          {drop.kind === "split" ? t("split the drift here") : drop.kind === "superpose" ? t("superpose in this block") : t("insert here")}
        </div>
      )}
      <div className="layout-legend">
        {show.run && run && (
          <span>
            <i className="lg-line" style={{ background: "var(--el-bmag)" }} /> x <i className="lg-line" style={{ background: "var(--el-quad)" }} /> y {t("last run")}
            {show.max ? ` (${t("rms solid, max dashed")})` : ""}
          </span>
        )}
        {show.preview && preview && (
          <span>
            <i className="lg-line dashed" style={{ borderColor: "var(--el-rf)" }} /> {t("linear preview")}
          </span>
        )}
        {show.losses && run && run.losses.length > 0 && (
          <span>
            <i className="lg-line" style={{ background: "var(--danger)", width: 3, height: 10 }} /> {t("losses")}
          </span>
        )}
      </div>
    </div>
  );
}
