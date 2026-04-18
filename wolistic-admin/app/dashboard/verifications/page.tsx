"use client";

import { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VerificationTable } from "@/components/verifications/VerificationTable";
import { VerificationFilters } from "@/components/verifications/VerificationFilters";
import { VerificationReviewDialog } from "@/components/verifications/VerificationReviewDialog";
import { adminApi } from "@/lib/admin-api-client";
import type { VerificationQueueItem, VerificationQueueResponse } from "@/types/admin";

export default function VerificationsPage() {
  const [queueData, setQueueData] = useState<VerificationQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VerificationQueueItem | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Filters
  const [queueType, setQueueType] = useState<"all" | "identity" | "credential" | "expiring_licenses">("all");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [queueType, statusFilter]);

  // Load verifications
  useEffect(() => {
    loadVerifications();
  }, [queueType, statusFilter, page]);

  async function loadVerifications() {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        status_filter: statusFilter,
        limit: pageSize,
        offset: page * pageSize,
      };

      if (queueType !== "all") {
        filters.queue_type = queueType;
      }

      const data = await adminApi.verifications.getQueue(filters);
      setQueueData(data);
    } catch (err) {
      console.error("Failed to load verifications:", err);
      setError(err instanceof Error ? err.message : "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }

  const handleReview = (item: VerificationQueueItem) => {
    setSelectedItem(item);
    setShowReviewDialog(true);
  };

  const handleApprove = async (item: VerificationQueueItem) => {
    if (item.verification_type === "identity") {
      await adminApi.verifications.approveIdentity(item.professional_id);
    } else {
      await adminApi.verifications.approveCredential(item.verification_id as number);
    }
    // Reload the queue
    await loadVerifications();
  };

  const handleReject = async (item: VerificationQueueItem, reason: string) => {
    if (item.verification_type === "identity") {
      await adminApi.verifications.rejectIdentity(item.professional_id, { rejection_reason: reason });
    } else {
      await adminApi.verifications.rejectCredential(item.verification_id as number, { rejection_reason: reason });
    }
    // Reload the queue
    await loadVerifications();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            Verification Queue
          </h1>
          <p className="mt-2 text-slate-400">
            Review and approve professional identity documents and credentials
          </p>
        </div>

        <Button onClick={loadVerifications} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      {queueData && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/20 p-3">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{queueData.pending_identity_count}</p>
                <p className="text-sm text-slate-400">Pending Identity Docs</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-3">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{queueData.pending_credential_count}</p>
                <p className="text-sm text-slate-400">Pending Credentials</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-3">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{queueData.expiring_licenses_count}</p>
                <p className="text-sm text-slate-400">Licenses Expiring Soon</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <VerificationFilters
        queueType={queueType}
        onQueueTypeChange={setQueueType}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        pendingIdentityCount={queueData?.pending_identity_count || 0}
        pendingCredentialCount={queueData?.pending_credential_count || 0}
        expiringLicensesCount={queueData?.expiring_licenses_count || 0}
      />

      {/* Verification Table */}
      <VerificationTable
        items={queueData?.items || []}
        loading={loading}
        onReview={handleReview}
      />

      {/* Pagination */}
      {queueData && queueData.total_count > pageSize && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, queueData.total_count)} of{" "}
            {queueData.total_count} verifications
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= queueData.total_count}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <VerificationReviewDialog
        item={selectedItem}
        open={showReviewDialog}
        onClose={() => {
          setShowReviewDialog(false);
          setSelectedItem(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
