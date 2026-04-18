"use client";

import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IdentityVerificationSection } from "./IdentityVerificationSection";
import { CredentialVerificationSection } from "./CredentialVerificationSection";
import { VerificationStatusCard } from "./VerificationStatusCard";
import { getVerificationStatus } from "@/lib/verification-api";
import type { VerificationStatusResponse } from "@/lib/verification-api";

export function ProfileVerificationSection() {
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerificationStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getVerificationStatus();
      setStatus(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load verification status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVerificationStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <Shield className="h-4 w-4 text-red-400" />
        <AlertTitle className="text-red-300">Error loading verification status</AlertTitle>
        <AlertDescription className="text-red-200">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-white/10 bg-linear-to-r from-emerald-500/10 to-teal-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-3">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Professional Verification</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Verify your credentials to build trust with clients and improve your profile visibility. 
              All documents are reviewed within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <VerificationStatusCard status={status} />

      {/* Identity Verification Section */}
      <IdentityVerificationSection
        identityVerification={status.identity_verification}
        onUpdate={loadVerificationStatus}
      />

      {/* Credential Verification Section */}
      <CredentialVerificationSection
        credentials={status.credentials}
        onUpdate={loadVerificationStatus}
      />

      {/* Help Text */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-medium text-white">Need Help?</p>
        <p className="mt-2 text-xs text-zinc-400">
          If you're having trouble uploading documents or have questions about the verification process, 
          please contact our support team at support@wolistic.com or use the chat button in the bottom-right corner.
        </p>
      </div>
    </div>
  );
}
