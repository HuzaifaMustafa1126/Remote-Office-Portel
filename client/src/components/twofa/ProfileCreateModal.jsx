import { Plus } from "lucide-react";
import { useState } from "react";
import * as twofa from "../../services/twofa.service";
import { errorMessage } from "../../utils/helpers";
import Button from "../common/Button";
import Input from "../common/Input";
import Modal from "../common/Modal";
import PlatformFields, {
  emptyPlatform,
  platformPayload,
  validatePlatform,
} from "./PlatformFields";

export default function ProfileCreateModal({ open, onClose, onCreated }) {
  const [profileName, setProfileName] = useState("");
  const [platforms, setPlatforms] = useState([emptyPlatform()]);
  const [createdProfile, setCreatedProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reset = () => {
    setProfileName("");
    setPlatforms([emptyPlatform()]);
    setCreatedProfile(null);
    setError("");
  };
  const close = () => {
    if (!busy) {
      reset();
      onClose();
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!profileName.trim()) return setError("Enter a profile name.");
    const invalid = platforms.map(validatePlatform).find(Boolean);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    let profile = createdProfile;
    try {
      if (!profile) {
        profile = await twofa.createProfile({
          profileName: profileName.trim(),
        });
        setCreatedProfile(profile);
      }
      await twofa.addPlatforms(profile.id, platforms.map(platformPayload));
      reset();
      onClose();
      onCreated(profile);
    } catch (requestError) {
      setError(
        profile
          ? `The profile was created, but its platforms were not added. Your entries are preserved; choose Retry Platforms. ${errorMessage(requestError)}`
          : errorMessage(requestError),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} title="Add New Profile" onClose={close}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Create a profile and add authentication details for one or more
          platforms.
        </p>
        <Input
          label="Profile Name"
          required
          maxLength={150}
          disabled={Boolean(createdProfile)}
          value={profileName}
          onChange={(event) => setProfileName(event.target.value)}
          placeholder="Client ABC"
          autoFocus
        />
        <div className="space-y-4">
          {platforms.map((platform, index) => (
            <PlatformFields
              key={index}
              number={index + 1}
              value={platform}
              removable={platforms.length > 1}
              onRemove={() =>
                setPlatforms((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              onChange={(next) =>
                setPlatforms((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? next : item,
                  ),
                )
              }
            />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setPlatforms((current) => [...current, emptyPlatform()])
          }
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> Add Another Platform
          </span>
        </Button>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : createdProfile
                ? "Retry Platforms"
                : "Create Profile"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
