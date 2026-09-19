// HTML overlay of the 3D beamline view (Beamline3D.tsx): the element labels and
// ruler ticks drawn as positioned <div>s, and the position bar (a 2D canvas
// under the view) that shows the elements, the visible range and lets the user
// move along the beamline.  The viewer (b3dViewer.ts) owns the scene and hands
// the parts it needs over explicitly, so this module does not import it.
import * as THREE from "three";
import { cx } from "../components/ui";
import { niceStep } from "../util";
import { FOV, type Info } from "./b3dGeometry";
import type { Elem, Model } from "./beamline3dModel";
import { fmt6 } from "./types";

type LabelPiece = { text: string; line: number | null; on?: boolean };
const BAR_PAD = 10; // px left and right of the position bar's track

/* ================================================================== labels */
/** What the labels need from the scene, for one frame. */
export type LabelScene = {
  camera: THREE.PerspectiveCamera;
  W: number;
  H: number;
  infos: Info[];
  groups: Map<Info, Info[]>; // superposed elements sharing one label
  sel: Info | undefined;
  labelsOn: boolean;
  ticks: { pos: THREE.Vector3; text: string }[];
};

export class Labels {
  private pool: HTMLDivElement[] = [];
  private hits: { el: HTMLElement; line: number }[] = [];
  private hot: HTMLElement | null = null;

  constructor(private layer: HTMLElement) {}

  update(scene: LabelScene) {
    const { camera, W, H } = scene;
    const placed: [number, number, number, number][] = [];
    let used = 0;
    const v = new THREE.Vector3();
    this.hits = [];
    const place = (pieces: LabelPiece[], pos: THREE.Vector3, cls: string, force: boolean) => {
      v.copy(pos).project(camera);
      if (v.z > 1 || v.z < -1) return false;
      const x = ((v.x + 1) / 2) * W;
      const y = ((1 - v.y) / 2) * H;
      const chars = pieces.reduce((n, p) => n + p.text.length, 0);
      const w = chars * 6.4 + 10 + (pieces.length - 1) * 11;
      const h = 17;
      const r: [number, number, number, number] = [x - w / 2, y - h - 3, x + w / 2, y - 3];
      if (r[2] < 0 || r[0] > W || r[3] < 0 || r[1] > H) return false;
      if (!force) {
        for (const q of placed) if (r[0] < q[2] + 3 && r[2] > q[0] - 3 && r[1] < q[3] && r[3] > q[1]) return false;
      }
      placed.push(r);
      let el = this.pool[used];
      if (!el) {
        el = document.createElement("div");
        this.layer.appendChild(el);
        this.pool.push(el);
      }
      used++;
      const key = pieces.map((p) => `${p.line}${p.text}${p.on ? 1 : 0}`).join("");
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.replaceChildren(
          ...pieces.map((p) => {
            const span = document.createElement("span");
            span.textContent = p.text;
            if (p.on) span.className = "on";
            return span;
          }),
        );
        if (this.hot && !this.hot.isConnected) this.hot = null;
      }
      if (el.className !== cls) el.className = cls;
      el.style.display = "";
      el.style.transform = `translate(${Math.round(r[0])}px, ${Math.round(r[1])}px)`;
      pieces.forEach((p, i) => {
        if (p.line != null) this.hits.push({ el: el.children[i] as HTMLElement, line: p.line });
      });
      return true;
    };
    // superposed elements share one label; the part of each element is clickable
    const group = (info: Info) => scene.groups.get(info) ?? [info];
    const top = (list: Info[]) => list.reduce((a, b) => (b.outer > a.outer ? b : a));

