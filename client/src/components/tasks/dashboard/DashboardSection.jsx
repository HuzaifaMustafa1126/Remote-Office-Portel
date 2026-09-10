export default function DashboardSection({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`dashboard-section min-w-0 rounded-[18px] border border-border bg-surface p-5 shadow-[0_16px_42px_-30px_rgba(15,23,42,.45)] transition duration-300 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-[-.01em]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
