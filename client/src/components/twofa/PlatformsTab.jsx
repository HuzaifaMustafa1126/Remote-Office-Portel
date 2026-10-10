import {
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as twofa from "../../services/twofa.service";
import { errorMessage } from "../../utils/helpers";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import Modal from "../common/Modal";
import PlatformFields, {
  emptyPlatform,
  platformPayload,
  validatePlatform,
} from "./PlatformFields";

const when = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

function AddModal({ open, profileId, onClose, onSaved }) {
  const [items, setItems] = useState([emptyPlatform()]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const close = () => {
    if (!busy) {
      setItems([emptyPlatform()]);
      setError("");
      onClose();
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    const invalid = items.map(validatePlatform).find(Boolean);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    try {
      await twofa.addPlatforms(profileId, items.map(platformPayload));
      setItems([emptyPlatform()]);
      onClose();
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} title="Add Platforms" onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        {items.map((item, index) => (
          <PlatformFields
            key={index}
            number={index + 1}
            value={item}
            removable={items.length > 1}
            onRemove={() =>
              setItems((current) => current.filter((_, i) => i !== index))
            }
            onChange={(next) =>
              setItems((current) =>
                current.map((value, i) => (i === index ? next : value)),
              )
            }
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setItems((current) => [...current, emptyPlatform()])}
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> Add Another Platform
          </span>
        </Button>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? "Adding…" : "Add Platforms"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditModal({ platform, onClose, onSaved }) {
  const [form, setForm] = useState(null),
    [replaceTwofa, setReplaceTwofa] = useState(false),
    [replaceKey, setReplaceKey] = useState(false),
    [clearTwofa, setClearTwofa] = useState(false),
    [clearKey, setClearKey] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (platform) {
      setForm({
        platformName:
          platform.platformType === "OTHER" ? "Other" : platform.platformName,
        customPlatformName: platform.customPlatformName || "",
        accountLabel: platform.accountLabel || "",
        twofaInformation: "",
        authKey: "",
      });
      setReplaceTwofa(false);
      setReplaceKey(false);
      setClearTwofa(false);
      setClearKey(false);
      setError("");
    }
  }, [platform]);
  if (!form) return null;
  const submit = async (event) => {
    event.preventDefault();
    if (form.platformName === "Other" && !form.customPlatformName.trim())
      return setError("Enter a custom platform name.");
    if (clearTwofa && clearKey)
      return setError("At least one credential must remain stored.");
    const payload = {
      platformName: form.platformName,
      customPlatformName:
        form.platformName === "Other" ? form.customPlatformName : null,
      accountLabel: form.accountLabel.trim() || null,
      ...(replaceTwofa && form.twofaInformation
        ? { twofaInformation: form.twofaInformation }
        : {}),
      ...(replaceKey && form.authKey ? { authKey: form.authKey } : {}),
      ...(clearTwofa ? { clearTwofaInformation: true } : {}),
      ...(clearKey ? { clearAuthKey: true } : {}),
    };
    setBusy(true);
    try {
      await twofa.updatePlatform(platform.id, payload);
      onClose();
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  const sensitive = (
    label,
    stored,
    replacing,
    setReplacing,
    clearing,
    setClearing,
    field,
    maxLength,
  ) => (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {stored ? "Stored securely" : "Not stored"}
          </p>
        </div>
        <div className="flex gap-2">
          {stored && (
            <button
              type="button"
              onClick={() => {
                if (
                  !clearing &&
                  confirm(`Clear stored ${label.toLowerCase()}?`)
                ) {
                  setClearing(true);
                  setReplacing(false);
                } else setClearing(false);
              }}
              className="text-xs font-semibold text-danger"
            >
              {clearing ? "Undo clear" : "Clear"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setReplacing(!replacing);
              setClearing(false);
            }}
            className="text-xs font-semibold text-primary-text"
          >
            {replacing ? "Cancel replace" : "Replace"}
          </button>
        </div>
      </div>
      {clearing && (
        <p className="mt-2 text-xs font-semibold text-danger">
          This value will be cleared when you save.
        </p>
      )}
      {replacing && (
        <textarea
          required
          maxLength={maxLength}
          value={form[field]}
          onChange={(event) =>
            setForm((current) => ({ ...current, [field]: event.target.value }))
          }
          className="mt-3 min-h-20 w-full resize-y rounded-xl border border-border px-3 py-2"
          placeholder={`Enter replacement ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
  return (
    <Modal
      open={Boolean(platform)}
      title="Edit Platform"
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Platform</span>
          <select
            className="w-full rounded-xl border border-border px-3 py-2.5"
            value={form.platformName}
            onChange={(event) =>
              setForm({ ...form, platformName: event.target.value })
            }
          >
            {[
              "Instagram",
              "Facebook",
              "Google",
              "TikTok",
              "YouTube",
              "LinkedIn",
              "X / Twitter",
              "Snapchat",
              "Microsoft",
              "Other",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {form.platformName === "Other" && (
          <Input
            label="Custom Platform Name"
            value={form.customPlatformName}
            onChange={(event) =>
              setForm({ ...form, customPlatformName: event.target.value })
            }
          />
        )}
        <Input
          label="Account Label (Optional)"
          value={form.accountLabel}
          onChange={(event) =>
            setForm({ ...form, accountLabel: event.target.value })
          }
        />
        {sensitive(
          "2FA Information",
          platform.hasTwofaInformation,
          replaceTwofa,
          setReplaceTwofa,
          clearTwofa,
          setClearTwofa,
          "twofaInformation",
          10000,
        )}
        {sensitive(
          "Authentication Key",
          platform.hasAuthKey,
          replaceKey,
          setReplaceKey,
          clearKey,
          setClearKey,
          "authKey",
          2000,
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReauthModal({ platform, onClose, onReveal }) {
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onReveal(password);
      setPassword("");
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={Boolean(platform)}
      title="Confirm Your Password"
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Reauthentication is required every time an authentication key is
          revealed or copied.
        </p>
        <Input
          autoFocus
          label="Current Password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? "Verifying…" : "Reveal Key"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PlatformsTab({
  profile,
  permissions,
  notice,
  setNotice,
}) {
  const [platforms, setPlatforms] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [addOpen, setAddOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [reauth, setReauth] = useState(null),
    [revealed, setRevealed] = useState({});
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const load = async () => {
    setLoading(true);
    try {
      setPlatforms(await twofa.listPlatforms(profile.id));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return () => setRevealed({});
  }, [profile.id]);
  useEffect(() => {
    if (!Object.keys(revealed).length) return;
    const timer = setTimeout(() => setRevealed({}), 60000);
    return () => clearTimeout(timer);
  }, [revealed]);
  const disclose = async (platform, field, password, copy = false) => {
    const result =
      field === "key"
        ? await twofa.revealAuthKey(platform.id, password)
        : await twofa.revealTwofa(platform.id);
    setRevealed((current) => ({
      ...current,
      [`${platform.id}:${field}`]: result.value,
    }));
    if (copy) {
      await navigator.clipboard.writeText(result.value);
      setNotice(
        "Credential copied. Clipboard contents are controlled by your device.",
      );
    }
  };
  const action = (platform, field, copy = false) => {
    if (field === "key") setReauth({ platform, copy });
    else
      disclose(platform, field, null, copy).catch((requestError) =>
        setError(errorMessage(requestError)),
      );
  };
  const remove = async (platform) => {
    if (
      !confirm(
        `Remove ${platform.platformName}? Other platforms will not be affected.`,
      )
    )
      return;
    try {
      await twofa.deletePlatform(platform.id);
      setRevealed({});
      setNotice("Platform removed successfully.");
      load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Platforms</h2>
          <p className="text-sm text-muted-foreground">
            Credentials stay masked until you explicitly reveal them.
          </p>
        </div>
        {permissions.canAdd && profile.capabilities.canEdit && (
          <Button onClick={() => setAddOpen(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Add Platform
            </span>
          </Button>
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
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-surface-secondary"
            />
          ))}
        </div>
      ) : platforms.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {platforms.map((platform) => (
            <article
              key={platform.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary-text">
                    <Shield size={19} />
                  </span>
                  <div>
                    <h3 className="font-bold">{platform.platformName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {platform.accountLabel || "No account label"}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  {permissions.canEdit && profile.capabilities.canEdit && (
                    <button
                      aria-label={`Edit ${platform.platformName}`}
                      onClick={() => setEditing(platform)}
                      className="rounded-lg p-2 hover:bg-hover"
                    >
                      <Pencil size={17} />
                    </button>
                  )}
                  {permissions.canDelete && profile.capabilities.canEdit && (
                    <button
                      aria-label={`Remove ${platform.platformName}`}
                      onClick={() => remove(platform)}
                      className="rounded-lg p-2 text-danger hover:bg-danger-soft"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
              {[
                [
                  "twofa",
                  "2FA Information",
                  platform.hasTwofaInformation,
                  permissions.canRevealTwofa &&
                    profile.capabilities.canRevealTwofa,
                ],
                [
                  "key",
                  "Authentication Key",
                  platform.hasAuthKey,
                  permissions.canRevealKey &&
                    profile.capabilities.canRevealAuthKey,
                ],
              ].map(([field, label, stored, allowed]) => {
                const value = revealed[`${platform.id}:${field}`];
                return (
                  <div
                    key={field}
                    className="mt-4 rounded-xl bg-surface-secondary p-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {field === "key" ? (
                        <KeyRound size={15} />
                      ) : (
                        <Shield size={15} />
                      )}
                      {label}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="min-w-0 flex-1 break-all text-sm">
                        {value || (stored ? "••••••••••••" : "Not stored")}
                      </code>
                      {stored && allowed && (
                        <div className="flex shrink-0">
                          <button
                            aria-label={`${value ? "Hide" : "Reveal"} ${label}`}
                            onClick={() =>
                              value
                                ? setRevealed((current) => {
                                    const next = { ...current };
                                    delete next[`${platform.id}:${field}`];
                                    return next;
                                  })
                                : action(platform, field)
                            }
                            className="rounded-lg p-2 hover:bg-hover"
                          >
                            {value ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            aria-label={`Copy ${label}`}
                            onClick={() =>
                              value
                                ? navigator.clipboard
                                    .writeText(value)
                                    .then(() =>
                                      setNotice(
                                        "Credential copied. Clipboard contents are controlled by your device.",
                                      ),
                                    )
                                    .catch(() =>
                                      setError(
                                        "Unable to copy the credential. Check browser clipboard permission.",
                                      ),
                                    )
                                : action(platform, field, true)
                            }
                            className="rounded-lg p-2 hover:bg-hover"
                          >
                            <Clipboard size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="mt-4 text-xs text-muted-foreground">
                Updated by {platform.updatedBy.name || "Former employee"} ·{" "}
                {when(platform.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border">
          <EmptyState
            title="No Platforms Added"
            description="Add a platform to store its authentication information."
          />
        </div>
      )}
      <AddModal
        open={addOpen}
        profileId={profile.id}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setNotice("Platforms added successfully.");
          load();
        }}
      />
      <EditModal
        platform={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setNotice("Platform updated successfully.");
          setRevealed({});
          load();
        }}
      />
      <ReauthModal
        platform={reauth?.platform}
        onClose={() => setReauth(null)}
        onReveal={(password) =>
          disclose(reauth.platform, "key", password, reauth.copy)
        }
      />
    </div>
  );
}