    const sel = scene.sel;
    const selGroup = sel ? group(sel) : [];
    if (sel) {
      place(
        selGroup.map((i) => ({ text: i.e.label, line: i.e.line, on: i === sel })),
        top(selGroup).anchor,
        cx("b3d-label selected", selGroup.length > 1 && "group"),
        true,
      );
    }
    if (scene.labelsOn && scene.infos.length) {
      const cam = camera.position;
      const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const cands: { list: Info[]; d: number }[] = [];
      const seen = new Set<Info[]>([selGroup]);
      for (const info of scene.infos) {
        if (info === sel || info.e.shape === "drift") continue;
        const list = group(info);
        if (seen.has(list)) continue;
        seen.add(list);
        const inner = list.find((i) => !i.e.ghost) ?? list[0];
        const d = cam.distanceTo(inner.center);
        // judged by the size of the (innermost) element, not of the translucent outer magnets
        const px = (Math.max(...list.map((i) => i.outer / i.e.radial)) / Math.max(d * tanV, 1e-9)) * (H / 2);
        if (px < 22) continue; // only elements that are close enough to be recognisable
        v.copy(inner.center).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) continue;
        cands.push({ list, d });
      }
      cands.sort((a, b) => a.d - b.d);
      let shown = 0;
      for (const c of cands.slice(0, 120)) {
        if (shown >= 30) break;
        const pieces = c.list.map((i) => ({ text: i.e.label, line: i.e.line }));
        if (place(pieces, top(c.list).anchor, cx("b3d-label", c.list.length > 1 && "group"), false)) shown++;
      }
    }
    for (const tk of scene.ticks) place([{ text: tk.text, line: null }], tk.pos, "b3d-label tick", false);
    for (let i = used; i < this.pool.length; i++) this.pool[i].style.display = "none";
  }

  /** The element line of the label part under the pointer, or null. */
  at(clientX: number, clientY: number): { line: number; el: HTMLElement } | null {
    for (const hit of this.hits) {
      const r = hit.el.getBoundingClientRect();
      if (clientX >= r.left - 1 && clientX <= r.right + 1 && clientY >= r.top - 1 && clientY <= r.bottom + 1) return hit;
    }
    return null;
  }

  setHot(el: HTMLElement | null) {
    if (el === this.hot) return;
    this.hot?.classList.remove("hot");
    this.hot = el;
    el?.classList.add("hot");
  }

  dispose() {
    for (const el of this.pool) el.remove();
    this.pool = [];
  }
}

/* ================================================================== position bar */
/** What the position bar reads from and asks of the viewer. */
export type BarHost = {
  host: HTMLElement; // the view's root (the tooltip is positioned in it)
  tip: HTMLElement;
  model(): Model | null;
  colors(): Map<string, THREE.Color>;
  selected(): number | null;
  hovered(): number | null;
  flyS(): number | null; // arc length of the fly-through while it runs
  visibleRange(): [number, number] | null;
  targetS(): number;
  viewWidth(): number;
  moveToS(s: number, ms: number): void;
  select(line: number): void;
  focus(line: number): void;
};

