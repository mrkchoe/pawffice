"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Heart, PawPrint, UserRound } from "lucide-react";
import clsx from "clsx";
import { useDemo } from "@/lib/demo/store";

const links = [
  { href: "/discover", label: "Discover Dogs", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppNav() {
  const pathname = usePathname();
  const { session, logout } = useDemo();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/80 bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="font-display text-xl tracking-tight text-[var(--ink)]">
            Pawffice
          </span>
        </Link>

        {session?.role === "wfh" && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition",
                    active
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--ink-soft)] hover:bg-white/70 hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {session?.role === "shelter" && (
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/shelter/dashboard"
              className={clsx(
                "rounded-full px-3.5 py-2 text-sm",
                pathname.startsWith("/shelter")
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-white/70",
              )}
            >
              Shelter dashboard
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                href={session.role === "shelter" ? "/shelter/dashboard" : "/dashboard"}
                className="hidden text-sm text-[var(--ink-soft)] sm:inline"
              >
                {session.name}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:border-[var(--brand)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/demo"
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
            >
              Demo login
            </Link>
          )}
        </div>
      </div>

      {session?.role === "wfh" && (
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--line)]/60 px-2 py-2 md:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-white/60 text-[var(--ink-soft)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
