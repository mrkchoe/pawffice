"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarBlank } from "@phosphor-icons/react";
import { AppNav } from "@/components/layout/AppNav";
import { ButtonLink } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";
import type { Appointment, Dog } from "@/lib/types";

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MatchesPage() {
  const { savedDogs, dogs, appointments, session } = useDemo();

  const matches = useMemo(() => {
    if (!session) return [] as { dog: Dog; visit: Appointment | undefined }[];

    return savedDogs
      .filter((s) => s.userId === session.id)
      .map((s) => {
        const dog = dogs.find((d) => d.id === s.dogId);
        if (!dog) return null;
        const visit = appointments
          .filter(
            (a) =>
              a.userId === session.id &&
              a.dogId === dog.id &&
              a.status === "scheduled",
          )
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
        return { dog, visit };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a!.visit?.startsAt ?? "9999";
        const bTime = b!.visit?.startsAt ?? "9999";
        return aTime.localeCompare(bTime);
      }) as { dog: Dog; visit: Appointment | undefined }[];
  }, [savedDogs, dogs, appointments, session]);

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-4xl">Matches</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          Your saved companions and upcoming visit times.
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
            {matches.map(({ dog, visit }) => (
              <MatchCard key={dog.id} dog={dog} visit={visit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({
  dog,
  visit,
}: {
  dog: Dog;
  visit: Appointment | undefined;
}) {
  const href = visit
    ? `/schedule?dogId=${dog.id}`
    : `/discover/${dog.id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_-24px_rgba(28,43,36,0.45)] ring-1 ring-[var(--line)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(28,43,36,0.55)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={dog.photoUrl}
          alt={dog.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-display text-2xl text-[var(--ink)]">{dog.name}</h3>
        <p className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <CalendarBlank size={16} weight="fill" color="currentColor" />
          {visit ? (
            <span>{formatVisitDate(visit.startsAt)}</span>
          ) : (
            <span>No visit scheduled yet</span>
          )}
        </p>
      </div>
    </Link>
  );
}
