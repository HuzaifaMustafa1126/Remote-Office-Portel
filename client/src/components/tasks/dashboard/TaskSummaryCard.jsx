export default function TaskSummaryCard({ title, count, icon: Icon, tone = "neutral", onClick, active, trend, inverse = false, spark = [] }) {
  const styles = {
    green: "from-success-soft/90 via-surface to-surface text-success",
    blue: "from-info-soft/90 via-surface to-surface text-info",
    orange: "from-warning-soft/90 via-surface to-surface text-warning",
    red: "from-danger-soft/90 via-surface to-surface text-danger",
    neutral: "from-surface-secondary via-surface to-surface text-muted-foreground",
  };
  const good = trend != null && (inverse ? trend <= 0 : trend >= 0);
  const parts = String(count).split(" / ");
  const max = Math.max(1, ...spark);
  return (
    <button onClick={onClick} className={`task-summary-card group relative flex min-h-[150px] overflow-hidden rounded-[18px] border bg-gradient-to-br p-5 text-left shadow-[0_18px_46px_-30px_rgba(15,23,42,.55)] transition duration-300 hover:-translate-y-1 hover:border-primary-border hover:shadow-[0_24px_54px_-30px_rgba(59,130,246,.4)] ${styles[tone]} ${active ? "border-foreground" : "border-border"}`}>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-current opacity-[.05] blur-2xl" />
      <span className="min-w-0 flex-1">
        <span className="task-summary-icon inline-flex rounded-xl border border-current/10 bg-surface/75 p-2.5 shadow-sm transition group-hover:scale-105"><Icon size={20} /></span>
        <span className="mt-3 block text-[13px] font-semibold text-muted-foreground">{title}</span>
        <strong className="mt-0.5 block text-[30px] font-black leading-none tracking-tight text-foreground"><span className="task-count-number" data-value={Number(parts[0]) || 0}>{parts[0]}</span>{parts[1] && <span className="text-base font-semibold text-muted-foreground"> / {parts[1]}</span>}</strong>
        <small className={`mt-2 block text-[11px] ${trend == null ? "text-muted-foreground" : good ? "text-success" : "text-danger"}`}>{trend == null ? "Current period" : `${trend > 0 ? "↑ " : trend < 0 ? "↓ " : ""}${Math.abs(trend)}% vs previous period`}</small>
      </span>
      <span aria-hidden="true" className="ml-2 flex h-16 w-24 items-end justify-end gap-1.5 self-end">{spark.slice(-8).map((value, index) => <i key={index} className="task-spark-bar w-2 rounded-t-full bg-current opacity-35" style={{ height: `${Math.max(12, value / max * 100)}%` }} />)}</span>
    </button>
  );
}
