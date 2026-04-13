"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Briefcase,
  Clock3,
  Languages,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ClientListManager } from "@/components/dashboard/partner/ClientListManager";
import { ReviewResponseManager } from "@/components/dashboard/partner/ReviewResponseManager";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import type { UserSubtype } from "@/components/onboarding/types";
import { getPartnerDashboardData } from "@/components/dashboard/partner/partnerApi";
import type { PartnerDashboardAggregate } from "@/components/dashboard/partner/partnerApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfessionalAvailabilityInput, ProfessionalServiceInput } from "@/types/professional-editor";

type PartnerSubtype = Exclude<UserSubtype, "client">;

type PartnerViewConfig = {
  roleLabel: string;
  title: string;
  summary: string;
  accentClass: string;
};

const partnerViewConfigBySubtype: Record<PartnerSubtype, PartnerViewConfig> = {
  body_expert: {
    roleLabel: "Partner · Body Expert",
    title: "Body Expert Console",
    summary: "Manage sessions, monitor engagement, and grow your movement-focused practice.",
    accentClass: "from-emerald-500/25 via-cyan-500/20 to-sky-500/20",
  },
  mind_expert: {
    roleLabel: "Partner · Mind Expert",
    title: "Mind Expert Console",
    summary: "Track care continuity and shape your client support rhythm.",
    accentClass: "from-indigo-500/25 via-violet-500/20 to-fuchsia-500/20",
  },
  diet_expert: {
    roleLabel: "Partner · Diet Expert",
    title: "Diet Expert Console",
    summary: "Coordinate nutrition services and keep your offerings in sync.",
    accentClass: "from-lime-500/25 via-emerald-500/20 to-teal-500/20",
  },
  mutiple_roles: {
    roleLabel: "Partner · Multiple Roles",
    title: "Multi-Role Console",
    summary: "Run one workspace for all your roles and service mixes.",
    accentClass: "from-amber-500/25 via-orange-500/20 to-rose-500/20",
  },
  brand: {
    roleLabel: "Partner · Brand",
    title: "Brand Dashboard",
    summary: "Manage your brand-facing profile, services, and operational readiness.",
    accentClass: "from-blue-500/25 via-cyan-500/20 to-teal-500/20",
  },
  influencer: {
    roleLabel: "Partner · Influencer",
    title: "Influencer Dashboard",
    summary: "Keep your public profile and service experience clean and discoverable.",
    accentClass: "from-pink-500/25 via-rose-500/20 to-orange-500/20",
  },
};

type PartnerDashboardPageProps = {
  subtype: PartnerSubtype;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const dayLabelByIndex: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function toTimeLabel(value: string): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 5);
}

function serviceModeLabel(value: string): string {
  const mode = value.trim().toLowerCase();
  if (mode === "online") return "Online";
  if (mode === "offline") return "Offline";
  if (mode === "hybrid") return "Hybrid";
  return value;
}

