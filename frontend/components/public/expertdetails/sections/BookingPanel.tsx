"use client";

import { MapPin, MessageCircle, Phone, Users, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfessionalProfile } from "@/types/professional";

type BookingPanelProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
};

function getSessionTypeVisual(sessionType: string) {
  const normalized = sessionType.trim().toLowerCase();
  const normalizedWords = normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (
    normalizedWords.includes("in person")
    || normalizedWords.includes("inperson")
    || normalizedWords.includes("offline")
    || normalizedWords.includes("onsite")
  ) {
    return { label: "In-person", icon: MapPin };
  }

  if (normalizedWords.includes("video") || normalizedWords.includes("online") || normalizedWords.includes("virtual")) {
    return { label: "Video call", icon: Video };
  }

  if (
    normalizedWords.includes("phone")
    || normalizedWords.includes("audio")
    || normalizedWords.includes("voice")
  ) {
    return { label: "Phone", icon: Phone };
  }

  if (normalizedWords.includes("chat") || normalizedWords.includes("message") || normalizedWords.includes("text")) {
    return { label: "Chat", icon: MessageCircle };
  }

  if (normalizedWords.includes("group")) {
    return { label: "Group", icon: Users };
  }

  return { label: sessionType, icon: Video };
}

export function BookingPanel({ professional, onBookConsultation }: BookingPanelProps) {

  return (
    <div className="lg:col-span-1">
      <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-5 sm:p-7 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="space-y-5">

          <div className="space-y-3">
            <h4 className="text-base font-semibold tracking-tight">Session Types</h4>
            <p className="text-sm text-muted-foreground">Choose your preferred consultation format.</p>
            <div className="flex flex-wrap gap-2.5">
              {professional.sessionTypes.map((type) => {
                const visual = getSessionTypeVisual(type);
                const Icon = visual.icon;

                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className="h-9 rounded-full border-emerald-200/80 bg-white/70 px-3 text-xs font-medium text-foreground dark:border-emerald-500/40 dark:bg-emerald-950/30"
                  >
                    <Icon size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-300" />
                    {visual.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              onClick={onBookConsultation}
            >
              Book Consultation
            </Button>
            <Button variant="outline" className="w-full">
              <MessageCircle size={18} className="mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
