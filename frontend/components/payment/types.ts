export type PaymentMode = "live";

export type PaymentStatus = "success" | "failure" | "pending";

export type PaymentForm = {
  gstin: string;
};

export type PaymentOrderResult = {
  mode: PaymentMode;
  keyId: string;
  orderId: string;
  bookingReference: string;
  amountSubunits: number;
  currency: string;
};

export type PaymentVerifyResult = {
  status: PaymentStatus;
  nextRoute: string;
  bookingReference: string;
};
