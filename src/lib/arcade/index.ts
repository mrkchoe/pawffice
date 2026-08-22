import { ArcadeCalendarProvider } from "./arcadeCalendar";
import { MockCalendarProvider } from "./mockCalendar";
import type { CalendarProvider } from "./types";

/**
 * Factory: use Arcade when ARCADE_API_KEY is set and mode is "arcade",
 * otherwise the mock provider (default for local hackathon demos).
 */
export function createCalendarProvider(options: {
  userId: string;
  mode?: "mock" | "arcade";
}): CalendarProvider {
  const mode =
    options.mode ??
    (process.env.ARCADE_CALENDAR_MODE as "mock" | "arcade" | undefined) ??
    "mock";

  if (mode === "arcade" && process.env.ARCADE_API_KEY) {
    return new ArcadeCalendarProvider(options.userId);
  }

  return new MockCalendarProvider();
}

export type { CalendarProvider, CalendarEvent, CalendarEventInput, TimeRange } from "./types";
export { MockCalendarProvider } from "./mockCalendar";
export { ArcadeCalendarProvider } from "./arcadeCalendar";
