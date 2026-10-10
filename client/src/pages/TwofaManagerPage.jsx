import { ArrowRight, Plus, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import ResponsiveTable from "../components/common/ResponsiveTable";
import ProfileCreateModal from "../components/twofa/ProfileCreateModal";
import usePermission from "../hooks/usePermission";
import * as twofa from "../services/twofa.service";
import { errorMessage } from "../utils/helpers";
import { PERMISSIONS as P } from "../utils/permissions";

const when = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export default function TwofaManagerPage() {
  const navigate = useNavigate();
  const canCreate = usePermission(P.TWOFA_PROFILE_CREATE);
  const [query, setQuery] = useState({
    search: "",
    page: 1,
    limit: 20,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      setResult(await twofa.listProfiles(query));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [query]);
  const set = (key, value) =>
    setQuery((current) => ({ ...current, [key]: value, page: 1 }));
  return (
    <>
      <PageHeader
        title="2FA Manager"
        description="Manage authentication profiles and securely stored platform credentials."
        action={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus size={17} /> Add Profile
              </span>
            </Button>
          ) : null
        }
      />
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger"
        >
          <span>{error}</span>
          <button className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full max-w-md">
            <span className="sr-only">Search profiles</span>
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query.search}
              onChange={(event) => set("search", event.target.value)}
              placeholder="Search profiles…"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3"
            />
          </label>
          <select
            aria-label="Sort profiles"
            value={`${query.sortBy}:${query.sortOrder}`}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(":");
              setQuery((current) => ({
                ...current,
                sortBy,
                sortOrder,
                page: 1,
              }));
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          >
            <option value="updatedAt:DESC">Recently updated</option>
            <option value="createdAt:DESC">Newest created</option>
            <option value="profileName:ASC">Name A–Z</option>
          </select>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading profiles">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-surface-secondary"
              />
            ))}
          </div>
        ) : result?.rows?.length ? (
          <>
            <div className="overflow-x-auto">
              <ResponsiveTable className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Profile Name</th>
                    <th className="px-4 py-3">Platforms</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.rows.map((profile) => (
                    <tr key={profile.id} className="hover:bg-surface-secondary">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary-text">
                            <ShieldCheck size={18} />
                          </span>
                          <span className="font-semibold">
                            {profile.profileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {profile.platformCount}{" "}
                        {profile.platformCount === 1 ? "Platform" : "Platforms"}
                      </td>
                      <td className="px-4 py-4">
                        {profile.createdBy.name || "Former employee"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {when(profile.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate(`/2fa-manager/${profile.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold hover:bg-hover"
                        >
                          View <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            </div>
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <span className="text-muted-foreground">
                {result.meta.total} profiles
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={query.page <= 1}
                  onClick={() =>
                    setQuery((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={query.page >= result.meta.pages}
                  onClick={() =>
                    setQuery((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="pb-8">
            <EmptyState
              title="No 2FA Profiles Yet"
              description="Create your first profile to organize platform authentication information."
            />
            {canCreate && (
              <div className="flex justify-center">
                <Button onClick={() => setCreateOpen(true)}>
                  <span className="flex items-center gap-2"><Plus size={16} /> Add Profile</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
      <ProfileCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(profile) => {
          load();
          navigate(`/2fa-manager/${profile.id}`);
        }}
      />
    </>
  );
}
