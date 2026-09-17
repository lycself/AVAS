// Floating things: tooltips, menus, modal dialogs and toasts.
// Menus and dialogs are driven imperatively (openMenu / confirm / prompt ...)
// so any code path, including async ones, can use them.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { create } from "zustand";
import { t } from "../i18n";
import { Button, cx, Icon, TextInput } from "./ui";

/* ------------------------------------------------------------------ tooltip */
export function TooltipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  useEffect(() => {
    let timer = 0;
    let current: Element | null = null;
    const show = (el: Element) => {
      const text = el.getAttribute("data-tip");
      if (!text) return;
      const r = el.getBoundingClientRect();
      const below = r.top < 60;
      setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 6 : r.top - 6, below });
    };
    const over = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("[data-tip]");
      if (el === current) return;
      current = el;
      window.clearTimeout(timer);
      setTip(null);
      if (el && el.getAttribute("data-tip")) timer = window.setTimeout(() => show(el), 550);
    };
    const hide = () => {
      window.clearTimeout(timer);
      current = null;
      setTip(null);
    };
    document.addEventListener("mouseover", over);
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("wheel", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("wheel", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let dx = 0;
    if (r.left < 4) dx = 4 - r.left;
    if (r.right > window.innerWidth - 4) dx = window.innerWidth - 4 - r.right;
    setShift(dx);
  }, [tip]);
  if (!tip) return null;
  return (
    <div
      ref={ref}
      className="tooltip"
      style={{ left: tip.x + shift, top: tip.y, transform: `translate(-50%, ${tip.below ? "0" : "-100%"})` }}
    >
      {tip.text}
    </div>
  );
}

/* ------------------------------------------------------------------ menus */
export type MenuItem =
  | { type?: "item"; label: string; icon?: string; shortcut?: string; disabled?: boolean; checked?: boolean; danger?: boolean; onClick?: () => void; submenu?: MenuItem[] }
  | { type: "separator" }
  | { type: "header"; label: string };

type MenuState = { items: MenuItem[]; x: number; y: number; minWidth?: number; onClose?: () => void; anchorBottom?: boolean } | null;
const useMenu = create<{ menu: MenuState; set: (m: MenuState) => void }>((set) => ({ menu: null, set: (menu) => set({ menu }) }));

/** Show a context menu at (x, y); with *anchorBottom* the menu's bottom edge is at y (menus opened from the status bar). */
export function openMenu(items: MenuItem[], x: number, y: number, opts?: { minWidth?: number; onClose?: () => void; anchorBottom?: boolean }) {
  useMenu.getState().set({ items, x, y, ...opts });
}

export function openMenuBelow(el: HTMLElement, items: MenuItem[], opts?: { onClose?: () => void }) {
  const r = el.getBoundingClientRect();
  openMenu(items, r.left, r.bottom + 2, { minWidth: r.width, ...opts });
}

export function closeMenu() {
  const m = useMenu.getState().menu;
  useMenu.getState().set(null);
  m?.onClose?.();
}

