"use client";

import { useMemo } from "react";
import { AppNav } from "@/components/layout/AppNav";
import { DogCard } from "@/components/dogs/DogCard";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";
import { ButtonLink } from "@/components/ui/Button";

export default function MatchesPage() {
  const { savedDogs, dogs, preferences, session } = useDemo();
  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const matches = useMemo(() => {
    if (!session) return [];
    return savedDogs
      .filter((s) => s.userId === session.id)
      .map((s) => dogs.find((d) => d.id === s.dogId))
      .filter(Boolean)
      .map((dog) => ({ dog: dog!, match: calculateDogMatch(prefs, dog!) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [savedDogs, dogs, prefs, session]);

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-4xl">Matches</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          Companions you saved from Discover.
        </p>

        {matches.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
            <p className="font-display text-2xl">No saved dogs yet</p>
            <p className="mt-2 text-[var(--ink-soft)]">
              Use Discover or the companion finder to save a fit.
            </p>
            <ButtonLink href="/discover" className="mt-6">
              Discover dogs
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map(({ dog, match }) => (
              <DogCard key={dog.id} dog={dog} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
