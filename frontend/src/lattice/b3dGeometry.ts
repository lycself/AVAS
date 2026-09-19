// Pure geometry for the 3D beamline view (Beamline3D.tsx): unit meshes of the
// element parts, sweeps along the orbit, the schematic particle cloud and the
// beam -> world coordinate mapping.  No React, no DOM.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OUTER, type Elem, type Pose, type Vec3 } from "./beamline3dModel";

export const FOV = 35;

// Schematic particle cloud: fixed normal samples, ordered by a "survival" threshold so that
// drawing the first alive/initial of them leaves out the lost share of macro-particles.
export const CLOUD_N = 1200;
export const CLOUD = (() => {
  let seed = 987654;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
  const pts = Array.from({ length: CLOUD_N }, () => ({ g: [normal(), normal(), normal()] as Vec3, keep: rnd() }));
  pts.sort((a, b) => a.keep - b.keep);
  return pts.map((p) => p.g);
})();

/** Beam coordinates (x, y, z) -> world (z, y, -x): the beam runs along world +X with y up. */
export function toWorld(v: Vec3, out = new THREE.Vector3()) {
  return out.set(v[2], v[1], -v[0]);
}

/** Placement of one element in world coordinates (its box, label anchor and picking radius). */
export type Info = {
  e: Elem;
  center: THREE.Vector3;
  anchor: THREE.Vector3;
  X: THREE.Vector3;
  Y: THREE.Vector3;
  Z: THREE.Vector3;
  size: THREE.Vector3; // full box size along X, Y, Z
  radius: number;
  outer: number;
};

export type PartKey =
  | "pipe"
  | "quadPole"
  | "quadYoke"
  | "solenoid"
  | "rf"
  | "efield"
  | "frameDipole"
  | "frameSquare"
  | "frameThin"
  | "hoop"
  | "edgeHoop"
  | "torus";

const v2 = (x: number, y: number) => new THREE.Vector2(x, y);
const rect = (w: number, h: number) => [v2(-w, -h), v2(w, -h), v2(w, h), v2(-w, h)];
const polygon = (r: number, n: number, phase: number) => Array.from({ length: n }, (_, k) => v2(r * Math.cos(phase + (2 * Math.PI * k) / n), r * Math.sin(phase + (2 * Math.PI * k) / n)));

function extrudeRing(outer: THREE.Vector2[], hole: THREE.Vector2[]) {
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(hole));
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -0.5);
  return g;
}

/** Unit geometries: transverse sizes in units of the aperture, length 1 along z, centred. */
export function makeGeometries(): Record<PartKey, THREE.BufferGeometry> {
  const pipe = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).rotateX(Math.PI / 2);

  const pole = new THREE.Shape();
  pole.moveTo(1.1, -0.36);
  pole.lineTo(2.4, -0.68);
  pole.lineTo(2.4, 0.68);
  pole.lineTo(1.1, 0.36);
  pole.quadraticCurveTo(0.93, 0, 1.1, -0.36);
  const quadPole = new THREE.ExtrudeGeometry(pole, { depth: 1, bevelEnabled: false, curveSegments: 6 });
  quadPole.translate(0, 0, -0.5);

  const c8 = Math.cos(Math.PI / 8);
  const quadYoke = extrudeRing(polygon(2.8 / c8, 8, Math.PI / 8), polygon(2.3 / c8, 8, Math.PI / 8));

  // solenoid: ribbed coil (duplicated corner points give sharp edges)
  const ri = 1.3;
  const ro = 1.95;
  const ribs = 8;
  const sol: THREE.Vector2[] = [v2(ri, -0.5), v2(ro, -0.5)];
  for (let i = 0; i <= ribs * 6; i++) {
    const h = -0.5 + i / (ribs * 6);
    sol.push(v2(ro + 0.16 * (0.5 - 0.5 * Math.cos(2 * Math.PI * ribs * (h + 0.5))), h));
  }
  sol.push(v2(ro, 0.5), v2(ri, 0.5), v2(ri, 0.5), v2(ri, -0.5), v2(ri, -0.5));
  const solenoid = new THREE.LatheGeometry(sol, 36).rotateX(Math.PI / 2);

  // RF cavity: capsule with beam ports
  const R = OUTER.rf;
  const f = 0.3;
  const e = 0.5 - f;
  const cav: THREE.Vector2[] = [];
  for (let i = 0; i <= 9; i++) {
    const th = (Math.PI / 2) * (1 - i / 9);
    cav.push(v2(1 + (R - 1) * Math.cos(th), -(e + f * Math.sin(th))));
  }
  for (let i = 0; i <= 9; i++) {
    const th = (Math.PI / 2) * (i / 9);
    cav.push(v2(1 + (R - 1) * Math.cos(th), e + f * Math.sin(th)));
  }
  const rf = new THREE.LatheGeometry(cav, 36).rotateX(Math.PI / 2);

  const top = new THREE.BoxGeometry(2.6, 0.22, 1).translate(0, 1.55, 0);
  const bottom = new THREE.BoxGeometry(2.6, 0.22, 1).translate(0, -1.55, 0);
  const efield = mergeGeometries([top, bottom])!;
  top.dispose();
  bottom.dispose();

  return {
    pipe,
    quadPole,
    quadYoke,
    solenoid,
    rf,
    efield,
    frameDipole: extrudeRing(rect(3.4, 2.6), rect(1.9, 1.25)),
    frameSquare: extrudeRing(rect(2.5, 2.5), rect(1.35, 1.35)),
    frameThin: extrudeRing(rect(2.4, 2.4), rect(1.75, 1.75)),
    hoop: extrudeRing(rect(3.3, 3.3), rect(2.95, 2.95)),
    edgeHoop: extrudeRing(rect(3.4, 2.6), rect(3.0, 2.2)),
    torus: new THREE.TorusGeometry(1.55, 0.14, 8, 32),
  };
}