function MenuList({ items, x, y, minWidth, depth, anchorBottom }: { items: MenuItem[]; x: number; y: number; minWidth?: number; depth: number; anchorBottom?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [sub, setSub] = useState<{ index: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(-1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let nx = x;
    let ny = anchorBottom ? y - r.height : y;
    if (nx + r.width > window.innerWidth - 4) nx = depth ? x - r.width - 200 : window.innerWidth - r.width - 4;
    if (ny + r.height > window.innerHeight - 4) ny = Math.max(4, window.innerHeight - r.height - 4);
    setPos({ x: Math.max(4, nx), y: ny });
  }, [x, y, depth, anchorBottom]);
  useEffect(() => {
    if (depth) return;
    const key = (e: KeyboardEvent) => {
      const enabled = items.map((it, i) => ({ it, i })).filter(({ it }) => (it.type ?? "item") === "item" && !(it as any).disabled);
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!enabled.length) return;
        const idx = enabled.findIndex((x) => x.i === active);
        const next = e.key === "ArrowDown" ? (idx + 1) % enabled.length : (idx - 1 + enabled.length) % enabled.length;
        setActive(enabled[next].i);
      } else if (e.key === "Enter" && active >= 0) {
        e.preventDefault();
        const it = items[active] as any;
        if (it?.onClick) {
          closeMenu();
          it.onClick();
        }
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [items, active, depth]);
  return (
    <>
      <div ref={ref} className="menu" style={{ left: pos.x, top: pos.y, minWidth }} onContextMenu={(e) => e.preventDefault()}>
        {items.map((it, i) => {
          if (it.type === "separator") return <div key={i} className="menu-sep" />;
          if (it.type === "header") return <div key={i} className="menu-header">{it.label}</div>;
          return (
            <div
              key={i}
              className={cx("menu-item", it.disabled && "disabled", it.danger && "danger", (active === i || sub?.index === i) && "active")}
              onMouseEnter={(e) => {
                setActive(i);
                if (it.submenu) {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setSub({ index: i, x: r.right - 2, y: r.top - 5 });
                } else setSub(null);
              }}
              onClick={() => {
                if (it.disabled || it.submenu) return;
                closeMenu();
                it.onClick?.();
              }}
            >
              <span className="menu-check">{it.checked ? <Icon name="check" /> : it.icon ? <Icon name={it.icon} /> : null}</span>
              <span className="menu-label">{it.label}</span>
              {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
              {it.submenu && <Icon name="chevron-right" className="menu-sub" />}
            </div>
          );
        })}
      </div>
      {sub && (items[sub.index] as any).submenu && (
        <MenuList items={(items[sub.index] as any).submenu} x={sub.x} y={sub.y} depth={depth + 1} />
      )}
    </>
  );
}

export function MenuLayer() {
  const menu = useMenu((s) => s.menu);
  useEffect(() => {
    if (!menu) return;
    // no backdrop: the menu bar must still receive hover to switch menus
    const down = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".menu")) closeMenu();
    };
    const blur = () => closeMenu();
    window.addEventListener("mousedown", down, true);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", blur);
    return () => {
      window.removeEventListener("mousedown", down, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", blur);
    };
  }, [menu]);
  if (!menu) return null;
  return (
    <div className="menu-layer" onContextMenu={(e) => e.preventDefault()}>
      <MenuList items={menu.items} x={menu.x} y={menu.y} minWidth={menu.minWidth} depth={0} anchorBottom={menu.anchorBottom} />
    </div>
  );
}

/* ------------------------------------------------------------------ dialogs */
type DialogSpec = {
  id: number;
  render: (close: (value: unknown) => void) => ReactNode;
  resolve: (value: unknown) => void;
  dismissValue: unknown;
  width?: number | string;
};

const useDialogs = create<{ stack: DialogSpec[]; push: (d: DialogSpec) => void; remove: (id: number) => void }>((set) => ({
  stack: [],
  push: (d) => set((s) => ({ stack: [...s.stack, d] })),
  remove: (id) => set((s) => ({ stack: s.stack.filter((d) => d.id !== id) })),
}));

let dialogSeq = 0;

export function showDialog<T>(render: (close: (value: T) => void) => ReactNode, opts?: { dismissValue?: T; width?: number | string }): Promise<T> {
  return new Promise<T>((resolve) => {
    const id = ++dialogSeq;
    useDialogs.getState().push({
      id,
      render: render as DialogSpec["render"],
      resolve: resolve as (v: unknown) => void,
      dismissValue: opts?.dismissValue,
      width: opts?.width,
    });
  });
}

export function anyDialogOpen(): boolean {
  return useDialogs.getState().stack.length > 0;
}

export function DialogFrame({ title, icon, children, footer, onClose, className }: { title: ReactNode; icon?: string; children: ReactNode; footer?: ReactNode; onClose?: () => void; className?: string }) {
  return (
    <div className={cx("dialog", className)}>
      <div className="dialog-header">
        {icon && <Icon name={icon} />}
        <div className="dialog-title">{title}</div>
        {onClose && (
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("Close")}>
            <Icon name="close" />
          </button>
        )}
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </div>
  );
}

