import { useCallback, useEffect, useState } from "react";
import Button from "../common/Button";
import * as api from "../../services/dayEndReport.service";
import { errorMessage } from "../../utils/helpers";

const stamp = (value) =>
  new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function ReportDiscussion({ reportId }) {
  const [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      api
        .getReplies(reportId, { page, limit: 50 })
        .then(setData)
        .catch((e) => setError(errorMessage(e))),
    [reportId, page],
  );
  useEffect(() => {
    load();
  }, [load]);
  const submit = async (event) => {
    event.preventDefault();
    const clean = message.trim();
    if (!clean) return;
    setSending(true);
    setError("");
    try {
      await api.sendReply(reportId, clean);
      setMessage("");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="border-t border-border pt-5">
      <h3 className="font-black">Discussion</h3>
      <p className="text-xs text-muted-foreground">
        Discussion remains available after management review.
      </p>
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
        {!data?.items?.length && (
          <p className="rounded-xl bg-surface-secondary p-4 text-sm text-muted-foreground">
            No replies yet.
          </p>
        )}
        {data?.items?.map((reply) => (
          <article
            key={reply.id}
            className="rounded-xl border border-border p-3"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <b>{reply.authorName}</b>
              <span className="text-xs text-muted-foreground">
                {stamp(reply.createdAt)}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase text-primary-text">
              {reply.authorRole}
            </span>
            <p className="mt-2 whitespace-pre-wrap text-sm">{reply.message}</p>
          </article>
        ))}
      </div>
      {(data?.pagination?.totalPages || 1) > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((x) => x - 1)}
          >
            Previous
          </Button>
          <span className="text-xs">
            {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((x) => x + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <form className="mt-4" onSubmit={submit}>
        <textarea
          value={message}
          maxLength={2000}
          rows={3}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a reply…"
          className="w-full resize-y rounded-xl border border-border bg-surface p-3 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {message.length} / 2000
          </span>
          <Button type="submit" disabled={sending || !message.trim()}>
            {sending ? "Sending…" : "Send Reply"}
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
