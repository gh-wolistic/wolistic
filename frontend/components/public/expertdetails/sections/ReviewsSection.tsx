"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getProfessionalReviews,
  type ProfessionalReview,
  type ReviewsSummary,
} from "@/components/public/data/professionalsApi";
import { ReviewSubmitForm } from "../ReviewSubmitForm";

type ReviewsSectionProps = {
  professionalId: string;
  professionalName: string;
};

const PAGE_SIZE = 3;

function getRelativeTimeLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.floor(diffMs / dayMs));

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function ReviewsSection({ professionalId, professionalName }: ReviewsSectionProps) {
  const sectionAnchorClassName = "scroll-mt-20 sm:scroll-mt-32";
  const [reviews, setReviews] = useState<ProfessionalReview[]>([]);
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSubmitted = useCallback(() => {
    // Trigger a refresh by incrementing the key
    setRefreshKey(prev => prev + 1);
  }, []);

  const loadReviews = useCallback(
    async (offset: number, append: boolean) => {
      const response = await getProfessionalReviews(professionalId, {
        limit: PAGE_SIZE,
        offset,
        filter: "all",
      });

      setSummary(response.summary);
      setReviews((previous) => (append ? [...previous, ...response.reviews] : response.reviews));
    },
    [professionalId],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialReviews() {
      setIsInitialLoading(true);
      setError(null);
      try {
        await loadReviews(0, false);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load reviews right now.";
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    fetchInitialReviews();
    return () => {
      isMounted = false;
    };
  }, [loadReviews, refreshKey]);

  const hasMore = useMemo(() => {
    if (!summary) return false;
    return reviews.length < summary.totalReviews;
  }, [reviews.length, summary]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      await loadReviews(reviews.length, true);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load more reviews right now.";
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div id="reviews" className={sectionAnchorClassName}>
      <Card className="p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2>Client Reviews</h2>
            <ReviewSubmitForm 
              professionalId={professionalId} 
              professionalName={professionalName}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
          {summary && summary.totalReviews > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 dark:border-amber-900/30 dark:bg-amber-950/30">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {summary.avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-600/70 dark:text-amber-500/70">
                  ({summary.totalReviews})
                </span>
              </div>
              {summary.verifiedCount > 0 && (
                <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs dark:border-emerald-900/30 dark:bg-emerald-950/30">
                  <ShieldCheck size={11} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{summary.verifiedCount} verified</span>
                </div>
              )}
              {summary.wolisticUserCount > 0 && (
                <div className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs dark:border-sky-900/30 dark:bg-sky-950/30">
                  <User size={11} className="text-sky-600 dark:text-sky-400" />
                  <span className="font-medium text-sky-700 dark:text-sky-400">{summary.wolisticUserCount} users</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isInitialLoading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : null}

        {!isInitialLoading && error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isInitialLoading && !error && reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : null}

        {!isInitialLoading && reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.reviewerName ?? "Anonymous"}</p>
                        {review.verificationType === "verified_client" ? (
                          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/30">
                            <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Verified Client
                            </span>
                          </div>
                        ) : review.verificationType === "wolistic_user" ? (
                          <div className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 dark:bg-sky-950/30">
                            <User size={12} className="text-sky-600 dark:text-sky-400" />
                            <span className="text-xs font-medium text-sky-700 dark:text-sky-400">
                              Wolistic User
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={14}
                            className={
                              index < Math.round(review.rating)
                                ? "fill-amber-500 text-amber-500"
                                : "text-amber-300"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-muted-foreground">
                      {getRelativeTimeLabel(review.createdAt)}
                    </span>
                    {review.serviceName ? (
                      <span className="text-xs text-muted-foreground/80">
                        {review.serviceName}
                      </span>
                    ) : null}
                  </div>
                </div>
                {review.reviewText ? (
                  <p className="wrap-break-word text-sm text-muted-foreground sm:text-base">
                    {review.reviewText}
                  </p>
                ) : null}
                
                {/* Expert Response */}
                {review.response ? (
                  <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-400 to-indigo-600" />
                      <div>
                        <p className="text-sm font-medium">Expert Response</p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTimeLabel(review.response.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.response.responseText}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}

            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
