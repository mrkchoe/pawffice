/** Embedded in shelter Google Calendar events so busy times / visits map to a dog. */
export const DOG_ID_TAG_PREFIX = "PAWFFICE_DOG_ID:";

export function dogIdTag(dogId: string) {
  return `${DOG_ID_TAG_PREFIX}${dogId}`;
}

export function extractDogIdFromText(...parts: Array<string | null | undefined>) {
  const blob = parts.filter(Boolean).join("\n");
  const match = blob.match(/PAWFFICE_DOG_ID:([^\s\n]+)/);
  return match?.[1] ?? null;
}

export function eventBelongsToDog(
  dogId: string,
  summary?: string | null,
  description?: string | null,
) {
  const tag = dogIdTag(dogId);
  return Boolean(
    (summary && summary.includes(tag)) ||
      (description && description.includes(tag)),
  );
}

export function buildVisitDescription(options: {
  dogId: string;
  dogName: string;
  shelterName: string;
  interactionType: string;
  userName: string;
  userEmail: string;
  instructions?: string;
}) {
  return [
    dogIdTag(options.dogId),
    `Dog: ${options.dogName} (${options.dogId})`,
    `Shelter: ${options.shelterName}`,
    `Visitor: ${options.userName} <${options.userEmail}>`,
    `Interaction: ${options.interactionType}`,
    options.instructions ? `Instructions: ${options.instructions}` : null,
    "",
    "Scheduled with Pawffice — shelter calendar",
  ]
    .filter(Boolean)
    .join("\n");
}
