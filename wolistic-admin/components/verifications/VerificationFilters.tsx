"use client";

import { FileText, GraduationCap, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VerificationFiltersProps {
  queueType: "all" | "identity" | "credential" | "expiring_licenses";
  onQueueTypeChange: (type: "all" | "identity" | "credential" | "expiring_licenses") => void;
  statusFilter: "pending" | "approved" | "rejected";
  onStatusFilterChange: (status: "pending" | "approved" | "rejected") => void;
  pendingIdentityCount: number;
  pendingCredentialCount: number;
  expiringLicensesCount: number;
}

export function VerificationFilters({
  queueType,
  onQueueTypeChange,
  statusFilter,
  onStatusFilterChange,
  pendingIdentityCount,
  pendingCredentialCount,
  expiringLicensesCount,
}: VerificationFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Queue Type Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto">
        <button
          onClick={() => onQueueTypeChange("all")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            queueType === "all"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
          }`}
        >
          All Verifications
          {pendingIdentityCount + pendingCredentialCount > 0 && (
            <span className="ml-1 rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs">
              {pendingIdentityCount + pendingCredentialCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onQueueTypeChange("identity")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            queueType === "identity"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
          }`}
        >
          <FileText className="h-4 w-4" />
          Identity Documents
          {pendingIdentityCount > 0 && (
            <span className="ml-1 rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs">
              {pendingIdentityCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onQueueTypeChange("credential")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            queueType === "credential"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Credentials
          {pendingCredentialCount > 0 && (
            <span className="ml-1 rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs">
              {pendingCredentialCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onQueueTypeChange("expiring_licenses")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            queueType === "expiring_licenses"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
          }`}
        >
          <Clock className="h-4 w-4" />
          Expiring Soon
          {expiringLicensesCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/30 px-2 py-0.5 text-xs">
              {expiringLicensesCount}
            </span>
          )}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Status:</span>
        <Select value={statusFilter} onValueChange={(value: "pending" | "approved" | "rejected") => onStatusFilterChange(value)}>
          <SelectTrigger className="w-48 border-white/10 bg-white/5 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
