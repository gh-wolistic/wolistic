import type { PaymentOrderResult, PaymentVerifyResult } from "@/components/payment/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

export async function createPaymentOrderWithToken(
  data: Record<string, unknown>,
  token?: string,
): Promise<PaymentOrderResult> {
  const response = await fetch(`${API_BASE}/booking/payments/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorPayload = (await response.json()) as { detail?: string };
      detail = errorPayload.detail ? `: ${errorPayload.detail}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Unable to create payment order (${response.status})${detail}`);
  }

  const payload = (await response.json()) as {
    mode: "mock" | "live" | "free";
    key_id: string;
    order_id: string;
    booking_reference: string;
    amount_subunits: number;
    currency: string;
  };

  return {
    mode: payload.mode,
    keyId: payload.key_id,
    orderId: payload.order_id,
    bookingReference: payload.booking_reference,
    amountSubunits: payload.amount_subunits,
    currency: payload.currency,
  };
}

export async function verifyPaymentWithToken(
  data: Record<string, unknown>,
  token?: string,
): Promise<PaymentVerifyResult> {
  const response = await fetch(`${API_BASE}/booking/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Unable to verify payment (${response.status})`);
  }

  const payload = (await response.json()) as {
    status: "success" | "failure" | "pending";
    nextRoute: string;
    booking_reference: string;
  };

  return {
    status: payload.status,
    nextRoute: payload.nextRoute,
    bookingReference: payload.booking_reference,
  };
}
