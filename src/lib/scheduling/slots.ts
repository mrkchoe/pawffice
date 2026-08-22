import type { DayAvailability, SuggestedSlot, TimeRange as LibTimeRange } from "@/lib/types";
import type { TimeRange } from "@/lib/arcade/types";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Find overlapping free slots between:
 * - user weekly availability (profile)
 * - dog/shelter weekly availability (DB)
 * - user's calendar busy times (Arcade or mock)
 */
export function findOverlappingSlots(options: {
  userAvailability: DayAvailability[];
  dogAvailability: DayAvailability[];
  busyTimes: TimeRange[];
  windowStart: Date;
  windowEnd: Date;
  slotMinutes?: number;
  limit?: number;
  source?: "mock" | "arcade";
}): SuggestedSlot[] {
  const slotMinutes = options.slotMinutes ?? 60;
  const limit = options.limit ?? 3;
  const source = options.source ?? "mock";
  const suggestions: SuggestedSlot[] = [];

  const cursor = new Date(options.windowStart);
  cursor.setMinutes(0, 0, 0);

  while (cursor < options.windowEnd && suggestions.length < limit) {
    const dayName = DAY_NAMES[cursor.getDay()];
    const userDay = options.userAvailability.find((d) => d.day === dayName);
    const dogDay = options.dogAvailability.find((d) => d.day === dayName);

    if (userDay && dogDay) {
      for (const ur of userDay.ranges) {
        for (const dr of dogDay.ranges) {
          const overlapStart = maxTime(ur.start, dr.start);
          const overlapEnd = minTime(ur.end, dr.end);
          if (overlapStart >= overlapEnd) continue;

          let slot = combine(cursor, overlapStart);
          const rangeEnd = combine(cursor, overlapEnd);

          while (
            addMinutes(slot, slotMinutes) <= rangeEnd &&
            suggestions.length < limit
          ) {
            const slotEnd = addMinutes(slot, slotMinutes);
            if (
              slot >= options.windowStart &&
              !isBusy(slot, slotEnd, options.busyTimes)
            ) {
              suggestions.push({
                startsAt: slot.toISOString(),
                endsAt: slotEnd.toISOString(),
                label: formatLabel(slot, slotEnd),
                source,
              });
            }
            slot = addMinutes(slot, 30);
          }
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return suggestions;
}

function isBusy(start: Date, end: Date, busy: TimeRange[]) {
  return busy.some((b) => start < b.end && b.start < end);
}

function combine(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

function maxTime(a: string, b: string) {
  return a > b ? a : b;
}

function minTime(a: string, b: string) {
  return a < b ? a : b;
}

function formatLabel(start: Date, end: Date) {
  const day = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${day} · ${start.toLocaleTimeString("en-US", opts)} – ${end.toLocaleTimeString("en-US", opts)}`;
}

export function toLibBusy(busy: TimeRange[]): LibTimeRange[] {
  return busy.map((b) => ({
    start: b.start.toISOString(),
    end: b.end.toISOString(),
  }));
}
