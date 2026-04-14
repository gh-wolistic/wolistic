"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { UserOnboardingFlow } from "@/components/onboarding/UserOnboardingFlow";
import { BookingOnboardingStep } from "@/components/onboarding/booking/BookingOnboardingStep";
import {
  clearBookingFlowDraft,
  persistBookingFlowDraft,
  readBookingFlowDraft,
  type PersistedBookingDraft,
} from "@/components/onboarding/booking/storage";
import { useBookingOnboarding } from "@/components/onboarding/booking/useBookingOnboarding";
import { type OnboardingSelection } from "@/components/onboarding/types";
import { PaymentStep } from "@/components/payment/PaymentStep";
import { usePaymentFlow } from "@/components/payment/hooks/usePaymentFlow";
import type { PaymentStatus } from "@/components/payment/types";
import type { ProfessionalProfile } from "@/types/professional";
import { updateUserOnboardingSelection } from "@/components/public/data/authApi";
import { getPromotionalEligibility } from "@/components/public/data/bookingApi";
import { ScheduleStep } from "./booking-steps/ScheduleStep";
import { useBookingSchedule } from "./booking-hooks/useBookingSchedule";

type ServicesBookingSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

type BookingStep = "schedule" | "questions" | "auth" | "user-onboarding" | "payment";
type AuthMode = "signup" | "login";
type PreferredTiming = "morning" | "afternoon" | "evening";

const BOOKING_FLOW_STEPS: ReadonlyArray<{ step: BookingStep; label: string }> = [
  { step: "schedule", label: "Schedule" },
  { step: "questions", label: "Questions" },
  { step: "auth", label: "Signin" },
  { step: "user-onboarding", label: "Profile" },
  { step: "payment", label: "Payment" },
];

