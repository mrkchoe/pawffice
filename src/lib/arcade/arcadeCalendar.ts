import Arcade from "@arcadeai/arcadejs";
import {
  CalendarAuthorizationError,
  type CalendarAuthResult,
  type CalendarEvent,
  type CalendarEventInput,
  type CalendarProvider,
  type TimeRange,
} from "./types";
import { dogIdTag, eventBelongsToDog, extractDogIdFromText } from "./dogTags";

/**
 * Shelter Google Calendar via Arcade.
 *
 * Arcade user_id = shelter account (e.g. hello@bayviewfriends.demo).
 * Events are filtered / created with PAWFFICE_DOG_ID:<dogId>.
 */
export class ArcadeCalendarProvider implements CalendarProvider {
  private client: Arcade;
  private arcadeUserId: string;

  constructor(arcadeUserId: string, apiKey = process.env.ARCADE_API_KEY) {
    if (!apiKey) {
      throw new Error(
        "ARCADE_API_KEY is required for ArcadeCalendarProvider. Use MockCalendarProvider for demo mode.",
      );
    }
    this.client = new Arcade({ apiKey });
    this.arcadeUserId = arcadeUserId;
  }

  async ensureAuthorized(
    arcadeUserId = this.arcadeUserId,
  ): Promise<CalendarAuthResult> {
    const listAuth = await this.client.tools.authorize({
      tool_name: "GoogleCalendar.ListEvents",
      user_id: arcadeUserId,
    });
    if (listAuth.status !== "completed") {
      return { authorized: false, authUrl: listAuth.url ?? undefined };
    }

    const createAuth = await this.client.tools.authorize({
      tool_name: "GoogleCalendar.CreateEvent",
      user_id: arcadeUserId,
    });
    if (createAuth.status !== "completed") {
      return { authorized: false, authUrl: createAuth.url ?? undefined };
    }

    return { authorized: true };
  }

  async getBusyTimesForDog(
    dogId: string,
    start: Date,
    end: Date,
  ): Promise<TimeRange[]> {
    try {
      const response = await this.client.tools.execute({
        tool_name: "GoogleCalendar.ListEvents",
        user_id: this.arcadeUserId,
        input: {
          calendar_id: "primary",
          min_end_datetime: toArcadeDateTime(start),
          max_start_datetime: toArcadeDateTime(end),
        },
      });

      await this.throwIfAuthorizationNeeded(response, "GoogleCalendar.ListEvents");
      assertToolSuccess(response, "GoogleCalendar.ListEvents");
      const output = normalizeToolOutput(response);
      const events = extractRawEvents(output);

      return events
        .filter((e) => eventBelongsToDog(dogId, e.summary, e.description))
        .map((e) => ({
          start: new Date(e.start),
          end: new Date(e.end),
        }))
        .filter(
          (r) =>
            !Number.isNaN(r.start.getTime()) && !Number.isNaN(r.end.getTime()),
        );
    } catch (error) {
      throw await this.rewriteAuthError(error);
    }
  }

  async createDogEvent(event: CalendarEventInput): Promise<CalendarEvent> {
    try {
      const description = event.description.includes(dogIdTag(event.dogId))
        ? event.description
        : `${dogIdTag(event.dogId)}\n${event.description}`;

      const response = await this.client.tools.execute({
        tool_name: "GoogleCalendar.CreateEvent",
        user_id: this.arcadeUserId,
        input: {
          calendar_id: "primary",
          summary: event.title,
          description,
          start_datetime: toArcadeDateTime(event.start),
          end_datetime: toArcadeDateTime(event.end),
          location: event.location,
          attendee_emails: event.attendeeEmails,
        },
      });

      await this.throwIfAuthorizationNeeded(
        response,
        "GoogleCalendar.CreateEvent",
      );
      assertToolSuccess(response, "GoogleCalendar.CreateEvent");
      const output = normalizeToolOutput(response);
      const id =
        (typeof output.id === "string" && output.id) ||
        (typeof output.event_id === "string" && output.event_id) ||
        `arcade-${Date.now()}`;

      return {
        id,
        title: event.title,
        description,
        start: event.start,
        end: event.end,
        htmlLink:
          typeof output.html_link === "string"
            ? output.html_link
            : typeof output.htmlLink === "string"
              ? output.htmlLink
              : undefined,
        provider: "arcade",
        dogId:
          extractDogIdFromText(description) ??
          event.dogId,
      };
    } catch (error) {
      throw await this.rewriteAuthError(error);
    }
  }

  private async throwIfAuthorizationNeeded(
    response: unknown,
    toolName: string,
  ) {
    const r = response as {
      output?: {
        authorization?: { url?: string; status?: string };
        error?: { kind?: string; message?: string };
      };
    };

    const auth = r.output?.authorization;
    if (auth && auth.status && auth.status !== "completed") {
      throw new CalendarAuthorizationError(
        `${toolName} requires shelter Google Calendar authorization`,
        auth.url,
      );
    }

    const kind = r.output?.error?.kind ?? "";
    const message = r.output?.error?.message ?? "";
    if (kind.includes("AUTH") || /authorization required|403/i.test(message)) {
      const ensured = await this.ensureAuthorized();
      throw new CalendarAuthorizationError(
        `${toolName} requires shelter Google Calendar authorization`,
        ensured.authUrl,
      );
    }
  }

  private async rewriteAuthError(error: unknown): Promise<never> {
    if (error instanceof CalendarAuthorizationError) throw error;

    const message =
      error instanceof Error ? error.message : String(error ?? "");
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;

    if (status === 403 || /authorization required|403/i.test(message)) {
      const ensured = await this.ensureAuthorized();
      throw new CalendarAuthorizationError(
        "Shelter Google Calendar authorization required",
        ensured.authUrl,
      );
    }

    throw error instanceof Error ? error : new Error(message);
  }
}

function toArcadeDateTime(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

function assertToolSuccess(response: unknown, toolName: string) {
  const r = response as {
    success?: boolean;
    output?: { error?: { message?: string; kind?: string } };
  };
  if (r.success === false || r.output?.error) {
    throw new Error(
      r.output?.error?.message ||
        `${toolName} failed (${r.output?.error?.kind ?? "unknown"})`,
    );
  }
}

function normalizeToolOutput(response: unknown): Record<string, unknown> {
  const r = response as {
    output?: { value?: unknown } | unknown;
    value?: unknown;
  };

  let candidate: unknown = response;
  if (r.output && typeof r.output === "object" && "value" in r.output) {
    candidate = (r.output as { value?: unknown }).value;
  } else if (r.output !== undefined) {
    candidate = r.output;
  } else if (r.value !== undefined) {
    candidate = r.value;
  }

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

function extractRawEvents(output: Record<string, unknown>): Array<{
  start: string;
  end: string;
  summary?: string;
  description?: string;
}> {
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
        summary:
          typeof e.summary === "string"
            ? e.summary
            : typeof e.title === "string"
              ? e.title
              : undefined,
        description:
          typeof e.description === "string" ? e.description : undefined,
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
