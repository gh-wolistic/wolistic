"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { SessionCard } from "@/components/sessions/SessionCard";
import type { ProfessionalSession } from "@/lib/api/sessions";
import { registerInterest } from "@/lib/api/sessions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface SessionEnrollmentModalProps {
  session: ProfessionalSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (enrollmentId: string) => void;
}

type EnrollmentStatus = "idle" | "loading" | "success" | "error";

export function SessionEnrollmentModal({
  session,
  isOpen,
  onClose,
  onSuccess,
}: SessionEnrollmentModalProps) {
  const router = useRouter();
  const { status: authStatus, isAuthenticated, user, accessToken } = useAuthSession();
  
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [interestRegistered, setInterestRegistered] = useState(false);
  const [isRegisteringInterest, setIsRegisteringInterest] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEnrollmentStatus("idle");
      setErrorMessage(null);
      setIsProcessingPayment(false);
      setInterestRegistered(false);
      setIsRegisteringInterest(false);
    }
  }, [isOpen]);

  // Load Razorpay script
  const loadRazorpayScript = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false;
    }

    if (window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const existingScript = document.getElementById("razorpay-checkout-script") as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Handle enrollment
  const handleEnroll = useCallback(async () => {
    if (!session || !isAuthenticated || !accessToken || !user) {
      setErrorMessage("You must be logged in to book a session");
      return;
    }

    if (session.is_sold_out) {
      setErrorMessage("This session is sold out");
      return;
    }

    setEnrollmentStatus("loading");
    setErrorMessage(null);
    setIsProcessingPayment(true);

    try {
      // Step 1: Create payment order for session enrollment
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/sessions/${session.id}/enroll/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            customer_name: user.name,
            customer_email: user.email,
          }),
        }
      );

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to create order (${orderResponse.status})`
        );
      }

      const orderData = await orderResponse.json();
      const { key_id, order_id, amount_subunits, currency, enrollment_reference } = orderData;

      // Step 2: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load payment gateway. Please try again.");
      }

      // Step 3: Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: key_id,
        amount: amount_subunits,
        currency: currency,
        name: "Wolistic Wellness",
        description: `${session.title} - ${session.session_date}`,
        order_id: order_id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          enrollment_reference,
          session_id: session.id.toString(),
        },
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment and confirm enrollment
            const verifyResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/sessions/${session.id}/enroll/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  enrollment_reference,
                }),
              }
            );

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}));
              throw new Error(errorData.detail || "Payment verification failed");
            }

            const verifyData = await verifyResponse.json();
            
            setEnrollmentStatus("success");
            setIsProcessingPayment(false);
            
            if (onSuccess) {
              onSuccess(verifyData.enrollment_id);
            }

            // Close modal after 2 seconds
            setTimeout(() => {
              onClose();
              // Optionally redirect to enrollments page
              router.push("/my-enrollments");
            }, 2000);
          } catch (error) {
            console.error("Payment verification error:", error);
            setEnrollmentStatus("error");
            setErrorMessage(
              error instanceof Error ? error.message : "Payment verification failed"
            );
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            setEnrollmentStatus("idle");
            setErrorMessage("Payment was cancelled");
          },
        },
      } as any); // Type assertion to handle Razorpay SDK optional properties

      razorpay.open();
    } catch (error) {
      console.error("Enrollment error:", error);
      setEnrollmentStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start enrollment process"
      );
      setIsProcessingPayment(false);
    }
  }, [session, isAuthenticated, accessToken, user, loadRazorpayScript, onSuccess, onClose, router]);

  // Redirect to login if not authenticated
  const handleAuthRedirect = useCallback(() => {
    // Save intended session for after login
    if (session) {
      sessionStorage.setItem("intended_session_enrollment", session.id.toString());
    }
    router.push(`/v1?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [session, router]);

  // Check for auth on open
  useEffect(() => {
    if (isOpen && authStatus !== "loading" && !isAuthenticated) {
      // Close modal and redirect to login
      onClose();
      handleAuthRedirect();
    }
  }, [isOpen, authStatus, isAuthenticated, onClose, handleAuthRedirect]);

  if (!session) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {enrollmentStatus === "success" ? "Enrollment Confirmed!" : "Book This Session"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {enrollmentStatus === "success"
              ? "You've successfully enrolled in this session"
              : "Review session details and proceed to payment"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Session Details */}
          <SessionCard
            session={session}
            variant="light"
            showBookButton={false}
          />

          {/* Success Message */}
          {enrollmentStatus === "success" && (
            <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                Payment successful! Redirecting to your enrollments...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {errorMessage && enrollmentStatus !== "success" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Sold Out Warning */}
          {session.is_sold_out && enrollmentStatus !== "success" && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This session is currently sold out. You can register your interest to be notified if spots become available.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Info */}
          {!session.is_sold_out && enrollmentStatus !== "success" && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  ₹{session.price.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                Secure payment via Razorpay. Refund available if expert cancels the session.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          {enrollmentStatus === "success" ? (
            <Button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Close
            </Button>
          ) : (
            <>
              <AlertDialogCancel disabled={isProcessingPayment}>
                Cancel
              </AlertDialogCancel>
              {session.is_sold_out ? (
                <Button
                  onClick={async () => {
                    if (!accessToken) {
                      setErrorMessage("You must be logged in to register interest");
                      return;
                    }

                    setIsRegisteringInterest(true);
                    setErrorMessage(null);

                    try {
                      await registerInterest(session.id, accessToken);
                      setInterestRegistered(true);
                      setEnrollmentStatus("success");
                    } catch (error: any) {
                      console.error("Failed to register interest:", error);
                      setErrorMessage(
                        error.message || "Failed to register interest. Please try again."
                      );
                    } finally {
                      setIsRegisteringInterest(false);
                    }
                  }}
                  disabled={isRegisteringInterest || interestRegistered}
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                >
                  {isRegisteringInterest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : interestRegistered ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Interest Registered
                    </>
                  ) : (
                    "Notify Me When Available"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={isProcessingPayment || enrollmentStatus === "loading"}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Proceed to Payment</>
                  )}
                </Button>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
