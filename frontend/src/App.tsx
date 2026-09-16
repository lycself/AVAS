import { useEffect, useState } from "react";
import { inHost } from "./bridge";
import { DialogLayer, MenuLayer, ToastLayer, TooltipLayer } from "./components/overlays";
import { Spinner } from "./components/ui";
import { Shell } from "./shell/Shell";
import { initLog } from "./shell/LogPanel";
import { initApp, useApp } from "./store/app";
import "./styles/shell.css";
import "./styles/pages.css";
import "./styles/lattice.css";

export function App() {
  const ready = useApp((s) => s.ready);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!inHost()) {
      const timer = window.setTimeout(() => {
        if (!window.pywebview) setError("This page is the AVAS interface; start it with 'avas gui'.");
      }, 3000);
      window.addEventListener("pywebviewready", () => window.clearTimeout(timer), { once: true });
    }
    initLog();
    initApp().catch((e) => setError(String(e?.message ?? e)));
  }, []);
  // suppress the browser's own context menu except in text fields
  useEffect(() => {
    const block = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("input, textarea, .selectable, .monaco-editor")) e.preventDefault();
    };
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);
  if (error) return <div className="boot-error">{error}</div>;
  return (
    <>
      {ready ? <Shell /> : <div className="boot"><Spinner size={28} /></div>}
      <DialogLayer />
      <MenuLayer />
      <ToastLayer />
      <TooltipLayer />
    </>
  );
}
