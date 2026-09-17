import { useEffect, useState } from "react";
import Button from "../common/Button";
import usePermission from "../../hooks/usePermission";
import * as api from "../../services/notification.service";
import {
  previewSound,
  setSoundConfiguration,
  soundErrorMessage,
  stopPreview,
} from "../../services/notificationSound.service";
const categories = [
  "ATTENDANCE",
  "BREAK",
  "LEAVE",
  "TASK",
  "CALENDAR",
  "PAYROLL",
  "SECURITY",
  "SYSTEM",
];
export default function NotificationSoundManager({ volume = 100 }) {
  const manage = usePermission("notification_policy.manage"),
    [data, setData] = useState(),
    [name, setName] = useState(""),
    [file, setFile] = useState(),
    [message, setMessage] = useState("");
  const load = () =>
    api.getSounds().then((x) => {
      setData(x);
      setSoundConfiguration(x);
    });
  useEffect(() => {
    load();
    return stopPreview;
  }, []);
  if (!data)
    return (
      <section className="rounded-2xl border border-border bg-surface p-5">
        Loading notification sounds…
      </section>
    );
  const { settings, sounds } = data,
    assigned = new Map(
      data.assignments
        .filter((x) => x.scopeType === "CATEGORY")
        .map((x) => [x.scopeKey, x.soundId]),
    );
  const update = (key, value) =>
    setData((x) => ({ ...x, settings: { ...x.settings, [key]: value } }));
  const assign = (scopeKey, soundId) =>
    setData((x) => ({
      ...x,
      assignments: [
        ...x.assignments.filter(
          (a) => a.scopeType !== "CATEGORY" || a.scopeKey !== scopeKey,
        ),
        ...(soundId
          ? [{ scopeType: "CATEGORY", scopeKey, soundId: Number(soundId) }]
          : []),
      ],
    }));
  const save = () =>
    api
      .saveSoundSettings({
        ...settings,
        defaultSoundId: Number(settings.defaultSoundId),
        assignments: data.assignments,
      })
      .then((x) => {
        setData(x);
        setSoundConfiguration(x);
        setMessage("Sound settings saved.");
      })
      .catch((e) => setMessage(e.response?.data?.message || "Unable to save."));
  const upload = () => {
    if (!file || !name.trim())
      return setMessage("Sound name and file are required.");
    if (
      !["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg"].includes(
        file.type,
      ) ||
      file.size > 5242880
    )
      return setMessage("Choose an MP3, WAV or OGG file up to 5 MB.");
    api
      .uploadSound(file, name.trim())
      .then(() => {
        setName("");
        setFile();
        load();
        setMessage("Sound uploaded.");
      })
      .catch((e) =>
        setMessage(e.response?.data?.message || "Unable to upload."),
      );
  };
  if (!manage) {
    const current = sounds.find(
      (sound) => sound.id === Number(settings.defaultSoundId),
    );
    return (
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">Notification Sound</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview the sound selected by your company.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">Current sound</p>
            <p className="mt-1 text-sm font-semibold">
              {current?.name || "Company default"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your volume: {volume}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                previewSound(settings.defaultSoundId, volume)
                  .then(() => setMessage("Test sound played."))
                  .catch((e) => setMessage(soundErrorMessage(e)))
              }
            >
              Test Sound
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                stopPreview();
                setMessage("Preview stopped.");
              }}
            >
              Stop
            </Button>
          </div>
        </div>
        {message && (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        )}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-semibold">Notification Sounds</h2>
          <p className="text-xs text-muted-foreground">
            Configure company sounds and preview them before saving.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            stopPreview();
            setMessage("Preview stopped.");
          }}
        >
          Stop Preview
        </Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Default sound
          <select
            disabled={!manage}
            className="mt-2 w-full rounded-xl border border-border bg-surface p-2"
            value={settings.defaultSoundId}
            onChange={(e) => update("defaultSoundId", Number(e.target.value))}
          >
            {sounds.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Normal", "normalVolume"],
            ["Important", "importantVolume"],
            ["Warning", "warningVolume"],
            ["Critical", "criticalVolume"],
          ].map(([label, key]) => (
            <label key={key} className="text-xs font-medium">
              {label} {settings[key]}%
              <input
                disabled={!manage}
                type="range"
                min="0"
                max="100"
                className="mt-2 w-full"
                value={settings[key]}
                onChange={(e) => update(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </div>
      <h3 className="mt-6 text-sm font-semibold">Sound Assignment</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {categories.map((c) => (
          <label
            key={c}
            className="flex items-center justify-between rounded-xl border border-border p-3 text-xs font-semibold"
          >
            {c}
            <select
              disabled={!manage}
              className="max-w-40 rounded-lg border border-border bg-surface p-1"
              value={assigned.get(c) || ""}
              onChange={(e) => assign(c, e.target.value)}
            >
              <option value="">Company default</option>
              {sounds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sound Library</h3>
        <Button
          variant="secondary"
          onClick={() =>
            previewSound(settings.defaultSoundId, settings.normalVolume)
              .then(() => setMessage("Test sound played."))
              .catch((e) => setMessage(soundErrorMessage(e)))
          }
        >
          Test Current Sound
        </Button>
      </div>
      <div className="mt-3 divide-y divide-border rounded-xl border border-border">
        {sounds.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <button
              onClick={() =>
                previewSound(s.id, settings.normalVolume)
                  .then(() => setMessage("Test sound played."))
                  .catch((e) => setMessage(soundErrorMessage(e)))
              }
              className="rounded-full bg-primary-soft px-3 py-2 text-primary-text"
            >
              ▶
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.isBuiltin
                  ? "Built-in"
                  : `${s.originalName} · ${Math.ceil(s.sizeBytes / 1024)} KB`}
              </p>
            </div>
            {manage && !s.isBuiltin && (
              <button
                className="text-xs font-semibold"
                onClick={() => {
                  const next = prompt("Sound name", s.name);
                  if (next?.trim())
                    api.renameSound(s.id, next.trim()).then((x) => {
                      setData(x);
                      setSoundConfiguration(x);
                    });
                }}
              >
                Rename
              </button>
            )}
            {manage && !s.isBuiltin && (
              <button
                className="text-xs font-semibold text-danger"
                onClick={() =>
                  confirm(`Delete ${s.name}?`) &&
                  api.deleteSound(s.id).then((x) => {
                    setData(x);
                    setSoundConfiguration(x);
                  })
                }
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
      {manage && (
        <div className="mt-5 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-[1fr_1fr_auto]">
          <input
            aria-label="Sound name"
            className="rounded-lg border border-border bg-surface p-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sound name"
          />
          <input
            aria-label="Audio file"
            type="file"
            accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
          <Button onClick={upload}>Upload Sound</Button>
        </div>
      )}
      {manage && (
        <Button className="mt-5" onClick={save}>
          Save Sound Settings
        </Button>
      )}
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </section>
  );
}
