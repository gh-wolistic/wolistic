import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimingPreference = "morning" | "afternoon" | "evening";

type ScheduleStepProps = {
  isImmediateBooking: boolean;
  isOnline: boolean;
  preferredTiming: TimingPreference | null;
  selectedDate: Date | undefined;
  selectedTimeSlot: string | null;
  availableTimeSlots: string[];
  scheduleError: string | null;
  isUnavailableDate: (date: Date) => boolean;
  availableDayModifier: (date: Date) => boolean;
  onImmediateAvailability: () => void;
  onSelectTiming: (timing: TimingPreference) => void;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTimeSlot: (slot: string) => void;
  onContinue: () => void;
};

const TIMING_OPTIONS: ReadonlyArray<{ value: TimingPreference; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const SCHEDULE_STEPS = [
  { number: 1, label: "Choose timing" },
  { number: 2, label: "Choose date" },
  { number: 3, label: "Choose slot" },
] as const;

export function ScheduleStep({
  isImmediateBooking,
  isOnline,
  preferredTiming,
  selectedDate,
  selectedTimeSlot,
  availableTimeSlots,
  scheduleError,
  isUnavailableDate,
  availableDayModifier,
  onImmediateAvailability,
  onSelectTiming,
  onSelectDate,
  onSelectTimeSlot,
  onContinue,
}: ScheduleStepProps) {
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : null;

  const activeStep = !preferredTiming ? 1 : !selectedDate ? 2 : 3;

  return (
    <div className="mt-5 space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Step 1 of 5</p>
          <h4>{isImmediateBooking ? "Immediate Slot Selected" : "Choose a time that works for you"}</h4>
          {!isImmediateBooking ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a timing first. Then we will unlock matching dates and available slots one by one.
            </p>
          ) : null}
        </div>

        {!isImmediateBooking ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {SCHEDULE_STEPS.map((step) => {
              const isComplete = step.number < activeStep;
              const isCurrent = step.number === activeStep;

              return (
                <div
                  key={step.number}
                  className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                    isCurrent
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : isComplete
                        ? "border-teal-200 bg-teal-50/80 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200"
                        : "border-border/70 bg-background text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent || isComplete
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {step.number}
                    </span>
                    <span className="font-medium">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {isOnline && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-100/40 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/15">
          <p className="text-sm mb-2">Expert is currently online. Book immediate availability.</p>
          <Button size="sm" onClick={onImmediateAvailability} className="bg-emerald-600 hover:bg-emerald-700">
            Book Immediate Slot
          </Button>
        </div>
      )}

      {!isImmediateBooking && (
        <>
          <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4">
            <div>
              <p className="text-sm font-medium">1. Preferred Timing</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose morning, afternoon, or evening.</p>
            </div>

            <div className="space-y-2 sm:hidden">
              {TIMING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectTiming(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    preferredTiming === option.value
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {preferredTiming === option.value ? "Selected" : "Tap to select"}
                  </span>
                </button>
              ))}
            </div>

            <div className="hidden grid-cols-3 gap-2 sm:grid">
              {TIMING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={preferredTiming === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectTiming(option.value)}
                  className={preferredTiming === option.value ? "bg-emerald-600" : ""}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {!preferredTiming && !selectedTimeSlot && (
            <p className="text-sm text-muted-foreground">
              Choose preferred timing first to continue to date selection.
            </p>
          )}

          {preferredTiming ? (
            <div className="rounded-xl border border-border/60 bg-background p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">2. Select a date</p>
                  <p className="text-xs text-muted-foreground">
                    Showing dates for {preferredTiming} availability.
                  </p>
                </div>
                {selectedDateLabel ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {selectedDateLabel}
                  </span>
                ) : null}
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                className="w-full rounded-md border bg-background"
                disabled={(date) => !preferredTiming || isUnavailableDate(date)}
                modifiers={{ availableDay: availableDayModifier }}
                modifiersClassNames={{
                  availableDay: "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
                }}
              />
            </div>
          ) : null}

          {preferredTiming && selectedDate && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">3. Available Time Slots</h4>
                <p className="mt-1 text-xs text-muted-foreground">Pick the slot you want to book.</p>
              </div>
              {availableTimeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slots available for this preferred timing. Try another option.
                </p>
              ) : (
                <>
                  <div className="sm:hidden">
                    <Select value={selectedTimeSlot ?? undefined} onValueChange={onSelectTimeSlot}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Choose an available slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden grid-cols-2 gap-2 sm:grid">
                    {availableTimeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectTimeSlot(slot)}
                        className={selectedTimeSlot === slot ? "bg-emerald-600" : ""}
                      >
                        <Clock size={14} className="mr-1" />
                        {slot}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {selectedDate && selectedTimeSlot && (
        <div className="rounded-lg border bg-background p-3 text-sm">
          <p className="text-muted-foreground">Selected appointment</p>
          <p className="font-medium mt-1">
            <CalendarIcon size={14} className="inline mr-1" />
            {selectedDate.toLocaleDateString()} at {selectedTimeSlot}
          </p>
        </div>
      )}

      {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}

      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
