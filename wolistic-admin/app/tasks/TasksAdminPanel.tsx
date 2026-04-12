"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Template = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  applies_to_subtype: string | null;
  is_active: boolean;
  created_at: string;
};

type Assignment = {
  professional_id: string;
  full_name: string | null;
  email: string;
  username: string | null;
  status: string;
};

type FormData = {
  title: string;
  description: string;
  category: string;
  priority: string;
  applies_to_subtype: string;
  is_active: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Profile", "Onboarding", "Growth", "Marketing"];
const PRIORITIES = ["low", "medium", "high"];
const SUBTYPES = ["", "body_expert", "nutritionist", "yoga_instructor", "therapist", "trainer"];

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  category: "Profile",
  priority: "medium",
  applies_to_subtype: "",
  is_active: true,
};

const STATUS_COLORS: Record<string, string> = {
  "yet-to-start": "bg-zinc-100 text-zinc-600",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-50 text-green-700 border border-green-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  high: "bg-red-50 text-red-700 border border-red-200",
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TasksAdminPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state (used for both create and edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Assignments drawer
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // ── Fetch templates ─────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/activity-templates");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Template[] = await res.json();
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Fetch assignments for a template ────────────────────────────────────────
  const openAssignments = async (id: number) => {
    setViewingId(id);
    setAssignmentsLoading(true);
    setAssignments([]);
    try {
      const res = await fetch(`/api/admin/activity-templates/${id}/assignments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAssignments(await res.json());
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // ── Open create form ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  // ── Open edit form ───────────────────────────────────────────────────────────
  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      category: t.category,
      priority: t.priority,
      applies_to_subtype: t.applies_to_subtype ?? "",
      is_active: t.is_active,
    });
    setFormError(null);
    setShowForm(true);
  };

  // ── Save (create or update) ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      applies_to_subtype: form.applies_to_subtype || null,
      is_active: form.is_active,
    };
    try {
      const url =
        editingId !== null
          ? `/api/admin/activity-templates/${editingId}`
          : "/api/admin/activity-templates";
      const res = await fetch(url, {
        method: editingId !== null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setShowForm(false);
      await fetchTemplates();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ────────────────────────────────────────────────────────────
  const toggleActive = async (t: Template) => {
    try {
      await fetch(`/api/admin/activity-templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          applies_to_subtype: t.applies_to_subtype,
          is_active: !t.is_active,
        }),
      });
      setTemplates((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)),
      );
    } catch {
      /* ignore — optimistic already applied, just leave it */
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/activity-templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (viewingId === id) setViewingId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const viewingTemplate = viewingId !== null ? templates.find((t) => t.id === viewingId) : null;

  return (
    <div className="flex gap-6">
      {/* ── Left: templates list ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Wolistic Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Platform-wide activity templates shown to professionals in their Activity Manager.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Task
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Create your first Wolistic task template above.</p>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl border p-4 transition-shadow hover:shadow-sm ${
                  viewingId === t.id ? "border-emerald-400 bg-emerald-50/40" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(t)}
                    title={t.is_active ? "Click to deactivate" : "Click to activate"}
                    className={`mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 ${
                      t.is_active ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${
                        t.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority] ?? ""}`}>
                        {cap(t.priority)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {t.category}
                      </span>
                      {t.applies_to_subtype && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          {t.applies_to_subtype.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(t.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openAssignments(t.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      Assignments
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${t.title}"? This cannot be undone.`)) {
                          handleDelete(t.id);
                        }
                      }}
                      disabled={deletingId === t.id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === t.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: form or assignments panel ─────────────────────────────────── */}
      {(showForm || viewingTemplate) && (
        <div className="w-96 shrink-0">
          {showForm && (
            <div className="border border-gray-200 rounded-xl bg-white p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  {editingId !== null ? "Edit Task" : "New Task"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Complete your profile bio"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional guidance for the professional…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{cap(p)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Assign to subtype
                    <span className="text-gray-400 font-normal ml-1">(leave blank for all)</span>
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={form.applies_to_subtype}
                    onChange={(e) => setForm((f) => ({ ...f, applies_to_subtype: e.target.value }))}
                  >
                    {SUBTYPES.map((s) => (
                      <option key={s} value={s}>{s === "" ? "All professionals" : s.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
                    Active (visible to professionals)
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId !== null ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </div>
          )}

          {!showForm && viewingTemplate && (
            <div className="border border-gray-200 rounded-xl bg-white p-5 sticky top-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Assignments</h2>
                <button
                  onClick={() => setViewingId(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-1">{viewingTemplate.title}</p>

              {assignmentsLoading && (
                <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
              )}
              {!assignmentsLoading && assignments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No professional has interacted with this task yet.
                </p>
              )}
              {!assignmentsLoading && assignments.length > 0 && (
                <div className="space-y-2">
                  {/* Summary row */}
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {(["yet-to-start", "in-progress", "completed", "rejected"] as const).map((s) => {
                      const count = assignments.filter((a) => a.status === s).length;
                      return (
                        <div key={s} className="text-center">
                          <div className="text-lg font-bold text-gray-800">{count}</div>
                          <div className="text-[10px] text-gray-400 leading-tight">{s.replace(/-/g, " ")}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 pt-3 space-y-2 max-h-96 overflow-y-auto">
                    {assignments.map((a) => (
                      <div key={a.professional_id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {a.full_name ?? a.email}
                          </p>
                          {a.username && (
                            <p className="text-xs text-gray-400 truncate">@{a.username}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {a.status.replace(/-/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
