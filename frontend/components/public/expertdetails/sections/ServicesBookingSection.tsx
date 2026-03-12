"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useSessionStore } from "@/store/session";
import type { DashboardRole } from "@/types/dashboard";
import type { ProfessionalProfile } from "@/types/professional";
import { login, selectRole, signup } from "@/components/public/data/authApi";
import { ScheduleStep } from "./booking-steps/ScheduleStep";
import { QuestionsStep } from "./booking-steps/QuestionsStep";
import { AuthStep } from "./booking-steps/AuthStep";
import { PaymentStep } from "./booking-steps/PaymentStep";
import { useBookingSchedule } from "./booking-hooks/useBookingSchedule";
import { useMandatoryQuestions } from "./booking-hooks/useMandatoryQuestions";
import { usePaymentFlow } from "./booking-hooks/usePaymentFlow";

type ServicesBookingSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

type BookingStep = "schedule" | "questions" | "auth" | "payment";
type AuthMode = "signup" | "login";

type PaymentStatus = "success" | "failure" | "pending";

function mapUserTypeToDashboardRole(type: "professional" | "user" | "brand" | "influencer"): DashboardRole {
  switch (type) {
    case "professional":
      return "expert:trainer";
    case "brand":
      return "brand";
    case "influencer":
      return "partner";
    default:
      return "client";
  }
}

