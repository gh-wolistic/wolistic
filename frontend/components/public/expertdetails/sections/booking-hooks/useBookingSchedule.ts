import { useCallback, useMemo, useState } from "react";

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const TIMING_WINDOWS = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
} as const;

type PreferredTiming = keyof typeof TIMING_WINDOWS;

export function useBookingSchedule(availabilityText: string) {
  const [preferredTiming, setPreferredTiming] = useState<PreferredTiming | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isImmediateBooking, setIsImmediateBooking] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const availability = useMemo(() => {
    const normalized = (availabilityText ?? "").toLowerCase();

    const matchedRange = normalized.match(
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
    );

    const defaultWeekdays = new Set<number>([1, 2, 3, 4, 5]);
    let weekdays = defaultWeekdays;

    if (matchedRange) {
      const startDay = WEEKDAY_MAP[matchedRange[1]];
      const endDay = WEEKDAY_MAP[matchedRange[2]];
      const derived = new Set<number>();

      if (startDay <= endDay) {
        for (let day = startDay; day <= endDay; day += 1) {
          derived.add(day);
        }
      } else {
        for (let day = startDay; day <= 6; day += 1) {
          derived.add(day);
        }
        for (let day = 0; day <= endDay; day += 1) {
          derived.add(day);
        }
      }

      if (derived.size > 0) {
        weekdays = derived;
      }
    }

    const matchedTime = normalized.match(
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/,
    );

    const to24Hour = (hourRaw: string, meridiem: string) => {
      const hour = Number(hourRaw);
      if (meridiem === "am") {
        return hour === 12 ? 0 : hour;
      }
      return hour === 12 ? 12 : hour + 12;
    };

    let startHour = 9;
    let endHour = 19;

    if (matchedTime) {
      startHour = to24Hour(matchedTime[1], matchedTime[3]);
      endHour = to24Hour(matchedTime[4], matchedTime[6]);
      if (endHour <= startHour) {
        endHour = startHour + 1;
      }
    }

    return {
      weekdays,
      startHour,
      endHour,
    };
  }, [availabilityText]);

  const availableTimeSlots = useMemo(() => {
    if (!preferredTiming) {
      return [] as string[];
    }

    const preferenceWindow = TIMING_WINDOWS[preferredTiming];
    const start = Math.max(availability.startHour, preferenceWindow.start);
    const end = Math.min(availability.endHour, preferenceWindow.end);

    if (end <= start) {
      return [] as string[];
    }

    const formatHour = (hour24: number) => {
      const suffix = hour24 >= 12 ? "PM" : "AM";
      const value = hour24 % 12 || 12;
      return `${value}:00 ${suffix}`;
    };

    const slots: string[] = [];
    for (let hour = start; hour < end; hour += 1) {
      slots.push(formatHour(hour));
    }
    return slots;
  }, [availability.endHour, availability.startHour, preferredTiming]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const isUnavailableDate = useCallback((date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (normalized < today) {
      return true;
    }
    return !availability.weekdays.has(date.getDay());
  }, [availability.weekdays, today]);

  const availableDayModifier = useCallback((date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return normalized >= today && availability.weekdays.has(date.getDay());
  }, [availability.weekdays, today]);

  const handleImmediateAvailability = useCallback(() => {
    setPreferredTiming(null);
    setSelectedDate(today);
    setSelectedTimeSlot("Immediate (within 30 mins)");
    setIsImmediateBooking(true);
    setScheduleError(null);
  }, [today]);

  const resetSchedule = useCallback(() => {
    setPreferredTiming(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setIsImmediateBooking(false);
    setScheduleError(null);
  }, []);

  return {
    preferredTiming,
    selectedDate,
    selectedTimeSlot,
    isImmediateBooking,
    scheduleError,
    availableTimeSlots,
    setPreferredTiming,
    setSelectedDate,
    setSelectedTimeSlot,
    setIsImmediateBooking,
    setScheduleError,
    isUnavailableDate,
    availableDayModifier,
    handleImmediateAvailability,
    resetSchedule,
  };
}
