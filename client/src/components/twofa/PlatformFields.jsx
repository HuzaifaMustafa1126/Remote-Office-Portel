import { Trash2 } from "lucide-react";
import Input from "../common/Input";

export const PLATFORM_OPTIONS = [
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
];
export const emptyPlatform = () => ({
  platformName: "Google",
  customPlatformName: "",
  accountLabel: "",
  twofaInformation: "",
  authKey: "",
});

export const platformPayload = (platform) => ({
  platformName: platform.platformName,
  ...(platform.platformName === "Other"
    ? { customPlatformName: platform.customPlatformName.trim() }
    : {}),
  ...(platform.accountLabel.trim()
    ? { accountLabel: platform.accountLabel.trim() }
    : {}),
  ...(platform.twofaInformation
    ? { twofaInformation: platform.twofaInformation }
    : {}),
  ...(platform.authKey ? { authKey: platform.authKey } : {}),
});

export function validatePlatform(platform) {
  if (platform.platformName === "Other" && !platform.customPlatformName.trim())
    return "Enter a custom platform name.";
  if (!platform.twofaInformation && !platform.authKey)
    return "Enter 2FA information, an authentication key, or both.";
  return "";
}

export default function PlatformFields({
  value,
  onChange,
  number,
  removable,
  onRemove,
  compact = false,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="rounded-2xl border border-border bg-surface-secondary/40 p-4">
      <legend className="sr-only">Platform {number}</legend>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Platform {number}</p>
          <p className="text-xs text-muted-foreground">
            Credentials are encrypted before storage.
          </p>
        </div>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove platform ${number}`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Platform</span>
          <select
            value={value.platformName}
            onChange={(event) => set("platformName", event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        {value.platformName === "Other" && (
          <Input
            label="Custom Platform Name"
            required
            maxLength={100}
            value={value.customPlatformName}
            onChange={(event) => set("customPlatformName", event.target.value)}
            placeholder="Enter platform name"
          />
        )}
        <Input
          label="Account Label (Optional)"
          maxLength={100}
          value={value.accountLabel}
          onChange={(event) => set("accountLabel", event.target.value)}
          placeholder="Main Account"
        />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">
            2FA Information
          </span>
          <textarea
            value={value.twofaInformation}
            maxLength={10000}
            onChange={(event) => set("twofaInformation", event.target.value)}
            placeholder="Enter 2FA information"
            className="min-h-24 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">
            Authentication Key
          </span>
          <textarea
            value={value.authKey}
            maxLength={2000}
            onChange={(event) => set("authKey", event.target.value)}
            placeholder="Enter authentication key"
            className="min-h-20 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5"
          />
        </label>
      </div>
    </fieldset>
  );
}
