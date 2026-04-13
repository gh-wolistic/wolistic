"use client";

import { useEffect, useRef, useState } from "react";
import {
  Crown,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  getMySubscription,
  type SubscriptionStatus,
  type SubscriptionTier,
} from "@/components/dashboard/elite/subscriptionApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { ProfessionalReview } from "@/types/professional";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const PRO_TIERS = new Set(["pro", "elite", "celeb", "premium"]);
const ACTIVE_SUB_STATUSES = new Set<SubscriptionStatus>(["active", "grace"]);

function isProTier(tier: string | undefined | null): boolean {
  const normalized = (tier ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (PRO_TIERS.has(normalized)) return true;

  return (
    normalized.includes("pro") ||
    normalized.includes("elite") ||
    normalized.includes("celeb") ||
    normalized.includes("premium")
  );
}

function hasProAccess(params: {
  dashboardTier?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  subscriptionStatus?: SubscriptionStatus | null;
}): boolean {
  const { dashboardTier, subscriptionTier, subscriptionStatus } = params;

  if (subscriptionTier) {
    const paidTier = subscriptionTier === "pro" || subscriptionTier === "elite" || subscriptionTier === "celeb";
    const activeStatus = subscriptionStatus ? ACTIVE_SUB_STATUSES.has(subscriptionStatus) : true;
    if (paidTier && activeStatus) {
      return true;
    }
  }

  return isProTier(dashboardTier);
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function fetchMyReviews(professionalId: string, token: string): Promise<ProfessionalReview[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/professionals/${professionalId}/reviews?limit=100`,
    { mode: "cors", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to load reviews");
  const data = await res.json() as {
    reviews: Array<{
      id: number;
      reviewer_name: string | null;
      rating: number;
      review_text: string | null;
      verification_type: string | null;
      service_name: string | null;
      created_at: string;
      response: {
        id: number;
        review_id: number;
        professional_id: string;
        response_text: string;
        created_at: string;
        updated_at: string;
      } | null;
    }>;
  };
  return data.reviews.map((r) => ({
    id: r.id,
    professionalId: "",
    reviewerUserId: "",
    reviewerName: r.reviewer_name,
    reviewerEmail: null,
    rating: r.rating,
    reviewText: r.review_text ?? undefined,
    comment: r.review_text ?? undefined,
    isVerified: r.verification_type === "verified_client",
    verificationType: r.verification_type as ProfessionalReview["verificationType"],
    serviceName: r.service_name,
    bookingId: null,
    flaggedAt: null,
    flaggedByUserId: null,
    flagReason: null,
    moderationStatus: null,
    createdAt: r.created_at,
    response: r.response
      ? {
          id: r.response.id,
          reviewId: r.response.review_id,
          professionalId: r.response.professional_id,
          responseText: r.response.response_text,
          createdAt: r.response.created_at,
          updatedAt: r.response.updated_at,
        }
      : null,
  }));
}

async function createResponse(reviewId: number, text: string, token: string) {
  const res = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}/respond`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ response_text: text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to submit response");
  }
  return res.json();
}

async function updateResponse(responseId: number, text: string, token: string) {
  const res = await fetch(`${API_BASE}/api/v1/reviews/responses/${responseId}`, {
    method: "PUT",
    mode: "cors",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ response_text: text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to update response");
  }
  return res.json();
}

async function deleteResponse(responseId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/v1/reviews/responses/${responseId}`, {
    method: "DELETE",
    mode: "cors",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete response");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? "fill-amber-500 text-amber-500" : "text-zinc-300"}
        />
      ))}
    </div>
  );
}

function VerificationBadge({ type }: { type: ProfessionalReview["verificationType"] }) {
  if (type === "verified_client") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <ShieldCheck size={10} /> Verified Client
      </span>
    );
  }
  if (type === "wolistic_user") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
        <UserIcon size={10} /> Wolistic User
      </span>
    );
  }
  return null;
}

type InlineFormProps = {
  initialText?: string;
  onSave: (text: string) => Promise<void>;
  onCancel: () => void;
};

function InlineResponseForm({ initialText = "", onSave, onCancel }: InlineFormProps) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a professional response to this review…"
        maxLength={500}
        rows={3}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{text.length}/500</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={saving || !text.trim()}>
            {saving ? "Saving…" : "Save Response"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Review row ──────────────────────────────────────────────────────────────

type ReviewRowProps = {
  review: ProfessionalReview;
  token: string;
  onUpdateReview: (updated: ProfessionalReview) => void;
};

function ReviewRow({ review, token, onUpdateReview }: ReviewRowProps) {
  const [mode, setMode] = useState<"idle" | "composing" | "editing">("idle");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const dateLabel = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function handleCreate(text: string) {
    const data = await createResponse(review.id, text, token) as {
      id: number;
      review_id: number;
      professional_id: string;
      response_text: string;
      created_at: string;
      updated_at: string;
    };
    onUpdateReview({
      ...review,
      response: {
        id: data.id,
        reviewId: data.review_id,
        professionalId: data.professional_id,
        responseText: data.response_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
    setMode("idle");
  }

  async function handleEdit(text: string) {
    if (!review.response) return;
    const data = await updateResponse(review.response.id, text, token) as {
      id: number;
      review_id: number;
      professional_id: string;
      response_text: string;
      created_at: string;
      updated_at: string;
    };
    onUpdateReview({
      ...review,
      response: {
        id: data.id,
        reviewId: data.review_id,
        professionalId: data.professional_id,
        responseText: data.response_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
    setMode("idle");
  }

  async function handleDelete() {
    if (!review.response) return;
    setDeletingId(review.response.id);
    try {
      await deleteResponse(review.response.id, token);
      onUpdateReview({ ...review, response: null });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/8 dark:bg-white/5">
      {/* Reviewer info */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {review.reviewerName ?? "Anonymous"}
            </span>
            <VerificationBadge type={review.verificationType} />
          </div>
          <div className="flex items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="text-xs text-zinc-500">{dateLabel}</span>
          </div>
          {review.serviceName && (
            <span className="text-xs text-zinc-400">{review.serviceName}</span>
          )}
        </div>
      </div>

      {/* Review text */}
      {review.reviewText && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{review.reviewText}</p>
      )}

      {/* Existing response */}
      {review.response && mode !== "editing" && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/8 dark:bg-white/5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your response</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => setMode("editing")}
                title="Edit response"
              >
                <Pencil size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-red-600"
                onClick={handleDelete}
                disabled={deletingId !== null}
                title="Delete response"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{review.response.responseText}</p>
        </div>
      )}

      {/* Edit form */}
      {mode === "editing" && review.response && (
        <InlineResponseForm
          initialText={review.response.responseText}
          onSave={handleEdit}
          onCancel={() => setMode("idle")}
        />
      )}

      {/* Compose form */}
      {mode === "composing" && (
        <InlineResponseForm onSave={handleCreate} onCancel={() => setMode("idle")} />
      )}

      {/* Add response button (only if no response and not composing) */}
      {!review.response && mode === "idle" && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-7 gap-1 text-xs"
          onClick={() => setMode("composing")}
        >
          <MessageSquare size={12} />
          Respond
        </Button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ReviewResponseManagerProps = {
  membershipTier?: string | null;
};

export function ReviewResponseManager({ membershipTier }: ReviewResponseManagerProps) {
  const { accessToken, status, user } = useAuthSession();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isTierLoading, setIsTierLoading] = useState(false);

  const isPro = hasProAccess({
    dashboardTier: membershipTier,
    subscriptionTier,
    subscriptionStatus,
  });

  const [reviews, setReviews] = useState<ProfessionalReview[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    let active = true;
    setIsTierLoading(true);

    void (async () => {
      try {
        const subscriptionData = await getMySubscription(accessToken);
        if (!active) return;
        setSubscriptionTier(subscriptionData.subscription?.plan?.tier ?? null);
        setSubscriptionStatus(subscriptionData.subscription?.status ?? null);
      } catch {
        // fallback to dashboard membership tier
      } finally {
        if (active) setIsTierLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken, status]);

  useEffect(() => {
    if (!isPro || status !== "authenticated" || !accessToken || !user) return;

    let active = true;
    setLoadState("loading");

    void (async () => {
      try {
        const data = await fetchMyReviews(user.id, accessToken);
        if (!active) return;
        setReviews(data);
        setLoadState("ready");
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Unknown error");
        setLoadState("error");
      }
    })();

    return () => { active = false; };
  }, [isPro, accessToken, status, user]);

  function handleUpdateReview(updated: ProfessionalReview) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const respondedCount = reviews.filter((r) => r.response !== null).length;
  const pendingCount = reviews.filter((r) => r.response === null).length;

  return (
    <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm dark:border-white/8 dark:bg-transparent">
      <CardContent className="space-y-4 pt-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Review Responses
            </h2>
            {isPro && (
              <Badge className="border-0 bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                Pro+
              </Badge>
            )}
          </div>
          {loadState === "ready" && reviews.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {respondedCount > 0 && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:border-emerald-900/20 dark:bg-emerald-950/20 dark:text-emerald-400">
                  {respondedCount} responded
                </span>
              )}
              {pendingCount > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700 dark:border-amber-900/20 dark:bg-amber-950/20 dark:text-amber-400">
                  {pendingCount} awaiting reply
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resolve tier first to avoid false lock immediately after upgrade */}
        {isTierLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
          </div>
        )}

        {/* Locked state for non-Pro */}
        {!isTierLoading && !isPro && (
          <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50 px-4 py-6 text-center dark:border-violet-800/40 dark:bg-violet-950/20">
            <Crown className="mx-auto mb-2 h-6 w-6 text-violet-500" />
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              Pro & Elite Feature
            </p>
            <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
              Upgrade to Pro or Elite to respond to client reviews and build trust on your profile.
            </p>
          </div>
        )}

        {/* Loading */}
        {!isTierLoading && isPro && loadState === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        )}

        {/* Error */}
        {!isTierLoading && isPro && loadState === "error" && (
          <p className="text-sm text-red-600">{loadError}</p>
        )}

        {/* Empty */}
        {!isTierLoading && isPro && loadState === "ready" && reviews.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center dark:border-white/10 dark:bg-white/5">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No reviews yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              When clients leave reviews, you&apos;ll be able to respond here.
            </p>
          </div>
        )}

        {/* Review list */}
        {!isTierLoading && isPro && loadState === "ready" && reviews.length > 0 && accessToken && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                token={accessToken}
                onUpdateReview={handleUpdateReview}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
