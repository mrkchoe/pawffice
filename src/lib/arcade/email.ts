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
