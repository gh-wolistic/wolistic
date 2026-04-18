"use client";

import { useState } from "react";
import { FileText, GraduationCap, Award, ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VerificationQueueItem } from "@/types/admin";

interface VerificationTableProps {
  items: VerificationQueueItem[];
  loading: boolean;
  onReview: (item: VerificationQueueItem) => void;
}

export function VerificationTable({ items, loading, onReview }: VerificationTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-400">Loading verifications...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <ShieldCheck className="h-12 w-12 text-slate-600" />
        <span className="text-lg font-medium text-slate-400">No verifications to review</span>
        <span className="text-sm text-slate-500">All caught up!</span>
      </div>
    );
  }

  const getTypeIcon = (item: VerificationQueueItem) => {
    if (item.verification_type === "identity") {
      return <FileText className="h-4 w-4 text-cyan-400" />;
    }
    if (item.credential_type === "education") {
      return <GraduationCap className="h-4 w-4 text-blue-400" />;
    }
    if (item.credential_type === "license") {
      return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
    }
    return <Award className="h-4 w-4 text-amber-400" />;
  };

  const getTypeLabel = (item: VerificationQueueItem) => {
    if (item.verification_type === "identity") {
      return item.document_type?.replace("_", " ").toUpperCase() || "ID Document";
    }
    return item.credential_name || item.credential_type || "Credential";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-zinc-300">Professional</TableHead>
            <TableHead className="text-zinc-300">Type</TableHead>
            <TableHead className="text-zinc-300">Details</TableHead>
            <TableHead className="text-zinc-300">Status</TableHead>
            <TableHead className="text-zinc-300">Submitted</TableHead>
            <TableHead className="text-zinc-300">Days Pending</TableHead>
            <TableHead className="text-zinc-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={`${item.verification_type}-${item.verification_id}`}
              className="border-white/10 hover:bg-white/5"
            >
              <TableCell>
                <div>
                  <p className="font-medium text-white">{item.professional_name}</p>
                  <p className="text-sm text-slate-400">@{item.professional_username}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(item)}
                  <span className="text-sm text-slate-300">
                    {item.verification_type === "identity" ? "Identity" : item.credential_type}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <p className="text-sm text-white truncate">{getTypeLabel(item)}</p>
                  {item.issuing_organization && (
                    <p className="text-xs text-slate-400 truncate">
                      by {item.issuing_organization}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(item.verification_status)}</TableCell>
              <TableCell className="text-sm text-slate-400">
                {new Date(item.submitted_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    item.days_pending > 7
                      ? "border-red-500/30 text-red-300"
                      : item.days_pending > 3
                      ? "border-amber-500/30 text-amber-300"
                      : "border-slate-500/30 text-slate-300"
                  }
                >
                  {item.days_pending}d
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReview(item)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
