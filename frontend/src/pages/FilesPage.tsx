import { useT } from "../i18n";
import { NoProject, PageHeader, useProjectOpen } from "./common";

export default function FilesPage() {
  const t = useT();
  if (!useProjectOpen()) return <NoProject />;
  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader title={t("FilesPage")} hint="(work in progress)" />
      </div>
    </div>
  );
}
