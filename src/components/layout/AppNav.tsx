"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, PawPrint } from "@phosphor-icons/react";
import clsx from "clsx";
import { useDemo } from "@/lib/demo/store";

const links = [
  { href: "/discover", label: "Discover Dogs", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart },
];

const ICON_ON_BRAND = "#feffff";

export function AppNav() {
  const pathname = usePathname();
  const { session, preferences, logout } = useDemo();
  const wfhReady = session?.role === "wfh" && Boolean(preferences);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/80 bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] shadow-sm">
            <PawPrint size={20} color={ICON_ON_BRAND} weight="fill" />
          </span>
          <span className="font-display text-xl tracking-tight text-[var(--ink)]">
            Pawffice
          </span>
        </Link>

        {wfhReady && (
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
                  <Icon
                    size={16}
                    weight="fill"
                    color={active ? ICON_ON_BRAND : "currentColor"}
                  />
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
                href={
                  session.role === "shelter"
                    ? "/shelter/dashboard"
                    : preferences
                      ? "/dashboard"
                      : "/onboarding"
                }
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

      {wfhReady && (
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
                <Icon
                  size={14}
                  weight="fill"
                  color={active ? ICON_ON_BRAND : "currentColor"}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
