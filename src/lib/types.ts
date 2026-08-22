export type UserRole = "wfh" | "shelter";

export type DogSize = "small" | "medium" | "large";
export type EnergyLevel = "low" | "medium" | "high";
export type SizePreference = DogSize | "no_preference";
export type EnergyPreference = EnergyLevel | "no_preference";

export type InteractionType =
  | "dog_walking"
  | "day_fostering"
  | "weekend_fostering"
  | "trial_adoption"
  | "adoption";

export type GoodWithNeed = "kids" | "cats" | "strangers";

export type BackgroundCheckStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected";

export type HousingType =
  | "apartment"
  | "condo"
  | "house"
  | "townhouse"
  | "other";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeRange {
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface DayAvailability {
  day: DayOfWeek;
  ranges: TimeRange[];
}

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  location: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  wfhSchedule: string;
  availability: DayAvailability[];
  housingType: HousingType;
  petsAllowed: boolean;
  hasYard: boolean;
  dogExperience: "none" | "some" | "experienced";
  preferredSize: SizePreference;
  preferredEnergy: EnergyPreference;
  maxExerciseMinutes: number;
  interestedIn: InteractionType[];
  temperamentPreferences: string[];
  mustBeGoodWith: GoodWithNeed[];
  maxDistanceMiles: number;
}

export interface BackgroundCheck {
  userId: string;
  status: BackgroundCheckStatus;
  provider: "mock_checkr";
  submittedAt?: string;
  decidedAt?: string;
  notes?: string;
}

export interface LiabilityWaiver {
  signedName: string;
  acceptedAt: string;
}

export interface Shelter {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  availability: DayAvailability[];
  ownerUserId: string;
}

export interface Dog {
  id: string;
  shelterId: string;
  name: string;
  photoUrl: string;
  ageYears: number;
  breed: string;
  sex: "male" | "female";
  size: DogSize;
  energyLevel: EnergyLevel;
  temperamentTags: string[];
  description: string;
  exerciseMinutes: number;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  goodWithChildren: boolean;
  goodWithStrangers: boolean;
  specialNeeds: string | null;
  interactionTypes: InteractionType[];
  availability: DayAvailability[];
  location: string;
  distanceMiles: number;
}

export interface SavedDog {
  userId: string;
  dogId: string;
  savedAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  dogId: string;
  shelterId: string;
  interactionType: InteractionType;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "completed" | "cancelled";
  calendarEventId?: string;
  calendarProvider: "mock" | "arcade";
  notes?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
}

export interface SuggestedSlot {
  startsAt: string;
  endsAt: string;
  label: string;
  source: "mock" | "arcade";
}

export interface DemoState {
  session: Profile | null;
  preferences: UserPreferences | null;
  backgroundCheck: BackgroundCheck | null;
  shelters: Shelter[];
  dogs: Dog[];
  savedDogs: SavedDog[];
  appointments: Appointment[];
  activity: ActivityItem[];
  passedDogIds: string[];
  calendarMode: "mock" | "arcade";
  liabilityWaiver: LiabilityWaiver | null;
}
