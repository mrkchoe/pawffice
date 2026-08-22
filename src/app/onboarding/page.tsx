"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { CompatibilityQuestionnaire } from "@/components/onboarding/CompatibilityQuestionnaire";
import { useDemo } from "@/lib/demo/store";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, hydrated } = useDemo();

  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace("/demo");
  }, [hydrated, session, router]);

  return (
    <div className="min-h-screen">
      <AppNav />
      {!hydrated || !session ? (
        <p className="p-8 text-[var(--ink-soft)]">Loading…</p>
      ) : (
        <CompatibilityQuestionnaire />
      )}
    </div>
  );
}
