import { Crown, Star } from "lucide-react";

import { cn } from "./utils";

type RatingChipProps = {
  value: string | number;
  className?: string;
  textClassName?: string;
};

type StatusChipProps = {
  label: string;
  tone?: "featured" | "certified" | "elite";
  className?: string;
};

type PresenceChipProps = {
  isOnline: boolean;
  className?: string;
};

export function RatingChip({ value, className, textClassName }: RatingChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 backdrop-blur-sm",
        className,
      )}
    >
      <Star size={14} className="text-amber-500 fill-amber-500" />
      <span className={cn("text-xs font-medium", textClassName)}>{value}</span>
    </span>
  );
}

export function StatusChip({ label, tone = "featured", className }: StatusChipProps) {
  const toneClassName =
    tone === "certified"
      ? "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/12 dark:text-cyan-300"
      : tone === "elite"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm",
        toneClassName,
        className,
      )}
    >
      {tone === "elite" ? <Crown size={12} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function PresenceChip({ isOnline, className }: PresenceChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {isOnline ? (
        <>
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Online
        </>
      ) : (
        "Recently Active"
      )}
    </span>
  );
}
