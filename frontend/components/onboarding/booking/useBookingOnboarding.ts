import { useEffect, useState } from "react";

import {
  getBookingQuestions,
  submitBookingAnswers,
  type BookingQuestion,
} from "@/components/public/data/bookingApi";

type SubmitArgs = {
  professionalUsername: string;
  userId: string;
};

type UseBookingOnboardingArgs = {
  showBookingFlow: boolean;
  professionalUsername: string;
  token?: string;
};

export function useBookingOnboarding({
  showBookingFlow,
  professionalUsername,
  token,
}: UseBookingOnboardingArgs) {
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
  const [questionsResolved, setQuestionsResolved] = useState(false);
  const [hasSubmittedMandatoryQuestions, setHasSubmittedMandatoryQuestions] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    if (!showBookingFlow) {
      setQuestionsResolved(false);
      return;
    }

    let cancelled = false;

    const loadMandatoryQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsResolved(false);
      setQuestionError(null);

      try {
        const payload = await getBookingQuestions(professionalUsername, token);
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
          setQuestionsResolved(true);
        }
      }
    };

    void loadMandatoryQuestions();

    return () => {
      cancelled = true;
    };
  }, [professionalUsername, showBookingFlow, token]);

  const needsMandatoryQuestions = mandatoryQuestions.length > 0 && !hasSubmittedMandatoryQuestions;

  const persistQuestionAnswers = async ({ professionalUsername: username, userId: uid }: SubmitArgs) => {
    setQuestionError(null);

    if (!token) {
      setQuestionError("Please sign in before continuing.");
      return { ok: false as const, reason: "missing_auth" as const };
    }

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
        token,
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

    return { ok: true as const };
  };

  return {
    questionForm,
    mandatoryQuestions,
    questionAnswers,
    questionsLoading,
    questionsResolved,
    hasSubmittedMandatoryQuestions,
    needsMandatoryQuestions,
    questionError,
    setQuestionForm,
    setQuestionAnswers,
    setQuestionError,
    persistQuestionAnswers,
  };
}