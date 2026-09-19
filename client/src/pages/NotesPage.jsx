import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Archive,
  Check,
  Copy,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Image,
  Info,
  Lock,
  MoreVertical,
  Pencil,
  Pin,
  Plus,
  Search,
  RotateCcw,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import * as api from "../services/note.service";
import { getTask } from "../services/task.service";
import { errorMessage, initials } from "../utils/helpers";
const remembered = (k) => sessionStorage.getItem("notes." + k) || "";
const empty = {
    title: "",
    summary: "",
    content: "",
    visibility: "TEAM",
    isImportant: false,
  },
  stamp = (v) =>
    new Intl.DateTimeFormat("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(v)),
  labels = {
    TEAM: "All Team Members",
    PRIVATE: "Private",
    CEO_ONLY: "Only CEO",
  };
export default function NotesPage() {
  const { user } = useAuth(),
    { reconcile: reconcileNotifications } = useNotifications(),
    navigate = useNavigate(),
    { noteId } = useParams(),
    [urlParams, setUrlParams] = useSearchParams(),
    [search, setSearch] = useState(() => remembered("search")),
    [query, setQuery] = useState(""),
    [visibility, setVisibility] = useState(() => remembered("visibility")),
    [importance, setImportance] = useState(() => remembered("importance")),
    [source, setSource] = useState(() => remembered("source")),
    [tab, setTab] = useState(
      () => sessionStorage.getItem("notes.tab") || "ALL",
    ),
    [author, setAuthor] = useState(() => remembered("author")),
    [dateRange, setDateRange] = useState(
      () => remembered("dateRange") || "ALL",
    ),
    [startDate, setStartDate] = useState(() => remembered("startDate")),
    [endDate, setEndDate] = useState(() => remembered("endDate")),
    [sort, setSort] = useState(() => remembered("sort") || "NEWEST"),
    [authors, setAuthors] = useState([]),
    [data, setData] = useState({ rows: [], pagination: { page: 1, pages: 1 } }),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(null),
    [menuId, setMenuId] = useState(null),
    [exportOpen, setExportOpen] = useState(false),
    [exporting, setExporting] = useState(false),
    [confirmation, setConfirmation] = useState(null),
    [actionBusy, setActionBusy] = useState(false),
    [notice, setNotice] = useState("");
  const loadVersion = useRef(0);
  useEffect(() => {
    const closeMenus = () => {
      setMenuId(null);
      setExportOpen(false);
    };
    const key = (event) => event.key === "Escape" && closeMenus();
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", closeMenus);
      document.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const load = useCallback(() => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    api
      .listNotes({
        search: query || undefined,
        visibility: visibility || undefined,
        importance: importance || undefined,
        source: source || undefined,
        tab,
        authorEmployeeId: author || undefined,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort,
        page,
        limit: 20,
      })
      .then((result) => version === loadVersion.current && setData(result))
      .catch(
        (e) => version === loadVersion.current && setError(errorMessage(e)),
      )
      .finally(() => version === loadVersion.current && setLoading(false));
  }, [
    query,
    visibility,
    importance,
    source,
    tab,
    author,
    dateRange,
    startDate,
    endDate,
    sort,
    page,
  ]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api
      .listNoteAuthors()
      .then(setAuthors)
      .catch(() => {});
  }, []);
  useEffect(() => {
    Object.entries({
      tab,
      search,
      visibility,
      importance,
      source,
      author,
      dateRange,
      startDate,
      endDate,
      sort,
    }).forEach(([k, v]) => sessionStorage.setItem("notes." + k, v));
  }, [
    tab,
    search,
    visibility,
    importance,
    source,
    author,
    dateRange,
    startDate,
    endDate,
    sort,
  ]);
  useEffect(() => {
    if (noteId)
      api
        .getNote(noteId, tab === "ARCHIVED")
        .then((note) => {
          setSelected(note);
          reconcileNotifications().catch(() => {});
        })
        .catch((e) => {
          setError(
            e?.response?.status === 403
              ? "This note is no longer available to you."
              : "This note is no longer available.",
          );
          navigate("/notes", { replace: true });
        });
  }, [noteId, navigate, reconcileNotifications, tab]);
  useEffect(() => {
    const taskId = Number(urlParams.get("task"));
    if (!taskId) return;
    getTask(taskId)
      .then((task) => {
        if (task.status === "COMPLETED")
          setEditing({ ...empty, title: task.title, relatedTaskId: task.id });
      })
      .catch(() => {})
      .finally(() => setUrlParams({}, { replace: true }));
  }, [urlParams, setUrlParams]);
  const open = (n) => navigate(`/notes/${n.id}`),
    close = () => {
      setSelected(null);
      navigate("/notes");
    };
  const exportSelection = async (mode) => {
    setExportOpen(false);
    setExporting(true);
    setNotice("");
    try {
      const filtered = {
        search: query || undefined,
        tab,
        visibility: visibility || undefined,
        importance: importance || undefined,
        source: source || undefined,
        authorEmployeeId: author || undefined,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort,
      };
      const { blob, filename } = await api.exportNotes({
        ...(mode === "FILTERED" ? filtered : {}),
        mode,
      });
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Notes exported successfully.");
    } catch (e) {
      setNotice(
        e.exportMessage === "No notes available to export."
          ? e.exportMessage
          : "Unable to export. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };
  const completeAction = async () => {
    const { kind, note } = confirmation;
    setActionBusy(true);
    setNotice("");
    try {
      if (kind === "archive") await api.archiveNote(note.id);
      else await api.deleteNote(note.id);
      setNotice(
        kind === "archive"
          ? "Note archived successfully."
          : "Note deleted permanently.",
      );
      setConfirmation(null);
      setSelected(null);
      if (data.rows.length === 1 && page > 1) setPage((value) => value - 1);
      else load();
    } catch (error) {
      const status = error.response?.status;
      if (status === 403)
        setNotice(
          kind === "archive"
            ? "You don't have permission to archive this note."
            : "You don't have permission to delete this note.",
        );
      else if (status === 404) setNotice("Note not found.");
      else
        setNotice(
          kind === "archive"
            ? "Unable to archive note. Please try again."
            : "Unable to delete note. Please try again.",
        );
    } finally {
      setActionBusy(false);
    }
  };
  const restore = async (note) => {
    if (actionBusy) return;
    setMenuId(null);
    setActionBusy(true);
    try {
      await api.restoreNote(note.id);
      setNotice("Note restored successfully.");
      if (data.rows.length === 1 && page > 1) setPage((value) => value - 1);
      else load();
    } catch (error) {
      setNotice(
        error.response?.status === 403
          ? "You don't have permission to restore this note."
          : error.response?.status === 404
            ? "Note not found."
            : "Unable to restore note. Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-[1450px] space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of important work information and updates.
          </p>
        </div>
        <Button
          onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-2 !bg-success hover:!brightness-95"
        >
          <Plus size={17} />
          Add Note
        </Button>
      </header>
      <nav
        className="flex overflow-x-auto border-b border-border"
        aria-label="Note views"
      >
        {[
          ["ALL", "All Notes"],
          ["MY", "My Notes"],
          ["IMPORTANT", "Important"],
          ["PINNED", "Pinned"],
          ["TASK", "Task Notes"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => {
              setTab(v);
              setPage(1);
            }}
            className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${tab === v ? "text-success after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-success" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setTab("ARCHIVED");
            setPage(1);
          }}
          className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${tab === "ARCHIVED" ? "text-success after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-success" : "text-muted-foreground hover:text-foreground"}`}
        >
          Archived
        </button>
      </nav>
      <section className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1 xl:max-w-[360px]">
          <Search
            size={17}
            className="absolute left-3.5 top-3.5 text-muted-foreground"
          />
          <input
            aria-label="Search notes"
            className="input mt-0 h-11 pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search notes..."
          />
        </label>
        <CompactFilter
          label="Visibility"
          icon={Eye}
          value={visibility}
          setValue={setVisibility}
          setPage={setPage}
          options={[
            ["", "All visibility"],
            ["TEAM", "All Team Members"],
            ["PRIVATE", "Private"],
            ["CEO_ONLY", "Only CEO"],
          ]}
        />
        <CompactFilter
          label="Importance"
          icon={Star}
          value={importance}
          setValue={setImportance}
          setPage={setPage}
          options={[
            ["", "All importance"],
            ["IMPORTANT", "Important"],
            ["NORMAL", "Normal"],
          ]}
        />
        <CompactFilter
          label="Source"
          icon={FileText}
          value={source}
          setValue={setSource}
          setPage={setPage}
          options={[
            ["", "All sources"],
            ["GENERAL", "General Notes"],
            ["TASK", "Task Notes"],
          ]}
        />
        <CompactFilter
          label="Date"
          icon={CalendarDays}
          value={dateRange}
          setValue={setDateRange}
          setPage={setPage}
          options={[
            ["ALL", "All time"],
            ["TODAY", "Today"],
            ["WEEK", "This week"],
            ["MONTH", "This month"],
            ["CUSTOM", "Custom range"],
          ]}
        />
        <CompactFilter
          label="Sort"
          value={sort}
          setValue={setSort}
          setPage={setPage}
          options={[
            ["NEWEST", "Newest First"],
            ["OLDEST", "Oldest First"],
            ["UPDATED", "Recently Updated"],
            ["IMPORTANT", "Important First"],
          ]}
        />
        <span className="relative ml-auto">
          <button
            type="button"
            disabled={exporting}
            onClick={(e) => {
              e.stopPropagation();
              setExportOpen((value) => !value);
              setMenuId(null);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-success/40 px-3.5 text-sm font-semibold text-success disabled:opacity-55"
          >
            <Download size={16} />
            {exporting ? "Exporting..." : "Export"}
            <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <span
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl"
            >
              {[
                ["ALL", "Export All Accessible Notes"],
                ["MY", "Export My Notes"],
                ["IMPORTANT", "Export Important Notes"],
                ["TASK", "Export Task Notes"],
                ["FILTERED", "Export Current Filtered Results"],
                ...(tab === "ARCHIVED"
                  ? [["ARCHIVED", "Export Archived Notes"]]
                  : []),
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => exportSelection(mode)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-surface-secondary"
                >
                  {label}
                </button>
              ))}
            </span>
          )}
        </span>
      </section>
      {notice && (
        <div
          role="status"
          className={`notification-toast fixed right-5 top-5 z-[70] max-w-sm rounded-xl border border-border px-4 py-3 text-sm shadow-xl ${notice.includes("successfully") ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
        >
          {notice}
        </div>
      )}
      {dateRange === "CUSTOM" && (
        <section className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
          <label className="text-xs font-semibold">
            Start Date
            <input
              aria-label="Start date"
              type="date"
              className="input mt-1"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="text-xs font-semibold">
            End Date
            <input
              aria-label="End date"
              type="date"
              min={startDate}
              className="input mt-1"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </section>
      )}
      {error ? (
        <Empty
          title="Unable to load notes."
          detail={error}
          action="Try Again"
          onAction={load}
        />
      ) : loading ? (
        <NoteListSkeleton />
      ) : data.rows.length ? (
        <section className="space-y-3">
          {data.rows.map((n, index) => (
            <article
              key={n.id}
              className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface p-4 shadow-sm transition hover:border-success/30 hover:shadow-md md:flex-row md:items-center"
            >
              <button
                onClick={() => open(n)}
                className="flex min-w-0 flex-1 items-start gap-4 text-left"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${["bg-success-soft text-success", "bg-info-soft text-info", "bg-primary-soft text-primary-text"][index % 3]}`}
                >
                  <FileText size={22} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-[15px]">{n.title}</strong>
                    {n.isPinned && (
                      <Pin
                        size={14}
                        className="shrink-0 fill-primary text-primary"
                      />
                    )}
                    {n.isImportant && (
                      <Star
                        size={15}
                        className="shrink-0 fill-warning text-warning"
                      />
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                    {n.summary}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    {n.imageCount > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Image size={14} />
                        {n.imageCount} image{n.imageCount === 1 ? "" : "s"}
                      </span>
                    )}
                    {n.replyCount > 0 && (
                      <span className="text-muted-foreground">
                        {n.replyCount} repl{n.replyCount === 1 ? "y" : "ies"}
                      </span>
                    )}
                    {n.relatedTaskTitle && (
                      <span className="max-w-[330px] truncate text-primary-text">
                        ↗ Related Task: {n.relatedTaskTitle}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-3 md:w-[450px] md:flex-nowrap md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary-text">
                    {initials(n.authorName)}
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate text-xs">{n.authorName}</b>
                    <small className="block truncate text-[10px] text-muted-foreground">
                      {stamp(n.createdAt)}
                    </small>
                  </span>
                </span>
                <VisibilityBadge value={n.visibility} />
                {n.isNew && (
                  <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary-text">
                    New
                  </span>
                )}
                <button
                  onClick={() => open(n)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-secondary"
                >
                  View
                </button>
                <span className="relative">
                  <button
                    type="button"
                    aria-label={`Actions for ${n.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId(menuId === n.id ? null : n.id);
                      setExportOpen(false);
                    }}
                    className="rounded-lg p-2 hover:bg-surface-secondary"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuId === n.id && (
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl"
                    >
                      <MenuAction
                        Icon={Eye}
                        label="View"
                        onClick={() => {
                          setMenuId(null);
                          open(n);
                        }}
                      />
                      {tab !== "ARCHIVED" &&
                        Number(n.authorUserId) === Number(user.id) && (
                          <MenuAction
                            Icon={Pencil}
                            label="Edit"
                            onClick={async () => {
                              setMenuId(null);
                              try {
                                setEditing(await api.getNote(n.id));
                              } catch {
                                setNotice(
                                  "Unable to open this note for editing.",
                                );
                              }
                            }}
                          />
                        )}
                      <span className="my-1 block border-t border-border" />
                      {tab === "ARCHIVED" ? (
                        <>
                          <MenuAction
                            Icon={RotateCcw}
                            label="Restore"
                            onClick={() => restore(n)}
                          />
                          <MenuAction
                            Icon={Trash2}
                            label="Delete Permanently"
                            danger
                            onClick={() => {
                              setMenuId(null);
                              setConfirmation({ kind: "delete", note: n });
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <MenuAction
                            Icon={Pin}
                            label={n.isPinned ? "Unpin" : "Pin"}
                            onClick={async () => {
                              if (actionBusy) return;
                              setMenuId(null);
                              setActionBusy(true);
                              try {
                                await api.toggleNotePin(n.id);
                                load();
                              } catch {
                                setNotice(
                                  "Unable to update this pin. Please try again.",
                                );
                              } finally {
                                setActionBusy(false);
                              }
                            }}
                          />
                          {Number(n.authorUserId) === Number(user.id) && (
                            <>
                              <MenuAction
                                Icon={Archive}
                                label="Archive"
                                onClick={() => {
                                  setMenuId(null);
                                  setConfirmation({ kind: "archive", note: n });
                                }}
                              />
                              <MenuAction
                                Icon={Trash2}
                                label="Delete"
                                danger
                                onClick={() => {
                                  setMenuId(null);
                                  setConfirmation({ kind: "delete", note: n });
                                }}
                              />
                            </>
                          )}
                        </>
                      )}
                    </span>
                  )}
                </span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <Empty
          title={
            query || visibility || importance || source || dateRange !== "ALL"
              ? "No matching notes found."
              : tab === "PINNED"
                ? "No pinned notes yet."
                : tab === "TASK"
                  ? "No task notes yet."
                  : tab === "IMPORTANT"
                    ? "No important notes yet."
                    : tab === "MY"
                      ? "You have not created any notes yet."
                      : tab === "ARCHIVED"
                        ? "No archived notes yet."
                        : "No notes yet"
          }
          detail={
            query || visibility || importance || source || dateRange !== "ALL"
              ? "Try changing your search or filters."
              : "Create your first note to keep track of important work information."
          }
          action="Add Note"
          onAction={() => setEditing({ ...empty })}
        />
      )}
      {!loading && !error && data.pagination.total > 0 && (
        <footer className="flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Showing {(page - 1) * data.pagination.limit + 1}–
            {Math.min(page * data.pagination.limit, data.pagination.total)} of{" "}
            {data.pagination.total} notes
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            {notePages(page, data.pagination.pages).map((number) => (
              <button
                key={number}
                onClick={() => setPage(number)}
                className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-bold ${number === page ? "border-success bg-success text-white" : "border-border bg-surface"}`}
              >
                {number}
              </button>
            ))}
            <button
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      )}
      {editing && (
        <Editor
          note={editing}
          author={user.name}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            load();
            setSelected(saved);
            navigate(`/notes/${saved.id}`);
          }}
        />
      )}
      {selected && (
        <Detail
          note={selected}
          currentUserId={user.id}
          targetReplyId={Number(urlParams.get("reply")) || null}
          onPin={async () => {
            if (actionBusy) return;
            setActionBusy(true);
            try {
              await api.toggleNotePin(selected.id);
              const fresh = await api.getNote(selected.id);
              setSelected(fresh);
              load();
            } catch {
              setNotice("Unable to update this pin. Please try again.");
            } finally {
              setActionBusy(false);
            }
          }}
          own={Number(selected.authorUserId) === Number(user.id)}
          onClose={close}
          onEdit={() => setEditing(selected)}
          onRefresh={() => api.getNote(selected.id).then(setSelected)}
        />
      )}
      <Modal
        open={Boolean(confirmation)}
        title={
          confirmation?.kind === "archive" ? "Archive Note?" : "Delete Note?"
        }
        onClose={() => !actionBusy && setConfirmation(null)}
      >
        <p className="text-sm text-muted-foreground">
          {confirmation?.kind === "archive" ? (
            "This note will be moved to Archived and can be restored later."
          ) : (
            <>
              Are you sure you want to permanently delete:{" "}
              <strong className="text-foreground">
                {confirmation?.note.title}
              </strong>
              ? This action cannot be undone.
            </>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={actionBusy}
            onClick={() => setConfirmation(null)}
          >
            Cancel
          </Button>
          <Button
            variant={confirmation?.kind === "delete" ? "danger" : "primary"}
            disabled={actionBusy}
            onClick={completeAction}
          >
            {actionBusy
              ? "Working..."
              : confirmation?.kind === "archive"
                ? "Archive"
                : "Delete Permanently"}
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function MenuAction({ Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-surface-secondary ${danger ? "text-danger" : "text-foreground"}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function CompactFilter({
  label,
  icon: Icon,
  value,
  setValue,
  setPage,
  options,
}) {
  return (
    <label className="relative inline-flex h-11 items-center rounded-xl border border-border bg-surface pl-3 text-muted-foreground">
      {Icon && <Icon size={15} />}
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setPage(1);
        }}
        className="h-full max-w-[154px] appearance-none bg-transparent py-0 pl-2 pr-7 text-sm font-semibold text-foreground outline-none"
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {label === "Sort" ? `Sort: ${text}` : text}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2" />
    </label>
  );
}
function VisibilityBadge({ value }) {
  const styles = {
      TEAM: "bg-success-soft text-success",
      PRIVATE: "bg-info-soft text-info",
      CEO_ONLY: "bg-primary-soft text-primary-text",
    },
    Icon = value === "TEAM" ? Users : value === "PRIVATE" ? Lock : ShieldCheck;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-bold ${styles[value]}`}
    >
      <Icon size={13} />
      {labels[value]}
    </span>
  );
}
function NoteListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((x) => (
        <div
          key={x}
          className="flex h-24 animate-pulse items-center gap-4 rounded-[14px] border border-border bg-surface p-4"
        >
          <i className="h-12 w-12 rounded-xl bg-surface-secondary" />
          <span className="flex-1 space-y-2">
            <i className="block h-4 w-1/3 rounded bg-surface-secondary" />
            <i className="block h-3 w-2/3 rounded bg-surface-secondary" />
          </span>
        </div>
      ))}
    </div>
  );
}
function notePages(page, pages) {
  const start = Math.max(1, Math.min(page - 2, pages - 4)),
    end = Math.min(pages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function Empty({ title, detail, action, onAction }) {
  return (
    <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-surface text-center">
      <div>
        <h2 className="font-bold">{title}</h2>
        {detail && (
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        )}
        <Button className="mt-4" onClick={onAction}>
          {action}
        </Button>
      </div>
    </section>
  );
}
function Editor({ note, author, onClose, onSaved }) {
  const initial = useRef({ ...empty, ...note }),
    fileInput = useRef(null);
  const [form, setForm] = useState(initial.current),
    [files, setFiles] = useState([]),
    [removed, setRemoved] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dragging, setDragging] = useState(false),
    [createdId, setCreatedId] = useState(null);
  const dirty =
    files.length > 0 ||
    removed.length > 0 ||
    JSON.stringify(form) !== JSON.stringify(initial.current);
  const requestClose = useCallback(() => {
    if (!dirty || window.confirm("Discard your unsaved Note changes?"))
      onClose();
  }, [dirty, onClose]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e) => {
      if (e.key === "Escape" && !busy) requestClose();
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
    };
  }, [busy, requestClose]);
  const addFiles = (list) => {
    const next = [...list].filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 5242880,
    );
    setFiles((current) => [...current, ...next].slice(0, 8));
  };
  const pick = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          visibility: form.visibility,
          isImportant: form.isImportant,
          relatedTaskId: form.relatedTaskId || null,
          ...(note.id ? { notifyViewers: Boolean(form.notifyViewers) } : {}),
        },
        initialSaved = note.id
          ? await api.updateNote(note.id, payload)
          : createdId
            ? await api.updateNote(createdId, {
                ...payload,
                notifyViewers: false,
              })
            : await api.createNote(payload);
      if (!note.id && !createdId) setCreatedId(initialSaved.id);
      for (const id of removed) await api.removeImage(initialSaved.id, id);
      for (const file of [...files]) {
        await api.uploadImage(initialSaved.id, file);
        setFiles((current) => current.filter((item) => item !== file));
      }
      const saved = note.id
        ? initialSaved
        : await api.publishNoteNotifications(initialSaved.id);
      onSaved(saved);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const visibilityOptions = [
    {
      value: "TEAM",
      title: "All Team Members",
      detail: "Visible to all team members",
      Icon: Users,
    },
    {
      value: "PRIVATE",
      title: "Private",
      detail: "Only you can see this note",
      Icon: Lock,
    },
    {
      value: "CEO_ONLY",
      title: "Only CEO",
      detail: "Visible to you and CEO only",
      Icon: ShieldCheck,
    },
  ];
  return (
    <div
      className="note-editor-backdrop fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.45)] p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) requestClose();
      }}
    >
      <form
        onSubmit={save}
        className="note-editor-modal flex max-h-[92vh] w-full max-w-[930px] flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        aria-modal="true"
        role="dialog"
        aria-labelledby="note-editor-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
              <FileText size={20} />
            </span>
            <div>
              <h2
                id="note-editor-title"
                className="text-lg font-bold text-foreground sm:text-xl"
              >
                {note.id ? "Edit Note" : "Add New Note"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Write and save important information about your work.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close note editor"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-secondary hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <CounterField label="Note Title" count={form.title.length} max={200}>
            <input
              required
              autoFocus
              minLength="2"
              maxLength="200"
              className="input mt-1.5 h-11"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter a clear and descriptive title..."
            />
          </CounterField>
          <CounterField label="Summary" count={form.summary.length} max={300}>
            <textarea
              required
              maxLength="300"
              rows="2"
              className="input mt-1.5 min-h-[70px] resize-none"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Write a short summary..."
            />
          </CounterField>
          <label className="block text-xs font-semibold text-foreground">
            Note Content <span className="text-danger">*</span>
            <textarea
              required
              maxLength="50000"
              rows="5"
              className="input mt-1.5 min-h-[140px] resize-y"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write the full details of your note..."
            />
          </label>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
            <fieldset>
              <legend className="text-xs font-semibold">
                Visibility <span className="text-danger">*</span>
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {visibilityOptions.map(({ value, title, detail, Icon }) => {
                  const selected = form.visibility === value;
                  return (
                    <label
                      key={value}
                      className={`relative flex min-h-[78px] cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition ${selected ? "border-success bg-success-soft" : "border-border bg-surface hover:bg-surface-secondary"}`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="visibility"
                        checked={selected}
                        onChange={() => setForm({ ...form, visibility: value })}
                      />
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? "bg-surface text-success" : "bg-surface-secondary text-muted-foreground"}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold">{title}</span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                          {detail}
                        </span>
                      </span>
                      <span
                        className={`absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full border ${selected ? "border-success bg-success text-white" : "border-border"}`}
                      >
                        {selected && <Check size={10} />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <section>
              <h3 className="text-xs font-semibold">Important Note</h3>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) =>
                    setForm({ ...form, isImportant: e.target.checked })
                  }
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted transition peer-checked:bg-success after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                <span className="text-sm font-semibold">
                  <Star
                    size={15}
                    className={`mr-1 inline ${form.isImportant ? "fill-warning text-warning" : "text-muted-foreground"}`}
                  />
                  Mark as Important
                </span>
              </label>
              <p className="ml-14 mt-1 text-[11px] leading-4 text-muted-foreground">
                Important notes will be easier to find later.
              </p>
            </section>
          </div>
          <section>
            <h3 className="text-xs font-semibold">Images</h3>
            <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`grid min-h-[132px] place-items-center rounded-xl border border-dashed p-4 text-center transition ${dragging ? "border-success bg-success-soft" : "border-border bg-surface hover:border-success hover:bg-success-soft/40"}`}
              >
                <span>
                  <Upload size={24} className="mx-auto text-success" />
                  <span className="mt-2 block text-sm font-bold">
                    Click to upload images
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    or drag and drop
                  </span>
                  <span className="mt-2 block text-[10px] text-muted-foreground">
                    JPG, JPEG, PNG, WEBP · Max 5MB per image
                  </span>
                </span>
              </button>
              <input
                ref={fileInput}
                hidden
                multiple
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={pick}
              />
              <aside className="rounded-xl border border-info-border bg-info-soft p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-info-foreground">
                  <Info size={15} />
                  Supported Formats
                </h4>
                <ul className="mt-2 space-y-1.5 text-[11px] text-info-foreground">
                  {[
                    "JPG / JPEG",
                    "PNG",
                    "WEBP",
                    "Maximum 5MB per image",
                    "Multiple images allowed",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check size={13} />
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
            {((note.images || []).some((x) => !removed.includes(x.id)) ||
              files.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(note.images || [])
                  .filter((x) => !removed.includes(x.id))
                  .map((x) => (
                    <ImagePreview
                      key={x.id}
                      name={x.originalFilename}
                      onRemove={() => setRemoved((r) => [...r, x.id])}
                    >
                      <NoteImage
                        noteId={note.id}
                        imageId={x.id}
                        alt={x.originalFilename}
                      />
                    </ImagePreview>
                  ))}
                {files.map((f, i) => (
                  <ImagePreview
                    key={`${f.name}-${i}`}
                    name={f.name}
                    onRemove={() =>
                      setFiles((x) => x.filter((_, j) => j !== i))
                    }
                  >
                    <LocalImage file={f} />
                  </ImagePreview>
                ))}
              </div>
            )}
          </section>
          {note.id && (
            <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold">
              <input
                type="checkbox"
                checked={Boolean(form.notifyViewers)}
                onChange={(e) =>
                  setForm({ ...form, notifyViewers: e.target.checked })
                }
              />
              Notify viewers about this update
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
              {initials(author)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Created by</p>
              <p className="truncate text-sm font-bold">{author}</p>
              <p className="text-[10px] text-muted-foreground">
                Your name will be saved automatically
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={requestClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              disabled={busy}
              className="inline-flex items-center gap-2 !bg-success hover:!brightness-95"
            >
              <Send size={15} />
              {busy ? "Saving..." : note.id ? "Save Changes" : "Publish Note"}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
function CounterField({ label, count, max, children }) {
  return (
    <label className="block text-xs font-semibold text-foreground">
      {label} <span className="text-danger">*</span>
      {children}
      <span className="mt-1 block text-right text-[10px] font-normal text-muted-foreground">
        {count}/{max}
      </span>
    </label>
  );
}
function ImagePreview({ name, onRemove, children }) {
  return (
    <span className="relative w-28 overflow-hidden rounded-xl border border-border bg-surface-secondary p-1.5 text-xs">
      <span className="block aspect-video overflow-hidden rounded-lg [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
        {children}
      </span>
      <span className="mt-1 block truncate px-1" title={name}>
        {name}
      </span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
      >
        <X size={12} />
      </button>
    </span>
  );
}
function Detail({
  note,
  own,
  currentUserId,
  targetReplyId,
  onClose,
  onEdit,
  onPin,
}) {
  const [preview, setPreview] = useState(null),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const show = async (image) => {
    const blob = await api.imageBlob(note.id, image.id);
    setPreview(URL.createObjectURL(blob));
  };
  return (
    <div className="fixed inset-0 z-50 bg-overlay/50">
      <article className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-surface shadow-2xl">
        <header className="flex justify-between border-b p-5">
          <div>
            <div className="flex gap-2">
              <span className="rounded-full bg-surface-secondary px-2 py-1 text-[10px]">
                {labels[note.visibility]}
              </span>
              {note.isImportant && (
                <Star size={16} className="fill-warning text-warning" />
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold">{note.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{note.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            {!note.isArchived && (
              <button
                onClick={onPin}
                aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                className="rounded-lg border border-border p-2"
              >
                <Pin
                  size={18}
                  className={
                    note.isPinned
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }
                />
              </button>
            )}
            <button onClick={onClose} aria-label="Close note details">
              <X />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <p className="whitespace-pre-wrap text-sm leading-7">
            {note.content}
          </p>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Visibility
              </p>
              <p className="mt-1 text-sm font-semibold">
                {note.visibility === "TEAM"
                  ? "👥"
                  : note.visibility === "CEO_ONLY"
                    ? "♛"
                    : "🔒"}{" "}
                {labels[note.visibility]}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/notes/${note.id}`,
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              <Copy size={14} className="mr-1 inline" />
              {copied ? "Link Copied" : "Copy Note Link"}
            </Button>
          </section>
          {note.relatedTaskId && (
            <section className="rounded-xl bg-primary-soft p-4">
              <p className="text-xs font-bold uppercase text-primary-text">
                Related Task
              </p>
              <p className="mt-1 text-sm font-semibold">
                {note.relatedTaskTitle}
              </p>
              <Link
                to={`/tasks?task=${note.relatedTaskId}`}
                className="mt-2 inline-block text-xs font-bold text-primary-text"
              >
                View Task →
              </Link>
            </section>
          )}
          <div className="text-xs text-muted-foreground">
            <p>Created by: {note.authorName}</p>
            <p>Created: {stamp(note.createdAt)}</p>
            {note.updatedAt !== note.createdAt && (
              <p>Updated: {stamp(note.updatedAt)}</p>
            )}
          </div>
          {note.images.length > 0 && (
            <section>
              <h2 className="text-sm font-bold">Images</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {note.images.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => show(x)}
                    className="overflow-hidden rounded-xl bg-surface-secondary"
                  >
                    <NoteImage
                      noteId={note.id}
                      imageId={x.id}
                      alt={x.originalFilename}
                      className="aspect-video w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
          <NoteReplies
            note={note}
            currentUserId={currentUserId}
            targetReplyId={targetReplyId}
          />
        </div>
        {own && !note.isArchived && (
          <footer className="flex justify-end border-t p-4">
            <Button onClick={onEdit}>Edit Note</Button>
          </footer>
        )}
      </article>
      {preview && (
        <button
          type="button"
          aria-label="Close image preview"
          className="absolute inset-0 z-10 grid place-items-center bg-black/80 p-6"
          onClick={() => {
            URL.revokeObjectURL(preview);
            setPreview(null);
          }}
        >
          <img
            src={preview}
            alt="Note attachment preview"
            className="max-h-full max-w-full object-contain"
          />
        </button>
      )}
    </div>
  );
}

function NoteReplies({ note, currentUserId, targetReplyId }) {
  const [replies, setReplies] = useState([]),
    [people, setPeople] = useState([]),
    [content, setContent] = useState(""),
    [mentionIds, setMentionIds] = useState([]),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [removeReply, setRemoveReply] = useState(null),
    [highlighted, setHighlighted] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    return api
      .listNoteReplies(note.id, note.isArchived)
      .then(setReplies)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [note.id, note.isArchived]);
  const searchPeople = useCallback(
    (search) => {
      if (note.isArchived) return;
      api
        .listMentionableNoteUsers(note.id, search)
        .then((found) =>
          setPeople((current) => {
            const merged = new Map(
              current.map((person) => [Number(person.userId), person]),
            );
            found.forEach((person) =>
              merged.set(Number(person.userId), person),
            );
            return [...merged.values()];
          }),
        )
        .catch(() => {});
    },
    [note.id, note.isArchived],
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (note.isArchived) return;
    api
      .listMentionableNoteUsers(note.id)
      .then(setPeople)
      .catch(() => {});
  }, [note.id, note.isArchived]);
  useEffect(() => {
    if (
      !targetReplyId ||
      loading ||
      !replies.some((reply) => Number(reply.id) === Number(targetReplyId))
    )
      return;
    const element = document.getElementById(`note-reply-${targetReplyId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(Number(targetReplyId));
    const timer = setTimeout(() => setHighlighted(null), 1800);
    return () => clearTimeout(timer);
  }, [targetReplyId, loading, replies]);
  const submit = async () => {
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const selected = mentionIds.filter((id) =>
        content.includes(
          `@${people.find((person) => Number(person.userId) === Number(id))?.name}`,
        ),
      );
      const created = await api.createNoteReply(note.id, {
        content: content.trim(),
        mentionUserIds: selected,
      });
      setReplies((items) => [...items, created]);
      setContent("");
      setMentionIds([]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const saveEdit = async () => {
    if (!editing?.content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const ids = editing.mentionIds.filter((id) =>
        editing.content.includes(
          `@${people.find((person) => Number(person.userId) === Number(id))?.name}`,
        ),
      );
      const saved = await api.updateNoteReply(note.id, editing.id, {
        content: editing.content.trim(),
        mentionUserIds: ids,
      });
      setReplies((items) =>
        items.map((item) => (item.id === saved.id ? saved : item)),
      );
      setEditing(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (!removeReply || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteNoteReply(note.id, removeReply.id);
      setReplies((items) => items.filter((item) => item.id !== removeReply.id));
      setRemoveReply(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Replies</h2>
        <span className="text-xs text-muted-foreground">{replies.length}</span>
      </div>
      {loading ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading replies...</p>
      ) : replies.length === 0 ? (
        <p className="mt-3 rounded-xl bg-surface-secondary p-4 text-center text-xs text-muted-foreground">
          No replies yet.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => {
            const own = Number(reply.createdBy) === Number(currentUserId),
              activeEdit = editing?.id === reply.id;
            return (
              <article
                id={`note-reply-${reply.id}`}
                key={reply.id}
                className={`rounded-xl border p-3 transition ${highlighted === Number(reply.id) ? "border-primary bg-primary-soft" : "border-border"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary-text">
                    {initials(reply.authorName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold">
                        {reply.authorName}
                      </p>
                      {own && !note.isArchived && !activeEdit && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label="Edit reply"
                            className="rounded p-1 text-muted-foreground hover:bg-surface-secondary"
                            onClick={() =>
                              setEditing({
                                id: reply.id,
                                content: reply.content,
                                mentionIds: reply.mentions.map(
                                  (item) => item.userId,
                                ),
                              })
                            }
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete reply"
                            className="rounded p-1 text-danger hover:bg-danger-soft"
                            onClick={() => setRemoveReply(reply)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {stamp(reply.createdAt)}
                      {reply.edited ? " · Edited" : ""}
                    </p>
                    {activeEdit ? (
                      <div className="mt-2">
                        <MentionBox
                          value={editing.content}
                          onChange={(value) =>
                            setEditing((item) => ({ ...item, content: value }))
                          }
                          people={people}
                          onSearch={searchPeople}
                          onMention={(id) =>
                            setEditing((item) => ({
                              ...item,
                              mentionIds: [
                                ...new Set([...item.mentionIds, id]),
                              ],
                            }))
                          }
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setEditing(null)}
                            disabled={busy}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveEdit}
                            disabled={busy || !editing.content.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                        <MentionText
                          content={reply.content}
                          mentions={reply.mentions}
                        />
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {note.isArchived ? (
        <p className="mt-4 rounded-xl bg-surface-secondary p-3 text-xs text-muted-foreground">
          This note is archived. Replies are disabled.
        </p>
      ) : (
        <div className="mt-4">
          <MentionBox
            value={content}
            onChange={setContent}
            people={people}
            onSearch={searchPeople}
            onMention={(id) =>
              setMentionIds((items) => [...new Set([...items, id])])
            }
            placeholder="Write a reply..."
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={submit} disabled={busy || !content.trim()}>
              <Send size={14} className="mr-1 inline" />
              {busy ? "Sending..." : "Reply"}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}
      <Modal
        open={Boolean(removeReply)}
        title="Delete Reply?"
        onClose={() => !busy && setRemoveReply(null)}
      >
        <p className="text-sm text-muted-foreground">
          This reply will be removed permanently.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setRemoveReply(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" disabled={busy} onClick={confirmDelete}>
            {busy ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

function MentionBox({
  value,
  onChange,
  people,
  onSearch,
  onMention,
  placeholder,
}) {
  const match = value.match(/(?:^|\s)@([^@\n]*)$/),
    query = match?.[1]?.toLowerCase() || "";
  const choices = match
    ? people
        .filter((person) => person.name.toLowerCase().includes(query))
        .slice(0, 6)
    : [];
  useEffect(() => {
    if (!match) return;
    const timer = setTimeout(() => onSearch(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query, Boolean(match), onSearch]);
  const select = (person) => {
    const start = match.index + (/^\s/.test(match[0]) ? 1 : 0);
    onChange(`${value.slice(0, start)}@${person.name} `);
    onMention(Number(person.userId));
  };
  return (
    <div className="relative">
      <textarea
        className="input mt-0 min-h-[82px] resize-y text-sm"
        maxLength={3000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {choices.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {choices.map((person) => (
            <button
              type="button"
              key={person.userId}
              onClick={() => select(person)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-secondary"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-[9px] font-bold text-primary-text">
                {initials(person.name)}
              </span>
              <span>
                <span className="block text-xs font-bold">{person.name}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {person.role}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MentionText({ content, mentions }) {
  const names = mentions
    .map((item) => item.name)
    .sort((a, b) => b.length - a.length);
  if (!names.length) return content;
  const escaped = names.map((name) =>
    `@${name}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const parts = content.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return parts.map((part, index) =>
    names.some((name) => part === `@${name}`) ? (
      <span
        key={index}
        className="rounded bg-primary-soft px-0.5 font-semibold text-primary-text"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function LocalImage({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <img
      src={url}
      alt={file.name}
      className="aspect-video w-full rounded object-cover"
    />
  ) : null;
}
function NoteImage({ noteId, imageId, ...props }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true,
      current;
    api
      .imageBlob(noteId, imageId)
      .then((blob) => {
        if (!active) return;
        current = URL.createObjectURL(blob);
        setUrl(current);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [noteId, imageId]);
  return url ? (
    <img src={url} {...props} />
  ) : (
    <span className="grid aspect-video place-items-center text-muted-foreground">
      <Image size={18} />
    </span>
  );
}
