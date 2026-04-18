"use client";

import { Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface TodayActivity {
  id: string;
  activity_type: string;
  timestamp: string;
  icon: string;
  title: string;
  description: string | null;
  action_url: string | null;
  priority: "high" | "normal" | "low";
  metadata?: Record<string, any> | null;
}

interface TodayActivityCardProps {
  activity: TodayActivity;
  onActionClick?: (url: string) => void;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return activityTime.toLocaleTimeString("en-IN", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });
}

function getInitials(title: string, metadata?: Record<string, any> | null): string {
  if (metadata?.client_name) {
    return metadata.client_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  }
  if (metadata?.reviewer_name) {
    return metadata.reviewer_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  }
  if (metadata?.lead_name) {
    return metadata.lead_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  }
  // Extract from title as fallback
  const words = title.split(" ");
  if (words.length >= 3 && (words[0] === "New" || words[0] === "New")) {
    const nameWords = words.slice(2);
    return nameWords.slice(0, 2).map(w => w[0]).join("").toUpperCase() || "??";
  }
  return title.slice(0, 2).toUpperCase();
}

export function TodayActivityCard({ activity, onActionClick }: TodayActivityCardProps) {
  const priorityStyles = {
    high: "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 hover:border-emerald-400/50 hover:shadow-emerald-500/20",
    normal: "border-white/10 bg-white/5 hover:border-white/20 hover:shadow-white/10",
    low: "border-zinc-700/50 bg-zinc-900/20 hover:border-zinc-600/50",
  };

  const showAvatar = activity.activity_type === "booking_received" 
    || activity.activity_type === "review_received" 
    || activity.activity_type === "enrollment_received"
    || activity.activity_type === "client_added"
    || activity.activity_type === "lead_received";

  return (
    <div
      className={`group relative rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
        priorityStyles[activity.priority] || priorityStyles.normal
      } ${activity.action_url ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (activity.action_url && onActionClick) {
          onActionClick(activity.action_url);
        }
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon or Avatar */}
        {showAvatar ? (
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-emerald-500/20 text-xs font-semibold text-emerald-400">
              {getInitials(activity.title, activity.metadata)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg">
            {activity.icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-white text-sm leading-snug">
              {activity.title}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
              <Clock className="size-3" />
              {formatTimeAgo(activity.timestamp)}
            </div>
          </div>

          {activity.description && (
            <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
              {activity.description}
            </p>
          )}

          {/* Priority Badge */}
          {activity.priority === "high" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5">
              <div className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Important</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      {activity.action_url && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="text-emerald-400">→</div>
        </div>
      )}
    </div>
  );
}
