// The three.js viewer behind Beamline3D.tsx: scene construction from the model,
// on-demand rendering, camera animation (fit, focus, fly-through, follow the
// bunch), picking and pointer / keyboard navigation.  The HTML labels and the
// position bar live in b3dHud.ts, the unit geometries in b3dGeometry.ts.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { pick, t } from "../i18n";
import { cssColor, niceStep } from "../util";
import {
  CLOUD,
  CLOUD_N,
  FOV,
  edgesOfUnitBox,
  loopRect,
  makeGeometries,
  sweepGeometry,
  toWorld,
  type Info,
  type Loop,
  type PartKey,
} from "./b3dGeometry";
import { Labels, PositionBar } from "./b3dHud";
import { OUTER, downsampleEnvelope, type Elem, type EnvelopeSamples, type Model, type Pose, type Vec3 } from "./beamline3dModel";
import type { BunchFrame, MotionMode } from "./bunchPlayer";
import { fmt6, schemaNow, statementSummary } from "./types";

export type Envelope3D = { z: ArrayLike<number>; x: ArrayLike<number>; y: ArrayLike<number>; label: string } | null; // z in m, rms sizes in mm
export type PointerDevice = "auto" | "mouse" | "touchpad";

/* ================================================================== constants & helpers */
const LOSS_MS = 1500;
const ENV_RINGS = 1500;
const ENV_SEGMENTS = 20;
const MAG_FILL = 0.94; // longitudinal fill factor of magnets (gaps between neighbours)

const COLOR_VARS = [
  "--el-drift",
  "--el-rf",
  "--el-bmag",
  "--el-efield",
  "--el-quad",
  "--el-solenoid",
  "--el-bend",
  "--el-steerer",
  "--el-diag",
  "--el-other",
  "--beamline-bg",
  "--accent",
  "--fg",
  "--fg-soft",
  "--border",
  "--danger",
  "--bunch",
];

function readColors(): Map<string, THREE.Color> {
  const out = new Map<string, THREE.Color>();
  for (const name of COLOR_VARS) {
    const c = new THREE.Color(0.5, 0.5, 0.5);
    const value = cssColor(name);
    if (value) {
      try {
        c.setStyle(value);
      } catch {
        /* keep grey */
      }
    }
    out.set(name, c);
  }
  return out;
}

function fieldKindText(e: Elem): string {
  if (e.shape === "rf") return t("RF cavity");
  if (e.shape === "efield") return t("Static electric field");
  const guess: Record<string, () => string> = {
    solenoid: () => t("Solenoid"),
    quad: () => t("Quadrupole"),
    dipole: () => t("Dipole"),
    corrector: () => t("Steerer"),
    magnet: () => t("Static magnetic field"),
  };
  return e.guess ? guess[e.guess]() : "";
}

function tooltipText(e: Elem): string {
  const schema = schemaNow();
  const kw = schema?.lattice.find((k) => k.key === e.st.key);
  let type = kw ? pick(kw.title) : e.st.keyword;
  if (e.st.key === "field") {
    const sub = fieldKindText(e);
    if (sub) type += ` · ${sub}`;
  }
  const lines = [e.label, type, `z = ${fmt6(e.s0)} … ${fmt6(e.s1)} m`];
  const summary = statementSummary(e.st, kw);
  if (summary && summary !== e.label) lines.push(summary);
  return lines.join("\n");
}

/* ================================================================== viewer */
type Part = { mesh: THREE.Mesh; index: number };
type Bucket = { mats: number[]; cols: number[]; lines: number[] };
type Tween = { start: number; ms: number; t0: THREE.Vector3; t1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3 };
type Fly = { s: number; last: number; speed: number; startAt: number };

export type Callbacks = {
  onSelect: (line: number) => void;
  onFlyChange: (on: boolean) => void;
  onContextLost: (lost: boolean) => void;
  onFollowChange: (on: boolean) => void;
};

const VIEW_DIRS = {
  iso: new THREE.Vector3(-0.55, 0.62, 0.75).normalize(),
  side: new THREE.Vector3(0, 0, 1), // looking at the z-y plane, z to the right
  top: new THREE.Vector3(0, 1, 0.001).normalize(), // z to the right, x up
};
export type ViewName = keyof typeof VIEW_DIRS;

