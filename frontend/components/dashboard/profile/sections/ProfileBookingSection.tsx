import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  BookingQuestionTemplateInput,
  ProfessionalAvailabilityInput,
  ProfessionalEditorPayload,
  QuestionType,
} from "@/types/professional-editor";

type ProfileBookingSectionProps = {
  value: ProfessionalEditorPayload;
  defaultTimezone?: string;
  onAvailabilityChange: (items: ProfessionalAvailabilityInput[]) => void;
  onQuestionTemplatesChange: (items: BookingQuestionTemplateInput[]) => void;
};

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function createEmptyAvailability(timezone: string): ProfessionalAvailabilityInput {
  return {
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    timezone,
  };
}

function createQuestionTemplate(order: number): BookingQuestionTemplateInput {
  return {
    prompt: "",
    question_type: "text",
    display_order: order,
    is_required: true,
    is_active: true,
  };
}

export function ProfileBookingSection({
  value,
  defaultTimezone = "UTC",
  onAvailabilityChange,
  onQuestionTemplatesChange,
}: ProfileBookingSectionProps) {
  const availability = value.availability_slots;
  const questions = value.booking_question_templates;

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold tracking-tight text-white">Booking Setup</h2>
      <p className="mt-1 text-sm text-zinc-400">Configure consultation windows and mandatory intake prompts.</p>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-white">Availability Slots</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => onAvailabilityChange([...availability, createEmptyAvailability(defaultTimezone)])}
          >
            <Plus className="h-4 w-4" /> Add Slot
          </Button>
        </div>

        <div className="space-y-3">
          {availability.map((slot, index) => (
            <div
              key={`${slot.day_of_week}-${index}`}
              className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-2 sm:grid-cols-5"
            >
              <Select
                value={String(slot.day_of_week)}
                onValueChange={(val) => {
                  const next = [...availability];
                  next[index] = { ...slot, day_of_week: Number(val) };
                  onAvailabilityChange(next);
                }}
              >
                <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={slot.start_time.slice(0, 5)}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = { ...slot, start_time: event.target.value };
                  onAvailabilityChange(next);
                }}
              />
              <Input
                type="time"
                value={slot.end_time.slice(0, 5)}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = { ...slot, end_time: event.target.value };
                  onAvailabilityChange(next);
                }}
              />
              <Input
                value={slot.timezone}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = { ...slot, timezone: event.target.value };
                  onAvailabilityChange(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onAvailabilityChange(availability.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-white">Booking Questions</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => onQuestionTemplatesChange([...questions, createQuestionTemplate(questions.length + 1)])}
          >
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-300">Prompt</Label>
                  <Input
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                    value={question.prompt}
                    onChange={(event) => {
                      const next = [...questions];
                      next[index] = { ...question, prompt: event.target.value };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Answer Type</Label>
                  <Select
                    value={question.question_type ?? "text"}
                    onValueChange={(val) => {
                      const next = [...questions];
                      next[index] = { ...question, question_type: val as QuestionType };
                      onQuestionTemplatesChange(next);
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text (free-form)</SelectItem>
                      <SelectItem value="scale">Scale (1–10)</SelectItem>
                      <SelectItem value="choice">Multiple choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Order</Label>
                  <Input
                    type="number"
                    min={1}
                    className="rounded-xl border-white/10 bg-white/5 text-white"
                    value={question.display_order}
                    onChange={(event) => {
                      const next = [...questions];
                      next[index] = {
                        ...question,
                        display_order: Number(event.target.value || index + 1),
                      };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-6">
                  <span className="text-sm text-zinc-400">Required</span>
                  <Switch
                    checked={question.is_required}
                    onCheckedChange={(checked) => {
                      const next = [...questions];
                      next[index] = { ...question, is_required: checked };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                  <span className="text-sm text-zinc-400">Active</span>
                  <Switch
                    checked={question.is_active}
                    onCheckedChange={(checked) => {
                      const next = [...questions];
                      next[index] = { ...question, is_active: checked };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => onQuestionTemplatesChange(questions.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
