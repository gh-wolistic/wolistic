"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CoinRule } from "@/types/admin";
import { COIN_EVENT_TYPES } from "@/types/admin";

interface CoinRuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: CoinRule | null;
  onSave: (data: Partial<CoinRule>) => Promise<void>;
}

export function CoinRuleEditor({ open, onOpenChange, rule, onSave }: CoinRuleEditorProps) {
  const [formData, setFormData] = useState<Partial<CoinRule>>({
    event_type: "",
    coins_awarded: 0,
    max_per_user: null,
    cooldown_days: null,
    is_active: true,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when rule changes or dialog opens
  useEffect(() => {
    if (rule) {
      setFormData({
        event_type: rule.event_type,
        coins_awarded: rule.coins_awarded,
        max_per_user: rule.max_per_user,
        cooldown_days: rule.cooldown_days,
        is_active: rule.is_active,
        description: rule.description || "",
      });
    } else {
      setFormData({
        event_type: "",
        coins_awarded: 0,
        max_per_user: null,
        cooldown_days: null,
        is_active: true,
        description: "",
      });
    }
    setError(null);
  }, [rule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save rule:", err);
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            {rule ? "Edit Coin Rule" : "Create Coin Rule"}
          </DialogTitle>
          <DialogDescription>
            {rule
              ? "Update the coin earning/spending rule below."
              : "Define a new rule for how coins are earned or spent."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type *</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              disabled={!!rule} // Can't change event type on edit
            >
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {COIN_EVENT_TYPES.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coins Awarded */}
          <div className="space-y-2">
            <Label htmlFor="coins-awarded">Coins Awarded *</Label>
            <Input
              id="coins-awarded"
              type="number"
              value={formData.coins_awarded}
              onChange={(e) => setFormData({ ...formData, coins_awarded: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 10"
              required
            />
            <p className="text-xs text-slate-400">Number of coins awarded for this event</p>
          </div>

          {/* Max Per User */}
          <div className="space-y-2">
            <Label htmlFor="max-per-user">Max Per User (optional)</Label>
            <Input
              id="max-per-user"
              type="number"
              value={formData.max_per_user || ""}
              onChange={(e) =>
                setFormData({ ...formData, max_per_user: e.target.value ? parseInt(e.target.value) : null })
              }
              placeholder="Maximum total coins per user (leave empty for unlimited)"
            />
            <p className="text-xs text-slate-400">Caps total coins a user can earn from this event</p>
          </div>

          {/* Cooldown Days */}
          <div className="space-y-2">
            <Label htmlFor="cooldown-days">Cooldown Days (optional)</Label>
            <Input
              id="cooldown-days"
              type="number"
              value={formData.cooldown_days || ""}
              onChange={(e) =>
                setFormData({ ...formData, cooldown_days: e.target.value ? parseInt(e.target.value) : null })
              }
              placeholder="e.g., 7 for once per week"
            />
            <p className="text-xs text-slate-400">Minimum days between awards</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal notes about this rule"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/30 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is-active" className="text-base">
                Active
              </Label>
              <p className="text-xs text-slate-400">Enable this rule to take effect immediately</p>
            </div>
            <Switch
              id="is-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.event_type}>
              {loading ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
