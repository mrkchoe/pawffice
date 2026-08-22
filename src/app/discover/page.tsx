"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { DogCard } from "@/components/dogs/DogCard";
import { CompanionSwipe } from "@/components/dogs/CompanionSwipe";
import { Button } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { useDemo } from "@/lib/demo/store";
import type { DayOfWeek, DogSize, EnergyLevel, InteractionType } from "@/lib/types";
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
  const [view, setView] = useState<"grid" | "companion">("grid");
  const [size, setSize] = useState<DogSize | "any">("any");
  const [energy, setEnergy] = useState<EnergyLevel | "any">("any");
  const [maxDistance, setMaxDistance] = useState(25);
  const [day, setDay] = useState<DayOfWeek | "any">("any");
  const [interaction, setInteraction] = useState<InteractionType | "any">("any");

  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const ranked = useMemo(() => {
    return dogs
      .filter((d) => !passedDogIds.includes(d.id))
      .filter((d) => (size === "any" ? true : d.size === size))
      .filter((d) => (energy === "any" ? true : d.energyLevel === energy))
      .filter((d) => d.distanceMiles <= maxDistance)
      .filter((d) =>
        day === "any" ? true : d.availability.some((a) => a.day === day),
      )
      .filter((d) =>
        interaction === "any"
          ? true
          : d.interactionTypes.includes(interaction),
      )
      .map((dog) => ({ dog, match: calculateDogMatch(prefs, dog) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [dogs, passedDogIds, size, energy, maxDistance, day, interaction, prefs]);

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

        <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-[var(--line)]">
          <FilterSelect
            label="Size"
            value={size}
            onChange={(v) => setSize(v as DogSize | "any")}
            options={[
              ["any", "Any size"],
              ["small", "Small"],
              ["medium", "Medium"],
              ["large", "Large"],
            ]}
          />
          <FilterSelect
            label="Energy"
            value={energy}
            onChange={(v) => setEnergy(v as EnergyLevel | "any")}
            options={[
              ["any", "Any energy"],
              ["low", "Low"],
              ["medium", "Medium"],
              ["high", "High"],
            ]}
          />
          <label className="text-sm">
            <span className="mb-1 block text-[var(--ink-soft)]">Distance</span>
            <select
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
            >
              <option value={5}>Within 5 mi</option>
              <option value={10}>Within 10 mi</option>
              <option value={15}>Within 15 mi</option>
              <option value={25}>Within 25 mi</option>
            </select>
          </label>
          <FilterSelect
            label="Available day"
            value={day}
            onChange={(v) => setDay(v as DayOfWeek | "any")}
            options={[
              ["any", "Any day"],
              ["monday", "Monday"],
              ["tuesday", "Tuesday"],
              ["wednesday", "Wednesday"],
              ["thursday", "Thursday"],
              ["friday", "Friday"],
              ["saturday", "Saturday"],
              ["sunday", "Sunday"],
            ]}
          />
          <FilterSelect
            label="Interaction"
            value={interaction}
            onChange={(v) => setInteraction(v as InteractionType | "any")}
            options={[
              ["any", "Any type"],
              ["dog_walking", "Walking"],
              ["day_fostering", "Day foster"],
              ["weekend_fostering", "Weekend foster"],
              ["trial_adoption", "Trial adoption"],
              ["adoption", "Adoption"],
            ]}
          />
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-[var(--ink-soft)]">{label}</span>
      <select
        className="rounded-full border border-[var(--line)] bg-white px-3 py-2 capitalize"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
