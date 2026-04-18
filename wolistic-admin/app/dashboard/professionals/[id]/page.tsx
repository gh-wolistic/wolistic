"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, CheckCircle, Ban, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TierUpgradeDialog } from "@/components/professionals/TierUpgradeDialog";
import { adminApi } from "@/lib/admin-api-client";
import type { ProfessionalDetail } from "@/types/admin";

export default function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);

  useEffect(() => {
    async function loadProfessional() {
      setLoading(true);
      setError(null);

      try {
        const data = await adminApi.professionals.getById(id);
        setProfessional(data);
      } catch (err) {
        console.error("Failed to load professional:", err);
        setError(err instanceof Error ? err.message : "Failed to load professional");
      } finally {
        setLoading(false);
      }
    }

    void loadProfessional();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApi.professionals.approve(id);
      router.push("/dashboard/professionals");
    } catch (err) {
      console.error("Failed to approve:", err);
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await adminApi.professionals.suspend(id);
      router.push("/dashboard/professionals");
    } catch (err) {
      console.error("Failed to suspend:", err);
      setError(err instanceof Error ? err.message : "Failed to suspend");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTier = async (tier: string, durationMonths: number, offerCode: string | null) => {
    setActionLoading(true);
    try {
      await adminApi.professionals.updateTier(id, tier, durationMonths, offerCode);
      if (professional) {
        setProfessional({ 
          ...professional, 
          profile: { ...professional.profile, membership_tier: tier as any }
        });
      }
    } catch (err) {
      console.error("Failed to update tier:", err);
      setError(err instanceof Error ? err.message : "Failed to update tier");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="text-slate-400">Loading professional details...</span>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Professional not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isPending = !professional.user_status || professional.user_status === "pending";
  const completeness = professional.profile_completeness || 0;
  const completenessColor =
    completeness >= 90
      ? "text-emerald-400"
      : completeness >= 70
      ? "text-cyan-400"
      : completeness >= 50
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {professional.name || professional.email}
            </h1>
            <p className="mt-1 text-slate-400">Professional Details</p>
          </div>
        </div>

        <div className="flex gap-3">
          {isPending && (
            <Button onClick={handleApprove} disabled={actionLoading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          <Button variant="outline" onClick={handleSuspend} disabled={actionLoading}>
            <Ban className="mr-2 h-4 w-4" />
            Suspend
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <Badge
                variant={
                  professional.user_status === "approved"
                    ? "default"
                    : professional.user_status === "suspended"
                    ? "destructive"
                    : "secondary"
                }
                className="mt-2"
              >
                {professional.user_status || "pending"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Membership Tier</p>
              <div className="mt-2 flex items-center gap-2">
                {professional.membership_tier !== "free" && <Crown className="h-4 w-4 text-cyan-400" />}
                <span className="text-lg font-semibold capitalize text-white">
                  {professional.membership_tier || "free"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Profile Completeness</p>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${completenessColor}`} />
                <span className={`text-lg font-semibold ${completenessColor}`}>{completeness}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Basic Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{professional.email}</p>
              </div>
            </div>

            {professional.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Phone</p>
                  <p className="text-white">{professional.phone}</p>
                </div>
              </div>
            )}

            {professional.bio && (
              <div>
                <p className="text-sm text-slate-400">Bio</p>
                <p className="mt-1 text-white">{professional.bio}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-400">User ID</p>
              <p className="mt-1 font-mono text-xs text-slate-300">{professional.user_id}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Joined</p>
              <p className="mt-1 text-white">
                {new Date(professional.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Tier Management */}
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Membership Tier</h3>
          <div className="mb-4 rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current Tier</p>
                <div className="mt-1 flex items-center gap-2">
                  {professional.membership_tier !== "free" && <Crown className="h-4 w-4 text-cyan-400" />}
                  <span className="text-lg font-semibold capitalize text-white">
                    {professional.membership_tier || "free"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowTierUpgrade(true)}
            disabled={actionLoading}
          >
            <Crown className="mr-2 h-4 w-4" />
            Manage Tier & Subscription
          </Button>
        </Card>
      </div>

      {/* Professional Profile (if exists) */}
      {professional.specialties && professional.specialties.length > 0 && (
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {professional.specialties.map((specialty, idx) => (
              <Badge key={idx} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Tier Upgrade Dialog */}
      <TierUpgradeDialog
        open={showTierUpgrade}
        onOpenChange={setShowTierUpgrade}
        currentTier={professional.membership_tier || "free"}
        professionalName={professional.name || professional.email}
        onUpgrade={handleUpdateTier}
      />
    </div>
  );
}
