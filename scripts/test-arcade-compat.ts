/**
 * Arcade compatibility smoke test (shelter calendar + dog IDs).
 * Usage: npm run test:arcade
 */
import Arcade from "@arcadeai/arcadejs";
import {
  createCalendarProvider,
  dogIdTag,
  MockCalendarProvider,
} from "../src/lib/arcade/index";
import { ArcadeCalendarProvider } from "../src/lib/arcade/arcadeCalendar";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const results: Array<{ check: string; ok: boolean; detail: string }> = [];

  const client = new Arcade({ apiKey: process.env.ARCADE_API_KEY || "ark_test" });
  results.push({
    check: "SDK methods exist",
    ok:
      typeof client.tools.execute === "function" &&
      typeof client.tools.authorize === "function",
    detail: "tools.execute / tools.authorize",
  });

  let threwWithoutKey = false;
  const prevKey = process.env.ARCADE_API_KEY;
  try {
    process.env.ARCADE_API_KEY = "";
    createCalendarProvider({
      userId: "hello@bayviewfriends.demo",
      mode: "arcade",
    });
  } catch {
    threwWithoutKey = true;
  } finally {
    process.env.ARCADE_API_KEY = prevKey;
  }
  results.push({
    check: "Arcade mode does not silently fall back without key",
    ok: threwWithoutKey,
    detail: threwWithoutKey ? "throws when key missing" : "unexpected success",
  });

  const mock = new MockCalendarProvider();
  const dogId = "dog-luna";
  const busy = await mock.getBusyTimesForDog(
    dogId,
    new Date(),
    new Date(Date.now() + 5 * 864e5),
  );
  const evt = await mock.createDogEvent({
    dogId,
    title: `Meet Luna — Bayview`,
    description: `${dogIdTag(dogId)}\nvisitor test`,
    start: new Date(Date.now() + 864e5),
    end: new Date(Date.now() + 864e5 + 3600e3),
    attendeeEmails: ["alex@pawffice.demo"],
  });
  results.push({
    check: "Mock shelter calendar is dog-scoped",
    ok: busy.length > 0 && evt.dogId === dogId && evt.description.includes(dogIdTag(dogId)),
    detail: `busy=${busy.length}, dogId=${evt.dogId}`,
  });

  const apiKey = (process.env.ARCADE_API_KEY || "").trim();
  if (!apiKey) {
    results.push({
      check: "Live Arcade API",
      ok: false,
      detail: "ARCADE_API_KEY empty — skipped",
    });
  } else {
    try {
      const live = new Arcade({ apiKey });
      const tools = await live.tools.list({ toolkit: "GoogleCalendar", limit: 20 });
      const names = (tools.items ?? []).map(
        (t: { qualified_name?: string; name?: string }) =>
          t.qualified_name || t.name || "",
      );
      results.push({
        check: "GoogleCalendar toolkit tools",
        ok: names.some((n) => n.includes("ListEvents")) &&
          names.some((n) => n.includes("CreateEvent")),
        detail: names.filter((n) => n.includes("GoogleCalendar")).join(", "),
      });

      const provider = new ArcadeCalendarProvider(
        "hello@bayviewfriends.demo",
        apiKey,
      );
      const auth = await provider.ensureAuthorized();
      results.push({
        check: "Shelter calendar ensureAuthorized",
        ok: true,
        detail: auth.authorized
          ? "shelter Google already authorized"
          : `needs shelter consent: ${auth.authUrl ? "authUrl ok" : "no url"}`,
      });
    } catch (error) {
      results.push({
        check: "Live Arcade API",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("\nArcade compatibility report (shelter / dog ID)\n");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.check}`);
    console.log(`      ${r.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
