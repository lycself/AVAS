// What the assistant's Python side may ask the page to do ("assistant.front"
// requests): read the lattice being edited, apply an approved change to the
// open editor (one undo step) and save it, reload pages after a file changed,
// start a run exactly like the Run button (or only prepare one that Python
// starts, e.g. a segment run), switch pages and show an element.
import { call, on } from "../bridge";
import { prepareRun, runSimulation } from "../actions";
import { setPage, useApp, type PageId } from "../store/app";
import { requestLatticeSelection } from "../store/latticeUi";
import { fileSaved, getPage, useDirty } from "../store/pages";

export type LatticeEditorApi = {
  name: () => string | null;
  path: () => string | null;
  getText: () => string | null;
  isDirty: () => boolean;
  replaceText: (text: string) => void;
  save: () => Promise<void>;
  selection: () => { line: number; keyword: string; name: string } | null;
};

let latticeApi: LatticeEditorApi | null = null;

export function registerLatticeEditor(api: LatticeEditorApi): () => void {
  latticeApi = api;
  return () => {
    if (latticeApi === api) latticeApi = null;
  };
}

export function currentLatticeSelection(): string | null {
  const sel = latticeApi?.selection();
  if (!sel) return null;
  return `line ${sel.line + 1}: ${sel.keyword}${sel.name ? ` (${sel.name})` : ""}`;
}

type Handler = (params: any) => Promise<unknown> | unknown;

const handlers: Record<string, Handler> = {
  "lattice.getText": () => {
    if (!latticeApi || latticeApi.getText() == null) return null;
    return { name: latticeApi.name(), text: latticeApi.getText(), dirty: latticeApi.isDirty() };
  },
  "lattice.apply": async ({ name, text }: { name: string; text: string }) => {
    if (!latticeApi || latticeApi.name() !== name || latticeApi.getText() == null) return { applied: false };
    latticeApi.replaceText(text);
    await latticeApi.save();
    return { applied: true, saved: true };
  },
  "pages.reload": async ({ paths, pages }: { paths?: string[]; pages?: (string | null)[] }) => {
    for (const p of paths ?? []) fileSaved(p, "assistant");
    for (const id of pages ?? []) {
      if (!id) continue;
      const page = getPage(id);
      if (page?.reload && !page.isDirty()) await page.reload();
    }
    return true;
  },
  "pages.dirty": () =>
    Object.entries(useDirty.getState().dirty)
      .filter(([, v]) => v)
      .map(([k]) => k),
  "ui.state": () => ({
    page: useApp.getState().page,
    selection: currentLatticeSelection(),
    dirty: Object.entries(useDirty.getState().dirty)
      .filter(([, v]) => v)
      .map(([k]) => k),
  }),
  "ui.select": ({ line }: { line: number }) => {
    setPage("lattice");
    requestLatticeSelection(line);
    return true;
  },
  "run.start": async () => {
    await runSimulation();
    const run = useApp.getState().run;
    return run.running ? { started: true } : { started: false, error: "The simulation was not started (see the message in the window)." };
  },
  // validate + save + engine checks before Python starts a run itself (segment runs)
  "run.prepare": async () => {
    if (useApp.getState().run.running) return { ok: false, error: "A simulation is already running." };
    return prepareRun();
  },
  "ui.page": ({ page }: { page: PageId }) => {
    setPage(page);
    return true;
  },
};

export function initFrontRequests() {
  on("assistant.front", async (req: { id: string; method: string; params: unknown }) => {
    const fn = handlers[req.method];
    try {
      if (!fn) throw new Error(`Unknown page request ${req.method}`);
      const result = await fn(req.params ?? {});
      await call("assistant.frontReply", { id: req.id, ok: true, result: result ?? null });
    } catch (e: any) {
      await call("assistant.frontReply", { id: req.id, ok: false, error: e?.message ?? String(e) }).catch(() => undefined);
    }
  });
}
