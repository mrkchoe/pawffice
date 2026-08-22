import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarProvider,
  TimeRange,
} from "./types";
import { dogIdTag, eventBelongsToDog } from "./dogTags";

/**
 * Demo shelter calendar — no Arcade key required.
 * Synthesizes dog-scoped busy blocks so slot finding still works offline.
 */
export class MockCalendarProvider implements CalendarProvider {
  async ensureAuthorized() {
    return { authorized: true as const };
  }

  async getBusyTimesForDog(
    dogId: string,
    start: Date,
    end: Date,
  ): Promise<TimeRange[]> {
    const busy: TimeRange[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    // Stable offset per dog so different dogs block different hours.
    const offset = hashDog(dogId) % 3;

    while (cursor < end) {
      const day = cursor.getDay();
      if (day >= 1 && day <= 5) {
        busy.push({
          start: at(cursor, 9 + offset, 0),
          end: at(cursor, 10 + offset, 0),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // Tag awareness for tests — filter is a no-op on synthetic data.
    void eventBelongsToDog;
    void dogIdTag;
    return busy;
  }

  async createDogEvent(event: CalendarEventInput): Promise<CalendarEvent> {
    return {
      id: `mock-evt-${event.dogId}-${Date.now()}`,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      htmlLink: undefined,
      provider: "mock",
      dogId: event.dogId,
    };
  }
}

function hashDog(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return h;
}

function at(day: Date, hour: number, minute: number) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}
