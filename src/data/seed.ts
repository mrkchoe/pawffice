import type {
  DayAvailability,
  Dog,
  DogExperienceEntry,
  Shelter,
  UserPreferences,
} from "@/lib/types";

const weekdays: DayAvailability[] = [
  { day: "monday", ranges: [{ start: "10:00", end: "16:00" }] },
  { day: "tuesday", ranges: [{ start: "10:00", end: "16:00" }] },
  { day: "wednesday", ranges: [{ start: "10:00", end: "16:00" }] },
  { day: "thursday", ranges: [{ start: "10:00", end: "16:00" }] },
  { day: "friday", ranges: [{ start: "10:00", end: "15:00" }] },
];

const weekendHeavy: DayAvailability[] = [
  { day: "saturday", ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "sunday", ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "tuesday", ranges: [{ start: "13:00", end: "17:00" }] },
  { day: "thursday", ranges: [{ start: "13:00", end: "17:00" }] },
];

export const DEMO_SHELTERS: Shelter[] = [
  {
    id: "shelter-bayview",
    name: "Bayview Animal Friends",
    email: "hello@bayviewfriends.demo",
    phone: "(415) 555-0142",
    address: "120 Harbor Way",
    city: "San Francisco, CA",
    description:
      "A community shelter focused on daytime fostering and gentle trial visits for remote workers.",
    availability: weekdays,
    ownerUserId: "demo-shelter",
  },
  {
    id: "shelter-oakridge",
    name: "Oakridge Rescue Collective",
    email: "visits@oakridgerescue.demo",
    phone: "(510) 555-0198",
    address: "88 Maple Court",
    city: "Oakland, CA",
    description:
      "Small-batch rescue with energetic pups who thrive with afternoon companions.",
    availability: weekendHeavy,
    ownerUserId: "demo-shelter",
  },
];

