import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarProvider,
  TimeRange,
} from "./types";

/**
 * Demo calendar provider — no Arcade API key required.
 * Pretends the user has a few standing meetings so scheduling still
 * has realistic constraints for the hackathon story.
 */
export class MockCalendarProvider implements CalendarProvider {
  async ensureAuthorized() {
    return { authorized: true as const };
  }

  async getBusyTimes(start: Date, end: Date): Promise<TimeRange[]> {
    const busy: TimeRange[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    while (cursor < end) {
      const day = cursor.getDay(); // 0 Sun … 6 Sat
      // Standing standup weekdays 9–10
      if (day >= 1 && day <= 5) {
        busy.push({
          start: at(cursor, 9, 0),
          end: at(cursor, 10, 0),
        });
        // Midday focus block Tue/Thu 11–12
        if (day === 2 || day === 4) {
          busy.push({
            start: at(cursor, 11, 0),
            end: at(cursor, 12, 0),
          });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return busy;
  }

  async createEvent(event: CalendarEventInput): Promise<CalendarEvent> {
    return {
      id: `mock-evt-${Date.now()}`,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      htmlLink: undefined,
      provider: "mock",
    };
  }
}

function at(day: Date, hour: number, minute: number) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}
