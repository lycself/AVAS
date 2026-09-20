// The component view's field, in a window big enough to read: same slices as the
// files page, but non-modal, so the parameter sliders underneath stay usable and
// the field redraws while a gradient or a length is dragged.
import { create } from "zustand";
import { FloatingWindow, fitRect, viewport, type Rect } from "../components/FloatingWindow";
import { FieldSliceView, type FieldSource } from "../files/FieldSlice";
import { useT } from "../i18n";

type State = { source: FieldSource | null; title: string; show: (source: FieldSource, title: string) => void; close: () => void };

export const useFieldWindow = create<State>((set) => ({
  source: null,
  title: "",
  show: (source, title) => set({ source, title }),
  close: () => set({ source: null, title: "" }),
}));

const MIN = { width: 380, height: 300 };

function initial(): Rect {
  const v = viewport();
  const width = Math.min(820, v.width * 0.62);
  const height = Math.min(620, v.height * 0.72);
  return fitRect({ x: Math.max(0, (v.width - width) / 2), y: Math.max(40, (v.height - height) / 2), width, height }, MIN);
}

export function FieldWindowLayer() {
  const source = useFieldWindow((s) => s.source);
  return source ? <FieldWindow source={source} /> : null;
}

function FieldWindow({ source }: { source: FieldSource }) {
  const t = useT();
  const title = useFieldWindow((s) => s.title);
  const close = useFieldWindow((s) => s.close);
  return (
    <FloatingWindow label={t("Field of {name}", { name: title })} title={t("Field of {name}", { name: title })} initialRect={initial} minSize={MIN} onClose={close}>
      <div className="field-window-body">
        {/* a different element starts the view over; changing its parameters must not,
            or dragging a slider would reset the plane and the component being shown */}
        <FieldSliceView key={title} source={source} />
      </div>
    </FloatingWindow>
  );
}
