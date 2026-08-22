import test from "node:test";
import assert from "node:assert/strict";

import { calculateDogMatch } from "./calculateDogMatch";
import type { Dog, UserPreferences } from "@/lib/types";

const prefs: UserPreferences = {
  userId: "demo-alex",
  wfhSchedule: "Remote Mon–Fri",
  availability: [{ day: "tuesday", ranges: [{ start: "12:00", end: "17:00" }] }],
  housingType: "apartment",
  petsAllowed: true,
  hasYard: false,
  dogExperience: "some",
  preferredSize: "medium",
  preferredEnergy: "medium",
  maxExerciseMinutes: 60,
  interestedIn: ["day_fostering", "dog_walking", "trial_adoption"],
  temperamentPreferences: ["gentle", "apartment-friendly", "curious"],
  mustBeGoodWith: ["kids", "strangers"],
  maxDistanceMiles: 15,
};

const baseDog: Dog = {
  id: "dog-scout",
  shelterId: "shelter-bayview",
  name: "Scout",
  photoUrl: "https://example.com/scout.jpg",
  ageYears: 3,
  breed: "Terrier Mix",
  sex: "male",
  size: "large",
  energyLevel: "high",
  temperamentTags: ["playful", "curious"],
  description: "Scout is a bubbly pup who needs a lot of engagement.",
  exerciseMinutes: 90,
  goodWithDogs: true,
  goodWithCats: false,
  goodWithChildren: true,
  goodWithStrangers: true,
  specialNeeds: "Needs training",
  interactionTypes: ["weekend_fostering"],
  availability: [{ day: "tuesday", ranges: [{ start: "09:00", end: "11:00" }] }],
  location: "San Francisco, CA",
  distanceMiles: 18,
  rating: 4.5,
  shelterNotes: "Very social and responsive in new settings.",
  experienceLog: [],
};

test("reviewed dogs earn a small dynamic match boost from positive behavior feedback", () => {
  const reviewedDog: Dog = {
    ...baseDog,
    reviewSummary: {
      averageRating: 5,
      reviewCount: 3,
      behaviorTags: ["gentle", "responsive"],
      recentNote: "Calm indoors and easy to take on walks.",
    },
  };

  const baseScore = calculateDogMatch(prefs, baseDog).score;
  const reviewedScore = calculateDogMatch(prefs, reviewedDog).score;

  assert.ok(reviewedScore >= baseScore, "Positive reviews should improve the match signal.");
  assert.ok(reviewedScore > baseScore, "A strong review should produce a meaningful boost.");
});
