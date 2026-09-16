// Calls into Python (pywebview js_api) and events coming back from it.
// See avas/gui/bridge.py for the other side.

declare global {
  interface Window {
    pywebview?: { api: { call(method: string, params?: unknown): Promise<string> } };
    __avasEmit?: (batch: [string, unknown][]) => void;
  }
}

export class RpcError extends Error {
  detail?: string;
  user: boolean;
  constructor(message: string, detail?: string, user = false) {
    super(message);
    this.detail = detail;
    this.user = user;
  }
}

let readyPromise: Promise<void> | null = null;

// Development: "?devrpc" in the URL talks to avas.gui.devserver over HTTP.
if (location.search.includes("devrpc") && !window.pywebview) {
  window.pywebview = {
    api: {
      call: async (method: string, params?: unknown) => {
        const res = await fetch("/rpc", { method: "POST", body: JSON.stringify({ method, params }) });
        return res.text();
      },
    },
  };
  const source = new EventSource("/events");
  source.onmessage = (e) => window.__avasEmit?.(JSON.parse(e.data));
}

export function ready(): Promise<void> {
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      if (window.pywebview?.api) return resolve();
      window.addEventListener("pywebviewready", () => resolve(), { once: true });
      // pywebview may have injected the api before our listener was attached
      const timer = setInterval(() => {
        if (window.pywebview?.api) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }
  return readyPromise;
}

export function inHost(): boolean {
  return !!window.pywebview;
}

let baseUrl = "";
export function setBaseUrl(url: string) {
  baseUrl = url;
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
    const res = await fetch(`${baseUrl}/blob/${value.__blob__}`);
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
  await ready();
  const raw = await window.pywebview!.api.call(method, params ?? {});
  const reply = JSON.parse(raw) as { ok: boolean; result?: unknown; error?: string; detail?: string; user?: boolean };
  if (!reply.ok) throw new RpcError(reply.error ?? "Error", reply.detail, !!reply.user);
  return (await resolveBlobs(reply.result)) as T;
}

type Listener = (payload: any) => void;
const listeners = new Map<string, Set<Listener>>();

export function on(name: string, fn: Listener): () => void {
  let set = listeners.get(name);
  if (!set) listeners.set(name, (set = new Set()));
  set.add(fn);
  return () => set!.delete(fn);
}

window.__avasEmit = (batch) => {
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
};
