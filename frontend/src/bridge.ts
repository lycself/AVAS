// Transport to the Python back end (avas/gui/server.py): calls over HTTP, events over a WebSocket.
// The same code runs inside the desktop window (pywebview) and in an ordinary browser; the page
// URL says which: ?host=webview|browser, ?token=<access token>, and ?api=<base url> when the page
// is served by the Vite dev server instead of the back end.
import { t } from "./i18n";

export class RpcError extends Error {
  detail?: string;
  user: boolean;
  constructor(message: string, detail?: string, user = false) {
    super(message);
    this.detail = detail;
    this.user = user;
  }
}

export type HostKind = "webview" | "browser";

const query = new URLSearchParams(location.search);
const apiBase = (query.get("api") ?? "").replace(/\/$/, "");
const token = query.get("token") ?? "";
const host: HostKind = query.get("host") === "webview" ? "webview" : "browser";

/** "webview": the pywebview desktop window (native dialogs, quit, zoom); "browser": a plain browser tab. */
export function hostKind(): HostKind {
  return host;
}

export function isDesktop(): boolean {
  return host === "webview";
}

function authHeaders(): Record<string, string> {
  return token ? { "X-AVAS-Token": token } : {};
}

/** URL of a back-end resource with the access token attached (downloads, links). */
export function apiUrl(path: string, params?: Record<string, string>): string {
  const q = new URLSearchParams(params ?? {});
  if (token) q.set("token", token);
  const qs = q.toString();
  return `${apiBase}${path}${qs ? `?${qs}` : ""}`;
}

type BlobRef = { __blob__: string; dtype: string; shape: number[] };

function isBlob(v: unknown): v is BlobRef {
  return !!v && typeof v === "object" && "__blob__" in (v as object);
}

const CTORS: Record<string, { new (buf: ArrayBuffer): ArrayLike<number> }> = {
  float32: Float32Array,
  float64: Float64Array,
  int32: Int32Array,
  uint8: Uint8Array,
  int8: Int8Array,
  uint16: Uint16Array,
  int16: Int16Array,
  uint32: Uint32Array,
};

async function resolveBlobs(value: unknown): Promise<unknown> {
  if (isBlob(value)) {
    const res = await fetch(`${apiBase}/blob/${value.__blob__}`, { headers: authHeaders() });
    if (!res.ok) throw new RpcError("Data transfer failed");
    const buf = await res.arrayBuffer();
    const Ctor = CTORS[value.dtype] ?? Float64Array;
    return new Ctor(buf);
  }
  if (Array.isArray(value)) {
    if (value.length && value.some(isBlobDeep)) return Promise.all(value.map(resolveBlobs));
    return value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (!entries.some(([, v]) => isBlobDeep(v))) return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = await resolveBlobs(v);
    return out;
  }
  return value;
}

function isBlobDeep(v: unknown): boolean {
  if (isBlob(v)) return true;
  if (Array.isArray(v)) return v.length > 0 && typeof v[0] === "object" && v.some(isBlobDeep);
  if (v && typeof v === "object") return Object.values(v).some(isBlobDeep);
  return false;
}

export async function call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ method, params: params ?? {} }),
    });
  } catch {
    throw new RpcError(t("The AVAS back end is not reachable."), undefined, true);
  }
  if (res.status === 401) throw new RpcError(t("This page has no valid access token; open AVAS from 'avas gui' or the link printed by 'avas serve'."), undefined, true);
  if (!res.ok) throw new RpcError(`HTTP ${res.status}`, await res.text());
  const reply = (await res.json()) as { ok: boolean; result?: unknown; error?: string; detail?: string; user?: boolean };
  // messages of expected problems (bridge.UserError) are translated when zh_CN.json has them
  if (!reply.ok) throw new RpcError(reply.user && reply.error ? t(reply.error) : reply.error ?? "Error", reply.detail, !!reply.user);
  return (await resolveBlobs(reply.result)) as T;
}

/* ------------------------------------------------------------------ events */
type Listener = (payload: any) => void;
const listeners = new Map<string, Set<Listener>>();

export function on(name: string, fn: Listener): () => void {
  let set = listeners.get(name);
  if (!set) listeners.set(name, (set = new Set()));
  set.add(fn);
  return () => set!.delete(fn);
}

function dispatchEvents(batch: [string, unknown][]) {
  for (const [name, payload] of batch) {
    const set = listeners.get(name);
    if (set) for (const fn of set) {
      try {
        fn(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

// The WebSocket reconnects by itself; events emitted while it was down are lost, so listeners of
// "bridge.reconnected" fetch the state they care about again (the run state, the live envelope).
let socket: WebSocket | null = null;
let everConnected = false;
let retryMs = 500;

function wsUrl(): string {
  const base = apiBase || location.origin;
  return `${base.replace(/^http/, "ws")}/api/events${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

function connectEvents() {
  const ws = new WebSocket(wsUrl());
  socket = ws;
  ws.onopen = () => {
    retryMs = 500;
    if (everConnected) dispatchEvents([["bridge.reconnected", null]]);
    everConnected = true;
  };
  ws.onmessage = (e) => {
    try {
      dispatchEvents(JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  };
  ws.onclose = () => {
    if (socket !== ws) return;
    socket = null;
    window.setTimeout(connectEvents, retryMs);
    retryMs = Math.min(retryMs * 2, 5000);
  };
  ws.onerror = () => ws.close();
}

connectEvents();
