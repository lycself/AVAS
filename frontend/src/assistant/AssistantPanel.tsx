// AI assistant side panel: conversation, tool activity, change proposals
// with Apply / Reject / Undo, charts and the message box.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { confirmDialog, openMenuBelow, promptDialog, reportError, type MenuItem } from "../components/overlays";
import { Badge, Button, cx, Icon, IconButton, ProgressBar, Select, Spinner } from "../components/ui";
import { fmtSeconds } from "../format";
import { t, useT } from "../i18n";
import { setPage, useApp } from "../store/app";
import { requestLatticeSelection } from "../store/latticeUi";
import { Markdown } from "./Markdown";
import { MiniCharts } from "./MiniChart";
import { openAssistantSettings } from "./SettingsDialog";
import {
  decide,
  deleteConversation,
  loadConfig,
  newConversation,
  openConversation,
  refreshConversations,
  sendMessage,
  setAssistantOpen,
  setAutoApply,
  stopTurn,
  undoProposal,
  useAssistant,
  type Item,
} from "./store";
import { call } from "../bridge";

const TOOL_LABELS: Record<string, [string, string]> = {
  project_overview: ["Reading the project overview", "info"],
  list_elements: ["Listing lattice elements", "list-ordered"],
  get_element: ["Reading element parameters", "symbol-property"],
  keyword_help: ["Looking up a keyword", "book"],
  search_manual: ["Searching the user manual", "book"],
  get_beam: ["Reading beam.txt", "pulse"],
  get_settings: ["Reading the simulation settings", "settings-gear"],
  results_summary: ["Reading the results", "graph-line"],
  result_series: ["Reading results along z", "graph-line"],
  segment_results: ["Reading segment results", "graph-line"],
  read_log: ["Reading the log", "output"],
  read_input_file: ["Reading an input file", "file"],
  preview_envelope: ["Linear envelope preview", "pulse"],
  edit_lattice: ["Changing the lattice", "edit"],
  edit_lattice_bulk: ["Changing the lattice", "edit"],
  edit_lattice_lines: ["Changing the lattice", "edit"],
  edit_beam: ["Changing beam.txt", "edit"],
  edit_input: ["Changing input.txt", "edit"],
  set_error_study: ["Changing the run mode", "edit"],
  set_run_lattice: ["Choosing the run lattice", "edit"],
  run_simulation: ["Running the simulation", "play"],
  run_segment: ["Simulating a lattice segment", "play"],
  scan_parameter: ["Parameter scan", "graph-scatter"],
  optimize: ["Optimisation", "rocket"],
  show_element: ["Showing an element", "eye"],
};

const SUGGESTIONS = [
  "Summarize this project and the last run.",
  "Why did the last run fail or lose beam? Check the results and the log.",
  "Show the quadrupoles and their gradients.",
  "Use the linear preview to keep the rms beam size below 2 mm by adjusting the first three quadrupoles.",
  "Scan the phase of the first RF cavity from -40° to -20° with simulations and compare transmission and emittance growth.",
];

