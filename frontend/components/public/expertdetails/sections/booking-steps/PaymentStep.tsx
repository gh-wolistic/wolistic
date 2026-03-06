import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentStatus = "success" | "failure" | "pending";

type PaymentForm = {
  gstin: string;
  mockOutcome: PaymentStatus;
};

type PaymentStepProps = {
  subtotal: number;
  gstAmount: number;
  platformFee: number;
  grandTotal: number;
  isInitialConsultationSelected: boolean;
  paymentForm: PaymentForm;
  paymentError: string | null;
  paymentSubmitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChangeGstin: (value: string) => void;
  onChangeMockOutcome: (value: PaymentStatus) => void;
};

export function PaymentStep({
  subtotal,
  gstAmount,
  platformFee,
  grandTotal,
  isInitialConsultationSelected,
  paymentForm,
  paymentError,
  paymentSubmitting,
  onSubmit,
  onChangeGstin,
  onChangeMockOutcome,
}: PaymentStepProps) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <h4>Payment Details</h4>

      <div className="space-y-2 rounded-lg border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span>Service Fee</span>
          <span>{subtotal === 0 ? "Free" : `₹${subtotal.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span>₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform Fee</span>
          <span>₹{platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {isInitialConsultationSelected && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-100/50 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/15">
          <p className="mt-1 text-emerald-800 dark:text-emerald-200/90">
            You pay ₹50 to confirm your request and avoid spam. You get ₹50 credits after booking, so effective consultation cost is ₹0.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="gstin">GSTIN (optional)</Label>
          <Input id="gstin" value={paymentForm.gstin} onChange={(event) => onChangeGstin(event.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mock-payment-outcome">Mock Payment Outcome (testing)</Label>
          <select
            id="mock-payment-outcome"
            value={paymentForm.mockOutcome}
            onChange={(event) => onChangeMockOutcome(event.target.value as PaymentStatus)}
            className="h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={paymentSubmitting}>
        {paymentSubmitting ? "Opening checkout..." : "Pay with Razorpay"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        In current mock mode, the selected test outcome is applied directly. In live mode, hosted Razorpay checkout is used.
      </p>
    </form>
  );
}