export class Viewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 1000);
  private controls: OrbitControls;
  private root = new THREE.Group(); // beam coordinates
  private content = new THREE.Group();
  private hemi = new THREE.HemisphereLight(0xffffff, 0x777777, 1.9);
  private sun = new THREE.DirectionalLight(0xffffff, 1.7);
  private geoms = makeGeometries();
  private boxEdges = edgesOfUnitBox();
  private dotGeom = new THREE.SphereGeometry(1, 20, 14);
  private mats = {
    solid: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.08, side: THREE.DoubleSide }),
    ghost: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide }),
    pipe: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
    pipeCurved: new THREE.MeshStandardMaterial({ roughness: 0.4, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
    orbit: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.65 }),
    ruler: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.8 }),
    env: new THREE.MeshStandardMaterial({ roughness: 0.5, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
    sel: new THREE.LineBasicMaterial({ depthTest: false, transparent: true }),
    hover: new THREE.LineBasicMaterial({ depthTest: false, transparent: true, opacity: 0.85 }),
    dot: new THREE.MeshBasicMaterial(),
    cloud: new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false }),
    lost: new THREE.PointsMaterial({ size: 3.5, sizeAttenuation: false, transparent: true, opacity: 1, depthWrite: false }),
    bunchDot: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }),
  };
  private beamDot = new THREE.Mesh(this.dotGeom, this.mats.dot);
  // ---- schematic bunch of a live run or a replay (beam coordinates, in root)
  private cloudGeom = new THREE.BufferGeometry();
  private lostGeom = new THREE.BufferGeometry();
  private cloud = new THREE.Points(this.cloudGeom, this.mats.cloud);
  private lostCloud = new THREE.Points(this.lostGeom, this.mats.lost);
  private bunchDot = new THREE.Mesh(this.dotGeom, this.mats.bunchDot);
  private bunch: BunchFrame | null = null;
  private bunchMode: MotionMode = "full";
  private keptFrac = 1;
  private lossAnim: { from: number; to: number; at: number } | null = null;
  private followBunch = false;
  private selBox: THREE.LineSegments;
  private hoverBox: THREE.LineSegments;
  private envMesh: THREE.Mesh | null = null;
  private envCache: { src: NonNullable<Envelope3D>; data: EnvelopeSamples } | null = null;
  private colors = readColors();

  private model: Model | null = null;
  private ex = 1;
  private envelope: Envelope3D = null;
  private envOn = true;
  private envScale = 3;
  private labelsOn = true;
  private selected: number | null = null;
  private hovered: number | null = null;

  private picks: THREE.Object3D[] = [];
  private parts = new Map<number, Part[]>();
  private disposables: { dispose(): void }[] = [];
  private infos: Info[] = [];
  private infoByLine = new Map<number, Info>();
  private ticks: { pos: THREE.Vector3; text: string }[] = [];
  private bounds = new THREE.Box3();
  private fitPoints: THREE.Vector3[] = [];
  private fitPad = 0;
  private sceneRadius = 1;
  private aTyp = 0.02; // median aperture x exaggeration

  private dirty = { content: false, env: false };
  private frameReq = 0;
  private hoverReq = 0;
  private tween: Tween | null = null;
  private fly: Fly | null = null;
  private flyS = 0;
  private fitted = false;
  private fittedTotal = -1;
  private built = false;
  private lastClick: { line: number; time: number } | null = null;
  private lost = false;
  private disposed = false;
  private size = { w: 1, h: 1 };
  private pointer: { x: number; y: number; inside: boolean } = { x: 0, y: 0, inside: false };
  private down: { x: number; y: number; button: number } | null = null;
  private lastUp = { time: -1e9, x: 0, y: 0 };
  private labels: Labels;
  private labelGroups = new Map<Info, Info[]>(); // superposed elements sharing one label
  private raycaster = new THREE.Raycaster();
  private ro: ResizeObserver;
  private mo: MutationObserver;
  private device: PointerDevice = "auto";
  private lastWheel: { kind: "mouse" | "touchpad"; time: number } | null = null;
  private sPts: { s: number; p: THREE.Vector3 }[] = []; // orbit samples for the position bar
  private posBar: PositionBar | null = null;
  private keyS: number | null = null;
  buildMs = 0;

  constructor(
    private host: HTMLElement,
    labelLayer: HTMLElement,
    private tip: HTMLElement,
    private bar: HTMLCanvasElement | null,
    private cb: Callbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    if (!this.renderer.getContext()) throw new Error("no WebGL context");
    const canvas = this.renderer.domElement;
    canvas.className = "b3d-canvas";
    host.prepend(canvas);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.labels = new Labels(labelLayer);

    this.root.rotation.y = Math.PI / 2; // beam (x, y, z) -> world (z, y, -x)
    this.root.add(this.content);
    this.scene.add(this.root, this.hemi, this.sun, this.sun.target);

    this.selBox = new THREE.LineSegments(this.boxEdges, this.mats.sel);
    this.hoverBox = new THREE.LineSegments(this.boxEdges, this.mats.hover);
    for (const box of [this.selBox, this.hoverBox]) {
      box.matrixAutoUpdate = false;
      box.visible = false;
      box.renderOrder = 10;
      box.frustumCulled = false;
      this.scene.add(box);
    }

    this.beamDot.visible = false;
    this.scene.add(this.beamDot);
    for (const [pts, geom] of [
      [this.cloud, this.cloudGeom],
      [this.lostCloud, this.lostGeom],
    ] as const) {
      geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CLOUD_N * 3), 3));
      pts.frustumCulled = false;
      pts.visible = false;
      pts.renderOrder = 5;
      this.root.add(pts);
    }
    this.bunchDot.visible = false;
    this.bunchDot.renderOrder = 5;
    this.scene.add(this.bunchDot);

    this.camera.position.set(-3, 2, 3);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;
    this.controls.zoomToCursor = true;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 1e-3;
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    this.controls.addEventListener("change", this.invalidate);
    this.controls.addEventListener("start", this.onControlStart);

    canvas.tabIndex = 0;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("dblclick", this.onDoubleClick);
    canvas.addEventListener("keydown", this.onKeyDown);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    // before OrbitControls' own wheel handler on the canvas: touchpad swipes pan instead of zooming
    host.addEventListener("wheel", this.onWheel, { capture: true, passive: false });
    if (this.bar) {
      this.posBar = new PositionBar(this.bar, {
        host,
        tip,
        model: () => this.model,
        colors: () => this.colors,
        selected: () => this.selected,
        hovered: () => this.hovered,
        flyS: () => (this.fly ? this.flyS : null),
        visibleRange: () => this.visibleRange(),
        targetS: () => this.targetS(),
        viewWidth: () => this.size.w,
        moveToS: (s, ms) => this.moveToS(s, ms),
        select: (line) => {
          this.lastClick = { line, time: performance.now() };
          this.cb.onSelect(line);
        },
        focus: (line) => this.focus(line),
      });
    }

    this.applyColors();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.mo = new MutationObserver(() => this.setTheme());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    this.resize();
  }

  /* ---------------------------------------------------------------- public API */
  setModel(model: Model, ex: number) {
    if (model === this.model && ex === this.ex) return;
    if (model !== this.model && this.fly && this.flyS > model.total) this.stopFly();
    this.model = model;
    this.ex = ex;
    this.dirty.content = true;
    this.dirty.env = true;
    requestAnimationFrame(() => !this.disposed && this.resize()); // the position bar appears or disappears with the elements
    this.invalidate();
  }

  setEnvelope(envelope: Envelope3D, on: boolean, scale: number) {
    if (envelope === this.envelope && on === this.envOn && scale === this.envScale) return;
    this.envelope = envelope;
    this.envOn = on;
    this.envScale = scale;
    this.dirty.env = true;
    this.invalidate();
  }

  setLabels(on: boolean) {
    this.labelsOn = on;
    this.invalidate();
  }

  /** The schematic bunch (null hides it); *mode* "full" draws the particle cloud, otherwise a dot. */
  setBunch(frame: BunchFrame | null, mode: MotionMode) {
    const prev = this.bunch;
    this.bunch = frame;
    this.bunchMode = mode;
    if (!frame) {
      this.keptFrac = 1;
      this.lossAnim = null;
    } else if (frame.particles0 > 0 && Number.isFinite(frame.alive)) {
      const frac = Math.max(0, Math.min(1, frame.alive / frame.particles0));
      // the particles lost since the previous frame turn red and fly outwards
      if (mode === "full" && prev && prev.source === frame.source && frac < this.keptFrac - 0.5 / CLOUD_N && frame.z >= prev.z)
        this.lossAnim = { from: frac, to: this.keptFrac, at: performance.now() };
      this.keptFrac = frac;
    }
    this.invalidate();
  }

  /** Camera follows the bunch (like the fly-through) until the user moves the view. */
  setFollow(on: boolean) {
    this.followBunch = on;
    if (on) this.stopFly();
    this.cb.onFollowChange(on);
    this.invalidate();
  }

  /** Pan mode: the left button pans and the right button rotates (for touchpads). */
  setPanMode(on: boolean) {
    this.controls.mouseButtons = on
      ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }
      : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    this.controls.touches = { ONE: on ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  }

  setPointerDevice(device: PointerDevice) {
    this.device = device;
    this.lastWheel = null;
  }

  /** Toolbar zoom around the current view target, independent of pointer detection. */
  zoom(direction: 1 | -1) {
    if (!this.model?.elems.length) return;
    this.onControlStart();
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * Math.pow(1.25, -direction),
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    offset.setLength(distance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.invalidate();
  }

  /** Move the view along the beamline so that it looks at arc length *s*, keeping the viewing direction. */
  moveToS(s: number, ms = 250) {
    const m = this.model;
    if (!m || m.total <= 0) return;
    const target = toWorld(m.orbit.pose(Math.min(Math.max(s, 0), m.total)).p);
    const offset = this.camera.position.clone().sub(this.controls.target);
    this.stopFly();
    this.animateTo(target, target.clone().add(offset), ms);
  }

  /** Arc length of the orbit point nearest to the point the camera looks at. */
  private targetS(): number {
    let best = 0;
    let bestD = Infinity;
    for (const pt of this.sPts) {
      const d = pt.p.distanceToSquared(this.controls.target);
      if (d < bestD) {
        bestD = d;
        best = pt.s;
      }
    }
    return best;
  }

  /** Arc-length range of the beamline that is on screen, or null. */
  private visibleRange(): [number, number] | null {
    const v = new THREE.Vector3();
    let lo = Infinity;
    let hi = -Infinity;
    for (const pt of this.sPts) {
      v.copy(pt.p).project(this.camera);
      if (v.z < 1 && v.z > -1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1) {
        lo = Math.min(lo, pt.s);
        hi = Math.max(hi, pt.s);
      }
    }
    return lo <= hi ? [lo, hi] : null;
  }

  setTheme() {
    // the app may switch data-theme after this effect runs: read now and once more next frame
    const apply = () => {
      if (this.disposed) return;
      const next = readColors();
      let changed = false;
      for (const [k, c] of next) if (!this.colors.get(k)?.equals(c)) changed = true;
      if (!changed) return;
      this.colors = next;
      this.applyColors();
      this.dirty.content = true;
      this.dirty.env = true;
      this.invalidate();
    };
    apply();
    requestAnimationFrame(apply);
  }

  setSelected(line: number | null) {
    this.selected = line;
    const internal = this.lastClick && this.lastClick.line === line && performance.now() - this.lastClick.time < 1500;
    this.lastClick = null;
    this.updateBoxes();
    this.invalidate();
    if (line == null || internal || !this.built || this.fly) return;
    const info = this.infoByLine.get(line);
    if (!info) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const ndc = info.center.clone().project(this.camera);
    const onScreen = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z < 1;
    if (!onScreen) offset.setLength(Math.min(offset.length(), this.focusDistance(info) * 2.5));
    this.animateTo(info.center, info.center.clone().add(offset));
  }

  fitAll(dir?: THREE.Vector3, animate = true) {
    if (this.bounds.isEmpty()) return;
    const d = (dir ?? this.camera.position.clone().sub(this.controls.target)).clone().normalize();
    if (!Number.isFinite(d.x) || d.lengthSq() < 0.5) d.copy(VIEW_DIRS.iso);
    const zAxis = d;
    const xAxis = new THREE.Vector3(0, 1, 0).cross(zAxis);
    if (xAxis.lengthSq() < 1e-8) xAxis.set(1, 0, 0);
    xAxis.normalize();
    const yAxis = zAxis.clone().cross(xAxis);
    // project the orbit points (padded by the largest element) on the view basis
    const pad = this.fitPad;
    const pts = this.fitPoints;
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const uvw = pts.map((p) => {
      const q = [p.dot(xAxis), p.dot(yAxis), p.dot(zAxis)];
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], q[k]);
        hi[k] = Math.max(hi[k], q[k]);
      }
      return q;
    });
    const mid = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2);
    const center = new THREE.Vector3().addScaledVector(xAxis, mid[0]).addScaledVector(yAxis, mid[1]).addScaledVector(zAxis, mid[2]);
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const tanH = tanV * this.camera.aspect;
    let dist = 0;
    for (const [u, v, w] of uvw) {
      dist = Math.max(dist, w - mid[2] + pad + Math.max((Math.abs(u - mid[0]) + pad) / tanH, (Math.abs(v - mid[1]) + pad) / tanV));
    }
    // perspective refinement: projected extent (normalised device coordinates) of the padded points
    const project = (c: THREE.Vector3, D: number) => {
      const cu = c.dot(xAxis);
      const cv = c.dot(yAxis);
      const cw = c.dot(zAxis);
      const r = { ok: true, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      for (const [u, v, w] of uvw) {
        const depth = D - (w - cw);
        if (depth <= pad * 1.01) return { ...r, ok: false };
        const px = pad / (depth * tanH);
        const py = pad / (depth * tanV);
        const nx = (u - cu) / (depth * tanH);
        const ny = (v - cv) / (depth * tanV);
        r.x0 = Math.min(r.x0, nx - px);
        r.x1 = Math.max(r.x1, nx + px);
        r.y0 = Math.min(r.y0, ny - py);
        r.y1 = Math.max(r.y1, ny + py);
      }
      return r;
    };
    const LIMIT = 0.94;
    const fits = (c: THREE.Vector3, D: number) => {
      const r = project(c, D);
      return r.ok && r.x0 >= -LIMIT && r.x1 <= LIMIT && r.y0 >= -LIMIT && r.y1 <= LIMIT;
    };
    const first = project(center, dist);
    if (first.ok) center.addScaledVector(xAxis, ((first.x0 + first.x1) / 2) * dist * tanH).addScaledVector(yAxis, ((first.y0 + first.y1) / 2) * dist * tanV);
    let dHi = Math.max(dist, 1e-6);
    for (let k = 0; k < 30 && !fits(center, dHi); k++) dHi *= 1.5;
    let dLo = 0;
    for (let k = 0; k < 30; k++) {
      const midD = (dLo + dHi) / 2;
      if (fits(center, midD)) dHi = midD;
      else dLo = midD;
    }
    dist = Math.max(dHi, this.aTyp * 4);
    this.stopFly();
    this.animateTo(center, center.clone().addScaledVector(d, dist), animate ? 450 : 0);
    this.fitted = true;
  }

  view(name: ViewName) {
    this.fitAll(name === "iso" ? this.isoDir() : VIEW_DIRS[name]);
  }

  /** Oblique view from above, perpendicular to the main horizontal direction of the beamline. */
  private isoDir() {
    const pts = this.fitPoints;
    if (pts.length < 2) return VIEW_DIRS.iso.clone();
    let mx = 0;
    let mz = 0;
    for (const p of pts) {
      mx += p.x;
      mz += p.z;
    }
    mx /= pts.length;
    mz /= pts.length;
    let cxx = 0;
    let czz = 0;
    let cxz = 0;
    for (const p of pts) {
      cxx += (p.x - mx) ** 2;
      czz += (p.z - mz) ** 2;
      cxz += (p.x - mx) * (p.z - mz);
    }
    if (cxx + czz < 1e-12) return VIEW_DIRS.iso.clone();
    const angle = 0.5 * Math.atan2(2 * cxz, cxx - czz);
    const axis = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const span = pts[pts.length - 1].clone().sub(pts[0]);
    if (axis.dot(span) < 0) axis.negate();
    const normal = new THREE.Vector3(-axis.z, 0, axis.x); // horizontal, on the beam's left (world +z for a straight line)
    return normal.multiplyScalar(0.75).addScaledVector(VIEW_DIRS.top, 0.62).addScaledVector(axis, -0.55).normalize();
  }

  setFly(on: boolean) {
    if (!on) {
      this.stopFly();
      return;
    }
    const m = this.model;
    if (!m || !m.elems.length || m.total <= 0) {
      this.cb.onFlyChange(false);
      return;
    }
    if (this.flyS >= m.total - 1e-9) this.flyS = 0;
    const speed = Math.min(5, Math.max(0.1, m.total / 30));
    const now = performance.now();
    this.fly = { s: this.flyS, last: now + 450, speed, startAt: now + 450 };
    const { eye, look } = this.flyCamera(this.flyS);
    this.animateTo(look, eye, 450);
    this.cb.onFlyChange(true);
  }

  focus(line: number) {
    const info = this.infoByLine.get(line);
    if (!info) return;
    this.stopFly();
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.animateTo(info.center, info.center.clone().addScaledVector(dir, this.focusDistance(info)));
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameReq);
    cancelAnimationFrame(this.hoverReq);
    this.ro.disconnect();
    this.mo.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("dblclick", this.onDoubleClick);
    canvas.removeEventListener("keydown", this.onKeyDown);
    canvas.removeEventListener("webglcontextlost", this.onContextLost);
    canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.host.removeEventListener("wheel", this.onWheel, { capture: true });
    this.posBar?.dispose();
    this.controls.removeEventListener("change", this.invalidate);
    this.controls.removeEventListener("start", this.onControlStart);
    this.controls.dispose();
    this.clearContent();
    this.clearEnvelope();
    for (const g of Object.values(this.geoms)) g.dispose();
    this.boxEdges.dispose();
    this.dotGeom.dispose();
    this.cloudGeom.dispose();
    this.lostGeom.dispose();
    for (const m of Object.values(this.mats)) m.dispose();
    this.labels.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  /* ---------------------------------------------------------------- rendering */
  invalidate = () => {
    if (!this.frameReq && !this.disposed) this.frameReq = requestAnimationFrame(this.frame);
  };

  private frame = (now: number) => {
    this.frameReq = 0;
    if (this.lost || this.disposed) return;
    if (this.dirty.content) {
      this.dirty.content = false;
      this.buildContent();
    }
    if (this.dirty.env) {
      this.dirty.env = false;
      this.buildEnvelope();
    }
    let again = false;
    if (this.tween) again = this.stepTween(now) || again;
    if (this.fly) again = this.stepFly(now) || again;
    again = this.updateBunch(now) || again;
    if (this.controls.update()) again = true; // damping
    this.updateClipping();
    const dist = this.camera.position.distanceTo(this.controls.target);
    const lightDir = new THREE.Vector3(-0.4, 1, 0.6).applyQuaternion(this.camera.quaternion);
    this.sun.position.copy(this.controls.target).addScaledVector(lightDir, Math.max(dist, 1));
    this.sun.target.position.copy(this.controls.target);
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
    this.posBar?.update();
    if (again) this.invalidate();
  };

  private renderNow() {
    cancelAnimationFrame(this.frameReq);
    this.frameReq = 0;
    this.frame(performance.now());
  }

  private resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight - (this.bar?.offsetHeight ?? 0)); // the position bar sits below the canvas
    if (w === this.size.w && h === this.size.h) return;
    this.size = { w, h };
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderNow();
  }

  private updateClipping() {
    const dist = this.camera.position.distanceTo(this.controls.target);
    const near = this.fly ? Math.max(1e-4, this.aTyp * 0.05) : Math.max(1e-4, Math.min(dist * 0.002, this.aTyp * 0.5));
    const far = dist + this.sceneRadius * 4 + this.camera.position.distanceTo(this.bounds.isEmpty() ? this.controls.target : this.bounds.getCenter(new THREE.Vector3()));
    if (Math.abs(near - this.camera.near) > near * 0.05 || Math.abs(far - this.camera.far) > far * 0.05) {
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }
  }

  private applyColors() {
    const c = (name: string) => this.colors.get(name)!;
    this.renderer.setClearColor(c("--beamline-bg"), 1);
    this.mats.pipeCurved.color.copy(c("--el-drift"));
    this.mats.orbit.color.copy(c("--fg-soft"));
    this.mats.ruler.color.copy(c("--fg-soft"));
    this.mats.env.color.copy(c("--accent"));
    this.mats.env.emissive.copy(c("--accent")).multiplyScalar(0.25);
    this.mats.sel.color.copy(c("--accent"));
    this.mats.dot.color.copy(c("--accent"));
    this.mats.cloud.color.copy(c("--bunch"));
    this.mats.bunchDot.color.copy(c("--bunch"));
    this.mats.lost.color.copy(c("--danger"));
    this.mats.hover.color.copy(c("--fg"));
    const dark = c("--beamline-bg").getHSL({ h: 0, s: 0, l: 0 }).l < 0.3;
    this.hemi.intensity = dark ? 1.6 : 2.0;
    this.sun.intensity = dark ? 1.5 : 1.8;
  }

  /* ---------------------------------------------------------------- scene construction */
  private clearContent() {
    for (const child of [...this.content.children]) {
      this.content.remove(child);
      if (child instanceof THREE.InstancedMesh) child.dispose();
    }
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.picks = [];
    this.parts.clear();
    this.infos = [];
    this.infoByLine.clear();
    this.labelGroups.clear();
    this.ticks = [];
    this.sPts = [];
    this.posBar?.reset();
    this.hovered = null;
    this.tip.style.display = "none";
  }

  private addPart(line: number, part: Part) {
    const list = this.parts.get(line);
    if (list) list.push(part);
    else this.parts.set(line, [part]);
  }

  private buildContent() {
    const t0 = performance.now();
    this.clearContent();
    const m = this.model;
    this.bounds.makeEmpty();
    if (!m || !m.elems.length) {
      this.built = true;
      this.updateBoxes();
      return;
    }
    const ex = this.ex;
    const orbit = m.orbit;
    const col = (name: string) => this.colors.get(name) ?? this.colors.get("--el-other")!;
    const buckets = new Map<string, Bucket>();
    this.aTyp = m.medianR * ex;

    const put = (part: PartKey, ghost: boolean, line: number, color: THREE.Color, X: Vec3, Y: Vec3, Z: Vec3, p: Vec3, sx: number, sy: number, sz: number) => {
      const key = ghost ? `${part}~` : part;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mats: [], cols: [], lines: [] }));
      b.mats.push(X[0] * sx, X[1] * sx, X[2] * sx, 0, Y[0] * sy, Y[1] * sy, Y[2] * sy, 0, Z[0] * sz, Z[1] * sz, Z[2] * sz, 0, p[0], p[1], p[2], 1);
      b.cols.push(color.r, color.g, color.b);
      b.lines.push(line);
    };
    const roll = (P: Pose, angle: number): [Vec3, Vec3] => {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [P.x[0] * c + P.y[0] * s, P.x[1] * c + P.y[1] * s, P.x[2] * c + P.y[2] * s],
        [-P.x[0] * s + P.y[0] * c, -P.x[1] * s + P.y[1] * c, -P.x[2] * s + P.y[2] * c],
      ];
    };

    const north = this.colors.get("--danger")!;
    const south = this.colors.get("--accent")!;
    const pipeColor = col("--el-drift");
    const blocks = new Map<number, { s0: number; s1: number; r: number; line: number }>();

    for (const e of m.elems) {
      const a = e.r * ex * e.radial;
      const color = col(e.colorVar);
      const g = e.ghost;
      const L = e.len;
      const P = orbit.pose(L > 0 ? (e.s0 + e.s1) / 2 : e.s0);
      const info = this.makeInfo(e, P, a);
      // beam pipe
      if (L > 0 && e.shape !== "bend") {
        if (e.block != null) {
          const bl = blocks.get(e.block);
          if (!bl) blocks.set(e.block, { s0: e.s0, s1: e.s1, r: e.r, line: e.line });
          else {
            bl.s0 = Math.min(bl.s0, e.s0);
            bl.s1 = Math.max(bl.s1, e.s1);
            if (!e.ghost) {
              bl.r = e.r;
              bl.line = e.line;
            }
          }
        } else {
          put("pipe", false, e.line, pipeColor, P.x, P.y, P.z, P.p, e.r * ex, e.r * ex, L);
        }
      }
      switch (e.shape) {
        case "drift":
          break;
        case "quad": {
          for (let k = 0; k < 4; k++) {
            const [X, Y] = roll(P, Math.PI / 4 + (k * Math.PI) / 2);
            const isNorth = (k % 2 === 0) === e.sign > 0;
            const c = e.sign === 0 ? color : color.clone().lerp(isNorth ? north : south, 0.5);
            put("quadPole", g, e.line, c, X, Y, P.z, P.p, a, a, L * MAG_FILL);
          }
          put("quadYoke", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L * MAG_FILL);
          break;
        }
        case "solenoid":
          put("solenoid", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L * MAG_FILL);
          break;
        case "rf":
          put("rf", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L);
          break;
        case "efield":
          put("efield", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L * 0.9);
          break;
        case "dipole":
          put("frameDipole", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L * MAG_FILL);
          break;
        case "corrector":
          put("frameThin", g, e.line, color, P.x, P.y, P.z, P.p, a, a, L * MAG_FILL);
          break;
        case "magnet":
        case "box":
          put("frameSquare", g, e.line, color, P.x, P.y, P.z, P.p, a, a, Math.max(L * MAG_FILL, a * 0.2));
          break;
        case "steerer":
          put("hoop", g, e.line, color, P.x, P.y, P.z, P.p, a, a, a * 0.16);
          break;
        case "edge": {
          // thin dipole outline, wide in the bending plane, tilted by the pole-face angle
          const c = Math.cos(e.angle);
          const s = Math.sin(e.angle);
          const B = e.hv ? P.y : P.x; // in-plane transverse axis
          const inPlane: Vec3 = [B[0] * c - P.z[0] * s, B[1] * c - P.z[1] * s, B[2] * c - P.z[2] * s];
          const Z: Vec3 = [P.z[0] * c + B[0] * s, P.z[1] * c + B[1] * s, P.z[2] * c + B[2] * s];
          const Y: Vec3 = e.hv ? [-P.x[0], -P.x[1], -P.x[2]] : P.y;
          put("edgeHoop", g, e.line, color, inPlane, Y, Z, P.p, a, a, a * 0.14);
          break;
        }
        case "diag":
        case "marker":
          put("torus", g, e.line, color, P.x, P.y, P.z, P.p, a, a, a);
          break;
        case "bend":
          this.buildBend(e, a, color, info);
          break;
      }
    }
    for (const bl of blocks.values()) {
      const P = orbit.pose((bl.s0 + bl.s1) / 2);
      put("pipe", false, bl.line, pipeColor, P.x, P.y, P.z, P.p, bl.r * ex, bl.r * ex, bl.s1 - bl.s0);
    }

    for (const [key, b] of buckets) {
      const ghost = key.endsWith("~");
      const part = (ghost ? key.slice(0, -1) : key) as PartKey;
      const count = b.lines.length;
      const material = ghost ? this.mats.ghost : part === "pipe" ? this.mats.pipe : this.mats.solid;
      const mesh = new THREE.InstancedMesh(this.geoms[part], material, count);
      mesh.instanceMatrix.array.set(b.mats);
      const cols = new Float32Array(b.cols);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(cols, 3);
      mesh.userData = { lines: b.lines, base: cols.slice(), ghost };
      mesh.renderOrder = ghost ? 3 : part === "pipe" ? 2 : 0;
      mesh.computeBoundingSphere();
      this.content.add(mesh);
      this.picks.push(mesh);
      for (let i = 0; i < count; i++) this.addPart(b.lines[i], { mesh, index: i });
    }

    this.buildOrbitAndRuler(m);
    this.content.updateMatrixWorld(true);

    // world bounds and the points used to fit the view
    const pad = Math.max(...m.elems.map((e) => OUTER[e.shape] * e.r * ex * e.radial), this.aTyp * 4.2);
    const samples = orbit.samples(0, m.total, 0.05);
    this.fitPoints = [];
    for (let i = 0; i < samples.length; i += 4) {
      const w = toWorld([samples[i + 1], samples[i + 2], samples[i + 3]]);
      this.fitPoints.push(w);
      this.bounds.expandByPoint(w);
    }
    this.fitPad = pad;
    this.bounds.expandByScalar(pad);
    this.sceneRadius = this.bounds.getBoundingSphere(new THREE.Sphere()).radius;
    // uniform in arc length (orbit.samples only refines curved parts)
    const nBar = Math.min(1500, Math.max(100, Math.ceil(m.total / 0.005)));
    for (let i = 0; i <= nBar; i++) {
      const s = (m.total * i) / nBar;
      this.sPts.push({ s, p: toWorld(orbit.pose(s).p) });
    }
    // label groups: elements of a superpose block that lie on top of each other (not the whole block,
    // which may hold several magnets one after the other)
    const byBlock = new Map<number, Info[]>();
    for (const info of this.infos) {
      if (info.e.block == null || info.e.shape === "drift") continue;
      const list = byBlock.get(info.e.block);
      if (list) list.push(info);
      else byBlock.set(info.e.block, [info]);
    }
    const overlaps = (a: Elem, b: Elem) => {
      const shorter = Math.min(a.s1 - a.s0, b.s1 - b.s0);
      if (shorter <= 1e-9) return Math.max(a.s0, b.s0) <= Math.min(a.s1, b.s1) + 1e-9;
      return Math.min(a.s1, b.s1) - Math.max(a.s0, b.s0) > 0.5 * shorter;
    };
    for (const list of byBlock.values()) {
      const clusters: Info[][] = [];
      for (const info of [...list].sort((a, b) => a.e.s0 - b.e.s0 || a.e.line - b.e.line)) {
        const home = clusters.find((c) => c.some((o) => overlaps(o.e, info.e)));
        if (home) home.push(info);
        else clusters.push([info]);
      }
      for (const c of clusters) {
        if (c.length < 2) continue;
        c.sort((a, b) => a.e.line - b.e.line);
        for (const info of c) this.labelGroups.set(info, c);
      }
    }

    this.built = true;
    if (!this.fitted || Math.abs(m.total - this.fittedTotal) > 0.25 * Math.max(this.fittedTotal, 1e-6)) {
      this.fittedTotal = m.total;
      this.fitAll(this.fitted ? undefined : this.isoDir(), false);
    }
    this.updateBoxes();
    this.buildMs = performance.now() - t0;
    this.host.dataset.buildMs = this.buildMs.toFixed(1);
  }

  private makeInfo(e: Elem, P: Pose, a: number): Info {
    const outer = OUTER[e.shape] * a;
    const len = e.len > 0 ? e.len : a * 0.3;
    const info: Info = {
      e,
      center: toWorld(P.p),
      anchor: toWorld([P.p[0] + P.y[0] * outer * 1.05, P.p[1] + P.y[1] * outer * 1.05, P.p[2] + P.y[2] * outer * 1.05]),
      X: toWorld(P.x),
      Y: toWorld(P.y),
      Z: toWorld(P.z),
      size: new THREE.Vector3(outer * 2.16, outer * 2.16, len * 1.04),
      radius: Math.hypot(len / 2, outer),
      outer,
    };
    this.infos.push(info);
    this.infoByLine.set(e.line, info);
    return info;
  }

  private buildBend(e: Elem, a: number, color: THREE.Color, info: Info) {
    const orbit = this.model!.orbit;
    const n = Math.max(3, Math.ceil(Math.abs(e.angle) / THREE.MathUtils.degToRad(3)));
    const poses: Pose[] = [];
    for (let i = 0; i <= n; i++) poses.push(orbit.pose(e.s0 + (e.len * i) / n));
    const [w, h, hw, hh] = e.hv ? [2.6, 3.4, 1.25, 1.9] : [3.4, 2.6, 1.9, 1.25];
    const yokeGeom = sweepGeometry([loopRect(w, h, false), loopRect(hw, hh, true)], poses, a, true);
    const material = this.mats.solid.clone();
    material.color.copy(color);
    const yoke = new THREE.Mesh(yokeGeom, material);
    yoke.userData = { line: e.line, base: color.clone() };
    const circle: Loop = { pts: Array.from({ length: 32 }, (_, k) => [Math.cos((2 * Math.PI * k) / 32), Math.sin((2 * Math.PI * k) / 32)] as [number, number]), smooth: true };
    const pipeGeom = sweepGeometry([circle], poses, e.r * this.ex, false);
    const pipe = new THREE.Mesh(pipeGeom, this.mats.pipeCurved);
    pipe.userData = { line: e.line };
    pipe.renderOrder = 2;
    this.content.add(yoke, pipe);
    this.picks.push(yoke, pipe);
    this.disposables.push(yokeGeom, material, pipeGeom);
    this.addPart(e.line, { mesh: yoke, index: -1 });

    // selection box around the arc: chord-aligned
    const p0 = toWorld(poses[0].p);
    const p1 = toWorld(poses[n].p);
    const mid = info.center.clone();
    const chordMid = p0.clone().add(p1).multiplyScalar(0.5);
    const chord = p1.clone().sub(p0);
    const chordLen = chord.length();
    const sagitta = mid.distanceTo(chordMid);
    info.Z = chord.normalize();
    const bendAxis = e.hv ? info.Y : info.X; // in-plane transverse axis at the arc middle
    const other = e.hv ? info.X : info.Y;
    const inPlane = bendAxis.clone().addScaledVector(info.Z, -bendAxis.dot(info.Z)).normalize();
    if (e.hv) {
      info.Y = inPlane;
      info.X = other;
    } else {
      info.X = inPlane;
      info.Y = other;
    }
    info.center = mid.clone().add(chordMid).multiplyScalar(0.5);
    const outer = info.outer;
    const across = outer * 2.16 + sagitta;
    info.size = e.hv ? new THREE.Vector3(outer * 2.16, across, chordLen + outer * 2 * Math.sin(Math.abs(e.angle) / 2)) : new THREE.Vector3(across, outer * 2.16, chordLen + outer * 2 * Math.sin(Math.abs(e.angle) / 2));
    info.radius = Math.hypot(chordLen / 2, outer + sagitta);
  }

  private buildOrbitAndRuler(m: Model) {
    const samples = m.orbit.samples(0, m.total, 0.02);
    const pts: number[] = [];
    for (let i = 0; i < samples.length; i += 4) pts.push(samples[i + 1], samples[i + 2], samples[i + 3]);
    const orbitGeom = new THREE.BufferGeometry();
    orbitGeom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const orbitLine = new THREE.Line(orbitGeom, this.mats.orbit);
    this.content.add(orbitLine);
    this.disposables.push(orbitGeom);

    if (m.total <= 0) return;
    // ruler below the beamline, offset diagonally so that it is visible from the side and from the top
    const d = this.aTyp * 4.2;
    const tick = this.aTyp * 0.9;
    const off = (P: Pose, k: number): Vec3 => {
      const f = -k * Math.SQRT1_2;
      return [P.p[0] + (P.x[0] + P.y[0]) * f, P.p[1] + (P.x[1] + P.y[1]) * f, P.p[2] + (P.x[2] + P.y[2]) * f];
    };
    const seg: number[] = [];
    let prev: Vec3 | null = null;
    for (let i = 0; i < samples.length; i += 4) {
      const q = off(m.orbit.pose(samples[i]), d);
      if (prev) seg.push(...prev, ...q);
      prev = q;
    }
    let step = niceStep(m.total / 12);
    while (m.total / step > 400) step *= 2;
    for (let k = 0; k * step <= m.total + step * 1e-6; k++) {
      const s = k * step;
      const P = m.orbit.pose(s);
      const q0 = off(P, d);
      const q1 = off(P, d + tick);
      seg.push(...q0, ...q1);
      this.ticks.push({ pos: toWorld(off(P, d + tick * 1.6)), text: `${Number(s.toPrecision(6))} m` });
    }
    const rulerGeom = new THREE.BufferGeometry();
    rulerGeom.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    this.content.add(new THREE.LineSegments(rulerGeom, this.mats.ruler));
    this.disposables.push(rulerGeom);
  }

  private clearEnvelope() {
    if (!this.envMesh) return;
    this.root.remove(this.envMesh);
    this.envMesh.geometry.dispose();
    this.envMesh = null;
  }

  private buildEnvelope() {
    this.clearEnvelope();
    const m = this.model;
    const env = this.envelope;
    if (!m || !env || !this.envOn) return;
    if (!this.envCache || this.envCache.src !== env) this.envCache = { src: env, data: downsampleEnvelope(env.z, env.x, env.y, ENV_RINGS) };
    const d = this.envCache.data;
    if (d.n < 2) return;
    const seg = ENV_SEGMENTS;
    const k = this.envScale * 1e-3 * this.ex;
    const pos = new Float32Array(d.n * seg * 3);
    const cos = Array.from({ length: seg }, (_, j) => Math.cos((2 * Math.PI * j) / seg));
    const sin = Array.from({ length: seg }, (_, j) => Math.sin((2 * Math.PI * j) / seg));
    let o = 0;
    for (let i = 0; i < d.n; i++) {
      const P = m.orbit.pose(d.s[i]);
      const rx = Math.max(d.x[i] * k, 1e-6);
      const ry = Math.max(d.y[i] * k, 1e-6);
      for (let j = 0; j < seg; j++) {
        const u = rx * cos[j];
        const v = ry * sin[j];
        pos[o++] = P.p[0] + P.x[0] * u + P.y[0] * v;
        pos[o++] = P.p[1] + P.x[1] * u + P.y[1] * v;
        pos[o++] = P.p[2] + P.x[2] * u + P.y[2] * v;
      }
    }
    const idx = new Uint32Array((d.n - 1) * seg * 6);
    o = 0;
    for (let i = 0; i < d.n - 1; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * seg + j;
        const b = i * seg + ((j + 1) % seg);
        idx[o++] = a;
        idx[o++] = b;
        idx[o++] = b + seg;
        idx[o++] = a;
        idx[o++] = b + seg;
        idx[o++] = a + seg;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    this.envMesh = new THREE.Mesh(g, this.mats.env);
    this.envMesh.renderOrder = 1;
    this.root.add(this.envMesh);
  }

  /* ---------------------------------------------------------------- highlight / labels */
  private placeBox(box: THREE.LineSegments, line: number | null) {
    const info = line == null ? undefined : this.infoByLine.get(line);
    box.visible = !!info;
    if (!info) return;
    const { X, Y, Z, size, center } = info;
    box.matrix.makeBasis(X.clone().multiplyScalar(size.x), Y.clone().multiplyScalar(size.y), Z.clone().multiplyScalar(size.z));
    box.matrix.setPosition(center);
    box.matrixWorldNeedsUpdate = true;
  }

  private updateBoxes() {
    this.placeBox(this.selBox, this.selected);
    this.placeBox(this.hoverBox, this.hovered !== this.selected ? this.hovered : null);
  }

  private tint(line: number, on: boolean) {
    const accent = this.colors.get("--accent")!;
    for (const { mesh, index } of this.parts.get(line) ?? []) {
      if (index >= 0 && mesh instanceof THREE.InstancedMesh && mesh.instanceColor) {
        const arr = mesh.instanceColor.array as Float32Array;
        const base = mesh.userData.base as Float32Array;
        const i3 = index * 3;
        const acc = [accent.r, accent.g, accent.b];
        for (let c = 0; c < 3; c++) arr[i3 + c] = on ? base[i3 + c] * 0.55 + acc[c] * 0.45 : base[i3 + c];
        mesh.instanceColor.needsUpdate = true;
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const base = mesh.userData.base as THREE.Color;
        mat.color.copy(base);
        if (on) mat.color.lerp(accent, 0.45);
      }
    }
  }

  private setHover(line: number | null, clientX = 0, clientY = 0) {
    if (line !== this.hovered) {
      if (this.hovered != null) this.tint(this.hovered, false);
      this.hovered = line;
      if (line != null) this.tint(line, true);
      this.updateBoxes();
      this.invalidate();
      const info = line == null ? undefined : this.infoByLine.get(line);
      this.tip.textContent = info ? tooltipText(info.e) : "";
      this.renderer.domElement.style.cursor = info ? "pointer" : "";
    }
    if (line == null) {
      this.tip.style.display = "none";
      return;
    }
    const r = this.host.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    this.tip.style.display = "block";
    const tw = this.tip.offsetWidth;
    const th = this.tip.offsetHeight;
    const left = x + 14 + tw > this.size.w - 4 ? Math.max(4, x - 14 - tw) : x + 14;
    const top = y + 16 + th > this.size.h - 4 ? Math.max(4, y - 10 - th) : y + 16;
    this.tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  private updateLabels() {
    this.labels.update({
      camera: this.camera,
      W: this.size.w,
      H: this.size.h,
      infos: this.infos,
      groups: this.labelGroups,
      sel: this.selected == null ? undefined : this.infoByLine.get(this.selected),
      labelsOn: this.labelsOn,
      ticks: this.ticks,
    });
  }

  /* ---------------------------------------------------------------- camera animation */
  private focusDistance(info: Info) {
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return Math.max((info.radius * 2.2) / tanV, this.aTyp * 8);
  }

  private animateTo(target: THREE.Vector3, position: THREE.Vector3, ms = 450) {
    const t0 = this.controls.target.clone();
    const o0 = this.camera.position.clone().sub(t0);
    const o1 = position.clone().sub(target);
    if (ms <= 0 || o0.lengthSq() === 0) {
      this.tween = null;
      this.controls.target.copy(target);
      this.camera.position.copy(position);
      this.controls.update();
      this.invalidate();
      return;
    }
    this.tween = { start: performance.now(), ms, t0, t1: target.clone(), o0, o1 };
    this.invalidate();
  }

  private stepTween(now: number) {
    const tw = this.tween!;
    const k = Math.min(1, Math.max(0, (now - tw.start) / tw.ms));
    const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
    this.controls.target.lerpVectors(tw.t0, tw.t1, e);
    const l0 = tw.o0.length();
    const l1 = tw.o1.length();
    const d0 = tw.o0.clone().divideScalar(l0);
    const d1 = tw.o1.clone().divideScalar(l1);
    const q = new THREE.Quaternion().setFromUnitVectors(d0, d1);
    const qe = new THREE.Quaternion().slerp(q, e);
    const len = Math.exp(Math.log(l0) + (Math.log(l1) - Math.log(l0)) * e);
    this.camera.position.copy(this.controls.target).addScaledVector(d0.applyQuaternion(qe), len);
    if (k >= 1) this.tween = null;
    return k < 1;
  }

  private flyCamera(s: number) {
    const m = this.model!;
    const a = this.aTyp;
    // chase camera: above and behind the reference particle, looking a little ahead of it
    const P = m.orbit.pose(s - a * 14);
    const Q = m.orbit.pose(s + a * 10);
    const up = a * 7.5;
    const eye = toWorld([P.p[0] + P.y[0] * up, P.p[1] + P.y[1] * up, P.p[2] + P.y[2] * up]);
    const look = toWorld(Q.p);
    return { eye, look };
  }

  private stepFly(now: number) {
    const f = this.fly!;
    const m = this.model;
    if (!m) {
      this.stopFly();
      return false;
    }
    if (now < f.startAt) return true;
    const dt = Math.min(0.1, Math.max(0, (now - f.last) / 1000));
    f.last = now;
    f.s = Math.min(m.total, f.s + f.speed * dt);
    this.flyS = f.s;
    this.beamDot.position.copy(toWorld(m.orbit.pose(f.s).p));
    this.beamDot.scale.setScalar(this.aTyp * 0.35);
    this.beamDot.visible = true;
    const { eye, look } = this.flyCamera(f.s);
    this.tween = null;
    this.camera.position.copy(eye);
    this.controls.target.copy(look);
    if (f.s >= m.total) {
      this.flyS = 0;
      this.fly = null;
      this.beamDot.visible = false;
      this.cb.onFlyChange(false);
      return false;
    }
    return true;
  }

  /** Place the bunch at its arc length; returns whether a loss animation still runs. */
  private updateBunch(now: number): boolean {
    const f = this.bunch;
    const m = this.model;
    this.cloud.visible = false;
    this.lostCloud.visible = false;
    this.bunchDot.visible = false;
    if (!f || !m || m.total <= 0 || !Number.isFinite(f.z)) return false;
    const s = Math.max(0, Math.min(m.total, f.z));
    const P = m.orbit.pose(s);
    const k = 1e-3 * this.ex; // rms in mm, exaggerated like the envelope tube (1σ here, the tube shows several)
    const sx = Number.isFinite(f.rmsX) && f.rmsX > 0 ? f.rmsX * k : this.aTyp * 0.3;
    const sy = Number.isFinite(f.rmsY) && f.rmsY > 0 ? f.rmsY * k : this.aTyp * 0.3;
    const sz = Math.max(Number.isFinite(f.rmsZ) ? f.rmsZ * k : 0, 0.5 * Math.max(sx, sy)); // same exaggeration as the transverse sizes
    const place = (geom: THREE.BufferGeometry, i0: number, i1: number, spread: number) => {
      const attr = geom.getAttribute("position") as THREE.BufferAttribute;
      const pos = attr.array as Float32Array;
      let o = 0;
      for (let i = i0; i < i1; i++) {
        const g = CLOUD[i];
        const u = g[0] * sx * spread;
        const v = g[1] * sy * spread;
        const w = g[2] * sz;
        pos[o++] = P.p[0] + P.x[0] * u + P.y[0] * v + P.z[0] * w;
        pos[o++] = P.p[1] + P.x[1] * u + P.y[1] * v + P.z[1] * w;
        pos[o++] = P.p[2] + P.x[2] * u + P.y[2] * v + P.z[2] * w;
      }
      attr.needsUpdate = true;
      geom.setDrawRange(0, i1 - i0);
    };
    let again = false;
    if (this.bunchMode === "full") {
      const n = Math.round(CLOUD_N * this.keptFrac);
      place(this.cloudGeom, 0, n, 1);
      this.cloud.visible = n > 0;
      const a = this.lossAnim;
      if (a) {
        const age = now - a.at;
        if (age >= LOSS_MS) this.lossAnim = null;
        else {
          const i0 = Math.round(CLOUD_N * a.from);
          const i1 = Math.max(i0 + 1, Math.round(CLOUD_N * a.to));
          place(this.lostGeom, i0, Math.min(CLOUD_N, i1), 1 + (2.5 * age) / LOSS_MS);
          this.mats.lost.opacity = 1 - age / LOSS_MS;
          this.lostCloud.visible = true;
          again = true;
        }
      }
    } else {
      this.bunchDot.position.copy(toWorld(P.p));
      this.bunchDot.scale.setScalar(Math.max(sx, sy, this.aTyp * 0.25));
      this.bunchDot.visible = true;
    }
    if (this.followBunch && !this.fly) {
      const { eye, look } = this.flyCamera(s);
      this.tween = null;
      this.camera.position.copy(eye);
      this.controls.target.copy(look);
    }
    return again;
  }

  private stopFly() {
    this.beamDot.visible = false;
    if (!this.fly) return;
    this.fly = null;
    this.invalidate();
    this.cb.onFlyChange(false);
  }

  /* ---------------------------------------------------------------- input */
  private onControlStart = () => {
    this.tween = null;
    this.stopFly();
    if (this.followBunch) this.setFollow(false);
  };

  private pick(clientX: number, clientY: number): { line: number; block: number | null; ghost: boolean }[] {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.picks, false);
    const out: { line: number; block: number | null; ghost: boolean }[] = [];
    const seen = new Set<number>();
    for (const h of hits) {
      const ud = h.object.userData;
      const line: number | undefined = h.instanceId != null && ud.lines ? ud.lines[h.instanceId] : ud.line;
      if (line == null || seen.has(line)) continue;
      seen.add(line);
      const e = this.model?.byLine.get(line);
      out.push({ line, block: e?.block ?? null, ghost: !!e?.ghost });
    }
    // a translucent outer magnet in front of the solid element of the same superpose block: prefer the solid one
    if (out.length > 1 && out[0].ghost && out[0].block != null) {
      const j = out.findIndex((h) => !h.ghost && h.block === out[0].block);
      if (j > 0) out.unshift(...out.splice(j, 1));
    }
    return out;
  }

  private onPointerDown = (ev: PointerEvent) => {
    this.down = { x: ev.clientX, y: ev.clientY, button: ev.button };
    this.renderer.domElement.focus({ preventScroll: true });
    this.setHover(null);
    this.labels.setHot(null);
  };

  private onPointerMove = (ev: PointerEvent) => {
    this.pointer = { x: ev.clientX, y: ev.clientY, inside: true };
    if (ev.buttons !== 0) {
      this.setHover(null);
      this.labels.setHot(null);
      return;
    }
    if (!this.hoverReq)
      this.hoverReq = requestAnimationFrame(() => {
        this.hoverReq = 0;
        if (!this.pointer.inside || this.disposed || this.tween) return;
        const label = this.labels.at(this.pointer.x, this.pointer.y);
        this.labels.setHot(label?.el ?? null);
        if (label) {
          this.setHover(label.line, this.pointer.x, this.pointer.y);
          return;
        }
        const hits = this.pick(this.pointer.x, this.pointer.y);
        this.setHover(hits.length ? hits[0].line : null, this.pointer.x, this.pointer.y);
      });
  };

  private onPointerUp = (ev: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (!d || d.button !== 0 || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 4) return;
    const now = performance.now();
    const second = now - this.lastUp.time < 450 && Math.hypot(ev.clientX - this.lastUp.x, ev.clientY - this.lastUp.y) < 6;
    this.lastUp = { time: second ? -1e9 : now, x: ev.clientX, y: ev.clientY };
    if (second) return; // second click of a double-click: keep the selection, dblclick focuses it
    const label = this.labels.at(ev.clientX, ev.clientY);
    if (label) {
      this.lastClick = { line: label.line, time: now };
      this.cb.onSelect(label.line);
      return;
    }
    const hits = this.pick(ev.clientX, ev.clientY);
    if (!hits.length) return;
    let line = hits[0].line;
    // repeated (slow) clicks cycle through the overlapping elements of a superpose block
    if (hits[0].block != null && hits.some((h) => h.line === this.selected)) {
      const group = hits.filter((h) => h.block === hits[0].block);
      const j = group.findIndex((h) => h.line === this.selected);
      if (j >= 0) line = group[(j + 1) % group.length].line;
    }
    this.lastClick = { line, time: now };
    this.cb.onSelect(line);
  };

  private onPointerLeave = () => {
    this.pointer.inside = false;
    this.setHover(null);
    this.labels.setHot(null);
  };

  private onDoubleClick = (ev: MouseEvent) => {
    const label = this.labels.at(ev.clientX, ev.clientY);
    if (label) {
      this.focus(label.line);
      return;
    }
    const hits = this.pick(ev.clientX, ev.clientY);
    const line = hits.find((h) => h.line === this.selected)?.line ?? hits[0]?.line;
    if (line != null) this.focus(line);
    else this.fitAll();
  };

  private onKeyDown = (ev: KeyboardEvent) => {
    const m = this.model;
    if (!m || m.total <= 0 || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    let s: number | null = null;
    const range = this.visibleRange();
    const span = range ? Math.max(range[1] - range[0], m.total * 0.002) : m.total / 20;
    const step = span * (ev.shiftKey ? 0.8 : 0.2);
    // while the previous step is still animating, continue from where it goes (held keys)
    const from = this.tween && this.keyS != null ? this.keyS : this.targetS();
    if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") s = from + (ev.key === "ArrowRight" ? step : -step);
    else if (ev.key === "Home") s = 0;
    else if (ev.key === "End") s = m.total;
    if (s == null) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.keyS = Math.min(Math.max(s, 0), m.total);
    this.moveToS(this.keyS, 160);
  };

  /** Mouse wheel or touchpad swipe?  Two-finger swipes pan; the wheel and pinches (ctrl + wheel) zoom. */
  private wheelKind(ev: WheelEvent): "mouse" | "touchpad" {
    if (this.device !== "auto") return this.device;
    const now = performance.now();
    if (this.lastWheel && now - this.lastWheel.time < 300) {
      this.lastWheel.time = now; // one gesture keeps its kind
      return this.lastWheel.kind;
    }
    // wheel notches come in multiples of 120 (wheelDelta) without horizontal part; touchpads send small, uneven steps
    const legacy = (ev as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
    let kind: "mouse" | "touchpad" = "touchpad";
    if (ev.deltaMode !== 0) kind = "mouse";
    else if (ev.deltaX === 0 && legacy != null && legacy !== 0 && Math.abs(legacy) % 120 === 0) kind = "mouse";
    this.lastWheel = { kind, time: now };
    return kind;
  }

  private onWheel = (ev: WheelEvent) => {
    if (ev.target !== this.renderer.domElement || ev.ctrlKey || !this.model) return;
    if (this.wheelKind(ev) !== "touchpad") return; // OrbitControls zooms
    ev.preventDefault();
    ev.stopPropagation();
    this.tween = null;
    this.stopFly();
    this.setHover(null);
    const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? this.size.h : 1;
    this.panByDrag(-ev.deltaX * unit, -ev.deltaY * unit);
  };

  /** Pan as if the scene were dragged by (dx, dy) pixels. */
  private panByDrag(dx: number, dy: number) {
    const dist = this.camera.position.distanceTo(this.controls.target);
    const perPixel = (2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / Math.max(1, this.size.h);
    this.camera.updateMatrix();
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    const offset = right.multiplyScalar(-dx * perPixel).addScaledVector(up, dy * perPixel);
    this.camera.position.add(offset);
    this.controls.target.add(offset);
    this.invalidate();
  }

  private onContextLost = (ev: Event) => {
    ev.preventDefault();
    this.lost = true;
    this.stopFly();
    this.cb.onContextLost(true);
  };

  private onContextRestored = () => {
    // three.js re-creates its GL state and re-uploads buffers on the next render
    this.lost = false;
    this.applyColors();
    this.cb.onContextLost(false);
    this.invalidate();
  };
}
