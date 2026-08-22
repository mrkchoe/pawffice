import { NextResponse } from "next/server";
import { createCalendarProvider } from "@/lib/arcade";
import { findOverlappingSlots } from "@/lib/scheduling/slots";
import type { DayAvailability, InteractionType } from "@/lib/types";

/**
 * POST /api/schedule
 *
 * 1. Uses Arcade (or mock) CalendarProvider for user busy times / event create
 * 2. Compares against dog/shelter availability from the request body
 *    (demo store or future Supabase rows)
 * 3. Returns top overlapping slots OR books a selected slot
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as "suggest" | "book";
    const userId = String(body.userId ?? "demo-alex");
    const mode = (body.calendarMode as "mock" | "arcade") ?? "mock";

    const calendar = createCalendarProvider({ userId, mode });

    if (action === "suggest") {
      const userAvailability = body.userAvailability as DayAvailability[];
      const dogAvailability = body.dogAvailability as DayAvailability[];

      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() + 2);
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + 14);

      // Arcade/mock: retrieve busy intervals from the user's calendar
      const busyTimes = await calendar.getBusyTimes(windowStart, windowEnd);

      const slots = findOverlappingSlots({
        userAvailability,
        dogAvailability,
        busyTimes,
        windowStart,
        windowEnd,
        limit: 3,
        source: mode,
      });

      return NextResponse.json({
        slots,
        provider: mode,
        busyCount: busyTimes.length,
        note:
          mode === "mock"
            ? "Using MockCalendarProvider. Set ARCADE_API_KEY + calendarMode=arcade to use Google Calendar via Arcade.dev."
            : "Using ArcadeCalendarProvider (Google Calendar tools).",
      });
    }

    if (action === "book") {
      const {
        dogName,
        shelterName,
        shelterEmail,
        shelterPhone,
        shelterAddress,
        interactionType,
        startsAt,
        endsAt,
        instructions,
      } = body as {
        dogName: string;
        shelterName: string;
        shelterEmail: string;
        shelterPhone: string;
        shelterAddress: string;
        interactionType: InteractionType;
        startsAt: string;
        endsAt: string;
        instructions?: string;
      };

      const title = `Meet ${dogName} — ${shelterName}`;
      const description = [
        `Dog: ${dogName}`,
        `Shelter: ${shelterName}`,
        `Interaction: ${interactionType}`,
        `Contact: ${shelterEmail} · ${shelterPhone}`,
        `Location: ${shelterAddress}`,
        instructions ? `Instructions: ${instructions}` : null,
        "",
        "Scheduled with Pawffice",
      ]
        .filter(Boolean)
        .join("\n");

      // Optional: ensure Arcade Google OAuth is complete before writing events
      if (calendar.ensureAuthorized) {
        const auth = await calendar.ensureAuthorized(userId);
        if (!auth.authorized) {
          return NextResponse.json(
            {
              error: "Calendar authorization required",
              authUrl: auth.authUrl,
            },
            { status: 401 },
          );
        }
      }

      const event = await calendar.createEvent({
        title,
        description,
        start: new Date(startsAt),
        end: new Date(endsAt),
        location: shelterAddress,
        attendeeEmails: shelterEmail ? [shelterEmail] : undefined,
      });

      return NextResponse.json({
        event: {
          id: event.id,
          title: event.title,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          htmlLink: event.htmlLink,
          provider: event.provider,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Scheduling failed",
      },
      { status: 500 },
    );
  }
}
