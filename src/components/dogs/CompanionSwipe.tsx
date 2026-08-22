"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, Info, MapPin, X } from "@phosphor-icons/react";
import type { Dog, MatchResult } from "@/lib/types";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/Button";

function formatAge(years: number) {
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  if (years === 1) return "1 year";
  return `${years} years`;
}

function formatDistance(miles: number) {
  const rounded = miles < 10 ? miles.toFixed(1) : String(Math.round(miles));
  return `${rounded} miles away`;
}

export function CompanionSwipe({
  dogs,
  matches,
  onPass,
  onSave,
  onOpen,
  onComplete,
  required = false,
}: {
  dogs: Dog[];
  matches: Record<string, MatchResult>;
  onPass: (id: string) => void;
  onSave: (id: string) => void;
  onOpen: (id: string) => void;
  onComplete?: () => void;
  /** When true, copy emphasizes finishing the deck before continuing. */
  required?: boolean;
}) {
  const { getShelter } = useDemo();
  const [index, setIndex] = useState(0);
  const dog = dogs[index];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const saveOpacity = useTransform(x, [40, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -40], [1, 0]);

  const remaining = useMemo(() => dogs.length - index, [dogs.length, index]);

  if (!dog) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/70 p-10 text-center">
        <p className="font-display text-2xl">
          {required
            ? "You've reviewed every companion"
            : "You've seen everyone nearby"}
        </p>
        <p className="mt-2 text-[var(--ink-soft)]">
          {required
            ? "Saved dogs are in Matches. Continue to your dashboard."
            : "Check Matches for dogs you saved, or continue browsing Discover."}
        </p>
        {required && onComplete && (
          <Button className="mt-6" onClick={onComplete}>
            Continue
          </Button>
        )}
      </div>
    );
  }

  const match = matches[dog.id];
  const shelter = getShelter(dog.shelterId);

  function advance() {
    setIndex((i) => i + 1);
    x.set(0);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 120) {
      onSave(dog.id);
      advance();
    } else if (info.offset.x < -120) {
      onPass(dog.id);
      advance();
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-3 text-center text-sm text-[var(--ink-soft)]">
        {required
          ? `Swipe to find a fit · ${remaining} left (required)`
          : `Find a compatible companion · ${remaining} left`}
      </p>

      <div className="rounded-[2rem] bg-[var(--brand)] p-4 shadow-[0_24px_60px_-28px_rgba(20,82,57,0.55)] sm:p-5">
        <motion.div
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="cursor-grab touch-pan-y active:cursor-grabbing"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src={dog.photoUrl}
              alt={dog.name}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 28rem"
              priority
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
              aria-hidden
            />
            <motion.div
              style={{ opacity: saveOpacity }}
              className="pointer-events-none absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--brand)]"
            >
              Save
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute right-4 top-4 rounded-full bg-[var(--ink)] px-3 py-1 text-sm font-semibold text-white"
            >
              Pass
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                  {dog.name}, {formatAge(dog.ageYears)}
                </h3>
                {match && (
                  <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    {match.score}%
                  </span>
                )}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-white/95">
                <MapPin
                  className="mt-0.5 shrink-0"
                  size={16}
                  weight="fill"
                  color="#feffff"
                  aria-hidden
                />
                <span>{shelter?.name ?? dog.location}</span>
              </p>
              <p className="mt-0.5 pl-[22px] text-sm text-white/85">
                {formatDistance(dog.distanceMiles)}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-[1.25rem] bg-white px-4 py-3.5">
            <p className="text-[0.95rem] leading-snug text-[var(--brand)]">
              {dog.description}
            </p>
          </div>
        </motion.div>

        <div className="mt-5 flex items-center justify-center gap-5 pb-1">
          <button
            type="button"
            onClick={() => {
              onPass(dog.id);
              advance();
            }}
            aria-label="Pass"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 active:scale-95"
          >
            <X size={28} weight="bold" color="var(--brand)" />
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(dog.id);
              advance();
            }}
            aria-label="Save companion"
            className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 active:scale-95"
          >
            <Heart size={36} weight="fill" color="var(--brand)" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(dog.id)}
            aria-label={`More about ${dog.name}`}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 active:scale-95"
          >
            <Info size={28} weight="fill" color="var(--brand)" />
          </button>
        </div>
      </div>
    </div>
  );
}
