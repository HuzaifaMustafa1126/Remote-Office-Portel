export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}) {
  const colors = {
    indigo: "bg-primary-soft text-primary-text",
    emerald: "bg-success-soft text-success",
    slate: "bg-surface-secondary text-muted-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div
        className={`mb-5 grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
