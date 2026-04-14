"use client";

import { useState } from "react";
import { Link2, Instagram, Linkedin, Youtube, Twitter, Globe, Video, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfessionalEditorPayload, SocialLinksInput } from "@/types/professional-editor";

const PRONOUN_OPTIONS = [
  { value: "__none__", label: "Prefer not to say" },
  { value: "he/him", label: "He / Him" },
  { value: "she/her", label: "She / Her" },
  { value: "they/them", label: "They / Them" },
  { value: "he/they", label: "He / They" },
  { value: "she/they", label: "She / They" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Vancouver", label: "Vancouver (PT)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
];

const RESPONSE_TIME_OPTIONS = [
  { value: 1, label: "Within 1 hour" },
  { value: 3, label: "Within 3 hours" },
  { value: 6, label: "Within 6 hours" },
  { value: 12, label: "Within 12 hours" },
  { value: 24, label: "Within 24 hours" },
  { value: 48, label: "Within 2 days" },
  { value: 72, label: "Within 3 days" },
];

const CANCELLATION_OPTIONS = [
  { value: 0, label: "No notice required" },
  { value: 12, label: "12 hours notice" },
  { value: 24, label: "24 hours notice" },
  { value: 48, label: "48 hours notice" },
  { value: 72, label: "72 hours notice" },
];

const GOAL_SUGGESTIONS = [
  "Weight loss",
  "Muscle gain",
  "Stress reduction",
  "Better sleep",
  "Chronic pain relief",
  "Mental clarity",
  "Gut health",
  "Energy boost",
  "Flexibility",
  "Injury recovery",
];

type Props = {
  value: ProfessionalEditorPayload;
  onFieldChange: (field: keyof ProfessionalEditorPayload, nextValue: unknown) => void;
};

const fieldClass =
  "rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20";

export function ProfileIdentitySocialSection({ value, onFieldChange }: Props) {
  const goals = value.client_goals ?? [];
  const [customGoal, setCustomGoal] = useState("");

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      onFieldChange("client_goals", goals.filter((g) => g !== goal));
    } else {
      onFieldChange("client_goals", [...goals, goal]);
    }
  };

  const addCustomGoal = () => {
    const trimmed = customGoal.trim();
    if (trimmed && !goals.includes(trimmed)) {
      onFieldChange("client_goals", [...goals, trimmed]);
      setCustomGoal("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomGoal();
    }
  };

  const updateSocialLink = (key: keyof SocialLinksInput, linkValue: string) => {
    onFieldChange("social_links", { ...value.social_links, [key]: linkValue || undefined });
  };

  return (
    <section className="space-y-8">
      {/* ── Identity ── */}
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Identity</h3>
          <p className="mt-1 text-sm text-zinc-400">Help clients connect with you on a personal level.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Pronouns</Label>
            <Select
              value={value.pronouns ?? "__none__"}
              onValueChange={(v) => onFieldChange("pronouns", v === "__none__" ? undefined : v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Select pronouns" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {PRONOUN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Default Timezone</Label>
            <Select
              value={value.default_timezone ?? "UTC"}
              onValueChange={(v) => onFieldChange("default_timezone", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {TIMEZONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Who I Work With</Label>
          <p className="text-xs text-zinc-500">Describe the types of clients you work best with.</p>
          <Textarea
            value={value.who_i_work_with ?? ""}
            onChange={(e) => onFieldChange("who_i_work_with", e.target.value)}
            placeholder="e.g. Adults seeking lifestyle transformation, athletes recovering from injuries, busy professionals..."
            rows={3}
            className={fieldClass}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-zinc-300">
            Client Goals I Support {goals.length >= 15 && <span className="text-amber-400">(Max 15 reached)</span>}
          </Label>
          <p className="text-xs text-zinc-500">Select common goals or add your own custom goals. Maximum 15 items.</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_SUGGESTIONS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  goals.includes(goal)
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-white/15 bg-white/5 text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>

          {/* Custom Goal Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add custom goal (e.g., Performance optimization)"
              disabled={goals.length >= 15}
              className={`${fieldClass} flex-1 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            <Button
              type="button"
              onClick={addCustomGoal}
              disabled={!customGoal.trim() || goals.includes(customGoal.trim()) || goals.length >= 15}
              className="shrink-0 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Selected Goals (both common and custom) */}
          {goals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Selected goals ({goals.length}):</p>
              <div className="flex flex-wrap gap-2">
                {goals.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="gap-1 border-emerald-500/40 text-emerald-300"
                  >
                    {g}
                    <button
                      type="button"
                      className="ml-1 text-zinc-400 hover:text-red-400"
                      onClick={() => toggleGoal(g)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Policies ── */}
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Booking Policies</h3>
          <p className="mt-1 text-sm text-zinc-400">Set expectations for clients around response and cancellations.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Response Time</Label>
            <Select
              value={String(value.response_time_hours ?? 24)}
              onValueChange={(v) => onFieldChange("response_time_hours", Number(v))}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {RESPONSE_TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Cancellation Policy</Label>
            <Select
              value={String(value.cancellation_hours ?? 24)}
              onValueChange={(v) => onFieldChange("cancellation_hours", Number(v))}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {CANCELLATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Video Introduction ── */}
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Video Introduction</h3>
          <p className="mt-1 text-sm text-zinc-400">A short intro video helps clients connect before booking.</p>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-zinc-300">
            <Video className="h-4 w-4 text-zinc-500" />
            Video URL
          </Label>
          <Input
            type="url"
            value={value.video_intro_url ?? ""}
            onChange={(e) => onFieldChange("video_intro_url", e.target.value)}
            placeholder="https://youtube.com/... or https://loom.com/..."
            className={fieldClass}
          />
        </div>
      </div>

      {/* ── Social Links ── */}
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Social Links</h3>
          <p className="mt-1 text-sm text-zinc-400">Shown on your public profile to help clients follow your work.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Globe className="h-4 w-4 text-zinc-500" />
              Website
            </Label>
            <Input
              type="url"
              value={(value.social_links?.website) ?? ""}
              onChange={(e) => updateSocialLink("website", e.target.value)}
              placeholder="https://yourwebsite.com"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Instagram className="h-4 w-4 text-zinc-500" />
              Instagram
            </Label>
            <Input
              value={(value.social_links?.instagram) ?? ""}
              onChange={(e) => updateSocialLink("instagram", e.target.value)}
              placeholder="@yourusername"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Linkedin className="h-4 w-4 text-zinc-500" />
              LinkedIn
            </Label>
            <Input
              type="url"
              value={(value.social_links?.linkedin) ?? ""}
              onChange={(e) => updateSocialLink("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Youtube className="h-4 w-4 text-zinc-500" />
              YouTube
            </Label>
            <Input
              type="url"
              value={(value.social_links?.youtube) ?? ""}
              onChange={(e) => updateSocialLink("youtube", e.target.value)}
              placeholder="https://youtube.com/@..."
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Twitter className="h-4 w-4 text-zinc-500" />
              X / Twitter
            </Label>
            <Input
              value={(value.social_links?.twitter) ?? ""}
              onChange={(e) => updateSocialLink("twitter", e.target.value)}
              placeholder="@yourusername"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-300">
              <Link2 className="h-4 w-4 text-zinc-500" />
              TikTok
            </Label>
            <Input
              value={(value.social_links?.tiktok) ?? ""}
              onChange={(e) => updateSocialLink("tiktok", e.target.value)}
              placeholder="@yourusername"
              className={fieldClass}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
