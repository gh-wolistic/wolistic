"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  getBookingHistory,
  type BookingHistoryItem,
  type BookingHistoryResult,
} from "@/components/public/data/bookingApi";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthState = {
  accessToken: string | null;
  email: string | null;
  userId: string;
};

const EMPTY_HISTORY: BookingHistoryResult = {
  latest_booking: null,
  next_booking: null,
  immediate_bookings: [],
  upcoming_bookings: [],
  past_bookings: [],
};

function formatScheduleLabel(booking: BookingHistoryItem): string {
  if (booking.is_immediate) {
    return "Immediate (within 30 mins)";
  }
  if (!booking.scheduled_for) {
    return "Not specified";
  }

  const parsed = new Date(booking.scheduled_for);
  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCreatedLabel(booking: BookingHistoryItem): string {
  const parsed = new Date(booking.created_at);
  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderPaymentBadge(paymentStatus: string | null) {
  if (!paymentStatus) {
    return null;
  }

  const normalized = paymentStatus.toLowerCase();

  if (normalized === "success") {
    return <Badge className="bg-emerald-600 text-white">Payment Success</Badge>;
  }

  if (normalized === "failure") {
    return <Badge className="bg-rose-600 text-white">Payment Failed</Badge>;
  }

  return <Badge className="bg-amber-600 text-white">Payment Pending</Badge>;
}

export default function AuthorizedPage() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<BookingHistoryResult>(EMPTY_HISTORY);

  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment_status");

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const session = data.session;
      if (!session) {
        setAuthState(null);
        setLoading(false);
        return;
      }

      setAuthState({
        accessToken: session.access_token ?? null,
        email: session.user.email ?? null,
        userId: session.user.id,
      });
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setAuthState(null);
      } else {
        setAuthState({
          accessToken: session.access_token ?? null,
          email: session.user.email ?? null,
          userId: session.user.id,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authState?.accessToken) {
      setHistory(EMPTY_HISTORY);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const payload = await getBookingHistory(authState.accessToken);
        if (!cancelled) {
          setHistory(payload);
        }
      } catch {
        if (!cancelled) {
          setHistoryError("Unable to load booking history right now.");
          setHistory(EMPTY_HISTORY);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    const refreshTimer = window.setTimeout(() => {
      void loadHistory();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
    };
  }, [authState?.accessToken]);

  const hasAnyBookings = useMemo(() => {
    return Boolean(
      history.latest_booking ||
        history.next_booking ||
        history.immediate_bookings.length > 0 ||
        history.upcoming_bookings.length > 0 ||
        history.past_bookings.length > 0,
    );
  }, [history]);

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-600">Checking session...</p>
      </main>
    );
  }

  if (!authState) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900">Not authorized</h1>
        <p className="text-zinc-600">Please login first from the home page.</p>
        <Link href="/" className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white">
          Go to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Authorized Area</h1>
      <p className="text-zinc-600">Welcome to Wolistic. You are successfully logged in.</p>

      {paymentStatus && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Payment update received. Refreshing your bookings from database.</p>
        </section>
      )}

      {historyLoading && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-700">Loading bookings from database...</p>
        </section>
      )}

      {historyError && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{historyError}</p>
        </section>
      )}

      {history.latest_booking && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-wide text-emerald-700">Latest Booking</p>
            {renderPaymentBadge(history.latest_booking.payment_status)}
          </div>

          <p className="mt-3 text-sm text-zinc-800">Service: {history.latest_booking.service_name}</p>
          <p className="mt-1 text-sm text-zinc-800">Slot: {formatScheduleLabel(history.latest_booking)}</p>
          <p className="mt-1 text-sm text-zinc-700">Booked On: {formatCreatedLabel(history.latest_booking)}</p>
        </section>
      )}

      {history.next_booking && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-wide text-sky-700">Next In Schedule</p>
            <Badge className="bg-sky-600 text-white">Upcoming</Badge>
          </div>

          <p className="mt-3 text-sm text-zinc-800">Service: {history.next_booking.service_name}</p>
          <p className="mt-1 text-sm text-zinc-800">Slot: {formatScheduleLabel(history.next_booking)}</p>
          <p className="mt-1 text-sm text-zinc-700">Booked On: {formatCreatedLabel(history.next_booking)}</p>
        </section>
      )}

      {history.immediate_bookings.length > 0 && (
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-wide text-violet-700">Immediate Bookings</p>
            <Badge className="bg-violet-600 text-white">{history.immediate_bookings.length}</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {history.immediate_bookings.map((booking) => (
              <div key={booking.booking_reference} className="rounded-lg border border-violet-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900">{booking.service_name}</p>
                  {renderPaymentBadge(booking.payment_status)}
                </div>

                <p className="mt-1 text-sm text-zinc-700">Slot: {formatScheduleLabel(booking)}</p>
                <p className="mt-1 text-sm text-zinc-700">Booked On: {formatCreatedLabel(booking)}</p>
                <p className="mt-1 text-xs text-zinc-500">Reference: {booking.booking_reference}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.past_bookings.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-wide text-zinc-700">Past Bookings</p>
            <Badge className="bg-zinc-700 text-white">{history.past_bookings.length}</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {history.past_bookings.map((booking) => (
              <div key={booking.booking_reference} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900">{booking.service_name}</p>
                  {renderPaymentBadge(booking.payment_status)}
                </div>

                <p className="mt-1 text-sm text-zinc-700">Slot: {formatScheduleLabel(booking)}</p>
                <p className="mt-1 text-sm text-zinc-700">Booked On: {formatCreatedLabel(booking)}</p>
                <p className="mt-1 text-xs text-zinc-500">Reference: {booking.booking_reference}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!historyLoading && !hasAnyBookings && !historyError && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm text-zinc-700">No bookings found in database yet.</p>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm uppercase tracking-wide text-zinc-500">Session Details</p>
        <p className="mt-2 text-sm text-zinc-700">Email: {authState.email ?? "Not available"}</p>
        <p className="text-sm text-zinc-700">User ID: {authState.userId}</p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
        >
          Logout
        </button>
        <Link href="/" className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-100">
          Home
        </Link>
      </div>
    </main>
  );
}
