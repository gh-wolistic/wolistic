"use client";

import { useState } from "react";
import { Star, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

type ReviewSubmitFormProps = {
  professionalId: string;
  professionalName: string;
  onReviewSubmitted?: () => void;
  trigger?: React.ReactNode;
};

export function ReviewSubmitForm({ 
  professionalId, 
  professionalName, 
  onReviewSubmitted,
  trigger
}: ReviewSubmitFormProps) {
  const { accessToken } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkEligibility = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const url = `${API_BASE}/api/v1/reviews/eligibility/${professionalId}`;
      
      const fetchOptions: RequestInit = {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
      };
      
      const res = await fetch(url, fetchOptions);
      
      if (res.status === 401) {
        setCanReview(false);
        setEligibilityReason("Please sign in to leave a review");
        setEligibilityChecked(true);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      
      const data = await res.json();
      setCanReview(data.can_review);
      setEligibilityReason(data.reason);
      setEligibilityChecked(true);
    } catch (error) {
      console.error("Eligibility check error:", error);
      setError("Unable to check eligibility. Please try again.");
      setEligibilityChecked(true);
      setCanReview(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !eligibilityChecked) {
      checkEligibility();
    }
    // Reset states when closing
    if (!open) {
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    if (!canReview) {
      setError(eligibilityReason ?? "You are not eligible to review this professional");
      return;
    }

    setIsSubmitting(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const url = `${API_BASE}/api/v1/reviews`;
      
      const fetchOptions: RequestInit = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          professional_id: professionalId,
          rating,
          review_text: reviewText.trim() || undefined,
        }),
      };
      
      const res = await fetch(url, fetchOptions);

      if (res.status === 401) {
        setError("Please sign in to leave a review");
        return;
      }

      if (res.status === 403) {
        const errorData = await res.json();
        setError(errorData.detail || "You are not eligible to review this professional");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      // Success!
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setRating(0);
        setReviewText("");
        setIsOpen(false);
        setEligibilityChecked(false);
        setSuccess(false);
        
        // Notify parent to refresh reviews
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }, 2000);
    } catch (error) {
      console.error("Review submission failed:", error);
      setError("Unable to submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Write a Review
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Write a Review</SheetTitle>
          <SheetDescription>
            Share your experience with {professionalName}
          </SheetDescription>
        </SheetHeader>

        {!eligibilityChecked ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !canReview ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/30">
              <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                Unable to Submit Review
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                {eligibilityReason || "You are not eligible to review this professional"}
              </p>
              
              {/* Show specific solutions based on the reason */}
              {eligibilityReason?.toLowerCase().includes("sign in") ? (
                <a
                  href="/api/v1/auth/login"
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  Sign In to Review
                </a>
              ) : eligibilityReason?.toLowerCase().includes("already reviewed") ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You've already shared your feedback for {professionalName}. Thank you!
                </p>
              ) : eligibilityReason?.toLowerCase().includes("client list") || eligibilityReason?.toLowerCase().includes("verified client") ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    To leave a review, you need to:
                  </p>
                  <ul className="ml-4 list-disc space-y-1 text-xs text-amber-800 dark:text-amber-200">
                    <li>Complete a booking with {professionalName}, or</li>
                    <li>Ask {professionalName} to add you to their client list</li>
                  </ul>
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    This helps ensure authentic reviews from real clients.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Error Message */}
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            ) : null}

            {/* Success Message */}
            {success ? (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-950/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Review submitted successfully! Thank you for your feedback.
                </p>
              </div>
            ) : null}

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoverRating || rating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-amber-300 dark:text-amber-700"
                      }
                    />
                  </button>
                ))}
              </div>
              {rating > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              ) : null}
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <label htmlFor="review-text" className="text-sm font-medium">
                Your Review <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share details about your experience..."
                rows={6}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewText.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
