"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminProfessionalStatus } from "@/types/admin";

interface ProfessionalFiltersProps {
  statusFilter: AdminProfessionalStatus | "all";
  onStatusChange: (status: AdminProfessionalStatus | "all") => void;
  tierFilter: string;
  onTierChange: (tier: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProfessionalFilters({
  statusFilter,
  onStatusChange,
  tierFilter,
  onTierChange,
  searchQuery,
  onSearchChange,
}: ProfessionalFiltersProps) {
  const statusOptions: Array<{ value: AdminProfessionalStatus | "all"; label: string }> = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "suspended", label: "Suspended" },
  ];

  const tierOptions = [
    { value: "all", label: "All Tiers" },
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
    { value: "elite", label: "Elite" },
    { value: "celeb", label: "Celeb" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Status Filter */}
          <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onStatusChange(option.value)}
                className={
                  statusFilter === option.value
                    ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
                }
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1">
            {tierOptions.map((option) => (
              <Button
                key={option.value}
                variant={tierFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onTierChange(option.value)}
                className={
                  tierFilter === option.value
                    ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
