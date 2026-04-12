"use client";

import {
  AlertCircle,
  BookOpen,
  Calendar,
  Globe,
  Languages,
  MapPin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

interface ProfileStudioSidePanelProps {
  editorData: ProfessionalEditorPayload;
  username: string;
  initials: string;
  completion: number;
}

export function ProfileStudioSidePanel({
  editorData,
  username,
  initials,
  completion,
}: ProfileStudioSidePanelProps) {
  const activeServices = editorData.services.filter((s) => s.is_active).length;
  const availabilityCount = editorData.availability_slots.length;
  const languageCount = editorData.languages.length;

  return (
    <div className="space-y-4">
      {/* Cover & Avatar */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative h-20 bg-linear-to-br from-emerald-500/30 via-cyan-500/20 to-sky-500/10">
          {editorData.cover_image_url && (
            <Image
              src={editorData.cover_image_url}
              alt="Cover"
              fill
              className="object-cover"
              sizes="300px"
            />
          )}
        </div>
        <Avatar className="absolute -bottom-6 left-4 size-16 border-2 border-emerald-500/60 ring-2 ring-[#0d1526]">
          <AvatarImage src={editorData.profile_image_url || undefined} alt="Profile" />
          <AvatarFallback className="bg-emerald-500/20 text-lg font-semibold text-emerald-400">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Profile Info */}
      <div className="mt-8 space-y-2">
        <div>
          <h3 className="font-semibold text-white">{editorData.username || username}</h3>
          {editorData.username && (
            <p className="text-sm text-zinc-400">@{editorData.username}</p>
          )}
        </div>
        {(editorData.specialization || editorData.location) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {editorData.specialization && <span>{editorData.specialization}</span>}
            {editorData.specialization && editorData.location && <span>•</span>}
            {editorData.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" /> {editorData.location}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-white/8" />

      {/* Profile Completeness */}
      <div className="space-y-3 rounded-xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Profile Complete</span>
          <span className="text-lg font-semibold text-white">{completion}%</span>
        </div>
        <Progress
          value={completion}
          className="h-2 bg-white/10 *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-emerald-500 *:data-[slot=progress-indicator]:to-cyan-500"
        />
        {completion < 80 && (
          <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-400" />
            <p className="text-xs text-orange-300">
              Fill in all sections to improve discoverability
            </p>
          </div>
        )}
      </div>

      <div className="h-px bg-white/8" />

      {/* Quick Stats */}
      <div className="space-y-3 rounded-xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Snapshot</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Sparkles className="size-4 text-emerald-400" /> Active Services
            </span>
            <span className="font-semibold text-white">{activeServices}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Calendar className="size-4 text-cyan-400" /> Availability Slots
            </span>
            <span className="font-semibold text-white">{availabilityCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Languages className="size-4 text-violet-400" /> Languages
            </span>
            <span className="font-semibold text-white">{languageCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <BookOpen className="size-4 text-amber-400" /> Certifications
            </span>
            <span className="font-semibold text-white">{editorData.certifications.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Globe className="size-4 text-rose-400" /> Expertise Areas
            </span>
            <span className="font-semibold text-white">{editorData.expertise_areas.length}</span>
          </div>
        </div>
      </div>

      {/* View Public Profile */}
      {editorData.username && (
        <>
          <div className="h-px bg-white/8" />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/${editorData.username}`} target="_blank" rel="noopener noreferrer">
              View Public Profile
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
