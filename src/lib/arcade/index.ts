import { ArcadeCalendarProvider } from "./arcadeCalendar";
import { ArcadeEmailProvider, MockEmailProvider } from "./email";
import { MockCalendarProvider } from "./mockCalendar";
import type { CalendarProvider, EmailProvider } from "./types";

/**
 * Shelter calendar factory.
 * Arcade mode never silently falls back to mock.
 */
export function resolveCalendarProvider(options: {
  /** Shelter Arcade identity (shelter email). */
  shelterArcadeUserId: string;
  mode?: "mock" | "arcade";
}): { provider: CalendarProvider; kind: "mock" | "arcade" } {
  const requested =
    options.mode ??
    (process.env.ARCADE_CALENDAR_MODE as "mock" | "arcade" | undefined) ??
    "mock";

  if (requested === "arcade") {
    if (!process.env.ARCADE_API_KEY?.trim()) {
      throw new Error(
        "Arcade mode requires ARCADE_API_KEY. Set it in .env.local, or switch to Mock mode.",
      );
    }
    return {
      provider: new ArcadeCalendarProvider(options.shelterArcadeUserId),
      kind: "arcade",
    };
  }

  return { provider: new MockCalendarProvider(), kind: "mock" };
}

export function resolveEmailProvider(options: {
  shelterArcadeUserId: string;
  mode?: "mock" | "arcade";
}): { provider: EmailProvider; kind: "mock" | "arcade" } {
  const requested =
    options.mode ??
    (process.env.ARCADE_CALENDAR_MODE as "mock" | "arcade" | undefined) ??
    "mock";

  if (requested === "arcade") {
    if (!process.env.ARCADE_API_KEY?.trim()) {
      throw new Error(
        "Arcade mode requires ARCADE_API_KEY for email. Switch to Mock mode for the demo.",
      );
    }
    return {
      provider: new ArcadeEmailProvider(options.shelterArcadeUserId),
      kind: "arcade",
    };
  }

  return { provider: new MockEmailProvider(), kind: "mock" };
}

/** @deprecated use resolveCalendarProvider — kept for scripts */
export function createCalendarProvider(options: {
  userId: string;
  mode?: "mock" | "arcade";
}): CalendarProvider {
  return resolveCalendarProvider({
    shelterArcadeUserId: options.userId,
    mode: options.mode,
  }).provider;
}

export type {
  CalendarProvider,
  CalendarEvent,
  CalendarEventInput,
  CalendarAuthResult,
  TimeRange,
  EmailProvider,
} from "./types";
export { CalendarAuthorizationError } from "./types";
export { MockCalendarProvider } from "./mockCalendar";
export { ArcadeCalendarProvider } from "./arcadeCalendar";
export { MockEmailProvider, ArcadeEmailProvider } from "./email";
export { dogIdTag, buildVisitDescription } from "./dogTags";
export {
  getSavedShelterArcadeUserId,
  promptForShelterArcadeUserId,
} from "./shelterUser";
