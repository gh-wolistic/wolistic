import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

type ProfileBasicsSectionProps = {
  value: ProfessionalEditorPayload;
  onFieldChange: (field: keyof ProfessionalEditorPayload, nextValue: string | number) => void;
  onUploadImage: (surface: "profile" | "cover", file: File) => Promise<void>;
  onRemoveImage: (surface: "profile" | "cover") => Promise<void>;
  isMediaBusy?: boolean;
};

export function ProfileBasicsSection({
  value,
  onFieldChange,
  onUploadImage,
  onRemoveImage,
  isMediaBusy = false,
}: ProfileBasicsSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Basic Profile</h2>
      <p className="mt-1 text-sm text-zinc-600">These fields control what clients see first in your public profile.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="editor-username">Public Username</Label>
          <Input
            id="editor-username"
            value={value.username}
            onChange={(event) => onFieldChange("username", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-specialization">Specialization</Label>
          <Input
            id="editor-specialization"
            value={value.specialization}
            onChange={(event) => onFieldChange("specialization", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-membership-tier">Membership Tier</Label>
          <Input
            id="editor-membership-tier"
            value={value.membership_tier}
            onChange={(event) => onFieldChange("membership_tier", event.target.value)}
            placeholder="verified / premium"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-experience">Experience Years</Label>
          <Input
            id="editor-experience"
            type="number"
            min={0}
            value={value.experience_years}
            onChange={(event) => onFieldChange("experience_years", Number(event.target.value || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-location">Location</Label>
          <Input
            id="editor-location"
            value={value.location}
            onChange={(event) => onFieldChange("location", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-sex">Sex</Label>
          <Input
            id="editor-sex"
            value={value.sex}
            onChange={(event) => onFieldChange("sex", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-profile-image">Profile Image</Label>
          <Input
            id="editor-profile-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
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
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="truncate">{value.profile_image_url || "No profile image uploaded"}</span>
            {value.profile_image_url ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isMediaBusy}
                onClick={() => void onRemoveImage("profile")}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-cover-image">Cover Image</Label>
          <Input
            id="editor-cover-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
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
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="truncate">{value.cover_image_url || "No cover image uploaded"}</span>
            {value.cover_image_url ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isMediaBusy}
                onClick={() => void onRemoveImage("cover")}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="editor-short-bio">Short Bio</Label>
          <Textarea
            id="editor-short-bio"
            value={value.short_bio}
            onChange={(event) => onFieldChange("short_bio", event.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editor-about">About</Label>
          <Textarea
            id="editor-about"
            value={value.about}
            onChange={(event) => onFieldChange("about", event.target.value)}
            rows={5}
          />
        </div>
      </div>
    </section>
  );
}
