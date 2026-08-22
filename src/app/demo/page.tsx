"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";

function DemoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const preferShelter = params.get("role") === "shelter";
  const { loginAsAlex, loginAsShelter, resetDemo } = useDemo();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
        Demo mode
      </p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">
        Walk the Pawffice story in one click
      </h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        Alex works remotely and wants canine companionship. The app verifies
        Alex, matches dogs to lifestyle + schedule, checks calendar
        availability, and books a visit.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-2xl">WFH user — Alex</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Starts with a compatibility questionnaire, then ranked dog matches.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              loginAsAlex();
              router.push("/onboarding");
            }}
          >
            Log in as Alex
          </Button>
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              loginAsAlex({ skipQuestionnaire: true });
              router.push("/discover");
            }}
          >
            Alex + auto-approve background check
          </Button>
        </div>

        <div
          className={`rounded-3xl bg-white p-6 ring-1 ${
            preferShelter ? "ring-[var(--brand)]" : "ring-[var(--line)]"
          }`}
        >
          <h2 className="font-display text-2xl">Shelter staff</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Manage Bayview & Oakridge dogs, see interest, and upcoming visits.
          </p>
          <Button
            className="mt-5 w-full"
            variant="secondary"
            onClick={() => {
              loginAsShelter();
              router.push("/shelter/dashboard");
            }}
          >
            Log in as shelter
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={resetDemo}
        className="mt-8 text-sm text-[var(--ink-soft)] underline"
      >
        Reset all demo data
      </button>
    </div>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <AppNav />
      <Suspense>
        <DemoInner />
      </Suspense>
    </div>
  );
}
