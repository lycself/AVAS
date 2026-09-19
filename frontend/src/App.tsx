import { useEffect, useState } from "react";
import { DialogLayer, MenuLayer, ToastLayer, TooltipLayer } from "./components/overlays";
import { Spinner } from "./components/ui";
import { Shell } from "./shell/Shell";
import { initLog } from "./shell/LogPanel";
import { initApp, setLanguage, setPage, setTheme, useApp } from "./store/app";
import { runSimulation, saveAll } from "./actions";
import { useDirty } from "./store/pages";
import "./styles/shell.css";
import "./styles/pages.css";
import "./styles/lattice.css";
import "./styles/assistant.css";
import { initAssistant } from "./assistant/store";
import { initFrontRequests } from "./assistant/front";

// For automated UI checks (tests drive the window through evaluate_js).
(window as any).__avasDebug = { useApp, useDirty, setPage, setTheme, setLanguage, runSimulation, saveAll };

export function App() {
  const ready = useApp((s) => s.ready);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    initLog();
    initFrontRequests();
    initApp()
      .then(() => initAssistant())
      .catch((e) => setError(String(e?.message ?? e)));
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
