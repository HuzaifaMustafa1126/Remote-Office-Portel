import { Inbox } from "lucide-react";
export default function EmptyState({
  title = "Nothing here yet",
  description = "No records were found.",
}) {
  return (
    <div className="grid place-items-center gap-2 p-12 text-center">
      <Inbox className="text-muted-foreground" size={40} />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
