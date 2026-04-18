"use client";

import { useState } from "react";
import { Plus, Upload, CheckCircle2, XCircle, Clock, AlertCircle, Trash2, ExternalLink, GraduationCap, Award, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { CredentialType, CredentialVerification } from "@/lib/verification-api";
import {
  generateIdentityUploadUrl,
  uploadDocumentToSupabase,
  submitCredential,
  deleteCredential,
} from "@/lib/verification-api";

interface CredentialVerificationSectionProps {
  credentials: CredentialVerification[];
  onUpdate: () => void;
}

const CREDENTIAL_TYPES: { value: CredentialType; label: string; icon: typeof GraduationCap; description: string }[] = [
  { value: "education", label: "Education", icon: GraduationCap, description: "Academic degrees (BSc, MSc, PhD)" },
  { value: "certificate", label: "Certificate", icon: Award, description: "Professional training certifications" },
  { value: "license", label: "License", icon: FileText, description: "Legal permits with expiry dates" },
];

export function CredentialVerificationSection({
  credentials,
  onUpdate,
}: CredentialVerificationSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [credentialType, setCredentialType] = useState<CredentialType>("education");
  const [credentialName, setCredentialName] = useState("");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [registryLink, setRegistryLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const resetForm = () => {
    setCredentialType("education");
    setCredentialName("");
    setIssuingOrganization("");
    setIssuedDate("");
    setExpiryDate("");
    setLicenseNumber("");
    setRegistryLink("");
    setSelectedFile(null);
    setError(null);
    setUploadProgress(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!credentialName.trim() || !issuingOrganization.trim()) {
      setError("Credential name and issuing organization are required");
      return;
    }

    if (credentialType === "license" && !expiryDate) {
      setError("Expiry date is required for licenses");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress("Preparing submission...");

    try {
      let documentUrl: string | undefined;

      // Upload document if selected
      if (selectedFile) {
        setUploadProgress("Requesting upload URL...");
        const { upload_url, file_path } = await generateIdentityUploadUrl({
          file_name: selectedFile.name,
          file_size: selectedFile.size,
        });

        setUploadProgress("Uploading document...");
        await uploadDocumentToSupabase(upload_url, selectedFile);
        documentUrl = file_path;
      }

      setUploadProgress("Submitting credential...");

      // Submit credential
      await submitCredential({
        credential_type: credentialType,
        credential_name: credentialName.trim(),
        issuing_organization: issuingOrganization.trim(),
        issued_date: issuedDate || undefined,
        expiry_date: expiryDate || undefined,
        license_number: licenseNumber.trim() || undefined,
        registry_link: registryLink.trim() || undefined,
        document_url: documentUrl,
      });

      setUploadProgress(null);
      setIsAddDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Submission failed");
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (credentialId: number) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;

    try {
      await deleteCredential(credentialId);
      onUpdate();
    } catch (caughtError) {
      alert(caughtError instanceof Error ? caughtError.message : "Delete failed");
    }
  };

  const getStatusBadge = (status: CredentialVerification["verification_status"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "auto_verified":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Auto-Verified
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCredentialIcon = (type: CredentialType) => {
    const credType = CREDENTIAL_TYPES.find((ct) => ct.value === type);
    const Icon = credType?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const groupedCredentials = {
    education: credentials.filter((c) => c.credential_type === "education"),
    certificate: credentials.filter((c) => c.credential_type === "certificate"),
    license: credentials.filter((c) => c.credential_type === "license"),
  };

  return (
    <div className="space-y-4">
      {/* Education Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
                Education
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Academic degrees (no expiry)
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen && credentialType === "education"} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsAddDialogOpen(open);
              if (open) setCredentialType("education");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {groupedCredentials.education.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No education credentials added yet</p>
          ) : (
            <div className="space-y-3">
              {groupedCredentials.education.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onDelete={handleDelete}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="h-5 w-5 text-emerald-400" />
                Professional Certificates
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Training certifications (optional expiry)
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen && credentialType === "certificate"} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsAddDialogOpen(open);
              if (open) setCredentialType("certificate");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {groupedCredentials.certificate.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No certificates added yet</p>
          ) : (
            <div className="space-y-3">
              {groupedCredentials.certificate.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onDelete={handleDelete}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Licenses Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-emerald-400" />
                Professional Licenses
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Legal permits (mandatory expiry tracking)
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen && credentialType === "license"} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsAddDialogOpen(open);
              if (open) setCredentialType("license");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {groupedCredentials.license.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No licenses added yet</p>
          ) : (
            <div className="space-y-3">
              {groupedCredentials.license.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onDelete={handleDelete}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Credential Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl bg-zinc-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getCredentialIcon(credentialType)}
              Add {CREDENTIAL_TYPES.find((ct) => ct.value === credentialType)?.label}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {CREDENTIAL_TYPES.find((ct) => ct.value === credentialType)?.description}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="credential-name" className="text-zinc-300">
                  Credential Name *
                </Label>
                <Input
                  id="credential-name"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  placeholder="e.g., BSc Nutrition & Dietetics"
                  className="mt-2 border-white/10 bg-white/5 text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="issuing-org" className="text-zinc-300">
                  Issuing Organization *
                </Label>
                <Input
                  id="issuing-org"
                  value={issuingOrganization}
                  onChange={(e) => setIssuingOrganization(e.target.value)}
                  placeholder="e.g., University of Mumbai"
                  className="mt-2 border-white/10 bg-white/5 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="issued-date" className="text-zinc-300">
                  Issued Date {credentialType === "license" && "*"}
                </Label>
                <Input
                  id="issued-date"
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="mt-2 border-white/10 bg-white/5 text-white"
                  required={credentialType === "license"}
                />
              </div>

              {credentialType !== "education" && (
                <div>
                  <Label htmlFor="expiry-date" className="text-zinc-300">
                    Expiry Date {credentialType === "license" && "*"}
                  </Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-2 border-white/10 bg-white/5 text-white"
                    required={credentialType === "license"}
                  />
                </div>
              )}

              {credentialType === "license" && (
                <div className="col-span-2">
                  <Label htmlFor="license-number" className="text-zinc-300">
                    License Number *
                  </Label>
                  <Input
                    id="license-number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g., MCI-12345678"
                    className="mt-2 border-white/10 bg-white/5 text-white"
                    required
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="registry-link" className="text-zinc-300">
                  Registry Link (optional)
                </Label>
                <Input
                  id="registry-link"
                  type="url"
                  value={registryLink}
                  onChange={(e) => setRegistryLink(e.target.value)}
                  placeholder="https://example.org/verify/..."
                  className="mt-2 border-white/10 bg-white/5 text-white"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  External verification URL (e.g., Yoga Alliance, Medical Council)
                </p>
              </div>

              <div className="col-span-2">
                <Label htmlFor="credential-file" className="text-zinc-300">
                  Upload Document {!registryLink.trim() && "*"}
                </Label>
                <div className="mt-2">
                  <input
                    id="credential-file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="credential-file">
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 transition-colors hover:border-white/30 hover:bg-white/10">
                      <Upload className="h-5 w-5 text-zinc-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          {selectedFile ? selectedFile.name : "Click to select file"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          JPG, PNG, or PDF • Max 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
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

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                disabled={isSubmitting || (!selectedFile && !registryLink.trim())}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Credential Card Component
function CredentialCard({
  credential,
  onDelete,
  getStatusBadge,
}: {
  credential: CredentialVerification;
  onDelete: (id: number) => void;
  getStatusBadge: (status: CredentialVerification["verification_status"]) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{credential.credential_name}</h4>
            {getStatusBadge(credential.verification_status)}
          </div>
          <p className="mt-1 text-sm text-zinc-400">{credential.issuing_organization}</p>
          
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {credential.issued_date && (
              <span>Issued: {new Date(credential.issued_date).toLocaleDateString()}</span>
            )}
            {credential.expiry_date && (
              <span className={
                new Date(credential.expiry_date) < new Date() ? "text-red-400" : ""
              }>
                Expires: {new Date(credential.expiry_date).toLocaleDateString()}
              </span>
            )}
            {credential.license_number && (
              <span>License #: {credential.license_number}</span>
            )}
          </div>

          {credential.registry_link && (
            <a
              href={credential.registry_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <ExternalLink className="h-3 w-3" />
              View on Registry
            </a>
          )}

          {credential.rejection_reason && (
            <Alert className="mt-3 border-red-500/50 bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs text-red-200">
                <span className="font-medium">Reason:</span> {credential.rejection_reason}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {credential.verification_status !== "approved" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(credential.id)}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
