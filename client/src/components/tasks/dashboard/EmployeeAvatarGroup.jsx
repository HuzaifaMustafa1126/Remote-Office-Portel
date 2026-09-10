const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
export default function EmployeeAvatarGroup({ names = [] }) {
  const shown = names.filter(Boolean).slice(0, 3);
  if (!shown.length)
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex items-center">
      {shown.map((name, i) => (
        <span
          key={name + i}
          title={name}
          className="-ml-1 first:ml-0 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-foreground text-[9px] font-bold text-background"
        >
          {initials(name)}
        </span>
      ))}
      {names.length > 3 && (
        <span className="-ml-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-surface-secondary text-[9px] font-bold">
          +{names.length - 3}
        </span>
      )}
    </div>
  );
}
