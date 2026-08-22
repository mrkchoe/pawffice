"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, PawPrint } from "lucide-react";
import {
  WEEK_SLOTS,
  combineDateAndTime,
  formatSlotTime,
  isSameDay,
  isoDate,
} from "@/lib/scheduling/weekSlots";
import type { DayAvailability, DayOfWeek } from "@/lib/types";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

type SyncState = "idle" | "syncing" | "synced" | "error";
interface DateSelection {
  slotId: string;
  status: SyncState;
}
type Selections = Record<string, DateSelection[]>;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-first offset (0 = the month starts on a Monday). */
function mondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

function buildGrid(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = mondayOffset(first);
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leading + 1;
    const date = new Date(year, month, dayNum);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

function deriveAvailability(selections: Selections): DayAvailability[] {
  const byDay = new Map<DayOfWeek, Set<string>>();
  for (const [iso, sels] of Object.entries(selections)) {
    if (sels.length === 0) continue;
    const date = new Date(`${iso}T00:00:00`);
    const day = JS_DAY_TO_DAY_OF_WEEK[date.getDay()];
    for (const sel of sels) {
      const slot = WEEK_SLOTS.find((s) => s.id === sel.slotId);
      if (!slot) continue;
      const key = `${slot.range.start}-${slot.range.end}`;
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(key);
    }
  }
  return [...byDay.entries()].map(([day, ranges]) => ({
    day,
    ranges: [...ranges].map((r) => {
      const [start, end] = r.split("-");
      return { start, end };
    }),
  }));
}

export function MonthCalendar({
  onChange,
  userId,
  calendarMode,
}: {
  onChange: (availability: DayAvailability[]) => void;
  userId: string;
  calendarMode: "mock" | "arcade";
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const earliest = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);
  // Booking window caps at 60 days out.
  const latest = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 60);
    return d;
  }, [today]);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selections, setSelections] = useState<Selections>({});
  const [activeIso, setActiveIso] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const cells = useMemo(() => buildGrid(viewMonth), [viewMonth]);
  const atCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();
  const atLatestMonth =
    viewMonth.getFullYear() * 12 + viewMonth.getMonth() >= latest.getFullYear() * 12 + latest.getMonth();

  function pickSlot(dateIso: string, date: Date, slotId: string) {
    const existing = selections[dateIso] ?? [];
    const already = existing.some((s) => s.slotId === slotId);

    if (already) {
      // Tapping a picked slot again clears just that one. Doesn't remove the
      // calendar event already written for it — see chat for why.
      const next = { ...selections, [dateIso]: existing.filter((s) => s.slotId !== slotId) };
      setSelections(next);
      onChange(deriveAvailability(next));
      return;
    }

    const slot = WEEK_SLOTS.find((s) => s.id === slotId)!;
    const next = {
      ...selections,
      [dateIso]: [...existing, { slotId, status: "syncing" as SyncState }],
    };
    setSelections(next);
    onChange(deriveAvailability(next));

    (async () => {
      try {
        const start = combineDateAndTime(date, slot.range.start);
        const end = combineDateAndTime(date, slot.range.end);
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "block",
            userId,
            calendarMode,
            label: `${slot.label} · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.authUrl) setAuthUrl(data.authUrl);
          throw new Error(data.error || "Sync failed");
        }
        setSelections((s) => ({
          ...s,
          [dateIso]: (s[dateIso] ?? []).map((sel) =>
            sel.slotId === slotId ? { ...sel, status: "synced" } : sel,
          ),
        }));
      } catch {
        setSelections((s) => ({
          ...s,
          [dateIso]: (s[dateIso] ?? []).map((sel) =>
            sel.slotId === slotId ? { ...sel, status: "error" } : sel,
          ),
        }));
      }
    })();
  }

  const activeDate = activeIso ? new Date(`${activeIso}T00:00:00`) : null;

  return (
    <div className="space-y-2.5">
      <div className="calendar-card relative overflow-hidden rounded-2xl p-3 ring-1 ring-[var(--line)] sm:p-4">
        <PawPrint
          className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rotate-[18deg] text-[var(--brand)] opacity-[0.07]"
          strokeWidth={1.2}
        />

        <div className="relative z-10 mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={atCurrentMonth}
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--bg-deep)] disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <h3 className="flex items-center gap-1.5 font-display text-xl text-[var(--ink)] sm:text-2xl">
            <PawPrint className="h-4 w-4 text-[var(--brand)]" strokeWidth={2} />
            {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <button
            type="button"
            aria-label="Next month"
            disabled={atLatestMonth}
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--bg-deep)] disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-7 gap-1">
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="pb-0.5 text-center text-[10px] font-medium text-[var(--ink-soft)]">
              {d}
            </div>
          ))}

          {cells.map(({ date, inMonth }) => {
            const iso = isoDate(date);
            const isDisabled = !inMonth || startOfDay(date) < earliest || startOfDay(date) > latest;
            const isToday = isSameDay(date, today);
            const isActive = activeIso === iso;
            const sels = selections[iso] ?? [];

            return (
              <button
                key={iso}
                type="button"
                disabled={isDisabled}
                onClick={() => setActiveIso((a) => (a === iso ? null : iso))}
                className={`flex h-11 flex-col items-start rounded-lg border p-1 text-left transition sm:h-12 ${
                  !inMonth
                    ? "border-transparent text-[var(--ink-soft)]/40"
                    : isDisabled
                      ? "cursor-not-allowed border-transparent text-[var(--ink-soft)]/40"
                      : isActive
                        ? "border-[var(--brand)] bg-[var(--bg-deep)]"
                        : "border-[var(--line)] bg-[var(--card)]/60 hover:border-[var(--brand)] hover:bg-[var(--bg-deep)]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    isToday ? "bg-[var(--brand)] text-white" : ""
                  }`}
                >
                  {date.getDate()}
                </span>
                {sels.length > 0 && (
                  <span className="mt-0.5 inline-flex max-w-full items-center gap-0.5 truncate rounded-full bg-[var(--brand)] px-1 py-0.5 text-[9px] leading-none text-white">
                    {sels[0].status === "syncing" && <Loader2 className="h-2 w-2 shrink-0 animate-spin" />}
                    {sels[0].status === "synced" && <Check className="h-2 w-2 shrink-0" />}
                    {sels[0].status === "error" && "!"}
                    <span className="truncate">
                      {WEEK_SLOTS.find((s) => s.id === sels[0].slotId)?.label}
                      {sels.length > 1 ? ` +${sels.length - 1}` : ""}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeDate && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-[var(--brand)] sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ink)]">
              Pick times for{" "}
              <strong>
                {activeDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </strong>
            </p>
            <button
              type="button"
              onClick={() => setActiveIso(null)}
              className="text-xs text-[var(--ink-soft)] underline"
            >
              Close
            </button>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Pick as many windows as you want.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WEEK_SLOTS.map((slot) => {
              const selected = (selections[activeIso!] ?? []).some((s) => s.slotId === slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => pickSlot(activeIso!, activeDate, slot.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--line)] hover:border-[var(--brand)]"
                  }`}
                >
                  <span className="block font-medium">{slot.label}</span>
                  <span className={selected ? "text-white/80" : "text-[var(--ink-soft)]"}>
                    {formatSlotTime(slot.range)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--ink-soft)]">
        Tap a date (starting tomorrow), then any number of times. Each pick is written straight to your{" "}
        {calendarMode === "arcade" ? "Google" : "demo"} calendar via Arcade.
      </p>

      {authUrl && (
        <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-xs text-[var(--ink)]">
          Connect your Google Calendar to finish syncing:{" "}
          <a href={authUrl} target="_blank" rel="noreferrer" className="underline">
            authorize here
          </a>
          .
        </p>
      )}
    </div>
  );
}