export function edgesOfUnitBox() {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
  return edges;
}

export type Loop = { pts: [number, number][]; smooth?: boolean };

/** Sweep closed cross-section loops (outer first, holes after) along orbit poses. */
export function sweepGeometry(loops: Loop[], poses: Pose[], scale: number, caps: boolean) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const vertex = (P: Pose, u: number, v: number, nu: number, nv: number) => {
    const x = u * scale;
    const y = v * scale;
    pos.push(P.p[0] + P.x[0] * x + P.y[0] * y, P.p[1] + P.x[1] * x + P.y[1] * y, P.p[2] + P.x[2] * x + P.y[2] * y);
    nor.push(P.x[0] * nu + P.y[0] * nv, P.x[1] * nu + P.y[1] * nv, P.x[2] * nu + P.y[2] * nv);
  };
  const nf = poses.length;
  for (const loop of loops) {
    const m = loop.pts.length;
    for (let i = 0; i < m; i++) {
      const [u0, v0] = loop.pts[i];
      const [u1, v1] = loop.pts[(i + 1) % m];
      let n0: [number, number];
      let n1: [number, number];
      if (loop.smooth) {
        const l0 = Math.hypot(u0, v0) || 1;
        const l1 = Math.hypot(u1, v1) || 1;
        n0 = [u0 / l0, v0 / l0];
        n1 = [u1 / l1, v1 / l1];
      } else {
        const l = Math.hypot(u1 - u0, v1 - v0) || 1;
        n0 = n1 = [(v1 - v0) / l, -(u1 - u0) / l];
      }
      const base = pos.length / 3;
      for (const P of poses) {
        vertex(P, u0, v0, n0[0], n0[1]);
        vertex(P, u1, v1, n1[0], n1[1]);
      }
      for (let k = 0; k < nf - 1; k++) {
        const a = base + 2 * k;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
  }
  if (caps) {
    const contour = loops[0].pts.map(([u, v]) => v2(u, v));
    const holes = loops.slice(1).map((l) => l.pts.map(([u, v]) => v2(u, v)));
    const flat = [...loops[0].pts, ...loops.slice(1).flatMap((l) => l.pts)];
    const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    for (const end of [false, true]) {
      const P = poses[end ? nf - 1 : 0];
      const s = end ? 1 : -1;
      const base = pos.length / 3;
      for (const [u, v] of flat) {
        const x = u * scale;
        const y = v * scale;
        pos.push(P.p[0] + P.x[0] * x + P.y[0] * y, P.p[1] + P.x[1] * x + P.y[1] * y, P.p[2] + P.x[2] * x + P.y[2] * y);
        nor.push(P.z[0] * s, P.z[1] * s, P.z[2] * s);
      }
      for (const [a, b, c] of faces) {
        const [ua, va] = flat[a];
        const [ub, vb] = flat[b];
        const [uc, vc] = flat[c];
        const ccw = (ub - ua) * (vc - va) - (uc - ua) * (vb - va) > 0;
        // front face must be counter-clockwise seen from +z (end cap) or -z (start cap)
        if (ccw === end) idx.push(base + a, base + b, base + c);
        else idx.push(base + a, base + c, base + b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export const loopRect = (w: number, h: number, hole: boolean): Loop => ({
  pts: hole
    ? [
        [-w, -h],
        [-w, h],
        [w, h],
        [w, -h],
      ]
    : [
        [-w, -h],
        [w, -h],
        [w, h],
        [-w, h],
      ],
});
