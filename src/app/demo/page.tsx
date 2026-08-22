"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";

function routeForWfhUser(options: {
  preferences: ReturnType<typeof useDemo>["preferences"];
  onboarding: ReturnType<typeof useDemo>["onboarding"];
}) {
  if (options.onboarding.step === "done" && options.preferences) {
    return "/discover";
  }
  return "/onboarding";
}

function DemoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role");
  const preferShelter = role === "shelter";
  const preferUser = role === "user" || !role;

  const {
    loginAsAlex,
    loginAsNewUser,
    loginAsPreviousUser,
    loginAsShelter,
    resetDemo,
    session,
    hydrated,
    wfhAccounts,
    preferences,
    onboarding,
  } = useDemo();

  const shelterAutoLoginStarted = useRef(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const previousUsers = useMemo(
    () =>
      wfhAccounts.filter(
        (account) =>
          account.profile.role === "wfh" &&
          account.profile.id !== session?.id,
      ),
    [wfhAccounts, session?.id],
  );

  // "I'm a Shelter" → skip the user chooser and go straight in.
  useEffect(() => {
    if (!preferShelter || !hydrated || shelterAutoLoginStarted.current) return;
    shelterAutoLoginStarted.current = true;
    if (session?.role !== "shelter") {
      loginAsShelter();
    }
    router.replace("/shelter/dashboard");
  }, [preferShelter, hydrated, session?.role, loginAsShelter, router]);

  if (preferShelter) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[var(--ink-soft)]">Signing you in as shelter…</p>
      </div>
    );
  }

  if (!preferUser) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand)]">
        WFH user login
      </p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">
        Continue as a remote worker
      </h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        Pick the demo user Alex, start fresh as a new user, or resume a previous
        account. Shelter staff should use{" "}
        <button
          type="button"
          className="font-medium text-[var(--brand)] underline"
          onClick={() => router.push("/demo?role=shelter")}
        >
          I&apos;m a Shelter
        </button>
        .
      </p>

      <div className="mt-8 grid gap-4">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-2xl">Alex (demo)</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Guided demo account with the compatibility questionnaire and ranked
            matches.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              loginAsAlex();
              router.push("/onboarding");
            }}
          >
            Continue as Alex
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

        <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-2xl">New user</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Create a fresh WFH profile and start onboarding from scratch.
          </p>
          <label className="mt-4 block text-sm font-medium text-[var(--ink)]">
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Sam Chen"
              className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-[var(--ink)]">
            Email (optional)
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="sam@example.com"
              className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <Button
            className="mt-5 w-full"
            disabled={!newName.trim()}
            onClick={() => {
              loginAsNewUser({ name: newName, email: newEmail || undefined });
              router.push("/onboarding");
            }}
          >
            Create and continue
          </Button>
        </div>

        <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--line)]">
          <h2 className="font-display text-2xl">Previous user</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Resume an account you already used in this browser.
          </p>
          {previousUsers.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              No previous WFH users yet. Create one or continue as Alex first.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {previousUsers.map((account) => (
                <li key={account.profile.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl bg-[var(--bg-deep)] px-4 py-3 text-left transition hover:ring-1 hover:ring-[var(--brand)]"
                    onClick={() => {
                      loginAsPreviousUser(account.profile.id);
                      router.push(
                        routeForWfhUser({
                          preferences: account.preferences,
                          onboarding: account.onboarding,
                        }),
                      );
                    }}
                  >
                    <span>
                      <span className="block font-medium text-[var(--ink)]">
                        {account.profile.name}
                      </span>
                      <span className="block text-xs text-[var(--ink-soft)]">
                        {account.profile.email}
                      </span>
                    </span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {account.onboarding.step === "done" ? "Ready" : "In progress"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {session?.role === "wfh" && (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">
          Currently signed in as <strong>{session.name}</strong>
          {preferences || onboarding.step === "done" ? (
            <>
              .{" "}
              <button
                type="button"
                className="text-[var(--brand)] underline"
                onClick={() =>
                  router.push(routeForWfhUser({ preferences, onboarding }))
                }
              >
                Continue where you left off
              </button>
            </>
          ) : null}
        </p>
      )}

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
