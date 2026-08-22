"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";
import { DogCard } from "@/components/dogs/DogCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const {
    session,
    preferences,
    backgroundCheck,
    dogs,
    savedDogs,
    appointments,
    activity,
    setBackgroundStatus,
  } = useDemo();

  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const topMatches = useMemo(
    () =>
      dogs
        .map((dog) => ({ dog, match: calculateDogMatch(prefs, dog) }))
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 3),
    [dogs, prefs],
  );

  const saved = useMemo(() => {
    if (!session) return [];
    return savedDogs
      .filter((s) => s.userId === session.id)
      .map((s) => dogs.find((d) => d.id === s.dogId))
      .filter(Boolean)
      .slice(0, 4);
  }, [savedDogs, dogs, session]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.userId === session?.id &&
            (a.status === "scheduled" ||
              a.status === "approved" ||
              a.status === "pending"),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 3),
    [appointments, session?.id],
  );

  if (!session) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="p-8">
          <Button onClick={() => router.push("/demo")}>Demo login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-4xl">Hi, {session.name.split(" ")[0]}</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          Your WFH companion dashboard
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Background check
            </p>
            <p className="mt-2 font-display text-2xl capitalize">
              {backgroundCheck?.status ?? "not_started"}
            </p>
            {backgroundCheck?.status !== "approved" && (
              <Button
                className="mt-4"
                onClick={() => setBackgroundStatus("approved")}
              >
                Demo: approve now
              </Button>
            )}
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Saved dogs
            </p>
            <p className="mt-2 font-display text-2xl">{saved.length}</p>
            <ButtonLink href="/matches" variant="ghost" className="mt-3 px-0">
              View matches →
            </ButtonLink>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Upcoming visits
            </p>
            <p className="mt-2 font-display text-2xl">{upcoming.length}</p>
            <ButtonLink href="/schedule" variant="ghost" className="mt-3 px-0">
              Schedule →
            </ButtonLink>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">Top dog matches</h2>
            <Link href="/discover" className="text-sm text-[var(--brand)]">
              Discover all
            </Link>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topMatches.map(({ dog, match }) => (
              <DogCard key={dog.id} dog={dog} match={match} />
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">Upcoming dog visits</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                No visits yet — approve your check, then schedule from a dog
                profile.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {upcoming.map((a) => {
                  const d = dogs.find((x) => x.id === a.dogId);
                  return (
                    <li key={a.id}>
                      <strong>{d?.name}</strong> ·{" "}
                      {new Date(a.startsAt).toLocaleString()} ·{" "}
                      {interactionLabel(a.interactionType)}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">Recent activity</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id}>
                  {a.message}
                  <span className="ml-2 text-xs opacity-70">
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
              {activity.length === 0 && <li>No activity yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
