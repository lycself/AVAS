/** A restoration belongs to an undo branch, not to the page's last clicked button. */
export type RestorationOrigin = { revision: string };
export type RestorationHandle = {
  getRestoration: () => RestorationOrigin | null;
  finishHistorySave: (origin: RestorationOrigin | null) => void;
};

export function createRestorationTracker() {
  const states = new Map<number, RestorationOrigin | null>();
  let current: RestorationOrigin | null = null;
  return {
    get: () => current,
    change(id: number, event: { isUndoing?: boolean; isRedoing?: boolean; isFlush?: boolean }) {
      if (event.isFlush) { states.clear(); current = null; }
      else if (event.isUndoing || event.isRedoing) current = states.get(id) ?? null;
      states.set(id, current);
    },
    restored(id: number, revision: string) {
      current = { revision };
      states.set(id, current);
    },
    saved(origin: RestorationOrigin | null) {
      if (!origin) return;
      // A new restore may have happened while the save request was in flight.
      for (const [id, value] of states) if (value === origin) states.delete(id);
      if (current === origin) current = null;
    },
  };
}
