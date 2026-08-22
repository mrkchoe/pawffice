import Arcade from "@arcadeai/arcadejs";

import type {
  CalendarAuthResult,
  EmailProvider,
  EmailSendInput,
  EmailSendResult,
} from "./types";

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

export function buildDashboardFeedbackLink(
  options: {
    baseUrl?: string;
    appointmentId?: string;
    dogId?: string;
  } = {},
) {
  const baseUrl =
    options.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
      message: "Arcade Google authorization is required before sending email.",
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

export class MockEmailProvider implements EmailProvider {
  async ensureAuthorized(): Promise<CalendarAuthResult> {
    return { authorized: true };
  }

  async sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    return {
      id: `mock-email-${Date.now()}`,
      provider: "mock",
    };
  }
}

export class ArcadeEmailProvider implements EmailProvider {
  private client: Arcade;
  private userId: string;

  constructor(userId: string, apiKey = process.env.ARCADE_API_KEY) {
    if (!apiKey) {
      throw new Error("ARCADE_API_KEY is required for ArcadeEmailProvider.");
    }

    this.client = new Arcade({ apiKey });
    this.userId = userId;
  }

  async ensureAuthorized(arcadeUserId = this.userId): Promise<CalendarAuthResult> {
    const auth = await this.client.auth.start(arcadeUserId, "google", {
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
    });

    if (auth.status !== "completed") {
      return {
        authorized: false,
        authUrl: auth.url ?? undefined,
      };
    }

    return { authorized: true };
  }

  async sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    const auth = await this.ensureAuthorized();
    if (!auth.authorized) {
      throw new Error("Arcade Gmail authorization is required.");
    }

    const result = await this.client.tools.execute({
      tool_name: "Gmail.SendEmail",
      user_id: this.userId,
      input: {
        to: [input.to],
        subject: input.subject,
        body: input.body,
      },
    });

    return {
      id: typeof result?.id === "string" ? result.id : `arcade-email-${Date.now()}`,
      provider: "arcade",
    };
  }
}
