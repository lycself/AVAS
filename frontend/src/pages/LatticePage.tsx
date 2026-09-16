import { useT } from "../i18n";
import { NoProject, PageHeader, useProjectOpen } from "./common";

export default function LatticePage() {
  const t = useT();
  if (!useProjectOpen()) return <NoProject />;
  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader title={t("LatticePage")} hint="(work in progress)" />
      </div>
    </div>
  );
}
