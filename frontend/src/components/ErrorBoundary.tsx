import { Component, type ReactNode } from "react";
import { useT } from "../i18n";
import { Button } from "./ui";

/** The fallback is a function component so it re-renders when the language changes. */
function ErrorView({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useT();
  return (
    <div className="empty-state" role="alert">
      <div className="danger-text" style={{ fontSize: 15 }}>
        {t("This view hit an internal error.")}
      </div>
      <pre className="selectable" style={{ maxWidth: 800, whiteSpace: "pre-wrap", color: "var(--fg-muted)" }}>
        {String(error?.message ?? error)}
      </pre>
      <Button onClick={onRetry}>{t("Try again")}</Button>
    </div>
  );
}

/** Keeps one broken page from blanking the whole window. */
export class ErrorBoundary extends Component<{ children: ReactNode; name?: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(this.props.name, error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorView error={error} onRetry={() => this.setState({ error: null })} />;
  }
}
