export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`mb-5 grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