export function DialogLayer() {
  const stack = useDialogs((s) => s.stack);
  useEffect(() => {
    if (!stack.length) return;
    const top = stack[stack.length - 1];
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        useDialogs.getState().remove(top.id);
        top.resolve(top.dismissValue);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [stack]);
  return (
    <>
      {stack.map((d) => {
        const close = (value: unknown) => {
          useDialogs.getState().remove(d.id);
          d.resolve(value);
        };
        return (
          <div key={d.id} className="dialog-backdrop">
            <div className="dialog-wrap" style={{ width: d.width }}>
              {d.render(close)}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function alertDialog(message: ReactNode, opts?: { title?: string; detail?: string; kind?: "info" | "warning" | "error" }): Promise<void> {
  const kind = opts?.kind ?? "info";
  const icon = kind === "error" ? "error" : kind === "warning" ? "warning" : "info";
  return showDialog<void>((close) => (
    <DialogFrame
      title={opts?.title ?? (kind === "error" ? t("Error") : kind === "warning" ? t("Warning") : "AVAS")}
      icon={icon}
      className={`dialog-${kind}`}
      onClose={() => close()}
      footer={
        <Button variant="primary" autoFocus onClick={() => close()}>
          {t("OK")}
        </Button>
      }
    >
      <div className="dialog-message">{message}</div>
      {opts?.detail && (
        <details className="dialog-detail">
          <summary>{t("Details")}</summary>
          <pre>{opts.detail}</pre>
        </details>
      )}
    </DialogFrame>
  ));
}

export function confirmDialog(
  message: ReactNode,
  opts?: { title?: string; ok?: string; cancel?: string; danger?: boolean },
): Promise<boolean> {
  return showDialog<boolean>(
    (close) => (
      <DialogFrame
        title={opts?.title ?? "AVAS"}
        icon={opts?.danger ? "warning" : "question"}
        onClose={() => close(false)}
        footer={
          <>
            <Button onClick={() => close(false)}>{opts?.cancel ?? t("Cancel")}</Button>
            <Button variant={opts?.danger ? "danger" : "primary"} autoFocus onClick={() => close(true)}>
              {opts?.ok ?? t("OK")}
            </Button>
          </>
        }
      >
        <div className="dialog-message">{message}</div>
      </DialogFrame>
    ),
    { dismissValue: false },
  );
}

/** Three-way question, e.g. Save / Discard / Cancel.  Resolves to the chosen key or null. */
export function choiceDialog<K extends string>(
  message: ReactNode,
  choices: { key: K; label: string; variant?: "primary" | "secondary" | "danger" }[],
  opts?: { title?: string },
): Promise<K | null> {
  return showDialog<K | null>(
    (close) => (
      <DialogFrame
        title={opts?.title ?? "AVAS"}
        icon="question"
        onClose={() => close(null)}
        footer={
          <>
            {choices.map((c, i) => (
              <Button key={c.key} variant={c.variant ?? "secondary"} autoFocus={i === 0} onClick={() => close(c.key)}>
                {c.label}
              </Button>
            ))}
          </>
        }
      >
        <div className="dialog-message">{message}</div>
      </DialogFrame>
    ),
    { dismissValue: null },
  );
}

export function promptDialog(message: ReactNode, initial = "", opts?: { title?: string; validate?: (v: string) => string | null; ok?: string }): Promise<string | null> {
  function Body({ close }: { close: (v: string | null) => void }) {
    const [value, setValue] = useState(initial);
    const error = opts?.validate?.(value) ?? null;
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      ref.current?.focus();
      ref.current?.select();
    }, []);
    return (
      <DialogFrame
        title={opts?.title ?? "AVAS"}
        onClose={() => close(null)}
        footer={
          <>
            <Button onClick={() => close(null)}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!!error} onClick={() => close(value)}>
              {opts?.ok ?? t("OK")}
            </Button>
          </>
        }
      >
        <div className="dialog-message">{message}</div>
        <TextInput
          ref={ref}
          value={value}
          invalid={!!error}
          style={{ width: "100%", marginTop: 8 }}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !error) close(value);
          }}
        />
        {error && <div className="field-error">{error}</div>}
      </DialogFrame>
    );
  }
  return showDialog<string | null>((close) => <Body close={close} />, { dismissValue: null });
}

/* ------------------------------------------------------------------ toasts */
type Toast = { id: number; kind: "info" | "success" | "warning" | "error"; text: string };
const useToasts = create<{ toasts: Toast[]; add: (t: Toast) => void; remove: (id: number) => void }>((set) => ({
  toasts: [],
  add: (toast) => set((s) => ({ toasts: [...s.toasts.slice(-4), toast] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
let toastSeq = 0;

export function toast(text: string, kind: Toast["kind"] = "info", ms = 3500) {
  const id = ++toastSeq;
  useToasts.getState().add({ id, kind, text });
  window.setTimeout(() => useToasts.getState().remove(id), ms);
}

export function ToastLayer() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((x) => (
        <div key={x.id} className={cx("toast", `toast-${x.kind}`)} onClick={() => useToasts.getState().remove(x.id)}>
          <Icon name={x.kind === "success" ? "pass" : x.kind === "error" ? "error" : x.kind === "warning" ? "warning" : "info"} />
          <span>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ errors */
export function reportError(err: unknown, context?: string) {
  const e = err as { message?: string; detail?: string; user?: boolean };
  const message = e?.message ?? String(err);
  console.error(context, err);
  return alertDialog(context ? `${context}\n\n${message}` : message, { kind: "error", detail: e?.user ? undefined : e?.detail });
}
