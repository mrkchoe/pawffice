/**
 * Arcade.dev calendar integration layer (shelter Google Calendar).
 *
 * Availability and booking run against the *shelter* calendar account.
 * Events are tagged with PAWFFICE_DOG_ID:<dogId> so each dog is unique.
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
  /** Required for dog-scoped shelter events. */
  dogId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  htmlLink?: string;
  provider: "mock" | "arcade";
  dogId?: string;
}

export interface CalendarAuthResult {
  authorized: boolean;
  authUrl?: string;
}

/**
 * Shelter calendar provider.
 * `arcadeUserId` is the shelter's Arcade identity (typically shelter email).
 */
export interface CalendarProvider {
  /**
   * Busy intervals for one dog on the shelter calendar
   * (events tagged with that dog's unique ID).
   */
  getBusyTimesForDog(
    dogId: string,
    start: Date,
    end: Date,
  ): Promise<TimeRange[]>;

  /** Creates a visit event tagged with the dog ID (+ optional attendee invite). */
  createDogEvent(event: CalendarEventInput): Promise<CalendarEvent>;

  /** Arcade OAuth for the shelter Google Calendar account. */
  ensureAuthorized(arcadeUserId?: string): Promise<CalendarAuthResult>;
}

export class CalendarAuthorizationError extends Error {
  readonly authUrl?: string;
  readonly code = "CALENDAR_AUTH_REQUIRED" as const;

  constructor(message: string, authUrl?: string) {
    super(message);
    this.name = "CalendarAuthorizationError";
    this.authUrl = authUrl;
  }
}

export interface EmailSendInput {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSendResult {
  id: string;
  provider: "mock" | "arcade";
}

export interface EmailProvider {
  ensureAuthorized(arcadeUserId?: string): Promise<CalendarAuthResult>;
  sendEmail(input: EmailSendInput): Promise<EmailSendResult>;
}
