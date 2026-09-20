// 3D view of the active beamline (three.js).  Load it lazily:
//   const Beamline3D = lazy(() => import("./Beamline3D"));
// so three.js stays out of the main bundle.  Rendering is on demand: a frame is
// drawn only when the camera, the data, the theme or the selection changes, or
// while an animation (camera move, fly-through, damping) runs.
//
// Navigation: left-drag rotates (pans in pan mode), right- and middle-drag pan,
// the wheel zooms.  On a touchpad a two-finger swipe pans and a pinch zooms
// (three-finger gestures belong to Windows); whether wheel events come from a
// mouse or a touchpad is detected, or set in the help menu.  Arrow keys and the
// position bar under the view move along the beamline.  Labels are clickable;
// the elements of one superpose block share one label with a part per element.
//
// This file is the React wrapper (toolbar, help menu, messages).  The three.js
// viewer is in b3dViewer.ts, its HTML labels and position bar in b3dHud.ts and
// the unit geometries in b3dGeometry.ts.
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { openMenuBelow, type MenuItem } from "../components/overlays";
import { Checkbox, Icon, IconButton, cx } from "../components/ui";
import { useT } from "../i18n";
import { persist, useApp } from "../store/app";
import "../styles/beamline3d.css";
import { ViewNavigation } from "./ViewNavigation";
import { Viewer, type Envelope3D, type PointerDevice } from "./b3dViewer";
import { autoExaggeration, buildModel, roundNice, structureKey } from "./beamline3dModel";
import { subscribeBunch, useMotion, type BunchFrame } from "./bunchPlayer";
import type { LatticeDoc } from "./types";

export type { Envelope3D, PointerDevice } from "./b3dViewer";
export type Beamline3DProps = {
  doc: LatticeDoc;
  selected: number | null; // statement line number
  onSelect: (line: number) => void;
  envelope?: Envelope3D; // optional beam envelope to show as a tube
  theme: "light" | "dark";
  className?: string;
  /** show the schematic bunch of these run kinds (replays always, a live run while it runs) */
  bunchKinds?: BunchFrame["kind"][];
};

const EX_MIN = 1;
const EX_MAX = 500;

/* ================================================================== React component */
const exToSlider = (ex: number) => Math.round((1000 * Math.log(ex / EX_MIN)) / Math.log(EX_MAX / EX_MIN));
const sliderToEx = (v: number) => roundNice(EX_MIN * Math.exp((v / 1000) * Math.log(EX_MAX / EX_MIN)));

