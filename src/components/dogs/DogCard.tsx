"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "@phosphor-icons/react";
import type { Dog, MatchResult } from "@/lib/types";

export function DogCard({
  dog,
  match,
  href,
}: {
  dog: Dog;
  match: MatchResult;
  href?: string;
}) {
  const target = href ?? `/discover/${dog.id}`;
  return (
    <Link
      href={target}
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
        <div className="absolute left-3 top-3 rounded-full bg-[var(--brand)] px-3 py-1 text-sm font-semibold text-white shadow">
          {match.score}% match
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-xl text-[var(--ink)]">{dog.name}</h3>
            <p className="text-sm text-[var(--ink-soft)]">
              {dog.ageYears} yrs · {dog.breed}
            </p>
          </div>
          <Heart
            className="mt-1 opacity-70"
            size={16}
            weight="fill"
            color="var(--brand)"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[var(--bg-deep)] px-2.5 py-1 capitalize">
            {dog.size}
          </span>
          <span className="rounded-full bg-[var(--bg-deep)] px-2.5 py-1 capitalize">
            {dog.energyLevel} energy
          </span>
        </div>
        {match.reasons[0] && (
          <p className="text-sm leading-snug text-[var(--ink-soft)]">
            {match.reasons[0]}
          </p>
        )}
      </div>
    </Link>
  );
}
