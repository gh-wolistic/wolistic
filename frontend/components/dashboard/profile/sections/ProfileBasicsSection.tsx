import Image from "next/image";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { checkUsernameAvailability, fetchUsernameChangeLimits, type UsernameChangeLimits } from "@/components/dashboard/profile/profileEditorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

type ProfileBasicsSectionProps = {
  value: ProfessionalEditorPayload;
  onFieldChange: (field: keyof ProfessionalEditorPayload, nextValue: string | number) => void;
  onUploadImage: (surface: "profile" | "cover", file: File) => Promise<void>;
  onRemoveImage: (surface: "profile" | "cover") => Promise<void>;
  isMediaBusy?: boolean;
};

function initialsFromName(name: string): string {
  const normalized = name.trim();
  if (!normalized) {
    return "SM";
  }
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Helper to convert relative storage path to full public URL
function toPublicImageUrl(path: string): string {
  if (!path) return "";
  // If already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Otherwise, construct the public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/wolistic-media-profile/${path}`;
}

export function ProfileBasicsSection({
  value,
  onFieldChange,
  onUploadImage,
  onRemoveImage,
  isMediaBusy = false,
}: ProfileBasicsSectionProps) {
  const { accessToken } = useAuthSession();
  const initials = initialsFromName(value.username || value.specialization || "");

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [usernameLimits, setUsernameLimits] = useState<UsernameChangeLimits | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void fetchUsernameChangeLimits(accessToken)
      .then(setUsernameLimits)
      .catch(() => null);
  }, [accessToken]);

  useEffect(() => {
    const username = (value.username || "").trim();
    if (username.length < 2) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (!accessToken) return;
      void checkUsernameAvailability(username, accessToken)
        .then((data) => {
          setUsernameStatus(data.available ? "available" : "taken");
        })
        .catch(() => setUsernameStatus("idle"));
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.username, accessToken]);

  return (
    <section className="w-full max-w-full space-y-6 overflow-hidden">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="relative h-40 sm:h-56 bg-linear-to-r from-emerald-500 via-teal-500 to-blue-500">
          {value.cover_image_url ? (
            <Image src={toPublicImageUrl(value.cover_image_url)} alt="Cover" fill className="object-cover" />
          ) : null}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/70 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Upload Cover</span>
              <span className="sm:hidden">Cover</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                disabled={isMediaBusy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void onUploadImage("cover", file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {value.cover_image_url ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/30 bg-black/50 text-white text-xs px-2 sm:px-3"
                disabled={isMediaBusy}
                onClick={() => void onRemoveImage("cover")}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-8 sm:pb-8">
          <div className="mb-4 flex items-end gap-3 sm:gap-6 -mt-10 sm:-mt-14">
            <div className="relative shrink-0">
              <div className="relative flex h-20 w-20 sm:h-32 sm:w-32 items-center justify-center rounded-2xl border-4 border-[#0d1526] bg-linear-to-br from-emerald-500 to-teal-600 text-2xl sm:text-4xl font-semibold text-white shadow-xl">
                {value.profile_image_url ? (
                  <Image src={toPublicImageUrl(value.profile_image_url)} alt="Profile" fill className="rounded-2xl object-cover" sizes="(max-width: 640px) 80px, 128px" />
                ) : (
                  initials
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-xl bg-zinc-800 text-white shadow-lg hover:scale-105">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={isMediaBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    void onUploadImage("profile", file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1 pb-2 sm:pb-3">
              <h2 className="truncate text-xl font-semibold tracking-tight text-white sm:text-3xl">{value.username || ""}</h2>
              <p className="truncate text-sm text-zinc-400 sm:text-lg">{value.specialization || ""}</p>
              {value.profile_image_url ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 border-white/20 bg-white/5 text-zinc-300 text-xs sm:text-sm"
                  disabled={isMediaBusy}
                  onClick={() => void onRemoveImage("profile")}
                >
                  Remove profile image
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h3 className="mb-4 sm:mb-6 flex items-center gap-2 text-xl sm:text-2xl font-semibold tracking-tight text-white">Basic Information</h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Username *" id="editor-username">
            <Input
              id="editor-username"
              disabled={usernameLimits != null && usernameLimits.changes_this_year >= usernameLimits.yearly_limit}
              className={`h-12 rounded-xl border-white/10 bg-white/5 text-white ${
                usernameStatus === "taken" ? "border-red-500/60" : usernameStatus === "available" ? "border-emerald-500/60" : ""
              } disabled:cursor-not-allowed disabled:opacity-50`}
              value={value.username}
              onChange={(event) => onFieldChange("username", event.target.value)}
              placeholder="Enter your username"
            />
            {usernameLimits?.changes_this_year != null && usernameLimits.changes_this_year >= usernameLimits.yearly_limit && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <XCircle className="h-3.5 w-3.5" /> Yearly username change limit reached
              </p>
            )}
            {usernameLimits?.changes_today != null && usernameLimits.changes_today >= usernameLimits.daily_limit && usernameLimits.changes_this_year < usernameLimits.yearly_limit && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                <XCircle className="h-3.5 w-3.5" /> Daily limit reached — try again tomorrow
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Username is available
              </p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <XCircle className="h-3.5 w-3.5" /> Username is already taken
              </p>
            )}
            {usernameStatus === "checking" && (
              <p className="mt-1 text-xs text-zinc-500">Checking availability…</p>
            )}
          </Field>

          <Field label="Experience (Years) *" id="editor-experience">
            <Input
              id="editor-experience"
              type="number"
              min={0}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.experience_years}
              onChange={(event) => onFieldChange("experience_years", Number(event.target.value || 0))}
            />
          </Field>

          <Field label="Location *" id="editor-location">
            <Input
              id="editor-location"
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.location}
              onChange={(event) => onFieldChange("location", event.target.value)}
              placeholder="City, State/Country"
            />
          </Field>

          <Field label="Sex" id="editor-sex">
            <Input
              id="editor-sex"
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.sex}
              onChange={(event) => onFieldChange("sex", event.target.value)}
            />
          </Field>
        </div>

        <div className="mt-5 space-y-5">
          <Field label="Short Bio *" id="editor-short-bio">
            <Input
              id="editor-short-bio"
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.short_bio}
              onChange={(event) => onFieldChange("short_bio", event.target.value)}
              maxLength={120}
              placeholder="A brief one-liner about yourself"
            />
            <p className="mt-1 text-xs text-zinc-500">{value.short_bio.length}/120 characters</p>
          </Field>

          <Field label="About *" id="editor-about">
            <Textarea
              id="editor-about"
              className="min-h-40 rounded-xl border-white/10 bg-white/5 text-white"
              value={value.about}
              onChange={(event) => onFieldChange("about", event.target.value)}
              rows={6}
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </Label>
      {children}
    </div>
  );
}