export default function Beamline3D({ doc, selected, onSelect, envelope, theme, className, bunchKinds }: Beamline3DProps): JSX.Element {
  const tr = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const [panMode, setPanMode] = useState(false);
  const device = useApp((s) => (["auto", "mouse", "touchpad"].includes(s.settings["ui/b3dPointer"]) ? s.settings["ui/b3dPointer"] : "auto") as PointerDevice);
  const viewerRef = useRef<Viewer | null>(null);
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  const [lost, setLost] = useState(false);
  const [exUser, setExUser] = useState<number | null>(null);
  const [showEnv, setShowEnv] = useState(true);
  const [envScale, setEnvScale] = useState(3);
  const [labels, setLabels] = useState(true);
  const [flying, setFlying] = useState(false);
  const [following, setFollowing] = useState(false);
  const [hasBunch, setHasBunch] = useState(false);
  const motion = useMotion();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // the schematic bunch of a live run (while it runs) or of a replay
  const kindsKey = (bunchKinds ?? []).join(",");
  useEffect(() => {
    if (!kindsKey) {
      viewerRef.current?.setBunch(null, motion);
      setHasBunch(false);
      return;
    }
    const kinds = kindsKey.split(",");
    let shown = false;
    const unsub = subscribeBunch(
      (f) => {
        const ok = !!f && kinds.includes(f.kind) && (f.source === "replay" || f.running);
        viewerRef.current?.setBunch(ok ? f : null, motion);
        if (ok !== shown) {
          shown = ok;
          setHasBunch(ok);
        }
      },
      () => !!hostRef.current && hostRef.current.offsetParent !== null,
    );
    return () => {
      unsub();
      viewerRef.current?.setBunch(null, motion);
    };
  }, [kindsKey, motion]);

  // every re-parse gives a new doc object; the scene is rebuilt only when the geometry changed
  const structKey = useMemo(() => structureKey(doc), [doc]);
  const docRef = useRef(doc);
  docRef.current = doc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => buildModel(docRef.current), [structKey]);
  const autoEx = useMemo(() => autoExaggeration(model), [model]);
  const ex = exUser ?? autoEx;

  useEffect(() => {
    let viewer: Viewer;
    try {
      viewer = new Viewer(hostRef.current!, labelsRef.current!, tipRef.current!, barRef.current, {
        onSelect: (line) => onSelectRef.current(line),
        onFlyChange: setFlying,
        onContextLost: setLost,
        onFollowChange: setFollowing,
      });
    } catch (err) {
      console.warn("3D beamline view unavailable:", err);
      setFailed(true);
      return;
    }
    viewerRef.current = viewer;
    (hostRef.current as any).__b3d = viewer; // for automated checks
    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => viewerRef.current?.setModel(model, ex), [model, ex]);
  useEffect(() => viewerRef.current?.setSelected(selected), [selected]);
  useEffect(() => viewerRef.current?.setEnvelope(envelope ?? null, showEnv, envScale), [envelope, showEnv, envScale]);
  useEffect(() => viewerRef.current?.setLabels(labels), [labels]);
  useEffect(() => viewerRef.current?.setPanMode(panMode), [panMode]);
  useEffect(() => viewerRef.current?.setPointerDevice(device), [device]);
  useEffect(() => viewerRef.current?.setTheme(), [theme]);

  const empty = !model.elems.length;
  const v = () => viewerRef.current;

  const helpMenu = (el: HTMLElement) => {
    const setDevice = (d: PointerDevice) => persist({ "ui/b3dPointer": d });
    const items: MenuItem[] = [
      { type: "header", label: tr("Pointer device") },
      { label: tr("Detect automatically"), checked: device === "auto", onClick: () => setDevice("auto") },
      { label: tr("Mouse: the wheel zooms"), checked: device === "mouse", onClick: () => setDevice("mouse") },
      { label: tr("Touchpad: two-finger swipe pans"), checked: device === "touchpad", onClick: () => setDevice("touchpad") },
      { type: "separator" },
      { type: "header", label: tr("Mouse") },
      { label: tr("Left-drag: rotate · Right- or middle-drag: pan · Wheel: zoom"), disabled: true },
      { type: "header", label: tr("Touchpad") },
      { label: tr("Press and drag: rotate · Two-finger swipe: pan · Pinch: zoom"), disabled: true },
      { type: "separator" },
      { label: tr("Pan mode (hand button): left-drag pans, right-drag rotates"), disabled: true },
      { label: tr("Click an element or its label: select · Double-click: focus"), disabled: true },
      { label: tr("←/→ (Shift: faster), Home/End, or the bar below: move along the beamline"), disabled: true },
    ];
    openMenuBelow(el, items);
  };

  return (
    <div className={cx("b3d", className, !failed && !empty && "with-bar")} ref={hostRef}>
      <div className="b3d-labels" ref={labelsRef} />
      <div className="b3d-tip" ref={tipRef} style={{ display: "none" }} />
      {!failed && <canvas className={cx("b3d-bar", empty && "hidden")} ref={barRef} />}
      {!failed && (
        <div className="b3d-toolbar" onPointerDown={(e) => e.stopPropagation()}>
          <ViewNavigation onZoom={(direction) => v()?.zoom(direction)} onFit={() => v()?.fitAll()} disabled={empty} />
          <div className="segmented b3d-views">
            <button type="button" data-tip={tr("Isometric view")} onClick={() => v()?.view("iso")} disabled={empty}>
              {tr("Iso")}
            </button>
            <button type="button" data-tip={tr("Side view (z–y plane)")} onClick={() => v()?.view("side")} disabled={empty}>
              {tr("Side")}
            </button>
            <button type="button" data-tip={tr("Top view (z–x plane)")} onClick={() => v()?.view("top")} disabled={empty}>
              {tr("Top")}
            </button>
          </div>
          <IconButton
            icon={flying ? "debug-pause" : "play"}
            active={flying}
            tip={flying ? tr("Pause fly-through") : tr("Fly along the beamline")}
            onClick={() => v()?.setFly(!flying)}
            disabled={empty}
          />
          {hasBunch && (
            <IconButton
              icon="target"
              active={following}
              tip={following ? tr("Stop following the bunch") : tr("Follow the bunch with the camera")}
              onClick={() => v()?.setFollow(!following)}
            />
          )}
          <div className="divider-v" />
          <label className="b3d-range" data-tip={tr("Transverse exaggeration")}>
            <Icon name="arrow-both" className="b3d-rot90" />
            <input
              type="range"
              min={0}
              max={1000}
              value={exToSlider(ex)}
              onChange={(e) => setExUser(sliderToEx(Number(e.target.value)))}
            />
          </label>
          <button
            type="button"
            className={cx("b3d-value", exUser == null && "auto")}
            data-tip={exUser == null ? tr("Automatic exaggeration") : tr("Reset to automatic exaggeration")}
            onClick={() => setExUser(null)}
          >
            ×{ex}
          </button>
          {envelope && (
            <>
              <div className="divider-v" />
              <Checkbox checked={showEnv} onChange={setShowEnv} label={tr("Envelope")} tip={envelope.label} className="b3d-check" />
              <label className="b3d-range" data-tip={tr("Envelope scale (multiples of the rms size)")}>
                <input type="range" min={1} max={10} step={0.5} value={envScale} disabled={!showEnv} onChange={(e) => setEnvScale(Number(e.target.value))} />
                <span className="b3d-value static">{envScale}σ</span>
              </label>
            </>
          )}
          <div className="divider-v" />
          <IconButton
            icon="move"
            active={panMode}
            tip={panMode ? tr("Pan mode: left-drag pans (click to rotate with the left button again)") : tr("Pan mode: left-drag pans instead of rotating")}
            onClick={() => setPanMode(!panMode)}
            disabled={empty}
          />
          <IconButton icon="tag" active={labels} tip={labels ? tr("Labels: elements near the camera") : tr("Labels: selected element only")} onClick={() => setLabels(!labels)} />
          <IconButton icon="info" tip={tr("Navigation and pointer device")} onClick={(e) => helpMenu(e.currentTarget)} />
        </div>
      )}
      {!failed && hasBunch && (
        <div className="b3d-schematic" data-tip={tr("The bunch is drawn from the rms envelope (its particles are random samples); it is not the simulated particle distribution.")}>
          <Icon name="info" /> {tr("schematic")}
        </div>
      )}
      {failed && (
        <div className="b3d-message">
          <Icon name="warning" />
          {tr("The 3D view is unavailable because WebGL could not be started.")}
        </div>
      )}
      {!failed && lost && <div className="b3d-message">{tr("The 3D view lost its graphics context; waiting for it to be restored.")}</div>}
      {!failed && !lost && empty && <div className="b3d-message">{tr("No active elements between start and end")}</div>}
    </div>
  );
}
