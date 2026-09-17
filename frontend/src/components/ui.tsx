// Small building blocks with the VS Code look.  Colours come only from the
// CSS tokens in styles/tokens.css, so a theme switch is a single attribute change.
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Icon({ name, className, spin, style, title }: { name: string; className?: string; spin?: boolean; style?: CSSProperties; title?: string }) {
  return (
    <i
      className={cx("codicon", `codicon-${name}`, spin && "codicon-modifier-spin", className)}
      style={style}
      aria-hidden={title ? undefined : true}
      data-tip={title}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: string;
  iconSpin?: boolean;
  small?: boolean;
  tip?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", icon, iconSpin, small, tip, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("btn", `btn-${variant}`, small && "btn-small", !children && "btn-icon-only", className)}
      data-tip={tip}
      {...rest}
    >
      {icon && <Icon name={icon} spin={iconSpin} />}
      {children != null && children !== false && <span className="btn-label">{children}</span>}
    </button>
  );
});

export function IconButton({ icon, tip, active, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; tip?: string; active?: boolean }) {
  return (
    <button type="button" className={cx("icon-btn", active && "active", className)} data-tip={tip} aria-label={tip} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...rest }, ref) {
    return <input ref={ref} className={cx("input", invalid && "invalid", className)} spellCheck={false} {...rest} />;
  },
);

/** A text box that commits on blur / Enter and reverts on Escape. */
export function CommitInput({
  value,
  onCommit,
  validate,
  className,
  placeholder,
  disabled,
  style,
  mono,
  tip,
  list,
}: {
  value: string;
  list?: string;
  onCommit: (v: string) => void;
  validate?: (v: string) => boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  mono?: boolean;
  tip?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const skipCommit = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  const invalid = validate ? !validate(draft) : false;
  const commit = () => {
    if (skipCommit.current) {
      skipCommit.current = false;
      return;
    }
    if (draft !== value && !invalid) onCommit(draft);
    else if (invalid) setDraft(value);
  };
  return (
    <input
      className={cx("input", invalid && "invalid", mono && "mono", className)}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      spellCheck={false}
      data-tip={tip}
      list={list}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur(); // blur commits
        } else if (e.key === "Escape") {
          skipCommit.current = true;
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function NumberInput({
  value,
  onCommit,
  min,
  max,
  integer,
  className,
  disabled,
  style,
  tip,
}: {
  value: number | null | undefined;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
  tip?: string;
}) {
  const text = value == null || Number.isNaN(value) ? "" : String(value);
  const ok = (s: string) => {
    if (s.trim() === "") return false;
    const n = Number(s);
    if (!Number.isFinite(n)) return false;
    if (integer && !Number.isInteger(n)) return false;
    if (min != null && n < min) return false;
    if (max != null && n > max) return false;
    return true;
  };
  return (
    <CommitInput
      value={text}
      validate={ok}
      onCommit={(s) => onCommit(Number(s))}
      className={cx("num", className)}
      disabled={disabled}
      style={style}
      mono
      tip={tip}
    />
  );
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  className,
  style,
  tip,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  tip?: string;
}) {
  return (
    <span className={cx("select", disabled && "disabled", className)} style={style} data-tip={tip}>
      <select
        value={String(value)}
        disabled={disabled}
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          if (opt) onChange(opt.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" className="select-arrow" />
    </span>
  );
}

export function Checkbox({ checked, onChange, label, disabled, tip, className }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean; tip?: string; className?: string }) {
  return (
    <label className={cx("check", disabled && "disabled", className)} data-tip={tip}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="check-box">{checked && <Icon name="check" />}</span>
      {label != null && <span className="check-label">{label}</span>}
    </label>
  );
}

export function Radio({ checked, onChange, label, disabled, name, tip }: { checked: boolean; onChange: () => void; label?: ReactNode; disabled?: boolean; name?: string; tip?: string }) {
  return (
    <label className={cx("radio", disabled && "disabled")} data-tip={tip}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={() => onChange()} />
      <span className="radio-dot" />
      {label != null && <span className="check-label">{label}</span>}
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode; icon?: string; tip?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          className={cx(o.value === value && "active")}
          data-tip={o.tip}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, tabs, onChange, className, extra }: { value: T; tabs: { value: T; label: ReactNode; icon?: string; badge?: ReactNode; onClose?: () => void; tip?: string }[]; onChange: (v: T) => void; className?: string; extra?: ReactNode }) {
  return (
    <div className={cx("tabs", className)} role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.value}
          role="tab"
          className={cx("tab", tab.value === value && "active")}
          onClick={() => onChange(tab.value)}
          onAuxClick={(e) => {
            if (e.button === 1 && tab.onClose) tab.onClose();
          }}
          data-tip={tab.tip}
        >
          {tab.icon && <Icon name={tab.icon} />}
          <span className="tab-label">{tab.label}</span>
          {tab.badge}
          {tab.onClose && (
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                tab.onClose!();
              }}
            >
              <Icon name="close" />
            </span>
          )}
        </div>
      ))}
      <div className="tabs-fill" />
      {extra}
    </div>
  );
}

export function Section({ title, icon, actions, children, className, description }: { title: ReactNode; icon?: string; actions?: ReactNode; children: ReactNode; className?: string; description?: ReactNode }) {
  return (
    <section className={cx("section", className)}>
      <header className="section-header">
        {icon && <Icon name={icon} />}
        <h3>{title}</h3>
        <div className="section-actions">{actions}</div>
      </header>
      {description && <p className="section-desc">{description}</p>}
      <div className="section-body">{children}</div>
    </section>
  );
}

export function Collapsible({ title, open: initial = true, children, actions }: { title: ReactNode; open?: boolean; children: ReactNode; actions?: ReactNode }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className={cx("collapsible", open && "open")}>
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <Icon name={open ? "chevron-down" : "chevron-right"} />
        <span className="collapsible-title">{title}</span>
        <div className="collapsible-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

export function Field({ label, children, hint, unit, tip, wide }: { label: ReactNode; children: ReactNode; hint?: ReactNode; unit?: ReactNode; tip?: string; wide?: boolean }) {
  return (
    <div className={cx("field", wide && "wide")}>
      <label className="field-label" data-tip={tip}>
        {label}
      </label>
      <div className="field-control">
        {children}
        {unit && <span className="field-unit">{unit}</span>}
      </div>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "danger" | "warning" }) {
  return <span className={cx("badge", `badge-${tone}`)}>{children}</span>;
}

export function Empty({ icon = "info", title, children }: { icon?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} className="empty-icon" />
      <div className="empty-title">{title}</div>
      {children && <div className="empty-body">{children}</div>}
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Icon name="loading" spin style={{ fontSize: size }} />;
}

export function ProgressBar({ value, indeterminate, paused }: { value?: number; indeterminate?: boolean; paused?: boolean }) {
  return (
    <div className={cx("progress", indeterminate && "indeterminate", paused && "paused")}>
      <div className="progress-fill" style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(1, value ?? 0)) * 100}%` }} />
    </div>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("toolbar", className)}>{children}</div>;
}

export function Divider({ vertical }: { vertical?: boolean }) {
  return <div className={vertical ? "divider-v" : "divider-h"} />;
}