export function ServicesBookingSection({ professional, bookingStartSignal }: ServicesBookingSectionProps) {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const { user: authSessionUser, accessToken: authSessionToken } = useAuthSession();
  const setAuthSession = useSessionStore((state) => state.setAuthSession);
  const setRole = useSessionStore((state) => state.setRole);
  const setOnboardingComplete = useSessionStore((state) => state.setOnboardingComplete);

  const effectiveUser = user ?? (authSessionUser
    ? {
        id: authSessionUser.id,
        email: authSessionUser.email,
        name: authSessionUser.name,
        type: authSessionUser.userType,
      }
    : null);
  const effectiveToken = token ?? authSessionToken;

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
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
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
    needsMandatoryQuestions,
    questionError,
    setQuestionForm,
    setQuestionAnswers,
    persistQuestionAnswers,
  } = useMandatoryQuestions({
    showBookingFlow,
    professionalUsername: professional.username,
    userId: effectiveUser?.id,
    onboardingComplete: effectiveUser?.onboardingComplete,
    token: effectiveToken ?? undefined,
    onOnboardingMarked: () => setOnboardingComplete(true),
  });

  const selectedService = servicesToDisplay[selectedServiceIndex] ?? servicesToDisplay[0];
  const isInitialConsultationSelected =
    selectedService?.name?.trim().toLowerCase() === "initial consultation";
  const isOnline = professional.isOnline;

  const subtotal = selectedService?.price ?? 0;
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
      service: selectedService.name,
      booking_date: selectedSchedule.date,
      booking_slot: selectedSchedule.slot,
      booking_summary: selectedSchedule.summary,
      booking_at: selectedSchedule.bookingAtIso,
    });
    router.push(`/payment-status?${params.toString()}`);
  };

  const { paymentForm, paymentError, paymentSubmitting, setPaymentForm, submitPayment } = usePaymentFlow({
    amount: grandTotal,
    professionalUsername: professional.username,
    professionalName: professional.name,
    serviceName: selectedService.name,
    userId: effectiveUser?.id,
    customerName: effectiveUser?.name || authForm.name || undefined,
    customerEmail: effectiveUser?.email || authForm.email || undefined,
    bookingAt: selectedSchedule.bookingAtIso || undefined,
    isImmediate: isImmediateBooking,
    token: effectiveToken ?? undefined,
    onStatusResolved: (status, nextRoute) => {
      redirectToPaymentStatus(status, nextRoute);
    },
  });

  const scrollToBookingFlow = () => {
    window.setTimeout(() => {
      bookingFlowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      setSelectedServiceIndex(initialConsultationIndex);
      setShowBookingFlow(false);
      setBookingStep("schedule");
      resetSchedule();
    }
  }, [bookingStartSignal, initialConsultationIndex, resetSchedule]);

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

  const handleQuestionsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!effectiveUser) {
      setBookingStep("auth");
      return;
    }

    const result = await persistQuestionAnswers({
      professionalUsername: professional.username,
      userId: effectiveUser.id,
    });
    if (!result.ok) {
      return;
    }

    setBookingStep("payment");
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const authResult =
        authMode === "signup"
          ? await signup({
              email: authForm.email,
              password: authForm.password,
              full_name: authForm.name,
              user_type: "user",
            })
          : await login({
              email: authForm.email,
              password: authForm.password,
            });

      let resolvedUser = authResult.user;

      if (!resolvedUser.role_selection_complete) {
        resolvedUser = await selectRole({ role: "client" }, authResult.access_token);
      }

      setAuthSession({
        user: {
          id: resolvedUser.id,
          email: resolvedUser.email,
          name: resolvedUser.full_name,
          type: resolvedUser.user_type,
          onboardingComplete: resolvedUser.onboarding_complete,
          accountType: resolvedUser.account_type,
          expertType: resolvedUser.expert_type,
          expertSubtype: resolvedUser.expert_subtype,
          roleStatus: resolvedUser.role_status,
          onboardingStatus: resolvedUser.onboarding_status,
          roleSelectionComplete: resolvedUser.role_selection_complete,
        },
        token: authResult.access_token,
      });
      setRole(mapUserTypeToDashboardRole(resolvedUser.user_type));

      setBookingStep("payment");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      setAuthError(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPayment();
  };

  return (
    <div id="services" className="scroll-mt-32">
      <Card className="p-6">
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

                return (
              <div
                className={`flex items-center justify-between rounded-xl border bg-card p-5 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md dark:hover:bg-emerald-500/10 ${
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
                    {service.mode && (
                      <Badge variant="secondary" className="text-xs uppercase">
                        {service.mode}
                      </Badge>
                    )}
                  </div>
                  {service.offer_type && service.offer_type !== "none" && (
                    <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                      {service.offer_label
                        ? service.offer_label
                        : service.offer_type === "cashback" && service.offer_value
                          ? `₹${service.offer_value} cashback`
                          : service.offer_type === "percentage" && service.offer_value
                            ? `${service.offer_value}% off`
                            : service.offer_type === "flat" && service.offer_value
                              ? `₹${service.offer_value} off`
                              : "Offer available"}
                    </div>
                  )}
                  {isInitialConsultation && (
                    <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-100/50 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white text-[11px] px-2 py-0.5">Offer</Badge>
                        <span className="text-sm text-emerald-900 dark:text-emerald-200">Pay ₹50 now • Get ₹50 credits</span>
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
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-emerald-600">
                      {service.price === 0 ? "Free" : `₹${service.price}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 shadow-sm hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20"
                    onClick={() => beginBooking(index)}
                  >
                    Book
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
            className="mt-6 border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-6 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl">Booking Flow</h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {bookingStep === "schedule"
                  ? "Step 1/4"
                  : bookingStep === "questions"
                    ? "Step 2/4"
                    : bookingStep === "auth"
                      ? "Step 3/4"
                      : "Step 4/4"}
              </Badge>
            </div>

            <div className="mt-3 rounded-lg border border-emerald-200 bg-background p-4 shadow-sm dark:border-emerald-500/25">
              <p className="text-sm text-muted-foreground">Selected service</p>
              <div className="mt-1 flex items-center justify-between">
                <p>{selectedService.name}</p>
                <p className="font-semibold text-emerald-600">
                  {selectedService.price === 0 ? "Free" : `₹${selectedService.price}`}
                </p>
              </div>
            </div>

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
              <QuestionsStep
                questionForm={questionForm}
                mandatoryQuestions={mandatoryQuestions}
                questionAnswers={questionAnswers}
                questionError={questionError}
                questionsLoading={questionsLoading}
                continueLabel={effectiveUser ? "Payment" : "Signup"}
                onSubmit={handleQuestionsSubmit}
                onChange={(field, value) => setQuestionForm((previous) => ({ ...previous, [field]: value }))}
                onQuestionAnswerChange={(questionId, value) =>
                  setQuestionAnswers((previous) => ({ ...previous, [questionId]: value }))
                }
              />
            )}

            {bookingStep === "auth" && (
              <AuthStep
                authMode={authMode}
                authForm={authForm}
                authError={authError}
                authSubmitting={authSubmitting}
                onSubmit={handleAuthSubmit}
                onModeToggle={() => setAuthMode((previous) => (previous === "signup" ? "login" : "signup"))}
                onChange={(field, value) => setAuthForm((previous) => ({ ...previous, [field]: value }))}
              />
            )}

            {bookingStep === "payment" && (
              <PaymentStep
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
                onChangeMockOutcome={(value) => setPaymentForm((previous) => ({ ...previous, mockOutcome: value }))}
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
