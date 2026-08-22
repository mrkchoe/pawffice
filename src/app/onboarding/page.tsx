"use client";

import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";
import { DEMO_ALEX_PREFERENCES } from "@/data/seed";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loginAsAlex, setPreferences, setBackgroundStatus } = useDemo();

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl">WFH onboarding</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          For the hackathon demo, Alex&apos;s lifestyle profile is prefilled.
          You can refine it anytime on Profile.
        </p>
        <ol className="mt-8 list-decimal space-y-3 pl-5 text-[var(--ink-soft)]">
          <li>Create account (demo login)</li>
          <li>Home situation + dog preferences</li>
          <li>Weekly availability</li>
          <li>Mock background check</li>
        </ol>
        <Button
          className="mt-8"
          onClick={() => {
            if (!session) loginAsAlex();
            setPreferences({ ...DEMO_ALEX_PREFERENCES });
            setBackgroundStatus("pending");
            router.push("/profile");
          }}
        >
          Start as Alex (prefilled)
        </Button>
      </div>
    </div>
  );
}
