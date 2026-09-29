import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Loader from "../common/Loader";
import * as api from "../../services/dayEndReport.service";
import { errorMessage } from "../../utils/helpers";
import { estimateFromItem } from "../../utils/reportDuration";

const hourOptions = [
  [{ value: 30, unit: "MINUTES" }, "30 Minutes"],
  ...[1, 2, 3, 4, 5, 6, 8, 12].map((value) => [
    { value, unit: "HOURS" },
    `${value} Hour${value === 1 ? "" : "s"}`,
  ]),
];
const dayOptions = [1, 2, 3, 4, 5, 7, 10, 15, 30];
const blockerOptions = [
  ["NONE", "No Issues"],
  ["WAITING_ADMIN", "Waiting for CEO/Admin"],
  ["WAITING_CLIENT", "Waiting for Client"],
  ["WAITING_TEAM", "Waiting for Team Member"],
  ["TECHNICAL", "Technical Issue"],
  ["MISSING_ASSETS", "Missing Information / Assets"],
  ["OTHER", "Other"],
];
const duration = (minutes) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ""}`
    : `${minutes}m`;
const sameWorkItem = (candidate, selected) =>
  selected.reportItemId
    ? Number(candidate.reportItemId) === Number(selected.reportItemId)
    : candidate.sourceType === selected.sourceType &&
      Number(candidate.sourceId) === Number(selected.sourceId);

export default function DayEndReportModal({
  open,
  onClose,
  onSubmitted,
  editExisting = false,
}) {
  const [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [data, setData] = useState(null),
    [existing, setExisting] = useState(null),
    [selected, setSelected] = useState({}),
    [otherWork, setOtherWork] = useState(""),
    [blockerType, setBlockerType] = useState("NONE"),
    [blockerDetails, setBlockerDetails] = useState(""),
    [tomorrowPriority, setTomorrowPriority] = useState(""),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open || !dirty || saving) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty, saving]);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    Promise.all([api.getToday(), api.getWorkItems().catch(() => null)])
      .then(([today, work]) => {
        if (today.submitted && !editExisting) {
          onSubmitted();
          return;
        }
        if (today.submitted) {
          const report = today.submitted;
          setExisting(report);
          setData({ reportDate: report.reportDate, items: report.items });
          setSelected(
            Object.fromEntries(
              report.items.map((item) => [
                `${item.sourceType}:${item.sourceId}`,
                {
                  sourceType: item.sourceType,
                  sourceId: item.sourceId ? Number(item.sourceId) : null,
                  reportItemId: Number(item.reportItemId),
                  summary: item.summary || "",
                  whatsLeft: item.whatsLeft || "",
                  estimatedRemaining: estimateFromItem(item),
                },
              ]),
            ),
          );
          setOtherWork(report.otherWork || "");
          setBlockerType(report.blockerType);
          setBlockerDetails(report.blockerDetails || "");
          setTomorrowPriority(report.tomorrowPriority);
          setDirty(false);
          return;
        }
        setExisting(null);
        setData(work);
        setSelected({});
        setOtherWork("");
        setBlockerType("NONE");
        setBlockerDetails("");
        setTomorrowPriority("");
        setDirty(false);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [open, editExisting]);
  const toggle = (item) => {
    setDirty(true);
    setSelected((old) => {
      const key = `${item.sourceType}:${item.sourceId}`,
        next = { ...old };
      if (next[key]) delete next[key];
      else
        next[key] = {
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          summary: item.summaryPrefill || "",
          whatsLeft: item.whatsLeftPrefill || "",
          estimatedRemaining: null,
        };
      return next;
    });
  };
  const setItem = (key, field, value) =>
    setSelected((old) => ({ ...old, [key]: { ...old[key], [field]: value } }));
  const changeItem = (key, field, value) => {
    setDirty(true);
    setItem(key, field, value);
  };
  const requestClose = () => {
    if (saving) return;
    if (
      dirty &&
      !window.confirm("Discard your unsaved Day-End Report changes?")
    )
      return;
    onClose();
  };
  const submit = async () => {
    if (existing?.status === "REVIEWED") return;
    const chosen = Object.values(selected);
    if (!chosen.length && !otherWork.trim()) {
      setError(
        "Select at least one work item or describe other work completed today.",
      );
      return;
    }
    const missingWork = chosen.find((item) => {
      const source = data?.items?.find((candidate) =>
        sameWorkItem(candidate, item),
      );
      return source?.status !== "COMPLETED" && !item.whatsLeft?.trim();
    });
    if (missingWork) {
      const source = data?.items?.find((item) =>
        sameWorkItem(item, missingWork),
      );
      setError(
        `Please add what's left for “${source?.title || "the selected work item"}”.`,
      );
      return;
    }
    const missingEstimate = chosen.find((item) => {
      const source = data?.items?.find((candidate) =>
        sameWorkItem(candidate, item),
      );
      return source?.status !== "COMPLETED" && !item.estimatedRemaining;
    });
    if (missingEstimate) {
      const source = data?.items?.find((item) =>
        sameWorkItem(item, missingEstimate),
      );
      setError(
        `Please select an estimated remaining time for “${source?.title || "the selected work item"}”.`,
      );
      return;
    }
    if (blockerType !== "NONE" && !blockerDetails.trim()) {
      setError("Please explain the selected blocker.");
      return;
    }
    if (!tomorrowPriority.trim()) {
      setError("Please add tomorrow's priority.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        items: Object.values(selected),
        otherWork: otherWork || null,
        blockerType,
        blockerDetails: blockerType === "NONE" ? null : blockerDetails,
        tomorrowPriority,
      };
      if (existing) await api.update(existing.id, payload);
      else await api.submit(payload);
      setDirty(false);
      await onSubmitted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} title="DAY-END REPORT" onClose={requestClose}>
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Before you clock out, tell us how today’s work went.
            </p>
            {data?.reportDate && (
              <p className="mt-1 font-semibold">
                {new Date(`${data.reportDate}T00:00:00`).toLocaleDateString(
                  "en-PK",
                  { weekday: "long", month: "long", day: "numeric" },
                )}
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </p>
          )}
          <section>
            <h3 className="text-xs font-black tracking-widest text-primary-text">
              01 · TODAY’S WORK
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select what you worked on today.
            </p>
            <div className="mt-3 space-y-2">
              {data?.items?.length ? (
                data.items.map((item) => {
                  const key = `${item.sourceType}:${item.sourceId}`,
                    value = selected[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border p-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={() => toggle(item)}
                          className="mt-1"
                        />
                        <span className="flex-1">
                          <b className="block">{item.title}</b>
                          <small className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary-text">
                              {item.sourceType === "TASK"
                                ? "TASK"
                                : "ONGOING WORK"}
                            </span>
                            <span>{item.status.replaceAll("_", " ")}</span>
                            {item.trackedMinutes
                              ? ` · ${duration(item.trackedMinutes)} tracked today`
                              : ""}
                          </small>
                        </span>
                      </label>
                      {value && (
                        <div className="mt-3 grid gap-3 border-t border-border pt-3">
                          <label className="text-xs font-semibold">
                            Optional Summary
                            <textarea
                              value={value.summary || ""}
                              onChange={(e) =>
                                changeItem(key, "summary", e.target.value)
                              }
                              maxLength={2000}
                              className="mt-1 min-h-20 w-full rounded-xl border border-border bg-surface p-3 font-normal"
                            />
                          </label>
                          {item.status !== "COMPLETED" && (
                            <>
                              <label className="text-xs font-semibold">
                                What’s Left? *
                                <textarea
                                  value={value.whatsLeft || ""}
                                  onChange={(e) =>
                                    changeItem(key, "whatsLeft", e.target.value)
                                  }
                                  maxLength={2000}
                                  className="mt-1 min-h-20 w-full rounded-xl border border-border bg-surface p-3 font-normal"
                                />
                              </label>
                              <EstimateInput
                                value={value.estimatedRemaining}
                                onChange={(next) =>
                                  changeItem(key, "estimatedRemaining", next)
                                }
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted-foreground">
                  No tracked Task or Ongoing Work activity was found. Add other
                  work below.
                </p>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-black tracking-widest text-primary-text">
              02 · OTHER WORK
            </h3>
            <textarea
              value={otherWork}
              onChange={(e) => {
                setOtherWork(e.target.value);
                setDirty(true);
              }}
              maxLength={2000}
              placeholder="Anything completed that is not listed above?"
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-surface p-3"
            />
          </section>
          <section>
            <h3 className="text-xs font-black tracking-widest text-primary-text">
              03 · BLOCKERS / ISSUES
            </h3>
            <select
              value={blockerType}
              onChange={(e) => {
                setBlockerType(e.target.value);
                setDirty(true);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
            >
              {blockerOptions.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            {blockerType !== "NONE" && (
              <textarea
                value={blockerDetails}
                onChange={(e) => {
                  setBlockerDetails(e.target.value);
                  setDirty(true);
                }}
                maxLength={2000}
                placeholder="Explain the issue *"
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-surface p-3"
              />
            )}
          </section>
          <section>
            <h3 className="text-xs font-black tracking-widest text-primary-text">
              04 · TOMORROW’S PRIORITY *
            </h3>
            <textarea
              value={tomorrowPriority}
              onChange={(e) => {
                setTomorrowPriority(e.target.value);
                setDirty(true);
              }}
              maxLength={1000}
              placeholder="What should you focus on next?"
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-surface p-3"
            />
          </section>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="secondary"
              disabled={saving}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={submit}>
              {saving ? "Submitting…" : "Submit Report & Clock Out"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EstimateInput({ value, onChange }) {
  const hourMatch = hourOptions.some(
    ([option]) => option.value === value?.value && option.unit === value?.unit,
  );
  const dayMatch =
    value?.unit === "DAYS" && dayOptions.includes(Number(value.value));
  const [mode, setMode] = useState(
    dayMatch ? "DAYS" : hourMatch || !value ? "HOURS" : "CUSTOM",
  );
  const [customUnit, setCustomUnit] = useState(value?.unit || "HOURS");
  const chooseMode = (next) => {
    setMode(next);
    onChange(null);
  };
  return (
    <fieldset>
      <legend className="text-xs font-semibold">
        Estimated Remaining Time *
      </legend>
      <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-1">
        {["HOURS", "DAYS", "CUSTOM"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => chooseMode(option)}
            className={`rounded-lg px-2 py-2 text-xs font-bold ${mode === option ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground"}`}
          >
            {option[0] + option.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {mode === "HOURS" && (
        <select
          value={value ? `${value.value}:${value.unit}` : ""}
          onChange={(event) => {
            const [amount, unit] = event.target.value.split(":");
            onChange(amount ? { value: Number(amount), unit } : null);
          }}
          className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
        >
          <option value="">Select hours</option>
          {hourOptions.map(([option, label]) => (
            <option
              key={`${option.value}:${option.unit}`}
              value={`${option.value}:${option.unit}`}
            >
              {label}
            </option>
          ))}
        </select>
      )}
      {mode === "DAYS" && (
        <select
          value={value?.unit === "DAYS" ? value.value : ""}
          onChange={(event) =>
            onChange(
              event.target.value
                ? { value: Number(event.target.value), unit: "DAYS" }
                : null,
            )
          }
          className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
        >
          <option value="">Select days</option>
          {dayOptions.map((days) => (
            <option key={days} value={days}>
              {days} Day{days === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      )}
      {mode === "CUSTOM" && (
        <div className="mt-2 grid grid-cols-[1fr_1.2fr] gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            max="43200"
            aria-label="Custom duration value"
            placeholder="Enter value"
            value={value?.value || ""}
            onChange={(event) =>
              onChange(
                event.target.value
                  ? {
                      value: Number(event.target.value),
                      unit: customUnit,
                    }
                  : null,
              )
            }
            className="rounded-xl border border-border bg-surface p-3"
          />
          <select
            aria-label="Custom duration unit"
            value={customUnit}
            onChange={(event) => {
              setCustomUnit(event.target.value);
              if (value?.value)
                onChange({ value: Number(value.value), unit: event.target.value });
            }}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <option value="MINUTES">Minutes</option>
            <option value="HOURS">Hours</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
      )}
    </fieldset>
  );
}
