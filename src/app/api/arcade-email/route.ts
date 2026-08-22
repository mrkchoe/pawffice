import { NextResponse } from "next/server";
import {
  buildDashboardFeedbackLink,
  sendArcadeEmail,
} from "@/lib/arcade/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: "visit-followup" | "shelter-review";
      userId?: string;
      to?: string | string[];
      subject?: string;
      dogName?: string;
      shelterName?: string;
      shelterEmail?: string;
      appointmentDate?: string;
      interactionType?: string;
      feedbackUrl?: string;
      rating?: number;
      notes?: string;
      behaviorTags?: string[];
      baseUrl?: string;
      appointmentId?: string;
      dogId?: string;
    };

    const type = body.type ?? "visit-followup";
    const userId = body.userId ?? "demo-alex";
    const to = body.to ?? "alex@pawffice.demo";

    if (type === "visit-followup") {
      const feedbackUrl =
        body.feedbackUrl ??
        buildDashboardFeedbackLink({
          baseUrl: body.baseUrl,
          appointmentId: body.appointmentId,
          dogId: body.dogId,
        });

      const emailBody = [
        "Hi there,",
        "",
        `Thank you for spending time with ${body.dogName ?? "your dog companion"} during your Pawffice visit. We hope it went well and that you had a great experience.`,
        "",
        "We’d love to hear how the visit went so we can improve future matches and help the shelter better understand the dog.",
        "",
        `Leave your feedback here: ${feedbackUrl}`,
        "",
        "Thanks again for helping a dog feel safe, seen, and supported.",
        "",
        "— The Pawffice team",
      ].join("\n");

      const result = await sendArcadeEmail({
        userId,
        to,
        subject: body.subject ?? "Thanks for your Pawffice dog visit",
        body: emailBody,
      });

      return NextResponse.json(result, { status: result.sent ? 200 : 202 });
    }

    if (type === "shelter-review") {
      const reviewText = body.notes?.trim() || "No additional notes provided.";
      const behaviorTags = body.behaviorTags ?? [];
      const tagText = behaviorTags.length ? behaviorTags.join(", ") : "No tags selected";

      const emailBody = [
        "Hello,",
        "",
        "A Pawffice visit has been reviewed.",
        "",
        `Dog: ${body.dogName ?? "Unknown dog"}`,
        `Shelter: ${body.shelterName ?? "Unknown shelter"}`,
        `Visit date: ${body.appointmentDate ?? "N/A"}`,
        `Interaction: ${body.interactionType ?? "N/A"}`,
        `Rating: ${body.rating ?? "N/A"}/5`,
        `Behavior tags: ${tagText}`,
        "",
        "Behavior notes:",
        reviewText,
        "",
        "Thank you for helping match this dog with the right home.",
        "",
        "— Pawffice",
      ].join("\n");

      const destination = body.shelterEmail ?? "jordan@bayviewfriends.demo";
      const result = await sendArcadeEmail({
        userId,
        to: destination,
        subject: `New Pawffice review for ${body.dogName ?? "a dog"}`,
        body: emailBody,
      });

      return NextResponse.json(result, { status: result.sent ? 200 : 202 });
    }

    return NextResponse.json(
      { error: "Unsupported email type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Arcade email route failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Arcade email failed",
      },
      { status: 500 },
    );
  }
}
