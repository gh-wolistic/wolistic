import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

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
  return (
    <div className="mt-5 space-y-4">
      <h4>{isImmediateBooking ? "Immediate Slot Selected" : "Select Preferred Timing, Date & Time"}</h4>

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
          <div className="space-y-2">
            <h4 className="text-sm">Preferred Timing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              Choose preferred timing first to see matching available dates and slots.
            </p>
          )}

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

          {preferredTiming && selectedDate && (
            <div className="space-y-3">
              <h4 className="text-sm">Available Time Slots</h4>
              {availableTimeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slots available for this preferred timing. Try another option.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
