import { persist, useApp } from "../store/app";
import { useT } from "../i18n";
import { Select } from "./ui";
import { pointerDevice } from "./pointer";

export function PointerSettings() {
  const t = useT();
  const device = useApp((s) => pointerDevice(s.settings));
  return <div className="form">
    <label className="row" style={{ gap: 12 }}>
      {t("Pointer device (all plots)")}
      <Select value={device} onChange={(value) => persist({ "ui/pointerDevice": value })} options={[
        { value: "auto", label: t("Detect automatically") },
        { value: "mouse", label: t("Mouse: the wheel zooms") },
        { value: "touchpad", label: t("Touchpad: two-finger swipe pans") },
      ]} />
    </label>
    <p className="muted">{t("Applies to 2D, 3D and result plots. Touchpad: two-finger pan, pinch to zoom. Saved across restarts.")}</p>
  </div>;
}
