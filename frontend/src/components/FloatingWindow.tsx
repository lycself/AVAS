// A non-modal window inside the app: draggable by its title bar, resizable from
// every edge, maximise / restore, Escape to close.  It never blocks the page
// underneath, so the manual and the field viewer can stay open while the user
// keeps working.  Geometry is not persisted: reopening starts from
// `initialRect` again.
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cx } from "./ui";
import { useT } from "../i18n";

export type Rect = { x: number; y: number; width: number; height: number };

/** Page size in CSS pixels, undoing the UI zoom so dragging tracks the pointer. */
export function viewport() {
  const zoom = Number(getComputedStyle(document.documentElement).zoom) || 1;
  return { width: window.innerWidth / zoom, height: window.innerHeight / zoom, zoom };
}

/** Keep *r* on screen and no smaller than *min*. */
export function fitRect(r: Rect, min: { width: number; height: number }): Rect {
  const v = viewport();
  const width = Math.min(v.width, Math.max(Math.min(min.width, v.width), r.width));
  const height = Math.min(v.height, Math.max(Math.min(min.height, v.height), r.height));
  return { width, height, x: Math.max(0, Math.min(r.x, v.width - width)), y: Math.max(0, Math.min(r.y, v.height - height)) };
}

const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

export function FloatingWindow({
  label,
  title,
  actions,
  initialRect,
  minSize = { width: 340, height: 260 },
  className,
  onClose,
  onKeyDown,
  children,
}: {
  /** Accessible name of the window. */
  label: string;
  /** Shown at the left of the title bar. */
  title: ReactNode;
  /** Extra buttons, placed before maximise and close. */
  actions?: ReactNode;
  initialRect: () => Rect;
  minSize?: { width: number; height: number };
  className?: string;
  onClose: () => void;
  /** Keys the content wants before the window's own handling (Escape still closes). */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>, root: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  const t = useT();
  const [rect, setRect] = useState(initialRect);
  const [maximized, setMaximized] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; rect: Rect; edge: string } | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    const resize = () => setRect((r) => fitRect(r, minSize));
    window.addEventListener("resize", resize);
    // the UI zoom lives in a style attribute on <html>, so watch it too
    const observer = new MutationObserver(resize);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (root.current?.contains(document.activeElement) || document.activeElement === document.body) previous?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start(e: PointerEvent<HTMLElement>, edge = "") {
    if (e.button !== 0 || maximized || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, y: e.clientY, rect, edge };
  }
  function move(e: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    const { zoom } = viewport();
    const dx = (e.clientX - g.x) / zoom;
    const dy = (e.clientY - g.y) / zoom;
    const r = { ...g.rect };
    if (!g.edge) {
      r.x += dx;
      r.y += dy;
    } else {
      if (g.edge.includes("e")) r.width += dx;
      if (g.edge.includes("s")) r.height += dy;
      if (g.edge.includes("w")) {
        r.x += dx;
        r.width -= dx;
      }
      if (g.edge.includes("n")) {
        r.y += dy;
        r.height -= dy;
      }
    }
    setRect(fitRect(r, minSize));
  }
  const end = () => {
    gesture.current = null;
  };
  const drag = { onPointerMove: move, onPointerUp: end, onPointerCancel: end, onLostPointerCapture: end };

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      tabIndex={-1}
      className={cx("float-window", className)}
      style={maximized ? { inset: 0 } : { left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      onKeyDown={(e) => {
        e.stopPropagation();
        onKeyDown?.(e, root.current);
        if (!e.defaultPrevented && e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <header className="float-title" onPointerDown={(e) => start(e)} {...drag}>
        <strong>{title}</strong>
        {actions}
        <button className="btn btn-small" onClick={() => setMaximized(!maximized)}>
          {maximized ? t("Restore window") : t("Maximize window")}
        </button>
        <button className="btn btn-small" onClick={onClose}>
          {t("Close")}
        </button>
      </header>
      {children}
      {!maximized && EDGES.map((edge) => <div key={edge} className={`float-resize float-${edge}`} onPointerDown={(e) => start(e, edge)} {...drag} />)}
    </div>
  );
}
