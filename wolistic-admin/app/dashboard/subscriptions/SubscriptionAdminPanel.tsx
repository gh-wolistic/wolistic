"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionPlan = {
  id: number;
  expert_type: string;
  name: string;
  tier: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  coming_soon: boolean;
  created_at: string;
  updated_at: string;
};

type AssignedSubscription = {
  id: number;
  professional_id: string;
  plan_id: number;
  plan: SubscriptionPlan;
  status: string;
  starts_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

type BillingRecord = {
  id: number;
  professional_id: string;
  plan_id: number;
  plan_name: string;
  amount: number;
  currency: string;
  method: string | null;
  invoice_ref: string | null;
  paid_at: string;
  created_at: string;
};

type Tab = "plans" | "assigned" | "billing";
type ExpertType = "all" | "body" | "mind" | "diet";

const EXPERT_TYPES: ExpertType[] = ["all", "body", "mind", "diet"];
const TIERS = ["free", "pro", "elite", "celeb"];
const STATUSES = ["active", "grace", "expired", "cancelled"];
const DEFAULT_FEATURES = [
  "search_boost",
  "featured",
  "group_classes",
  "corporate_events",
  "analytics",
  "priority_support",
];

// ── Plan Form ─────────────────────────────────────────────────────────────────

function PlanForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<SubscriptionPlan>;
  onSave: (data: Partial<SubscriptionPlan>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [expertType, setExpertType] = useState<ExpertType>((initial?.expert_type as ExpertType) ?? "body");
  const [tier, setTier] = useState(initial?.tier ?? "free");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceMonthly, setPriceMonthly] = useState(String(initial?.price_monthly ?? "0"));
  const [priceYearly, setPriceYearly] = useState(String(initial?.price_yearly ?? ""));
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [limitsText, setLimitsText] = useState(
    JSON.stringify(
      initial?.limits ?? { services_limit: 3, coin_multiplier: 1, group_classes_limit: 0 },
      null,
      2
    )
  );
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order ?? "0"));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [comingSoon, setComingSoon] = useState(initial?.coming_soon ?? false);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  function toggleFeature(f: string) {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsedLimits: Record<string, unknown>;
    try {
      parsedLimits = JSON.parse(limitsText) as Record<string, unknown>;
      setLimitsError(null);
    } catch {
      setLimitsError("Limits must be valid JSON");
      return;
    }
    onSave({
      name: name.trim(),
      expert_type: expertType,
      tier,
      description: description.trim() || null,
      price_monthly: parseFloat(priceMonthly) || 0,
      price_yearly: priceYearly ? parseFloat(priceYearly) : null,
      features,
      limits: parsedLimits,
      display_order: parseInt(displayOrder) || 0,
      is_active: isActive,
      coming_soon: comingSoon,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-700">Plan Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            placeholder="e.g. Body Pro"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Expert Type</label>
          <select
            value={expertType}
            onChange={(e) => setExpertType(e.target.value as ExpertType)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          >
            {EXPERT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Price / Month (₹)</label>
          <input
            type="number"
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Price / Year (₹) — optional</label>
          <input
            type="number"
            value={priceYearly}
            onChange={(e) => setPriceYearly(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            min={0}
            placeholder="Leave blank if not applicable"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          rows={2}
          placeholder="Optional short description"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 block mb-2">Features</label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={features.includes(f)}
                onChange={() => toggleFeature(f)}
              />
              {f.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700">
          Limits (JSON) — e.g. {"{"}"services_limit": 10, "coin_multiplier": 2, "group_classes_limit": 5{"}"}
        </label>
        <textarea
          value={limitsText}
          onChange={(e) => setLimitsText(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-1.5 text-sm font-mono"
          rows={4}
        />
        {limitsError && <p className="text-xs text-red-600 mt-1">{limitsError}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
            Active (visible to experts)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="coming_soon"
            checked={comingSoon}
            onChange={(e) => setComingSoon(e.target.checked)}
          />
          <label htmlFor="coming_soon" className="text-sm text-gray-700 cursor-pointer">
            Coming Soon (prevents assignment to professionals)
          </label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded bg-gray-900 text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Plan"}
        </button>
      </div>
    </form>
  );
}

// ── Assign Form ───────────────────────────────────────────────────────────────

function AssignForm({
  plans,
  onSave,
  onCancel,
  saving,
}: {
  plans: SubscriptionPlan[];
  onSave: (data: {
    professional_id: string;
    plan_id: number;
    status: string;
    starts_at: string;
    ends_at: string | null;
    auto_renew: boolean;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [professionalId, setProfessionalId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const [status, setStatus] = useState("active");
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      professional_id: professionalId.trim(),
      plan_id: planId,
      status,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      auto_renew: autoRenew,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-slate-700 rounded p-4 bg-slate-800/50">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-300">Professional ID (UUID) *</label>
          <input
            required
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm font-mono bg-slate-700 text-white placeholder-gray-400"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Plan *</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(Number(e.target.value))}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.expert_type} / {p.tier}) — ₹{p.price_monthly}/mo
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Starts At *</label>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Ends At (optional)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="auto_renew"
          checked={autoRenew}
          onChange={(e) => setAutoRenew(e.target.checked)}
        />
        <label htmlFor="auto_renew" className="text-sm text-gray-300 cursor-pointer">
          Auto Renew
        </label>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded border border-slate-600 text-gray-300 hover:bg-slate-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Assign Plan"}
        </button>
      </div>
    </form>
  );
}

// ── Billing Form ──────────────────────────────────────────────────────────────

function BillingForm({
  plans,
  onSave,
  onCancel,
  saving,
}: {
  plans: SubscriptionPlan[];
  onSave: (data: {
    professional_id: string;
    plan_id: number;
    amount: number;
    currency: string;
    method: string | null;
    invoice_ref: string | null;
    paid_at: string;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [professionalId, setProfessionalId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [method, setMethod] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      professional_id: professionalId.trim(),
      plan_id: planId,
      amount: parseFloat(amount),
      currency: currency.trim() || "INR",
      method: method.trim() || null,
      invoice_ref: invoiceRef.trim() || null,
      paid_at: new Date(paidAt).toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-slate-700 rounded p-4 bg-slate-800/50">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-300">Professional ID (UUID) *</label>
          <input
            required
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm font-mono bg-slate-700 text-white placeholder-gray-400"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Plan *</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(Number(e.target.value))}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.expert_type} / {p.tier})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Amount *</label>
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white placeholder-gray-400"
            min={0}
            step="0.01"
            placeholder="999"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white placeholder-gray-400"
            placeholder="INR"
            maxLength={8}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Payment Method</label>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white placeholder-gray-400"
            placeholder="razorpay / manual / bank"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-300">Invoice Ref</label>
          <input
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white placeholder-gray-400"
            placeholder="INV-2025-001"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-300">Paid At *</label>
          <input
            type="datetime-local"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1 w-full border border-slate-600 rounded px-3 py-1.5 text-sm bg-slate-700 text-white"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded border border-slate-600 text-gray-300 hover:bg-slate-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Log Payment"}
        </button>
      </div>
    </form>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function SubscriptionAdminPanel() {
  const [tab, setTab] = useState<Tab>("plans");
  const [expertTypeFilter, setExpertTypeFilter] = useState<ExpertType>("body");

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Assigned state
  const [assigned, setAssigned] = useState<AssignedSubscription[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  // Billing state
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingProfFilter, setBillingProfFilter] = useState("");

  // Load all plans for dropdowns (no filter)
  const loadAllPlansForDropdown = useCallback(async () => {
    if (plans.length > 0) return;
    try {
      const res = await fetch("/api/admin/subscriptions/plans");
      const data = (await res.json()) as SubscriptionPlan[];
      if (res.ok) setPlans(data);
    } catch {
      // silently fail — dropdowns will be empty
    }
  }, [plans.length]);

  // ── Plans ────────────────────────────────────────────────────────────────

  const loadPlans = useCallback(async (et: ExpertType) => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const qs = et !== "all" ? `?expert_type=${et}` : "";
      const res = await fetch(`/api/admin/subscriptions/plans${qs}`);
      const data = (await res.json()) as SubscriptionPlan[] | { error: string };
      if (!res.ok) throw new Error((data as { error: string }).error || "Failed");
      setPlans(data as SubscriptionPlan[]);
    } catch (err) {
      setPlansError(err instanceof Error ? err.message : "Error loading plans");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadAssigned = useCallback(async () => {
    setAssignedLoading(true);
    setAssignedError(null);
    try {
      const res = await fetch("/api/admin/subscriptions/assigned");
      const data = (await res.json()) as AssignedSubscription[] | { error: string };
      if (!res.ok) throw new Error((data as { error: string }).error || "Failed");
      setAssigned(data as AssignedSubscription[]);
    } catch (err) {
      setAssignedError(err instanceof Error ? err.message : "Error loading subscriptions");
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  const loadBilling = useCallback(async (profId?: string) => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const qs = profId?.trim() ? `?professional_id=${encodeURIComponent(profId.trim())}` : "";
      const res = await fetch(`/api/admin/subscriptions/billing${qs}`);
      const data = (await res.json()) as BillingRecord[] | { error: string };
      if (!res.ok) throw new Error((data as { error: string }).error || "Failed");
      setBilling(data as BillingRecord[]);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Error loading billing records");
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "plans") void loadPlans(expertTypeFilter);
    if (tab === "assigned") { void loadAssigned(); void loadAllPlansForDropdown(); }
    if (tab === "billing") { void loadBilling(); void loadAllPlansForDropdown(); }
  }, [tab, expertTypeFilter, loadPlans, loadAssigned, loadBilling, loadAllPlansForDropdown]);

  async function handleSavePlan(data: Partial<SubscriptionPlan>) {
    setSavingPlan(true);
    try {
      if (editingPlan) {
        const res = await fetch(`/api/admin/subscriptions/plans/${editingPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error: string };
          throw new Error(e.error || "Failed to update");
        }
        setEditingPlan(null);
      } else {
        const res = await fetch("/api/admin/subscriptions/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error: string };
          throw new Error(e.error || "Failed to create");
        }
        setShowNewPlanForm(false);
      }
      await loadPlans(expertTypeFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving plan");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleDeletePlan(id: number) {
    if (!confirm("Delete this plan? This cannot be undone if professionals are assigned.")) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/plans/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const e = (await res.json()) as { error: string };
        throw new Error(e.error || "Failed to delete");
      }
      await loadPlans(expertTypeFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting plan");
    }
  }

  // ── Assigned ─────────────────────────────────────────────────────────────

  async function handleAssign(data: {
    professional_id: string;
    plan_id: number;
    status: string;
    starts_at: string;
    ends_at: string | null;
    auto_renew: boolean;
  }) {
    setSavingAssign(true);
    try {
      const res = await fetch("/api/admin/subscriptions/assigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = (await res.json()) as { error: string };
        throw new Error(e.error || "Failed to assign");
      }
      setShowAssignForm(false);
      await loadAssigned();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error assigning plan");
    } finally {
      setSavingAssign(false);
    }
  }

  async function handleDeleteAssigned(id: number) {
    if (!confirm("Remove this assigned subscription?")) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/assigned/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const e = (await res.json()) as { error: string };
        throw new Error(e.error || "Failed to remove");
      }
      await loadAssigned();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error removing subscription");
    }
  }

  // ── Billing ───────────────────────────────────────────────────────────────

  async function handleSaveBilling(data: {
    professional_id: string;
    plan_id: number;
    amount: number;
    currency: string;
    method: string | null;
    invoice_ref: string | null;
    paid_at: string;
  }) {
    setSavingBilling(true);
    try {
      const res = await fetch("/api/admin/subscriptions/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = (await res.json()) as { error: string };
        throw new Error(e.error || "Failed to log billing");
      }
      setShowBillingForm(false);
      await loadBilling(billingProfFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error logging billing record");
    } finally {
      setSavingBilling(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-slate-700">
        {(["plans", "assigned", "billing"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold transition-all relative ${
              tab === t
                ? "text-white bg-slate-800/50"
                : "text-gray-400 hover:text-gray-300 hover:bg-slate-800/30"
            }`}
          >
            {t === "plans" ? "Subscription Plans" : t === "assigned" ? "Assigned" : "Billing Records"}
            {tab === t && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>
            )}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ─────────────────────────────────────────────────────── */}
      {tab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-300">Filter by Expert Type:</label>
              <select
                value={expertTypeFilter}
                onChange={(e) => setExpertTypeFilter(e.target.value as ExpertType)}
                className="border border-slate-600 rounded-lg px-4 py-2 text-sm font-medium bg-slate-700 text-white hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {EXPERT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setEditingPlan(null);
                setShowNewPlanForm(true);
              }}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-sm"
            >
              + New Plan
            </button>
          </div>

          {showNewPlanForm && !editingPlan && (
            <PlanForm
              onSave={handleSavePlan}
              onCancel={() => setShowNewPlanForm(false)}
              saving={savingPlan}
            />
          )}

          {editingPlan && (
            <PlanForm
              initial={editingPlan}
              onSave={handleSavePlan}
              onCancel={() => setEditingPlan(null)}
              saving={savingPlan}
            />
          )}

          {plansLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">Loading plans...</p>
            </div>
          )}
          
          {plansError && (
            <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-4">
              <p className="text-sm text-red-400 font-medium">{plansError}</p>
            </div>
          )}

          {!plansLoading && plans.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-600">
              <p className="text-sm text-gray-300 font-medium">No plans found for this expert type.</p>
              <p className="text-xs text-gray-500 mt-1">Click "+ New Plan" above to create one.</p>
            </div>
          )}
          
          {!plansLoading && plans.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-white font-medium">
                Showing <span className="font-bold">{plans.length}</span> plan{plans.length !== 1 ? "s" : ""} for{" "}
                <span className="font-bold capitalize">{expertTypeFilter}</span> experts
              </p>
            </div>
          )}

          {plans.map((plan) => {
            // Tier color schemes (dark theme)
            const tierColors = {
              free: "bg-slate-800/50 border-gray-600",
              pro: "bg-slate-800/50 border-cyan-500",
              elite: "bg-slate-800/50 border-purple-500",
              celeb: "bg-slate-800/50 border-amber-500",
            };
            const tierBadgeColors = {
              free: "bg-gray-600 text-gray-100",
              pro: "bg-cyan-600 text-cyan-100",
              elite: "bg-purple-600 text-purple-100",
              celeb: "bg-amber-600 text-amber-100",
            };
            
            const limitKeys = Object.keys(plan.limits);
            const limitCount = limitKeys.length;
            const displayLimits = limitKeys.slice(0, 3);
            
            return (
              <div
                key={plan.id}
                className={`rounded-lg border-2 p-5 space-y-3 ${
                  tierColors[plan.tier as keyof typeof tierColors] || "bg-slate-800/50 border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-xl text-white">{plan.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${
                          tierBadgeColors[plan.tier as keyof typeof tierBadgeColors] || "bg-gray-600 text-gray-100"
                        }`}
                      >
                        {plan.tier}
                      </span>
                      {plan.coming_soon && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-orange-600 text-orange-100 font-semibold">
                          🔒 COMING SOON
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-600 text-red-100 font-semibold">
                          ⚠️ INACTIVE
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-gray-300 font-medium border border-slate-600">
                        {plan.expert_type}
                      </span>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="text-sm text-gray-300 mt-2 leading-relaxed">{plan.description}</p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3 mt-3">
                      <span className="text-2xl font-bold text-white">₹{plan.price_monthly}</span>
                      <span className="text-sm text-gray-400 font-medium">/month</span>
                      {plan.price_yearly && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-sm text-gray-300 font-medium">
                            ₹{plan.price_yearly}/year
                            <span className="ml-1 text-xs text-green-400 font-semibold">
                              (Save {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                            </span>
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-xs text-gray-400 font-medium">Display Order: {plan.display_order}</span>
                    </div>

                    {/* Features */}
                    {plan.features.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">Features</p>
                        <div className="flex flex-wrap gap-1.5">
                          {plan.features.map((feature: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-slate-700 text-gray-200 border border-slate-600 font-medium"
                            >
                              {feature.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limits Preview */}
                    {limitCount > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                          Limits ({limitCount} configured)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {displayLimits.map((key) => (
                            <div key={key} className="text-xs bg-slate-700/50 rounded px-2 py-1.5 border border-slate-600">
                              <span className="text-gray-400 font-medium">{key.replace(/_/g, " ")}:</span>{" "}
                              <span className="font-bold text-white">{String(plan.limits[key])}</span>
                            </div>
                          ))}
                          {limitCount > 3 && (
                            <div className="text-xs bg-slate-700/50 rounded px-2 py-1.5 border border-slate-600 text-gray-400 italic font-medium">
                              +{limitCount - 3} more limits...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setShowNewPlanForm(false);
                        setEditingPlan(plan);
                      }}
                      className="text-sm px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDeletePlan(plan.id)}
                      className="text-sm px-4 py-2 rounded-lg border border-red-600 bg-slate-700 text-red-400 hover:bg-red-900/30 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Assigned Tab ─────────────────────────────────────────────────── */}
      {tab === "assigned" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <p className="text-sm font-semibold text-white">
              {assigned.length} subscription{assigned.length !== 1 ? "s" : ""} assigned
            </p>
            <button
              onClick={() => setShowAssignForm(true)}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-sm"
            >
              + Assign Plan
            </button>
          </div>

          {showAssignForm && (
            <AssignForm
              plans={plans.length > 0 ? plans : []}
              onSave={handleAssign}
              onCancel={() => setShowAssignForm(false)}
              saving={savingAssign}
            />
          )}

          {assignedLoading && <p className="text-sm text-gray-400">Loading…</p>}
          {assignedError && <p className="text-sm text-red-400">{assignedError}</p>}

          {!assignedLoading && assigned.length === 0 && (
            <p className="text-sm text-gray-400">No subscriptions assigned yet.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-700 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-3 py-2">Professional ID</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Starts</th>
                  <th className="px-3 py-2">Ends</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-mono text-xs text-gray-400 max-w-[200px] truncate">
                      {s.professional_id}
                    </td>
                    <td className="px-3 py-2 font-medium text-white">{s.plan.name}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-gray-300 capitalize border border-slate-600">
                        {s.plan.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "active"
                            ? "bg-green-600 text-green-100"
                            : s.status === "expired" || s.status === "cancelled"
                            ? "bg-red-600 text-red-100"
                            : "bg-amber-600 text-amber-100"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {new Date(s.starts_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {s.ends_at ? new Date(s.ends_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => void handleDeleteAssigned(s.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Billing Tab ──────────────────────────────────────────────────── */}
      {tab === "billing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                value={billingProfFilter}
                onChange={(e) => setBillingProfFilter(e.target.value)}
                placeholder="Filter by Professional UUID..."
                className="flex-1 border border-slate-600 rounded-lg px-4 py-2 text-sm font-mono bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={() => void loadBilling(billingProfFilter)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 transition-colors"
              >
                Filter
              </button>
            </div>
            <button
              onClick={() => setShowBillingForm(true)}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-sm"
            >
              + Log Payment
            </button>
          </div>

          {showBillingForm && (
            <BillingForm
              plans={plans.length > 0 ? plans : []}
              onSave={handleSaveBilling}
              onCancel={() => setShowBillingForm(false)}
              saving={savingBilling}
            />
          )}

          {billingLoading && <p className="text-sm text-gray-400">Loading...</p>}
          {billingError && <p className="text-sm text-red-400">{billingError}</p>}

          {!billingLoading && billing.length === 0 && (
            <p className="text-sm text-gray-400">No billing records found.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-700 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-3 py-2">Professional ID</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Invoice Ref</th>
                  <th className="px-3 py-2">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-mono text-xs text-gray-400 max-w-[200px] truncate">
                      {r.professional_id}
                    </td>
                    <td className="px-3 py-2 font-medium text-white">{r.plan_name}</td>
                    <td className="px-3 py-2 font-medium text-white">
                      {r.currency === "INR" ? "₹" : r.currency}
                      {r.amount}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{r.method ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{r.invoice_ref ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {new Date(r.paid_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
