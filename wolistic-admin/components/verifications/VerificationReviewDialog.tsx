"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, XCircle, ExternalLink, Calendar, Building, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VerificationQueueItem } from "@/types/admin";
import { adminApi } from "@/lib/admin-api-client";

interface VerificationReviewDialogProps {
  item: VerificationQueueItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (item: VerificationQueueItem) => Promise<void>;
  onReject: (item: VerificationQueueItem, reason: string) => Promise<void>;
}

const REJECTION_TEMPLATES = [
  "Document is unclear or unreadable",
  "Document appears to be expired",
  "Information does not match profile",
  "Invalid or suspicious document",
  "Additional verification required",
];

export function VerificationReviewDialog({
  item,
  open,
  onClose,
  onApprove,
  onReject,
}: VerificationReviewDialogProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Fetch signed URL when dialog opens with a document
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!item?.document_url || !open) {
        setSignedUrl(null);
        return;
      }

      setLoadingUrl(true);
      try {
        const response = await adminApi.verifications.getDocumentUrl(
          item.document_url,
          item.verification_type
        );
        setSignedUrl(response.signed_url);
      } catch (err) {
        console.error("Failed to load document URL:", err);
        setSignedUrl(null);
      } finally {
        setLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [item?.document_url, item?.verification_type, open]);

  if (!item) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    try {
      await onApprove(item);
      onClose();
      setShowRejectForm(false);
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setIsRejecting(true);
    setError(null);
    try {
      await onReject(item, rejectionReason);
      onClose();
      setShowRejectForm(false);
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    setShowRejectForm(false);
    setRejectionReason("");
    setError(null);
    setSignedUrl(null);
    onClose();
  };

  const isImage = signedUrl?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = signedUrl?.endsWith('.pdf') || signedUrl?.includes('.pdf');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Review {item.verification_type === "identity" ? "Identity" : "Credential"} Verification
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Verify the authenticity and accuracy of submitted information
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Professional Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-300">Professional Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-slate-400">Name:</span>
                <span className="ml-2 text-sm text-white">{item.professional_name}</span>
              </div>
              <div>
                <span className="text-sm text-slate-400">Username:</span>
                <span className="ml-2 text-sm text-white">@{item.professional_username}</span>
              </div>
              <div>
                <span className="text-sm text-slate-400">Submitted:</span>
                <span className="ml-2 text-sm text-white">
                  {new Date(item.submitted_at).toLocaleDateString()} ({item.days_pending} days ago)
                </span>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-300">
              {item.verification_type === "identity" ? "Document" : "Credential"} Information
            </h3>
            <div className="space-y-3">
              {item.verification_type === "identity" ? (
                <div>
                  <Label className="text-slate-400">Document Type</Label>
                  <p className="mt-1 text-white">
                    {item.document_type?.replace("_", " ").toUpperCase()}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-slate-400">Credential Name</Label>
                    <p className="mt-1 text-white">{item.credential_name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Type</Label>
                    <p className="mt-1 text-white capitalize">{item.credential_type}</p>
                  </div>
                  {item.issuing_organization && (
                    <div>
                      <Label className="text-slate-400">Issuing Organization</Label>
                      <p className="mt-1 text-white">{item.issuing_organization}</p>
                    </div>
                  )}
                </>
              )}

              <div className="pt-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Status: {item.verification_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Document Preview</h3>
              {signedUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-cyan-400 hover:text-cyan-300"
                  onClick={() => window.open(signedUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
              )}
            </div>
            <div className="rounded-lg bg-slate-800/50 overflow-hidden">
              {loadingUrl ? (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-sm text-slate-400">Loading document...</p>
                </div>
              ) : !item.document_url ? (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-sm text-slate-500">No document uploaded</p>
                </div>
              ) : !signedUrl ? (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-sm text-slate-500">Failed to load document</p>
                </div>
              ) : isImage ? (
                <img 
                  src={signedUrl} 
                  alt="Verification document" 
                  className="w-full h-auto max-h-64 object-contain"
                />
              ) : isPdf ? (
                <iframe
                  src={signedUrl}
                  className="w-full h-64"
                  title="Document preview"
                />
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-slate-500" />
                    <p className="text-sm text-slate-400">Document uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(signedUrl, '_blank')}
                    >
                      View Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <Label className="text-red-300">Rejection Reason</Label>
              <div className="space-y-2">
                {REJECTION_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    onClick={() => setRejectionReason(template)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10"
                  >
                    {template}
                  </button>
                ))}
              </div>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter custom rejection reason or select a template above..."
                className="min-h-24 border-white/10 bg-white/5 text-white"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {!showRejectForm ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                  setError(null);
                }}
              >
                Cancel Rejection
              </Button>
              <Button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
