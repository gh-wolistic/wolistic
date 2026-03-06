import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type QuestionForm = {
  currentWeight: string;
  height: string;
  age: string;
  physicalConditions: string;
  medicalConditions: string;
  wellnessGoal: string;
  expertQuestionOne: string;
  expertQuestionTwo: string;
};

type QuestionsStepProps = {
  questionForm: QuestionForm;
  questionError: string | null;
  continueLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof QuestionForm, value: string) => void;
};

export function QuestionsStep({ questionForm, questionError, continueLabel, onSubmit, onChange }: QuestionsStepProps) {
  return (
    <form className="mt-5 space-y-4 rounded-xl border border-emerald-300 bg-background p-5 shadow-md dark:border-emerald-500/30" onSubmit={onSubmit}>
      <div className="border-b border-emerald-100 pb-3 dark:border-emerald-500/25">
        <h4>Mandatory Questions</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Complete these required details before moving to payment.
        </p>
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
            required
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
            required
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
            required
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

      <div className="space-y-1.5">
        <Label htmlFor="expert-question-1">
          Expert Question 1: What outcome do you expect in the next 4-6 weeks?
        </Label>
        <Textarea
          id="expert-question-1"
          className="border border-border"
          value={questionForm.expertQuestionOne}
          onChange={(event) => onChange("expertQuestionOne", event.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expert-question-2">
          Expert Question 2: Any routine, food, or schedule constraints we should consider?
        </Label>
        <Textarea
          id="expert-question-2"
          className="border border-border"
          value={questionForm.expertQuestionTwo}
          onChange={(event) => onChange("expertQuestionTwo", event.target.value)}
          required
        />
      </div>

      {questionError && <p className="text-sm text-destructive">{questionError}</p>}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
        Continue to {continueLabel}
      </Button>
    </form>
  );
}
