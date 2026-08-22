"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import type { Dog, DogSize, EnergyLevel } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function ShelterDashboardPage() {
  const router = useRouter();
  const {
    session,
    dogs,
    shelters,
    appointments,
    savedDogs,
    upsertDog,
    removeDog,
  } = useDemo();

  const myShelters = useMemo(
    () => shelters.filter((s) => s.ownerUserId === session?.id),
    [shelters, session?.id],
  );

  const myDogs = useMemo(
    () => dogs.filter((d) => myShelters.some((s) => s.id === d.shelterId)),
    [dogs, myShelters],
  );

  const visits = useMemo(
    () =>
      appointments
        .filter((a) => myShelters.some((s) => s.id === a.shelterId))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [appointments, myShelters],
  );

  const interested = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of savedDogs) {
      if (myDogs.some((d) => d.id === s.dogId)) {
        counts.set(s.dogId, (counts.get(s.dogId) ?? 0) + 1);
      }
    }
    return counts;
  }, [savedDogs, myDogs]);

  const [editing, setEditing] = useState<Dog | null>(null);

  if (!session || session.role !== "shelter") {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="p-8">
          <p className="mb-4">Shelter staff login required.</p>
          <Button onClick={() => router.push("/demo?role=shelter")}>
            Demo shelter login
          </Button>
        </div>
      </div>
    );
  }

  function addSampleDog() {
    const shelterId = myShelters[0]?.id ?? "shelter-bayview";
    const dog: Dog = {
      id: `dog-new-${Date.now()}`,
      shelterId,
      name: "Scout",
      photoUrl:
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1000&fit=crop",
      ageYears: 3,
      breed: "Mixed",
      sex: "male",
      size: "medium",
      energyLevel: "medium",
      temperamentTags: ["friendly", "curious"],
      description: "Newly listed demo dog — edit details anytime.",
      exerciseMinutes: 45,
      goodWithDogs: true,
      goodWithCats: true,
      goodWithChildren: true,
      goodWithStrangers: true,
      specialNeeds: null,
      interactionTypes: ["day_fostering", "dog_walking"],
      availability: myShelters[0]?.availability ?? [],
      location: myShelters[0]?.city ?? "San Francisco, CA",
      distanceMiles: 5,
    };
    upsertDog(dog);
    setEditing(dog);
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-4xl">Shelter dashboard</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          {myShelters.map((s) => s.name).join(" · ")}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Dogs listed" value={myDogs.length} />
          <Stat label="Upcoming visits" value={visits.length} />
          <Stat
            label="Interest saves"
            value={[...interested.values()].reduce((a, b) => a + b, 0)}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-display text-2xl">Dogs currently listed</h2>
          <Button onClick={addSampleDog}>Add dog</Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myDogs.map((dog) => (
            <article
              key={dog.id}
              className="overflow-hidden rounded-3xl bg-white ring-1 ring-[var(--line)]"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={dog.photoUrl}
                  alt={dog.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-display text-xl">{dog.name}</h3>
                <p className="text-sm text-[var(--ink-soft)]">
                  {dog.breed} · {dog.size} · {dog.energyLevel} energy
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  Interested users: {interested.get(dog.id) ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setEditing(dog)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => removeDog(dog.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">Upcoming visits</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {visits.length === 0 && (
                <li className="text-[var(--ink-soft)]">
                  No scheduled visits yet. When Alex books, visits appear here.
                </li>
              )}
              {visits.map((a) => {
                const d = dogs.find((x) => x.id === a.dogId);
                return (
                  <li key={a.id}>
                    <strong>{d?.name}</strong> with WFH user ·{" "}
                    {new Date(a.startsAt).toLocaleString()} ·{" "}
                    {interactionLabel(a.interactionType)}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">Shelter availability</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
              {myShelters[0]?.availability.map((a) => (
                <li key={a.day} className="capitalize">
                  {a.day}:{" "}
                  {a.ranges.map((r) => `${r.start}–${r.end}`).join(", ")}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--ink-soft)]">
              Dog-specific availability is stored per dog (edit a dog to change
              size/energy; availability inherits shelter windows in this demo).
            </p>
          </div>
        </section>

        {editing && (
          <DogEditor
            dog={editing}
            onClose={() => setEditing(null)}
            onSave={(d) => {
              upsertDog(d);
              setEditing(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
      <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function DogEditor({
  dog,
  onSave,
  onClose,
}: {
  dog: Dog;
  onSave: (d: Dog) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(dog);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="font-display text-2xl">Edit {draft.name}</h3>
        <div className="mt-4 grid gap-3">
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Photo URL
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              value={draft.photoUrl}
              onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Breed
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              value={draft.breed}
              onChange={(e) => setDraft({ ...draft, breed: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Size
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.size}
                onChange={(e) =>
                  setDraft({ ...draft, size: e.target.value as DogSize })
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label className="text-sm">
              Energy
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                value={draft.energyLevel}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    energyLevel: e.target.value as EnergyLevel,
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label className="text-sm">
            Description
            <textarea
              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => onSave(draft)}>
            Save
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
