"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEMO_ALEX_PREFERENCES,
  DEMO_DOGS,
  DEMO_SHELTERS,
  LEGACY_SHELTER_IDS,
  WEEKDAY_9_TO_3,
} from "@/data/seed";
import type {
  ActivityItem,
  Appointment,
  BackgroundCheck,
  BackgroundCheckStatus,
  DayAvailability,
  DayOfWeek,
  DemoState,
  Dog,
  InteractionType,
  OnboardingState,
  OnboardingStep,
  Profile,
  Shelter,
  UserPreferences,
} from "@/lib/types";

const STORAGE_KEY = "pawffice-demo-v2";

function defaultOnboarding(): OnboardingState {
  return {
    step: "ask",
    chosenDogId: null,
    swipeFinished: false,
  };
}

function emptyState(): DemoState {
  return {
    session: null,
    preferences: null,
    backgroundCheck: null,
    shelters: DEMO_SHELTERS,
    dogs: DEMO_DOGS,
    savedDogs: [],
    appointments: [],
    activity: [],
    passedDogIds: [],
    calendarMode: "mock",
    liabilityWaiver: null,
    onboarding: defaultOnboarding(),
  };
}

function migrateShelterId(id: string): string {
  return LEGACY_SHELTER_IDS[id] ?? id;
}

function normalizeDog(dog: Dog): Dog {
  return {
    ...dog,
    shelterId: migrateShelterId(dog.shelterId),
    shelterNotes: dog.shelterNotes ?? "",
    experienceLog: dog.experienceLog ?? [],
  };
}

function normalizeShelter(shelter: Shelter): Shelter {
  return {
    ...shelter,
    id: migrateShelterId(shelter.id),
  };
}

function normalizeAppointment(appt: Appointment): Appointment {
  return {
    ...appt,
    shelterId: migrateShelterId(appt.shelterId),
  };
}

function loadState(): DemoState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    const base = emptyState();
    return {
      ...base,
      ...parsed,
      onboarding: {
        ...defaultOnboarding(),
        ...(parsed.onboarding ?? {}),
      },
      dogs: (parsed.dogs ?? base.dogs).map(normalizeDog),
      shelters: (parsed.shelters ?? base.shelters).map(normalizeShelter),
      appointments: (parsed.appointments ?? base.appointments).map(
        normalizeAppointment,
      ),
    };
  } catch {
    return emptyState();
  }
}

