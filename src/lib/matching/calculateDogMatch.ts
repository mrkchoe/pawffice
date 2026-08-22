import type {
  DayAvailability,
  Dog,
  MatchResult,
  UserPreferences,
} from "@/lib/types";

function sizeScore(
  preferred: UserPreferences["preferredSize"],
  size: Dog["size"],
): { score: number; reason?: string } {
  if (preferred === "no_preference") {
    return { score: 100, reason: "You're open to any size" };
  }
  if (preferred === size) {
    return {
      score: 100,
      reason: `You prefer ${size} dogs`,
    };
  }
  const order = ["small", "medium", "large"] as const;
  const distance = Math.abs(order.indexOf(preferred) - order.indexOf(size));
  if (distance === 1) {
    return {
      score: 55,
      reason: `${capitalize(size)} is close to your ${preferred} preference`,
    };
  }
  return { score: 15 };
}

function energyScore(
  preferred: UserPreferences["preferredEnergy"],
  energy: Dog["energyLevel"],
  maxExercise: number,
  dogExercise: number,
): { score: number; reason?: string } {
  let score = 0;
  let reason: string | undefined;

  if (preferred === "no_preference") {
    score = 85;
    reason = "You're flexible on energy level";
  } else if (preferred === energy) {
    score = 100;
    reason = `Your activity level fits ${energy} energy`;
  } else {
    const order = ["low", "medium", "high"] as const;
    const distance = Math.abs(
      order.indexOf(preferred) - order.indexOf(energy),
    );
    score = distance === 1 ? 50 : 10;
  }

  // Exercise capacity adjustment within the energy bucket
  if (dogExercise <= maxExercise) {
    score = Math.min(100, score + 5);
    if (!reason) {
      reason = `You can provide the ${dogExercise} min of exercise needed`;
    }
  } else if (dogExercise > maxExercise + 20) {
    score = Math.max(0, score - 25);
  } else {
    score = Math.max(0, score - 10);
  }

  return { score, reason };
}

function availabilityOverlap(
  user: DayAvailability[],
  dog: DayAvailability[],
): { score: number; reason?: string; days: string[] } {
  const shared: string[] = [];

  for (const u of user) {
    const d = dog.find((x) => x.day === u.day);
    if (!d) continue;
    const overlaps = u.ranges.some((ur) =>
      d.ranges.some((dr) => rangesOverlap(ur.start, ur.end, dr.start, dr.end)),
    );
    if (overlaps) shared.push(capitalize(u.day));
  }

  if (shared.length === 0) return { score: 10, days: [] };
  if (shared.length === 1) {
    return {
      score: 55,
      reason: `You're both available ${shared[0]}`,
      days: shared,
    };
  }
  return {
    score: Math.min(100, 60 + shared.length * 12),
    reason: `You're both available ${shared.slice(0, 2).join(" and ")}${
      shared.length > 2 ? " afternoons" : " afternoons"
    }`,
    days: shared,
  };
}

function secondaryScore(
  prefs: UserPreferences,
  dog: Dog,
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  if (prefs.housingType === "apartment" || prefs.housingType === "condo") {
    if (dog.temperamentTags.includes("apartment-friendly") || dog.size !== "large") {
      score += 20;
      reasons.push(
        `${dog.name} is comfortable in ${prefs.housingType === "condo" ? "condos" : "apartments"}`,
      );
    } else if (dog.size === "large" && dog.energyLevel === "high") {
      score -= 20;
    }
  }

  if (prefs.hasYard && dog.size === "large") {
    score += 10;
    reasons.push("Your yard suits a larger dog");
  }

  if (!prefs.petsAllowed) {
    score -= 40;
  }

  const sharedTemps = dog.temperamentTags.filter((t) =>
    prefs.temperamentPreferences
      .map((x) => x.toLowerCase())
      .includes(t.toLowerCase()),
  );
  if (sharedTemps.length > 0) {
    score += 15;
    reasons.push(
      `Temperament overlap: ${sharedTemps.slice(0, 2).join(", ")}`,
    );
  }

  const interactionOverlap = dog.interactionTypes.filter((t) =>
    prefs.interestedIn.includes(t),
  );
  if (interactionOverlap.length > 0) {
    score += 10;
  } else {
    score -= 15;
  }

  if (prefs.dogExperience === "none" && dog.specialNeeds) {
    score -= 15;
  }
  if (prefs.dogExperience === "experienced" && dog.specialNeeds) {
    score += 10;
    reasons.push("Your experience helps with special needs");
  }

  if (dog.distanceMiles > prefs.maxDistanceMiles) {
    score -= 25;
  }

  return { score: clamp(score, 0, 100), reasons };
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Transparent match score (0–100).
 * Weights: size 35%, energy 35%, availability 20%, secondary 10%.
 */
export function calculateDogMatch(
  user: UserPreferences,
  dog: Dog,
): MatchResult {
  const size = sizeScore(user.preferredSize, dog.size);
  const energy = energyScore(
    user.preferredEnergy,
    dog.energyLevel,
    user.maxExerciseMinutes,
    dog.exerciseMinutes,
  );
  const availability = availabilityOverlap(user.availability, dog.availability);
  const secondary = secondaryScore(user, dog);

  const score = Math.round(
    size.score * 0.35 +
      energy.score * 0.35 +
      availability.score * 0.2 +
      secondary.score * 0.1,
  );

  const reasons = [
    size.reason,
    energy.reason
      ? energy.reason.includes(dog.name)
        ? energy.reason
        : energy.reason.replace(
            "Your activity level fits",
            `Your activity level fits ${dog.name}'s`,
          )
      : undefined,
    availability.reason,
    ...secondary.reasons,
  ].filter(Boolean) as string[];

  // Dedupe & keep top reasons
  const unique = [...new Set(reasons)].slice(0, 4);

  return { score: clamp(score, 0, 100), reasons: unique };
}
