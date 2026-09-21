import { humanSize } from "../format";
import { useT } from "../i18n";
import { ProgressBar } from "./ui";

export type DownloadProgress = {
  message: string; stage: string; downloaded?: number; total?: number | null; speed?: number; log?: string;
};

export function UpdateProgress({ data }: { data: DownloadProgress }) {
  const t = useT();
  const downloading = data.stage === "download";
  const known = downloading && data.total != null && data.total > 0;
  const value = known ? Math.min(1, Math.max(0, (data.downloaded ?? 0) / data.total!)) : undefined;
  return <div className="update-progress">
    <div className="update-progress-label">
      <span>{t(data.message)}</span>
      {downloading && <span className="update-transfer">
        {known && <strong>{Math.floor(value! * 100)}%</strong>}
        <span>{humanSize(data.downloaded ?? 0)} / {known ? humanSize(data.total!) : t("Unknown size")}</span>
        <span>{t("Average download speed")}: {humanSize(data.speed ?? 0)}/s</span>
      </span>}
    </div>
    <div role="progressbar" aria-label={t(data.message)} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={known ? Math.floor(value! * 100) : undefined}>
      <ProgressBar value={value} indeterminate={!known} />
    </div>
  </div>;
}