type DemoContextValue = DemoState & {
  hydrated: boolean;
  loginAsAlex: (opts?: { skipQuestionnaire?: boolean }) => void;
  loginAsShelter: () => void;
  logout: () => void;
  resetDemo: () => void;
  setPreferences: (prefs: UserPreferences) => void;
  setBackgroundStatus: (status: BackgroundCheckStatus) => void;
  saveDog: (dogId: string) => void;
  unsaveDog: (dogId: string) => void;
  passDog: (dogId: string) => void;
  addAppointment: (appt: Omit<Appointment, "id" | "createdAt">) => Appointment;
  updateAppointment: (
    id: string,
    patch: Partial<Appointment>,
  ) => Appointment | null;
  upsertDog: (dog: Dog) => void;
  removeDog: (dogId: string) => void;
  updateShelter: (shelter: Shelter) => void;
  setCalendarMode: (mode: "mock" | "arcade") => void;
  pushActivity: (message: string) => void;
  getShelter: (id: string) => Shelter | undefined;
  getDog: (id: string) => Dog | undefined;
  setOnboardingStep: (step: OnboardingStep) => void;
  chooseDogInMind: (dogId: string) => void;
  chooseNoDogInMind: () => void;
  applyWeekdayAvailability: (days: DayOfWeek[]) => void;
  finishSwipeOnboarding: () => void;
  completeOnboarding: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

/** Client vs SSR flag without an effect (avoids setState-in-effect lint). */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [state, setState] = useState<DemoState>(emptyState);
  const [didLoad, setDidLoad] = useState(false);

  // Hydrate from localStorage during render once we're on the client.
  if (isClient && !didLoad) {
    setDidLoad(true);
    setState(loadState());
  }

  const hydrated = isClient && didLoad;

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const pushActivity = useCallback((message: string) => {
    const item: ActivityItem = {
      id: `act-${Date.now()}`,
      userId: state.session?.id ?? "anon",
      message,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, activity: [item, ...s.activity].slice(0, 20) }));
  }, [state.session?.id]);

  const loginAsAlex = useCallback((opts?: { skipQuestionnaire?: boolean }) => {
    const session: Profile = {
      id: "demo-alex",
      role: "wfh",
      name: "Alex Rivera",
      email: "alex@pawffice.demo",
      location: "San Francisco, CA",
      createdAt: new Date().toISOString(),
    };
    const skip = Boolean(opts?.skipQuestionnaire);
    const backgroundCheck: BackgroundCheck = {
      userId: session.id,
      status: skip ? "approved" : "not_started",
      provider: "mock_checkr",
      submittedAt: skip ? new Date().toISOString() : undefined,
      decidedAt: skip ? new Date().toISOString() : undefined,
      notes: skip ? "Mock Checkr: clear — demo approval" : undefined,
    };
    setState((s) => ({
      ...s,
      session,
      preferences: skip ? { ...DEMO_ALEX_PREFERENCES } : null,
      backgroundCheck,
      passedDogIds: [],
      onboarding: defaultOnboarding(),
      activity: [
        {
          id: `act-${Date.now()}`,
          userId: session.id,
          message: skip
            ? "Signed in as Alex with approved background check"
            : "Signed in as Alex (demo WFH user)",
          createdAt: new Date().toISOString(),
        },
        ...s.activity,
      ],
    }));
  }, []);

  const loginAsShelter = useCallback(() => {
    const session: Profile = {
      id: "demo-shelter",
      role: "shelter",
      name: "Jordan Lee",
      email: "jordan@bayviewfriends.demo",
      location: "San Francisco, CA",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      session,
      preferences: null,
      backgroundCheck: null,
      onboarding: { ...defaultOnboarding(), step: "done" },
      activity: [
        {
          id: `act-${Date.now()}`,
          userId: session.id,
          message: "Signed in as Bayview shelter staff (demo)",
          createdAt: new Date().toISOString(),
        },
        ...s.activity,
      ],
    }));
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({
      ...s,
      session: null,
      preferences: null,
      backgroundCheck: null,
      onboarding: defaultOnboarding(),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(emptyState());
  }, []);

  const setPreferences = useCallback((preferences: UserPreferences) => {
    setState((s) => ({ ...s, preferences }));
  }, []);

  const setBackgroundStatus = useCallback((status: BackgroundCheckStatus) => {
    setState((s) => {
      if (!s.session) return s;
      const backgroundCheck: BackgroundCheck = {
        userId: s.session.id,
        status,
        provider: "mock_checkr",
        submittedAt:
          status === "pending" || status === "approved"
            ? new Date().toISOString()
            : s.backgroundCheck?.submittedAt,
        decidedAt:
          status === "approved" || status === "rejected"
            ? new Date().toISOString()
            : undefined,
        notes:
          status === "approved"
            ? "Mock Checkr: clear — demo approval"
            : status === "rejected"
              ? "Mock Checkr: rejected for demo"
              : s.backgroundCheck?.notes,
      };
      return {
        ...s,
        backgroundCheck,
        activity: [
          {
            id: `act-${Date.now()}`,
            userId: s.session.id,
            message: `Background check → ${status}`,
            createdAt: new Date().toISOString(),
          },
          ...s.activity,
        ],
      };
    });
  }, []);

  const saveDog = useCallback((dogId: string) => {
    setState((s) => {
      if (!s.session) return s;
      if (s.savedDogs.some((x) => x.dogId === dogId && x.userId === s.session!.id)) {
        return s;
      }
      const dog = s.dogs.find((d) => d.id === dogId);
      return {
        ...s,
        savedDogs: [
          ...s.savedDogs,
          {
            userId: s.session.id,
            dogId,
            savedAt: new Date().toISOString(),
          },
        ],
        passedDogIds: s.passedDogIds.filter((id) => id !== dogId),
        activity: [
          {
            id: `act-${Date.now()}`,
            userId: s.session.id,
            message: `Saved ${dog?.name ?? "a dog"} as a match`,
            createdAt: new Date().toISOString(),
          },
          ...s.activity,
        ],
      };
    });
  }, []);

  const unsaveDog = useCallback((dogId: string) => {
    setState((s) => ({
      ...s,
      savedDogs: s.savedDogs.filter((x) => x.dogId !== dogId),
    }));
  }, []);

  const passDog = useCallback((dogId: string) => {
    setState((s) => ({
      ...s,
      passedDogIds: [...new Set([...s.passedDogIds, dogId])],
      savedDogs: s.savedDogs.filter((x) => x.dogId !== dogId),
    }));
  }, []);

  const addAppointment = useCallback(
    (appt: Omit<Appointment, "id" | "createdAt">) => {
      const full: Appointment = {
        ...appt,
        id: `appt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setState((s) => {
        const dog = s.dogs.find((d) => d.id === appt.dogId);
        return {
          ...s,
          appointments: [full, ...s.appointments],
          activity: [
            {
              id: `act-${Date.now()}`,
              userId: appt.userId,
              message:
                appt.status === "pending"
                  ? `Requested visit with ${dog?.name ?? "dog"} (awaiting shelter approval)`
                  : `Scheduled visit with ${dog?.name ?? "dog"}`,
              createdAt: new Date().toISOString(),
            },
            ...s.activity,
          ],
        };
      });
      return full;
    },
    [],
  );

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) => {
      let updated: Appointment | null = null;
      setState((s) => {
        const appointments = s.appointments.map((a) => {
          if (a.id !== id) return a;
          updated = { ...a, ...patch };
          return updated;
        });
        if (!updated) return s;
        const dog = s.dogs.find((d) => d.id === updated!.dogId);
        return {
          ...s,
          appointments,
          activity: [
            {
              id: `act-${Date.now()}`,
              userId: updated.userId,
              message:
                patch.status === "approved" || patch.status === "scheduled"
                  ? `Shelter approved visit with ${dog?.name ?? "dog"}`
                  : patch.status === "rejected"
                    ? `Visit request for ${dog?.name ?? "dog"} was declined`
                    : `Updated visit with ${dog?.name ?? "dog"}`,
              createdAt: new Date().toISOString(),
            },
            ...s.activity,
          ],
        };
      });
      return updated;
    },
    [],
  );

  const upsertDog = useCallback((dog: Dog) => {
    setState((s) => {
      const exists = s.dogs.some((d) => d.id === dog.id);
      return {
        ...s,
        dogs: exists
          ? s.dogs.map((d) => (d.id === dog.id ? dog : d))
          : [dog, ...s.dogs],
      };
    });
  }, []);

  const removeDog = useCallback((dogId: string) => {
    setState((s) => ({
      ...s,
      dogs: s.dogs.filter((d) => d.id !== dogId),
      savedDogs: s.savedDogs.filter((d) => d.dogId !== dogId),
    }));
  }, []);

  const updateShelter = useCallback((shelter: Shelter) => {
    setState((s) => ({
      ...s,
      shelters: s.shelters.map((x) => (x.id === shelter.id ? shelter : x)),
    }));
  }, []);

  const setCalendarMode = useCallback((calendarMode: "mock" | "arcade") => {
    setState((s) => ({ ...s, calendarMode }));
  }, []);

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    setState((s) => ({
      ...s,
      onboarding: { ...s.onboarding, step },
    }));
  }, []);

  const chooseDogInMind = useCallback((dogId: string) => {
    setState((s) => {
      const dog = s.dogs.find((d) => d.id === dogId);
      if (!dog || !s.session || !s.preferences) return s;

      // User works around the dog's windows — mirror dog availability onto prefs.
      const prefs: UserPreferences = {
        ...s.preferences,
        availability: dog.availability as DayAvailability[],
        wfhSchedule: `Scheduling around ${dog.name}'s shelter availability`,
      };

      const alreadySaved = s.savedDogs.some(
        (x) => x.dogId === dogId && x.userId === s.session!.id,
      );

      return {
        ...s,
        preferences: prefs,
        savedDogs: alreadySaved
          ? s.savedDogs
          : [
              ...s.savedDogs,
              {
                userId: s.session.id,
                dogId,
                savedAt: new Date().toISOString(),
              },
            ],
        onboarding: {
          step: "around_dog",
          chosenDogId: dogId,
          swipeFinished: true,
        },
        activity: [
          {
            id: `act-${Date.now()}`,
            userId: s.session.id,
            message: `Chose ${dog.name} — working around their availability`,
            createdAt: new Date().toISOString(),
          },
          ...s.activity,
        ],
      };
    });
  }, []);

  const chooseNoDogInMind = useCallback(() => {
    setState((s) => ({
      ...s,
      onboarding: {
        step: "availability",
        chosenDogId: null,
        swipeFinished: false,
      },
      activity: s.session
        ? [
            {
              id: `act-${Date.now()}`,
              userId: s.session.id,
              message: "No dog in mind — setting weekday availability",
              createdAt: new Date().toISOString(),
            },
            ...s.activity,
          ]
        : s.activity,
    }));
  }, []);

  const applyWeekdayAvailability = useCallback((days: DayOfWeek[]) => {
    setState((s) => {
      if (!s.preferences || !s.session) return s;
      const availability = WEEKDAY_9_TO_3.filter((d) => days.includes(d.day));
      return {
        ...s,
        preferences: {
          ...s.preferences,
          availability,
          wfhSchedule: "Available weekdays 9am–3pm (selected days)",
        },
        onboarding: {
          ...s.onboarding,
          step: "swipe",
          swipeFinished: false,
        },
        passedDogIds: [],
        activity: [
          {
            id: `act-${Date.now()}`,
            userId: s.session.id,
            message: "Saved 9am–3pm weekday availability — start swiping",
            createdAt: new Date().toISOString(),
          },
          ...s.activity,
        ],
      };
    });
  }, []);

  const finishSwipeOnboarding = useCallback(() => {
    setState((s) => ({
      ...s,
      onboarding: {
        ...s.onboarding,
        step: "done",
        swipeFinished: true,
      },
      activity: s.session
        ? [
            {
              id: `act-${Date.now()}`,
              userId: s.session.id,
              message: "Finished companion swipe matching",
              createdAt: new Date().toISOString(),
            },
            ...s.activity,
          ]
        : s.activity,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({
      ...s,
      onboarding: { ...s.onboarding, step: "done" },
    }));
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      hydrated,
      loginAsAlex,
      loginAsShelter,
      logout,
      resetDemo,
      setPreferences,
      setBackgroundStatus,
      saveDog,
      unsaveDog,
      passDog,
      addAppointment,
      updateAppointment,
      upsertDog,
      removeDog,
      updateShelter,
      setCalendarMode,
      pushActivity,
      setOnboardingStep,
      chooseDogInMind,
      chooseNoDogInMind,
      applyWeekdayAvailability,
      finishSwipeOnboarding,
      completeOnboarding,
      getShelter: (id) => state.shelters.find((s) => s.id === id),
      getDog: (id) => state.dogs.find((d) => d.id === id),
    }),
    [
      state,
      hydrated,
      loginAsAlex,
      loginAsShelter,
      logout,
      resetDemo,
      setPreferences,
      setBackgroundStatus,
      saveDog,
      unsaveDog,
      passDog,
      addAppointment,
      updateAppointment,
      upsertDog,
      removeDog,
      updateShelter,
      setCalendarMode,
      pushActivity,
      setOnboardingStep,
      chooseDogInMind,
      chooseNoDogInMind,
      applyWeekdayAvailability,
      finishSwipeOnboarding,
      completeOnboarding,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

export function interactionLabel(t: InteractionType) {
  const map: Record<InteractionType, string> = {
    dog_walking: "Dog walking",
    day_fostering: "Day fostering",
    weekend_fostering: "Weekend fostering",
    trial_adoption: "Trial adoption",
    adoption: "Adoption",
  };
  return map[t];
}
