import type React from "react";

import type { PaymentForm } from "@/components/payment/types";
import { CoinRedemptionInput } from "@/components/dashboard/coins/CoinRedemptionInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentStepProps = {
  baseSubtotal: number;
  discountAmount: number;
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
  onChangeCoins?: (coins: number) => void;
};

export function PaymentStep({
  baseSubtotal,
  discountAmount,
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
  onChangeCoins,
}: PaymentStepProps) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <h4>Payment Details</h4>

      <div className="space-y-2 rounded-lg border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span>Service Fee</span>
          <span>{baseSubtotal === 0 ? "Free" : `₹${baseSubtotal.toFixed(2)}`}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
            <span>Offer Discount</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discounted Service Fee</span>
            <span>{subtotal === 0 ? "Free" : `₹${subtotal.toFixed(2)}`}</span>
          </div>
        )}
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
            You pay ₹250 to confirm your request and avoid spam. You get coins cashback after booking, so effective consultation cost is reduced.
          </p>
        </div>
      )}

      {onChangeCoins && (
        <CoinRedemptionInput
          grandTotal={grandTotal}
          value={paymentForm.coins_to_use ?? 0}
          onChange={onChangeCoins}
        />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="gstin">GSTIN (optional)</Label>
          <Input id="gstin" value={paymentForm.gstin} onChange={(event) => onChangeGstin(event.target.value)} />
        </div>
      </div>

      {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={paymentSubmitting}>
        {paymentSubmitting ? "Opening checkout..." : "Pay with Razorpay"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Payment status is resolved by the backend after order creation and verification.
      </p>
    </form>
  );
}
