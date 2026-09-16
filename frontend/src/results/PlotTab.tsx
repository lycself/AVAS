// One result plot: options bar, interactive figure, export through matplotlib.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { call } from "../bridge";
import { reportError, toast } from "../components/overlays";
import { Plot } from "../components/Plot";
import { Button, Icon, IconButton, Spinner } from "../components/ui";
import { fmtG } from "../format";
import { useT } from "../i18n";
import { useApp } from "../store/app";
import { toPlotly, type Figure } from "./figures";

export async function exportFigure(plot: string, params: Record<string, unknown>, outputDir: string | undefined, name: string) {
  try {
    const path = await call<string | null>("dialog.saveFile", {
      filename: `${name}.png`,
      filters: ["PNG image (*.png)", "PDF document (*.pdf)", "SVG image (*.svg)"],
    });
    if (!path) return;
    await call("results.export", { plot, params, outputDir, path });
    toast(`${path}`, "success", 4000);
  } catch (e) {
    reportError(e);
  }
}

export function PlotTab({
  plot,
  params,
  outputDir,
  options,
  title,
  refreshKey,
  footer,
  onFigure,
}: {
  plot: string;
  params: Record<string, unknown>;
  outputDir?: string;
  options?: ReactNode;
  title: string;
  refreshKey: number;
  footer?: (fig: Figure | null) => ReactNode;
  onFigure?: (fig: Figure | null) => void;
}) {
  const t = useT();
  const dark = useApp((s) => s.resolvedTheme === "dark");
  const [fig, setFig] = useState<Figure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState(0);
  const seq = useRef(0);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const f = await call<Figure>("results.figure", { plot, params, outputDir });
      if (my !== seq.current) return;
      setFig(f);
      setError(null);
      onFigure?.(f);
    } catch (e: any) {
      if (my !== seq.current) return;
      setFig(null);
      setError(e?.message ?? String(e));
      onFigure?.(null);
    } finally {
      if (my === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot, paramsKey, outputDir]);

  useEffect(() => {
    load();
  }, [load, refreshKey, local]);

  const plotly = useMemo(() => (fig ? toPlotly(fig, dark) : null), [fig, dark]);

  return (
    <div className="plot-tab">
      <div className="plot-options">
        {options}
        <div className="grow" />
        {loading && <Spinner />}
        <IconButton icon="refresh" tip={t("Refresh")} onClick={() => setLocal((n) => n + 1)} />
        <Button small icon="save" disabled={!fig} onClick={() => exportFigure(plot, params, outputDir, title.replace(/[\\/:*?"<>|\s]+/g, "_"))} tip={t("Save a publication-quality image (matplotlib, light background)")}>
          {t("Save image")}
        </Button>
      </div>
      <div className="plot-body">
        {error ? (
          <div className="plot-error">
            <Icon name="warning" />
            <span className="selectable">{error}</span>
          </div>
        ) : plotly ? (
          <Plot data={plotly.data} layout={plotly.layout} style={{ position: "absolute", inset: 0 }} />
        ) : (
          <div className="plot-error">
            <Spinner size={22} />
          </div>
        )}
      </div>
      {footer?.(fig)}
    </div>
  );
}

export function AcceptanceFooter({ fig }: { fig: Figure | null }) {
  const t = useT();
  if (!fig || fig.kind !== "acceptance") return null;
  const r = fig.result;
  return (
    <div className="plot-footer">
      <span>
        <span className="muted">{t("Acceptance (π mm mrad)")}</span> <b>{fmtG(r.emit, 5)}</b>
      </span>
      <span>
        <span className="muted">{t("Normalised")}</span> <b>{r.norm == null ? "–" : fmtG(r.norm, 5)}</b>
      </span>
      <span>
        <span className="muted">{t("Min. position")}</span> <b>{fmtG(r.pos, 5)}</b>
      </span>
      <span>
        <span className="muted">{t("Min. angle")}</span> <b>{fmtG(r.angle, 5)}</b>
      </span>
    </div>
  );
}
