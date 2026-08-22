import type { TimeRange } from "@/lib/types";

export interface WeekSlot {
  id: string;
  label: string;
  range: TimeRange;
}

/** Four fixed daily windows, shown with their real times on the picker. */
export const WEEK_SLOTS: WeekSlot[] = [
  { id: "morning", label: "Morning", range: { start: "09:00", end: "11:00" } },
  { id: "midday", label: "Midday", range: { start: "11:00", end: "14:00" } },
  { id: "afternoon", label: "Afternoon", range: { start: "14:00", end: "17:00" } },
  { id: "evening", label: "Evening", range: { start: "17:00", end: "19:00" } },
];

function formatHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, "0")}${period}`;
}

/** e.g. "9AM– 11AM" -> compact "9–11AM" when both share a period. */
export function formatSlotTime(range: TimeRange) {
  const startPeriod = range.start.split(":").map(Number)[0] < 12 ? "AM" : "PM";
  const endPeriod = range.end.split(":").map(Number)[0] < 12 ? "AM" : "PM";
  if (startPeriod === endPeriod) {
    const startNum = formatHour(range.start).replace(startPeriod, "");
    return `${startNum}–${formatHour(range.end)}`;
  }
  return `${formatHour(range.start)}–${formatHour(range.end)}`;
}

/** Combine a specific calendar date with a slot's "HH:MM" time into a real Date. */
export function combineDateAndTime(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function isSameDay(a: Date, b: Date) {
  return isoDate(a) === isoDate(b);
}
