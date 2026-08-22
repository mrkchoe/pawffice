"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CaretLeft, CaretRight, Lock, Plus, UploadSimple } from "@phosphor-icons/react";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import {
  getSavedShelterArcadeUserId,
  promptForShelterArcadeUserId,
} from "@/lib/arcade/shelterUser";
import type {
  Appointment,
  Dog,
  DogExperienceEntry,
  DogSize,
  EnergyLevel,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const CHECKOUT_USERS: Record<string, { first: string; last: string }> = {
  "demo-alex": { first: "Alex", last: "Rivera" },
  "demo-sam": { first: "Sam", last: "Chen" },
  "demo-casey": { first: "Casey", last: "Nguyen" },
  "demo-jordan": { first: "Jordan", last: "Blake" },
  "demo-riley": { first: "Riley", last: "Morgan" },
};

function checkoutUserParts(userId: string, userName?: string) {
  if (userName?.trim()) {
    const [first, ...rest] = userName.trim().split(/\s+/);
    return { first, last: rest.join(" ") || "" };
  }
  return CHECKOUT_USERS[userId] ?? { first: "WFH", last: "Companion" };
}

/** Demo highlight for the Requests stat. */
const DEMO_REQUEST_COUNT = 4;

type DogListSort = "a_z" | "shelter_id" | "rating_high" | "rating_low";

const DOG_SORT_TILES: { id: DogListSort; label: string }[] = [
  { id: "a_z", label: "A to Z" },
  { id: "shelter_id", label: "Shelter ID" },
  { id: "rating_high", label: "Rating (Highest)" },
  { id: "rating_low", label: "Rating (Lowest)" },
];

function dogAverageRating(dog: Dog): number | null {
  if (typeof dog.rating === "number") return dog.rating;
  const ratings = (dog.experienceLog ?? [])
    .map((e) => e.rating)
    .filter((r): r is number => typeof r === "number");
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

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
    updateShelter,
    calendarMode,
    setCalendarMode,
  } = useDemo();

  const [nowMs, setNowMs] = useState<number | null>(null);
  const [monthCursor, setMonthCursor] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Dog | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [dogSort, setDogSort] = useState<DogListSort>("a_z");
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const importProfileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();
    setNowMs(now.getTime());
    setMonthCursor(startOfMonth(now));
  }, []);

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

  const listedDogs = useMemo(() => {
    const list = [...myDogs];
    const ratingOr = (dog: Dog, fallback: number) =>
      dogAverageRating(dog) ?? fallback;

    switch (dogSort) {
      case "a_z":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "shelter_id":
        return list.sort(
          (a, b) =>
            a.shelterId.localeCompare(b.shelterId) ||
            a.name.localeCompare(b.name),
        );
      case "rating_high":
        return list.sort(
          (a, b) =>
            ratingOr(b, -1) - ratingOr(a, -1) || a.name.localeCompare(b.name),
        );
      case "rating_low":
        return list.sort(
          (a, b) =>
            ratingOr(a, 99) - ratingOr(b, 99) || a.name.localeCompare(b.name),
        );
      default:
        return list;
    }
  }, [myDogs, dogSort]);

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

  const { dogsCheckedOut, upcomingVisits } = useMemo(() => {
    if (nowMs === null) {
      return { dogsCheckedOut: 0, upcomingVisits: [] as Appointment[] };
    }
    const out = new Set<string>();
    const upcoming: Appointment[] = [];
    for (const a of visits) {
      const start = new Date(a.startsAt).getTime();
      const end = new Date(a.endsAt).getTime();
      if (start <= nowMs && nowMs <= end) out.add(a.dogId);
      if (start >= nowMs) upcoming.push(a);
    }
    return { dogsCheckedOut: out.size, upcomingVisits: upcoming };
  }, [visits, nowMs]);

  const listVisits = useMemo(() => {
    if (!selectedDay) return upcomingVisits;
    return upcomingVisits.filter((a) =>
      isSameDay(new Date(a.startsAt), selectedDay),
    );
  }, [upcomingVisits, selectedDay]);

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

  function addSampleDog(photoUrl?: string) {
    const shelterId = myShelters[0]?.id ?? "BV-012345";
    const dog: Dog = {
      id: `dog-new-${Date.now()}`,
      shelterId,
      name: "Scout",
      photoUrl:
        photoUrl ??
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
      availability: primaryShelter?.availability ?? [],
      location: primaryShelter?.city ?? "San Francisco, CA",
      distanceMiles: 5,
      rating: 4.5,
      shelterNotes: "",
      experienceLog: [],
    };
    upsertDog(dog);
    setEditing(dog);
  }

  function onImportProfile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadNotice(`Imported profile photo · ${file.name}`);
    addSampleDog(url);
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Shelter dashboard</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              {myShelters.map((s) => s.name).join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={importProfileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                onImportProfile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              className="gap-2"
              onClick={() => addSampleDog()}
            >
              <Plus size={18} weight="bold" color="#feffff" />
              Create adoption profile
            </Button>
            <div className="group relative">
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                aria-describedby="import-profile-tooltip"
                onClick={() => importProfileInputRef.current?.click()}
              >
                <UploadSimple size={18} weight="fill" />
                Import Profile
              </Button>
              <span
                id="import-profile-tooltip"
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-xl bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Requires PetPoint Integration
              </span>
            </div>
          </div>
        </div>
        {uploadNotice && (
          <p className="mt-3 text-sm text-[var(--brand)]">{uploadNotice}</p>
        )}

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
          <Stat label="Dogs checked out" value={dogsCheckedOut} />
          <Stat
            label="Requests"
            value={DEMO_REQUEST_COUNT}
            valueClassName="text-[#9a3412]"
          />
          <Stat label="Upcoming visits" value={upcomingVisits.length} />
        </div>

        <section className="mt-8 grid items-start gap-4 md:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
          {monthCursor ? (
            <VisitCalendar
              month={monthCursor}
              visits={upcomingVisits}
              selectedDay={selectedDay}
              onMonthChange={setMonthCursor}
              onSelectDay={(day) =>
                setSelectedDay((prev) =>
                  prev && isSameDay(prev, day) ? null : day,
                )
              }
            />
          ) : (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
              <p className="text-sm text-[var(--ink-soft)]">Loading calendar…</p>
            </div>
          )}
          <AppointmentList
            visits={listVisits}
            dogs={dogs}
            filteredDay={selectedDay}
            onClearFilter={() => setSelectedDay(null)}
          />
        </section>

        <h2 className="mt-10 font-display text-2xl">Dogs currently listed</h2>

        <div
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="group"
          aria-label="Sort listed dogs"
        >
          {DOG_SORT_TILES.map((tile) => {
            const selected = dogSort === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setDogSort(tile.id)}
                className={clsx(
                  "rounded-2xl px-3 py-3 text-center text-sm font-medium ring-1 transition",
                  selected
                    ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
                    : "bg-white text-[var(--ink)] ring-[var(--line)] hover:bg-[var(--bg-deep)]",
                )}
              >
                {tile.label}
              </button>
            );
          })}

        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listedDogs.map((dog) => {
            const rating = dogAverageRating(dog);
            return (
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
                  Shelter ID: {dog.shelterId}
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  Rating:{" "}
                  {rating !== null ? `${rating.toFixed(1)} / 5` : "No reviews"}
                  {" · "}
                  Interested: {interested.get(dog.id) ?? 0}
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
            );
          })}
        </div>

        {editing && (
          <DogEditor
            dog={editing}
            appointments={appointments.filter((a) => a.dogId === editing.id)}
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

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
      <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        {label}
      </p>
      <p className={clsx("mt-2 font-display text-3xl", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function VisitCalendar({
  month,
  visits,
  selectedDay,
  onMonthChange,
  onSelectDay,
}: {
  month: Date;
  visits: Appointment[];
  selectedDay: Date | null;
  onMonthChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const visitDays = useMemo(() => {
    return new Set(
      visits.map((a) => format(new Date(a.startsAt), "yyyy-MM-dd")),
    );
  }, [visits]);

  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[var(--line)] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">Calendar</h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            className="rounded-full p-1.5 text-[var(--ink-soft)] hover:bg-[var(--bg-deep)]"
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <p className="min-w-[7.5rem] text-center text-xs font-medium">
            {format(month, "MMM yyyy")}
          </p>
          <button
            type="button"
            aria-label="Next month"
            className="rounded-full p-1.5 text-[var(--ink-soft)] hover:bg-[var(--bg-deep)]"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[0.6rem] font-medium uppercase tracking-wide text-[var(--ink-soft)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const hasVisit = visitDays.has(key);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDay(day)}
              className={clsx(
                "relative flex h-8 flex-col items-center justify-center rounded-lg text-xs transition sm:h-9",
                !inMonth && "invisible",
                inMonth && !selected && "hover:bg-[var(--bg-deep)]",
                selected && "bg-[var(--brand)] text-white",
                !selected && isToday(day) && "ring-1 ring-[var(--brand)]",
              )}
            >
              {format(day, "d")}
              {hasVisit && (
                <span
                  className={clsx(
                    "absolute bottom-0.5 h-1 w-1 rounded-full",
                    selected ? "bg-white" : "bg-[var(--brand)]",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[0.65rem] leading-snug text-[var(--ink-soft)]">
        Visit days marked. Tap a day to filter.
      </p>
    </div>
  );
}

function AppointmentList({
  visits,
  dogs,
  filteredDay,
  onClearFilter,
}: {
  visits: Appointment[];
  dogs: Dog[];
  filteredDay: Date | null;
  onClearFilter: () => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Upcoming appointments</h2>
        {filteredDay && (
          <button
            type="button"
            onClick={onClearFilter}
            className="text-xs font-medium text-[var(--brand)] underline"
          >
            Clear {format(filteredDay, "MMM d")} filter
          </button>
        )}
      </div>

      {visits.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">
          {filteredDay
            ? "No appointments on this day."
            : "No upcoming appointments yet. When a WFH user books, visits appear here."}
        </p>
      ) : (
        <ul className="mt-4 max-h-[14.25rem] space-y-3 overflow-y-auto pr-1">
          {visits.map((a) => {
            const dog = dogs.find((d) => d.id === a.dogId);
            const user = checkoutUserParts(a.userId, a.userName);
            return (
              <li key={a.id}>
                <Link
                  href={`/discover/${a.dogId}`}
                  className="flex items-center gap-3 rounded-full bg-[var(--bg-deep)] px-3 py-2.5 transition hover:bg-[var(--brand)]/10 hover:ring-1 hover:ring-[var(--brand)]/30 sm:gap-4 sm:px-4"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-[var(--line)]">
                    {dog?.photoUrl ? (
                      <Image
                        src={dog.photoUrl}
                        alt={dog.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
                      {dog?.name ?? "Dog"}
                    </p>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {format(new Date(a.startsAt), "MM/dd/yyyy")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm leading-snug text-[var(--ink-soft)]">
                    <p>{user.first}</p>
                    <p>{user.last}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DogEditor({
  dog,
  appointments,
  onSave,
  onClose,
}: {
  dog: Dog;
  appointments: Appointment[];
  onSave: (d: Dog) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    ...dog,
    shelterNotes: dog.shelterNotes ?? "",
    experienceLog: dog.experienceLog ?? [],
  });

  const notesFeed = useMemo(() => {
    const fromLog = draft.experienceLog ?? [];
    const fromAppts: DogExperienceEntry[] = appointments.map((a) => {
      const user = checkoutUserParts(a.userId, a.userName);
      const statusLabel =
        a.status === "completed"
          ? "Completed visit"
          : a.status === "cancelled"
            ? "Cancelled visit"
            : "Scheduled visit";
      return {
        id: `appt-${a.id}`,
        kind: "visit" as const,
        at: a.startsAt,
        visitorName: `${user.first} ${user.last}`,
        interactionType: a.interactionType,
        summary: `${statusLabel} · ${interactionLabel(a.interactionType)}${
          a.notes ? ` — ${a.notes}` : ""
        }`,
      };
    });
    const seen = new Set(fromLog.map((e) => e.id));
    const merged = [
      ...fromLog,
      ...fromAppts.filter((e) => !seen.has(e.id)),
    ];
    return merged.sort((a, b) => b.at.localeCompare(a.at));
  }, [draft.experienceLog, appointments]);

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

          <section className="mt-2 rounded-2xl bg-[var(--bg-deep)] p-4 ring-1 ring-[var(--line)]">
            <div className="flex flex-wrap items-center gap-2">
              <Lock size={16} weight="fill" className="text-[var(--brand)]" />
              <h4 className="font-display text-lg">Notes</h4>
              <span className="rounded-full bg-white px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--ink-soft)] ring-1 ring-[var(--line)]">
                Shelter only
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Previous visits and companion reviews. Not visible to WFH users.
            </p>

            {notesFeed.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                No visits or reviews yet.
              </p>
            ) : (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {notesFeed.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-[var(--line)]"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                        {entry.kind === "review" ? "Review" : "Visit"}
                        {entry.rating ? ` · ${entry.rating}/5` : ""}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {format(new Date(entry.at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-[var(--ink)]">
                      {entry.visitorName}
                      {entry.interactionType
                        ? ` · ${interactionLabel(entry.interactionType)}`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {entry.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <label className="mt-3 block text-sm">
              Staff notes
              <textarea
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                rows={3}
                placeholder="Internal reminders for this dog…"
                value={draft.shelterNotes}
                onChange={(e) =>
                  setDraft({ ...draft, shelterNotes: e.target.value })
                }
              />
            </label>
          </section>
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
