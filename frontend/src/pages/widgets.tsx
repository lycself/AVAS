// Small form widgets used by several pages.
import { call } from "../bridge";
import { reportError } from "../components/overlays";
import { IconButton, TextInput } from "../components/ui";
import { useT } from "../i18n";

const INT_RE = /^[-+]?\d+$/;
const FLOAT_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

export function isInt(s: string, allowEmpty = false): boolean {
  const v = s.trim();
  return v === "" ? allowEmpty : INT_RE.test(v);
}

export function isFloat(s: string, allowEmpty = false): boolean {
  const v = s.trim();
  return v === "" ? allowEmpty : FLOAT_RE.test(v);
}

export function PathPicker({
  value,
  onChange,
  mode,
  placeholder,
  directory,
  filters,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  mode: "file" | "folder";
  placeholder?: string;
  directory?: string;
  filters?: string[];
  readOnly?: boolean;
}) {
  const t = useT();
  const browse = async () => {
    try {
      const start = value && !readOnly ? value : directory ?? "";
      const path =
        mode === "folder"
          ? await call<string | null>("dialog.openFolder", { directory: start })
          : await call<string | null>("dialog.openFile", { directory: start, filters: filters ?? [] });
      if (path) onChange(path);
    } catch (e) {
      reportError(e);
    }
  };
  return (
    <div className="row" style={{ gap: 4, flex: 1, minWidth: 0 }}>
      <TextInput value={value} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }} />
      <IconButton icon={mode === "folder" ? "folder-opened" : "go-to-file"} tip={t("Browse...")} onClick={browse} />
    </div>
  );
}