/** Visually distinct Unsplash dog photos for the demo. */
const DEMO_DOGS_BASE = [
  {
    id: "dog-luna",
    shelterId: "shelter-bayview",
    name: "Luna",
    photoUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1000&fit=crop",
    ageYears: 3,
    breed: "Labrador Mix",
    sex: "female" as const,
    size: "medium" as const,
    energyLevel: "medium" as const,
    temperamentTags: ["gentle", "curious", "apartment-friendly"],
    description:
      "Luna naps under desks, then perks up for afternoon walks. Great first daytime foster.",
    exerciseMinutes: 45,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: null,
    interactionTypes: ["day_fostering", "dog_walking", "trial_adoption"] as const,
    availability: weekdays,
    location: "San Francisco, CA",
    distanceMiles: 3.2,
  },
  {
    id: "dog-milo",
    shelterId: "shelter-oakridge",
    name: "Milo",
    photoUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=1000&fit=crop",
    ageYears: 2,
    breed: "Beagle",
    sex: "male" as const,
    size: "small" as const,
    energyLevel: "high" as const,
    temperamentTags: ["playful", "vocal", "snuggly"],
    description:
      "Milo needs short bursts of play between Zoom calls. Perfect for walkers who like adventure.",
    exerciseMinutes: 75,
    goodWithDogs: true,
    goodWithCats: false,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: null,
    interactionTypes: ["dog_walking", "day_fostering", "weekend_fostering"] as const,
    availability: weekendHeavy,
    location: "Oakland, CA",
    distanceMiles: 8.5,
  },
  {
    id: "dog-biscuit",
    shelterId: "shelter-bayview",
    name: "Biscuit",
    photoUrl:
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&h=1000&fit=crop",
    ageYears: 7,
    breed: "Corgi Mix",
    sex: "male" as const,
    size: "small" as const,
    energyLevel: "low" as const,
    temperamentTags: ["calm", "loyal", "low-maintenance"],
    description:
      "A soft-spoken coworker who prefers couch meetings and gentle neighborhood strolls.",
    exerciseMinutes: 25,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: "Mild arthritis — short walks preferred",
    interactionTypes: ["day_fostering", "trial_adoption", "adoption"] as const,
    availability: weekdays,
    location: "San Francisco, CA",
    distanceMiles: 2.1,
  },
  {
    id: "dog-nova",
    shelterId: "shelter-oakridge",
    name: "Nova",
    photoUrl:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=1000&fit=crop",
    ageYears: 1,
    breed: "Husky Mix",
    sex: "female" as const,
    size: "large" as const,
    energyLevel: "high" as const,
    temperamentTags: ["athletic", "smart", "talkative"],
    description:
      "Nova thrives with active fosters who can carve out a long lunch break for trails.",
    exerciseMinutes: 90,
    goodWithDogs: true,
    goodWithCats: false,
    goodWithChildren: false,
    goodWithStrangers: false,
    specialNeeds: null,
    interactionTypes: ["weekend_fostering", "dog_walking", "trial_adoption"] as const,
    availability: weekendHeavy,
    location: "Oakland, CA",
    distanceMiles: 11.0,
  },
  {
    id: "dog-olive",
    shelterId: "shelter-bayview",
    name: "Olive",
    photoUrl:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=1000&fit=crop",
    ageYears: 4,
    breed: "Poodle Mix",
    sex: "female" as const,
    size: "medium" as const,
    energyLevel: "medium" as const,
    temperamentTags: ["affectionate", "clever", "hypoallergenic"],
    description:
      "Olive settles into a home office quickly and loves puzzle toys during deep-work blocks.",
    exerciseMinutes: 50,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: null,
    interactionTypes: [
      "day_fostering",
      "weekend_fostering",
      "trial_adoption",
      "adoption",
    ] as const,
    availability: weekdays,
    location: "San Francisco, CA",
    distanceMiles: 4.7,
  },
  {
    id: "dog-duke",
    shelterId: "shelter-oakridge",
    name: "Duke",
    photoUrl:
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=1000&fit=crop",
    ageYears: 5,
    breed: "German Shepherd",
    sex: "male" as const,
    size: "large" as const,
    energyLevel: "medium" as const,
    temperamentTags: ["protective", "focused", "loyal"],
    description:
      "Duke does best with experienced handlers and a yard for evening wind-downs.",
    exerciseMinutes: 60,
    goodWithDogs: false,
    goodWithCats: false,
    goodWithChildren: true,
    goodWithStrangers: false,
    specialNeeds: "Needs a quiet intro to new people",
    interactionTypes: ["weekend_fostering", "trial_adoption", "adoption"] as const,
    availability: weekendHeavy,
    location: "Oakland, CA",
    distanceMiles: 9.3,
  },
  {
    id: "dog-pepper",
    shelterId: "shelter-bayview",
    name: "Pepper",
    photoUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=1000&fit=crop",
    ageYears: 2,
    breed: "Terrier Mix",
    sex: "female" as const,
    size: "small" as const,
    energyLevel: "medium" as const,
    temperamentTags: ["spunky", "friendly", "portable"],
    description:
      "Pepper fits apartment life and loves mid-day enrichment walks between meetings.",
    exerciseMinutes: 40,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: null,
    interactionTypes: ["dog_walking", "day_fostering", "trial_adoption"] as const,
    availability: weekdays,
    location: "San Francisco, CA",
    distanceMiles: 1.8,
  },
  {
    id: "dog-harbor",
    shelterId: "shelter-oakridge",
    name: "Harbor",
    photoUrl:
      "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=1000&fit=crop",
    ageYears: 6,
    breed: "Golden Retriever",
    sex: "male" as const,
    size: "large" as const,
    energyLevel: "low" as const,
    temperamentTags: ["patient", "soft", "family-oriented"],
    description:
      "Harbor is a gentle giant looking for calm companionship and eventual adoption.",
    exerciseMinutes: 35,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithChildren: true,
    goodWithStrangers: true,
    specialNeeds: null,
    interactionTypes: ["day_fostering", "trial_adoption", "adoption"] as const,
    availability: [
      ...weekdays,
      { day: "saturday", ranges: [{ start: "10:00", end: "14:00" }] },
    ],
    location: "Oakland, CA",
    distanceMiles: 7.4,
  },
] satisfies Omit<Dog, "shelterNotes" | "experienceLog" | "interactionTypes">[] &
  { interactionTypes: readonly string[] }[];

const SHELTER_NOTES: Record<
  string,
  { shelterNotes: string; experienceLog: DogExperienceEntry[] }
