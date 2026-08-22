"use client";

import Link from "next/link";
import { AppNav } from "@/components/layout/AppNav";
import { ButtonLink } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";

export default function LandingPage() {
  const { session } = useDemo();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="flex-1">
        <section className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <p className="animate-fade-up font-display text-5xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl lg:text-7xl">
              Pawffice
            </p>
            <h1 className="animate-fade-up-delay mt-4 max-w-xl font-display text-3xl leading-tight text-[var(--brand-deep)] sm:text-4xl">
              Your WFH coworker has four legs.
            </h1>
            <p className="animate-fade-up-delay-2 mt-4 max-w-lg text-lg text-[var(--ink-soft)]">
              Get matched with shelter dogs that fit your home, energy level,
              and schedule — then find a time to meet automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={session?.role === "wfh" && session ? "/onboarding" : session ? "/discover" : "/demo"}>
                Find My Match
              </ButtonLink>
              <ButtonLink href={session?.role === "shelter" ? "/shelter/dashboard" : "/demo?role=shelter"} variant="secondary">
                I&apos;m a Shelter
              </ButtonLink>
            </div>
          </div>

          <div className="relative animate-float">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,#fde8c8,transparent_55%),radial-gradient(circle_at_80%_70%,#b7dcc8,transparent_50%)]"
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=900&fit=crop"
              alt="A friendly dog resting near a home workspace"
              className="relative h-[52vh] w-full rounded-[2rem] object-cover shadow-2xl ring-1 ring-black/5 sm:h-[60vh]"
            />
          </div>
        </section>

        <section className="border-t border-[var(--line)]/70 bg-white/50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="font-display text-3xl text-[var(--ink)]">
              Three steps to a better workday
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Tell us about your lifestyle",
                  body: "Share your home, energy, and weekly availability — including a mock background check.",
                },
                {
                  n: "2",
                  title: "Get matched with compatible shelter dogs",
                  body: "Transparent scores weight size, energy, overlapping schedules, and secondary preferences.",
                },
                {
                  n: "3",
                  title: "Find a time that works automatically",
                  body: "We compare your calendar with shelter availability and book the visit in one flow.",
                },
              ].map((step) => (
                <li key={step.n} className="space-y-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] font-display text-lg text-white">
                    {step.n}
                  </span>
                  <h3 className="font-display text-xl">{step.title}</h3>
                  <p className="text-[var(--ink-soft)]">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 text-sm text-[var(--ink-soft)]">
              Prefer the guided story?{" "}
              <Link href="/demo" className="font-medium text-[var(--brand)] underline">
                Open demo mode
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
