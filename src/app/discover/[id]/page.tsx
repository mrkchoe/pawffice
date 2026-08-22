"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES, DEMO_DOG_REQUESTERS } from "@/data/seed";

export default function DogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    dogs,
    getShelter,
    preferences,
    backgroundCheck,
    saveDog,
    savedDogs,
    appointments,
    session,
  } = useDemo();

  const dog = dogs.find((d) => d.id === id);
  const shelter = dog ? getShelter(dog.shelterId) : undefined;
  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;
  const match = dog ? calculateDogMatch(prefs, dog) : null;
  const saved = savedDogs.some((s) => s.dogId === id);
  const isShelter = session?.role === "shelter";

  const requesters = useMemo(() => {
    if (!dog) return [];
    const fromSeed = DEMO_DOG_REQUESTERS[dog.id] ?? [];
    const fromAppts = appointments
      .filter((a) => a.dogId === dog.id)
      .map((a) => ({
        userId: a.userId,
        name: a.userName,
        email: a.userEmail,
        requestedAt: a.createdAt,
        interest: interactionLabel(a.interactionType),
      }));

    const byUser = new Map<string, (typeof fromSeed)[number]>();
    for (const r of [...fromSeed, ...fromAppts]) {
      const prev = byUser.get(r.userId);
      if (!prev || prev.requestedAt < r.requestedAt) byUser.set(r.userId, r);
    }
    return [...byUser.values()].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );
  }, [dog, appointments]);

  if (!dog || !match) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-8">Dog not found.</p>
      </div>
    );
  }

  const canSchedule = backgroundCheck?.status === "approved";

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isShelter && (
          <section className="mb-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl">Requests for {dog.name}</h2>
              <p className="text-sm text-[var(--ink-soft)]">
                {requesters.length}{" "}
                {requesters.length === 1 ? "user" : "users"}
              </p>
            </div>
            {requesters.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                No requests yet for this dog.
              </p>
            ) : (
              <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {requesters.map((r) => (
                  <li
                    key={r.userId}
                    className="min-w-[14rem] shrink-0 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]"
                  >
                    <p className="font-medium text-[var(--ink)]">{r.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                      {r.email}
                    </p>
                    <p className="mt-2 text-sm text-[var(--brand)]">
                      {r.interest}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Requested {format(new Date(r.requestedAt), "MMM d, yyyy")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <div className="relative mx-auto aspect-[4/5] w-1/2 shrink-0 overflow-hidden rounded-[1.5rem] shadow-xl md:mx-0 md:w-[25%] md:max-w-[14rem]">
            <Image
              src={dog.photoUrl}
              alt={dog.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
          <div className="min-w-0 flex-1">
            {!isShelter && (
              <p className="text-sm font-medium text-[var(--brand)]">
                {match.score}% Match
              </p>
            )}
            <h1 className="font-display text-4xl md:text-5xl">{dog.name}</h1>
            <p className="mt-2 text-lg text-[var(--ink-soft)]">
              {dog.ageYears} years · {dog.breed} · {dog.sex} · {dog.location}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
              Rating {dog.rating.toFixed(1)} / 5
            </p>

            {!isShelter && (
              <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-[var(--line)]">
                <h2 className="font-display text-xl">Why you&apos;re a match</h2>
                <ul className="mt-3 space-y-2">
                  {match.reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-[var(--ink-soft)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-6 leading-relaxed text-[var(--ink-soft)]">
              {dog.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Info label="Size" value={dog.size} />
              <Info label="Energy" value={dog.energyLevel} />
              <Info label="Exercise" value={`${dog.exerciseMinutes} min / day`} />
              <Info label="Shelter" value={shelter?.name ?? "—"} />
              <Info label="Shelter ID" value={dog.shelterId} />
              <Info label="Rating" value={`${dog.rating.toFixed(1)} / 5`} />
              <Info
                label="Good with"
                value={[
                  dog.goodWithDogs && "dogs",
                  dog.goodWithCats && "cats",
                  dog.goodWithChildren && "kids",
                ]
                  .filter(Boolean)
                  .join(", ") || "needs intro"}
              />
              <Info
                label="Special needs"
                value={dog.specialNeeds ?? "None noted"}
              />
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {dog.temperamentTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--bg-deep)] px-3 py-1 text-xs capitalize"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {dog.interactionTypes.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs"
                >
                  {interactionLabel(t)}
                </span>
              ))}
            </div>

            {!isShelter && (
              <>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => saveDog(dog.id)}
                    disabled={saved}
                  >
                    {saved ? "Saved to Matches" : "Save companion"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!session) {
                        router.push("/demo");
                        return;
                      }
                      if (!canSchedule) {
                        router.push("/profile#background");
                        return;
                      }
                      router.push(`/schedule?dogId=${dog.id}`);
                    }}
                  >
                    {canSchedule
                      ? "Schedule time with this dog"
                      : "Approve background check to schedule"}
                  </Button>
                </div>

                {!canSchedule && (
                  <p className="mt-3 text-sm text-[var(--accent)]">
                    Background check status:{" "}
                    {backgroundCheck?.status ?? "not_started"}. Complete
                    approval on Profile before booking.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-[var(--line)]">
      <dt className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        {label}
      </dt>
      <dd className="mt-1 capitalize">{value}</dd>
    </div>
  );
}
