import { useState } from "react";

import {
  createPaymentOrderWithToken,
  verifyPaymentWithToken,
} from "@/components/payment/data/paymentsApi";
import type { PaymentForm, PaymentStatus } from "@/components/payment/types";

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

type UsePaymentFlowArgs = {
  amount: number;
  professionalUsername: string;
  professionalName: string;
  serviceName: string;
  customerName?: string;
  customerEmail?: string;
  bookingAt?: string;
  isImmediate?: boolean;
  token?: string;
  onStatusResolved: (status: PaymentStatus, nextRoute: string) => void;
};

export function usePaymentFlow({
  amount,
  professionalUsername,
  professionalName,
  serviceName,
  customerName,
  customerEmail,
  bookingAt,
  isImmediate,
  token,
  onStatusResolved,
}: UsePaymentFlowArgs) {
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    gstin: "",
    coins_to_use: 0,
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const loadRazorpayScript = async () => {
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
  };

  const submitPayment = async () => {
    setPaymentError(null);
    setPaymentSubmitting(true);

    try {
      const order = await createPaymentOrderWithToken(
        {
          amount,
          currency: "INR",
          professional_username: professionalUsername,
          service_name: serviceName,
          customer_name: customerName,
          customer_email: customerEmail,
          booking_at: bookingAt,
          is_immediate: Boolean(isImmediate),
          ...(paymentForm.coins_to_use && paymentForm.coins_to_use > 0
            ? { coins_to_use: paymentForm.coins_to_use }
            : {}),
        },
        token ?? undefined,
      );

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout script.");
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amountSubunits,
        currency: order.currency,
        name: "Wolistic Wellness",
        description: `${serviceName} with ${professionalName}`,
        order_id: order.orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        notes: {
          bookingReference: order.bookingReference,
          professionalUsername,
        },
        handler: async (response) => {
          try {
            const verifyResult = await verifyPaymentWithToken(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_reference: order.bookingReference,
                next_route: "/authorized",
                professional_username: professionalUsername,
                service_name: serviceName,
                booking_at: bookingAt,
                is_immediate: Boolean(isImmediate),
              },
              token ?? undefined,
            );

            const verifiedStatus: PaymentStatus =
              verifyResult.status === "success" ||
              verifyResult.status === "failure" ||
              verifyResult.status === "pending"
                ? verifyResult.status
                : "pending";

            setPaymentSubmitting(false);
            onStatusResolved(verifiedStatus, verifyResult.nextRoute || "/authorized");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Payment verification failed.";
            setPaymentSubmitting(false);
            setPaymentError(message);
            onStatusResolved("failure", "/authorized");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentSubmitting(false);
            setPaymentError("Checkout was closed before payment completion.");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment. Please try again.";
      setPaymentSubmitting(false);
      setPaymentError(message);
      onStatusResolved("failure", "/authorized");
    }
  };

  return {
    paymentForm,
    paymentError,
    paymentSubmitting,
    setPaymentForm,
    setCoinsToUse: (coins: number) =>
      setPaymentForm((f) => ({ ...f, coins_to_use: coins })),
    submitPayment,
  };
}
