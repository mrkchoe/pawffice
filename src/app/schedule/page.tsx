"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import type { InteractionType, SuggestedSlot } from "@/lib/types";

function ScheduleInner() {
  const params = useSearchParams();
  const router = useRouter();
  const {
    session,
    dogs,
    getShelter,
    preferences,
    backgroundCheck,
    appointments,
    addAppointment,
    completeAppointment,
    calendarMode,
    setCalendarMode,
  } = useDemo();

  const dogId = params.get("dogId") ?? dogs[0]?.id;
  const dog = dogs.find((d) => d.id === dogId);
  const shelter = dog ? getShelter(dog.shelterId) : undefined;

  const [slots, setSlots] = useState<SuggestedSlot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [interactionOverride, setInteractionOverride] =
    useState<InteractionType | null>(null);
  const [activeDogId, setActiveDogId] = useState(dogId);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // When the selected dog changes, clear override so we use that dog's default type.
  if (dogId !== activeDogId) {
    setActiveDogId(dogId);
    setInteractionOverride(null);
  }

  const interaction: InteractionType =
    interactionOverride ?? dog?.interactionTypes[0] ?? "day_fostering";

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.userId === session?.id && a.status === "scheduled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [appointments, session?.id],
  );

  async function loadSlots() {
    if (!session || !preferences || !dog) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest",
          userId: session.id,
          calendarMode,
          userAvailability: preferences.availability,
          dogAvailability: dog.availability,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load slots");
      setSlots(data.slots ?? []);
      setNote(data.note ?? null);
      setSelected(data.slots?.[0]?.startsAt ?? null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function book() {
    if (!session || !dog || !shelter || !selected) return;
    if (backgroundCheck?.status !== "approved") {
      setMessage("Background check must be approved before scheduling.");
      return;
    }
    const slot = slots.find((s) => s.startsAt === selected);
    if (!slot) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book",
          userId: session.id,
          calendarMode,
          dogName: dog.name,
          shelterName: shelter.name,
          shelterEmail: shelter.email,
          shelterPhone: shelter.phone,
          shelterAddress: `${shelter.address}, ${shelter.city}`,
          interactionType: interaction,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          instructions: "Please bring a photo ID and arrive 5 minutes early.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.authUrl) {
          const popup = window.open(data.authUrl, "_blank", "noopener,noreferrer");
          if (!popup) {
            window.location.href = data.authUrl;
          }
          setMessage("Arcade needs Google Calendar permission. Please approve access in the window that opens.");
          return;
        }
        throw new Error(data.error || "Booking failed");
      }

      const booked = addAppointment({
        userId: session.id,
        dogId: dog.id,
        shelterId: shelter.id,
        interactionType: interaction,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: "scheduled",
        calendarEventId: data.event.id,
        calendarProvider: data.event.provider,
        notes: data.event.title,
      });

      if (session.id === "demo-alex") {
        window.setTimeout(() => completeAppointment(booked.id), 2500);
      }

      setMessage(`Booked! Calendar event created via ${data.event.provider}.`);
      router.push("/dashboard");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-4xl">Schedule</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          Compare your calendar with shelter availability and book a visit.
        </p>

        {!session && (
          <p className="mt-8">
            <Button onClick={() => router.push("/demo")}>Demo login</Button>
          </p>
        )}

        {session && backgroundCheck?.status !== "approved" && (
          <div className="mt-6 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--ink)]">
            Background check is{" "}
            <strong>{backgroundCheck?.status ?? "not_started"}</strong>.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => router.push("/profile#background")}
            >
              Approve it on Profile
            </button>{" "}
            to unlock booking.
          </div>
        )}

        {session && dog && shelter && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
              <h2 className="font-display text-2xl">
                Meet {dog.name} — {shelter.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {shelter.address}, {shelter.city}
              </p>

              <label className="mt-4 block text-sm">
                Interaction type
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  value={interaction}
                  onChange={(e) =>
                    setInteractionOverride(e.target.value as InteractionType)
                  }
                >
                  {dog.interactionTypes.map((t) => (
                    <option key={t} value={t}>
                      {interactionLabel(t)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-[var(--ink-soft)]">
                  Calendar provider
                </span>
                <div className="flex rounded-full bg-[var(--bg)] p-1">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-sm ${
                      calendarMode === "mock"
                        ? "bg-[var(--brand)] text-white"
                        : ""
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
              </div>

              <Button
                className="mt-5"
                disabled={loading}
                onClick={loadSlots}
              >
                {loading ? "Finding times…" : "Find overlapping times"}
              </Button>
              {note && (
                <p className="mt-3 text-xs text-[var(--ink-soft)]">{note}</p>
              )}
            </div>

            {slots.length > 0 && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
                <h3 className="font-display text-xl">Best three options</h3>
                <ul className="mt-4 space-y-2">
                  {slots.map((slot) => (
                    <li key={slot.startsAt}>
                      <button
                        type="button"
                        onClick={() => setSelected(slot.startsAt)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected === slot.startsAt
                            ? "border-[var(--brand)] bg-[var(--bg-deep)]"
                            : "border-[var(--line)] hover:border-[var(--brand)]"
                        }`}
                      >
                        {slot.label}
                        <span className="mt-1 block text-xs text-[var(--ink-soft)]">
                          via {slot.source} calendar
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  disabled={
                    loading ||
                    !selected ||
                    backgroundCheck?.status !== "approved"
                  }
                  onClick={book}
                >
                  Confirm & create calendar event
                </Button>
              </div>
            )}
          </div>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-white p-3 text-sm ring-1 ring-[var(--line)]">
            {message}
          </p>
        )}

        <div className="mt-10">
          <h2 className="font-display text-2xl">Upcoming visits</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">None yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((a) => {
                const d = dogs.find((x) => x.id === a.dogId);
                return (
                  <li
                    key={a.id}
                    className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-[var(--line)]"
                  >
                    <strong>{d?.name}</strong> ·{" "}
                    {new Date(a.startsAt).toLocaleString()} ·{" "}
                    {interactionLabel(a.interactionType)}
                    <span className="block text-xs text-[var(--ink-soft)]">
                      calendar: {a.calendarProvider} ({a.calendarEventId})
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleInner />
    </Suspense>
  );
}