export function ServicesBookingSection({ professional, bookingStartSignal }: ServicesBookingSectionProps) {
  const router = useRouter();
  const { user, accessToken, status: authStatus, refreshSession } = useAuthSession();
  const { openAuthSidebar } = useAuthModal();

  const servicesToDisplay = useMemo(() => professional.services, [professional.services]);

  const initialConsultationIndex = useMemo(() => {
    const index = professional.services.findIndex((service) =>
      service.name.toLowerCase().includes("initial consultation"),
    );
    return index >= 0 ? index : 0;
  }, [professional.services]);

  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("schedule");
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(initialConsultationIndex);

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [promotionalAlreadyClaimed, setPromotionalAlreadyClaimed] = useState(false);
  const [userOnboardingError, setUserOnboardingError] = useState<string | null>(null);
  const [userOnboardingSubmitting, setUserOnboardingSubmitting] = useState(false);
  const restoredDraftRef = useRef(false);
  const resumeAfterAuthRef = useRef<PersistedBookingDraft | null>(null);
  const isAutoResumingAfterAuthRef = useRef(false);
  const authSidebarOpenedForStepRef = useRef(false);
  const bookingFlowRef = useRef<HTMLDivElement | null>(null);

  const {
    preferredTiming,
    selectedDate,
    selectedTimeSlot,
    isImmediateBooking,
    scheduleError,
    availableTimeSlots,
    setPreferredTiming,
    setSelectedDate,
    setSelectedTimeSlot,
    setIsImmediateBooking,
    setScheduleError,
    isUnavailableDate,
    availableDayModifier,
    handleImmediateAvailability,
    resetSchedule,
  } = useBookingSchedule(professional.availability ?? "");

  const {
    questionForm,
    mandatoryQuestions,
    questionAnswers,
    questionsLoading,
    questionsResolved,
    needsMandatoryQuestions,
    questionError,
    setQuestionForm,
    setQuestionAnswers,
    persistQuestionAnswers,
  } = useBookingOnboarding({
    showBookingFlow,
    professionalUsername: professional.username,
    token: accessToken ?? undefined,
  });

  const selectedService = servicesToDisplay[selectedServiceIndex] ?? servicesToDisplay[0] ?? null;
  const selectedServiceName = selectedService?.name ?? "Consultation";
  const activeStepIndex = BOOKING_FLOW_STEPS.findIndex((item) => item.step === bookingStep);
  const isInitialConsultationSelected =
    selectedService?.name?.trim().toLowerCase() === "initial consultation";
  const isOnline = professional.isOnline;

  const computeServiceDiscount = (service: (typeof servicesToDisplay)[number] | undefined): number => {
    if (!service) {
      return 0;
    }

    if (service.offer_type && service.offer_type !== "none") {
      if (service.offer_type === "cashback") {
        return 0;
      }
      if (service.offer_type === "percentage" && service.offer_value) {
        return Number(((service.price * service.offer_value) / 100).toFixed(2));
      }
      if (service.offer_type === "flat" && service.offer_value) {
        return Math.min(service.price, service.offer_value);
      }
    }

    const offers = service.offers?.trim();
    if (!offers) {
      return 0;
    }

    const normalized = offers.toLowerCase();
    if (normalized.includes("free")) {
      return service.price;
    }

    const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*off/);
    if (percentMatch) {
      const pct = Number(percentMatch[1]);
      return Number(((service.price * pct) / 100).toFixed(2));
    }

    const flatMatch = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:off|discount)/);
    if (flatMatch) {
      return Math.min(service.price, Number(flatMatch[1]));
    }

    return 0;
  };

  const baseSubtotal = selectedService?.price ?? 0;
  const discountAmount = computeServiceDiscount(selectedService);
  const subtotal = Number(Math.max(baseSubtotal - discountAmount, 0).toFixed(2));
  const gstAmount = Number((subtotal * 0.18).toFixed(2));
  const platformFee = subtotal > 0 ? 49 : 0;
  const grandTotal = subtotal + gstAmount + platformFee;

  const selectedSchedule = useMemo(() => {
    if (isImmediateBooking || selectedTimeSlot === "Immediate (within 30 mins)") {
      const nowPlus30 = new Date(Date.now() + 30 * 60 * 1000);
      return {
        date: "Today",
        slot: "Immediate (within 30 mins)",
        summary: "Immediate (within 30 mins)",
        bookingAtIso: nowPlus30.toISOString(),
      };
    }

    if (!selectedDate || !selectedTimeSlot) {
      return {
        date: "",
        slot: "",
        summary: "",
        bookingAtIso: "",
      };
    }

    const timeMatch = selectedTimeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let bookingAtIso = "";
    if (timeMatch) {
      const hour12 = Number(timeMatch[1]);
      const minute = Number(timeMatch[2]);
      const meridiem = timeMatch[3].toUpperCase();
      const hour24 = meridiem === "AM" ? (hour12 % 12) : (hour12 % 12) + 12;
      const scheduled = new Date(selectedDate);
      scheduled.setHours(hour24, minute, 0, 0);
      bookingAtIso = scheduled.toISOString();
    }

    const formattedDate = selectedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      date: formattedDate,
      slot: selectedTimeSlot,
      summary: `${formattedDate}, ${selectedTimeSlot}`,
      bookingAtIso,
    };
  }, [isImmediateBooking, selectedDate, selectedTimeSlot]);

  const redirectToPaymentStatus = (status: PaymentStatus, nextRoute = "/authorized") => {
    const safeNextRoute = nextRoute.startsWith("/") ? nextRoute : "/authorized";
    const params = new URLSearchParams({
      status,
      next: safeNextRoute,
      username: professional.username,
      service: selectedServiceName,
      booking_date: selectedSchedule.date,
      booking_slot: selectedSchedule.slot,
      booking_summary: selectedSchedule.summary,
      booking_at: selectedSchedule.bookingAtIso,
    });
    router.push(`/payment-status?${params.toString()}`);
  };

  const { paymentForm, paymentError, paymentSubmitting, setPaymentForm, setCoinsToUse, submitPayment } = usePaymentFlow({
    amount: grandTotal,
    professionalUsername: professional.username,
    professionalName: professional.name,
    serviceName: selectedServiceName,
    customerName: user?.name || undefined,
    customerEmail: user?.email || undefined,
    bookingAt: selectedSchedule.bookingAtIso || undefined,
    isImmediate: isImmediateBooking,
    token: accessToken ?? undefined,
    onStatusResolved: (status, nextRoute) => {
      redirectToPaymentStatus(status, nextRoute);
    },
  });

  const scrollToBookingFlow = () => {
    window.setTimeout(() => {
      bookingFlowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const beginBooking = (serviceIndex: number) => {
    const isAlreadyOpenForSameService = showBookingFlow && selectedServiceIndex === serviceIndex;

    setSelectedServiceIndex(serviceIndex);
    setShowBookingFlow(true);

    if (!isAlreadyOpenForSameService) {
      setBookingStep("schedule");
      resetSchedule();
    }

    scrollToBookingFlow();
  };

  useEffect(() => {
    setSelectedServiceIndex(initialConsultationIndex);
  }, [initialConsultationIndex]);

  useEffect(() => {
    if (bookingStartSignal > 0) {
      clearBookingFlowDraft();
      resumeAfterAuthRef.current = null;
      isAutoResumingAfterAuthRef.current = false;
      setSelectedServiceIndex(initialConsultationIndex);
      setShowBookingFlow(false);
      setBookingStep("schedule");
      resetSchedule();
    }
  }, [bookingStartSignal, initialConsultationIndex, resetSchedule]);

  useEffect(() => {
    if (restoredDraftRef.current) {
      return;
    }

    restoredDraftRef.current = true;

    const draft = readBookingFlowDraft();
    if (!draft || draft.professionalUsername !== professional.username) {
      return;
    }

    resumeAfterAuthRef.current = draft;
    setSelectedServiceIndex(draft.serviceIndex);
    setShowBookingFlow(true);
    setBookingStep(draft.bookingStep === "payment" ? "auth" : draft.bookingStep);
    setAuthMode(draft.authMode);
    setQuestionForm(draft.questionForm);
    setQuestionAnswers(draft.questionAnswers);
    setIsImmediateBooking(draft.isImmediateBooking);
    setSelectedTimeSlot(draft.selectedTimeSlot);
    setPreferredTiming(draft.preferredTiming as PreferredTiming | null);
    setSelectedDate(draft.selectedDateIso ? new Date(draft.selectedDateIso) : undefined);
    scrollToBookingFlow();
  }, [
    professional.username,
    setIsImmediateBooking,
    setPreferredTiming,
    setQuestionAnswers,
    setQuestionForm,
    setSelectedDate,
    setSelectedTimeSlot,
  ]);

  useEffect(() => {
    const draft = resumeAfterAuthRef.current;

    if (!draft || isAutoResumingAfterAuthRef.current || !user || !accessToken || !showBookingFlow) {
      return;
    }

    if (!questionsResolved || questionsLoading) {
      return;
    }

    isAutoResumingAfterAuthRef.current = true;

    void (async () => {
      try {
        if (needsMandatoryQuestions) {
          const result = await persistQuestionAnswers({
            professionalUsername: professional.username,
            userId: user.id,
          });

          if (!result.ok) {
            setBookingStep("questions");
            return;
          }
        }

        setBookingStep(user.onboardingRequired ? "user-onboarding" : "payment");
        clearBookingFlowDraft();
        resumeAfterAuthRef.current = null;
      } finally {
        isAutoResumingAfterAuthRef.current = false;
      }
    })();
  }, [
    accessToken,
    user,
    needsMandatoryQuestions,
    persistQuestionAnswers,
    professional.username,
    questionsLoading,
    questionsResolved,
    setBookingStep,
    showBookingFlow,
  ]);

  useEffect(() => {
    if (!showBookingFlow || bookingStep === "payment") {
      return;
    }

    if (!resumeAfterAuthRef.current) {
      return;
    }

    persistBookingFlowDraft({
      professionalUsername: professional.username,
      serviceIndex: selectedServiceIndex,
      bookingStep: bookingStep === "user-onboarding" ? "user-onboarding" : "auth",
      authMode,
      preferredTiming,
      selectedDateIso: selectedDate ? selectedDate.toISOString() : null,
      selectedTimeSlot,
      isImmediateBooking,
      questionForm,
      questionAnswers,
    });
  }, [
    authMode,
    bookingStep,
    isImmediateBooking,
    preferredTiming,
    professional.username,
    questionAnswers,
    questionForm,
    selectedDate,
    selectedServiceIndex,
    selectedTimeSlot,
    showBookingFlow,
  ]);

  useEffect(() => {
    if (!showBookingFlow) {
      return;
    }

    scrollToBookingFlow();
  }, [bookingStep, showBookingFlow]);

  useEffect(() => {
    if (!accessToken) {
      setPromotionalAlreadyClaimed(false);
      return;
    }

    let isMounted = true;

    void getPromotionalEligibility(professional.username, accessToken)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setPromotionalAlreadyClaimed(result.already_claimed);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setPromotionalAlreadyClaimed(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, professional.username]);

  const handleScheduleContinue = () => {
    if (questionsLoading) {
      setScheduleError("Loading mandatory questions. Please wait a moment.");
      return;
    }

    if (isImmediateBooking && selectedTimeSlot === "Immediate (within 30 mins)") {
      setScheduleError(null);
      if (needsMandatoryQuestions) {
        setBookingStep("questions");
        return;
      }

      setBookingStep("payment");
      return;
    }

    if (!preferredTiming || !selectedDate || !selectedTimeSlot) {
      setScheduleError("Please select your preferred timing, date, and time slot to continue.");
      return;
    }

    setScheduleError(null);
    if (needsMandatoryQuestions) {
      setBookingStep("questions");
      return;
    }

    setBookingStep("payment");
  };

  function openBookingAuthSidebar() {
    const draft: PersistedBookingDraft = {
      professionalUsername: professional.username,
      serviceIndex: selectedServiceIndex,
      bookingStep: bookingStep === "user-onboarding" ? "user-onboarding" : "auth",
      authMode,
      preferredTiming,
      selectedDateIso: selectedDate ? selectedDate.toISOString() : null,
      selectedTimeSlot,
      isImmediateBooking,
      questionForm,
      questionAnswers,
    };

    resumeAfterAuthRef.current = draft;
    isAutoResumingAfterAuthRef.current = false;
    persistBookingFlowDraft(draft);

    const nextPath = `${window.location.pathname}${window.location.search}`;
    openAuthSidebar({
      redirectNextPath: `${nextPath}#services`,
      defaultMode: authMode,
      title: "Sign in to continue booking",
      description: "Your selected slot and answers are saved.",
    });
  }

  useEffect(() => {
    if (bookingStep !== "auth") {
      authSidebarOpenedForStepRef.current = false;
      return;
    }

    if (authStatus === "loading" || user || authSidebarOpenedForStepRef.current) {
      return;
    }

    authSidebarOpenedForStepRef.current = true;
    openBookingAuthSidebar();
  }, [authStatus, bookingStep, user, openBookingAuthSidebar]);

  const handleQuestionsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setBookingStep("auth");
      openBookingAuthSidebar();
      return;
    }

    const result = await persistQuestionAnswers({
      professionalUsername: professional.username,
      userId: user.id,
    });
    if (!result.ok) {
      return;
    }

    if (user.onboardingRequired) {
      setBookingStep("user-onboarding");
      return;
    }

    setBookingStep("payment");
  };

  const isPromotionalService = (serviceName: string, price: number) =>
    serviceName.trim().toLowerCase() === "initial consultation" || price === 0;

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setBookingStep("auth");
      openBookingAuthSidebar();
      return;
    }

    await submitPayment();
  };

  const handleUserOnboardingSubmit = async (selection: OnboardingSelection) => {
    if (!accessToken) {
      setUserOnboardingError("Please sign in again to continue.");
      return;
    }

    setUserOnboardingSubmitting(true);
    setUserOnboardingError(null);

    try {
      await updateUserOnboardingSelection(selection, accessToken);
      await refreshSession();
      setBookingStep("payment");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save your onboarding details.";
      setUserOnboardingError(message);
    } finally {
      setUserOnboardingSubmitting(false);
    }
  };

  const getPreviousStep = (): BookingStep | null => {
    if (bookingStep === "schedule") {
      return null;
    }

    if (bookingStep === "questions") {
      return "schedule";
    }

    if (bookingStep === "auth") {
      return needsMandatoryQuestions ? "questions" : "schedule";
    }

    if (bookingStep === "user-onboarding") {
      if (needsMandatoryQuestions) {
        return "questions";
      }
      return "schedule";
    }

    if (bookingStep === "payment") {
      if (user?.onboardingRequired) {
        return "user-onboarding";
      }
      if (needsMandatoryQuestions) {
        return "questions";
      }
      return "schedule";
    }

    return null;
  };

  const handleBackStep = () => {
    const previousStep = getPreviousStep();
    if (!previousStep) {
      return;
    }
    setBookingStep(previousStep);
  };

  return (
    <div id="services" className="scroll-mt-20 sm:scroll-mt-32">
      <Card className="p-5 sm:p-6">
        <h2 className="mb-6">Services & Pricing</h2>
        {servicesToDisplay.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active services are configured for this expert yet.
          </p>
        ) : (
          <div className="space-y-3">
            {servicesToDisplay.map((service, index) => (
            <div key={`${service.name}-${index}`} className="group">
              {(() => {
                const isInitialConsultation =
                  service.name.trim().toLowerCase() === "initial consultation";
                const isPromotional = isPromotionalService(service.name, service.price);
                const isPromotionalBlocked = isPromotional && promotionalAlreadyClaimed;
                const structuredOffer =
                  service.offer_type && service.offer_type !== "none"
                    ? service.offer_label
                      ? service.offer_label
                      : service.offer_type === "cashback" && service.offer_value
                        ? `₹${service.offer_value} cashback`
                        : service.offer_type === "percentage" && service.offer_value
                          ? `${service.offer_value}% off`
                          : service.offer_type === "flat" && service.offer_value
                            ? `₹${service.offer_value} off`
                            : "Offer available"
                    : null;
                const fallbackOffer = service.offers?.trim() ? service.offers.trim() : null;
                const offerText = structuredOffer ?? fallbackOffer;
                const cardDiscount = computeServiceDiscount(service);
                const discountedPrice = Math.max(service.price - cardDiscount, 0);

                return (
              <div
                className={`flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:hover:bg-emerald-500/10 ${
                  selectedServiceIndex === index
                    ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-500/10"
                    : "border-border"
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg">{service.name}</h3>
                    {selectedServiceIndex === index && (
                      <Badge className="bg-emerald-600 text-white">Selected</Badge>
                    )}
                    {isPromotionalBlocked && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        Already Claimed
                      </Badge>
                    )}
                    {service.negotiable && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Tag size={12} className="mr-1" />
                        Negotiable
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    <span>{service.duration}</span>
                    {(service.session_count ?? 1) > 1 ? (
                      <Badge className="bg-teal-600 text-white text-xs">
                        {service.session_count} sessions
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        1 session
                      </Badge>
                    )}
                    {service.mode && (
                      <Badge variant="secondary" className="text-xs uppercase">
                        {service.mode}
                      </Badge>
                    )}
                  </div>
                  {offerText && (
                    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      <span className="font-medium">Offer:</span> {offerText}
                    </div>
                  )}
                  {isInitialConsultation && !isPromotionalBlocked && (
                    <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-100/50 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white text-[11px] px-2 py-0.5">Offer</Badge>
                        <span className="text-sm text-emerald-900 dark:text-emerald-200">Pay ₹250 now • Get ₹250 credits</span>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200/90">
                        Consultation charges is to avoid experts getting spammed with requests.
                      </p>
                      <p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200/90">
                        <span className="font-semibold">Effective consultation cost: ₹0</span> after credits.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    {service.price === 0 ? (
                      <p className="text-2xl font-semibold text-emerald-600">Free</p>
                    ) : cardDiscount > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">₹{service.price}</p>
                        <p className="text-2xl font-semibold text-emerald-600">₹{discountedPrice}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {(service.session_count ?? 1) > 1 ? `total · ${service.session_count} sessions` : "per session"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-semibold text-emerald-600">₹{service.price}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {(service.session_count ?? 1) > 1 ? `total · ${service.session_count} sessions` : "per session"}
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 shadow-sm hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20"
                    onClick={() => beginBooking(index)}
                    disabled={isPromotionalBlocked}
                  >
                    {isPromotionalBlocked ? "Claimed" : "Book"}
                  </Button>
                </div>
              </div>
                );
              })()}
            </div>
            ))}
          </div>
        )}

        {showBookingFlow && selectedService && (
          <Card
            ref={bookingFlowRef}
            className="mt-6 border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl">Booking Flow</h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {BOOKING_FLOW_STEPS[activeStepIndex]?.label ?? "Schedule"}
              </Badge>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {BOOKING_FLOW_STEPS.map((item, index) => {
                const isActive = index === activeStepIndex;
                const isComplete = index < activeStepIndex;

                return (
                  <div
                    key={item.step}
                    className={`rounded-xl border px-3 py-3 text-sm ${
                      isActive
                        ? "border-emerald-300 bg-white text-foreground shadow-sm dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-100"
                        : isComplete
                          ? "border-teal-200 bg-teal-50/70 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200"
                          : "border-border/60 bg-background/70 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-lg border border-emerald-200 bg-background p-4 shadow-sm dark:border-emerald-500/25">
              <p className="text-sm text-muted-foreground">Selected service</p>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p>{selectedServiceName}</p>
                  {(selectedService.session_count ?? 1) > 1 ? (
                    <p className="text-xs text-teal-600 dark:text-teal-400">
                      {selectedService.session_count} sessions · {selectedService.duration} each
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Single session · {selectedService.duration}</p>
                  )}
                </div>
                <p className="font-semibold text-emerald-600">
                  {selectedService.price === 0 ? "Free" : `₹${selectedService.price}`}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {(selectedService.session_count ?? 1) > 1 ? "total" : "per session"}
                  </span>
                </p>
              </div>
            </div>

            {bookingStep !== "schedule" && (
              <div className="mt-4">
                <Button type="button" variant="outline" onClick={handleBackStep}>
                  Back
                </Button>
              </div>
            )}

            {bookingStep === "schedule" && (
              <ScheduleStep
                isImmediateBooking={isImmediateBooking}
                isOnline={isOnline}
                preferredTiming={preferredTiming}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                availableTimeSlots={availableTimeSlots}
                scheduleError={scheduleError}
                isUnavailableDate={isUnavailableDate}
                availableDayModifier={availableDayModifier}
                onImmediateAvailability={handleImmediateAvailability}
                onSelectTiming={(timing) => {
                  setIsImmediateBooking(false);
                  setPreferredTiming(timing);
                  setSelectedDate(undefined);
                  setSelectedTimeSlot(null);
                }}
                onSelectDate={(value) => {
                  setSelectedDate(value);
                  if (selectedTimeSlot !== "Immediate (within 30 mins)") {
                    setSelectedTimeSlot(null);
                  }
                }}
                onSelectTimeSlot={setSelectedTimeSlot}
                onContinue={handleScheduleContinue}
              />
            )}

            {bookingStep === "questions" && (
              <BookingOnboardingStep
                questionForm={questionForm}
                mandatoryQuestions={mandatoryQuestions}
                questionAnswers={questionAnswers}
                questionError={questionError}
                questionsLoading={questionsLoading}
                continueLabel={user ? (user.onboardingRequired ? "Profile Setup" : "Payment") : "Signup"}
                onSubmit={handleQuestionsSubmit}
                onChange={(field, value) => setQuestionForm((previous) => ({ ...previous, [field]: value }))}
                onQuestionAnswerChange={(questionId, value) =>
                  setQuestionAnswers((previous) => ({ ...previous, [questionId]: value }))
                }
              />
            )}

            {bookingStep === "auth" && (
              <div className="mt-5 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <h4 className="text-base font-semibold">Sign in to continue</h4>
                <p className="text-sm text-muted-foreground">
                  We saved your booking progress. Continue securely from the auth sidebar.
                </p>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={openBookingAuthSidebar}
                >
                  Open auth sidebar
                </Button>
              </div>
            )}

            {bookingStep === "user-onboarding" && (
              <div className="mt-5">
                <UserOnboardingFlow
                  compact
                  userName={user?.name}
                  initialUserType={user?.type ?? null}
                  initialUserSubtype={user?.userSubtype ?? null}
                  error={userOnboardingError}
                  isSubmitting={userOnboardingSubmitting}
                  submitLabel="Continue to Payment"
                  onSubmit={handleUserOnboardingSubmit}
                />
              </div>
            )}

            {bookingStep === "payment" && (
              <PaymentStep
                baseSubtotal={baseSubtotal}
                discountAmount={discountAmount}
                subtotal={subtotal}
                gstAmount={gstAmount}
                platformFee={platformFee}
                grandTotal={grandTotal}
                isInitialConsultationSelected={isInitialConsultationSelected}
                paymentForm={paymentForm}
                paymentError={paymentError}
                paymentSubmitting={paymentSubmitting}
                onSubmit={handlePaymentSubmit}
                onChangeGstin={(value) => setPaymentForm((previous) => ({ ...previous, gstin: value }))}
                onChangeCoins={setCoinsToUse}
              />
            )}
          </Card>
        )}

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Services marked as &quot;Negotiable&quot; indicate pricing
            flexibility based on package deals, session frequency, or special circumstances.
            Contact the professional to discuss custom pricing.
          </p>
        </div>
      </Card>
    </div>
  );
}
