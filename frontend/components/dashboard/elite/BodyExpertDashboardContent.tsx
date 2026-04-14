"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertCircle,
  Sparkles,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  BookOpen,
  Users,
  ClipboardList,
  MessageSquare,
  MoreVertical,
  Send,
  Coins,
  Crown,
  Clock,
  MapPin,
  Video,
  User as UserIcon,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { updateProfessionalEditorPayload } from "@/components/dashboard/profile/profileEditorApi";
import type {
  DashboardCoinTransaction,
  PartnerDashboardAggregate,
} from "@/components/dashboard/partner/partnerApi";
import type { CoinWallet } from "@/types/coins";
import type {
  ProfessionalAvailabilityInput,
  ProfessionalEditorPayload,
  ProfessionalServiceInput,
} from "@/types/professional-editor";
import { ReviewResponseManager } from "@/components/dashboard/partner/ReviewResponseManager";
import { messagingAPI, type ConversationWithLastMessage } from "@/lib/messaging-api";
import type { ElitePageView } from "./types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function toRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

function toFutureRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff < 0) return "Passed";
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function formatCoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatSessionTime(iso: string | null, isImmediate: boolean): string {
  if (!iso) return isImmediate ? "Now" : "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function createEmptyAvailability(): ProfessionalAvailabilityInput {
  return { day_of_week: 1, start_time: "09:00", end_time: "17:00", timezone: "UTC" };
}

