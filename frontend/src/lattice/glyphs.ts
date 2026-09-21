// What an element looks like in the schematics: a shape class, a polarity and
// canvas drawing routines shared by the compact beamline and the visual editor.
import type { Statement } from "./types";

export type Shape = "drift" | "quad" | "solenoid" | "cavity" | "bend" | "edge" | "steerer" | "diag" | "efield" | "magnet" | "dipole" | "other";

const num = (s: string | undefined) => {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
};

/** Kind of magnet a static-magnetic field map is, guessed from its name (quads, solenoids, correctors, dipoles). */
export function fieldMapShape(name: string): Shape {
  const n = name.toLowerCase().replace(/^.*[\\/]/, "");
  if (n.includes("sol")) return "solenoid";
  if (/(^v\d|steer|dc[hv]|corr)/.test(n)) return "steerer";
  if (/(^q\d|ql|quad|^q[a-z_])/.test(n)) return "quad";
  if (/(^d\d|_d\d|dip|bend)/.test(n)) return "dipole";
  return "magnet";
}

export function elementShape(st: Statement): Shape {
  switch (st.key) {
    case "drift":
      return "drift";
    case "quad":
      return "quad";
    case "solenoid":
      return "solenoid";
    case "bend":
      return "bend";
    case "edge":
      return "edge";
    case "steerer":
      return "steerer";
    case "field":
      if (st.fieldType === "1") return "cavity";
      if (st.fieldType === "2") return "efield";
      if (st.fieldType === "3") return fieldMapShape(st.params[8] ?? "");
      return "other";
    default:
      return st.category === "diag" ? "diag" : "other";
  }
}

/** +1 focusing in x (drawn above the axis), -1 defocusing, 0 unknown / symmetric. */
export function polarity(st: Statement): number {
  if (st.key === "quad") return Math.sign(num(st.params[3]));
  if (st.key === "field" && st.fieldType === "3" && elementShape(st) === "quad") return Math.sign(num(st.params[7]));
  return 0;
}

export function isZeroLength(shape: Shape) {
  return shape === "steerer" || shape === "diag" || shape === "edge";
}

/**
 * Draw one element glyph centred on the axis at *cy*.  x0/x1 are pixel ends,
 * *h* the half height available.  Colours are resolved CSS values.
 */
export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  pol: number,
  x0: number,
  x1: number,
  cy: number,
  h: number,
  color: string,
  opts: { alpha?: number; outline?: boolean } = {},
) {
  const w = Math.max(x1 - x0, 1.5);
  const alpha = opts.alpha ?? 0.5;
  ctx.save();
  ctx.lineWidth = 1;
  const fill = (path: () => void) => {
    ctx.beginPath();
    path();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  switch (shape) {
    case "drift":
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(x0 + w, cy);
      ctx.stroke();
      break;
    case "quad": {
      // focusing quads above the axis, defocusing below (TraceWin convention)
      const hh = h * 0.9;
      if (pol > 0) fill(() => roundRect(ctx, x0, cy - hh, w, hh, 2));
      else if (pol < 0) fill(() => roundRect(ctx, x0, cy, w, hh, 2));
      else fill(() => roundRect(ctx, x0, cy - hh / 2, w, hh, 2));
      break;
    }
    case "solenoid": {
      const hh = h * 0.62;
      fill(() => roundRect(ctx, x0, cy - hh, w, 2 * hh, Math.min(4, w / 2)));
      if (w > 10) {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = color;
        const n = Math.min(12, Math.floor(w / 5));
        for (let i = 1; i < n; i++) {
          const x = x0 + (w * i) / n;
          ctx.beginPath();
          ctx.moveTo(x, cy - hh + 2);
          ctx.lineTo(x, cy + hh - 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "cavity": {
      const hh = h * 0.78;
      fill(() => {
        ctx.moveTo(x0, cy - hh * 0.35);
        ctx.bezierCurveTo(x0 + w * 0.1, cy - hh * 1.05, x0 + w * 0.9, cy - hh * 1.05, x0 + w, cy - hh * 0.35);
        ctx.lineTo(x0 + w, cy + hh * 0.35);
        ctx.bezierCurveTo(x0 + w * 0.9, cy + hh * 1.05, x0 + w * 0.1, cy + hh * 1.05, x0, cy + hh * 0.35);
        ctx.closePath();
      });
      break;
    }
    case "bend":
    case "dipole": {
      const hh = h * 0.7;
      const inset = Math.min(w * 0.2, 8);
      fill(() => {
        ctx.moveTo(x0, cy + hh);
        ctx.lineTo(x0 + inset, cy - hh);
        ctx.lineTo(x0 + w - inset, cy - hh);
        ctx.lineTo(x0 + w, cy + hh);
        ctx.closePath();
      });
      break;
    }
    case "efield": {
      const hh = h * 0.8;
      fill(() => {
        ctx.rect(x0, cy - hh, w, hh * 0.3);
        ctx.rect(x0, cy + hh * 0.7, w, hh * 0.3);
      });
      break;
    }
    case "magnet":
      fill(() => roundRect(ctx, x0, cy - h * 0.55, w, h * 1.1, 2));
      break;
    case "steerer": {
      const cx = (x0 + x1) / 2;
      const s = Math.min(6, h * 0.35);
      if (x1 - x0 > 6) fill(() => roundRect(ctx, x0, cy - h * 0.4, w, h * 0.8, 2));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.9);
      ctx.lineTo(cx - s, cy - h * 0.9 - s * 1.4);
      ctx.lineTo(cx + s, cy - h * 0.9 - s * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.9);
      ctx.lineTo(cx, cy + h * 0.6);
      ctx.stroke();
      break;
    }
    case "diag": {
      const cx = (x0 + x1) / 2;
      const s = Math.min(6, h * 0.4);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "edge": {
      const cx = (x0 + x1) / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy + h * 0.7);
      ctx.lineTo(cx + 3, cy - h * 0.7);
      ctx.stroke();
      break;
    }
    default:
      fill(() => roundRect(ctx, x0, cy - h * 0.4, w, h * 0.8, 2));
  }
  ctx.restore();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Aperture radius (m) of an element, if it has one. */
export function aperture(st: Statement): number | null {
  if (!st.isElement || st.category === "diag") return null;
  const r = Number(st.params[1]);
  return Number.isFinite(r) && r > 0 ? r : null;
}
