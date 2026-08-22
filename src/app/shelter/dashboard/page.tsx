"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import {
  getSavedShelterArcadeUserId,
  promptForShelterArcadeUserId,
} from "@/lib/arcade/shelterUser";
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
    updateAppointment,
    updateShelter,
    calendarMode,
    setCalendarMode,
  } = useDemo();

  const myShelters = useMemo(
    () => shelters.filter((s) => s.ownerUserId === session?.id),
    [shelters, session?.id],
  );

  const primaryShelter = myShelters[0];
  const savedArcadeEmail = primaryShelter
    ? getSavedShelterArcadeUserId(primaryShelter)
    : "";

  function requireArcadeEmail() {
    if (!primaryShelter) return null;
    if (calendarMode !== "arcade") return primaryShelter.email;
    return promptForShelterArcadeUserId(primaryShelter, updateShelter);
  }

  const myDogs = useMemo(
    () => dogs.filter((d) => myShelters.some((s) => s.id === d.shelterId)),
    [dogs, myShelters],
  );

  const pending = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.status === "pending" &&
            myShelters.some((s) => s.id === a.shelterId),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [appointments, myShelters],
  );

  const visits = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            (a.status === "approved" || a.status === "scheduled") &&
            myShelters.some((s) => s.id === a.shelterId),
        )
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
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function checkShelterCalendarAuth() {
    if (!primaryShelter) return;
    const arcadeEmail = requireArcadeEmail();
    if (!arcadeEmail) {
      setStatusMsg("Arcade email is required to connect.");
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auth-status",
          shelterArcadeUserId: arcadeEmail,
          calendarMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth check failed");
      if (data.authorized) {
        setAuthUrl(null);
        setStatusMsg(`Connected as ${arcadeEmail}.`);
      } else {
        setAuthUrl(data.authUrl ?? null);
        setStatusMsg(
          `Authorize Google for ${arcadeEmail}, then click Connect Google Calendar.`,
        );
      }
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Auth check failed");
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(id: string) {
    const appt = appointments.find((a) => a.id === id);
    const dog = appt ? dogs.find((d) => d.id === appt.dogId) : undefined;
    const shelter = appt
      ? shelters.find((s) => s.id === appt.shelterId)
      : undefined;
    if (!appt || !dog || !shelter) return;

    const arcadeEmail =
      calendarMode === "arcade"
        ? promptForShelterArcadeUserId(shelter, updateShelter)
        : shelter.email;
    if (!arcadeEmail) {
      setStatusMsg("Arcade email is required to approve with Arcade.");
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    setAuthUrl(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          dogId: dog.id,
          shelterArcadeUserId: arcadeEmail,
          calendarMode,
          dogName: dog.name,
          shelterName: shelter.name,
          shelterAddress: `${shelter.address}, ${shelter.city}`,
          interactionType: appt.interactionType,
          startsAt: appt.startsAt,
          endsAt: appt.endsAt,
          userName: appt.userName,
          userEmail: appt.userEmail,
          instructions: "Please bring a photo ID and arrive 5 minutes early.",
        }),
      });
      const data = await res.json();
      if (res.status === 401 || data.code === "CALENDAR_AUTH_REQUIRED") {
        setAuthUrl(data.authUrl ?? null);
        setStatusMsg(
          data.error ||
            "Connect shelter Google Calendar / Gmail, then approve again.",
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || "Approval failed");

      updateAppointment(id, {
        status: "scheduled",
        calendarEventId: data.event.id,
        calendarProvider: data.event.provider,
        emailId: data.email?.id,
        notes: data.event.htmlLink || appt.notes,
      });

      setStatusMsg(
        `Approved ${dog.name} visit — calendar invite + email sent to ${appt.userEmail}.`,
      );
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  }

  function addSampleDog() {
    const shelterId = primaryShelter?.id ?? "shelter-bayview";
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
      specialNeeds: null,
      interactionTypes: ["day_fostering", "dog_walking"],
      availability: primaryShelter?.availability ?? [],
      location: primaryShelter?.city ?? "San Francisco, CA",
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

        <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-xl">Shelter Google Calendar</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            In Arcade mode you&apos;ll be prompted for the email of your
            signed-in Arcade account. Events are tagged per dog ID; approving a
            match sends a calendar invite + email to the WFH user.
          </p>
          {savedArcadeEmail && (
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Saved Arcade email: <strong>{savedArcadeEmail}</strong>{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  if (!primaryShelter) return;
                  promptForShelterArcadeUserId(primaryShelter, updateShelter);
                }}
              >
                change
              </button>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex rounded-full bg-[var(--bg)] p-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  calendarMode === "mock" ? "bg-[var(--brand)] text-white" : ""
                }`}
                onClick={() => setCalendarMode("mock")}
              >
                Mock
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  calendarMode === "arcade"
                    ? "bg-[var(--brand)] text-white"
                    : ""
                }`}
                onClick={() => setCalendarMode("arcade")}
              >
                Arcade.dev
              </button>
            </div>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={checkShelterCalendarAuth}
            >
              {calendarMode === "arcade"
                ? "Connect with Arcade…"
                : "Check connection"}
            </Button>
            {authUrl && (
              <Button
                onClick={() =>
                  window.open(authUrl, "_blank", "noopener,noreferrer")
                }
              >
                Open Google consent
              </Button>
            )}
          </div>
          {statusMsg && (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">{statusMsg}</p>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Dogs listed" value={myDogs.length} />
          <Stat label="Pending match requests" value={pending.length} />
          <Stat label="Confirmed visits" value={visits.length} />
        </div>

        <section className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-2xl">Pending match requests</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Approve to create a dog-tagged calendar event and email the invite.
          </p>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              No pending requests. When a WFH user requests a time, it shows up
              here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((a) => {
                const d = dogs.find((x) => x.id === a.dogId);
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm"
                  >
                    <div>
                      <strong>{d?.name}</strong> · {a.userName} ({a.userEmail})
                      <span className="block text-[var(--ink-soft)]">
                        {new Date(a.startsAt).toLocaleString()} ·{" "}
                        {interactionLabel(a.interactionType)} · dog {a.dogId}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={loading}
                        onClick={() => approveRequest(a.id)}
                      >
                        Approve & send invite
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={() =>
                          updateAppointment(a.id, { status: "rejected" })
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

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
                <p className="text-xs text-[var(--ink-soft)]">ID: {dog.id}</p>
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

        <section className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-xl">Confirmed visits</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {visits.length === 0 && (
              <li className="text-[var(--ink-soft)]">None yet.</li>
            )}
            {visits.map((a) => {
              const d = dogs.find((x) => x.id === a.dogId);
              return (
                <li key={a.id}>
                  <strong>{d?.name}</strong> with {a.userName} ·{" "}
                  {new Date(a.startsAt).toLocaleString()} ·{" "}
                  {interactionLabel(a.interactionType)}
                  {a.calendarEventId && (
                    <span className="block text-xs text-[var(--ink-soft)]">
                      event {a.calendarEventId}
                      {a.emailId ? ` · email ${a.emailId}` : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
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
