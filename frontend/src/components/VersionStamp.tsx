import { useT } from "../i18n";
import { useApp } from "../store/app";

export type BuildInfo = {
  commit?: string | null;
  committed?: string | null;
  dirty?: boolean | null;
  built?: string | null;
  frontend?: string | null;
  frozen?: boolean;
  location?: string;
};

export function VersionStamp() {
  const t = useT();
  const version = useApp((s) => s.version);
  const build = useApp((s) => s.build);
  const commit = build.commit?.slice(0, 7) || t("Unknown commit");
  const detail = `${build.commit || t("Unknown commit")}${build.dirty ? ` (${t("with local changes")})` : ""}`;
  return <span className="version-stamp" data-tip={detail}>
    <span>v{version}</span><span className="soft">· {commit}{build.dirty ? "*" : ""}</span>
  </span>;
}
