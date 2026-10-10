import { ArrowLeft, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AccessTab from "../components/twofa/AccessTab";
import HistoryTab from "../components/twofa/HistoryTab";
import PlatformsTab from "../components/twofa/PlatformsTab";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import usePermission from "../hooks/usePermission";
import * as twofa from "../services/twofa.service";
import { errorMessage } from "../utils/helpers";
import { PERMISSIONS as P } from "../utils/permissions";

const when = (value) => value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "long" }).format(new Date(value)) : "—";

export default function TwofaProfilePage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const canEdit = usePermission(P.TWOFA_PROFILE_EDIT), canDelete = usePermission(P.TWOFA_PROFILE_DELETE), canAdd = usePermission(P.TWOFA_PLATFORM_ADD), canEditPlatform = usePermission(P.TWOFA_PLATFORM_EDIT), canDeletePlatform = usePermission(P.TWOFA_PLATFORM_DELETE), canRevealTwofa = usePermission(P.TWOFA_INFORMATION_REVEAL), canRevealKey = usePermission(P.TWOFA_KEY_REVEAL), canHistory = usePermission(P.TWOFA_HISTORY_VIEW), canAccess = usePermission(P.TWOFA_ACCESS_MANAGE);
  const [profile, setProfile] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [tab, setTab] = useState("platforms"), [editing, setEditing] = useState(false), [deleting, setDeleting] = useState(false), [name, setName] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => { setLoading(true); try { const value = await twofa.getProfile(profileId); setProfile(value); setName(value.profileName); setError(""); } catch (requestError) { setError(errorMessage(requestError)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [profileId]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  const saveProfile = async (event) => { event.preventDefault(); if (!name.trim()) return; setBusy(true); try { const updated = await twofa.updateProfile(profileId, { profileName: name.trim() }); setProfile((current) => ({ ...current, ...updated })); setEditing(false); setNotice("Profile updated successfully."); } catch (requestError) { setError(errorMessage(requestError)); } finally { setBusy(false); } };
  const removeProfile = async () => { setBusy(true); try { await twofa.deleteProfile(profileId); navigate("/2fa-manager", { replace: true }); } catch (requestError) { setError(errorMessage(requestError)); setDeleting(false); } finally { setBusy(false); } };
  if (loading) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-surface-secondary" /><div className="h-72 animate-pulse rounded-2xl bg-surface-secondary" /></div>;
  if (!profile) return <div className="rounded-2xl border border-danger-border bg-danger-soft p-8 text-center"><h1 className="font-bold">Profile unavailable</h1><p className="mt-2 text-sm text-danger">{error || "This profile could not be loaded."}</p><Button className="mt-4" variant="secondary" onClick={() => navigate("/2fa-manager")}>Back to profiles</Button></div>;
  const tabs = [{ id: "platforms", label: "Platforms", show: true }, { id: "history", label: "Activity History", show: canHistory }, { id: "access", label: "Employee Access", show: canAccess && profile.capabilities.canManageAccess }].filter((item) => item.show);
  const platformPermissions = { canAdd, canEdit: canEditPlatform, canDelete: canDeletePlatform, canRevealTwofa, canRevealKey };
  return <>
    {notice && <div role="status" className="notification-toast fixed right-5 top-5 z-[80] max-w-sm rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success shadow-xl">{notice}</div>}
    <button onClick={() => navigate("/2fa-manager")} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to profiles</button>
    <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-text"><ShieldCheck size={23} /></span><div><h1 className="text-2xl font-bold">{profile.profileName}</h1><p className="mt-1 text-sm text-muted-foreground">Created by {profile.createdBy.name || "Former employee"} · {when(profile.createdAt)}</p></div></div><div className="flex flex-wrap gap-2">{canEdit && profile.capabilities.canEdit && <Button variant="secondary" onClick={() => setEditing(true)}><span className="flex items-center gap-2"><Pencil size={16} /> Edit Profile</span></Button>}{canDelete && profile.capabilities.canEdit && <Button variant="danger" onClick={() => setDeleting(true)}><span className="flex items-center gap-2"><Trash2 size={16} /> Delete Profile</span></Button>}</div></div></header>
    {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
    <div className="mt-6 border-b border-border"><div role="tablist" className="flex gap-1 overflow-x-auto">{tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div></div>
    <section className="mt-5">{tab === "platforms" && <PlatformsTab profile={profile} permissions={platformPermissions} setNotice={setNotice} />}{tab === "history" && canHistory && <HistoryTab profileId={profile.id} />}{tab === "access" && canAccess && profile.capabilities.canManageAccess && <AccessTab profileId={profile.id} setNotice={setNotice} />}</section>
    <Modal open={editing} title="Edit Profile" onClose={() => !busy && setEditing(false)}><form onSubmit={saveProfile} className="space-y-4"><Input autoFocus label="Profile Name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} /><div className="flex justify-end gap-3 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button></div></form></Modal>
    <Modal open={deleting} title="Delete Profile?" onClose={() => !busy && setDeleting(false)}><p className="text-sm text-muted-foreground">This profile and its platforms will no longer be accessible through the normal 2FA Manager interface. Activity history will be preserved.</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDeleting(false)}>Cancel</Button><Button variant="danger" disabled={busy} onClick={removeProfile}>{busy ? "Deleting…" : "Delete Profile"}</Button></div></Modal>
  </>;
}