> = {
  "dog-luna": {
    shelterNotes:
      "Strong day-foster candidate. Prefers quiet apartments after 3pm walks.",
    experienceLog: [
      {
        id: "exp-luna-1",
        kind: "visit",
        at: "2026-07-12T14:00:00.000Z",
        visitorName: "Alex Rivera",
        interactionType: "day_fostering",
        summary: "Day foster · settled under desk during afternoon calls.",
      },
      {
        id: "exp-luna-2",
        kind: "review",
        at: "2026-07-12T20:30:00.000Z",
        visitorName: "Alex Rivera",
        interactionType: "day_fostering",
        rating: 5,
        summary:
          "Luna was calm and easy. Took a nap while I was on Zoom, then a lovely park loop.",
      },
      {
        id: "exp-luna-3",
        kind: "visit",
        at: "2026-08-02T11:00:00.000Z",
        visitorName: "Sam Chen",
        interactionType: "dog_walking",
        summary: "Noon walk · leash manners excellent in Mission Dolores.",
      },
      {
        id: "exp-luna-4",
        kind: "review",
        at: "2026-08-02T13:15:00.000Z",
        visitorName: "Sam Chen",
        interactionType: "dog_walking",
        rating: 5,
        summary: "Perfect lunch break buddy. Friendly with other dogs on the path.",
      },
    ],
  },
  "dog-milo": {
    shelterNotes: "High energy — pair with active walkers. Watch doorway dashes.",
    experienceLog: [
      {
        id: "exp-milo-1",
        kind: "visit",
        at: "2026-07-28T16:00:00.000Z",
        visitorName: "Jordan Blake",
        interactionType: "dog_walking",
        summary: "Trail walk · pulled early, settled after 15 minutes.",
      },
      {
        id: "exp-milo-2",
        kind: "review",
        at: "2026-07-28T18:40:00.000Z",
        visitorName: "Jordan Blake",
        interactionType: "dog_walking",
        rating: 4,
        summary:
          "Tons of fun. Bring treats for focus at crosswalks. Would walk again.",
      },
    ],
  },
  "dog-biscuit": {
    shelterNotes: "Keep walks under 25 minutes. Warm-up joints before leaving.",
    experienceLog: [
      {
        id: "exp-biscuit-1",
        kind: "visit",
        at: "2026-06-18T13:00:00.000Z",
        visitorName: "Riley Morgan",
        interactionType: "day_fostering",
        summary: "Day foster · mostly couch time, short block loop after lunch.",
      },
      {
        id: "exp-biscuit-2",
        kind: "review",
        at: "2026-06-18T19:00:00.000Z",
        visitorName: "Riley Morgan",
        interactionType: "day_fostering",
        rating: 5,
        summary:
          "Sweetest office mate. Slow walker but very affectionate. Ideal for low-key days.",
      },
    ],
  },
  "dog-olive": {
    shelterNotes: "",
    experienceLog: [
      {
        id: "exp-olive-1",
        kind: "review",
        at: "2026-08-08T17:20:00.000Z",
        visitorName: "Casey Nguyen",
        interactionType: "day_fostering",
        rating: 5,
        summary:
          "Olive figured out my puzzle feeder in minutes. Great focus during deep work.",
      },
    ],
  },
};

export const DEMO_DOGS: Dog[] = DEMO_DOGS_BASE.map((dog) => {
  const extra = SHELTER_NOTES[dog.id];
  return {
    ...dog,
    interactionTypes: [...dog.interactionTypes],
    shelterNotes: extra?.shelterNotes ?? "",
    experienceLog: extra?.experienceLog ?? [],
  };
});

export const DEMO_ALEX_PREFERENCES: UserPreferences = {
  userId: "demo-alex",
  wfhSchedule: "Remote Mon–Fri, flexible afternoons after standup",
  availability: [
    { day: "tuesday", ranges: [{ start: "12:00", end: "17:00" }] },
    { day: "thursday", ranges: [{ start: "12:00", end: "17:00" }] },
    { day: "saturday", ranges: [{ start: "10:00", end: "16:00" }] },
  ],
  housingType: "apartment",
  petsAllowed: true,
  hasYard: false,
  dogExperience: "some",
  preferredSize: "medium",
  preferredEnergy: "medium",
  maxExerciseMinutes: 60,
  interestedIn: ["day_fostering", "dog_walking", "trial_adoption"],
  temperamentPreferences: ["gentle", "apartment-friendly", "curious"],
  mustBeGoodWith: [],
  maxDistanceMiles: 15,
};

/** Starting answers for the compatibility questionnaire (not Alex's shortcut profile). */
export function blankUserPreferences(userId: string): UserPreferences {
  return {
    userId,
    wfhSchedule: "",
    availability: [],
    housingType: "apartment",
    petsAllowed: true,
    hasYard: false,
    dogExperience: "none",
    preferredSize: "no_preference",
    preferredEnergy: "no_preference",
    maxExerciseMinutes: 45,
    interestedIn: [],
    temperamentPreferences: [],
    mustBeGoodWith: [],
    maxDistanceMiles: 15,
  };
}
