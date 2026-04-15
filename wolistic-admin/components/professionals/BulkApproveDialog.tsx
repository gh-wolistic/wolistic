"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BulkApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (minCompleteness: number) => void;
}

export function BulkApproveDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkApproveDialogProps) {
  const [minCompleteness, setMinCompleteness] = useState(75);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(minCompleteness);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-cyan-400" />
            Bulk Approve Professionals
          </DialogTitle>
          <DialogDescription>
            Approve {selectedCount} selected professional{selectedCount > 1 ? "s" : ""} with minimum profile
            completeness threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Completeness Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="completeness-slider" className="text-sm font-medium">
                Minimum Profile Completeness
              </Label>
              <span className="text-2xl font-bold text-cyan-400">{minCompleteness}%</span>
            </div>

            <input
              id="completeness-slider"
              type="range"
              min="0"
              max="100"
              step="5"
              value={minCompleteness}
              onChange={(e) => setMinCompleteness(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            <div className="flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Warning */}
          {minCompleteness < 70 && (
            <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div className="text-sm text-amber-200">
                <strong>Low threshold warning:</strong> Approving professionals with less than 70% profile
                completeness may result in poor user experience. Consider reviewing profiles individually.
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-300">
            <p>
              Only professionals with <strong>{minCompleteness}% or higher</strong> profile completeness will be
              approved. Others will remain pending.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Approving..." : `Approve ${selectedCount} Professional${selectedCount > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
