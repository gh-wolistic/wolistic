"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DocumentType, IdentityVerification } from "@/lib/verification-api";
import {
  generateIdentityUploadUrl,
  uploadDocumentToSupabase,
  submitIdentityVerification,
} from "@/lib/verification-api";

interface IdentityVerificationSectionProps {
  identityVerification: IdentityVerification | null;
  onUpdate: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan_card", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

export function IdentityVerificationSection({
  identityVerification,
  onUpdate,
}: IdentityVerificationSectionProps) {
  const [documentType, setDocumentType] = useState<DocumentType>("aadhaar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress("Requesting upload URL...");

    try {
      // Step 1: Get upload URL from backend
      const { upload_url, file_path } = await generateIdentityUploadUrl({
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        document_type: documentType,
      });

      setUploadProgress("Uploading document...");

      // Step 2: Upload file directly to Supabase
      await uploadDocumentToSupabase(upload_url, selectedFile);

      setUploadProgress("Confirming upload...");

      // Step 3: Confirm upload with backend
      await submitIdentityVerification({
        document_type: documentType,
        document_url: file_path,
      });

      setUploadProgress(null);
      setSelectedFile(null);
      onUpdate();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed");
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: IdentityVerification["verification_status"]) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Verified</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Pending Verification</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getGracePeriodDays = () => {
    if (!identityVerification?.grace_period_expires_at) return null;
    const expiryDate = new Date(identityVerification.grace_period_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const gracePeriodDays = getGracePeriodDays();

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5 text-emerald-400" />
          Identity Verification
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Required to appear in search results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grace Period Warning */}
        {gracePeriodDays !== null && gracePeriodDays <= 7 && !identityVerification?.verified_at && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              {gracePeriodDays > 0
                ? `Grace period expires in ${gracePeriodDays} day${gracePeriodDays === 1 ? "" : "s"}. Upload your ID to stay visible in search.`
                : "Grace period expired. Upload your ID to become visible in search."}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Status */}
        {identityVerification && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Status</p>
                {getStatusBadge(identityVerification.verification_status)}
                {identityVerification.verification_status === "approved" && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Verified on {new Date(identityVerification.verified_at!).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Document Type</p>
                <p className="mt-1 font-medium text-white">
                  {DOCUMENT_TYPES.find((dt) => dt.value === identityVerification.document_type)?.label}
                </p>
              </div>
            </div>

            {/* Rejection Reason */}
            {identityVerification.verification_status === "rejected" && identityVerification.rejection_reason && (
              <Alert className="mt-4 border-red-500/50 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  <span className="font-medium">Rejection reason:</span> {identityVerification.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Upload Form (only show if not approved) */}
        {(!identityVerification || identityVerification.verification_status === "rejected") && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-type" className="text-zinc-300">
                Document Type
              </Label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                <SelectTrigger id="document-type" className="mt-2 border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document-file" className="text-zinc-300">
                Upload Document
              </Label>
              <div className="mt-2">
                <input
                  id="document-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="document-file">
                  <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 transition-colors hover:border-white/30 hover:bg-white/10">
                    <Upload className="h-5 w-5 text-zinc-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        {selectedFile ? selectedFile.name : "Click to select file"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        JPG, PNG, or PDF • Max 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {uploadProgress && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-400 animate-spin" />
                <AlertDescription className="text-blue-200">{uploadProgress}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full h-12 bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Submit for Verification"}
            </Button>

            <p className="text-xs text-zinc-500 text-center">
              Your document will be reviewed by our team within 24 hours. For security, identity documents are auto-deleted 30 days after approval.
            </p>
          </div>
        )}

        {/* Approved State */}
        {identityVerification?.verification_status === "approved" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-3 font-medium text-emerald-300">
              Identity Verified
            </p>
            <p className="mt-1 text-sm text-emerald-200/80">
              You're all set! Your profile is visible in search results.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
