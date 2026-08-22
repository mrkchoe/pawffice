"use client";

import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";
import type {
  DayOfWeek,
  EnergyPreference,
  HousingType,
  InteractionType,
  SizePreference,
  UserPreferences,
} from "@/lib/types";
import { useRouter } from "next/navigation";

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ProfilePage() {
  const router = useRouter();
  const {
    session,
    preferences,
    backgroundCheck,
    setPreferences,
    setBackgroundStatus,
  } = useDemo();

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

  const prefs = preferences;

  function update<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) {
    if (!prefs || !session) return;
    setPreferences({ ...prefs, [key]: value, userId: session.id });
  }

  function toggleDay(day: DayOfWeek) {
    if (!prefs) return;
    const exists = prefs.availability.find((a) => a.day === day);
    if (exists) {
      update(
        "availability",
        prefs.availability.filter((a) => a.day !== day),
      );
    } else {
      update("availability", [
        ...prefs.availability,
        { day, ranges: [{ start: "12:00", end: "17:00" }] },
      ]);
    }
  }

  function toggleInterest(t: InteractionType) {
    if (!prefs) return;
    const has = prefs.interestedIn.includes(t);
    update(
      "interestedIn",
      has
        ? prefs.interestedIn.filter((x) => x !== t)
        : [...prefs.interestedIn, t],
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div>
          <h1 className="font-display text-4xl">Profile</h1>
          <p className="text-[var(--ink-soft)]">
            {session.name} · {session.email} · {session.location}
          </p>
        </div>

        <section
          id="background"
          className="scroll-mt-24 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]"
        >
          <h2 className="font-display text-2xl">Background check (mock)</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Stand-in for Checkr. Status must be approved before scheduling.
          </p>
          <p className="mt-4 text-sm">
            Status:{" "}
            <strong className="capitalize">
              {backgroundCheck?.status ?? "not_started"}
            </strong>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setBackgroundStatus("pending")}
            >
              Submit check
            </Button>
            <Button onClick={() => setBackgroundStatus("approved")}>
              Simulate approval
            </Button>
            <Button
              variant="danger"
              onClick={() => setBackgroundStatus("rejected")}
            >
              Simulate rejection
            </Button>
          </div>
        </section>

        {prefs && (
          <section className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-2xl">Home & preferences</h2>

            <label className="mt-4 block text-sm">
              WFH schedule
              <textarea
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                rows={2}
                value={prefs.wfhSchedule}
                onChange={(e) => update("wfhSchedule", e.target.value)}
              />
            </label>

            <div className="mt-4">
              <p className="text-sm text-[var(--ink-soft)]">Available days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const on = prefs.availability.some((a) => a.day === day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                        on
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--bg-deep)]"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Housing
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={prefs.housingType}
                  onChange={(e) =>
                    update("housingType", e.target.value as HousingType)
                  }
                >
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="house">House</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm">
                Dog experience
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={prefs.dogExperience}
                  onChange={(e) =>
                    update(
                      "dogExperience",
                      e.target.value as UserPreferences["dogExperience"],
                    )
                  }
                >
                  <option value="none">None</option>
                  <option value="some">Some</option>
                  <option value="experienced">Experienced</option>
                </select>
              </label>
              <label className="text-sm">
                Preferred size
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={prefs.preferredSize}
                  onChange={(e) =>
                    update("preferredSize", e.target.value as SizePreference)
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="no_preference">No preference</option>
                </select>
              </label>
              <label className="text-sm">
                Preferred energy
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={prefs.preferredEnergy}
                  onChange={(e) =>
                    update(
                      "preferredEnergy",
                      e.target.value as EnergyPreference,
                    )
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="no_preference">No preference</option>
                </select>
              </label>
              <label className="text-sm">
                Max exercise (minutes)
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={prefs.maxExerciseMinutes}
                  onChange={(e) =>
                    update("maxExerciseMinutes", Number(e.target.value))
                  }
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs.petsAllowed}
                  onChange={(e) => update("petsAllowed", e.target.checked)}
                />
                Pets allowed
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs.hasYard}
                  onChange={(e) => update("hasYard", e.target.checked)}
                />
                Has yard
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm text-[var(--ink-soft)]">Interested in</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    "dog_walking",
                    "day_fostering",
                    "weekend_fostering",
                    "trial_adoption",
                    "adoption",
                  ] as InteractionType[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleInterest(t)}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      prefs.interestedIn.includes(t)
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--bg-deep)]"
                    }`}
                  >
                    {t.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
