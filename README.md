# Pawffice

Hackathon MVP that matches work-from-home users with shelter dogs for daytime fostering, walks, companionship, or trial adoption visits — then schedules a visit using calendar availability.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** schema ready for auth/DB (`supabase/schema.sql`)
- **Arcade.dev** calendar adapter (`lib/arcade`) for Google Calendar tools
- **Demo mode** works fully offline via `localStorage` (no paid services required)

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo story (Alex)

1. Go to **Demo** → **Alex + auto-approve background check**
2. Browse **Discover Dogs** (sorted by match %) or use **Companion finder**
3. Open a dog → **Schedule time with this dog**
4. **Find overlapping times** → pick a slot → **Confirm & create calendar event**
5. See the visit on **Dashboard** / **Schedule**; switch to shelter demo to see visits there

## Architecture

```
src/
  app/                 # Pages + /api/schedule
  components/          # UI, dog cards, swipe, nav
  data/seed.ts         # 8 seeded dogs + shelters + Alex prefs
  lib/
    matching/          # calculateDogMatch (transparent 0–100)
    arcade/            # CalendarProvider + Mock + Arcade adapters
    scheduling/        # Overlap finder vs busy times
    demo/store.tsx     # Client demo state (localStorage)
    supabase/          # Browser client (optional)
supabase/schema.sql    # Full relational schema
```

### Matching weights

| Factor | Weight |
|--------|--------|
| Size compatibility | 35% |
| Energy compatibility | 35% |
| Availability overlap | 20% |
| Secondary (housing, temperament, experience, distance) | 10% |

### Calendar flow

`POST /api/schedule` with `action: "suggest" | "book"`:

1. Verifies background check on the client before booking
2. Loads busy times via `CalendarProvider.getBusyTimes` (mock or Arcade `GoogleCalendar.ListEvents`)
3. Intersects with user + dog weekly availability
4. Returns top 3 slots
5. On book: `createEvent` with title `Meet [Dog] — [Shelter]` and saves the appointment in the demo store (Supabase table ready for later)

## Environment variables

See `.env.example`.

| Variable | Required for demo? | Purpose |
|----------|--------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `ARCADE_API_KEY` | No | Arcade.dev API key |
| `ARCADE_CALENDAR_MODE` | No | `mock` (default) or `arcade` |

## What is mocked

- **Auth** — demo login buttons (Alex / shelter), not live Supabase Auth
- **Background check** — mock Checkr-style statuses + “Simulate approval”
- **Data store** — seeded dogs/shelters/appointments in `localStorage`
- **Google Calendar** — `MockCalendarProvider` with realistic busy blocks
- **Shelter calendar** — modeled as availability JSON in the demo DB; user calendar is the Arcade integration surface

## Next step: connect Arcade.dev

1. Create an Arcade API key ([docs.arcade.dev](https://docs.arcade.dev))
2. Set `ARCADE_API_KEY` and `ARCADE_CALENDAR_MODE=arcade` in `.env.local`
3. On Schedule, switch the provider toggle to **Arcade.dev**
4. Complete Google OAuth when `ensureAuthorized` returns an `authUrl`
5. Tool calls used:
   - `GoogleCalendar.ListEvents` — busy times
   - `GoogleCalendar.CreateEvent` — visit event

Implementation lives in `src/lib/arcade/arcadeCalendar.ts`. Swap is already behind `createCalendarProvider()`.

## Connect Supabase later

1. Create a project and run `supabase/schema.sql`
2. Fill `NEXT_PUBLIC_SUPABASE_*` in `.env.local`
3. Replace demo store reads/writes with Supabase queries (schema matches the TypeScript types)

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```