export class PositionBar {
  private key = "";
  private drag: { id: number; moved: boolean } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private h: BarHost,
  ) {
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("pointerleave", this.onLeave);
    canvas.addEventListener("dblclick", this.onDoubleClick);
  }

  dispose() {
    const canvas = this.canvas;
    canvas.removeEventListener("pointerdown", this.onDown);
    canvas.removeEventListener("pointermove", this.onMove);
    canvas.removeEventListener("pointerup", this.onUp);
    canvas.removeEventListener("pointercancel", this.onUp);
    canvas.removeEventListener("pointerleave", this.onLeave);
    canvas.removeEventListener("dblclick", this.onDoubleClick);
  }

  /** Forget the last drawing (the scene was rebuilt). */
  reset() {
    this.key = "";
  }

  update() {
    const c = this.canvas;
    const m = this.h.model();
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!m || m.total <= 0 || !w || !h) {
      if (this.key !== "empty") {
        this.key = "empty";
        c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      }
      return;
    }
    const colors = this.h.colors();
    const selected = this.h.selected();
    const hovered = this.h.hovered();
    const flyS = this.h.flyS();
    const range = this.h.visibleRange();
    const ts = this.h.targetS();
    const key = [w, h, range?.[0].toFixed(4), range?.[1].toFixed(4), ts.toFixed(4), selected, hovered, m.total, colors.get("--fg")!.getHexString(), flyS != null ? flyS.toFixed(3) : ""].join();
    if (key === this.key) return;
    this.key = key;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const css = (name: string) => `#${(colors.get(name) ?? colors.get("--fg")!).getHexString()}`;
    const X = (s: number) => BAR_PAD + ((w - 2 * BAR_PAD) * s) / m.total;
    const trackY = 7;
    const trackH = 9;
    g.fillStyle = css("--border");
    g.fillRect(BAR_PAD, trackY + trackH / 2 - 0.5, w - 2 * BAR_PAD, 1);
    for (const e of m.elems) {
      if (e.shape === "drift") continue;
      const x0 = X(e.s0);
      const x1 = X(e.s1);
      const inset = e.ghost ? 2.5 : 0;
      g.fillStyle = css(e.colorVar);
      g.globalAlpha = e.ghost ? 0.45 : 0.95;
      g.fillRect(x0, trackY + inset, Math.max(1, x1 - x0), trackH - 2 * inset);
    }
    g.globalAlpha = 1;
    const accent = css("--accent");
    for (const line of [selected, hovered]) {
      const e = line == null ? undefined : m.byLine.get(line);
      if (!e) continue;
      g.fillStyle = line === selected ? accent : css("--fg");
      g.fillRect(X(e.s0) - 1, trackY + trackH + 2, Math.max(3, X(e.s1) - X(e.s0) + 2), 2);
    }
    if (range) {
      const x0 = X(range[0]);
      const x1 = Math.max(X(range[1]), x0 + 2);
      g.fillStyle = accent;
      g.globalAlpha = 0.14;
      g.fillRect(x0, 2, x1 - x0, trackH + 10);
      g.globalAlpha = 1;
      g.strokeStyle = accent;
      g.lineWidth = 1;
      g.strokeRect(x0 + 0.5, 2.5, x1 - x0 - 1, trackH + 9);
    }
    const xt = X(flyS != null ? flyS : ts);
    g.fillStyle = accent;
    g.beginPath();
    g.moveTo(xt - 4, 0);
    g.lineTo(xt + 4, 0);
    g.lineTo(xt, 5);
    g.closePath();
    g.fill();
    // scale
    g.fillStyle = css("--fg-soft");
    g.font = "10px system-ui, sans-serif";
    g.textBaseline = "alphabetic";
    let step = niceStep(m.total / Math.max(2, Math.floor((w - 2 * BAR_PAD) / 70)));
    while (m.total / step > 40) step *= 2;
    for (let k = 0; k * step <= m.total + step * 1e-6; k++) {
      const s = k * step;
      const x = X(s);
      g.fillRect(x, trackY + trackH + 5, 1, 3);
      const text = `${Number(s.toPrecision(6))}`;
      const tw = g.measureText(text).width;
      g.fillText(text, Math.min(Math.max(x - tw / 2, 0), w - tw), h - 2);
    }
  }

  private barS(clientX: number) {
    const m = this.h.model();
    const r = this.canvas.getBoundingClientRect();
    const f = (clientX - r.left - BAR_PAD) / Math.max(1, r.width - 2 * BAR_PAD);
    return Math.min(Math.max(f, 0), 1) * (m?.total ?? 0);
  }

  private elemAtS(s: number) {
    const m = this.h.model();
    if (!m) return undefined;
    const tol = (m.total / Math.max(1, this.canvas.clientWidth - 2 * BAR_PAD)) * 3;
    let best: Elem | undefined;
    for (const e of m.elems) {
      if (e.shape === "drift" || s < e.s0 - tol || s > e.s1 + tol) continue;
      if (!best || (best.ghost && !e.ghost) || (best.ghost === e.ghost && e.s1 - e.s0 < best.s1 - best.s0)) best = e;
    }
    return best;
  }

  private onDown = (ev: PointerEvent) => {
    if (ev.button !== 0 || !this.h.model()) return;
    ev.preventDefault();
    this.canvas.setPointerCapture(ev.pointerId);
    this.drag = { id: ev.pointerId, moved: false };
    this.h.moveToS(this.barS(ev.clientX), 250);
  };

  private onMove = (ev: PointerEvent) => {
    const s = this.barS(ev.clientX);
    if (this.drag && this.drag.id === ev.pointerId) {
      this.drag.moved = true;
      this.h.moveToS(s, 0);
    }
    const e = this.elemAtS(s);
    const tip = this.h.tip;
    tip.textContent = `z = ${fmt6(s)} m${e ? `\n${e.label}` : ""}`;
    tip.style.display = "block";
    const host = this.h.host.getBoundingClientRect();
    const x = ev.clientX - host.left;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const top = this.canvas.getBoundingClientRect().top - host.top - th - 6;
    tip.style.transform = `translate(${Math.round(Math.min(Math.max(4, x - tw / 2), this.h.viewWidth() - tw - 4))}px, ${Math.round(Math.max(4, top))}px)`;
  };

  private onUp = (ev: PointerEvent) => {
    if (this.drag && this.drag.id === ev.pointerId) this.drag = null;
  };

  private onLeave = () => {
    if (!this.drag) this.h.tip.style.display = "none";
  };

  private onDoubleClick = (ev: MouseEvent) => {
    const e = this.elemAtS(this.barS(ev.clientX));
    if (!e) return;
    this.h.select(e.line);
    this.h.focus(e.line);
  };
}
