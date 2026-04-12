"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Gem,
  CheckCircle,
  Lock,
  Calendar,
  CreditCard,
  Download,
  TrendingUp,
  Users,
  Star,
  Coins,
  ClipboardList,
  Shield,
  BarChart3,
  Sparkles,
  Briefcase,
  Loader2,
  ArrowUpCircle,
  Mail,
  Ticket,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  getMySubscription,
  createUpgradeOrder,
  verifyUpgrade,
  raisePriorityTicket,
  type MySubscriptionResponse,
  type SubscriptionPlan,
  type BillingRecord,
  type UpgradeVerifyData,
} from "./subscriptionApi";

// ── Razorpay script loader ────────────────────────────────────────────────────
// Window.Razorpay type is declared in components/payment/hooks/usePaymentFlow.ts

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}


// ── Local UI helpers ──────────────────────────────────────────────────────────

function EliteGlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Tier / status config ──────────────────────────────────────────────────────

const TIER_CONFIG = {
  free: {
    name: "Free",
    color: "zinc",
    gradient: "from-zinc-500/20 to-zinc-600/10",
    border: "border-zinc-400/30",
    text: "text-zinc-400",
  },
  pro: {
    name: "Pro",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-400/30",
    text: "text-emerald-400",
  },
  elite: {
    name: "Elite",
    color: "violet",
    gradient: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-400/30",
    text: "text-violet-400",
  },
} as const;

