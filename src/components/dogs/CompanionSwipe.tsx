"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X } from "lucide-react";
import type { Dog, MatchResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";

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
  const [index, setIndex] = useState(0);
  const dog = dogs[index];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
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
            : "Check Matches for dogs you saved, or adjust filters on Discover."}
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
      <div className="relative aspect-[3/4]">
        <motion.div
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[var(--line)] active:cursor-grabbing"
        >
          <button
            type="button"
            className="absolute inset-0 z-10"
            onClick={() => onOpen(dog.id)}
            aria-label={`View ${dog.name}`}
          />
          <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
          <motion.div
            style={{ opacity: saveOpacity }}
            className="pointer-events-none absolute left-4 top-4 rounded-full bg-[var(--brand)] px-3 py-1 text-sm font-semibold text-white"
          >
            Save
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-4 top-4 rounded-full bg-[var(--ink)] px-3 py-1 text-sm font-semibold text-white"
          >
            Pass
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-5 pt-20 text-white">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-3xl">{dog.name}</h3>
                <p className="text-sm text-white/85">
                  {dog.ageYears} yrs · {dog.breed} · {dog.size}
                </p>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                {match?.score ?? "—"}%
              </span>
            </div>
            {match?.reasons[0] && (
              <p className="mt-2 text-sm text-white/90">{match.reasons[0]}</p>
            )}
          </div>
        </motion.div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          className="h-14 w-14 rounded-full p-0"
          onClick={() => {
            onPass(dog.id);
            advance();
          }}
          aria-label="Pass"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          className="h-14 w-14 rounded-full p-0"
          onClick={() => {
            onSave(dog.id);
            advance();
          }}
          aria-label="Save companion"
        >
          <Heart className="h-6 w-6 fill-current" />
        </Button>
      </div>
    </div>
  );
}
