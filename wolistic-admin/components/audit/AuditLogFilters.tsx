"use client";

import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AuditLogFiltersProps {
  adminEmail: string;
  resourceType: string;
  action: string;
  fromDate: string;
  toDate: string;
  onAdminEmailChange: (email: string) => void;
  onResourceTypeChange: (type: string) => void;
  onActionChange: (action: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onReset: () => void;
}

export function AuditLogFilters({
  adminEmail,
  resourceType,
  action,
  fromDate,
  toDate,
  onAdminEmailChange,
  onResourceTypeChange,
  onActionChange,
  onFromDateChange,
  onToDateChange,
  onReset,
}: AuditLogFiltersProps) {
  const resourceTypeOptions = [
    { value: "all", label: "All Resources" },
    { value: "professional", label: "Professionals" },
    { value: "user", label: "Users" },
    { value: "coin", label: "Coins" },
    { value: "coin_rule", label: "Coin Rules" },
    { value: "offer", label: "Offers" },
    { value: "offer_assignment", label: "Offer Assignments" },
    { value: "offer_maintenance", label: "Offer Maintenance" },
    { value: "subscription", label: "Subscriptions" },
    { value: "subscription_plan", label: "Subscription Plans" },
    { value: "billing", label: "Billing" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
      <div className="space-y-4">
        {/* Top Row: Email Search and Resource Type Filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Admin Email Search */}
          <div className="flex-1 md:max-w-sm">
            <Label htmlFor="adminEmail" className="text-sm text-slate-400 mb-1.5 block">
              Admin Email
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="adminEmail"
                placeholder="Filter by email..."
                value={adminEmail}
                onChange={(e) => onAdminEmailChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Resource Type Filter */}
          <div className="flex-1">
            <Label htmlFor="resourceType" className="text-sm text-slate-400 mb-1.5 block">
              Resource Type
            </Label>
            <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1 overflow-x-auto">
              {resourceTypeOptions.slice(0, 5).map((option) => (
                <Button
                  key={option.value}
                  variant={resourceType === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onResourceTypeChange(option.value)}
                  className={
                    resourceType === option.value
                      ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 whitespace-nowrap"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-300 whitespace-nowrap"
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-white/10 hover:bg-white/5"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Bottom Row: Action Search and Date Range */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Action Search */}
          <div className="flex-1 md:max-w-sm">
            <Label htmlFor="action" className="text-sm text-slate-400 mb-1.5 block">
              Action
            </Label>
            <Input
              id="action"
              placeholder="e.g., approve_professional, update_tier..."
              value={action}
              onChange={(e) => onActionChange(e.target.value)}
            />
          </div>

          {/* From Date */}
          <div className="flex-1 md:max-w-xs">
            <Label htmlFor="fromDate" className="text-sm text-slate-400 mb-1.5 block">
              From Date
            </Label>
            <Input
              id="fromDate"
              type="datetime-local"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="flex-1 md:max-w-xs">
            <Label htmlFor="toDate" className="text-sm text-slate-400 mb-1.5 block">
              To Date
            </Label>
            <Input
              id="toDate"
              type="datetime-local"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* More Resource Types (Show All) */}
        <div>
          <select
            value={resourceType}
            onChange={(e) => onResourceTypeChange(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {resourceTypeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
