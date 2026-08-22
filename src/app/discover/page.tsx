"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { DogCard } from "@/components/dogs/DogCard";
import { CompanionSwipe } from "@/components/dogs/CompanionSwipe";
import { Button } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";

export default function DiscoverPage() {
  const router = useRouter();
  const {
    session,
    preferences,
    dogs,
    passedDogIds,
    saveDog,
    passDog,
    hydrated,
    onboarding,
  } = useDemo();
  const [view, setView] = useState<"grid" | "companion">("companion");

  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const ranked = useMemo(() => {
    return dogs
      .filter((d) => !passedDogIds.includes(d.id))
      .map((dog) => ({ dog, match: calculateDogMatch(prefs, dog) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [dogs, passedDogIds, prefs]);

  const matchMap = useMemo(
    () => Object.fromEntries(ranked.map(({ dog, match }) => [dog.id, match])),
    [ranked],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (session && !preferences) router.replace("/onboarding");
  }, [hydrated, session, preferences, router]);

  if (!hydrated || (session && !preferences)) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-8 text-[var(--ink-soft)]">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-3xl">Sign in to discover dogs</h1>
          <Button className="mt-6" onClick={() => router.push("/demo")}>
            Open demo login
          </Button>
        </div>
      </div>
    );
  }

  if (session.role === "wfh" && onboarding.step !== "done") {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-3xl">Finish setup first</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Tell us if you have a dog in mind, or set your 9–3 availability and
            swipe through companions.
          </p>
          <Button className="mt-6" onClick={() => router.push("/onboarding")}>
            Continue setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Discover Dogs</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              Ranked by transparent lifestyle match — not a dating feed.
            </p>
          </div>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-[var(--line)]">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-full px-4 py-1.5 text-sm ${
                view === "grid" ? "bg-[var(--brand)] text-white" : ""
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("companion")}
              className={`rounded-full px-4 py-1.5 text-sm ${
                view === "companion" ? "bg-[var(--brand)] text-white" : ""
              }`}
            >
              Companion finder
            </button>
          </div>
        </div>

        {view === "companion" ? (
          <div className="mt-10">
            <CompanionSwipe
              dogs={ranked.map((r) => r.dog)}
              matches={matchMap}
              onPass={passDog}
              onSave={saveDog}
              onOpen={(id) => router.push(`/discover/${id}`)}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map(({ dog, match }) => (
              <DogCard key={dog.id} dog={dog} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
