// Schematic of the active elements along z.  Wheel = zoom, drag = pan,
// click = select, double-click = fit.
import { useEffect, useMemo, useRef, useState } from "react";
import { pick, useT } from "../i18n";
import { useApp } from "../store/app";
import { cssColor, drawGlyph, elementShape, isZeroLength, niceStep, polarity, type Shape } from "./glyphs";
import { elementColorVar, fmt6, worstIssue, type LatticeDoc, type Schema } from "./types";

type Item = {
  line: number;
  z0: number;
  z1: number;
  color: string;
  lane: number;
  kind: "marker" | "line" | "box";
  shape: Shape;
  pol: number;
  label: string;
  title: string;
  issue: "error" | "warning" | null;
};

const LANES = [1.0, 0.72, 0.48, 0.3];
const HEIGHT = 104;

export function Beamline({ doc, schema, selected, onSelect }: { doc: LatticeDoc | null; schema: Schema; selected: number | null; onSelect: (line: number) => void }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const theme = useApp((s) => s.resolvedTheme);
  const [size, setSize] = useState({ w: 600, h: HEIGHT });
  const [view, setView] = useState<[number, number]>([0, 1]);
  const [hover, setHover] = useState<{ x: number; y: number; item: Item } | null>(null);
  const fitted = useRef(true);
  const lastTotal = useRef(-1);
  const drag = useRef<{ x: number; v0: number; v1: number; moved: boolean } | null>(null);

  const titles = useMemo(() => new Map(schema.lattice.map((k) => [k.key, k.title])), [schema]);

  const items = useMemo<Item[]>(() => {
    if (!doc) return [];
    const blockOrder = new Map<number, number>();
    return doc.statements
      .filter((s) => s.active && s.isElement && s.zStart != null)
      .map((s) => {
        let lane = 0;
        if (s.block != null) {
          const n = blockOrder.get(s.block) ?? 0;
          blockOrder.set(s.block, n + 1);
          lane = Math.min(n, 3);
        }
        const z0 = s.zStart!;
        const z1 = s.zEnd ?? z0;
        const label = s.name || (s.key === "field" ? s.params[8] : "") || s.keyword;
        const title = titles.get(s.key);
        const shape = elementShape(s);
        return {
          line: s.line,
          z0,
          z1,
          color: elementColorVar(s),
          lane,
          kind: z1 - z0 <= 0 || isZeroLength(shape) ? "marker" : s.key === "drift" ? "line" : "box",
          shape,
          pol: polarity(s),
          label,
          title: `${label} · ${title ? pick(title) : s.keyword}\nz = ${fmt6(z0)} … ${fmt6(z1)} m`,
          issue: worstIssue(s),
        } as Item;
      });
  }, [doc, titles]);

  const total = Math.max(doc?.totalLength ?? 0, ...items.map((i) => i.z1), 1e-6);

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
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: HEIGHT }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // bring an externally selected element into view
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

  const rect = { left: 10, top: 8, width: Math.max(10, size.w - 20), height: HEIGHT - 30 };
  const xOf = (z: number) => rect.left + ((z - view[0]) / (view[1] - view[0])) * rect.width;
  const zOf = (x: number) => view[0] + ((x - rect.left) / rect.width) * (view[1] - view[0]);
  const itemRect = (it: Item) => {
    const x0 = xOf(it.z0);
    const x1 = xOf(it.z1);
    const h = rect.height * LANES[it.lane];
    const cy = rect.top + rect.height / 2;
    if (it.kind === "marker") return { x: x0 - 3, y: rect.top, w: 6, h: rect.height };
    return { x: x0, y: cy - h / 2, w: Math.max(2, x1 - x0), h };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = HEIGHT * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, HEIGHT);
    ctx.fillStyle = cssColor("--beamline-bg");
    ctx.fillRect(0, 0, size.w, HEIGHT);
    const cy = rect.top + rect.height / 2;
    ctx.strokeStyle = cssColor("--el-drift");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.left, cy + 0.5);
    ctx.lineTo(rect.left + rect.width, cy + 0.5);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.left - 4, rect.top - 4, rect.width + 8, rect.height + 8);
    ctx.clip();
    const sorted = [...items].sort((a, b) => Number(a.kind !== "line") - Number(b.kind !== "line") || a.lane - b.lane);
    for (const it of sorted) {
      if (it.z1 < view[0] || it.z0 > view[1]) continue;
      const r = itemRect(it);
      const color = cssColor(it.color);
      if (it.kind === "marker") drawGlyph(ctx, it.shape, it.pol, r.x, r.x + r.w, cy, (rect.height / 2) * 0.8, color);
      else drawGlyph(ctx, it.shape, it.pol, r.x, r.x + r.w, cy, (rect.height / 2) * LANES[it.lane], color, { alpha: it.lane ? 0.59 : 0.43 });
      if (it.issue) {
        ctx.fillStyle = cssColor(it.issue === "error" ? "--danger" : "--warning");
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, rect.top + 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const sel = items.find((i) => i.line === selected);
    if (sel) {
      let r = itemRect(sel);
      if (sel.kind === "line") r = { x: r.x, y: cy - 0.2 * rect.height, w: r.w, h: 0.4 * rect.height };
      ctx.strokeStyle = cssColor("--accent");
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    }
    ctx.restore();
    // axis
    const span = view[1] - view[0];
    const step = niceStep(span / Math.max(1, rect.width / 90));
    ctx.strokeStyle = cssColor("--fg-soft");
    ctx.fillStyle = cssColor("--fg-soft");
    ctx.lineWidth = 1;
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const y = rect.top + rect.height + 4;
    for (let z = Math.ceil(view[0] / step) * step; z <= view[1] + 1e-12; z += step) {
      const x = xOf(z);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y + 3);
      ctx.stroke();
      if (x < rect.left + rect.width - 56) ctx.fillText(String(Number(z.toPrecision(6))), x, y + 4);
    }
    ctx.textAlign = "right";
    ctx.fillText("z (m)", rect.left + rect.width, y + 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, view, size, selected, theme]);

  const hit = (x: number, y: number): Item | null => {
    const hits = items.filter((it) => {
      const r = itemRect(it);
      return x >= r.x - 2 && x <= r.x + r.w + 2 && y >= Math.min(r.y, rect.top) && y <= Math.max(r.y + r.h, rect.top + rect.height);
    });
    if (!hits.length) return null;
    hits.sort((a, b) => b.lane - a.lane || Number(a.kind === "line") - Number(b.kind === "line") || a.z1 - a.z0 - (b.z1 - b.z0));
    return hits[0];
  };

  const local = (e: React.MouseEvent | React.WheelEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="beamline" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: HEIGHT, display: "block" }}
        onWheel={(e) => {
          const { x } = local(e);
          const zc = zOf(x);
          const f = e.deltaY < 0 ? 0.8 : 1.25;
          const span = Math.min(Math.max((view[1] - view[0]) * f, 1e-4), total * 1.2);
          const frac = (x - rect.left) / rect.width;
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
              const dz = (dx / rect.width) * (d.v1 - d.v0);
              setView([d.v0 - dz, d.v1 - dz]);
              fitted.current = false;
              setHover(null);
            }
            return;
          }
          const { x, y } = local(e);
          const it = hit(x, y);
          setHover(it ? { x, y, item: it } : null);
        }}
        onMouseUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) {
            const { x, y } = local(e);
            const it = hit(x, y);
            if (it) onSelect(it.line);
          }
        }}
        onMouseLeave={() => {
          drag.current = null;
          setHover(null);
        }}
        onDoubleClick={fit}
      />
      {hover && (
        <div className="beamline-tip" style={{ left: Math.min(hover.x + 12, size.w - 220), top: hover.y + 14 }}>
          {hover.item.title}
        </div>
      )}
      {!items.length && <div className="beamline-empty">{t("No active elements between start and end")}</div>}
    </div>
  );
}
