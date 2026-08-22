/**
 * Arcade.dev calendar integration layer.
 *
 * Arcade handles OAuth for Google Calendar and exposes toolkit tools such as:
 * - GoogleCalendar.ListEvents
 * - GoogleCalendar.CreateEvent
 * - GoogleCalendar.FindTimeSlotsWhenEveryoneIsFree
 *
 * Application code depends only on CalendarProvider so we can ship a working
 * MockCalendarProvider for the hackathon demo and swap in Arcade later.
 */

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface CalendarEventInput {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  attendeeEmails?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  htmlLink?: string;
  provider: "mock" | "arcade";
}

export interface CalendarProvider {
  /** Returns busy intervals on the user's calendar for the window. */
  getBusyTimes(start: Date, end: Date): Promise<TimeRange[]>;

  /** Creates a calendar event on the authenticated user's calendar. */
  createEvent(event: CalendarEventInput): Promise<CalendarEvent>;

  /**
   * Optional: start Arcade OAuth for Google Calendar.
   * Mock provider returns a completed stub.
   */
  ensureAuthorized?(userId: string): Promise<{
    authorized: boolean;
    authUrl?: string;
  }>;
}
