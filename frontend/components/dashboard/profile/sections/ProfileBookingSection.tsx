import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  BookingQuestionTemplateInput,
  ProfessionalAvailabilityInput,
  ProfessionalEditorPayload,
} from "@/types/professional-editor";

type ProfileBookingSectionProps = {
  value: ProfessionalEditorPayload;
  onAvailabilityChange: (items: ProfessionalAvailabilityInput[]) => void;
  onQuestionTemplatesChange: (items: BookingQuestionTemplateInput[]) => void;
};

function createEmptyAvailability(): ProfessionalAvailabilityInput {
  return {
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    timezone: "UTC",
  };
}

function createQuestionTemplate(order: number): BookingQuestionTemplateInput {
  return {
    prompt: "",
    display_order: order,
    is_required: true,
    is_active: true,
  };
}

export function ProfileBookingSection({
  value,
  onAvailabilityChange,
  onQuestionTemplatesChange,
}: ProfileBookingSectionProps) {
  const availability = value.availability_slots;
  const questions = value.booking_question_templates;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Booking Setup</h2>
      <p className="mt-1 text-sm text-zinc-600">Configure consultation windows and mandatory intake prompts.</p>

      <div className="mt-4 rounded-lg border border-zinc-200 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-900">Availability Slots</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAvailabilityChange([...availability, createEmptyAvailability()])}
          >
            <Plus className="h-4 w-4" /> Add Slot
          </Button>
        </div>

        <div className="space-y-3">
          {availability.map((slot, index) => (
            <div key={`${slot.day_of_week}-${index}`} className="grid gap-2 rounded-md bg-zinc-50 p-2 sm:grid-cols-5">
              <Input
                type="number"
                min={0}
                max={6}
                value={slot.day_of_week}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = { ...slot, day_of_week: Number(event.target.value || 0) };
                  onAvailabilityChange(next);
                }}
              />
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

      <div className="mt-4 rounded-lg border border-zinc-200 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-900">Booking Questions</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onQuestionTemplatesChange([...questions, createQuestionTemplate(questions.length + 1)])}
          >
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="rounded-md bg-zinc-50 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Prompt</Label>
                  <Input
                    value={question.prompt}
                    onChange={(event) => {
                      const next = [...questions];
                      next[index] = { ...question, prompt: event.target.value };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    min={1}
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
                  <span className="text-sm text-zinc-600">Required</span>
                  <Switch
                    checked={question.is_required}
                    onCheckedChange={(checked) => {
                      const next = [...questions];
                      next[index] = { ...question, is_required: checked };
                      onQuestionTemplatesChange(next);
                    }}
                  />
                  <span className="text-sm text-zinc-600">Active</span>
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
