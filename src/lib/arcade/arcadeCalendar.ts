import Arcade from "@arcadeai/arcadejs";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarProvider,
  TimeRange,
} from "./types";

/**
 * ArcadeCalendarProvider
 *
 * WHAT ARCADE AUTH DOES:
 * Arcade.auth.start(userId, "google", { scopes }) begins Google OAuth.
 * Arcade stores/refreshes tokens so this app never handles Google credentials.
 *
 * WHICH TOOLS ARE INVOKED:
 * - GoogleCalendar.ListEvents → busy times for availability comparison
 * - GoogleCalendar.CreateEvent → writes "Meet [Dog] — [Shelter]" on the user's calendar
 *
 * WHAT DATA COMES BACK:
 * Tool execute responses include event IDs, times, and optional html links.
 *
 * HOW THE APP USES IT:
 * Scheduling API compares busy times against shelter/dog availability in Supabase
 * (or the demo store), then creates the chosen slot via createEvent.
 *
 * Requires ARCADE_API_KEY. If missing, factory falls back to MockCalendarProvider.
 */
export class ArcadeCalendarProvider implements CalendarProvider {
  private client: Arcade;
  private userId: string;

  constructor(userId: string, apiKey = process.env.ARCADE_API_KEY) {
    if (!apiKey) {
      throw new Error(
        "ARCADE_API_KEY is required for ArcadeCalendarProvider. Use MockCalendarProvider for demo mode.",
      );
    }
    this.client = new Arcade({ apiKey });
    this.userId = userId;
  }

  /**
   * Starts Google OAuth via Arcade for Calendar scopes.
   * Returns an auth URL if the user still needs to consent.
   */
  async ensureAuthorized(userId = this.userId) {
    // Arcade authentication: kicks off (or resumes) Google OAuth for this user.
    const authResponse = await this.client.auth.start(userId, "google", {
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    if (authResponse.status !== "completed") {
      return {
        authorized: false,
        authUrl: authResponse.url ?? undefined,
      };
    }

    return { authorized: true };
  }

  async getBusyTimes(start: Date, end: Date): Promise<TimeRange[]> {
    // External tool: GoogleCalendar.ListEvents
    // Returns events in the window; we treat them as busy intervals.
    const response = await this.client.tools.execute({
      tool_name: "GoogleCalendar.ListEvents",
      user_id: this.userId,
      input: {
        calendar_id: "primary",
        min_end_datetime: start.toISOString(),
        max_start_datetime: end.toISOString(),
      },
    });

    const output = normalizeToolOutput(response);
    const events = extractEvents(output);

    return events
      .map((e) => ({
        start: new Date(e.start),
        end: new Date(e.end),
      }))
      .filter((r) => !Number.isNaN(r.start.getTime()) && !Number.isNaN(r.end.getTime()));
  }

  async createEvent(event: CalendarEventInput): Promise<CalendarEvent> {
    // External tool: GoogleCalendar.CreateEvent
    const response = await this.client.tools.execute({
      tool_name: "GoogleCalendar.CreateEvent",
      user_id: this.userId,
      input: {
        calendar_id: "primary",
        summary: event.title,
        description: event.description,
        start_datetime: event.start.toISOString(),
        end_datetime: event.end.toISOString(),
        location: event.location,
        attendee_emails: event.attendeeEmails,
      },
    });

    const output = normalizeToolOutput(response);
    const id =
      (typeof output.id === "string" && output.id) ||
      (typeof output.event_id === "string" && output.event_id) ||
      `arcade-${Date.now()}`;

    return {
      id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      htmlLink:
        typeof output.html_link === "string"
          ? output.html_link
          : typeof output.htmlLink === "string"
            ? output.htmlLink
            : undefined,
      provider: "arcade",
    };
  }
}

function normalizeToolOutput(response: unknown): Record<string, unknown> {
  // Arcade tool responses typically nest useful fields under `output` / `value`.
  const r = response as {
    output?: unknown;
    value?: unknown;
  };
  const candidate = r.output ?? r.value ?? response;
  if (typeof candidate === "string") {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      return { raw: candidate };
    }
  }
  if (candidate && typeof candidate === "object") {
    return candidate as Record<string, unknown>;
  }
  return {};
}

function extractEvents(
  output: Record<string, unknown>,
): Array<{ start: string; end: string }> {
  const list =
    (Array.isArray(output.events) && output.events) ||
    (Array.isArray(output.items) && output.items) ||
    (Array.isArray(output) && (output as unknown[])) ||
    [];

  return list
    .map((item) => {
      const e = item as Record<string, unknown>;
      return {
        start: coerceDateField(e.start ?? e.start_datetime ?? e.startDateTime),
        end: coerceDateField(e.end ?? e.end_datetime ?? e.endDateTime),
      };
    })
    .filter((e) => e.start && e.end);
}

function coerceDateField(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const obj = value as { dateTime?: string; date?: string };
    return obj.dateTime || obj.date || "";
  }
  return "";
}
