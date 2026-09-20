import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "./ui";
import { useT } from "../i18n";

export function HorizontalStrip({ children }: { children: ReactNode }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const update = () => {
    const el = ref.current;
    if (el) setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  };
  useEffect(() => {
    const el = ref.current!;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    const wheel = (e: WheelEvent) => {
      if (!e.shiftKey || e.deltaX || !e.deltaY || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    update();
    return () => { observer.disconnect(); el.removeEventListener("wheel", wheel); };
  }, []);
  return <div className="horizontal-strip">
    <IconButton icon="chevron-left" tip={t("Scroll components left")} disabled={!edges.left}
      onClick={() => ref.current?.scrollBy({ left: -ref.current.clientWidth * 0.75 })} />
    <div className="horizontal-strip-scroll" ref={ref} onScroll={update}>
      <div className="ve-palette">{children}</div>
    </div>
    <IconButton icon="chevron-right" tip={t("Scroll components right")} disabled={!edges.right}
      onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.75 })} />
  </div>;
}
