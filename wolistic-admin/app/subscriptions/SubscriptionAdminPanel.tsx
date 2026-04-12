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
const TIERS = ["free", "pro", "elite"];
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
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700">Professional ID (UUID) *</label>
          <input
            required
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm font-mono"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Plan *</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.expert_type} / {p.tier}) — ₹{p.price_monthly}/mo
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Starts At *</label>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Ends At (optional)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
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
        <label htmlFor="auto_renew" className="text-sm text-gray-700 cursor-pointer">
          Auto Renew
        </label>
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
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700">Professional ID (UUID) *</label>
          <input
            required
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm font-mono"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Plan *</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.expert_type} / {p.tier})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Amount *</label>
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            min={0}
            step="0.01"
            placeholder="999"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            placeholder="INR"
            maxLength={8}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Payment Method</label>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            placeholder="razorpay / manual / bank"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Invoice Ref</label>
          <input
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
            placeholder="INV-2025-001"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700">Paid At *</label>
          <input
            type="datetime-local"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-1.5 text-sm"
          />
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
      <div className="flex gap-2 border-b pb-2">
        {(["plans", "assigned", "billing"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-t font-medium transition-colors ${
              tab === t
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {t === "plans" ? "Subscription Plans" : t === "assigned" ? "Assigned" : "Billing Records"}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ─────────────────────────────────────────────────────── */}
      {tab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Expert Type:</label>
              <select
                value={expertTypeFilter}
                onChange={(e) => setExpertTypeFilter(e.target.value as ExpertType)}
                className="border rounded px-3 py-1.5 text-sm"
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
              className="px-4 py-1.5 text-sm rounded bg-gray-900 text-white hover:bg-gray-700"
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

          {plansLoading && <p className="text-sm text-gray-500">Loading plans…</p>}
          {plansError && <p className="text-sm text-red-600">{plansError}</p>}

          {!plansLoading && plans.length === 0 && (
            <p className="text-sm text-gray-500">No plans found for this expert type.</p>
          )}

          {plans.map((plan) => (
            <div key={plan.id} className="rounded border p-4 space-y-2 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{plan.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-medium capitalize">
                      {plan.tier}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {plan.expert_type}
                    </span>
                    {!plan.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    ₹{plan.price_monthly}/mo
                    {plan.price_yearly ? ` · ₹${plan.price_yearly}/yr` : ""}
                    {" · "}Order: {plan.display_order}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Features: {plan.features.length > 0 ? plan.features.join(", ") : "none"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Limits: {JSON.stringify(plan.limits)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowNewPlanForm(false);
                      setEditingPlan(plan);
                    }}
                    className="text-xs px-3 py-1 rounded border hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDeletePlan(plan.id)}
                    className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Assigned Tab ─────────────────────────────────────────────────── */}
      {tab === "assigned" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{assigned.length} subscription(s) assigned</p>
            <button
              onClick={() => setShowAssignForm(true)}
              className="px-4 py-1.5 text-sm rounded bg-gray-900 text-white hover:bg-gray-700"
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

          {assignedLoading && <p className="text-sm text-gray-500">Loading…</p>}
          {assignedError && <p className="text-sm text-red-600">{assignedError}</p>}

          {!assignedLoading && assigned.length === 0 && (
            <p className="text-sm text-gray-500">No subscriptions assigned yet.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-gray-500 uppercase tracking-wide">
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
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                      {s.professional_id}
                    </td>
                    <td className="px-3 py-2 font-medium">{s.plan.name}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 capitalize">
                        {s.plan.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "active"
                            ? "bg-green-100 text-green-700"
                            : s.status === "expired" || s.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(s.starts_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {s.ends_at ? new Date(s.ends_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => void handleDeleteAssigned(s.id)}
                        className="text-xs text-red-600 hover:underline"
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <input
                value={billingProfFilter}
                onChange={(e) => setBillingProfFilter(e.target.value)}
                placeholder="Filter by Professional UUID…"
                className="flex-1 border rounded px-3 py-1.5 text-sm font-mono"
              />
              <button
                onClick={() => void loadBilling(billingProfFilter)}
                className="px-3 py-1.5 text-sm rounded bg-gray-900 text-white"
              >
                Filter
              </button>
            </div>
            <button
              onClick={() => setShowBillingForm(true)}
              className="px-4 py-1.5 text-sm rounded bg-gray-900 text-white hover:bg-gray-700"
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

          {billingLoading && <p className="text-sm text-gray-500">Loading…</p>}
          {billingError && <p className="text-sm text-red-600">{billingError}</p>}

          {!billingLoading && billing.length === 0 && (
            <p className="text-sm text-gray-500">No billing records found.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-xs text-gray-500 uppercase tracking-wide">
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
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                      {r.professional_id}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.plan_name}</td>
                    <td className="px-3 py-2 font-medium">
                      {r.currency === "INR" ? "₹" : r.currency}
                      {r.amount}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r.method ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{r.invoice_ref ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
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
