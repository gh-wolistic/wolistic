"use client";

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  loading?: boolean;
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: "border-white/10 bg-slate-900/70",
  primary: "border-cyan-500/30 bg-cyan-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

const iconStyles = {
  default: "text-slate-400",
  primary: "text-cyan-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading,
  variant = "default",
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border-white/10 bg-slate-900/70 p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          {subtitle && <Skeleton className="h-3 w-20" />}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 backdrop-blur-xl transition-all hover:scale-[1.02]", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn("rounded-lg bg-white/5 p-3", iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
