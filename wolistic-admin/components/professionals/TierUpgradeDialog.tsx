"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/admin-api-client";

const TIER_OPTIONS = [
  { value: "free", label: "Free Tier", price: "₹0" },
  { value: "pro", label: "Pro Tier", price: "₹999/month" },
  { value: "elite", label: "Elite Tier", price: "₹2,499/month" },
  { value: "celeb", label: "Celeb Tier", price: "₹9,999/month" },
];

interface TierUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  professionalName: string;
  onUpgrade: (tier: string, durationMonths: number, offerCode: string | null) => Promise<void>;
}

export function TierUpgradeDialog({
  open,
  onOpenChange,
  currentTier,
  professionalName,
  onUpgrade,
}: TierUpgradeDialogProps) {
  const [selectedTier, setSelectedTier] = useState<string>(currentTier);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [offerCode, setOfferCode] = useState<string>("none");
  const [customOffer, setCustomOffer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadOffers() {
      try {
        const offers = await adminApi.offers.list();
        const mapped = offers
          .filter((offer) => offer.is_active && offer.domain === "subscription")
          .map((offer) => ({ value: offer.code, label: `${offer.code} - ${offer.name}` }));
        setAvailableOffers(mapped);
      } catch (error) {
        console.error("Failed to load offers:", error);
        setAvailableOffers([]);
      }
    }

    void loadOffers();
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalOfferCode = offerCode === "CUSTOM" ? customOffer : (offerCode === "none" ? null : offerCode);
      await onUpgrade(selectedTier, durationMonths, finalOfferCode);
      onOpenChange(false);
      // Reset form
      setSelectedTier(currentTier);
      setDurationMonths(1);
      setOfferCode("none");
      setCustomOffer("");
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTierOption = TIER_OPTIONS.find((t) => t.value === selectedTier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-cyan-400" />
            Upgrade Membership Tier
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Assign a membership tier for <span className="font-semibold text-white">{professionalName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="tier">Membership Tier</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger id="tier" className="border-white/10 bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-800">
                {TIER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{option.label}</span>
                      <span className="text-xs text-slate-400">{option.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          {selectedTier !== "free" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={36}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="border-white/10 bg-slate-800"
                />
                <p className="text-xs text-slate-400">
                  Valid from today for {durationMonths} month{durationMonths > 1 ? "s" : ""}
                </p>
              </div>

              {/* Offer Code */}
              <div className="space-y-2">
                <Label htmlFor="offer">Promotion / Offer Code</Label>
                <Select value={offerCode} onValueChange={setOfferCode}>
                  <SelectTrigger id="offer" className="border-white/10 bg-slate-800">
                    <SelectValue placeholder="No offer code" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-800">
                    <SelectItem value="none">No offer code</SelectItem>
                    {availableOffers.map((offer) => (
                      <SelectItem key={offer.value} value={offer.value}>
                        {offer.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="CUSTOM">CUSTOM - Custom Deal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Offer Code Input */}
              {offerCode === "CUSTOM" && (
                <div className="space-y-2">
                  <Label htmlFor="customOffer">Custom Offer Code</Label>
                  <Input
                    id="customOffer"
                    type="text"
                    maxLength={50}
                    placeholder="Enter custom offer code"
                    value={customOffer}
                    onChange={(e) => setCustomOffer(e.target.value.toUpperCase())}
                    className="border-white/10 bg-slate-800"
                  />
                </div>
              )}
            </>
          )}

          {/* Summary */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4">
            <h4 className="mb-2 text-sm font-semibold text-cyan-400">Summary</h4>
            <div className="space-y-1 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Tier:</span> {selectedTierOption?.label}
              </p>
              {selectedTier !== "free" && (
                <>
                  <p>
                    <span className="text-slate-400">Duration:</span> {durationMonths} month
                    {durationMonths > 1 ? "s" : ""}
                  </p>
                  {offerCode !== "none" && (
                    <p>
                      <span className="text-slate-400">Offer:</span>{" "}
                      {offerCode === "CUSTOM" ? customOffer : offerCode}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedTier === currentTier}>
            {loading ? "Upgrading..." : "Confirm Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