const STATUS_CONFIG = {
  active: {
    label: "Active",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  grace: {
    label: "Grace Period",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  expired: {
    label: "Expired",
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
} as const;

// ── Feature rows from plan.features list ──────────────────────────────────────

const FEATURE_META: Record<
  string,
  { icon: React.ElementType; name: string }
> = {
  search_boost: { icon: TrendingUp, name: "Search Ranking Boost" },
  featured: { icon: Star, name: "Featured Card on Discovery" },
  group_classes: { icon: Users, name: "Group Classes" },
  corporate_events: { icon: Briefcase, name: "Corporate Events" },
  analytics: { icon: BarChart3, name: "Advanced Analytics" },
  priority_support: { icon: Shield, name: "Priority Support" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SubscriptionPage() {
  const { accessToken, user } = useAuthSession();
  const userStatus = user?.userStatus ?? null;
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upgrade flow state
  const [upgrading, setUpgrading] = useState<number | null>(null); // plan_id being processed
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Priority ticket modal state
  const [ticketPlanId, setTicketPlanId] = useState<number | null>(null);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const ticketTextareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMySubscription(accessToken);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpgradeClick = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!accessToken) return;
      setUpgradeError(null);

      // Celeb tier → contact sales
      if (plan.tier === "celeb") {
        window.location.href = "mailto:hello@wolistic.com?subject=Celeb%20Plan%20Enquiry";
        return;
      }

      // Only explicitly pending users → raise priority ticket
      // null/suspended → still attempt payment (backend enforces the gate)
      if (userStatus === "pending") {
        setTicketPlanId(plan.id);
        setTicketMessage("");
        setTicketSuccess(false);
        return;
      }

      // Verified → Razorpay payment
      setUpgrading(plan.id);
      try {
        const orderResult = await createUpgradeOrder(accessToken, plan.id);
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setUpgradeError("Failed to load payment gateway. Please try again.");
          return;
        }

        const options = {
          key: orderResult.key_id,
          order_id: orderResult.order_id,
          amount: orderResult.amount_subunits,
          currency: orderResult.currency,
          name: "Wolistic",
          description: `Upgrade to ${orderResult.plan_name}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async (response: any) => {
            try {
              const verifyData: UpgradeVerifyData = {
                razorpay_order_id: response.razorpay_order_id as string,
                razorpay_payment_id: response.razorpay_payment_id as string,
                razorpay_signature: response.razorpay_signature as string,
                plan_id: plan.id,
              };
              const result = await verifyUpgrade(accessToken, verifyData);
              if (result.status === "success") {
                await load(); // refresh subscription data
              } else {
                setUpgradeError(result.message);
              }
            } catch (err) {
              setUpgradeError(err instanceof Error ? err.message : "Payment verification failed");
            } finally {
              setUpgrading(null);
            }
          },
          modal: {
            ondismiss: () => setUpgrading(null),
          },
          theme: { color: "#10b981" },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new window.Razorpay!(options as any).open();
      } catch (err) {
        setUpgradeError(err instanceof Error ? err.message : "Failed to initiate payment");
        setUpgrading(null);
      }
    },
    [accessToken, userStatus, load],
  );

  const handleRaiseTicket = useCallback(async () => {
    if (!accessToken || ticketPlanId === null) return;
    setTicketLoading(true);
    try {
      await raisePriorityTicket(accessToken, {
        plan_id: ticketPlanId,
        message: ticketMessage.trim() || undefined,
      });
      setTicketSuccess(true);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Failed to raise ticket");
      setTicketPlanId(null);
    } finally {
      setTicketLoading(false);
    }
  }, [accessToken, ticketPlanId, ticketMessage]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 font-medium mb-2">{error}</p>
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { subscription, billing_history, available_plans } = data ?? {
    subscription: null,
    billing_history: [],
    available_plans: [],
  };

  const plan = subscription?.plan ?? null;
  const tier = plan?.tier ?? "free";
  const subStatus = (subscription?.status ?? "active") as keyof typeof STATUS_CONFIG;
  const currentTier = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;
  const currentStatus = STATUS_CONFIG[subStatus] ?? STATUS_CONFIG.active;

  const featureKeys = plan?.features ?? [];
  const limits = plan?.limits ?? {};
  const servicesLimit = (limits.services_limit as number) ?? 3;
  const coinMultiplier = (limits.coin_multiplier as number) ?? 1;
  const groupClassesLimit = (limits.group_classes_limit as number) ?? 0;

  // Build feature rows: all known features, marking included/excluded
  const featureRows = Object.entries(FEATURE_META).map(([key, meta]) => ({
    ...meta,
    id: key,
    included: featureKeys.includes(key),
  }));

  // Add limits as special rows
  featureRows.push({
    icon: Coins,
    name: `${coinMultiplier}× Coin Earn Rate`,
    id: "coin_multiplier",
    included: true,
  });
  featureRows.push({
    icon: Sparkles,
    name: `Up to ${servicesLimit === 0 ? "Unlimited" : servicesLimit} Services`,
    id: "services_limit",
    included: true,
  });

  // Plan comparison table built from available_plans (dynamic, any tiers)

  function planFeatureValue(p: SubscriptionPlan | undefined, key: string): boolean | string {
    if (!p) return false;
    if (["services_limit", "coin_multiplier", "group_classes_limit"].includes(key)) {
      const v = p.limits[key];
      if (v === undefined || v === null) return "—";
      if (key === "coin_multiplier") return `${v}×`;
      if (key === "services_limit") return v === 0 ? "Unlimited" : String(v);
      return String(v);
    }
    return p.features.includes(key);
  }

  const comparisonRows = [
    { label: "Monthly Price", key: "price" },
    ...Object.entries(FEATURE_META).map(([key, meta]) => ({ label: meta.name, key })),
    { label: "Active Services", key: "services_limit" },
    { label: "Coin Multiplier", key: "coin_multiplier" },
    { label: "Group Classes", key: "group_classes_limit" },
  ];

  function getCellValue(
    p: SubscriptionPlan | undefined,
    key: string,
  ): boolean | string {
    if (!p) return "—";
    if (key === "price") return `₹${p.price_monthly}`;
    return planFeatureValue(p, key);
  }

  const nonCelebPlans = available_plans.filter((p) => p.tier !== "celeb");
  const celebPlan = available_plans.find((p) => p.tier === "celeb") ?? null;
  const totalFeatureRows = comparisonRows.length;

  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative space-y-8 p-6 pb-16 max-w-7xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent mb-2">
            Subscription
          </h1>
          <p className="text-zinc-400">Manage your subscription and billing</p>
        </div>

        {/* SECTION 1 — Hero: Current Plan */}
        {subscription && plan ? (
          <div
            className={`relative overflow-hidden rounded-2xl border ${currentTier.border} bg-gradient-to-br ${currentTier.gradient} backdrop-blur-xl`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5" />
            <div className="relative p-8">
              <div className="flex items-start justify-between gap-6">
                {/* Left */}
                <div className="flex-1">
                  <Badge
                    className={`${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border mb-4`}
                  >
                    {currentTier.name} Plan
                  </Badge>
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 mb-2">Your Current Plan</p>
                    <h2 className="text-4xl font-bold text-white mb-4">
                      {plan.name}
                    </h2>
                    <Badge
                      className={`${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border`}
                    >
                      {currentStatus.label}
                    </Badge>
                  </div>
                  {subscription.ends_at && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="size-4" />
                      <span>
                        Renews on{" "}
                        {new Date(subscription.ends_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {/* Right */}
                <div className="text-right">
                  <p className="text-5xl font-bold text-emerald-400 mb-2">
                    ₹{plan.price_monthly}
                  </p>
                  <p className="text-lg text-zinc-400 mb-4">/ month</p>
                  <p className="text-xs text-zinc-500">Manage via Admin Panel</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-400/30 bg-gradient-to-br from-zinc-500/20 to-zinc-600/10 backdrop-blur-xl">
            <div className="relative p-8 text-center">
              <Gem className="size-10 text-zinc-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Subscription</h2>
              <p className="text-zinc-400">
                Contact us to get started with a plan that suits your practice.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2 — What's Included */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            {plan ? "What's Included" : "Features Overview"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featureRows.map((feature) => {
              const Icon = feature.included ? feature.icon : Lock;
              return (
                <EliteGlassCard
                  key={feature.id}
                  className={`p-5 ${!feature.included ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg p-2.5 ${
                        feature.included
                          ? "bg-emerald-500/20 border border-emerald-400/30"
                          : "bg-zinc-500/20 border border-zinc-400/30"
                      }`}
                    >
                      <Icon
                        className={`size-5 ${
                          feature.included ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{feature.name}</p>
                      {feature.included ? (
                        <CheckCircle className="size-4 text-emerald-400 mt-2" />
                      ) : (
                        <Lock className="size-4 text-zinc-400 mt-2" />
                      )}
                    </div>
                  </div>
                </EliteGlassCard>
              );
            })}
          </div>
        </div>

        {/* SECTION 3 — Usage Meters */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Usage</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Active Services */}
            <EliteGlassCard className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 p-2">
                    <Sparkles className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Active Services</p>
                    <p className="text-xs text-zinc-500">
                      {servicesLimit === 0 ? "Unlimited" : `Limit: ${servicesLimit}`}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  {servicesLimit === 0 ? "∞" : servicesLimit}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full" />
            </EliteGlassCard>

            {/* Group Classes */}
            <EliteGlassCard className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/20 border border-amber-400/30 p-2">
                    <Users className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Group Classes</p>
                    <p className="text-xs text-zinc-500">
                      {featureKeys.includes("group_classes")
                        ? `Up to ${groupClassesLimit || "unlimited"} classes`
                        : "Not available on this plan"}
                    </p>
                  </div>
                </div>
                {featureKeys.includes("group_classes") ? (
                  <span className="text-lg font-bold text-amber-400">
                    {groupClassesLimit || "∞"}
                  </span>
                ) : (
                  <Lock className="size-5 text-zinc-500" />
                )}
              </div>
              <div className="h-2 bg-white/5 rounded-full" />
            </EliteGlassCard>

            {/* Coin Earn Rate */}
            <EliteGlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-500/20 border border-sky-400/30 p-2">
                    <Coins className="size-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Coin Earn Rate</p>
                    <p className="text-xs text-zinc-500">Multiplier on all bookings</p>
                  </div>
                </div>
                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 border">
                  {coinMultiplier}× multiplier
                </Badge>
              </div>
            </EliteGlassCard>

            {/* Search Boost */}
            <EliteGlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/20 border border-violet-400/30 p-2">
                    <TrendingUp className="size-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Search Boost</p>
                    <p className="text-xs text-zinc-500">
                      {featureKeys.includes("search_boost")
                        ? "Your profile is boosted in search results"
                        : "Not available on this plan"}
                    </p>
                  </div>
                </div>
                {featureKeys.includes("search_boost") ? (
                  <CheckCircle className="size-5 text-violet-400" />
                ) : (
                  <Lock className="size-5 text-zinc-500" />
                )}
              </div>
            </EliteGlassCard>
          </div>
        </div>

        {/* SECTION 4 — Plan Comparison Table */}
        {available_plans.length > 0 && (
          <EliteGlassCard className="overflow-hidden">
            <div className="p-6 border-b border-white/10" data-compare-plans>
              <h3 className="text-xl font-semibold text-white">Compare Plans</h3>
              <p className="text-sm text-zinc-400 mt-1">See what each tier offers</p>
            </div>
            <div className="overflow-x-auto">
              {/* CSS grid — celeb column uses explicit grid-row span to form one tall CTA cell */}
              <div
                className="grid min-w-[600px] text-sm"
                style={{
                  gridTemplateColumns: `minmax(180px, 1.5fr) repeat(${nonCelebPlans.length}, 1fr)${
                    celebPlan ? " 1fr" : ""
                  }`,
                }}
              >
                {/* ── Header row ── */}
                <div className="px-6 py-4 text-left font-medium text-zinc-400 border-b border-white/10 bg-white/[0.02]">
                  Feature
                </div>
                {nonCelebPlans.map((p) => {
                  const isCurrent = tier === p.tier;
                  return (
                    <div
                      key={p.id}
                      className={`px-6 py-4 text-center font-medium border-b border-white/10 bg-white/[0.02] ${
                        isCurrent ? "text-emerald-400" : "text-zinc-400"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span>{p.name}</span>
                        {isCurrent && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                            Current Plan
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {celebPlan && (
                  <div className="px-6 py-4 text-center font-medium text-amber-400/80 border-b border-white/10 bg-white/[0.02] border-l border-l-white/10">
                    {celebPlan.name}
                  </div>
                )}

                {/* ── Feature rows (non-celeb plans only) ── */}
                {comparisonRows.map((row, rowIdx) => (
                  <Fragment key={row.key}>
                    <div className="px-6 py-4 font-medium text-white border-b border-white/5 flex items-center">
                      {row.label}
                    </div>
                    {nonCelebPlans.map((p) => {
                      const isCurrent = tier === p.tier;
                      const val = getCellValue(p, row.key);
                      return (
                        <div
                          key={p.id}
                          className={`px-6 py-4 text-center border-b border-white/5 flex items-center justify-center ${
                            isCurrent ? "border-l border-r border-emerald-400/20 bg-emerald-400/[0.02]" : ""
                          }`}
                        >
                          {typeof val === "boolean" ? (
                            val ? (
                              <CheckCircle className="size-5 text-emerald-400" />
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )
                          ) : (
                            <span className="text-zinc-300">{val}</span>
                          )}
                        </div>
                      );
                    })}
                    {/* celeb column: no cell here — the CTA div below spans these rows */}
                    {rowIdx === 0 && !celebPlan && null}
                  </Fragment>
                ))}

                {/* ── Celeb CTA — spans all feature rows via explicit gridRow ── */}
                {celebPlan && (
                  <div
                    className="flex flex-col items-center justify-center gap-4 px-6 py-8 border-l border-white/10"
                    style={{
                      gridColumn: nonCelebPlans.length + 2,
                      gridRow: `2 / ${totalFeatureRows + 2}`,
                    }}
                  >
                    <div className="rounded-full bg-amber-500/20 border border-amber-400/30 p-4">
                      <Star className="size-7 text-amber-400" />
                    </div>
                    <p className="text-white font-semibold text-sm text-center leading-snug">
                      Everything in Elite,<br />and much more
                    </p>
                    <button
                      onClick={() => {
                        window.location.href =
                          "mailto:hello@wolistic.com?subject=Celeb%20Plan%20Enquiry";
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                    >
                      Contact our sales →
                    </button>
                  </div>
                )}

                {/* ── Upgrade footer row ── */}
                <div
                  className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider bg-white/[0.03] flex items-center"
                  style={{ gridRow: totalFeatureRows + 2, gridColumn: 1 }}
                >
                  Upgrade
                </div>
                {nonCelebPlans.map((p, idx) => {
                  const isCurrent = tier === p.tier;
                  const isUpgrading = upgrading === p.id;
                  return (
                    <div
                      key={p.id}
                      style={{ gridRow: totalFeatureRows + 2, gridColumn: idx + 2 }}
                      className={`px-6 py-4 flex items-center justify-center bg-white/[0.03] ${
                        isCurrent ? "border-l border-r border-emerald-400/30" : ""
                      }`}
                    >
                      {isCurrent ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          Current
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isUpgrading}
                          onClick={() => void handleUpgradeClick(p)}
                          className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400/60"
                        >
                          {isUpgrading ? (
                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="size-3.5 mr-1.5" />
                          )}
                          Upgrade
                        </Button>
                      )}
                    </div>
                  );
                })}
                {celebPlan && (
                  <div
                    style={{ gridRow: totalFeatureRows + 2, gridColumn: nonCelebPlans.length + 2 }}
                    className="px-6 py-4 flex items-center justify-center bg-white/[0.03] border-l border-white/10"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/60"
                      onClick={() => void handleUpgradeClick(celebPlan)}
                    >
                      <Mail className="size-3.5 mr-1.5" />
                      Contact Sales
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {upgradeError && (
              <div className="px-6 py-3 border-t border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-center justify-between">
                <span>{upgradeError}</span>
                <button
                  onClick={() => setUpgradeError(null)}
                  className="text-rose-400/60 hover:text-rose-400 ml-4"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </EliteGlassCard>
        )}

        {/* SECTION 5 — Upgrade CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-violet-500/5 to-emerald-600/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-violet-500/10" />
          <div className="absolute top-0 right-0 size-96 bg-violet-500/20 blur-3xl" />
          <div className="relative p-8 flex items-center justify-between gap-6">
            <div className="flex-1">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border mb-3">
                Grow your practice
              </Badge>
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to unlock your next level?
              </h3>
              <p className="text-zinc-300">
                Each tier unlocks more visibility, features, and earning potential.
                Upgrade anytime — or talk to our team to find the right fit for your practice.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                className="text-zinc-300 hover:text-white hover:bg-white/5"
                onClick={() => {
                  document.querySelector("[data-compare-plans]")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Compare Plans
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                onClick={() => { window.location.href = "mailto:hello@wolistic.com?subject=Plan%20Upgrade%20Enquiry"; }}
              >
                <Mail className="size-4 mr-2" />
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>

        {/* SECTION 6 — Billing History */}
        <EliteGlassCard className="overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Billing History</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  View your past invoices and payments
                </p>
              </div>
              <CreditCard className="size-6 text-zinc-500" />
            </div>
          </div>

          {billing_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left bg-white/[0.02]">
                    <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billing_history.map((record: BillingRecord) => (
                    <tr
                      key={record.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-white">
                        {new Date(record.paid_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{record.plan_name}</td>
                      <td className="px-6 py-4 text-white font-medium">
                        {record.currency === "INR" ? "₹" : record.currency}
                        {record.amount}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {record.method ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {record.invoice_ref ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                            title={record.invoice_ref}
                          >
                            <Download className="size-4" />
                          </Button>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="rounded-full bg-white/5 p-4 w-fit mx-auto mb-4">
                <ClipboardList className="size-8 text-zinc-500" />
              </div>
              <p className="text-white font-medium mb-1">No billing records yet</p>
              <p className="text-sm text-zinc-400">Your billing history will appear here</p>
            </div>
          )}
        </EliteGlassCard>
      </div>

      {/* ── Priority Ticket Modal ─────────────────────────────────────── */}
      {ticketPlanId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 border border-amber-400/30 p-2">
                  <Ticket className="size-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Express Interest</h3>
                  <p className="text-xs text-zinc-400">
                    Your profile needs to be verified to upgrade. We&apos;ll prioritise your review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setTicketPlanId(null); setTicketSuccess(false); }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {ticketSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="size-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg mb-1">Ticket Raised!</p>
                  <p className="text-zinc-400 text-sm">
                    Our team will prioritise your verification and reach out within 24 hours.
                  </p>
                  <Button
                    className="mt-6 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/30"
                    onClick={() => { setTicketPlanId(null); setTicketSuccess(false); }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-300 mb-4">
                    Let us know why you&apos;d like to upgrade. This helps our team prioritise
                    your verification.
                  </p>
                  <textarea
                    ref={ticketTextareaRef}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Tell us about your practice and why you'd like to upgrade (optional)…"
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 text-sm p-3 resize-none focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.07] transition-colors"
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white hover:bg-white/5"
                      onClick={() => setTicketPlanId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={ticketLoading}
                      onClick={() => void handleRaiseTicket()}
                      className="bg-amber-500/20 border border-amber-400/30 text-amber-400 hover:bg-amber-500/30 hover:border-amber-400/50"
                    >
                      {ticketLoading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Ticket className="size-4 mr-2" />
                      )}
                      Raise Priority Ticket
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
