import { useEffect, useState } from "react";
import { ChevronDown, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import useAuth from "../hooks/useAuth";
import * as service from "../services/companyPolicy.service";
import { PERMISSIONS as P } from "../utils/permissions";

const emptyForm = { title: "", content: "" };

export default function CompanyPoliciesPage() {
  const { user } = useAuth();
  const canManage = user.permissions.includes(P.COMPANY_POLICY_MANAGE);
  const [policies, setPolicies] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setPolicies(await service.listPolicies());
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load company policies.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showForm = (policy = null) => {
    setEditing(policy || { id: null });
    setForm(
      policy
        ? { title: policy.title, content: policy.content }
        : emptyForm,
    );
    setError("");
  };

  const closeForm = () => {
    if (saving) return;
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = editing?.id
        ? await service.updatePolicy(editing.id, form)
        : await service.createPolicy(form);
      setPolicies((current) =>
        editing?.id
          ? current.map((policy) => (policy.id === saved.id ? saved : policy))
          : [saved, ...current],
      );
      setOpenId(saved.id);
      setEditing(null);
      setForm(emptyForm);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save the company policy.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (policy) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    setError("");
    try {
      await service.deletePolicy(policy.id);
      setPolicies((current) =>
        current.filter((item) => item.id !== policy.id),
      );
      if (openId === policy.id) setOpenId(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to delete the company policy.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Company Policies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read the current policies and guidelines for the company.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => showForm()}>
            <span className="flex items-center gap-2">
              <Plus size={17} /> Add Policy
            </span>
          </Button>
        )}
      </div>

      {error && !editing && (
        <p className="mb-4 rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading policies…
        </p>
      ) : policies.length ? (
        <div className="space-y-3">
          {policies.map((policy) => {
            const isOpen = openId === policy.id;
            return (
              <article
                key={policy.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : policy.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-text">
                      <FileText size={19} />
                    </span>
                    <span className="min-w-0 flex-1 font-semibold text-foreground">
                      {policy.title}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1 border-l border-border pl-3">
                      <button
                        type="button"
                        aria-label={`Edit ${policy.title}`}
                        title="Edit policy"
                        onClick={() => showForm(policy)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${policy.title}`}
                        title="Delete policy"
                        onClick={() => remove(policy)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-border px-5 py-5 sm:px-[4.75rem]">
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                      {policy.content}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState
            title="No company policies yet"
            description={
              canManage
                ? "Add the first policy for employees to read."
                : "Company policies will appear here when they are published."
            }
          />
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing?.id ? "Edit Company Policy" : "Add Company Policy"}
        onClose={closeForm}
      >
        <form onSubmit={save} className="space-y-5">
          <Input
            label="Policy Title"
            value={form.title}
            maxLength={200}
            required
            autoFocus
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Policy Content
            </span>
            <textarea
              className="min-h-64 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-foreground outline-none transition focus:border-primary-border focus:ring-3 focus:ring-primary-border"
              value={form.content}
              maxLength={50000}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
            />
          </label>
          {error && (
            <p className="rounded-xl border border-danger-border bg-danger-soft p-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Policy"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
