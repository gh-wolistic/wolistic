"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Heart,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { 
  getSessionDetails, 
  enrollInSession, 
  registerInterest,
  type SessionDetails 
} from "@/lib/api/sessions";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SessionDetailsPageProps {
  sessionId: number;
}

export function SessionDetailsPage({ sessionId }: SessionDetailsPageProps) {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthSession();
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [registeringInterest, setRegisteringInterest] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    setLoading(true);
    try {
      const data = await getSessionDetails(sessionId);
      setSession(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load session");
      router.push("/sessions");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please login to enroll");
      router.push(`/login?redirect=/sessions/${sessionId}`);
      return;
    }

    // TODO: Integrate Razorpay payment flow
    // For now, using mock payment_order_id
    const mockPaymentOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    setEnrolling(true);
    try {
      const result = await enrollInSession(sessionId, accessToken, mockPaymentOrderId);
      toast.success(result.message);
      router.push("/dashboard/my-enrollments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRegisterInterest() {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please login to join waitlist");
      router.push(`/login?redirect=/sessions/${sessionId}`);
      return;
    }

    setRegisteringInterest(true);
    try {
      const result = await registerInterest(sessionId, accessToken);
      toast.success(result.message);
      await loadSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join waitlist");
    } finally {
      setRegisteringInterest(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  }

  function formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case "mind": return "from-violet-500 to-purple-600";
      case "body": return "from-emerald-500 to-green-600";
      case "nutrition": return "from-amber-500 to-orange-600";
      case "lifestyle": return "from-sky-500 to-blue-600";
      default: return "from-zinc-500 to-zinc-600";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const spotsRemaining = session.capacity - session.enrolled_count;
  const availabilityColor = 
    spotsRemaining === 0 ? "text-rose-400" :
    spotsRemaining <= 2 ? "text-amber-400" :
    "text-emerald-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-zinc-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        {/* Session Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`bg-gradient-to-r ${getCategoryColor(session.category)} text-white border-0`}>
                  {session.category}
                </Badge>
                <Badge className="bg-white/10 text-zinc-300 border-white/20">
                  {session.display_term}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{session.title}</h1>
              {session.professional && (
                <p className="text-zinc-400">
                  with{" "}
                  <span 
                    className="text-emerald-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/${session.professional!.username}`)}
                  >
                    {session.professional.display_name}
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">₹{session.price}</p>
              <p className="text-sm text-zinc-400">per session</p>
            </div>
          </div>

          {/* Session Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Calendar className="size-5 text-emerald-400" />
              <div>
                <p className="text-xs text-zinc-500">Date</p>
                <p className="text-sm font-medium text-white">{formatDate(session.session_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Clock className="size-5 text-sky-400" />
              <div>
                <p className="text-xs text-zinc-500">Time</p>
                <p className="text-sm font-medium text-white">{formatTime(session.start_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Users className={`size-5 ${availabilityColor}`} />
              <div>
                <p className="text-xs text-zinc-500">Availability</p>
                <p className={`text-sm font-medium ${availabilityColor}`}>
                  {session.is_sold_out ? "Sold Out" : `${spotsRemaining} spots left`}
                </p>
              </div>
            </div>
            {session.work_location && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <MapPin className="size-5 text-violet-400" />
                <div>
                  <p className="text-xs text-zinc-500">Location</p>
                  <p className="text-sm font-medium text-white">{session.work_location.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {session.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">About This Session</h3>
              <p className="text-zinc-300 leading-relaxed">{session.description}</p>
            </div>
          )}

          {/* Location Details */}
          {session.work_location && session.work_location.address && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-violet-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">{session.work_location.name}</p>
                  <p className="text-sm text-zinc-400">{session.work_location.address}</p>
                  <Badge className="mt-2 bg-violet-500/20 text-violet-400 border-violet-400/30 text-xs">
                    {session.work_location.location_type}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="mt-6 flex gap-3">
            {session.is_sold_out ? (
              <Button
                onClick={handleRegisterInterest}
                disabled={registeringInterest}
                className="flex-1 bg-amber-500/20 border border-amber-400/30 text-amber-400 hover:bg-amber-500/30"
              >
                {registeringInterest ? (
                  "Joining Waitlist..."
                ) : (
                  <>
                    <Heart className="size-4 mr-2" />
                    Join Waitlist
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                {enrolling ? (
                  "Enrolling..."
                ) : (
                  <>
                    <CheckCircle className="size-4 mr-2" />
                    Enroll Now - ₹{session.price}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Trust Signals */}
          <div className="mt-6 flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="size-3 text-emerald-400" />
              Instant confirmation
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="size-3 text-sky-400" />
              Cancellation available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
