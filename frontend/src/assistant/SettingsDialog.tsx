// Assistant settings: OpenAI-compatible providers (local servers or hosted
// APIs), API keys (stored by Python in the OS credential store), test
// connection, default options.
import { useEffect, useState } from "react";
import { call } from "../bridge";
import { confirmDialog, DialogFrame, openMenuBelow, reportError, showDialog } from "../components/overlays";
import { Button, Checkbox, cx, Icon, Select, Spinner, TextInput } from "../components/ui";
import { pick, useT } from "../i18n";
import { useAssistant, type AssistantConfig, type Provider } from "./store";

export function openAssistantSettings() {
  return showDialog<void>((close) => <SettingsBody close={() => close()} />, { width: 880 });
}

type TestResult = { ok: boolean; models?: string[]; latency_ms?: number; error?: string; warning?: string } | null;

function SettingsBody({ close }: { close: () => void }) {
  const t = useT();
  const [config, setConfig] = useState<AssistantConfig | null>(useAssistant.getState().config);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [clearKey, setClearKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [test, setTest] = useState<TestResult>(null);
  const [busy, setBusy] = useState<"test" | "models" | "save" | null>(null);

  const apply = (c: AssistantConfig) => {
    setConfig(c);
    useAssistant.setState({ config: c });
  };

  useEffect(() => {
    call<AssistantConfig>("assistant.config")
      .then((c) => {
        apply(c);
        const first = c.providers.find((p) => p.id === c.active) ?? c.providers[0];
        if (first) choose(first);
      })
      .catch(reportError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (p: Provider) => {
    setSelected(p.id);
    setDraft({ ...p, extraBody: typeof p.extraBody === "string" ? p.extraBody : p.extraBody ? JSON.stringify(p.extraBody) : "" });
    setApiKey("");
    setClearKey(false);
    setModels([]);
    setTest(null);
  };

  const addFromPreset = (presetId: string) => {
    const preset = config?.presets.find((p) => p.id === presetId);
    const p: Provider = {
      id: "",
      name: preset?.label ?? "Custom",
      preset: presetId,
      baseUrl: preset?.base_url ?? "",
      model: preset?.example_model ?? "",
      temperature: 0.2,
      contextTokens: preset?.local ? 16000 : 64000,
      toolMode: "auto",
      extraBody: "",
    };
    setSelected("");
    setDraft(p);
    setApiKey("");
    setClearKey(false);
    setModels([]);
    setTest(null);
  };

  const preset = config?.presets.find((p) => p.id === draft?.preset);
  const upd = (patch: Partial<Provider>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const payload = () => ({ ...draft!, extraBody: draft!.extraBody ?? "" });

  const doTest = async () => {
    if (!draft) return;
    setBusy("test");
    setTest(null);
    try {
      const r = await call<TestResult>("assistant.test", { provider: payload(), apiKey: apiKey || null });
      setTest(r);
      if (r?.models?.length) setModels(r.models);
    } catch (e: any) {
      setTest({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setBusy(null);
    }
  };

  const fetchModels = async () => {
    if (!draft) return;
    setBusy("models");
    try {
      const list = await call<string[]>("assistant.models", { provider: payload(), apiKey: apiKey || null });
      setModels(list);
      if (!draft.model && list.length) upd({ model: list[0] });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const c = await call<AssistantConfig>("assistant.saveProvider", { provider: payload(), apiKey: apiKey || null, clearKey });
      apply(c);
      const saved = draft.id ? c.providers.find((p) => p.id === draft.id) : c.providers[c.providers.length - 1];
      if (saved) choose(saved);
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!(await confirmDialog(t("Remove {name}? Its stored API key is deleted too.", { name: draft.name || draft.model }), { danger: true, ok: t("Remove") }))) return;
    try {
      const c = await call<AssistantConfig>("assistant.deleteProvider", { id: draft.id });
      apply(c);
      if (c.providers[0]) choose(c.providers[0]);
      else {
        setDraft(null);
        setSelected(null);
      }
    } catch (e) {
      reportError(e);
    }
  };

  const setOption = async (values: Record<string, unknown>) => {
    try {
      apply(await call<AssistantConfig>("assistant.setOptions", { values }));
    } catch (e) {
      reportError(e);
    }
  };

  if (!config) return <DialogFrame title={t("AI assistant settings")}><Spinner size={20} /></DialogFrame>;

  return (
    <DialogFrame
      title={t("AI assistant settings")}
      icon="sparkle"
      onClose={close}
      className="as-settings"
      footer={
        <>
          <span className="soft grow">{t("API keys are stored in {store}, not in the settings file.", { store: config.secretStore === "file" ? t("a private file") : "Windows Credential Manager" })}</span>
          <Button onClick={close}>{t("Close")}</Button>
        </>
      }
    >
      <div className="as-settings-body">
        <div className="as-settings-list">
          <div className="soft as-settings-h">{t("Models")}</div>
          {config.providers.map((p) => (
            <div key={p.id} className={cx("list-item", selected === p.id && "active")} onClick={() => choose(p)}>
              <Icon name={config.presets.find((x) => x.id === p.preset)?.local ? "vm" : "cloud"} />
              <div className="grow">
                <div className="ellipsis">{p.name || p.preset}</div>
                <div className="soft ellipsis" style={{ fontSize: 12 }}>
                  {p.model}
                </div>
              </div>
              {config.active === p.id && <Icon name="check" className="success-text" />}
            </div>
          ))}
          <Button
            small
            icon="add"
            onClick={(e) =>
              openMenuBelow(e.currentTarget, [
                { type: "header", label: t("Local") },
                ...config.presets.filter((p) => p.local).map((p) => ({ label: p.label, onClick: () => addFromPreset(p.id) })),
                { type: "header", label: t("Hosted API") },
                ...config.presets.filter((p) => !p.local).map((p) => ({ label: p.label, onClick: () => addFromPreset(p.id) })),
              ])
            }
          >
            {t("Add…")}
          </Button>
          <div className="as-settings-options">
            <Checkbox checked={!!config.options.autoApply} label={t("Apply changes without asking in new conversations")} onChange={(v) => setOption({ autoApply: v })} />
            <label className="row" style={{ gap: 8 }}>
              <span className="muted">{t("Max tool steps per message")}</span>
              <TextInput
                style={{ width: 64 }}
                defaultValue={String(config.options.maxSteps)}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 1) setOption({ maxSteps: Math.round(n) });
                }}
              />
            </label>
          </div>
        </div>
        <div className="as-settings-form">
          {!draft ? (
            <div className="empty-state">
              <Icon name="plug" className="empty-icon" />
              <div>{t("Add a model: a local server such as Ollama, LM Studio or vLLM, or an OpenAI-compatible API.")}</div>
            </div>
          ) : (
            <>
              <div className="form">
                <div className="form-label">{t("Name")}</div>
                <div className="form-field">
                  <TextInput value={draft.name ?? ""} onChange={(e) => upd({ name: e.target.value })} />
                </div>
                <div className="form-label">{t("Type")}</div>
                <div className="form-field">
                  <Select
                    value={draft.preset ?? "custom"}
                    options={config.presets.map((p) => ({ value: p.id, label: p.label }))}
                    onChange={(v) => {
                      const pr = config.presets.find((p) => p.id === v);
                      upd({ preset: v, baseUrl: pr?.base_url || draft.baseUrl, name: draft.name && draft.name !== preset?.label ? draft.name : pr?.label });
                    }}
                  />
                </div>
                <div className="form-label">{t("Base URL")}</div>
                <div className="form-field">
                  <TextInput className="mono" value={draft.baseUrl} placeholder="http://localhost:11434/v1" onChange={(e) => upd({ baseUrl: e.target.value })} />
                </div>
                <div className="form-label">{t("Model")}</div>
                <div className="form-field">
                  <TextInput className="mono" list="as-models" value={draft.model} placeholder={preset?.example_model ?? ""} onChange={(e) => upd({ model: e.target.value })} />
                  <datalist id="as-models">
                    {models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  <Button small icon={busy === "models" ? "loading" : "refresh"} iconSpin={busy === "models"} onClick={fetchModels} tip={t("Ask the server which models it offers")}>
                    {t("List")}
                  </Button>
                </div>
                <div className="form-label">{t("API key")}</div>
                <div className="form-field">
                  <TextInput
                    type="password"
                    value={apiKey}
                    autoComplete="off"
                    placeholder={draft.hasKey && !clearKey ? t("stored (leave empty to keep)") : preset?.needs_key ? t("required") : t("not needed for local servers")}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setClearKey(false);
                    }}
                  />
                  {draft.hasKey && (
                    <Button small variant="ghost" onClick={() => setClearKey(true)} disabled={clearKey}>
                      {clearKey ? t("will be removed") : t("Remove key")}
                    </Button>
                  )}
                </div>
                <div className="form-label">{t("Tool calling")}</div>
                <div className="form-field">
                  <Select
                    value={draft.toolMode ?? "auto"}
                    options={[
                      { value: "auto", label: t("Automatic (native, fall back to prompted)") },
                      { value: "native", label: t("Native function calling") },
                      { value: "prompted", label: t("Prompted (for models without tool support)") },
                      { value: "off", label: t("Off (chat only)") },
                    ]}
                    onChange={(v) => upd({ toolMode: v as Provider["toolMode"] })}
                  />
                </div>
                <div className="form-label">{t("Context window")}</div>
                <div className="form-field">
                  <TextInput className="num mono" value={String(draft.contextTokens ?? "")} onChange={(e) => upd({ contextTokens: e.target.value })} />
                  <span className="unit">{t("tokens")}</span>
                </div>
                <div className="form-label">{t("Temperature")}</div>
                <div className="form-field">
                  <TextInput className="num mono" value={String(draft.temperature ?? "")} placeholder={t("server default")} onChange={(e) => upd({ temperature: e.target.value })} />
                  <span className="unit" />
                </div>
                <div className="form-label">{t("Max output tokens")}</div>
                <div className="form-field">
                  <TextInput className="num mono" value={String(draft.maxTokens ?? "")} placeholder={t("server default")} onChange={(e) => upd({ maxTokens: e.target.value })} />
                  <span className="unit" />
                </div>
                <div className="form-label">{t("Timeout")}</div>
                <div className="form-field">
                  <TextInput className="num mono" value={String(draft.timeout ?? "")} placeholder="180" onChange={(e) => upd({ timeout: e.target.value })} />
                  <span className="unit">s</span>
                </div>
                <div className="form-label top">{t("Extra request fields")}</div>
                <div className="form-field">
                  <textarea
                    className="input mono"
                    rows={2}
                    value={draft.extraBody ?? ""}
                    placeholder='{"chat_template_kwargs": {"enable_thinking": false}}'
                    onChange={(e) => upd({ extraBody: e.target.value })}
                  />
                </div>
              </div>
              {preset && <p className="hint as-preset-note">{pick(preset.notes)}</p>}
              {test && (
                <div className={cx("as-test", test.ok ? "ok" : "fail")}>
                  <Icon name={test.ok ? "pass" : "error"} />
                  <span className="selectable">
                    {test.ok
                      ? t("Connected in {ms} ms · {n} models", { ms: Math.round(test.latency_ms ?? 0), n: test.models?.length ?? 0 })
                      : test.error}
                    {test.warning ? ` · ${test.warning}` : ""}
                  </span>
                </div>
              )}
              <div className="row" style={{ marginTop: 12 }}>
                <Button icon={busy === "test" ? "loading" : "debug-disconnect"} iconSpin={busy === "test"} onClick={doTest}>
                  {t("Test connection")}
                </Button>
                <div className="grow" />
                {draft.id && config.active !== draft.id && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      try {
                        apply(await call<AssistantConfig>("assistant.setActive", { id: draft.id }));
                      } catch (e) {
                        reportError(e);
                      }
                    }}
                  >
                    {t("Use this model")}
                  </Button>
                )}
                {draft.id && (
                  <Button variant="ghost" icon="trash" onClick={remove}>
                    {t("Remove")}
                  </Button>
                )}
                <Button variant="primary" icon="save" disabled={busy === "save" || !draft.baseUrl || !draft.model} onClick={save}>
                  {draft.id ? t("Save") : t("Add")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
