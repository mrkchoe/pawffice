"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { CompanionSwipe } from "@/components/dogs/CompanionSwipe";
import { CompatibilityQuestionnaire } from "@/components/onboarding/CompatibilityQuestionnaire";
import { Button } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";
import type { DayOfWeek } from "@/lib/types";

const WEEKDAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    session,
    hydrated,
    dogs,
    preferences,
    onboarding,
    getShelter,
    loginAsAlex,
    setOnboardingStep,
    chooseDogInMind,
    chooseNoDogInMind,
    applyWeekdayAvailability,
    finishSwipeOnboarding,
    completeOnboarding,
    saveDog,
    passDog,
    setBackgroundStatus,
  } = useDemo();

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([...WEEKDAYS]);
  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const ranked = useMemo(() => {
    return dogs
      .map((dog) => ({ dog, match: calculateDogMatch(prefs, dog) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [dogs, prefs]);

  const matchMap = useMemo(
    () => Object.fromEntries(ranked.map(({ dog, match }) => [dog.id, match])),
    [ranked],
  );

  const chosenDog = onboarding.chosenDogId
    ? dogs.find((d) => d.id === onboarding.chosenDogId)
    : undefined;
  const shelter = chosenDog ? getShelter(chosenDog.shelterId) : undefined;

  useEffect(() => {
    if (hydrated && session?.role === "wfh" && onboarding.step === "done") {
      router.replace("/discover");
    }
  }, [hydrated, session, onboarding.step, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-8 text-[var(--ink-soft)]">Loading…</p>
      </div>
    );
  }

  if (!session || session.role !== "wfh") {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-3xl">Start as a WFH user</h1>
          <Button
            className="mt-6"
            onClick={() => {
              loginAsAlex();
              setBackgroundStatus("approved");
            }}
          >
            Log in as Alex
          </Button>
        </div>
      </div>
    );
  }

  if (onboarding.step === "done") {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-8 text-[var(--ink-soft)]">Opening companion finder…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {onboarding.step === "ask" && (
          <section className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Step 1
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl">
              Did you have a dog in mind?
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[var(--ink-soft)]">
              If yes, we&apos;ll schedule around that dog&apos;s availability. If
              not, we&apos;ll set your weekday window and you&apos;ll swipe to
              find a fit.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOnboardingStep("pick_dog")}
                className="rounded-3xl bg-white p-8 text-left ring-1 ring-[var(--line)] transition hover:ring-[var(--brand)]"
              >
                <span className="font-display text-2xl">Yes</span>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  I already know which dog I want to meet
                </p>
              </button>
              <button
                type="button"
                onClick={() => chooseNoDogInMind()}
                className="rounded-3xl bg-white p-8 text-left ring-1 ring-[var(--line)] transition hover:ring-[var(--brand)]"
              >
                <span className="font-display text-2xl">Not yet</span>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Show me companions that fit my schedule
                </p>
              </button>
            </div>
          </section>
        )}

        {onboarding.step === "pick_dog" && (
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Choose a dog
            </p>
            <h1 className="mt-2 font-display text-4xl">Who did you have in mind?</h1>
            <p className="mt-2 text-[var(--ink-soft)]">
              Next, you&apos;ll work around their shelter availability.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {dogs.map((dog) => (
                <button
                  key={dog.id}
                  type="button"
                  onClick={() => chooseDogInMind(dog.id)}
                  className="overflow-hidden rounded-3xl bg-white text-left ring-1 ring-[var(--line)] transition hover:ring-[var(--brand)]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={dog.photoUrl}
                      alt={dog.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="font-display text-xl">{dog.name}</h2>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {dog.breed} · {dog.size} · {dog.energyLevel} energy
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-6"
              onClick={() => setOnboardingStep("ask")}
            >
              ← Back
            </Button>
          </section>
        )}

        {onboarding.step === "around_dog" && chosenDog && (
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Work around their schedule
            </p>
            <h1 className="mt-2 font-display text-4xl">
              {chosenDog.name}&apos;s availability
            </h1>
            <p className="mt-2 text-[var(--ink-soft)]">
              Visits must fit these windows
              {shelter ? ` at ${shelter.name}` : ""}. Your calendar will be
              checked against this schedule.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_1.1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                <Image
                  src={chosenDog.photoUrl}
                  alt={chosenDog.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
                <h2 className="font-display text-xl">Open visit times</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {chosenDog.availability.map((a) => (
                    <li
                      key={a.day}
                      className="flex justify-between gap-3 border-b border-[var(--line)]/60 py-2 capitalize"
                    >
                      <span>{a.day}</span>
                      <span className="text-[var(--ink-soft)]">
                        {a.ranges.map((r) => `${r.start}–${r.end}`).join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  onClick={() => {
                    completeOnboarding();
                    router.push(`/schedule?dogId=${chosenDog.id}`);
                  }}
                >
                  Schedule around {chosenDog.name}
                </Button>
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => {
                    completeOnboarding();
                    router.push(`/discover/${chosenDog.id}`);
                  }}
                >
                  View full profile first
                </Button>
              </div>
            </div>
          </section>
        )}

        {onboarding.step === "availability" && (
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Your availability
            </p>
            <h1 className="mt-2 font-display text-4xl">
              When can you host a coworker?
            </h1>
            <p className="mt-2 text-[var(--ink-soft)]">
              Select the weekdays you&apos;re free. Visits are scheduled in the{" "}
              <strong>9:00am–3:00pm</strong> window.
            </p>

            <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
              <p className="text-sm text-[var(--ink-soft)]">Weekdays · 9am–3pm</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const on = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setSelectedDays((prev) =>
                          on ? prev.filter((d) => d !== day) : [...prev, day],
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm capitalize ${
                        on
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--bg-deep)] text-[var(--ink-soft)]"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-6 w-full"
                disabled={selectedDays.length === 0}
                onClick={() => applyWeekdayAvailability(selectedDays)}
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => setOnboardingStep("ask")}
              >
                ← Back
              </Button>
            </div>
          </section>
        )}

        {onboarding.step === "questionnaire" && (
          <CompatibilityQuestionnaire />
        )}

        {onboarding.step === "swipe" && (
          <section>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Find your match
            </p>
            <h1 className="mt-2 text-center font-display text-3xl sm:text-4xl">
              Swipe potential companions
            </h1>
            <p className="mx-auto mt-2 max-w-md text-center text-[var(--ink-soft)]">
              Heart to save, X to pass. Finish the deck to continue — this is how
              we find dogs that fit your 9–3 weekday window.
            </p>
            <div className="mt-8">
              <CompanionSwipe
                dogs={ranked.map((r) => r.dog)}
                matches={matchMap}
                onPass={passDog}
                onSave={saveDog}
                onOpen={(id) => router.push(`/discover/${id}`)}
                required
                onComplete={() => {
                  finishSwipeOnboarding();
                  router.push("/discover");
                }}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
