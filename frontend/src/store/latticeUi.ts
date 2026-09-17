// Lattice page view state shared with other pages (the overview's "Visual editor"
// button, the assistant's "show element" action).
import { create } from "zustand";

export type LatticeMode = "text" | "visual";

type LatticeUi = {
  mode: LatticeMode;
  /** A line to select once the lattice editor is ready (consumed by the editor). */
  pendingSelect: { line: number; seq: number } | null;
  /**
   * The visual editor opens in a browse state (selecting, zooming, reading values)
   * and changes the lattice only after "Edit"; this avoids accidental edits.  Not
   * persisted: every visit, project switch and run starts in the browse state.
   */
  visualEditing: boolean;
};

export const useLatticeUi = create<LatticeUi>(() => ({
  mode: (() => {
    try {
      return localStorage.getItem("avas.latticeMode") === "visual" ? "visual" : "text";
    } catch {
      return "text";
    }
  })(),
  pendingSelect: null,
  visualEditing: false,
}));

export function setVisualEditing(visualEditing: boolean) {
  if (useLatticeUi.getState().visualEditing !== visualEditing) useLatticeUi.setState({ visualEditing });
}

export function setLatticeMode(mode: LatticeMode) {
  useLatticeUi.setState({ mode });
  try {
    localStorage.setItem("avas.latticeMode", mode);
  } catch {
    /* storage unavailable */
  }
}

let seq = 0;
export function requestLatticeSelection(line: number) {
  useLatticeUi.setState({ pendingSelect: { line, seq: ++seq } });
}
