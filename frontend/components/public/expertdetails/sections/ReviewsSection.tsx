"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getProfessionalReviews,
  type ProfessionalReview,
} from "@/components/public/data/professionalsApi";

type ReviewsSectionProps = {
  professionalId: string;
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

export function ReviewsSection({ professionalId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProfessionalReview[]>([]);
  const [total, setTotal] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(
    async (offset: number, append: boolean) => {
      const response = await getProfessionalReviews(professionalId, {
        limit: PAGE_SIZE,
        offset,
      });

      setTotal(response.total);
      setReviews((previous) => (append ? [...previous, ...response.items] : response.items));
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
  }, [loadReviews]);

  const hasMore = useMemo(() => reviews.length < total, [reviews.length, total]);

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
    <div id="reviews" className="scroll-mt-32">
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2>Client Reviews</h2>
          <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground dark:bg-background/40">
            {total.toLocaleString()} total
          </span>
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
              <div key={review.id} className="space-y-2 pb-6 border-b last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-600" />
                  <div>
                    <p className="font-medium">{review.reviewerName}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          size={14}
                          className={
                            index < Math.round(review.rating)
                              ? "text-amber-500 fill-amber-500"
                              : "text-amber-500"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {getRelativeTimeLabel(review.createdAt)}
                </span>
              </div>
              <p className="text-muted-foreground">{review.comment}</p>
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
