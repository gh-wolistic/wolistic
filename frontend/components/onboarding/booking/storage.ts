const BOOKING_FLOW_DRAFT_KEY = "wolistic_booking_flow_draft";

export type PersistedBookingDraft = {
  professionalUsername: string;
  serviceIndex: number;
  bookingStep: "auth" | "payment" | "user-onboarding";
  authMode: "signup" | "login";
  preferredTiming: "morning" | "afternoon" | "evening" | null;
  selectedDateIso: string | null;
  selectedTimeSlot: string | null;
  isImmediateBooking: boolean;
  questionForm: {
    currentWeight: string;
    height: string;
    age: string;
    physicalConditions: string;
    medicalConditions: string;
    wellnessGoal: string;
  };
  questionAnswers: Record<number, string>;
};

export function persistBookingFlowDraft(draft: PersistedBookingDraft): void {
  window.sessionStorage.setItem(BOOKING_FLOW_DRAFT_KEY, JSON.stringify(draft));
}

export function readBookingFlowDraft(): PersistedBookingDraft | null {
  const raw = window.sessionStorage.getItem(BOOKING_FLOW_DRAFT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedBookingDraft;
  } catch {
    window.sessionStorage.removeItem(BOOKING_FLOW_DRAFT_KEY);
    return null;
  }
}

export function clearBookingFlowDraft(): void {
  window.sessionStorage.removeItem(BOOKING_FLOW_DRAFT_KEY);
}