/* ------------------------------------------------------------------ items */
function ToolCard({ item }: { item: Item }) {
  const tt = useT();
  const [open, setOpen] = useState(false);
  const [label, icon] = TOOL_LABELS[item.name ?? ""] ?? [item.name ?? "tool", "tools"];
  const target = item.args && (item.args as any).line ? `line ${(item.args as any).line}` : (item.args as any)?.name ?? "";
  const running = item.status === "running";
  return (
    <div className={cx("as-tool", item.status === "error" && "error")}>
      <div className="as-tool-head" onClick={() => setOpen(!open)}>
        {running ? <Spinner size={14} /> : <Icon name={item.status === "error" ? "error" : icon} />}
        <span className="as-tool-label">{tt(label)}</span>
        {target && <span className="soft ellipsis">{String(target)}</span>}
        <div className="grow" />
        {item.step?.total ? (
          <span className="soft">
            {item.step.index}/{item.step.total}
          </span>
        ) : null}
        <Icon name={open ? "chevron-up" : "chevron-down"} className="soft" />
      </div>
      {running && item.progress && (
        <div className="as-tool-progress">
          <ProgressBar value={(item.progress.percent ?? 0) / 100} />
          <span className="soft">
            {item.progress.label ? `${item.progress.label} · ` : ""}
            {Math.round(item.progress.percent ?? 0)} %{item.progress.eta_s != null ? ` · ${fmtSeconds(item.progress.eta_s)}` : ""}
          </span>
        </div>
      )}
      {item.best && (
        <div className="as-tool-best soft">
          {tt("best so far")}: <b>{String(item.best.objective)}</b> {item.best.names?.map((n, i) => `${n}=${item.best!.x?.[i]}`).join(", ")}
        </div>
      )}
      {item.status === "error" && item.summary && <div className="as-tool-error danger-text">{item.summary}</div>}
      {item.table && item.table.rows.length > 0 && <ResultTable rows={item.table.rows} />}
      {item.charts?.map((c, i) => <MiniCharts key={i} chart={c} />)}
      {open && (
        <div className="as-tool-detail">
          <div className="soft">{tt("Arguments")}</div>
          <pre>{JSON.stringify(item.args ?? {}, null, 1)}</pre>
          {item.result && (
            <>
              <div className="soft">{tt("Result")}</div>
              <pre>{prettyJson(item.result)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function prettyJson(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 1);
  } catch {
    return text;
  }
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="md-table-wrap">
      <table className="md-table compact">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>{r[c] == null ? "–" : String(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PROPOSAL_TITLES: Record<string, string> = {
  lattice: "Change the lattice",
  file: "Change {file}",
  lattice_source: "Use another lattice file",
  run: "Run the simulation",
  scan: "Parameter scan with {n} simulations",
  optimize: "Optimisation with up to {n} simulations",
  segment: "Simulate segment {label}",
};

const RUN_KINDS = ["run", "scan", "optimize", "segment"];

const ENTRY_OPTIONS: Record<string, { label: string; detail: string }> = {
  beam: { label: "Initial beam (beam.txt)", detail: "The segment starts at the beginning of the lattice, so the project's beam is used as it is." },
  dst: { label: "Particle file of the last full run", detail: "{file} at the entry, from the run of {run}. Accurate." },
  segment: {
    label: "Exit beam of an earlier segment run",
    detail: "The final particle file of {source} (run of {run}), which ends at this entry. As accurate as that run, no upstream simulation needed.",
  },
  upstream: { label: "Simulate the upstream part first", detail: "The elements before the segment are simulated first; their output is the entry beam. Accurate, takes longer." },
  twiss: {
    label: "Beam from the Twiss parameters at the entry",
    detail: "Generated from α, β, ε and energy that the run of {run} recorded at the entry (W = {energy} MeV). Approximate: the real distribution shape is lost.",
  },
};

function SegmentDetails({ p, choice, setChoice, pending }: { p: any; choice: string; setChoice: (c: string) => void; pending: boolean }) {
  const tt = useT();
  const seg = p.segment ?? {};
  const options: any[] = p.options ?? [];
  return (
    <div className="as-segment">
      <div className="kv compact">
        <div className="k">{tt("Elements")}</div>
        <div className="v">
          {tt("{n} elements, {first} → {last}", { n: seg.elements ?? "?", first: seg.first ?? "", last: seg.last ?? "" })}
        </div>
        <div className="k">{tt("Position")}</div>
        <div className="v">
          z = {seg.z_start} … {seg.z_end} m <span className="soft">({tt("of {total} m", { total: seg.total_length ?? "?" })})</span>
        </div>
        <div className="k">{tt("Lines")}</div>
        <div className="v">
          L{seg.first_line} – L{seg.last_line}
        </div>
        <div className="k">{tt("Results")}</div>
        <div className="v mono">{p.folder}</div>
      </div>
      {p.rephase && (
        <div className="soft">
          {tt("{n} RF fields in the segment are re-phased to keep their timing (V3 = 2, reference run of a single particle first).", { n: seg.rf ?? 0 })}
        </div>
      )}
      <div className="as-segment-options">
        <div className="as-segment-caption">{tt("Entry beam")}</div>
        {options.map((o) => {
          const meta = ENTRY_OPTIONS[o.id] ?? { label: o.id, detail: "" };
          const selected = choice === o.id;
          return (
            <label key={o.id} className={cx("as-option", selected && "selected", !o.available && "disabled", !pending && "readonly")}>
              <input type="radio" checked={selected} disabled={!pending || !o.available} onChange={() => setChoice(o.id)} />
              <span className="as-option-body">
                <span className="as-option-title">
                  {tt(meta.label)}
                  {o.accuracy === "approximate" && <Badge tone="warning">{tt("approximate")}</Badge>}
                  {o.id === p.default && pending && <Badge>{tt("recommended")}</Badge>}
                </span>
                <span className="soft">
                  {o.available
                    ? tt(meta.detail, { file: o.file ?? "", run: o.run ?? "?", energy: o.energy ?? "?", source: o.source ?? "" })
                    : tt("Not available: {reason}.", { reason: tt(o.reason ?? "") })}
                </span>
                {o.available && o.stale && <span className="warning-text">{tt("The lattice was changed after that run.")}</span>}
                {o.available && o.estimate_s != null && <span className="soft">{tt("Estimated time: {t}", { t: fmtSeconds(o.estimate_s) })}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ProposalCard({ item }: { item: Item }) {
  const tt = useT();
  const p = item.proposal ?? {};
  const status = item.status;
  const title = tt(PROPOSAL_TITLES[p.kind] ?? "Change", { file: p.file ?? "", n: p.runs ?? "", label: p.label ?? "" });
  const changes: any[] = p.changes ?? [];
  const canUndo = status === "applied" && ["lattice", "file", "lattice_source"].includes(p.kind);
  const [choice, setChoice] = useState<string>((item as any).choice ?? p.choice ?? p.default ?? "");
  const shownChoice = (item as any).choice ?? choice;
  const chosen = (p.options ?? []).find((o: any) => o.id === shownChoice);
  const estimate = p.kind === "segment" ? chosen?.estimate_s ?? null : p.estimate_s ? (p.runs ? p.estimate_s * p.runs : p.estimate_s) : null;
  return (
    <div className={cx("as-proposal", `st-${status}`)}>
      <div className="as-proposal-head">
        <Icon name={RUN_KINDS.includes(p.kind) ? "play" : "diff"} />
        <span className="as-proposal-title">{title}</span>
        <div className="grow" />
        {status === "pending" ? (
          <Badge tone="warning">{tt("waiting for you")}</Badge>
        ) : status === "applied" ? (
          <Badge tone="success">{item.auto ? tt("applied automatically") : tt("applied")}</Badge>
        ) : status === "undone" ? (
          <Badge>{tt("undone")}</Badge>
        ) : status === "failed" ? (
          <Badge tone="danger">{tt("failed")}</Badge>
        ) : (
          <Badge>{status === "rejected" ? tt("rejected") : tt("cancelled")}</Badge>
        )}
      </div>
      {p.reason && <div className="as-proposal-reason">{p.reason}</div>}
      {p.kind === "segment" && <SegmentDetails p={p} choice={shownChoice} setChoice={setChoice} pending={status === "pending"} />}
      {changes.length > 0 && p.kind !== "run" && (
        <div className="md-table-wrap">
          <table className="md-table compact">
            <tbody>
              {changes.slice(0, 60).map((c, i) => (
                <tr key={i}>
                  <td className="soft">{c.line ? `L${c.line}` : ""}</td>
                  <td>{c.element ?? c.keyword}</td>
                  <td>{c.param ?? c.label ?? ""}</td>
                  <td className="as-old">{c.old ?? "–"}</td>
                  <td>→</td>
                  <td className="as-new">
                    {c.new ?? tt("(removed)")} {c.unit ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {changes.length > 60 && <div className="soft">{tt("… and {n} more", { n: changes.length - 60 })}</div>}
        </div>
      )}
      {changes.length === 0 && p.diff?.length > 0 && (
        <div className="as-diff">
          {p.diff.slice(0, 30).map((d: any, i: number) => (
            <div key={i}>
              <div className="soft">L{d.line}</div>
              {d.old && <pre className="as-diff-old">- {d.old}</pre>}
              {d.new && <pre className="as-diff-new">+ {d.new}</pre>}
            </div>
          ))}
        </div>
      )}
      {estimate != null && <div className="soft">{tt("Estimated time: {t}", { t: fmtSeconds(estimate) })}</div>}
      {status === "failed" && item.error && <div className="danger-text">{item.error}</div>}
      {status === "pending" && (
        <div className="as-proposal-actions">
          <Button
            variant="primary"
            icon="check"
            disabled={p.kind === "segment" && !chosen?.available}
            onClick={() => decide(item.id, "apply", p.kind === "segment" ? shownChoice : undefined)}
          >
            {RUN_KINDS.includes(p.kind) ? tt("Start") : tt("Apply")}
          </Button>
          <Button icon="close" onClick={() => decide(item.id, "reject")}>
            {tt("Reject")}
          </Button>
          {p.kind === "lattice" && changes[0]?.line && (
            <Button
              variant="ghost"
              icon="eye"
              onClick={() => {
                setPage("lattice");
                requestLatticeSelection(changes[0].line - 1);
              }}
            >
              {tt("Show")}
            </Button>
          )}
        </div>
      )}
      {canUndo && (
        <div className="as-proposal-actions">
          <Button small variant="ghost" icon="discard" onClick={() => undoProposal(item.id)}>
            {tt("Undo")}
          </Button>
          {item.applied && (item.applied as any).where === "editor" && <span className="soft">{tt("applied in the lattice editor and saved")}</span>}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ item, streaming }: { item: Item; streaming: boolean }) {
  const tt = useT();
  const [showThinking, setShowThinking] = useState(false);
  const thinking = !!item.reasoning?.trim();
  const openThinking = showThinking || (streaming && !item.text);
  return (
    <div className="as-assistant">
      {thinking && (
        <div className="as-thinking">
          <div className="as-thinking-head" onClick={() => setShowThinking(!showThinking)}>
            <Icon name={openThinking ? "chevron-down" : "chevron-right"} />
            {streaming && !item.text ? <Spinner size={12} /> : <Icon name="lightbulb" />}
            <span>{tt("Thinking")}</span>
          </div>
          {openThinking && <div className="as-thinking-body">{item.reasoning}</div>}
        </div>
      )}
      {item.text && <Markdown text={item.text} />}
    </div>
  );
}

/* ------------------------------------------------------------------ panel */
export function AssistantPanel() {
  const tt = useT();
  const { config, current, conversations, loading } = useAssistant();
  const projectOpen = useApp((s) => s.project.open);
  const projectName = useApp((s) => s.project.name);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!config) loadConfig().catch(() => undefined);
  }, [config]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [current?.items]);

  const busy = !!current?.busy;
  const active = config?.providers.find((p) => p.id === config.active) ?? null;
  const items = current?.items ?? [];
  const lastAssistant = useMemo(() => [...items].reverse().find((i) => i.role === "assistant"), [items]);

  const submit = async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    if (!active) {
      openAssistantSettings();
      return;
    }
    setText("");
    stick.current = true;
    await sendMessage(msg);
  };

  const historyMenu = (): MenuItem[] => [
    { label: tt("New conversation"), icon: "add", onClick: () => newConversation().catch(reportError) },
    { type: "separator" },
    ...(conversations.length ? [{ type: "header" as const, label: projectName ? tt("Conversations in {p}", { p: projectName }) : tt("Conversations") }] : []),
    ...conversations.slice(0, 20).map((c) => ({
      label: c.title || tt("(untitled)"),
      checked: c.id === current?.id,
      shortcut: new Date(c.updated * 1000).toLocaleDateString(),
      onClick: () => openConversation(c.id).catch(reportError),
    })),
    ...(current
      ? [
          { type: "separator" as const },
          {
            label: tt("Rename…"),
            icon: "edit",
            onClick: async () => {
              const title = await promptDialog(tt("Name of this conversation"), current.title);
              if (title != null) {
                await call("assistant.rename", { id: current.id, title }).catch(reportError);
                useAssistant.setState({ current: { ...useAssistant.getState().current!, title } });
                refreshConversations().catch(() => undefined);
              }
            },
          },
          {
            label: tt("Delete this conversation"),
            icon: "trash",
            danger: true,
            disabled: busy,
            onClick: async () => {
              if (await confirmDialog(tt("Delete this conversation?"), { danger: true, ok: tt("Delete") })) await deleteConversation(current.id);
            },
          },
        ]
      : []),
  ];

  return (
    <aside className="assistant-panel">
      <header className="as-header">
        <Icon name="sparkle" className="as-logo" />
        <button ref={historyRef} className="as-title ellipsis" onClick={() => historyRef.current && openMenuBelow(historyRef.current, historyMenu())} data-tip={tt("Conversations")}>
          {current?.title || tt("AI assistant")}
          <Icon name="chevron-down" />
        </button>
        <div className="grow" />
        <IconButton icon="add" tip={tt("New conversation")} disabled={busy} onClick={() => newConversation().catch(reportError)} />
        <IconButton icon="settings-gear" tip={tt("Assistant settings (model, API)")} onClick={() => openAssistantSettings()} />
        <IconButton icon="close" tip={tt("Close the assistant (Ctrl+Shift+A)")} onClick={() => setAssistantOpen(false)} />
      </header>
      <div className="as-bar">
        {config && config.providers.length > 0 ? (
          <Select
            value={config.active ?? ""}
            style={{ minWidth: 0, flex: "1 1 auto" }}
            tip={tt("Model used for new messages")}
            options={config.providers.map((p) => ({ value: p.id, label: `${p.name || p.preset || "AI"} · ${p.model}` }))}
            onChange={async (id) => {
              try {
                useAssistant.setState({ config: await call("assistant.setActive", { id }) });
              } catch (e) {
                reportError(e);
              }
            }}
          />
        ) : (
          <Button small variant="primary" icon="plug" onClick={() => openAssistantSettings()}>
            {tt("Connect a model…")}
          </Button>
        )}
        <button
          className={cx("as-auto", current?.autoApply && "on")}
          onClick={async () => {
            const next = !current?.autoApply;
            if (next && !(await confirmDialog(tt("Apply changes and start simulations without asking in this conversation? Every change is still backed up and can be undone."), { title: tt("Auto-apply"), ok: tt("Turn on") }))) return;
            setAutoApply(next).catch(reportError);
          }}
          data-tip={current?.autoApply ? tt("Changes are applied without asking (click to ask again)") : tt("Every change waits for your approval (click to allow automatic changes)")}
        >
          <Icon name={current?.autoApply ? "unlock" : "shield"} />
          {current?.autoApply ? tt("Auto") : tt("Ask")}
        </button>
      </div>
      <div
        className="as-messages"
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {loading && <div className="empty-state"><Spinner size={20} /></div>}
        {!loading && items.length === 0 && (
          <div className="as-empty">
            <Icon name="sparkle" className="as-empty-icon" />
            <div className="as-empty-title">{tt("Ask about this project or let the assistant change it")}</div>
            <p className="muted">
              {tt("It reads the lattice, beam and results, proposes parameter changes for your approval, runs simulations, scans and optimisations. Works with local models (Ollama, vLLM, LM Studio) and OpenAI-compatible APIs.")}
            </p>
            {!projectOpen && <p className="warning-text">{tt("Open a project first.")}</p>}
            <div className="as-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="as-suggestion" disabled={!projectOpen} onClick={() => setText(tt(s))}>
                  {tt(s)}
                </button>
              ))}
            </div>
          </div>
        )}
        {items.map((item) => {
          switch (item.role) {
            case "user":
              return (
                <div key={item.id} className="as-user selectable">
                  {item.text}
                </div>
              );
            case "assistant":
              return <AssistantMessage key={item.id} item={item} streaming={busy && item === lastAssistant} />;
            case "tool":
              return <ToolCard key={item.id} item={item} />;
            case "proposal":
              return <ProposalCard key={item.id} item={item} />;
            case "notice":
              return (
                <div key={item.id} className="as-notice soft">
                  <Icon name="info" /> {noticeText(item)}
                </div>
              );
            case "error":
              return (
                <div key={item.id} className="as-error">
                  <Icon name="error" /> <span className="selectable">{item.text}</span>
                  {item.detail && (
                    <details>
                      <summary>{tt("Details")}</summary>
                      <pre>{item.detail}</pre>
                    </details>
                  )}
                </div>
              );
            default:
              return null;
          }
        })}
        {busy && (!items.length || items[items.length - 1].role === "user") && (
          <div className="as-working soft">
            <Spinner size={14} /> {tt("Working…")}
          </div>
        )}
      </div>
      <footer className="as-composer">
        <textarea
          ref={inputRef}
          className="input as-input"
          value={text}
          rows={Math.min(8, Math.max(2, text.split("\n").length))}
          placeholder={projectOpen ? tt("Ask or instruct… (Enter to send, Shift+Enter for a new line)") : tt("Open a project first.")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="as-composer-row">
          <span className="soft ellipsis grow">{active ? `${active.model}` : tt("No model configured")}</span>
          {busy ? (
            <Button small icon="debug-stop" className="btn-stop" onClick={() => stopTurn()}>
              {tt("Stop")}
            </Button>
          ) : (
            <Button small variant="primary" icon="send" disabled={!text.trim() || !projectOpen} onClick={submit}>
              {tt("Send")}
            </Button>
          )}
        </div>
      </footer>
    </aside>
  );
}

function noticeText(item: Item) {
  if (item.kind === "tool_mode") return t("The model does not support native tool calls; switched to prompted tool calls.");
  if (item.kind === "context") return t("The conversation is long; older tool results were shortened for the model.");
  if (item.kind === "max_steps") return t("The step limit was reached; the assistant stopped calling tools.");
  return item.text ?? "";
}

