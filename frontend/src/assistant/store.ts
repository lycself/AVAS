// Assistant state: panel layout, provider config, the open conversation and
// its items (kept in sync with avas/gui/services/assistant.py through
// "assistant.event").
import { create } from "zustand";
import { call, on } from "../bridge";
import { reportError } from "../components/overlays";
import { persist, useApp } from "../store/app";
import { useDirty } from "../store/pages";
import { currentLatticeSelection } from "./front";

export type Provider = {
  id: string;
  name?: string;
  preset?: string;
  baseUrl: string;
  model: string;
  temperature?: number | string | null;
  maxTokens?: number | string | null;
  contextTokens?: number | string | null;
  toolMode?: "auto" | "native" | "prompted" | "off";
  timeout?: number | string | null;
  extraBody?: string;
  hasKey?: boolean;
};

export type Preset = { id: string; label: string; base_url: string; needs_key: boolean; local: boolean; example_model?: string; notes: [string, string] };

export type AssistantConfig = { providers: Provider[]; active: string | null; presets: Preset[]; options: { autoApply: boolean; maxSteps: number }; secretStore: string };

export type Item = {
  id: string;
  role: "user" | "assistant" | "tool" | "proposal" | "notice" | "error";
  text?: string;
  reasoning?: string;
  name?: string;
  args?: Record<string, unknown>;
  status?: string;
  result?: string;
  summary?: string;
  progress?: { percent?: number; label?: string; eta_s?: number };
  step?: { index?: number; total?: number; value?: unknown; objective?: number | null };
  best?: { eval?: number; objective?: number; x?: number[]; names?: string[] };
  table?: { rows: Record<string, unknown>[]; param?: string };
  charts?: { title: string; x: number[]; series: { name: string; y: (number | null)[] }[]; xlabel?: string }[];
  proposal?: Record<string, any>;
  applied?: Record<string, unknown>;
  error?: string;
  auto?: boolean;
  kind?: string;
  detail?: string;
  model?: string;
  provider?: string;
  time?: number;
};

export type ConversationMeta = { id: string; title: string; updated: number; created: number; busy: boolean };

type State = {
  open: boolean;
  width: number;
  config: AssistantConfig | null;
  conversations: ConversationMeta[];
  current: { id: string; title: string; items: Item[]; busy: boolean; autoApply: boolean } | null;
  loading: boolean;
};

export const useAssistant = create<State>(() => ({
  open: false,
  width: 420,
  config: null,
  conversations: [],
  current: null,
  loading: false,
}));

const set = useAssistant.setState;
const get = useAssistant.getState;

export function initAssistant() {
  const s = useApp.getState().settings;
  set({ open: !!s["ui/assistantOpen"], width: Math.max(320, Math.min(900, Number(s["ui/assistantWidth"]) || 420)) });
  if (get().open) ensureLoaded().catch(() => undefined);
  on("assistant.event", (ev: any) => handleEvent(ev));
  // conversations belong to a project: start over when another project is opened
  // ("project" events also fire for every change of the project summary)
  let projectPath = useApp.getState().project.path ?? null;
  useApp.subscribe((s) => {
    const path = s.project.open ? s.project.path ?? null : null;
    if (path === projectPath) return;
    projectPath = path;
    const cur = get().current;
    if (cur && !cur.busy) set({ current: null });
    loaded = false;
    if (get().open) ensureLoaded().catch(() => undefined);
  });
}

export function setAssistantOpen(open: boolean) {
  set({ open });
  persist({ "ui/assistantOpen": open });
  if (open) ensureLoaded().catch((e) => reportError(e));
}

export function setAssistantWidth(width: number) {
  set({ width });
  persist({ "ui/assistantWidth": width });
}

let loaded = false;
async function ensureLoaded() {
  if (!get().config || !loaded) await loadConfig();
  if (!loaded) {
    loaded = true;
    await refreshConversations();
    const list = get().conversations;
    if (!get().current && list.length) await openConversation(list[0].id);
  }
}

export async function loadConfig() {
  const config = await call<AssistantConfig>("assistant.config");
  set({ config });
  return config;
}

export async function refreshConversations() {
  const conversations = await call<ConversationMeta[]>("assistant.conversations");
  set({ conversations });
  return conversations;
}

export async function openConversation(id: string) {
  set({ loading: true });
  try {
    const c = await call<any>("assistant.load", { id });
    set({ current: { id: c.id, title: c.title, items: c.items ?? [], busy: !!c.busy, autoApply: !!c.autoApply } });
  } finally {
    set({ loading: false });
  }
}

export async function newConversation() {
  const c = await call<any>("assistant.new");
  set({ current: { id: c.id, title: "", items: [], busy: false, autoApply: !!c.autoApply } });
  return c.id as string;
}

export async function deleteConversation(id: string) {
  const conversations = await call<ConversationMeta[]>("assistant.delete", { id });
  set({ conversations });
  if (get().current?.id === id) set({ current: null });
}

function uiContext() {
  const app = useApp.getState();
  const dirty = Object.entries(useDirty.getState().dirty)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return { page: app.page, selection: currentLatticeSelection(), dirty };
}

export async function sendMessage(text: string) {
  let cur = get().current;
  if (!cur) {
    await newConversation();
    cur = get().current;
  }
  if (!cur) return;
  try {
    set({ current: { ...cur, busy: true } });
    await call("assistant.send", { conversation: cur.id, text, ui: uiContext() });
    refreshConversations().catch(() => undefined);
  } catch (e) {
    set({ current: { ...get().current!, busy: false } });
    reportError(e);
  }
}

export async function stopTurn() {
  const cur = get().current;
  if (cur) await call("assistant.stop", { conversation: cur.id }).catch(reportError);
}

/** *choice*: the option picked on a proposal with alternatives (e.g. the entry beam of a segment run). */
export async function decide(itemId: string, decision: "apply" | "reject", choice?: string) {
  const cur = get().current;
  if (cur) await call("assistant.decide", { conversation: cur.id, id: itemId, decision, choice }).catch(reportError);
}

export async function undoProposal(itemId: string) {
  const cur = get().current;
  if (cur) await call("assistant.undo", { conversation: cur.id, id: itemId }).catch(reportError);
}

export async function setAutoApply(value: boolean) {
  const cur = get().current;
  if (!cur) {
    await newConversation();
  }
  const c = get().current!;
  const r = await call<{ autoApply: boolean }>("assistant.setAutoApply", { id: c.id, value });
  set({ current: { ...get().current!, autoApply: r.autoApply } });
}

function handleEvent(ev: any) {
  const cur = get().current;
  if (!cur || ev.conversation !== cur.id) {
    if (ev.type === "busy") refreshConversations().catch(() => undefined);
    return;
  }
  if (ev.type === "item") {
    const items = cur.items.slice();
    const i = items.findIndex((x) => x.id === ev.item.id);
    if (i >= 0) items[i] = ev.item;
    else items.push(ev.item);
    set({ current: { ...cur, items } });
  } else if (ev.type === "delta") {
    const items = cur.items.slice();
    const i = items.findIndex((x) => x.id === ev.itemId);
    if (i < 0) return;
    const it = { ...items[i] };
    (it as any)[ev.field] = ((it as any)[ev.field] ?? "") + ev.delta;
    items[i] = it;
    set({ current: { ...cur, items } });
  } else if (ev.type === "busy") {
    set({ current: { ...cur, busy: !!ev.busy } });
    if (!ev.busy) refreshConversations().catch(() => undefined);
  }
}
