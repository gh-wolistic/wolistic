"use client";

import { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { AuditLogFilters } from "@/components/audit/AuditLogFilters";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi } from "@/lib/admin-api-client";
import type { AuditLog, AuditLogFilters as FilterType } from "@/types/admin";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [resourceType, setResourceType] = useState<string>("all");
  const [action, setAction] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [adminEmail, resourceType, action, fromDate, toDate]);

  // Load audit logs
  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);

      try {
        const filters: FilterType = {
          limit: pageSize,
          offset: page * pageSize,
        };

        if (adminEmail) filters.admin_email = adminEmail;
        if (resourceType !== "all") filters.resource_type = resourceType;
        if (action) filters.action = action;
        if (fromDate) filters.from_date = fromDate;
        if (toDate) filters.to_date = toDate;

        const result = await adminApi.audit.list(filters);
        setLogs(result.items);
        setTotal(result.total);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, [adminEmail, resourceType, action, fromDate, toDate, page, pageSize]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const filters: FilterType = {};
      if (adminEmail) filters.admin_email = adminEmail;
      if (resourceType !== "all") filters.resource_type = resourceType;
      if (action) filters.action = action;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const blob = await adminApi.audit.export(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export audit logs:", err);
      setError(err instanceof Error ? err.message : "Failed to export logs");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setAdminEmail("");
    setResourceType("all");
    setAction("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all administrative actions for compliance (HIPAA/GDPR)
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting || loading}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <AuditLogFilters
        adminEmail={adminEmail}
        resourceType={resourceType}
        action={action}
        fromDate={fromDate}
        toDate={toDate}
        onAdminEmailChange={setAdminEmail}
        onResourceTypeChange={setResourceType}
        onActionChange={setAction}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onReset={handleReset}
      />

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>
          {loading ? "Loading..." : `${total} ${total === 1 ? "log" : "logs"} found`}
        </span>
      </div>

      {/* Table */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
