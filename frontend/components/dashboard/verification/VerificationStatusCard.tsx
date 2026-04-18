"use client";

import { CheckCircle2, XCircle, Clock, Shield, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { VerificationStatusResponse } from "@/lib/verification-api";

interface VerificationStatusCardProps {
  status: VerificationStatusResponse;
}

export function VerificationStatusCard({ status }: VerificationStatusCardProps) {
  const { identity_verification, credentials, is_searchable, search_hide_reason } = status;

  // Calculate verification progress
  const getTierProgress = (): {free: number; pro: number; elite: number} => {
    const approvedCredentials = credentials.filter((c) => c.verification_status === "approved").length;
    const hasEducation = credentials.some(
      (c) => c.credential_type === "education" && c.verification_status === "approved"
    );

    return {
      free: identity_verification?.verification_status === "approved" ? 100 : 0,
      pro: identity_verification?.verification_status === "approved" && approvedCredentials >= 1 ? 100 : 0,
      elite: identity_verification?.verification_status === "approved" && approvedCredentials >= 3 && hasEducation ? 100 : 0,
    };
  };

  const progress = getTierProgress();
  const approvedCount = credentials.filter((c) => c.verification_status === "approved").length;
  const pendingCount = credentials.filter((c) => c.verification_status === "pending").length;
  const rejectedCount = credentials.filter((c) => c.verification_status === "rejected").length;

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-emerald-400" />
          Verification Status
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Your professional credentials and search visibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Visibility Status */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-300">Search Visibility</p>
              <p className="mt-1 text-xs text-zinc-500">Your profile's discoverability status</p>
            </div>
            <div>
              {is_searchable ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Visible
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  <XCircle className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
            </div>
          </div>
          {!is_searchable && search_hide_reason && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-200">{search_hide_reason}</p>
            </div>
          )}
        </div>

        {/* Credential Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
            <p className="mt-1 text-xs text-zinc-400">Verified</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <p className="mt-1 text-xs text-zinc-400">Pending</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
            <p className="mt-1 text-xs text-zinc-400">Rejected</p>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-medium text-white">Tier Requirements</p>
          </div>

          {/* Free Tier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">Free Tier</p>
              <span className="text-xs text-zinc-500">{progress.free}%</span>
            </div>
            <Progress value={progress.free} className="h-2" />
            <p className="text-xs text-zinc-500">
              {progress.free === 100 ? (
                <span className="text-emerald-400">✓ Identity verified</span>
              ) : (
                "Requires: Identity verification"
              )}
            </p>
          </div>

          {/* Pro Tier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">Pro Tier</p>
              <span className="text-xs text-zinc-500">{progress.pro}%</span>
            </div>
            <Progress value={progress.pro} className="h-2" />
            <p className="text-xs text-zinc-500">
              {progress.pro === 100 ? (
                <span className="text-emerald-400">✓ Ready for Pro upgrade</span>
              ) : (
                "Requires: Identity + 1 credential"
              )}
            </p>
          </div>

          {/* Elite Tier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">Elite Tier</p>
              <span className="text-xs text-zinc-500">{progress.elite}%</span>
            </div>
            <Progress value={progress.elite} className="h-2" />
            <p className="text-xs text-zinc-500">
              {progress.elite === 100 ? (
                <span className="text-emerald-400">✓ Ready for Elite upgrade</span>
              ) : (
                "Requires: Identity + 3 credentials + 1 education"
              )}
            </p>
          </div>
        </div>

        {/* Identity Status Quick View */}
        {identity_verification && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Identity Verification</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {identity_verification.document_type.replace("_", " ").toUpperCase()}
                </p>
              </div>
              <div>
                {identity_verification.verification_status === "approved" && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
                {identity_verification.verification_status === "pending" && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                )}
                {identity_verification.verification_status === "rejected" && (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Rejected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {!is_searchable && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-300">Next Steps</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
              {!identity_verification?.verified_at && (
                <li>• Upload government ID for identity verification</li>
              )}
              {identity_verification?.verification_status === "rejected" && (
                <li>• Re-upload identity document (check rejection reason)</li>
              )}
              {credentials.filter((c) => c.credential_type === "license" && c.verification_status !== "approved").length > 0 && (
                <li>• Complete license verification for your profession</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
