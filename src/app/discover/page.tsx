"use client";

import { useMemo, useState } from "react";
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
  } = useDemo();
  const [view, setView] = useState<"swipe" | "cards">("swipe");

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

  if (!hydrated) {
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

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Discover Dogs</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              Toggle between swipe matching and a card grid of profiles.
            </p>
          </div>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-[var(--line)]">
            <button
              type="button"
              onClick={() => setView("swipe")}
              className={`rounded-full px-4 py-1.5 text-sm ${
                view === "swipe" ? "bg-[var(--brand)] text-white" : ""
              }`}
            >
              Swipe
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`rounded-full px-4 py-1.5 text-sm ${
                view === "cards" ? "bg-[var(--brand)] text-white" : ""
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        {view === "swipe" ? (
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
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ranked.map(({ dog, match }) => (
              <DogCard key={dog.id} dog={dog} match={match} />
            ))}
            {ranked.length === 0 && (
              <p className="col-span-full text-sm text-[var(--ink-soft)]">
                No dogs left to show — check Matches for dogs you saved.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
