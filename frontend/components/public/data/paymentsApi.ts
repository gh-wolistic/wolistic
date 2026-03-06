/**
 * Stub – payments API helpers.
 * These will be implemented when Razorpay integration is wired up.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createPaymentOrderWithToken(
  _data: Record<string, unknown>,
  _token?: string,
): Promise<any> {
  throw new Error("createPaymentOrderWithToken: not implemented yet");
}

export async function verifyPaymentWithToken(
  _data: Record<string, unknown>,
  _token?: string,
): Promise<any> {
  throw new Error("verifyPaymentWithToken: not implemented yet");
}
