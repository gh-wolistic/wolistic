"use client";

import { CalendarDays, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

const ENGAGEMENT_TIPS = [
  {
    icon: "💬",
    tip: "Respond to client messages within 2 hours to boost engagement by 60%",
  },
  {
    icon: "📈",
    tip: "Clients who receive follow-ups are 3x more likely to rebook",
  },
  {
    icon: "⭐",
    tip: "A 5-star rating increases bookings by 40%",
  },
  {
    icon: "📅",
    tip: "Professionals who update availability weekly get 2x more bookings",
  },
  {
    icon: "📸",
    tip: "Complete your profile with photos to increase trust by 50%",
  },
  {
    icon: "🎯",
    tip: "Respond to leads within 1 hour to increase conversion by 70%",
  },
  {
    icon: "✅",
    tip: "Complete credential verification to unlock premium features",
  },
  {
    icon: "🔔",
    tip: "Enable push notifications to never miss a booking request",
  },
];

interface TodayActivityEmptyStateProps {
  onViewWeekAhead?: () => void;
}

export function TodayActivityEmptyState({ onViewWeekAhead }: TodayActivityEmptyStateProps) {
  const [currentTip, setCurrentTip] = useState(ENGAGEMENT_TIPS[0]);

  useEffect(() => {
    // Show a random tip on mount
    const randomTip = ENGAGEMENT_TIPS[Math.floor(Math.random() * ENGAGEMENT_TIPS.length)];
    setCurrentTip(randomTip);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Empty state icon */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl" />
        <CalendarDays className="relative size-16 text-zinc-600" />
      </div>

      {/* Message */}
      <p className="text-zinc-400 mb-6 text-base">No activity yet today</p>

      {/* Engagement Tip */}
      <div className="mb-6 max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
            {currentTip.icon}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="size-3" />
              Pro Tip
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {currentTip.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onViewWeekAhead && (
        <button
          onClick={onViewWeekAhead}
          className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-emerald-400 
            transition-all hover:bg-white/10 hover:text-emerald-300 border border-emerald-400/20
            hover:border-emerald-400/40"
        >
          View Week Ahead →
        </button>
      )}
    </div>
  );
}
