"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  Ban,
  DollarSign,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { getMyEnrollments, type UserEnrollment } from "@/lib/api/sessions";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MyEnrollmentsPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthSession();

  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<UserEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/my-enrollments");
      return;
    }
    loadEnrollments();
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    applyFilters();
  }, [enrollments, statusFilter, timeFilter]);

  async function loadEnrollments() {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const data = await getMyEnrollments(accessToken);
      setEnrollments(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...enrollments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((e) => {
        const sessionDate = new Date(e.session_date);
        sessionDate.setHours(0, 0, 0, 0);

        switch (timeFilter) {
          case "upcoming":
            return sessionDate >= today;
          case "past":
            return sessionDate < today;
          default:
            return true;
        }
      });
    }

    // Sort by date (upcoming first, then past)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.session_date}T${a.start_time}`);
      const dateB = new Date(`${b.session_date}T${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredEnrollments(filtered);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="size-4 text-emerald-400" />;
      case "attended":
        return <UserCheck className="size-4 text-emerald-400" />;
      case "cancelled":
        return <Ban className="size-4 text-rose-400" />;
      case "no_show_client":
        return <XCircle className="size-4 text-amber-400" />;
      case "session_cancelled":
        return <AlertCircle className="size-4 text-rose-400" />;
      default:
        return null;
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "attended":
        return "Attended";
      case "cancelled":
        return "Cancelled";
      case "no_show_client":
        return "No Show";
      case "session_cancelled":
        return "Session Cancelled";
      default:
        return status;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
      case "attended":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
      case "cancelled":
        return "bg-rose-500/20 text-rose-400 border-rose-400/30";
      case "no_show_client":
        return "bg-amber-500/20 text-amber-400 border-amber-400/30";
      case "session_cancelled":
        return "bg-rose-500/20 text-rose-400 border-rose-400/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-400/30";
    }
  }

  function getCategoryColor(category: string): string {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Enrollments</h1>
          <p className="text-zinc-400">
            {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Time Filter" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show_client">No Show</SelectItem>
                <SelectItem value="session_cancelled">Session Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enrollments List */}
        {filteredEnrollments.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <CalendarDays className="size-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No enrollments found</h3>
            <p className="text-zinc-400 mb-6">
              {statusFilter !== "all" || timeFilter !== "all"
                ? "Try adjusting your filters"
                : "Browse available sessions to enroll"}
            </p>
            <Button
              onClick={() => router.push("/sessions")}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              Browse Sessions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => {
              const isPast = new Date(enrollment.session_date) < new Date();

              return (
                <div
                  key={enrollment.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`bg-gradient-to-r ${getCategoryColor(enrollment.category)} text-white border-0`}>
                          {enrollment.category}
                        </Badge>
                        <Badge className={`${getStatusColor(enrollment.status)} border text-xs`}>
                          <span className="mr-1">{getStatusIcon(enrollment.status)}</span>
                          {getStatusLabel(enrollment.status)}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-1">{enrollment.title}</h3>
                      <p className="text-zinc-400">
                        with{" "}
                        <span
                          className="text-emerald-400 hover:underline cursor-pointer"
                          onClick={() => router.push(`/${enrollment.professional_username}`)}
                        >
                          {enrollment.professional_name}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">₹{enrollment.amount_paid}</p>
                      <Badge className="mt-2 bg-zinc-500/20 text-zinc-300 border-zinc-400/30 text-xs">
                        {enrollment.payment_status}
                      </Badge>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="size-4" />
                      <span>{formatDate(enrollment.session_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="size-4" />
                      <span>{formatTime(enrollment.start_time)} • {enrollment.duration_minutes} min</span>
                    </div>
                    {enrollment.work_location && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400 col-span-2">
                        <MapPin className="size-4" />
                        <span className="truncate">{enrollment.work_location.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Refund Notice */}
                  {enrollment.payment_status === "refunded" && (
                    <div className="mt-4 p-3 bg-sky-500/10 border border-sky-400/30 rounded-lg">
                      <p className="text-sm text-sky-400 flex items-center gap-2">
                        <DollarSign className="size-4" />
                        Refund of ₹{enrollment.amount_paid} has been processed
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
