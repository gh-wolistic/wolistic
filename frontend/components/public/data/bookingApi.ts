import type { ProfessionalProfile } from "@/types/professional";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

export type BookingQuestion = {
  id: number;
  prompt: string;
  display_order: number;
  is_required: boolean;
};

export type BookingQuestionsResult = {
  questions: BookingQuestion[];
  already_answered: boolean;
};

export type BookingHistoryItem = {
  booking_reference: string;
  professional_username: string;
  service_name: string;
  status: string;
  scheduled_for: string | null;
  is_immediate: boolean;
  created_at: string;
  payment_status: string | null;
};

export type BookingHistoryResult = {
  latest_booking: BookingHistoryItem | null;
  next_booking: BookingHistoryItem | null;
  immediate_bookings: BookingHistoryItem[];
  upcoming_bookings: BookingHistoryItem[];
  past_bookings: BookingHistoryItem[];
};

export async function getBookingQuestions(
  professionalUsername: ProfessionalProfile["username"],
  token?: string,
): Promise<BookingQuestionsResult> {
  const response = await fetch(
    `${API_BASE}/booking/questions/${encodeURIComponent(professionalUsername)}`,
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load booking questions (${response.status})`);
  }

  return (await response.json()) as BookingQuestionsResult;
}

export async function submitBookingAnswers(payload: {
  professionalUsername: ProfessionalProfile["username"];
  token: string;
  answers: Array<{ question_id: number; answer: string }>;
}): Promise<{ saved: boolean; already_answered: boolean }> {
  const response = await fetch(
    `${API_BASE}/booking/questions/${encodeURIComponent(payload.professionalUsername)}/responses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${payload.token}`,
      },
      body: JSON.stringify({
        answers: payload.answers,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to save booking answers (${response.status})`);
  }

  return (await response.json()) as { saved: boolean; already_answered: boolean };
}

export async function getBookingHistory(token: string): Promise<BookingHistoryResult> {
  const response = await fetch(`${API_BASE}/booking/history/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load booking history (${response.status})`);
  }

  return (await response.json()) as BookingHistoryResult;
}
