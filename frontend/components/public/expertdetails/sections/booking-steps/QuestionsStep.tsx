import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingQuestion } from "@/components/public/data/bookingApi";

type QuestionForm = {
  currentWeight: string;
  height: string;
  age: string;
  physicalConditions: string;
  medicalConditions: string;
  wellnessGoal: string;
};

type QuestionsStepProps = {
  questionForm: QuestionForm;
  mandatoryQuestions: BookingQuestion[];
  questionAnswers: Record<number, string>;
  questionError: string | null;
  questionsLoading: boolean;
  continueLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof QuestionForm, value: string) => void;
  onQuestionAnswerChange: (questionId: number, value: string) => void;
};

export function QuestionsStep({
  questionForm,
  mandatoryQuestions,
  questionAnswers,
  questionError,
  questionsLoading,
  continueLabel,
  onSubmit,
  onChange,
  onQuestionAnswerChange,
}: QuestionsStepProps) {
  return (
    <form className="mt-5 space-y-4 rounded-xl border border-emerald-300 bg-background p-5 shadow-md dark:border-emerald-500/30" onSubmit={onSubmit}>
      <div className="border-b border-emerald-100 pb-3 dark:border-emerald-500/25">
        <h4>Mandatory Questions</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Complete these required details before moving to payment.
        </p>
      </div>

      {questionsLoading ? (
        <p className="text-sm text-muted-foreground">Loading required questions...</p>
      ) : (
        <div className="space-y-3">
          {mandatoryQuestions.map((question, index) => (
            <div key={question.id} className="space-y-1.5">
              <Label htmlFor={`expert-question-${question.id}`}>
                Expert Question {index + 1}: {question.prompt}
              </Label>
              <Textarea
                id={`expert-question-${question.id}`}
                className="border border-border"
                value={questionAnswers[question.id] ?? ""}
                onChange={(event) => onQuestionAnswerChange(question.id, event.target.value)}
                required={question.is_required}
              />
            </div>
          ))}
        </div>
      )}

      <div className="border-b border-emerald-100 pb-3 pt-2 dark:border-emerald-500/25">
        <h4>Optional Health Details</h4>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="current-weight">Current Weight (kg)</Label>
          <Input
            id="current-weight"
            type="number"
            className="border border-border"
            value={questionForm.currentWeight}
            onChange={(event) => onChange("currentWeight", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            className="border border-border"
            value={questionForm.height}
            onChange={(event) => onChange("height", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            className="border border-border"
            value={questionForm.age}
            onChange={(event) => onChange("age", event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="physical-conditions">Physical Conditions</Label>
        <Textarea
          id="physical-conditions"
          className="border border-border"
          value={questionForm.physicalConditions}
          onChange={(event) => onChange("physicalConditions", event.target.value)}
          placeholder="Any physical concerns, injuries, or limitations"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="medical-conditions">Medical Conditions</Label>
        <Textarea
          id="medical-conditions"
          className="border border-border"
          value={questionForm.medicalConditions}
          onChange={(event) => onChange("medicalConditions", event.target.value)}
          placeholder="Any diagnosed medical conditions"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wellness-goal">Primary Wellness Goal</Label>
        <Textarea
          id="wellness-goal"
          className="border border-border"
          value={questionForm.wellnessGoal}
          onChange={(event) => onChange("wellnessGoal", event.target.value)}
          placeholder="What do you want to achieve from this consultation?"
        />
      </div>

      {questionError && <p className="text-sm text-destructive">{questionError}</p>}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
        Continue to {continueLabel}
      </Button>
    </form>
  );
}
