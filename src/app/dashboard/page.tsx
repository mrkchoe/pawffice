"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";
import { DogCard } from "@/components/dogs/DogCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { calculateDogMatch } from "@/lib/matching/calculateDogMatch";
import { interactionLabel, useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";
import { useRouter } from "next/navigation";

const behaviorOptions = [
  "gentle",
  "friendly",
  "curious",
  "calm",
  "playful",
  "responsive",
  "shy",
  "anxious",
  "leash-pulling",
];

export default function DashboardPage() {
  const router = useRouter();

  const {
    session,
    preferences,
    backgroundCheck,
    dogs,
    savedDogs,
    appointments,
    activity,
    dogReviews,
    setBackgroundStatus,
    submitDogReview,
  } = useDemo();

  const prefs = preferences ?? DEMO_ALEX_PREFERENCES;

  const feedbackSectionRef = useRef<HTMLElement | null>(null);
  const feedbackFormRef = useRef<HTMLDivElement | null>(null);

  const [reviewDogId, setReviewDogId] = useState<string | null>(null);
  const [reviewAppointmentId, setReviewAppointmentId] =
    useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const topMatches = useMemo(
    () =>
      dogs
        .map((dog) => ({
          dog,
          match: calculateDogMatch(prefs, dog),
        }))
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 3),
    [dogs, prefs],
  );

  const saved = useMemo(() => {
    if (!session) return [];

    return savedDogs
      .filter((s) => s.userId === session.id)
      .map((s) => dogs.find((d) => d.id === s.dogId))
      .filter(Boolean)
      .slice(0, 4);
  }, [savedDogs, dogs, session]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.userId === session?.id &&
            (a.status === "scheduled" ||
              a.status === "approved" ||
              a.status === "pending"),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 3),
    [appointments, session?.id],
  );

  /*
   * Visits that the user can give feedback on.
   *
   * We include:
   *   1. Explicitly completed visits
   *   2. Visits whose scheduled time has already passed
   *
   * The latter makes the demo resilient even if the "complete visit"
   * transition has not fired yet.
   */
  const reviewableVisits = useMemo(
    () =>
      appointments
        .filter((a) => a.userId === session?.id)
        .filter(
          (a) =>
            a.status === "completed" ||
            new Date(a.startsAt) <= new Date(),
        )
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [appointments, session?.id],
  );

  const selectedDog =
    dogs.find((dog) => dog.id === reviewDogId) ?? null;

  const selectedReview =
    selectedReviewId !== null
      ? dogReviews.find((review) => review.id === selectedReviewId) ?? null
      : null;

  /*
   * If the user navigates to:
   * /dashboard#visit-feedback
   *
   * scroll to the feedback section.
   */
  useEffect(() => {
    if (window.location.hash !== "#visit-feedback") return;

    const timeout = window.setTimeout(() => {
      feedbackSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, []);

  /*
   * Once a dog is selected for review, bring the form into view.
   */
  useEffect(() => {
    if (!selectedDog || !feedbackFormRef.current) return;

    feedbackFormRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedDog]);

  /*
   * Automatically open the feedback form when a completed visit has
   * not been reviewed yet.
   */
  useEffect(() => {
    const unreviewedCompleted = reviewableVisits.find(
      (appointment) =>
        appointment.status === "completed" && !appointment.reviewId,
    );

    if (!unreviewedCompleted || selectedDog) return;

    const reviewMatch = dogReviews.find(
      (review) => review.appointmentId === unreviewedCompleted.id,
    );

    if (reviewMatch) return;

    feedbackSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    openReview(
      unreviewedCompleted.dogId,
      unreviewedCompleted.id,
    );
  }, [dogReviews, reviewableVisits, selectedDog]);

  /*
   * Email feedback from the demo email provider.
   */
  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message ?? "Email sent!";

      setToastMessage(message);

      window.setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    }

    window.addEventListener("pawffice-email-toast", handleToast);

    return () => {
      window.removeEventListener("pawffice-email-toast", handleToast);
    };
  }, []);

  /*
   * If the user is logged in but hasn't completed onboarding,
   * send them back through onboarding.
   */
  useEffect(() => {
    if (session && !preferences) {
      router.replace("/onboarding");
    }
  }, [session, preferences, router]);

  function openReview(
    dogId: string,
    appointmentId: string,
    existingReview?: {
      id: string;
      rating: 1 | 2 | 3 | 4 | 5;
      behaviorNotes: string;
      behaviorTags: string[];
    },
  ) {
    const dog = dogs.find((item) => item.id === dogId);

    setReviewDogId(dogId);
    setReviewAppointmentId(appointmentId);
    setSelectedReviewId(existingReview?.id ?? null);
    setReviewRating(existingReview?.rating ?? 5);
    setReviewNotes(existingReview?.behaviorNotes ?? "");

    setReviewTags(
      existingReview?.behaviorTags ??
        dog?.reviewSummary?.behaviorTags?.slice(0, 2) ??
        [],
    );
  }

  function cancelReview() {
    setReviewDogId(null);
    setReviewAppointmentId(null);
    setReviewNotes("");
    setReviewRating(5);
    setReviewTags([]);
    setSelectedReviewId(null);
  }

  function submitReview() {
    if (!reviewDogId || !reviewAppointmentId) return;

    submitDogReview(reviewDogId, reviewAppointmentId, {
      rating: reviewRating,
      behaviorNotes: reviewNotes.trim(),
      behaviorTags: reviewTags,
    });

    cancelReview();
  }

  if (session && !preferences) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-8 text-[var(--ink-soft)]">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="p-8">
          <Button onClick={() => router.push("/demo")}>
            Demo login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNav />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {toastMessage && (
          <div className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-200">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                {toastMessage}
              </p>
              <p className="text-xs text-emerald-700">
                A confirmation message was sent.
              </p>
            </div>
          </div>
        )}

        <h1 className="font-display text-4xl">
          Hi, {session.name.split(" ")[0]}
        </h1>

        <p className="mt-1 text-[var(--ink-soft)]">
          Your WFH companion dashboard
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Background check
            </p>

            <p className="mt-2 font-display text-2xl capitalize">
              {backgroundCheck?.status ?? "not_started"}
            </p>

            {backgroundCheck?.status !== "approved" && (
              <Button
                className="mt-4"
                onClick={() => setBackgroundStatus("approved")}
              >
                Demo: approve now
              </Button>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Saved dogs
            </p>

            <p className="mt-2 font-display text-2xl">
              {saved.length}
            </p>

            <ButtonLink
              href="/matches"
              variant="ghost"
              className="mt-3 px-0"
            >
              View matches →
            </ButtonLink>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              Upcoming visits
            </p>

            <p className="mt-2 font-display text-2xl">
              {upcoming.length}
            </p>

            <ButtonLink
              href="/schedule"
              variant="ghost"
              className="mt-3 px-0"
            >
              Schedule →
            </ButtonLink>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">
              Top dog matches
            </h2>

            <Link
              href="/discover"
              className="text-sm text-[var(--brand)]"
            >
              Discover all
            </Link>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topMatches.map(({ dog, match }) => (
              <DogCard
                key={dog.id}
                dog={dog}
                match={match}
              />
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">
              Upcoming dog visits
            </h2>

            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                No visits yet. Approve your check, then schedule
                from a dog profile.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {upcoming.map((appointment) => {
                  const dog = dogs.find(
                    (x) => x.id === appointment.dogId,
                  );

                  return (
                    <li key={appointment.id}>
                      <strong>{dog?.name}</strong> ·{" "}
                      {new Date(
                        appointment.startsAt,
                      ).toLocaleString()}{" "}
                      ·{" "}
                      {interactionLabel(
                        appointment.interactionType,
                      )}{" "}
                      ·{" "}
                      <span className="capitalize">
                        {appointment.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
            <h2 className="font-display text-xl">
              Recent activity
            </h2>

            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
              {activity.slice(0, 6).map((item) => (
                <li key={item.id}>
                  {item.message}

                  <span className="ml-2 text-xs opacity-70">
                    {new Date(
                      item.createdAt,
                    ).toLocaleTimeString()}
                  </span>
                </li>
              ))}

              {activity.length === 0 && (
                <li>No activity yet.</li>
              )}
            </ul>
          </section>
        </div>

        {/* Feedback loop */}
        <section
          id="visit-feedback"
          ref={feedbackSectionRef}
          className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]"
        >
          <h2 className="font-display text-2xl">
            Dog visit feedback
          </h2>

          {reviewableVisits.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Your past dog visits will show up here once you meet
              a pup.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviewableVisits.map((appointment) => {
                const dog = dogs.find(
                  (item) => item.id === appointment.dogId,
                );

                const existingReview = dogReviews.find(
                  (review) =>
                    review.appointmentId === appointment.id &&
                    review.userId === session.id,
                );

                const hasReview =
                  Boolean(appointment.reviewId) ||
                  Boolean(existingReview);

                return (
                  <li
                    key={appointment.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">
                        {dog?.name ?? "Dog"}
                      </p>

                      <p className="text-sm text-[var(--ink-soft)]">
                        {new Date(
                          appointment.startsAt,
                        ).toLocaleString()}{" "}
                        ·{" "}
                        {interactionLabel(
                          appointment.interactionType,
                        )}
                      </p>
                    </div>

                    {appointment.status === "completed" ? (
                      <button
                        type="button"
                        onClick={() =>
                          openReview(
                            appointment.dogId,
                            appointment.id,
                            existingReview ?? undefined,
                          )
                        }
                        className="text-sm font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                      >
                        {hasReview
                          ? `Reviewed · ${
                              existingReview?.rating ??
                              dog?.reviewSummary?.averageRating ??
                              "—"
                            }/5`
                          : "Leave feedback"}
                      </button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          openReview(
                            appointment.dogId,
                            appointment.id,
                            existingReview ?? undefined,
                          )
                        }
                      >
                        Review visit
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {selectedDog && (
            <div
              ref={feedbackFormRef}
              className="mt-6 rounded-2xl bg-[var(--bg-deep)] p-5 ring-1 ring-[var(--line)]"
            >
              <h3 className="font-display text-xl">
                {selectedReview
                  ? "Your feedback for "
                  : "How did "}
                {selectedDog.name}
                {selectedReview ? "" : " do?"}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setReviewRating(
                        value as 1 | 2 | 3 | 4 | 5,
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-sm ring-1 ${
                      reviewRating === value
                        ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
                        : "bg-white text-[var(--ink)] ring-[var(--line)]"
                    }`}
                  >
                    {value}★
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-[var(--ink)]">
                  Behavior notes
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {behaviorOptions.map((tag) => {
                    const active = reviewTags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setReviewTags((current) =>
                            active
                              ? current.filter(
                                  (item) => item !== tag,
                                )
                              : [...current, tag],
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          active
                            ? "bg-[var(--accent-soft)] text-[var(--ink)] ring-1 ring-[var(--brand)]"
                            : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={reviewNotes}
                onChange={(event) =>
                  setReviewNotes(event.target.value)
                }
                rows={4}
                className="mt-4 w-full rounded-2xl border border-[var(--line)] bg-white p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                placeholder="Share what the dog did well, any triggers, or how they behaved during the visit."
              />

              <div className="mt-4 flex gap-3">
                <Button onClick={submitReview}>
                  {selectedReview
                    ? "Update review"
                    : "Save review"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={cancelReview}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}