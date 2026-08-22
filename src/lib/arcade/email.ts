import Arcade from "@arcadeai/arcadejs";
import {
  CalendarAuthorizationError,
  type CalendarAuthResult,
  type EmailProvider,
  type EmailSendInput,
  type EmailSendResult,
} from "./types";

/**
 * Shelter Gmail via Arcade — confirmation emails after match approval.
 * Tool: Gmail.SendEmail (recipient / subject / body).
 */
export class ArcadeEmailProvider implements EmailProvider {
  private client: Arcade;
  private arcadeUserId: string;

  constructor(arcadeUserId: string, apiKey = process.env.ARCADE_API_KEY) {
    if (!apiKey) {
      throw new Error("ARCADE_API_KEY is required for ArcadeEmailProvider.");
    }
    this.client = new Arcade({ apiKey });
    this.arcadeUserId = arcadeUserId;
  }

  async ensureAuthorized(
    arcadeUserId = this.arcadeUserId,
  ): Promise<CalendarAuthResult> {
    const auth = await this.client.tools.authorize({
      tool_name: "Gmail.SendEmail",
      user_id: arcadeUserId,
    });
    if (auth.status !== "completed") {
      return { authorized: false, authUrl: auth.url ?? undefined };
    }
    return { authorized: true };
  }

  async sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    try {
      const response = await this.client.tools.execute({
        tool_name: "Gmail.SendEmail",
        user_id: this.arcadeUserId,
        input: {
          recipient: input.to,
          subject: input.subject,
          body: input.body,
        },
      });

      const r = response as {
        success?: boolean;
        output?: {
          value?: { id?: string };
          authorization?: { url?: string; status?: string };
          error?: { message?: string };
        };
      };

      if (
        r.output?.authorization?.status &&
        r.output.authorization.status !== "completed"
      ) {
        throw new CalendarAuthorizationError(
          "Gmail authorization required to email the matched user",
          r.output.authorization.url,
        );
      }

      if (r.success === false || r.output?.error) {
        throw new Error(r.output?.error?.message || "Gmail.SendEmail failed");
      }

      const value = r.output?.value;
      return {
        id:
          (value && typeof value.id === "string" && value.id) ||
          `arcade-mail-${Date.now()}`,
        provider: "arcade",
      };
    } catch (error) {
      if (error instanceof CalendarAuthorizationError) throw error;
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      if (/authorization required|403/i.test(message)) {
        const auth = await this.ensureAuthorized();
        throw new CalendarAuthorizationError(
          "Gmail authorization required to email the matched user",
          auth.authUrl,
        );
      }
      throw error instanceof Error ? error : new Error(message);
    }
  }
}

export class MockEmailProvider implements EmailProvider {
  async ensureAuthorized() {
    return { authorized: true as const };
  }

  async sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    console.info("[MockEmailProvider]", input.to, input.subject);
    return { id: `mock-mail-${Date.now()}`, provider: "mock" };
  }
}

export type ArcadeEmailPayload = {
  userId: string;
  to: string | string[];
  subject: string;
  body: string;
  cc?: string[];
};

export type ArcadeEmailResult = {
  sent: boolean;
  status: "sent" | "skipped" | "auth_required";
  message?: string;
  authUrl?: string;
  result?: unknown;
};

/** Deep-link into the WFH dashboard visit-feedback section. */
export function buildDashboardFeedbackLink(
  options: {
    baseUrl?: string;
    appointmentId?: string;
    dogId?: string;
  } = {},
) {
  const baseUrl =
    options.baseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const url = new URL("/dashboard", baseUrl);
  url.hash = "visit-feedback";

  if (options.appointmentId) {
    url.searchParams.set("appointmentId", options.appointmentId);
  }
  if (options.dogId) {
    url.searchParams.set("dogId", options.dogId);
  }

  return url.toString();
}

/**
 * One-shot Gmail send used by /api/arcade-email (visit follow-up / shelter review).
 * Separate from ArcadeEmailProvider, which is used by the schedule approval flow.
 */
export async function sendArcadeEmail(
  payload: ArcadeEmailPayload,
): Promise<ArcadeEmailResult> {
  const apiKey = process.env.ARCADE_API_KEY;

  if (!apiKey) {
    return {
      sent: false,
      status: "skipped",
      message:
        "ARCADE_API_KEY is not set. Add it to .env.local or your deployment environment.",
    };
  }

  const client = new Arcade({ apiKey });

  const authResult = await client.auth.start(payload.userId, "google", {
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  });

  if (authResult.status !== "completed") {
    return {
      sent: false,
      status: "auth_required",
      authUrl: authResult.url ?? undefined,
      message:
        "Arcade Google authorization is required before sending email.",
    };
  }

  try {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const response = await client.tools.execute({
      tool_name: "Gmail.SendEmail",
      user_id: payload.userId,
      input: {
        to: recipients,
        subject: payload.subject,
        body: payload.body,
        ...(payload.cc && payload.cc.length > 0 ? { cc: payload.cc } : {}),
      },
    });

    return {
      sent: true,
      status: "sent",
      result: response,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email-send failure.";

    return {
      sent: false,
      status: "skipped",
      message,
    };
  }
}
