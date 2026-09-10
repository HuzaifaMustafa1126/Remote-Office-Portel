import { Component } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default class TaskDashboardErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("Task dashboard render failed", error, details);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="rounded-2xl border border-danger-border bg-surface p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto text-danger" size={28} />
        <h2 className="mt-3 text-lg font-bold">Task dashboard could not be displayed</h2>
        <p className="mt-1 text-sm text-muted-foreground">A dashboard widget returned unexpected data. Reload the latest task information and try again.</p>
        <button onClick={() => window.location.reload()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background">
          <RotateCw size={15} /> Reload dashboard
        </button>
      </section>
    );
  }
}
