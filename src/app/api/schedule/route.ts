import { NextResponse } from "next/server";
import {
  buildVisitDescription,
  CalendarAuthorizationError,
  resolveCalendarProvider,
  resolveEmailProvider,
} from "@/lib/arcade";
import { findOverlappingSlots } from "@/lib/scheduling/slots";
import type { DayAvailability, InteractionType } from "@/lib/types";

/**
 * Shelter-side scheduling via Arcade Google Calendar + Gmail.
 *
 * - suggest: ListEvents on *shelter* calendar filtered by dog ID → top free slots
 * - auth-status: shelter Google Calendar (+ optional Gmail) OAuth
 * - approve: CreateEvent tagged with dog ID + calendar invite + confirmation email
 *
 * WFH users do not connect Google Calendar.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as "auth-status" | "suggest" | "approve";
    const mode = (body.calendarMode as "mock" | "arcade") ?? "mock";
    const shelterArcadeUserId = String(
      body.shelterArcadeUserId ?? body.shelterEmail ?? "",
    );

    if (!shelterArcadeUserId) {
      return NextResponse.json(
        { error: "shelterArcadeUserId (shelter email) is required" },
        { status: 400 },
      );
    }

    const { provider: calendar, kind } = resolveCalendarProvider({
      shelterArcadeUserId,
      mode,
    });

    if (action === "auth-status") {
      const calAuth = await calendar.ensureAuthorized(shelterArcadeUserId);
      let emailAuthorized = true;
      let emailAuthUrl: string | undefined;
      if (kind === "arcade") {
        const email = resolveEmailProvider({
          shelterArcadeUserId,
          mode,
        }).provider;
        const emailAuth = await email.ensureAuthorized(shelterArcadeUserId);
        emailAuthorized = emailAuth.authorized;
        emailAuthUrl = emailAuth.authUrl;
      }
      const authorized = calAuth.authorized && emailAuthorized;
      return NextResponse.json({
        provider: kind,
        authorized,
        calendarAuthorized: calAuth.authorized,
        emailAuthorized,
        authUrl: calAuth.authUrl ?? emailAuthUrl ?? null,
      });
    }

    if (action === "suggest") {
      const dogId = String(body.dogId ?? "");
      if (!dogId) {
        return NextResponse.json({ error: "dogId is required" }, { status: 400 });
      }

      if (kind === "arcade") {
        const auth = await calendar.ensureAuthorized(shelterArcadeUserId);
        if (!auth.authorized) {
          return NextResponse.json(
            {
              error: "Shelter Google Calendar authorization required",
              code: "CALENDAR_AUTH_REQUIRED",
              authUrl: auth.authUrl ?? null,
              provider: kind,
              scope: "shelter",
            },
            { status: 401 },
          );
        }
      }

      const userAvailability = body.userAvailability as DayAvailability[];
      const dogAvailability = body.dogAvailability as DayAvailability[];

      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() + 2);
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + 14);

      // Shelter calendar busy times for this specific dog ID
      const busyTimes = await calendar.getBusyTimesForDog(
        dogId,
        windowStart,
        windowEnd,
      );

      const slots = findOverlappingSlots({
        userAvailability,
        dogAvailability,
        busyTimes,
        windowStart,
        windowEnd,
        limit: 3,
        source: kind,
      });

      return NextResponse.json({
        slots,
        provider: kind,
        dogId,
        busyCount: busyTimes.length,
        note:
          kind === "mock"
            ? `Mock shelter calendar busy times for ${dogId}.`
            : `Arcade ListEvents on shelter calendar filtered by ${dogId}.`,
      });
    }

    if (action === "approve") {
      const dogId = String(body.dogId ?? "");
      if (!dogId) {
        return NextResponse.json({ error: "dogId is required" }, { status: 400 });
      }

      if (kind === "arcade") {
        const auth = await calendar.ensureAuthorized(shelterArcadeUserId);
        if (!auth.authorized) {
          return NextResponse.json(
            {
              error: "Shelter Google Calendar authorization required",
              code: "CALENDAR_AUTH_REQUIRED",
              authUrl: auth.authUrl ?? null,
              provider: kind,
              scope: "shelter",
            },
            { status: 401 },
          );
        }
      }

      const {
        dogName,
        shelterName,
        shelterAddress,
        interactionType,
        startsAt,
        endsAt,
        userName,
        userEmail,
        instructions,
      } = body as {
        dogName: string;
        shelterName: string;
        shelterAddress: string;
        interactionType: InteractionType;
        startsAt: string;
        endsAt: string;
        userName: string;
        userEmail: string;
        instructions?: string;
      };

      const title = `Meet ${dogName} — ${shelterName}`;
      const description = buildVisitDescription({
        dogId,
        dogName,
        shelterName,
        interactionType,
        userName,
        userEmail,
        instructions,
      });

      // Create visit on shelter calendar + invite the matched user
      const event = await calendar.createDogEvent({
        dogId,
        title,
        description,
        start: new Date(startsAt),
        end: new Date(endsAt),
        location: shelterAddress,
        attendeeEmails: userEmail ? [userEmail] : undefined,
      });

      // Confirmation email from shelter Gmail (calendar invite also goes via attendees)
      const { provider: email } = resolveEmailProvider({
        shelterArcadeUserId,
        mode,
      });

      if (kind === "arcade") {
        const emailAuth = await email.ensureAuthorized(shelterArcadeUserId);
        if (!emailAuth.authorized) {
          return NextResponse.json(
            {
              error: "Shelter Gmail authorization required to email the user",
              code: "CALENDAR_AUTH_REQUIRED",
              authUrl: emailAuth.authUrl ?? null,
              provider: kind,
              scope: "shelter_email",
              event: {
                id: event.id,
                htmlLink: event.htmlLink,
                provider: event.provider,
              },
            },
            { status: 401 },
          );
        }
      }

      const when = new Date(startsAt).toLocaleString();
      const mail = await email.sendEmail({
        to: userEmail,
        subject: `Confirmed: meet ${dogName} at ${shelterName}`,
        body: [
          `Hi ${userName},`,
          "",
          `Your visit with ${dogName} was approved by ${shelterName}.`,
          "",
          `When: ${when}`,
          `Where: ${shelterAddress}`,
          `Dog ID: ${dogId}`,
          `Interaction: ${interactionType}`,
          "",
          event.htmlLink
            ? `Calendar invite: ${event.htmlLink}`
            : "A calendar invite has been sent to this email address.",
          "",
          "— Pawffice",
        ].join("\n"),
      });

      return NextResponse.json({
        event: {
          id: event.id,
          title: event.title,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          htmlLink: event.htmlLink,
          provider: event.provider,
          dogId,
        },
        email: { id: mail.id, provider: mail.provider },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);

    if (error instanceof CalendarAuthorizationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "CALENDAR_AUTH_REQUIRED",
          authUrl: error.authUrl ?? null,
          scope: "shelter",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scheduling failed",
      },
      { status: 500 },
    );
  }
}
