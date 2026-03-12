import { useEffect, useState } from "react";

import {
  getBookingQuestions,
  submitBookingAnswers,
  type BookingQuestion,
} from "@/components/public/data/bookingApi";
import { updateOnboarding } from "@/components/public/data/authApi";

type SubmitArgs = {
  professionalUsername: string;
  userId: string;
};

type UseMandatoryQuestionsArgs = {
  showBookingFlow: boolean;
  professionalUsername: string;
  userId?: string;
  onboardingComplete?: boolean;
  token?: string;
  onOnboardingMarked: () => void;
};

export function useMandatoryQuestions({
  showBookingFlow,
  professionalUsername,
  userId,
  onboardingComplete,
  token,
  onOnboardingMarked,
}: UseMandatoryQuestionsArgs) {
  const [questionForm, setQuestionForm] = useState({
    currentWeight: "",
    height: "",
    age: "",
    physicalConditions: "",
    medicalConditions: "",
    wellnessGoal: "",
  });
  const [mandatoryQuestions, setMandatoryQuestions] = useState<BookingQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [hasSubmittedMandatoryQuestions, setHasSubmittedMandatoryQuestions] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    if (!showBookingFlow) {
      return;
    }

    let cancelled = false;

    const loadMandatoryQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionError(null);

      try {
        const payload = await getBookingQuestions(professionalUsername, userId);
        if (cancelled) {
          return;
        }

        setMandatoryQuestions(payload.questions);
        setHasSubmittedMandatoryQuestions(payload.already_answered);
        setQuestionAnswers((previous) => {
          const next: Record<number, string> = {};

          payload.questions.forEach((question) => {
            next[question.id] = previous[question.id] ?? "";
          });

          return next;
        });
      } catch {
        if (!cancelled) {
          setQuestionError("Unable to load required questions. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setQuestionsLoading(false);
        }
      }
    };

    void loadMandatoryQuestions();

    return () => {
      cancelled = true;
    };
  }, [professionalUsername, showBookingFlow, userId]);

  const needsMandatoryQuestions =
    mandatoryQuestions.length > 0 && !hasSubmittedMandatoryQuestions;

  const persistQuestionAnswers = async ({ professionalUsername: username, userId: uid }: SubmitArgs) => {
    setQuestionError(null);

    const missingMandatoryAnswer = mandatoryQuestions
      .filter((question) => question.is_required)
      .some((question) => !(questionAnswers[question.id] ?? "").trim());

    if (missingMandatoryAnswer) {
      setQuestionError("Please complete all mandatory questions before continuing.");
      return { ok: false as const, reason: "missing_required" as const };
    }

    localStorage.setItem(
      `wolistic_booking_onboarding_${uid}`,
      JSON.stringify({ ...questionForm, submittedAt: new Date().toISOString() }),
    );

    try {
      await submitBookingAnswers({
        professionalUsername: username,
        userId: uid,
        answers: mandatoryQuestions.map((question) => ({
          question_id: question.id,
          answer: (questionAnswers[question.id] ?? "").trim(),
        })),
      });
      setHasSubmittedMandatoryQuestions(true);
    } catch {
      setQuestionError("Unable to save answers right now. Please try again.");
      return { ok: false as const, reason: "save_failed" as const };
    }

    if (!onboardingComplete) {
      try {
        await updateOnboarding({ onboarding_complete: true }, token ?? undefined);
        onOnboardingMarked();
      } catch {
        // Keep flow non-blocking for now.
      }
    }

    return { ok: true as const };
  };

  return {
    questionForm,
    mandatoryQuestions,
    questionAnswers,
    questionsLoading,
    hasSubmittedMandatoryQuestions,
    needsMandatoryQuestions,
    questionError,
    setQuestionForm,
    setQuestionAnswers,
    setQuestionError,
    persistQuestionAnswers,
  };
}
