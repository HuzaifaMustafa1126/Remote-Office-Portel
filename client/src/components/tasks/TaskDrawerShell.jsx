import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listNotes } from "../../services/note.service";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageOff,
  Paperclip,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import {
  addTaskComment,
  deleteTaskAttachment,
  deleteTaskComment,
  editTaskComment,
  getMentionableUsers,
  getTask,
  getTaskAttachmentBlob,
  getTaskImageBlob,
  markTaskRead,
  uploadTaskAttachment,
} from "../../services/task.service";
import useAuth from "../../hooks/useAuth";
import PriorityBadge from "./PriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskWorkTimer, { formatDuration } from "./TaskWorkTimer";
const date = (v) =>
  v
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(v))
    : "—";
const status = (v) => String(v || "").replaceAll("_", " ");
const eventLabels = {
  DRAFT_CREATED: "Draft created",
  TASK_CREATED: "Task created",
  TASK_UPDATED: "Task updated",
  TASK_PUBLISHED: "Task published",
  TASK_SCHEDULED: "Task scheduled",
  TASK_RESCHEDULED: "Task rescheduled",
  TASK_SCHEDULE_CANCELLED: "Schedule cancelled",
  TASK_CLAIMED: "Task claimed",
  TASK_IN_PROGRESS: "Work started or resumed",
  WORK_SESSION_PAUSED: "Task work paused",
  WORK_SESSION_RESUMED: "Task work resumed",
  TASK_SUBMITTED_FOR_REVIEW: "Submitted for review",
  TASK_CHANGES_REQUIRED: "Changes required",
  TASK_COMPLETED: "Task completed",
  COMMENT_ADDED: "Comment added",
  COMMENT_EDITED: "Comment edited",
  COMMENT_DELETED: "Comment deleted",
  ATTACHMENT_ADDED: "Attachment uploaded",
  ATTACHMENT_DELETED: "Attachment deleted",
  IMAGE_ADDED: "Image added",
  TASK_REASSIGNED: "Task reassigned",
  TASK_AUTO_PUBLISHED: "Task published automatically",
};
export default function TaskDrawerShell({
  task,
  onClose,
  management,
  onAction,
  refreshKey = 0,
  busy = false,
}) {
  const { user } = useAuth();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [comment, setComment] = useState(""),
    [commenting, setCommenting] = useState(false),
    [notice, setNotice] = useState(""),
    [lightbox, setLightbox] = useState(null),
    [replyTo, setReplyTo] = useState(null),
    [mentionIds, setMentionIds] = useState([]),
    [mentionable, setMentionable] = useState([]),
    [uploading, setUploading] = useState(0),
    [workNotes, setWorkNotes] = useState([]);
  const load = useCallback(async () => {
    if (!task) return;
    setLoading(true);
    setError("");
    try {
      const detail = await getTask(task.id);
      setData(detail);
      if (detail.status === "COMPLETED")
        listNotes({ relatedTaskId: detail.id, page: 1, limit: 10 })
          .then((result) => setWorkNotes(result.rows || []))
          .catch(() => setWorkNotes([]));
      else setWorkNotes([]);
      markTaskRead(task.id).catch(() => {});
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load task details.");
    } finally {
      setLoading(false);
    }
  }, [task]);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  if (!task) return null;
  const add = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    setNotice("");
    try {
      await addTaskComment(
        task.id,
        comment.trim(),
        replyTo?.id || null,
        mentionIds,
      );
      setComment("");
      setReplyTo(null);
      setMentionIds([]);
      setMentionable([]);
      setNotice("Comment added.");
      await load();
    } catch (e) {
      setNotice(e.response?.data?.message || "Unable to add comment.");
    } finally {
      setCommenting(false);
    }
  };
  const commentChange = async (value) => {
    setComment(value);
    const match = value.match(/(?:^|\s)@([^@\n]{1,40})$/);
    if (!match) {
      setMentionable([]);
      return;
    }
    try {
      setMentionable(await getMentionableUsers(task.id, match[1].trim()));
    } catch {
      setMentionable([]);
    }
  };
  const chooseMention = (person) => {
    setComment((x) =>
      x.replace(
        /(?:^|\s)@([^@\n]{0,40})$/,
        (m) => `${m.startsWith(" ") ? " " : ""}@${person.name} `,
      ),
    );
    setMentionIds((x) => [...new Set([...x, person.id])]);
    setMentionable([]);
  };
  const refreshComment = async (fn) => {
    try {
      await fn();
      setNotice("Discussion updated.");
      await load();
    } catch (e) {
      setNotice(e.response?.data?.message || "Unable to update comment.");
    }
  };
  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    for (const file of files) {
      setUploading(1);
      try {
        await uploadTaskAttachment(task.id, file, (p) =>
          setUploading(Math.round((p.loaded * 100) / (p.total || file.size))),
        );
        setNotice("Attachment uploaded.");
        await load();
      } catch (error) {
        setNotice(
          error.response?.data?.message || "Upload failed. Please try again.",
        );
      } finally {
        setUploading(0);
      }
    }
  };
  const removeAttachment = async (file) => {
    if (!confirm(`Delete ${file.originalFilename}?`)) return;
    try {
      await deleteTaskAttachment(task.id, file.id);
      setNotice("Attachment deleted.");
      await load();
    } catch (e) {
      setNotice(e.response?.data?.message || "Unable to delete attachment.");
    }
  };
  return (
    <>
      <button
        aria-label="Close task details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-overlay/40"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        className="fixed inset-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:left-auto sm:w-[min(680px,96vw)]"
      >
        <header className="shrink-0 border-b border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {data && <PriorityBadge priority={data.priority} />}
                <TaskStatusBadge status={data?.status || task.status} />
                {data?.overdue && (
                  <span className="rounded-full bg-danger-soft px-2 py-1 text-[10px] font-black text-danger">
                    OVERDUE
                  </span>
                )}
              </div>
              <h2
                id="task-drawer-title"
                className="break-words text-xl font-black"
              >
                {data?.title || task.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {data?.assignment_type === "OPEN"
                  ? "Open Task"
                  : "Direct Assignment"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-surface-secondary"
            >
              <X />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <DrawerSkeleton />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-danger">{error}</p>
              <button
                onClick={load}
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold"
              >
                <RotateCw size={14} />
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6 p-5 sm:p-6">
              <Info data={data} />
              <Dates data={data} />
              <TimeTracking value={data.timeTracking} management={management} />
              {data.status === "CHANGES_REQUIRED" && data.changeRequest && (
                <ChangeRequest value={data.changeRequest} />
              )}
              <Gallery
                title="Reference Images"
                images={data.images.filter(
                  (x) => x.context === "TASK_REFERENCE",
                )}
                taskId={data.id}
                onOpen={setLightbox}
              />
              <Gallery
                title="Submission Images"
                images={data.images.filter((x) => x.context === "SUBMISSION")}
                taskId={data.id}
                onOpen={setLightbox}
              />
              <Gallery
                title="Changes Required References"
                images={data.images.filter(
                  (x) => x.context === "CHANGES_REQUIRED",
                )}
                taskId={data.id}
                onOpen={setLightbox}
              />
              <Attachments
                taskId={data.id}
                items={data.attachments || []}
                upload={upload}
                uploading={uploading}
                remove={removeAttachment}
                userId={user?.id}
                management={management}
              />
              {data.status === "COMPLETED" && (
                <Block title="Work Notes">
                  {workNotes.length ? (
                    <div className="divide-y divide-border">
                      {workNotes.map((note) => (
                        <Link key={note.id} to={`/notes/${note.id}`} className="block py-3">
                          <p className="text-sm font-semibold">{note.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.summary}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{note.authorName} · {date(note.createdAt)}</p>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No work note has been added for this task.</p>}
                  <Link to={`/notes?task=${data.id}`} className="mt-3 inline-block rounded-lg border border-border px-3 py-2 text-xs font-bold">
                    {workNotes.length ? "Add Another Note" : "Add Work Note"}
                  </Link>
                </Block>
              )}
              <Comments
                items={data.comments}
                value={comment}
                setValue={commentChange}
                add={add}
                busy={commenting}
                notice={notice}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                mentionable={mentionable}
                chooseMention={chooseMention}
                userId={user?.id}
                management={management}
                edit={(item, content) =>
                  refreshComment(() =>
                    editTaskComment(task.id, item.id, content),
                  )
                }
                remove={(item) =>
                  refreshComment(() => deleteTaskComment(task.id, item.id))
                }
              />
              <Activity items={data.activities} />
            </div>
          ) : null}
        </div>
        {data && (
          <DrawerActions
            task={data}
            management={management}
            onAction={onAction}
            busy={busy}
          />
        )}
      </aside>
      {lightbox && (
        <Lightbox
          group={lightbox.group}
          index={lightbox.index}
          taskId={data.id}
          close={() => setLightbox(null)}
          setIndex={(index) => setLightbox((x) => ({ ...x, index }))}
        />
      )}
    </>
  );
}
function Block({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-2xl border border-border bg-surface p-4">
        {children}
      </div>
    </section>
  );
}
function Info({ data }) {
  return (
    <Block title="Task Information">
      <div className="space-y-4 text-sm">
        <div>
          <b>Description</b>
          <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {data.description || "No description provided."}
          </p>
        </div>
        <div>
          <b>Instructions / Notes</b>
          <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {data.instructions || "No instructions provided."}
          </p>
        </div>
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          {[
            ["Project", "General"],
            ["Assigned Employee", data.assigneeName || "Not assigned yet"],
            ["Created By", data.creatorName || "System"],
            ["Assignment Type", data.assignment_type],
            ["Priority", data.priority],
            ["Review Required", data.review_required ? "Yes" : "No"],
            [
              "Completion Image Required",
              data.completion_image_required ? "Yes" : "No",
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="block text-xs text-muted-foreground">{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <b>{taskProgress(data.status)}%</b>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full bg-foreground"
              style={{ width: `${taskProgress(data.status)}%` }}
            />
          </div>
        </div>
      </div>
    </Block>
  );
}
const taskProgress = (status) =>
  ({
    DRAFT: 0,
    SCHEDULED: 0,
    OPEN: 0,
    TO_DO: 10,
    IN_PROGRESS: 55,
    SUBMITTED_FOR_REVIEW: 85,
    CHANGES_REQUIRED: 65,
    COMPLETED: 100,
    ARCHIVED: 100,
  })[status] || 0;
function Dates({ data }) {
  const rows = [
    ["Created", data.created_at],
    ["Published", data.published_at],
    ["Start Date", data.start_at],
    ["Due Date", data.due_at],
    ["Scheduled Publish", data.scheduled_publish_at],
    ["Submitted", data.submitted_at],
    ["Completed", data.completed_at],
    ["Archived", data.archived_at],
  ].filter(([, v]) => v);
  return (
    <Block title="Dates">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <span className="block text-xs text-muted-foreground">{k}</span>
            <b
              className={k === "Due Date" && data.overdue ? "text-danger" : ""}
            >
              {date(v)}
            </b>
          </div>
        ))}
      </div>
    </Block>
  );
}
function TimeTracking({ value, management }) {
  if (!value) return null;
  return (
    <Block title="Task Work Time">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="block text-xs text-muted-foreground">{value.isRunning ? "Working" : "Total recorded time"}</span>
          <TaskWorkTimer timeTracking={value} />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${value.isRunning ? "bg-info-soft text-info" : "bg-surface-secondary text-muted-foreground"}`}>
          {value.isRunning ? "RUNNING" : "STOPPED"}
        </span>
      </div>
      {!value.isRunning && value.lastEndReason === "OFFLINE" && (
        <p className="mt-3 rounded-lg bg-warning-soft p-3 text-xs font-semibold text-warning">
          Work paused because app presence was lost. Resume the task manually when ready.
        </p>
      )}
      {management && value.contributors?.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-bold text-muted-foreground">Contributions</p>
          <div className="space-y-2 text-sm">
            {value.contributors.map((person) => (
              <div key={person.employeeId} className="flex justify-between gap-3">
                <span>{person.name}</span>
                <b className="font-mono tabular-nums">{formatDuration(person.totalSeconds)}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </Block>
  );
}
function ChangeRequest({ value }) {
  return (
    <section className="rounded-2xl border border-warning-border bg-warning-soft p-4 text-warning">
      <h3 className="font-black">Action Required</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">
        {value.reason}
      </p>
      <div className="mt-3 text-xs">
        <p>
          Requested by <b>{value.requestedBy || "Management"}</b> ·{" "}
          {date(value.requestedAt)}
        </p>
        {value.revisionDueAt && (
          <p className="mt-1">
            Revision deadline: <b>{date(value.revisionDueAt)}</b>
          </p>
        )}
      </div>
    </section>
  );
}
function Gallery({ title, images, taskId, onOpen }) {
  if (!images.length) return null;
  return (
    <Block title={title}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <ProtectedImage
            key={image.id}
            taskId={taskId}
            image={image}
            onClick={() => onOpen({ group: images, index })}
          />
        ))}
      </div>
    </Block>
  );
}
function ProtectedImage({ taskId, image, onClick }) {
  const [src, setSrc] = useState(""),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true,
      url;
    getTaskImageBlob(taskId, image.id)
      .then((x) => {
        url = x;
        if (active) setSrc(x);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [taskId, image.id]);
  return (
    <button
      onClick={onClick}
      disabled={!src}
      className="overflow-hidden rounded-xl border border-border text-left"
    >
      {failed ? (
        <div className="flex h-28 items-center justify-center text-muted-foreground">
          <ImageOff />
        </div>
      ) : src ? (
        <img
          src={src}
          alt={image.originalFilename}
          className="h-28 w-full object-cover"
        />
      ) : (
        <div className="h-28 animate-pulse bg-surface-secondary" />
      )}
      <div className="p-2">
        <p className="truncate text-[11px] font-bold">
          {image.originalFilename}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {image.uploadedBy || "User"} · {date(image.createdAt)}
        </p>
      </div>
    </button>
  );
}
function Attachments({
  taskId,
  items,
  upload,
  uploading,
  remove,
  userId,
  management,
}) {
  const open = async (file) => {
    const url = await getTaskAttachmentBlob(taskId, file.id);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return (
    <Block title="Attachments">
      <div className="space-y-2">
        {items.length ? (
          items.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3"
            >
              <FileText className="shrink-0" size={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {file.originalFilename}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {size(file.sizeBytes)} · {file.uploadedBy || "User"} ·{" "}
                  {date(file.createdAt)}
                </p>
              </div>
              <button
                aria-label={`Open ${file.originalFilename}`}
                onClick={() => open(file)}
                className="rounded-lg p-2 hover:bg-surface"
              >
                <Download size={16} />
              </button>
              {(management ||
                Number(file.uploadedByUserId) === Number(userId)) && (
                <button
                  aria-label={`Delete ${file.originalFilename}`}
                  onClick={() => remove(file)}
                  className="rounded-lg p-2 text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No attachments added yet.
          </p>
        )}
      </div>
      <label
        className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <Paperclip size={14} />
        {uploading ? `Uploading ${uploading}%` : "Add File"}
        <input
          aria-label="Upload task attachment"
          type="file"
          multiple
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.zip"
          onChange={upload}
        />
      </label>
    </Block>
  );
}
const size = (n) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
function Comments({
  items,
  value,
  setValue,
  add,
  busy,
  notice,
  replyTo,
  setReplyTo,
  mentionable,
  chooseMention,
  userId,
  management,
  edit,
  remove,
}) {
  const roots = items.filter((x) => !x.parentCommentId),
    children = (id) =>
      items.filter((x) => Number(x.parentCommentId) === Number(id));
  return (
    <Block title="Comments">
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {roots.length ? (
          roots.map((x) => (
            <Comment
              key={x.id}
              item={x}
              replies={children(x.id)}
              userId={userId}
              management={management}
              reply={setReplyTo}
              edit={edit}
              remove={remove}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No comments yet. Start the discussion about this task.
          </p>
        )}
      </div>
      <div className="mt-4">
        {replyTo && (
          <div className="mb-2 flex justify-between rounded-lg bg-primary-soft px-3 py-2 text-xs">
            <span>
              Replying to <b>{replyTo.author}</b>
            </span>
            <button onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        <textarea
          rows="2"
          maxLength="1000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
          placeholder="Add a short task note…"
        />
        {mentionable.length > 0 && (
          <div className="mt-1 rounded-xl border border-border bg-surface p-1 shadow-lg">
            {mentionable.map((x) => (
              <button
                key={x.id}
                onClick={() => chooseMention(x)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-surface-secondary"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {initials(x.name)}
                </span>
                <span>
                  <b className="block text-xs">{x.name}</b>
                  <small className="text-muted-foreground">
                    {x.jobTitle || "Task participant"}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {value.length}/1000
          </span>
          <button
            disabled={busy || !value.trim()}
            onClick={add}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Adding…" : replyTo ? "Add Reply" : "Add Comment"}
          </button>
        </div>
        {notice && (
          <p className="mt-2 text-xs text-muted-foreground">{notice}</p>
        )}
      </div>
    </Block>
  );
}
function Comment({ item, replies, userId, management, reply, edit, remove }) {
  const [editing, setEditing] = useState(false),
    [text, setText] = useState(item.content),
    own = Number(item.authorUserId) === Number(userId),
    deleted = Boolean(item.deletedAt);
  return (
    <div>
      <div className="rounded-xl bg-surface-secondary p-3">
        <div className="flex justify-between gap-2 text-xs">
          <span className="flex items-center gap-2">
            <i className="grid h-7 w-7 place-items-center rounded-full bg-foreground not-italic font-bold text-background">
              {initials(item.author || "U")}
            </i>
            <span>
              <b>{item.author || "User"}</b>
              {item.authorTitle && (
                <small className="block text-muted-foreground">
                  {item.authorTitle}
                </small>
              )}
            </span>
          </span>
          <span className="text-muted-foreground">
            {date(item.createdAt)}
            {item.updatedAt && " · Edited"}
          </span>
        </div>
        {editing ? (
          <div className="mt-2">
            <textarea
              className="input"
              maxLength="1000"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-1 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="text-xs">
                Cancel
              </button>
              <button
                onClick={() => {
                  edit(item, text);
                  setEditing(false);
                }}
                className="text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`mt-1 whitespace-pre-wrap break-words text-sm ${deleted ? "italic text-muted-foreground" : ""}`}
          >
            {item.content}
          </p>
        )}
        {!deleted && (
          <div className="mt-2 flex gap-3 text-[11px] font-bold text-muted-foreground">
            <button
              aria-label={`Reply to ${item.author}`}
              onClick={() => reply(item)}
            >
              Reply
            </button>
            {(own || management) && (
              <>
                <button
                  aria-label="Edit comment"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                <button
                  aria-label="Delete comment"
                  onClick={() => remove(item)}
                  className="text-danger"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {replies.map((x) => (
        <div key={x.id} className="ml-7 mt-2 border-l border-border pl-3">
          <Comment
            item={x}
            replies={[]}
            userId={userId}
            management={management}
            reply={() => {}}
            edit={edit}
            remove={remove}
          />
        </div>
      ))}
    </div>
  );
}
const initials = (name) =>
  String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
function Activity({ items }) {
  return (
    <Block title="Activity">
      <div className="space-y-0">
        {items.length ? (
          items.map((x, i) => (
            <div key={x.id} className="relative flex gap-3 pb-4 last:pb-0">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              {i < items.length - 1 && (
                <span className="absolute left-[4px] top-4 h-[calc(100%-12px)] w-px bg-border" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {eventLabels[x.event_type] || status(x.event_type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {x.actor || "System"} · {date(x.created_at)}
                </p>
                {activityDetail(x) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activityDetail(x)}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}
      </div>
    </Block>
  );
}
function activityDetail(item) {
  let m = item.metadata;
  try {
    if (typeof m === "string") m = JSON.parse(m);
  } catch {
    return "";
  }
  if (!m) return "";
  if (m.reason) return `Reason: ${m.reason}`;
  if (m.note) return `Note: ${m.note}`;
  if (m.filename) return m.filename;
  if (m.previousDueAt || m.newDueAt)
    return `${date(m.previousDueAt)} → ${date(m.newDueAt)}`;
  if (m.scheduledPublishAt)
    return `Scheduled for ${date(m.scheduledPublishAt)}`;
  if (m.previousEmployeeId || m.newEmployeeId)
    return "Task assignment changed.";
  return "";
}
function DrawerActions({ task, management, onAction, busy }) {
  let actions = [];
  if (management && task.status === "SUBMITTED_FOR_REVIEW")
    actions = [
      ["complete", "Complete"],
      ["changes", "Changes Required"],
    ];
  else if (
    management &&
    task.status === "COMPLETED" &&
    task.assignee_employee_id
  )
    actions = [["changes", "Reopen Task"]];
  else if (!management && task.status === "OPEN")
    actions = [["claim", "Assign to Me"]];
  else if (!management && task.status === "TO_DO")
    actions = [["start", "Start Task"]];
  else if (!management && task.status === "IN_PROGRESS")
    actions = task.timeTracking?.isRunning
      ? [
          [
            task.review_required ? "submit" : "complete",
            task.review_required ? "Submit for Review" : "Complete Task",
          ],
        ]
      : [["resume", "Resume Task"]];
  else if (!management && task.status === "CHANGES_REQUIRED")
    actions = [["resume", "Resume Work"]];
  if (!actions.length && task.status !== "COMPLETED") return null;
  return (
    <footer className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-border bg-surface p-4">
      {actions.map(([type, label]) => (
        <button
          key={type}
          disabled={busy}
          onClick={() => onAction(type, task)}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${type === "changes" ? "bg-warning-soft text-warning" : "bg-primary text-primary-foreground"}`}
        >
          {busy ? "Working…" : label}
        </button>
      ))}
    </footer>
  );
}
function DrawerSkeleton() {
  return (
    <div className="space-y-5 p-6">
      {[1, 2, 3, 4].map((x) => (
        <div
          key={x}
          className="h-32 animate-pulse rounded-2xl bg-surface-secondary"
        />
      ))}
    </div>
  );
}
function Lightbox({ group, index, taskId, close, setIndex }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4">
      <button
        onClick={close}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
      >
        <X />
      </button>
      {group.length > 1 && (
        <button
          onClick={() => setIndex((index - 1 + group.length) % group.length)}
          className="absolute left-3 rounded-full bg-white/10 p-2 text-white"
        >
          <ChevronLeft />
        </button>
      )}
      <div className="max-h-[90vh] max-w-[90vw]">
        <ProtectedFullImage taskId={taskId} image={group[index]} />
        <p className="mt-2 text-center text-sm text-white">
          {group[index].originalFilename}
        </p>
      </div>
      {group.length > 1 && (
        <button
          onClick={() => setIndex((index + 1) % group.length)}
          className="absolute right-3 rounded-full bg-white/10 p-2 text-white"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
function ProtectedFullImage({ taskId, image }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let url;
    getTaskImageBlob(taskId, image.id).then((x) => {
      url = x;
      setSrc(x);
    });
    return () => url && URL.revokeObjectURL(url);
  }, [taskId, image.id]);
  return src ? (
    <img
      src={src}
      alt={image.originalFilename}
      className="max-h-[82vh] max-w-[86vw] object-contain"
    />
  ) : (
    <div className="h-64 w-64 animate-pulse rounded-xl bg-white/10" />
  );
}
