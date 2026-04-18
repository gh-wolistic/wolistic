"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfessionalSession } from "@/lib/api/sessions";

export interface SessionCardProps {
  session: ProfessionalSession;
  variant?: "light" | "dark";
  onClick?: () => void;
  onBookClick?: () => void;
  showBookButton?: boolean;
}

export function SessionCard({
  session,
  variant = "light",
  onClick,
  onBookClick,
  showBookButton = true,
}: SessionCardProps) {
  const isDark = variant === "dark";

  // Format date
  const sessionDate = new Date(session.session_date);
  const dateStr = sessionDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Calculate spots
  const spotsLeft = session.capacity - session.enrolled_count;

  // Category colors
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "mind":
        return "from-violet-500 to-purple-600";
      case "body":
        return "from-emerald-500 to-green-600";
      case "nutrition":
        return "from-amber-500 to-orange-600";
      case "lifestyle":
        return "from-sky-500 to-blue-600";
      default:
        return "from-zinc-500 to-zinc-600";
    }
  };

  const cardClasses = isDark
    ? "group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all"
    : "rounded-xl border border-border/60 bg-muted/10 p-4 transition-shadow hover:shadow-md";

  const titleClasses = isDark
    ? "text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors"
    : "text-base font-semibold text-foreground sm:text-lg";

  const textClasses = isDark ? "text-zinc-400" : "text-muted-foreground";
  const iconColor = isDark ? "" : "text-emerald-600";

  const availabilityColor = session.is_sold_out
    ? isDark
      ? "text-rose-400"
      : "text-red-600"
    : spotsLeft <= 5 && spotsLeft > 0
      ? isDark
        ? "text-amber-400"
        : "text-amber-600"
      : isDark
        ? "text-emerald-400"
        : "text-emerald-600";

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookClick) {
      onBookClick();
    }
  };

  return (
    <div
      className={`${cardClasses} ${onClick ? "cursor-pointer" : ""}`}
      onClick={handleCardClick}
    >
      {/* Category & Display Term Badges */}
      {isDark && (
        <div className="flex items-center justify-between mb-4">
          <Badge
            className={`bg-linear-to-r ${getCategoryColor(session.category)} text-white border-0`}
          >
            {session.category}
          </Badge>
          <Badge className="bg-white/10 text-zinc-300 border-white/20 text-xs">
            {session.display_term || "session"}
          </Badge>
        </div>
      )}

      {/* Dark variant: Category & Display Term Badges shown above */}
      {/* Light variant: Horizontal layout matching consultation booking */}
      {!isDark ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left side: Session details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={titleClasses}>{session.title}</h3>
              <Badge variant="outline" className="text-xs">
                {session.display_term || "session"}
              </Badge>
              {session.session_mode === "online" && (
                <Badge variant="outline" className="text-xs bg-sky-50 border-sky-300 text-sky-700">
                  Online (Video)
                </Badge>
              )}
              {session.session_mode === "in_person" && (
                <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-300 text-emerald-700">
                  In-Person
                </Badge>
              )}
              {session.session_mode === "hybrid" && (
                <Badge variant="outline" className="text-xs bg-violet-50 border-violet-300 text-violet-700">
                  Hybrid (Both)
                </Badge>
              )}
            </div>

            {/* Date & Time */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={16} className={iconColor} />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className={iconColor} />
                <span>
                  {formatTime(session.start_time)} ({session.duration_minutes} min)
                </span>
              </div>
            </div>

            {/* Location */}
            {session.work_location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
                <div>
                  <p className="font-medium text-foreground">{session.work_location.name}</p>
                  {session.work_location.address && (
                    <p className="text-xs">{session.work_location.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Capacity */}
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className={availabilityColor} />
              <span className={availabilityColor}>
                {session.is_sold_out
                  ? "Sold Out"
                  : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </span>
            </div>
          </div>

          {/* Right side: Price & Book button (matching consultation layout) */}
          {showBookButton && (
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold text-emerald-600">₹{session.price.toFixed(0)}</p>
                <p className="text-sm font-medium text-muted-foreground">per person</p>
              </div>
              {session.is_sold_out ? (
                <Badge variant="destructive" className="shrink-0">
                  Sold Out
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="shrink-0 bg-emerald-600 shadow-sm hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20"
                  onClick={handleBookClick}
                >
                  Book
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Dark variant: Original vertical layout */
        <>
          <h3 className={titleClasses}>{session.title}</h3>
          <p className="text-2xl font-bold text-emerald-400 mb-4">₹{session.price.toFixed(0)}</p>

          <div className="space-y-2 mb-4">
            {/* Date & Time */}
            <div className="flex flex-col gap-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <Calendar size={16} className={iconColor} />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className={iconColor} />
                <span>
                  {formatTime(session.start_time)} ({session.duration_minutes} min)
                </span>
              </div>
            </div>

            {/* Location */}
            {session.work_location && (
              <div className="flex items-start gap-2 text-sm text-zinc-300">
                <MapPin size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
                <div>
                  <p className="text-white truncate">{session.work_location.name}</p>
                </div>
              </div>
            )}

            {/* Capacity */}
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className={availabilityColor} />
              <span className={availabilityColor}>
                {session.is_sold_out
                  ? "Sold Out"
                  : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Dark variant: CTA button */}
      {isDark && showBookButton && (
        <Button
          className={`w-full ${
            session.is_sold_out
              ? "bg-zinc-500/20 border border-zinc-400/30 text-zinc-400 cursor-not-allowed"
              : "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          }`}
          disabled={session.is_sold_out}
          onClick={handleBookClick}
        >
          {session.is_sold_out ? "Sold Out" : "View Details"}
        </Button>
      )}
    </div>
  );
}
