"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleDashed, ThumbsDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PaymentStatus = "success" | "failure" | "pending";

function normalizeStatus(value: string | null): PaymentStatus {
  if (value === "success" || value === "failure" || value === "pending") {
    return value;
  }

  return "pending";
}

function getStatusCopy(status: PaymentStatus) {
  if (status === "success") {
    return {
      title: "Payment Successful",
      badge: "Success",
      badgeClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      description: "Your booking payment was completed successfully.",
      iconClassName: "text-emerald-600",
    };
  }

  if (status === "failure") {
    return {
      title: "Payment Failed",
      badge: "Failed",
      badgeClassName: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      description: "We could not complete your payment. You can try again.",
      iconClassName: "text-rose-600",
    };
  }

  return {
    title: "Payment Pending",
    badge: "Pending",
    badgeClassName: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    description: "Your payment is being verified. Please check again in a moment.",
    iconClassName: "text-amber-600",
  };
}

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = normalizeStatus(searchParams.get("status"));
  const next = searchParams.get("next");
  const username = searchParams.get("username");
  const service = searchParams.get("service");
  const bookingDate = searchParams.get("booking_date");
  const bookingSlot = searchParams.get("booking_slot");
  const bookingSummary = searchParams.get("booking_summary");
  const bookingAt = searchParams.get("booking_at");

  const nextHref = useMemo(() => {
    const basePath = next && next.startsWith("/") ? next : "/authorized";
    const params = new URLSearchParams();

    if (status) {
      params.set("payment_status", status);
    }
    if (service) {
      params.set("service", service);
    }
    if (bookingDate) {
      params.set("booking_date", bookingDate);
    }
    if (bookingSlot) {
      params.set("booking_slot", bookingSlot);
    }
    if (bookingSummary) {
      params.set("booking_summary", bookingSummary);
    }
    if (bookingAt) {
      params.set("booking_at", bookingAt);
    }
    if (username) {
      params.set("username", username);
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }, [bookingAt, bookingDate, bookingSlot, bookingSummary, next, service, status, username]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push(nextHref);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [nextHref, router]);

  const profileHref = username ? `/${encodeURIComponent(username)}` : "/";
  const copy = getStatusCopy(status);

  const StatusIcon =
    status === "success"
      ? CheckCircle2
      : status === "failure"
        ? ThumbsDown
        : CircleDashed;

  return (
    <section className="py-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6 sm:p-8">
            <div className="mb-5 flex justify-center">
              <StatusIcon className={`h-28 w-28 ${copy.iconClassName}`} strokeWidth={1.7} />
            </div>

            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl">{copy.title}</h1>
              <Badge className={copy.badgeClassName}>{copy.badge}</Badge>
            </div>

            <p className="text-muted-foreground">{copy.description}</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you to your authorized page...
            </p>

            {service && (
              <div className="mt-5 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="mt-1 text-base text-foreground">{service}</p>
              </div>
            )}

            {(bookingSummary || (bookingDate && bookingSlot)) && (
              <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">Selected Slot</p>
                <p className="mt-1 text-base text-foreground">
                  {bookingSummary || `${bookingDate ?? ""}, ${bookingSlot ?? ""}`}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={nextHref}>Go Now</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href={profileHref}>Back To Profile</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
