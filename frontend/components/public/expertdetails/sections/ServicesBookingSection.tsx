"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isProfessionalOnline } from "@/lib/professionalSignals";
import { useSessionStore } from "@/store/session";
import type { DashboardRole } from "@/types/dashboard";
import type { ProfessionalProfile } from "@/types/professional";
import { login, selectRole, signup, updateOnboarding } from "@/components/public/data/authApi";
import {
  createPaymentOrderWithToken,
  verifyPaymentWithToken,
} from "@/components/public/data/paymentsApi";
import { ScheduleStep } from "./booking-steps/ScheduleStep";
import { QuestionsStep } from "./booking-steps/QuestionsStep";
import { AuthStep } from "./booking-steps/AuthStep";
import { PaymentStep } from "./booking-steps/PaymentStep";

type ServicesBookingSectionProps = {
  professional: ProfessionalProfile;
  bookingStartSignal: number;
};

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const TIMING_WINDOWS = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
} as const;

type BookingStep = "schedule" | "questions" | "auth" | "payment";
type AuthMode = "signup" | "login";

type PaymentStatus = "success" | "failure" | "pending";

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

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
  const setAuthSession = useSessionStore((state) => state.setAuthSession);
  const setRole = useSessionStore((state) => state.setRole);
  const setOnboardingComplete = useSessionStore((state) => state.setOnboardingComplete);

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
  const [preferredTiming, setPreferredTiming] = useState<"morning" | "afternoon" | "evening" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isImmediateBooking, setIsImmediateBooking] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [questionForm, setQuestionForm] = useState({
    currentWeight: "",
    height: "",
    age: "",
    physicalConditions: "",
    medicalConditions: "",
    wellnessGoal: "",
    expertQuestionOne: "",
    expertQuestionTwo: "",
  });
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState<{
    gstin: string;
    mockOutcome: PaymentStatus;
  }>({
    gstin: "",
    mockOutcome: "success",
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const bookingFlowRef = useRef<HTMLDivElement | null>(null);

  const selectedService = servicesToDisplay[selectedServiceIndex] ?? servicesToDisplay[0];
  const isInitialConsultationSelected =
    selectedService?.name?.trim().toLowerCase() === "initial consultation";
  const isOnline = isProfessionalOnline(professional);
  const needsMandatoryQuestions = !user || !user.onboardingComplete;

  const availability = useMemo(() => {
    const normalized = (professional.availability ?? "").toLowerCase();

    const matchedRange = normalized.match(
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
    );

    const defaultWeekdays = new Set<number>([1, 2, 3, 4, 5]);
    let weekdays = defaultWeekdays;

    if (matchedRange) {
      const startDay = WEEKDAY_MAP[matchedRange[1]];
      const endDay = WEEKDAY_MAP[matchedRange[2]];
      const derived = new Set<number>();

      if (startDay <= endDay) {
        for (let day = startDay; day <= endDay; day += 1) {
          derived.add(day);
        }
      } else {
        for (let day = startDay; day <= 6; day += 1) {
          derived.add(day);
        }
        for (let day = 0; day <= endDay; day += 1) {
          derived.add(day);
        }
      }

      if (derived.size > 0) {
        weekdays = derived;
      }
    }

    const matchedTime = normalized.match(
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/,
    );

    const to24Hour = (hourRaw: string, meridiem: string) => {
      const hour = Number(hourRaw);
      if (meridiem === "am") {
        return hour === 12 ? 0 : hour;
      }
      return hour === 12 ? 12 : hour + 12;
    };

    let startHour = 9;
    let endHour = 19;

    if (matchedTime) {
      startHour = to24Hour(matchedTime[1], matchedTime[3]);
      endHour = to24Hour(matchedTime[4], matchedTime[6]);
      if (endHour <= startHour) {
        endHour = startHour + 1;
      }
    }

    return {
      weekdays,
      startHour,
      endHour,
    };
  }, [professional.availability]);

  const availableTimeSlots = useMemo(() => {
    if (!preferredTiming) {
      return [] as string[];
    }

    const preferenceWindow = TIMING_WINDOWS[preferredTiming];
    const start = Math.max(availability.startHour, preferenceWindow.start);
    const end = Math.min(availability.endHour, preferenceWindow.end);

    if (end <= start) {
      return [] as string[];
    }

    const formatHour = (hour24: number) => {
      const suffix = hour24 >= 12 ? "PM" : "AM";
      const value = hour24 % 12 || 12;
      return `${value}:00 ${suffix}`;
    };

    const slots: string[] = [];
    for (let hour = start; hour < end; hour += 1) {
      slots.push(formatHour(hour));
    }
    return slots;
  }, [availability.endHour, availability.startHour, preferredTiming]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const subtotal = selectedService?.price ?? 0;
  const gstAmount = Number((subtotal * 0.18).toFixed(2));
  const platformFee = subtotal > 0 ? 49 : 0;
  const grandTotal = subtotal + gstAmount + platformFee;

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
      setPreferredTiming(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot(null);
      setIsImmediateBooking(false);
      setScheduleError(null);
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
      setPreferredTiming(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot(null);
      setIsImmediateBooking(false);
      setScheduleError(null);
    }
  }, [bookingStartSignal, initialConsultationIndex]);

  const isUnavailableDate = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (normalized < today) {
      return true;
    }
    return !availability.weekdays.has(date.getDay());
  };

  const availableDayModifier = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return normalized >= today && availability.weekdays.has(date.getDay());
  };

  const handleImmediateAvailability = () => {
    setPreferredTiming(null);
    setSelectedDate(today);
    setSelectedTimeSlot("Immediate (within 30 mins)");
    setIsImmediateBooking(true);
    setScheduleError(null);
  };

  const handleScheduleContinue = () => {
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
    setQuestionError(null);

    if (
      !questionForm.currentWeight ||
      !questionForm.height ||
      !questionForm.age ||
      !questionForm.expertQuestionOne ||
      !questionForm.expertQuestionTwo
    ) {
      setQuestionError("Please complete all mandatory questions before continuing.");
      return;
    }

    if (user?.id) {
      localStorage.setItem(
        `wolistic_booking_onboarding_${user.id}`,
        JSON.stringify({ ...questionForm, submittedAt: new Date().toISOString() }),
      );
    }

    if (!user) {
      setBookingStep("auth");
      return;
    }

    if (!user.onboardingComplete) {
      try {
        await updateOnboarding({ onboarding_complete: true });
        setOnboardingComplete(true);
      } catch {
        // Keep flow non-blocking for now.
      }
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

      try {
        await updateOnboarding({ onboarding_complete: true }, authResult.access_token);
        setOnboardingComplete(true);
      } catch {
        // Keep flow non-blocking for now.
      }

      setBookingStep("payment");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      setAuthError(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const redirectToPaymentStatus = (status: PaymentStatus, nextRoute = "/dashboard") => {
    const params = new URLSearchParams({
      status,
      next: nextRoute,
      username: professional.username,
      service: selectedService.name,
    });
    router.push(`/payment-status?${params.toString()}`);
  };

  const loadRazorpayScript = async () => {
    if (typeof window === "undefined") {
      return false;
    }

    if (window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const existingScript = document.getElementById("razorpay-checkout-script") as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);
    setPaymentSubmitting(true);

    if (grandTotal <= 0) {
      redirectToPaymentStatus("success");
      return;
    }

    try {
      const bookingReference = `bk_${professional.username}_${Date.now()}`;
      const order = await createPaymentOrderWithToken(
        {
        amount: grandTotal,
        currency: "INR",
        booking_reference: bookingReference,
        professional_username: professional.username,
        service_name: selectedService.name,
        customer_name: user?.name || authForm.name || undefined,
        customer_email: user?.email || authForm.email || undefined,
        },
        token ?? undefined,
      );

      if (order.mode === "mock") {
        const verifyResult = await verifyPaymentWithToken(
          {
            razorpay_order_id: order.orderId,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: "mock_signature",
            booking_reference: order.bookingReference,
            next_route: "/dashboard",
            professional_username: professional.username,
            service_name: selectedService.name,
            mock_status: paymentForm.mockOutcome,
          },
          token ?? undefined,
        );

        const mockStatus: PaymentStatus =
          verifyResult.status === "success" || verifyResult.status === "failure" || verifyResult.status === "pending"
            ? verifyResult.status
            : "pending";

        redirectToPaymentStatus(mockStatus, verifyResult.nextRoute);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout script.");
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amountSubunits,
        currency: order.currency,
        name: "Wolistic Wellness",
        description: `${selectedService.name} with ${professional.name}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || authForm.name || undefined,
          email: user?.email || authForm.email || undefined,
        },
        notes: {
          bookingReference: order.bookingReference,
          professionalUsername: professional.username,
        },
        handler: async (response) => {
          try {
            const verifyResult = await verifyPaymentWithToken(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_reference: order.bookingReference,
                next_route: "/dashboard",
                professional_username: professional.username,
                service_name: selectedService.name,
              },
              token ?? undefined,
            );

            const verifiedStatus: PaymentStatus =
              verifyResult.status === "success" || verifyResult.status === "failure" || verifyResult.status === "pending"
                ? verifyResult.status
                : "pending";

            redirectToPaymentStatus(verifiedStatus, verifyResult.nextRoute);
          } catch {
            redirectToPaymentStatus("pending");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentSubmitting(false);
            setPaymentError("Checkout was closed before payment completion.");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment. Please try again.";
      setPaymentSubmitting(false);
      setPaymentError(message);
      redirectToPaymentStatus("failure");
    }
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
                questionError={questionError}
                continueLabel={user ? "Payment" : "Signup"}
                onSubmit={handleQuestionsSubmit}
                onChange={(field, value) => setQuestionForm((previous) => ({ ...previous, [field]: value }))}
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
