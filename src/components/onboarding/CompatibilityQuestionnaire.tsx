"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MonthCalendar } from "@/components/onboarding/MonthCalendar";
import { blankUserPreferences } from "@/data/seed";
import { useDemo } from "@/lib/demo/store";
import type {
  EnergyPreference,
  HousingType,
  InteractionType,
  SizePreference,
  UserPreferences,
} from "@/lib/types";

const STEPS = [
  { title: "Your home", blurb: "We’ll match dogs that fit your space." },
  { title: "Dog fit", blurb: "Size, energy, and the kind of time you want to spend." },
  { title: "Your week", blurb: "Overlapping availability is 20% of the match score." },
  { title: "Background check", blurb: "A mock Checkr step before you can book a visit." },
] as const;

const TEMPERAMENTS = [
  "gentle",
  "curious",
  "apartment-friendly",
  "playful",
  "calm",
  "snuggly",
  "athletic",
] as const;

const INTERACTIONS: { value: InteractionType; label: string }[] = [
  { value: "dog_walking", label: "Walking" },
  { value: "day_fostering", label: "Day fostering" },
  { value: "weekend_fostering", label: "Weekend fostering" },
  { value: "trial_adoption", label: "Trial adoption" },
  { value: "adoption", label: "Adoption" },
];

export function CompatibilityQuestionnaire() {
  const router = useRouter();
  const { session, preferences, setPreferences, setBackgroundStatus, calendarMode } =
    useDemo();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserPreferences>(
    () => preferences ?? blankUserPreferences(session?.id ?? "demo-alex"),
  );

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setDraft((d) => ({ ...d, [key]: value, userId: session?.id ?? d.userId }));
  }

  function toggleChip<T extends string>(key: "temperamentPreferences" | "interestedIn", value: T) {
    setDraft((d) => {
      const list = d[key] as T[];
      const has = list.includes(value);
      return {
        ...d,
        [key]: has ? list.filter((x) => x !== value) : [...list, value],
      };
    });
  }

  const canAdvance =
    step === 2 ? draft.availability.length > 0 : step === 1 ? draft.interestedIn.length > 0 : true;

  function finish(submitCheck: boolean) {
    setPreferences(draft);
    if (submitCheck) setBackgroundStatus("pending");
    router.push("/discover");
  }

  const distancePercent = ((draft.maxDistanceMiles - 1) / (50 - 1)) * 100;
  const exercisePercent = ((draft.maxExerciseMinutes - 15) / (120 - 15)) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
        Compatibility questionnaire
      </p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">
        {STEPS[step].title}
      </h1>
      <p className="mt-2 text-[var(--ink-soft)]">{STEPS[step].blurb}</p>

      <ol className="mt-6 flex gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-[var(--brand)]" : "bg-[var(--line)]"
            }`}
          />
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
        {step === 0 && (
          <div className="space-y-4">
            <label className="block text-sm">
              Housing
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.housingType}
                onChange={(e) => update("housingType", e.target.value as HousingType)}
              >
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm">
              Dog experience
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.dogExperience}
                onChange={(e) =>
                  update(
                    "dogExperience",
                    e.target.value as UserPreferences["dogExperience"],
                  )
                }
              >
                <option value="none">None — first-time companion</option>
                <option value="some">Some</option>
                <option value="experienced">Experienced</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--brand)]"
                checked={draft.petsAllowed}
                onChange={(e) => update("petsAllowed", e.target.checked)}
              />
              Pets are allowed in my home
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--brand)]"
                checked={draft.hasYard}
                onChange={(e) => update("hasYard", e.target.checked)}
              />
              I have a yard
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <label className="block text-sm">
              Preferred size
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.preferredSize}
                onChange={(e) =>
                  update("preferredSize", e.target.value as SizePreference)
                }
              >
                <option value="no_preference">No preference</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label className="block text-sm">
              Preferred energy
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.preferredEnergy}
                onChange={(e) =>
                  update("preferredEnergy", e.target.value as EnergyPreference)
                }
              >
                <option value="no_preference">No preference</option>
                <option value="low">Low — desk-side naps</option>
                <option value="medium">Medium — afternoon walks</option>
                <option value="high">High — trail energy</option>
              </select>
            </label>
            <div className="text-sm">
              Max daily exercise
              <div className="relative mt-3">
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={draft.maxExerciseMinutes}
                  onChange={(e) => update("maxExerciseMinutes", Number(e.target.value))}
                  style={{ "--fill": `${exercisePercent}%` } as CSSProperties}
                  className="distance-slider h-2 w-full cursor-pointer"
                />
                <div className="relative mt-1.5 h-5 text-[10px] text-[var(--ink-soft)]">
                  <span className="absolute left-0">15 min</span>
                  <span className="absolute right-0">120 min</span>
                  <span
                    className="absolute font-display text-sm font-medium text-[var(--brand)]"
                    style={{
                      left: `${Math.min(94, Math.max(6, exercisePercent))}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {draft.maxExerciseMinutes} min
                  </span>
                </div>
              </div>
            </div>
            <fieldset>
              <legend className="text-sm text-[var(--ink-soft)]">Temperament</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEMPERAMENTS.map((t) => (
                  <Chip
                    key={t}
                    selected={draft.temperamentPreferences.includes(t)}
                    onClick={() => toggleChip("temperamentPreferences", t)}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm text-[var(--ink-soft)]">
                I&apos;m interested in
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERACTIONS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    selected={draft.interestedIn.includes(value)}
                    onClick={() => toggleChip("interestedIn", value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {draft.interestedIn.length === 0 && (
                <p className="mt-2 text-xs text-[var(--danger)]">
                  Pick at least one way you&apos;d like to spend time with a dog.
                </p>
              )}
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-[var(--ink-soft)]">
                Tap the windows that work for you. Each tap writes straight to your calendar.
              </p>
              <div className="mt-3">
                <MonthCalendar
                  onChange={(availability) => update("availability", availability)}
                  userId={session?.id ?? draft.userId}
                  calendarMode={calendarMode}
                />
              </div>
              {draft.availability.length === 0 && (
                <p className="mt-2 text-xs text-[var(--danger)]">
                  Select at least one available window.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm">Max distance to a shelter</p>
              <div className="relative mt-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={draft.maxDistanceMiles}
                  onChange={(e) => update("maxDistanceMiles", Number(e.target.value))}
                  style={{ "--fill": `${distancePercent}%` } as CSSProperties}
                  className="distance-slider h-2 w-full cursor-pointer"
                />
                <div className="relative mt-1.5 h-5 text-[10px] text-[var(--ink-soft)]">
                  <span className="absolute left-0">1 mi</span>
                  <span className="absolute right-0">50 mi</span>
                  <span
                    className="absolute font-display text-sm font-medium text-[var(--brand)]"
                    style={{
                      left: `${Math.min(94, Math.max(6, distancePercent))}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {draft.maxDistanceMiles} mi
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm text-[var(--ink-soft)]">
            <p>
              Shelters require a background check before a visit is booked. This
              demo uses a mock Checkr flow — nothing is sent to a real vendor.
            </p>
            <p>
              You can submit now (status: pending) or browse matches first and
              approve later from Profile.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button
          variant="ghost"
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button type="button" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" type="button" onClick={() => finish(false)}>
              Skip for now
            </Button>
            <Button type="button" onClick={() => finish(true)}>
              Submit check and see matches
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs capitalize ${
        selected ? "bg-[var(--brand)] text-white" : "bg-[var(--bg-deep)]"
      }`}
    >
      {children}
    </button>
  );
}