function currencyLabel(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PartnerDashboardPage({ subtype }: PartnerDashboardPageProps) {
  const view = partnerViewConfigBySubtype[subtype];
  const { accessToken, status, user } = useAuthSession();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [services, setServices] = useState<ProfessionalServiceInput[]>([]);
  const [availability, setAvailability] = useState<ProfessionalAvailabilityInput[]>([]);
  const [membershipTier, setMembershipTier] = useState<string>("");
  const [specialization, setSpecialization] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [languageCount, setLanguageCount] = useState<string>("");
  const [certificationCount, setCertificationCount] = useState<string>("");
  const [bookingQuestionsCount, setBookingQuestionsCount] = useState<string>("");
  const [aggregate, setAggregate] = useState<PartnerDashboardAggregate | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !user) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        if (!active) {
          return;
        }
        setLoadState("loading");
        setErrorMessage("");

        const data = await getPartnerDashboardData(accessToken);
        if (!active) {
          return;
        }

        const editor = data.editor;
        setAggregate(data.aggregate);
        setServices(editor.services ?? []);
        setAvailability(editor.availability_slots ?? []);
        setMembershipTier(data.aggregate?.overview.membership_tier ?? editor.membership_tier ?? "");
        setSpecialization(data.aggregate?.overview.specialization ?? editor.specialization ?? "");
        setLocation(data.aggregate?.overview.location ?? editor.location ?? "");
        setLanguageCount(
          data.aggregate
            ? String(data.aggregate.overview.languages_total)
            : Array.isArray(editor.languages)
              ? String(editor.languages.length)
              : "",
        );
        setCertificationCount(
          data.aggregate
            ? String(data.aggregate.overview.certifications_total)
            : Array.isArray(editor.certifications)
              ? String(editor.certifications.length)
              : "",
        );
        setBookingQuestionsCount(
          data.aggregate
            ? String(data.aggregate.metrics.booking_questions_total)
            : Array.isArray(editor.booking_question_templates)
              ? String(editor.booking_question_templates.length)
              : "",
        );
        setLoadState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load partner dashboard data.");
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken, status, user]);

  const activeServices = useMemo(() => services.filter((service) => service.is_active), [services]);

  const totalServices = aggregate
    ? String(aggregate.metrics.services_total)
    : services.length > 0
      ? String(services.length)
      : services.length === 0
        ? "0"
        : "";
  const totalActiveServices = aggregate
    ? String(aggregate.metrics.active_services_total)
    : activeServices.length > 0
      ? String(activeServices.length)
      : services.length
        ? "0"
        : "";
  const totalAvailability = aggregate
    ? String(aggregate.metrics.availability_slots_total)
    : availability.length > 0
      ? String(availability.length)
      : availability.length === 0
        ? "0"
        : "";
  const totalBookings = aggregate ? String(aggregate.metrics.bookings_total) : "";
  const totalUpcomingBookings = aggregate ? String(aggregate.metrics.upcoming_bookings_total) : "";
  const totalRevenue = aggregate ? currencyLabel(aggregate.metrics.revenue_total) : "";
  const totalRating = aggregate
    ? `${aggregate.metrics.rating_avg.toFixed(1)} (${aggregate.metrics.rating_count})`
    : "";

  return (
    <section className="space-y-6">
      <div
        className={`relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl md:p-8 ${view.accentClass}`}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <Badge className="bg-white/20 text-white backdrop-blur-sm">{view.roleLabel}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{view.title}</h1>
            <p className="text-sm text-zinc-100/90 md:text-base">{view.summary}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {loadState === "loading" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      )}

      {loadState === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Partner data unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loadState === "ready" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Services" value={totalServices} icon={<Briefcase className="h-4 w-4" />} />
            <MetricCard
              label="Active Services"
              value={totalActiveServices}
              icon={<BadgeCheck className="h-4 w-4" />}
            />
            <MetricCard
              label="Availability Slots"
              value={totalAvailability}
              icon={<Clock3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Booking Questions"
              value={bookingQuestionsCount}
              icon={<Activity className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Bookings" value={totalBookings} icon={<Activity className="h-4 w-4" />} />
            <MetricCard
              label="Upcoming"
              value={totalUpcomingBookings}
              icon={<Clock3 className="h-4 w-4" />}
            />
            <MetricCard label="Revenue" value={totalRevenue} icon={<BadgeCheck className="h-4 w-4" />} />
            <MetricCard label="Rating" value={totalRating} icon={<Sparkles className="h-4 w-4" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm lg:col-span-1">
              <CardContent className="space-y-4 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Profile Snapshot</h2>
                <DetailRow icon={<ShieldCheck className="h-4 w-4" />} label="Membership" value={membershipTier} />
                <DetailRow icon={<Layers className="h-4 w-4" />} label="Specialization" value={specialization} />
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={location} />
                <DetailRow icon={<Languages className="h-4 w-4" />} label="Languages" value={languageCount} />
                <DetailRow
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Certifications"
                  value={certificationCount}
                />
              </CardContent>
            </Card>

            <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm lg:col-span-2">
              <CardContent className="space-y-3 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Active Services</h2>
                {activeServices.length === 0 && <p className="text-sm text-zinc-500" />}
                {activeServices.slice(0, 6).map((service) => (
                  <div
                    key={`${service.name}-${service.mode}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2"
                  >
                    <div className="min-w-[16rem] flex-1">
                      <p className="text-sm font-medium text-zinc-900">{service.name}</p>
                      <p className="text-xs text-zinc-600">{service.short_brief}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{serviceModeLabel(service.mode)}</Badge>
                      <span className="text-sm font-semibold text-zinc-900">{currencyLabel(service.price)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm">
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Availability</h2>
              {availability.length === 0 && <p className="text-sm text-zinc-500" />}
              {availability.slice(0, 8).map((slot, index) => {
                const dayLabel = dayLabelByIndex[slot.day_of_week] ?? "";
                return (
                  <div
                    key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}-${index}`}
                    className="grid gap-1 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm text-zinc-800 md:grid-cols-3"
                  >
                    <span>{dayLabel}</span>
                    <span>
                      {toTimeLabel(slot.start_time)}
                      {slot.start_time && slot.end_time ? " - " : ""}
                      {toTimeLabel(slot.end_time)}
                    </span>
                    <span>{slot.timezone}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm">
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent Reviews</h2>
              {(aggregate?.recent_reviews ?? []).length === 0 && <p className="text-sm text-zinc-500" />}
              {(aggregate?.recent_reviews ?? []).map((review) => (
                <div key={review.id} className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">{review.reviewer_name}</p>
                    <Badge variant="outline">{review.rating}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">{review.comment ?? ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <ClientListManager />

          <ReviewResponseManager membershipTier={membershipTier} />
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
          <span>{icon}</span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_8rem_1fr] items-center gap-2 text-sm">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-zinc-600">{label}</span>
      <span className="truncate text-zinc-900">{value}</span>
    </div>
  );
}
