"use client";

import { MapPin, MessageCircle, Phone, Users, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProfessionalProfile } from "@/types/professional";
import { getProfessionalSessions, type ProfessionalSession } from "@/lib/api/sessions";

type BookingPanelProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
  onBookSession: () => void;
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

export function BookingPanel({ professional, onBookConsultation, onBookSession }: BookingPanelProps) {
  const [nextSession, setNextSession] = useState<ProfessionalSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    setLoadingSession(true);
    getProfessionalSessions(professional.username)
      .then((sessions) => {
        if (sessions.length > 0) {
          setNextSession(sessions[0]); // Get the first upcoming session
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSession(false));
  }, [professional.username]);

  // Format date
  const formatSessionDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="lg:col-span-1">
      <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-5 sm:p-7 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="space-y-5">

          <div className="space-y-3">
            <h4 className="text-base font-semibold tracking-tight">Consultation Mode</h4>
            {/* <p className="text-sm text-muted-foreground">Below are the modes of consultation available.</p> */}
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
            
            <Separator className="my-4" />
            
            {/* Session Type Section */}
            {nextSession ? (
              <div className="space-y-3">
                <h4 className="text-base font-semibold tracking-tight">Session Type</h4>
                <div className="flex flex-wrap gap-2.5">
                  {nextSession.session_mode === "online" && (
                    <Badge
                      variant="outline"
                      className="h-9 rounded-full border-emerald-200/80 bg-white/70 px-3 text-xs font-medium text-foreground dark:border-emerald-500/40 dark:bg-emerald-950/30"
                    >
                      <Video size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-300" />
                      Online
                    </Badge>
                  )}
                  {nextSession.session_mode === "in_person" && (
                    <Badge
                      variant="outline"
                      className="h-9 rounded-full border-emerald-200/80 bg-white/70 px-3 text-xs font-medium text-foreground dark:border-emerald-500/40 dark:bg-emerald-950/30"
                    >
                      <MapPin size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-300" />
                      In-person
                    </Badge>
                  )}
                  {nextSession.session_mode === "hybrid" && (
                    <Badge
                      variant="outline"
                      className="h-9 rounded-full border-emerald-200/80 bg-white/70 px-3 text-xs font-medium text-foreground dark:border-emerald-500/40 dark:bg-emerald-950/30"
                    >
                      <Users size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-300" />
                      Hybrid
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Next slot: {formatSessionDate(nextSession.session_date)} at {formatTime(nextSession.start_time)}
                </p>
                <Button
                  variant="default"
                  className="w-full bg-linear-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                  onClick={onBookSession}
                >
                  <Users size={18} className="mr-2" />
                  Book Session
                </Button>
              </div>
            ) : (
              !loadingSession && (
                <div className="space-y-3">
                  <h4 className="text-base font-semibold tracking-tight">Session Type</h4>
                  <p className="text-sm text-muted-foreground">No upcoming sessions available</p>
                  <Button
                    variant="default"
                    className="w-full bg-linear-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                    onClick={onBookSession}
                  >
                    <Users size={18} className="mr-2" />
                    View All Sessions
                  </Button>
                </div>
              )
            )}
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
