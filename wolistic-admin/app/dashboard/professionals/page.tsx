"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, CheckCircle } from "lucide-react";
import { ProfessionalTable } from "@/components/professionals/ProfessionalTable";
import { ProfessionalFilters } from "@/components/professionals/ProfessionalFilters";
import { BulkApproveDialog } from "@/components/professionals/BulkApproveDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi } from "@/lib/admin-api-client";
import type { Professional, AdminProfessionalStatus } from "@/types/admin";

export default function ProfessionalsPage() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkApprove, setShowBulkApprove] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<AdminProfessionalStatus | "all">("pending");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, tierFilter, searchQuery]);

  // Load professionals
  useEffect(() => {
    async function loadProfessionals() {
      setLoading(true);
      setError(null);

      try {
        const result = await adminApi.professionals.list({
          status: statusFilter,
          tier: tierFilter !== "all" ? tierFilter : undefined,
          search: searchQuery || undefined,
          limit: pageSize,
          offset: page * pageSize,
        });

        setProfessionals(result.items);
        setTotal(result.total);
      } catch (err) {
        console.error("Failed to load professionals:", err);
        setError(err instanceof Error ? err.message : "Failed to load professionals");
      } finally {
        setLoading(false);
      }
    }

    void loadProfessionals();
  }, [statusFilter, tierFilter, searchQuery, page, pageSize]);

  const handleApprove = async (userId: string) => {
    try {
      await adminApi.professionals.approve(userId);
      // Reload data
      setProfessionals(prev => prev.filter(p => p.id !== userId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to approve professional:", err);
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await adminApi.professionals.suspend(userId);
      // Reload data
      setProfessionals(prev => prev.filter(p => p.id !== userId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to suspend professional:", err);
      setError(err instanceof Error ? err.message : "Failed to suspend");
    }
  };

  const handleUpdateTier = async (userId: string, tier: string) => {
    try {
      await adminApi.professionals.updateTier(userId, tier);
      // Update in place
      setProfessionals(prev =>
        prev.map(p => (p.id === userId ? { ...p, profile: { ...p.profile, membership_tier: tier } } : p))
      );
    } catch (err) {
      console.error("Failed to update tier:", err);
      setError(err instanceof Error ? err.message : "Failed to update tier");
    }
  };

  const handleBulkApprove = async (minCompleteness: number) => {
    try {
      const selectedArray = Array.from(selectedIds);
      await adminApi.professionals.bulkApprove(selectedArray, minCompleteness);
      
      // Remove approved from list if on pending tab
      if (statusFilter === "pending") {
        setProfessionals(prev => prev.filter(p => !selectedIds.has(p.id)));
        setTotal(prev => Math.max(0, prev - selectedIds.size));
      }
      
      setSelectedIds(new Set());
      setShowBulkApprove(false);
    } catch (err) {
      console.error("Failed to bulk approve:", err);
      setError(err instanceof Error ? err.message : "Bulk approve failed");
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log("Export to CSV");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Professionals</h1>
          <p className="mt-2 text-slate-400">
            Manage professional verification and membership
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={() => setShowBulkApprove(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Bulk Approve ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <ProfessionalFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      <ProfessionalTable
        professionals={professionals}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onApprove={handleApprove}
        onSuspend={handleSuspend}
        onUpdateTier={handleUpdateTier}
        onViewDetails={(userId) => router.push(`/dashboard/professionals/${userId}`)}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Bulk Approve Dialog */}
      <BulkApproveDialog
        open={showBulkApprove}
        onOpenChange={setShowBulkApprove}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkApprove}
      />
    </div>
  );
}
