"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dog, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { blankUserPreferences } from "@/data/seed";
import { useDemo } from "@/lib/demo/store";
import type {
  DayOfWeek,
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

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

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
  { value: "adoption", label: "Adoption" },
];

const SIZE_OPTIONS: {
  value: SizePreference;
  label: string;
  hint: string;
  iconClass: string;
}[] = [
  { value: "small", label: "Small", hint: "Under 25 lbs", iconClass: "h-7 w-7" },
  { value: "medium", label: "Medium", hint: "25–55 lbs", iconClass: "h-10 w-10" },
  { value: "large", label: "Large", hint: "55+ lbs", iconClass: "h-14 w-14" },
  { value: "no_preference", label: "Any size", hint: "No preference", iconClass: "h-9 w-9" },
];

export function CompatibilityQuestionnaire() {
  const router = useRouter();
  const { session, preferences, setPreferences, setBackgroundStatus, dogs } =
    useDemo();
  const [step, setStep] = useState(0);
  const [animalQuery, setAnimalQuery] = useState("");
  const [draft, setDraft] = useState<UserPreferences>(
    () => preferences ?? blankUserPreferences(session?.id ?? "demo-alex"),
  );

  const animalHits = useMemo(() => {
    const q = animalQuery.trim().toLowerCase();
    if (!q) return [];
    return dogs
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.breed.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [animalQuery, dogs]);

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setDraft((d) => ({ ...d, [key]: value, userId: session?.id ?? d.userId }));
  }

  function toggleDay(day: DayOfWeek) {
    setDraft((d) => {
      const exists = d.availability.some((a) => a.day === day);
      return {
        ...d,
        availability: exists
          ? d.availability.filter((a) => a.day !== day)
          : [...d.availability, { day, ranges: [{ start: "12:00", end: "17:00" }] }],
      };
    });
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

  function onAnimalSearch(e: FormEvent) {
    e.preventDefault();
    if (animalHits.length === 1) {
      router.push(`/discover/${animalHits[0].id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <form onSubmit={onAnimalSearch} className="relative">
        <label className="sr-only" htmlFor="animal-search">
          Search by animal ID or name
        </label>
        <div className="relative">
          <MagnifyingGlass
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
            size={16}
            weight="fill"
            color="currentColor"
            aria-hidden
          />
          <input
            id="animal-search"
            type="search"
            autoComplete="off"
            placeholder="Animal ID, Name, etc."
            value={animalQuery}
            onChange={(e) => setAnimalQuery(e.target.value)}
            className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-11 pr-4 text-sm outline-none ring-[var(--brand)] placeholder:text-[var(--ink-soft)] focus:ring-2"
          />
        </div>
        {animalHits.length > 0 ? (
          <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-[var(--line)]">
            {animalHits.map((dog) => (
              <li key={dog.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/discover/${dog.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--bg-deep)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dog.photoUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span>
                    <span className="block font-medium">{dog.name}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {dog.id} · {dog.breed}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : animalQuery.trim() !== "" ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            No animals match that search.
          </p>
        ) : null}
      </form>

      <p className="mt-8 text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
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
                checked={draft.petsAllowed}
                onChange={(e) => update("petsAllowed", e.target.checked)}
              />
              Pets are allowed in my home
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.hasYard}
                onChange={(e) => update("hasYard", e.target.checked)}
              />
              I have a yard
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-sm text-[var(--ink-soft)]">Preferred size</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SIZE_OPTIONS.map((opt) => (
                  <SizeTile
                    key={opt.value}
                    selected={draft.preferredSize === opt.value}
                    label={opt.label}
                    hint={opt.hint}
                    iconClass={opt.iconClass}
                    onClick={() => update("preferredSize", opt.value)}
                  />
                ))}
              </div>
            </fieldset>
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
            <label className="block text-sm">
              Max daily exercise ({draft.maxExerciseMinutes} min)
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                className="mt-2 w-full"
                value={draft.maxExerciseMinutes}
                onChange={(e) => update("maxExerciseMinutes", Number(e.target.value))}
              />
            </label>
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
            <fieldset>
              <legend className="text-sm text-[var(--ink-soft)]">
                Days you can host or walk (afternoons by default)
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <Chip
                    key={day}
                    selected={draft.availability.some((a) => a.day === day)}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Chip>
                ))}
              </div>
              {draft.availability.length === 0 && (
                <p className="mt-2 text-xs text-[var(--danger)]">
                  Select at least one available day.
                </p>
              )}
            </fieldset>
            <label className="block text-sm">
              WFH rhythm
              <textarea
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                rows={2}
                placeholder="e.g. Remote weekdays, free after 12pm standup"
                value={draft.wfhSchedule}
                onChange={(e) => update("wfhSchedule", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Max distance to a shelter
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.maxDistanceMiles}
                onChange={(e) => update("maxDistanceMiles", Number(e.target.value))}
              >
                <option value={5}>Within 5 miles</option>
                <option value={10}>Within 10 miles</option>
                <option value={15}>Within 15 miles</option>
                <option value={25}>Within 25 miles</option>
              </select>
            </label>
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

function SizeTile({
  selected,
  onClick,
  label,
  hint,
  iconClass,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  iconClass: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-[8.5rem] flex-col items-center justify-end gap-1 rounded-2xl px-2 py-4 ring-1 transition ${
        selected
          ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
          : "bg-[var(--bg-deep)] text-[var(--ink)] ring-transparent hover:ring-[var(--brand)]"
      }`}
    >
      <Dog
        className={`${iconClass} mb-1`}
        weight="fill"
        color="currentColor"
        aria-hidden
      />
      <span className="font-display text-base leading-tight">{label}</span>
      <span
        className={`text-[0.7rem] leading-tight ${
          selected ? "text-white/80" : "text-[var(--ink-soft)]"
        }`}
      >
        {hint}
      </span>
    </button>
  );
}
