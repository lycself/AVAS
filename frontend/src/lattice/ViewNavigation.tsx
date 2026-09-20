import { IconButton } from "../components/ui";
import { useT } from "../i18n";
import "../styles/viewNavigation.css";

/** Shared order, icons and hints for both beamline views. */
export function ViewNavigation({ onZoom, onFit, disabled = false }: {
  onZoom: (direction: 1 | -1) => void;
  onFit: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  return <>
    <IconButton icon="zoom-in" tip={t("Zoom in")} onClick={() => onZoom(1)} disabled={disabled} />
    <IconButton icon="zoom-out" tip={t("Zoom out")} onClick={() => onZoom(-1)} disabled={disabled} />
    <IconButton icon="screen-full" tip={t("Fit all (double-click empty space)")} onClick={onFit} disabled={disabled} />
  </>;
}
