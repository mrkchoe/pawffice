import type { Shelter } from "@/lib/types";

/** Saved Arcade user_id for a shelter, if the demo already prompted for it. */
export function getSavedShelterArcadeUserId(
  shelter: Pick<Shelter, "arcadeUserId">,
) {
  return shelter.arcadeUserId?.trim() || "";
}

/**
 * Demo helper: if no Arcade email is saved yet, prompt for the email of the
 * currently signed-in Arcade account, then persist it on the shelter.
 */
export function promptForShelterArcadeUserId(
  shelter: Shelter,
  save: (next: Shelter) => void,
): string | null {
  const existing = getSavedShelterArcadeUserId(shelter);
  const entered = window.prompt(
    existing
      ? `Arcade account email for this shelter calendar (currently ${existing}):`
      : "Enter the email of your signed-in Arcade account (used as Arcade user_id):",
    existing || "",
  );

  const email = entered?.trim();
  if (!email) return null;

  if (email !== existing) {
    save({ ...shelter, arcadeUserId: email });
  }
  return email;
}