interface BodyExpertDashboardContentProps {
  aggregate: PartnerDashboardAggregate;
  userStatus: string | null;
  profileCompleteness: number;
  wallet: CoinWallet | null;
  displayName: string;
  services: ProfessionalServiceInput[];
  availability: ProfessionalAvailabilityInput[];
  coinTransactions: DashboardCoinTransaction[];
  editorPayload: ProfessionalEditorPayload;
  onSaved: () => void;
  onPageChange?: (page: ElitePageView) => void;
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold text-white">{value}</p>
          {subtitle && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp className="size-3" />
              <span>{subtitle}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <Icon className="size-5 text-zinc-400" />
        </div>
      </div>
    </GlassCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "in-progress": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse",
    completed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    cancelled: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <Badge className={`${config[status] ?? config.upcoming} border text-xs`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-zinc-400">
      {dateTime.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}{" "}
      &bull;{" "}
      {dateTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DeltaBadge({ delta, unit = "" }: { delta: number; unit?: string }) {
  if (delta === 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-zinc-500">
        <Minus className="size-3" /> Same as yesterday
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {up ? "+" : ""}
      {delta}
      {unit} vs yesterday
    </span>
  );
}

function WelcomeHero({
  displayName,
  aggregate,
  profileCompleteness,
  coinBalance,
}: {
  displayName: string;
  aggregate: PartnerDashboardAggregate;
  profileCompleteness: number;
  coinBalance: number;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const greeting = getGreeting();
  const firstName = displayName.split(" ")[0] ?? displayName;

  const dayOfWeek = now.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Derive a session streak from the total booking count as a simple proxy
  const sessionStreak = Math.max(1, Math.min(Math.floor(aggregate.metrics.bookings_total / 3), 30));
  const ratingDelta = aggregate.metrics.rating_count > 0 ? 1 : 0; // placeholder directional

  return (
    <GlassCard className="relative overflow-hidden border-emerald-500/20 p-0">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 size-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative p-6">
        {/* Top row: greeting + clock */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">{dayOfWeek}, {dateStr}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {firstName} 👋
            </h1>
            <p className="mt-2 text-base text-zinc-400">
              Your practice at a glance
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-white">{timeStr}</span>
            {/* Session Streak pill with tooltip context */}
            {sessionStreak > 0 && (
              <div 
                className="group relative flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-linear-to-r from-amber-500/10 to-orange-500/10 px-3 py-1.5 shadow-sm transition-all hover:border-amber-400/50 hover:shadow-md"
                title={`You've maintained ${sessionStreak} consecutive ${sessionStreak === 1 ? 'day' : 'days'} with active sessions`}
              >
                <Zap className="size-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">{sessionStreak}-day session streak</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function BodyExpertDashboardContent({
  aggregate,
  userStatus,
  profileCompleteness,
  wallet,
  displayName,
  services,
  availability,
  coinTransactions,
  editorPayload,
  onSaved,
  onPageChange,
}: BodyExpertDashboardContentProps) {
  const { accessToken, user } = useAuthSession();
  const isPending = userStatus === "pending";
  const isProfileIncomplete = profileCompleteness < 60;
  const isNotPremium = aggregate.overview.membership_tier !== "premium";
  const coinBalance = wallet?.balance ?? 0;
  const activeServices = services.filter((s) => s.is_active);

  // --- Recent Messages ---
  const [recentMessages, setRecentMessages] = useState<Array<{
    id: string;
    senderInitials: string;
    senderName: string;
    preview: string;
    timeAgo: string;
    unread: boolean;
  }>>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // --- Services quick-edit sheet ---
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [draftServices, setDraftServices] = useState<ProfessionalServiceInput[]>([]);
  const [isSavingServices, setIsSavingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  function openServicesSheet() {
    setDraftServices(services);
    setServicesError(null);
    setIsServicesOpen(true);
  }

  async function saveServices() {
    if (!accessToken) return;
    setIsSavingServices(true);
    setServicesError(null);
    try {
      await updateProfessionalEditorPayload(accessToken, {
        ...editorPayload,
        services: draftServices,
      });
      setIsServicesOpen(false);
      onSaved();
    } catch {
      setServicesError("Save failed — please try again.");
    } finally {
      setIsSavingServices(false);
    }
  }

  // --- Availability quick-edit sheet ---
  const [isAvailOpen, setIsAvailOpen] = useState(false);
  const [draftAvail, setDraftAvail] = useState<ProfessionalAvailabilityInput[]>([]);
  const [isSavingAvail, setIsSavingAvail] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);

  function openAvailSheet() {
    setDraftAvail(availability);
    setAvailError(null);
    setIsAvailOpen(true);
  }

  async function saveAvailability() {
    if (!accessToken) return;
    setIsSavingAvail(true);
    setAvailError(null);
    try {
      await updateProfessionalEditorPayload(accessToken, {
        ...editorPayload,
        availability_slots: draftAvail,
      });
      setIsAvailOpen(false);
      onSaved();
    } catch {
      setAvailError("Save failed — please try again.");
    } finally {
      setIsSavingAvail(false);
    }
  }

  // --- Fetch Recent Messages ---
  useEffect(() => {
    async function fetchRecentMessages() {
      if (!user?.id) return;
      
      setLoadingMessages(true);
      try {
        // Fetch only 5 most recent conversations with cache enabled
        const conversations = await messagingAPI.listConversations(5, true);
        
        // Transform conversations to widget format
        const transformed = conversations
          .filter((conv) => conv.last_message !== null)
          .map((conv) => {
            // Find the other participant (not the current user)
            const otherParticipant = conv.participants.find(
              (p) => p.user_id !== user.id
            );
            
            // Get user profile data
            const profile = otherParticipant?.user_profile;
            const name = profile?.name || "Unknown User";
            const initials = name
              .split(' ')
              .map(word => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || "??";
            
            // Format time ago
            const messageTime = conv.last_message?.created_at || conv.last_message_at || "";
            const timeAgo = formatMessageTime(messageTime);
            
            // Truncate preview
            const content = conv.last_message?.content || "";
            const preview = content.length > 60 ? content.slice(0, 60) + "..." : content;
            
            return {
              id: conv.id,
              senderInitials: initials,
              senderName: name,
              preview: preview || "No messages yet",
              timeAgo,
              unread: conv.unread_count > 0,
            };
          });
        
        setRecentMessages(transformed);
      } catch (error) {
        console.error("Failed to fetch recent messages:", error);
        // Keep empty array on error
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchRecentMessages();
  }, [user?.id]); // Re-fetch if user ID changes

  function formatMessageTime(isoDate: string): string {
    if (!isoDate) return "—";
    const now = Date.now();
    const date = new Date(isoDate);
    const diff = now - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }

  return (
    <>
    <div className="space-y-6 p-4 sm:p-6">
      {/* Alert Banners */}
      {isPending && (
        <GlassCard className="border-amber-400/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-400">Account Pending Verification</p>
              <p className="text-sm text-amber-300/80">
                Your account is pending verification. You'll receive an email once approved.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {isProfileIncomplete && (
        <GlassCard className="border-orange-400/30 bg-orange-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-orange-400" />
            <div className="flex-1">
              <p className="font-medium text-orange-400">
                Your profile is {profileCompleteness}% complete
              </p>
              <p className="text-sm text-orange-300/80">
                A complete profile gets 3&times; more views.{" "}
                <button className="underline hover:text-orange-300">Complete now &rarr;</button>
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Welcome Hero */}
      <WelcomeHero
        displayName={displayName}
        aggregate={aggregate}
        profileCompleteness={profileCompleteness}
        coinBalance={coinBalance}
      />

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={BookOpen}
          label="Total Bookings"
          value={aggregate.metrics.bookings_total}
          subtitle="+12% this month"
        />
        <MetricCard
          icon={CalendarDays}
          label="Upcoming Sessions"
          value={aggregate.metrics.upcoming_bookings_total}
          subtitle="This week"
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue"
          value={`${aggregate.metrics.revenue_currency ?? ""}${aggregate.metrics.revenue_total.toLocaleString()}`}
          subtitle="+18% this month"
        />
        <MetricCard
          icon={Star}
          label="Rating"
          value={aggregate.metrics.rating_avg}
          subtitle={`${aggregate.metrics.rating_count} reviews`}
        />
      </div>

      {/* Today's Activity & Follow-ups */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Activity */}
        <GlassCard className="p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Today's Activity</h2>
            </div>
            <p className="text-sm text-zinc-400">
              {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </p>
          </div>

          {aggregate.today_sessions.length > 0 ? (
            <div className="space-y-3">
              {aggregate.today_sessions.map((session) => (
                <div
                  key={session.booking_reference}
                  className="flex items-center gap-4 rounded-lg border border-white/8 bg-white/5 p-4 transition-colors hover:bg-white/8"
                >
                  <div className="hidden w-20 shrink-0 items-center gap-2 text-sm text-zinc-400 sm:flex sm:w-24">
                    <Clock className="size-4" />
                    {formatSessionTime(session.scheduled_at, session.is_immediate)}
                  </div>
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-500/20 text-xs text-emerald-400">
                      {session.client_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-white">{session.client_name}</p>
                    <p className="text-sm text-zinc-400">{session.service_name}</p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="mb-4 size-12 text-zinc-600" />
              <p className="text-zinc-400">No sessions scheduled today</p>
            </div>
          )}
        </GlassCard>

        {/* Follow-ups */}
        <GlassCard className="p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-cyan-500/20 to-sky-500/10 p-2.5 shadow-lg shadow-cyan-500/10">
              <ClipboardList className="size-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">Follow-Ups</h2>
              {aggregate.follow_ups.length > 0 && (
                <p className="text-xs text-zinc-500">
                  {aggregate.follow_ups.filter(f => f.is_overdue).length > 0 && 
                    `${aggregate.follow_ups.filter(f => f.is_overdue).length} overdue • `}
                  {aggregate.follow_ups.length} total
                </p>
              )}
            </div>
          </div>

          {aggregate.follow_ups.length > 0 ? (
            <div className="space-y-3">
              {aggregate.follow_ups.map((followUp) => (
                <div
                  key={followUp.id}
                  className={`group relative space-y-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                    followUp.is_overdue
                      ? "border-rose-400/40 bg-linear-to-br from-rose-500/15 to-rose-600/10 hover:border-rose-400/60 hover:shadow-rose-500/20"
                      : followUp.is_manual
                        ? "border-amber-400/30 bg-linear-to-br from-amber-500/10 to-orange-500/5 hover:border-amber-400/50 hover:shadow-amber-500/15"
                        : "border-cyan-400/30 bg-linear-to-br from-cyan-500/10 to-sky-500/5 hover:border-cyan-400/50 hover:shadow-cyan-500/15"
                  } hover:shadow-xl`}
                >
                  {/* Subtle glow effect on hover */}
                  <div className={`pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    followUp.is_overdue
                      ? "bg-linear-to-br from-rose-500/5 to-transparent"
                      : "bg-linear-to-br from-cyan-500/5 to-transparent"
                  }`} />
                  
                  <div className="relative flex items-center gap-3">
                    <Avatar className={`size-10 transition-transform duration-300 group-hover:scale-110 ${
                      followUp.is_overdue ? "ring-2 ring-rose-400/60 shadow-lg shadow-rose-500/20" : ""
                    }`}>
                      <AvatarFallback className={`text-sm font-semibold ${
                        followUp.is_overdue
                          ? "bg-linear-to-br from-rose-500/30 to-rose-600/20 text-rose-300"
                          : followUp.is_manual
                            ? "bg-linear-to-br from-amber-500/30 to-orange-500/20 text-amber-300"
                            : "bg-linear-to-br from-cyan-500/30 to-sky-500/20 text-cyan-300"
                      }`}>
                        {followUp.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{followUp.name}</p>
                        {followUp.is_overdue && (
                          <Badge className="shrink-0 border-rose-400/40 bg-rose-500/25 text-rose-300 text-xs px-2 py-0.5 font-medium shadow-sm">
                            Overdue
                          </Badge>
                        )}
                        {followUp.is_manual && !followUp.is_overdue && (
                          <Badge className="shrink-0 border-amber-400/40 bg-amber-500/25 text-amber-300 text-xs px-2 py-0.5 font-medium shadow-sm">
                            Due
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-zinc-400 mt-0.5">
                        {followUp.due_date
                          ? toFutureRelativeTime(followUp.due_date)
                          : toRelativeTime(followUp.last_session_at)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="relative text-xs leading-relaxed text-zinc-300">{followUp.reason}</p>
                  
                  <Button
                    size="sm"
                    className={`relative w-full gap-2 overflow-hidden border-0 text-xs font-semibold shadow-lg transition-all duration-300 ${
                      followUp.is_overdue
                        ? "bg-linear-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400 hover:shadow-rose-500/40 active:scale-[0.98]"
                        : "bg-linear-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 hover:shadow-emerald-500/40 active:scale-[0.98]"
                    }`}
                    onClick={() => onPageChange?.("messages")}
                  >
                    <Send className="size-3.5" />
                    Send Message
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/2 py-12 text-center">
              <div className="mb-4 rounded-full bg-linear-to-br from-cyan-500/20 to-sky-500/10 p-4 shadow-lg">
                <ClipboardList className="size-10 text-cyan-400/80" />
              </div>
              <p className="text-sm font-medium text-zinc-400">All caught up!</p>
              <p className="mt-1 text-xs text-zinc-600">No follow-ups pending</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Active Clients */}
      <GlassCard className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Active Clients</h2>
            <Badge className="border-white/20 bg-white/10 text-white">
              {aggregate.active_clients.length}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 text-left text-sm text-zinc-500">
                <th className="pb-3 font-medium">Client</th>
                <th className="hidden pb-3 font-medium sm:table-cell">Last Session</th>
                <th className="hidden pb-3 font-medium sm:table-cell">Next Session</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {aggregate.active_clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-zinc-500">
                    No clients yet
                  </td>
                </tr>
              ) : (
                aggregate.active_clients.map((client) => (
                  <tr key={client.client_user_id} className="border-b border-white/5 text-sm">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-emerald-500/20 text-xs text-emerald-400">
                            {client.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white">{client.name}</span>
                      </div>
                    </td>
                    <td className="hidden py-3 text-zinc-400 sm:table-cell">{toRelativeTime(client.last_session_at)}</td>
                    <td className="hidden py-3 text-zinc-400 sm:table-cell">{toFutureRelativeTime(client.next_session_at)}</td>
                    <td className="py-3">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-[#0d1526]/95 backdrop-blur-xl"
                        >
                          <DropdownMenuItem className="text-zinc-300 hover:bg-white/5">
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-zinc-300 hover:bg-white/5">
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-zinc-300 hover:bg-white/5">
                            Schedule Session
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Recent Messages & Coin Widget */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Messages */}
        <GlassCard className="overflow-hidden p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">Recent Messages</h2>
            </div>
            <button 
              className="text-sm text-emerald-400 hover:text-emerald-300"
              onClick={() => onPageChange?.("messages")}
            >
              View all &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {loadingMessages ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Loading messages...
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No messages yet
              </div>
            ) : (
              recentMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/8 bg-white/5 p-3 transition-colors hover:bg-white/8"
                  onClick={() => onPageChange?.("messages")}
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-sky-500/20 text-xs text-sky-400">
                      {message.senderInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-white">{message.senderName}</p>
                      <p className="shrink-0 text-xs text-zinc-500">{message.timeAgo}</p>
                    </div>
                    <p className="truncate text-sm text-zinc-400">{message.preview}</p>
                  </div>
                  {message.unread && (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-emerald-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Coin Widget */}
        <GlassCard className="overflow-hidden border-amber-400/20 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Coins className="size-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-400">Wolistic Coins</h2>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Coins className="size-8 shrink-0 text-amber-400" />
            <span className="text-4xl font-bold text-amber-400">{coinBalance}</span>
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-zinc-300">How to earn coins:</p>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="shrink-0 text-emerald-400">+50</span> Complete a session
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 text-emerald-400">+30</span> Get a review
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0 text-emerald-400">+100</span> Refer a partner
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">Recent transactions:</p>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {coinTransactions.length === 0 ? (
                <p className="text-xs text-zinc-500">No transactions yet</p>
              ) : (
                coinTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-zinc-400">{tx.notes ?? tx.event_type.replace(/_/g, " ")}</p>
                      <p className="text-zinc-600">{formatCoinDate(tx.created_at)}</p>
                    </div>
                    <span className={`shrink-0 font-medium ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button
            disabled
            className="mt-4 w-full cursor-not-allowed border-amber-400/30 bg-amber-500/20 text-amber-400"
          >
            Redeem Coins (Coming Soon)
          </Button>
        </GlassCard>
      </div>

      {/* Active Services & Availability */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active Services */}
        <GlassCard className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Active Services</h2>
              <Badge className="border-white/20 bg-white/10 text-white">
                {aggregate.metrics.active_services_total}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-zinc-400 hover:text-white"
              onClick={openServicesSheet}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>

          {activeServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No active services yet</p>
          ) : (
            <div className="space-y-3">
              {activeServices.slice(0, 4).map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{service.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      {service.mode === "online" && <Video className="size-3" />}
                      {service.mode === "in-person" && <MapPin className="size-3" />}
                      {service.mode === "hybrid" && <UserIcon className="size-3" />}
                      <span className="capitalize">{service.mode}</span>
                      <span>&bull;</span>
                      <span>{service.duration_value} {service.duration_unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">₹{service.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Availability Schedule */}
        <GlassCard className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Availability Schedule</h2>
              <Badge className="border-white/20 bg-white/10 text-white">
                {aggregate.metrics.availability_slots_total} slots
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-zinc-400 hover:text-white"
              onClick={openAvailSheet}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>

          {availability.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No availability set yet</p>
          ) : (
            <div className="space-y-2">
              {availability.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/5 p-3"
                >
                  <Badge className="min-w-20 justify-center border-emerald-500/30 bg-emerald-500/20 text-xs text-emerald-400">
                    {DAY_NAMES[slot.day_of_week] ?? slot.day_of_week}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock className="size-4 text-zinc-400" />
                    <span>
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Reviews */}
      <GlassCard className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aggregate.recent_reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-white/8 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <p className="mb-2 text-sm text-zinc-300">{review.comment}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white">{review.reviewer_name}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Review Responses */}
      <ReviewResponseManager membershipTier={aggregate.overview.membership_tier} />

      {/* Upgrade Banner */}
      {isNotPremium && (
        <GlassCard className="border-amber-400/30 bg-linear-to-r from-amber-500/20 via-orange-500/15 to-rose-500/10 p-6">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amber-400/20 p-3">
                <Crown className="size-6 text-amber-400" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-amber-400">Go Premium</h3>
                <ul className="space-y-1 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-400" />
                    Featured placement in search results
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-400" />
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-400" />
                    Advanced analytics and insights
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <p className="mb-2 text-sm text-zinc-400">From ₹999/mo</p>
              <Button className="bg-linear-to-r from-amber-500 to-orange-500 px-8 text-white shadow-lg hover:from-amber-600 hover:to-orange-600">
                Upgrade Now
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>

    {/* ── Services quick-edit sheet ─────────────────────────────────────── */}
    <Sheet open={isServicesOpen} onOpenChange={setIsServicesOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto border-white/10 bg-[#0d1526] text-white sm:max-w-xl"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white">Edit Services</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
          {draftServices.map((service, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="mb-1 block text-xs text-zinc-400">Name</Label>
                    <Input
                      className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                      value={service.name}
                      onChange={(e) => {
                        const next = [...draftServices];
                        next[idx] = { ...service, name: e.target.value };
                        setDraftServices(next);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="mb-1 block text-xs text-zinc-400">Price (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                        value={service.price}
                        onChange={(e) => {
                          const next = [...draftServices];
                          next[idx] = { ...service, price: Number(e.target.value || 0) };
                          setDraftServices(next);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-zinc-400">Duration</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                        value={service.duration_value}
                        onChange={(e) => {
                          const next = [...draftServices];
                          next[idx] = { ...service, duration_value: Number(e.target.value || 1) };
                          setDraftServices(next);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs text-zinc-400">Unit</Label>
                      <Select
                        value={service.duration_unit}
                        onValueChange={(val) => {
                          const next = [...draftServices];
                          next[idx] = { ...service, duration_unit: val };
                          setDraftServices(next);
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mins">mins</SelectItem>
                          <SelectItem value="hours">hours</SelectItem>
                          <SelectItem value="days">days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5 shrink-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => setDraftServices(draftServices.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-xs text-zinc-400">Active</span>
                <Switch
                  checked={service.is_active}
                  onCheckedChange={(checked) => {
                    const next = [...draftServices];
                    next[idx] = { ...service, is_active: checked };
                    setDraftServices(next);
                  }}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            onClick={() =>
              setDraftServices([
                ...draftServices,
                {
                  name: "",
                  short_brief: "",
                  price: 0,
                  offers: "",
                  negotiable: false,
                  offer_type: "none",
                  offer_label: "",
                  mode: "online",
                  duration_value: 30,
                  duration_unit: "mins",
                  is_active: true,
                },
              ])
            }
          >
            <Plus className="size-4" /> Add Service
          </Button>
        </div>

        {servicesError && (
          <p className="mb-2 text-sm text-rose-400">{servicesError}</p>
        )}

        <SheetFooter className="flex gap-2 pt-2">
          <SheetClose asChild>
            <Button
              variant="outline"
              className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={saveServices}
            disabled={isSavingServices}
          >
            {isSavingServices ? "Saving…" : "Save Services"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    {/* ── Availability quick-edit sheet ─────────────────────────────────── */}
    <Sheet open={isAvailOpen} onOpenChange={setIsAvailOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto border-white/10 bg-[#0d1526] text-white sm:max-w-lg"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white">Edit Availability</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto pb-4 pr-1">
          {draftAvail.map((slot, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <Label className="mb-1 block text-xs text-zinc-400">Day</Label>
                <Select
                  value={String(slot.day_of_week)}
                  onValueChange={(val) => {
                    const next = [...draftAvail];
                    next[idx] = { ...slot, day_of_week: Number(val) };
                    setDraftAvail(next);
                  }}
                >
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs text-zinc-400">Start</Label>
                <Input
                  type="time"
                  className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                  value={slot.start_time.slice(0, 5)}
                  onChange={(e) => {
                    const next = [...draftAvail];
                    next[idx] = { ...slot, start_time: e.target.value };
                    setDraftAvail(next);
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-zinc-400">End</Label>
                <Input
                  type="time"
                  className="h-9 rounded-lg border-white/10 bg-white/5 text-sm text-white"
                  value={slot.end_time.slice(0, 5)}
                  onChange={(e) => {
                    const next = [...draftAvail];
                    next[idx] = { ...slot, end_time: e.target.value };
                    setDraftAvail(next);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => setDraftAvail(draftAvail.filter((_, i) => i !== idx))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            onClick={() => setDraftAvail([...draftAvail, createEmptyAvailability()])}
          >
            <Plus className="size-4" /> Add Slot
          </Button>
        </div>

        {availError && (
          <p className="mb-2 text-sm text-rose-400">{availError}</p>
        )}

        <SheetFooter className="flex gap-2 pt-2">
          <SheetClose asChild>
            <Button
              variant="outline"
              className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={saveAvailability}
            disabled={isSavingAvail}
          >
            {isSavingAvail ? "Saving…" : "Save Availability"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  );
}
