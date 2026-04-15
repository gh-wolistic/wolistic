"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCw, TicketPercent, Wrench } from "lucide-react";
import { adminApi } from "@/lib/admin-api-client";
import type { Offer, OfferAssignment, MembershipTier } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tierOptions: Array<{ value: MembershipTier; label: string }> = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "elite", label: "Elite" },
  { value: "celeb", label: "Celeb" },
];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [assignments, setAssignments] = useState<OfferAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceReport, setMaintenanceReport] = useState<string | null>(null);

  const [offerCode, setOfferCode] = useState("");
  const [offerName, setOfferName] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [targetTier, setTargetTier] = useState<MembershipTier>("pro");
  const [durationMonths, setDurationMonths] = useState(6);
  const [autoDowngradeMonths, setAutoDowngradeMonths] = useState(6);
  const [downgradeToTier, setDowngradeToTier] = useState<MembershipTier>("free");
  const [maxRedemptions, setMaxRedemptions] = useState(100);
  const [validUntil, setValidUntil] = useState("");

  const [assignOfferCode, setAssignOfferCode] = useState("");
  const [assignProfessionalId, setAssignProfessionalId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => a.code.localeCompare(b.code));
  }, [offers]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [offersResponse, assignmentsResponse] = await Promise.all([
        adminApi.offers.list(),
        adminApi.offers.listAssignments({ limit: 20, offset: 0 }),
      ]);
      setOffers(offersResponse);
      setAssignments(assignmentsResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleCreateOffer = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        code: offerCode.trim().toUpperCase(),
        name: offerName.trim(),
        description: offerDescription.trim() || null,
        offer_type: "tier_upgrade" as const,
        domain: "subscription" as const,
        target_tier: targetTier,
        duration_months: durationMonths,
        auto_downgrade_after_months: autoDowngradeMonths,
        downgrade_to_tier: downgradeToTier,
        max_redemptions: maxRedemptions,
        valid_from: new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      };

      await adminApi.offers.create(payload);
      setOfferCode("");
      setOfferName("");
      setOfferDescription("");
      setTargetTier("pro");
      setDurationMonths(6);
      setAutoDowngradeMonths(6);
      setDowngradeToTier("free");
      setMaxRedemptions(100);
      setValidUntil("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOffer = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminApi.offers.assign({
        offer_code: assignOfferCode,
        professional_id: assignProfessionalId,
        auto_activate: true,
        notes: assignNotes || null,
      });
      setAssignProfessionalId("");
      setAssignNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign offer");
    } finally {
      setSubmitting(false);
    }
  };

  const runMaintenance = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const report = await adminApi.offers.runMaintenance();
      setMaintenanceReport(
        `Downgraded ${report.downgraded}, sent ${report.notifications_sent} notifications, expired ${report.expired_assignments} assignments.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Maintenance job failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Offers</h1>
          <p className="mt-2 text-slate-400">Centralized offer and discount lifecycle management.</p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {maintenanceReport && (
        <Alert>
          <AlertDescription>{maintenanceReport}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Create Offer</h2>
          </div>
          <form className="space-y-3" onSubmit={handleCreateOffer}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Code</Label>
                <Input value={offerCode} onChange={(e) => setOfferCode(e.target.value.toUpperCase())} placeholder="LAUNCH" required />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={offerName} onChange={(e) => setOfferName(e.target.value)} placeholder="Launch Partner Program" required />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} placeholder="Optional offer notes" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Target Tier</Label>
                <Select value={targetTier} onValueChange={(v) => setTargetTier(v as MembershipTier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Downgrade To</Label>
                <Select value={downgradeToTier} onValueChange={(v) => setDowngradeToTier(v as MembershipTier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Duration (months)</Label>
                <Input type="number" min={1} max={36} value={durationMonths} onChange={(e) => setDurationMonths(Number(e.target.value))} />
              </div>
              <div>
                <Label>Auto-downgrade (months)</Label>
                <Input type="number" min={1} max={36} value={autoDowngradeMonths} onChange={(e) => setAutoDowngradeMonths(Number(e.target.value))} />
              </div>
              <div>
                <Label>Max Redemptions</Label>
                <Input type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label>Valid Until (optional)</Label>
              <Input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Create Offer"}
            </Button>
          </form>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Assign Offer</h2>
            <Button variant="outline" size="sm" onClick={runMaintenance} disabled={submitting}>
              <Wrench className="mr-2 h-4 w-4" />
              Run Maintenance
            </Button>
          </div>
          <form className="space-y-3" onSubmit={handleAssignOffer}>
            <div>
              <Label>Offer Code</Label>
              <Select value={assignOfferCode} onValueChange={setAssignOfferCode}>
                <SelectTrigger><SelectValue placeholder="Select offer" /></SelectTrigger>
                <SelectContent>
                  {sortedOffers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.code}>
                      {offer.code} ({offer.usage.assigned}/{offer.max_redemptions ?? "∞"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Professional User ID</Label>
              <Input value={assignProfessionalId} onChange={(e) => setAssignProfessionalId(e.target.value)} placeholder="UUID" required />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Optional assignment notes" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !assignOfferCode}>
              {submitting ? "Assigning..." : "Assign and Activate"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Offer Catalog</h2>
        {loading ? (
          <p className="text-slate-400">Loading offers...</p>
        ) : sortedOffers.length === 0 ? (
          <p className="text-slate-400">No offers created yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedOffers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{offer.code} · {offer.name}</p>
                    <p className="text-xs text-slate-400">
                      {offer.target_tier ?? "-"} for {offer.duration_months ?? 0} month(s), max {offer.max_redemptions ?? "∞"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>Assigned: {offer.usage.assigned}</p>
                    <p>Active: {offer.usage.active}</p>
                    <p>Redeemed: {offer.usage.redeemed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Assignments</h2>
        {loading ? (
          <p className="text-slate-400">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-slate-400">No assignments yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                <div>
                  <p className="text-sm text-white">{assignment.offer_code} → {assignment.professional_id}</p>
                  <p className="text-xs text-slate-400">{new Date(assignment.assigned_at).toLocaleString()}</p>
                </div>
                <p className="text-xs uppercase tracking-wide text-cyan-300">{assignment.status}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
