"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle } from "@phosphor-icons/react";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import {
  DEMO_BACKGROUND_CHECKS,
  DEMO_DOG_REQUESTERS,
} from "@/data/seed";

const CLEAN_BG_USER_IDS = new Set(["demo-alex"]);

function CleanBgCheck({ userId }: { userId?: string }) {
  if (!userId || !CLEAN_BG_USER_IDS.has(userId)) return null;
  return (
    <CheckCircle
      className="ml-1.5 inline-block shrink-0 align-[-0.15em] text-emerald-600"
      size={18}
      weight="fill"
      aria-label="Background check clear"
      title="Background check clear"
    />
  );
}

export default function ShelterRequestsPage() {
  const router = useRouter();
  const { session, dogs, shelters, appointments } = useDemo();
  const [bgChecks, setBgChecks] = useState(DEMO_BACKGROUND_CHECKS);

  const myShelters = useMemo(
    () => shelters.filter((s) => s.ownerUserId === session?.id),
    [shelters, session?.id],
  );

  const myDogs = useMemo(
    () => dogs.filter((d) => myShelters.some((s) => s.id === d.shelterId)),
    [dogs, myShelters],
  );

  const appointmentRequests = useMemo(() => {
    type AppointmentRequest = {
      id: string;
      dogId: string;
      dogName: string;
      dogPhoto: string;
      userId: string;
      userName: string;
      userEmail: string;
      interest: string;
      at: string;
      source: "interest" | "appointment";
      status?: string;
    };

    const fromSeed: AppointmentRequest[] = myDogs.flatMap((dog) =>
      (DEMO_DOG_REQUESTERS[dog.id] ?? []).map((r) => ({
        id: `req-${dog.id}-${r.userId}`,
        dogId: dog.id,
        dogName: dog.name,
        dogPhoto: dog.photoUrl,
        userId: r.userId,
        userName: r.name,
        userEmail: r.email,
        interest: r.interest,
        at: r.requestedAt,
        source: "interest" as const,
      })),
    );

    const fromAppts: AppointmentRequest[] = appointments
      .filter(
        (a) =>
          myShelters.some((s) => s.id === a.shelterId) &&
          (a.status === "pending" || a.status === "scheduled"),
      )
      .map((a) => {
        const dog = dogs.find((d) => d.id === a.dogId);
        return {
          id: a.id,
          dogId: a.dogId,
          dogName: dog?.name ?? "Dog",
          dogPhoto: dog?.photoUrl ?? "",
          userId: a.userId,
          userName: a.userName,
          userEmail: a.userEmail,
          interest: interactionLabel(a.interactionType),
          at: a.createdAt,
          source: "appointment" as const,
          status: a.status,
        };
      });

    const byKey = new Map<string, AppointmentRequest>();
    for (const item of [...fromSeed, ...fromAppts]) {
      const key = `${item.dogId}-${item.userEmail}`;
      const prev = byKey.get(key);
      if (!prev || prev.at < item.at) byKey.set(key, item);
    }
    return [...byKey.values()].sort((a, b) => b.at.localeCompare(a.at));
  }, [myDogs, myShelters, appointments, dogs]);

  const pendingBg = bgChecks.filter((c) => c.status === "pending");
  const decidedBg = bgChecks.filter((c) => c.status !== "pending");

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

  return (
    <div className="min-h-screen pb-16">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
              Shelter inbox
            </p>
            <h1 className="mt-1 font-display text-4xl">Requests</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              Review visit interest and pending background checks.
            </p>
          </div>
          <Link
            href="/shelter/dashboard"
            className="text-sm font-medium text-[var(--brand)] underline"
          >
            ← Back to dashboard
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Appointment Requests</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Users who asked to meet or foster a listed dog.
          </p>
          {appointmentRequests.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              No appointment requests yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {appointmentRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-[var(--line)]"
                >
                  <Link
                    href={`/discover/${r.dogId}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--line)]"
                  >
                    {r.dogPhoto ? (
                      <Image
                        src={r.dogPhoto}
                        alt={r.dogName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--ink)]">
                      {r.userName}
                      <CleanBgCheck userId={r.userId} />{" "}
                      <span className="font-normal text-[var(--ink-soft)]">
                        → {r.dogName}
                      </span>
                    </p>
                    <p className="truncate text-sm text-[var(--ink-soft)]">
                      {r.userEmail} · {r.interest}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {format(new Date(r.at), "MMM d, yyyy")}
                      {"status" in r && r.status
                        ? ` · ${String(r.status)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/discover/${r.dogId}`)}
                  >
                    View dog
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Background Checks</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Mock Checkr submissions waiting for shelter review.
          </p>

          {pendingBg.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              No pending background checks.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingBg.map((c) => (
                <li
                  key={c.userId}
                  className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-[var(--line)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--ink)]">
                      {c.name}
                      <CleanBgCheck userId={c.userId} />
                    </p>
                    <p className="truncate text-sm text-[var(--ink-soft)]">
                      {c.email}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Submitted{" "}
                      {format(new Date(c.submittedAt), "MMM d, yyyy")}
                      {c.notes ? ` · ${c.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        setBgChecks((list) =>
                          list.map((x) =>
                            x.userId === c.userId
                              ? { ...x, status: "approved" as const }
                              : x,
                          ),
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setBgChecks((list) =>
                          list.map((x) =>
                            x.userId === c.userId
                              ? { ...x, status: "rejected" as const }
                              : x,
                          ),
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {decidedBg.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                Recently decided
              </h3>
              <ul className="mt-3 space-y-2">
                {decidedBg.map((c) => (
                  <li
                    key={`${c.userId}-decided`}
                    className="flex items-center justify-between rounded-2xl bg-[var(--bg-deep)] px-4 py-3 text-sm"
                  >
                    <span>
                      {c.name}
                      <CleanBgCheck userId={c.userId} />{" "}
                      <span className="text-[var(--ink-soft)]">· {c.email}</span>
                    </span>
                    <span
                      className={
                        c.status === "approved"
                          ? "font-medium text-[var(--brand)]"
                          : "font-medium text-[#9a3412]"
                      }
                    >
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
