import { addDays } from "date-fns";
import type { FlightContext, Itinerary, ItineraryDay, Period, PreTripItem, Slot, TripProfile } from "./types";
import { sampleItinerary } from "./sample-data";
import { buildPrompt } from "./prompt";

/**
 * Gemini client for per-trip itinerary generation (spec §4.2, §5). SERVER-ONLY —
 * the key must never reach the client; UI components call the /api/itinerary*
 * routes via lib/itinerary-client.ts.
 *
 * Falls back to the deterministic sample itinerary when GEMINI_API_KEY is absent
 * or the call/parse fails, so the planner stays fully demoable offline.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const isConfigured = Boolean(process.env.GEMINI_API_KEY);

/** POST a prompt, force a JSON response, parse it. Null on any failure. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function geminiJSON(prompt: string): Promise<any | null> {
  if (!isConfigured) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      console.warn(`[gemini] ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const j = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text: string = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("[gemini] request/parse failed", e instanceof Error ? e.message : e);
    return null;
  }
}

const PERIODS: Period[] = ["morning", "afternoon", "evening"];

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSlot(period: Period, raw: any): Slot | null {
  if (!raw?.activity) return null;
  return {
    period,
    activity: String(raw.activity),
    durationMins: num(raw.duration_mins ?? raw.durationMins) ?? 90,
    costPerPerson: num(raw.cost_pp ?? raw.costPerPerson) ?? 0,
    bookingUrl: raw.booking_url ?? raw.bookingUrl ?? undefined,
    why: String(raw.why ?? ""),
    lat: num(raw.lat),
    lng: num(raw.lng),
  };
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export async function generateItinerary(
  profile: TripProfile,
  destination: string,
  arrival: string,
  departure: string,
  tripId: string,
  flights?: FlightContext,
): Promise<Itinerary> {
  const data = await geminiJSON(buildPrompt(profile, destination, arrival, departure, flights));
  if (data) {
    const dayKeys = Object.keys(data)
      .filter((k) => /^day_\d+$/.test(k))
      .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
    const days: ItineraryDay[] = [];
    for (let i = 0; i < dayKeys.length; i++) {
      const d = data[dayKeys[i]];
      const slots = PERIODS.map((p) => toSlot(p, d?.[p])).filter((s): s is Slot => s !== null);
      if (slots.length === 0) continue;
      days.push({
        id: `${tripId}-d${i + 1}`,
        date: isoDay(addDays(new Date(arrival), i)),
        theme: String(d?.theme ?? `Day ${i + 1}`),
        dayIndex: i,
        slots,
      });
    }
    if (days.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preTrip: PreTripItem[] = (Array.isArray(data.pre_trip) ? data.pre_trip : [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((t: any) => t?.task)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((t: any) => ({ task: String(t.task), note: t.note ? String(t.note) : undefined }));
      return {
        id: `it_${tripId}`,
        tripId,
        destinationName: destination,
        arrival,
        departure,
        generatedAt: new Date().toISOString(),
        profile,
        days,
        preTrip: preTrip.length > 0 ? preTrip : undefined,
        flightAware: Boolean(flights?.arrivalAt || flights?.departureAt),
      };
    }
  }

  // Fallback — deterministic sample so the planner works with no key.
  await delay(700);
  const it = sampleItinerary(tripId);
  it.destinationName = destination;
  it.arrival = arrival;
  it.departure = departure;
  it.profile = profile;
  it.generatedAt = new Date().toISOString();
  it.preTrip = [
    { task: "Book timed-entry tickets for headline attractions", note: "Popular museums and towers sell out days ahead." },
    { task: "Arrange the airport transfer", note: "Compare train, bus, and taxi for your arrival time." },
    { task: "Set up connectivity", note: "An eSIM or roaming plan saves airport queues." },
  ];
  it.flightAware = false; // the sample plan ignores flight times
  return it;
}

export async function regenerateDay(day: ItineraryDay, destination: string): Promise<ItineraryDay> {
  const avoid = day.slots.map((s) => s.activity).join("; ");
  const data = await geminiJSON(
    [
      `You are an expert local travel planner for ${destination}.`,
      `Plan a fresh alternative day (date ${day.date}) with a morning, afternoon,`,
      `and evening slot. Do NOT repeat any of these activities: ${avoid}.`,
      'Return STRICT JSON: { "theme": <short label>, "morning": {...},',
      '"afternoon": {...}, "evening": {...} } — each slot has: activity,',
      "duration_mins, cost_pp, booking_url (optional), why (one sentence), lat, lng.",
    ].join("\n"),
  );
  if (data) {
    const slots = PERIODS.map((p) => toSlot(p, data?.[p])).filter((s): s is Slot => s !== null);
    if (slots.length > 0) return { ...day, theme: String(data.theme ?? day.theme), slots };
  }

  await delay(500);
  return {
    ...day,
    theme: "Alternative: hidden-gems day",
    slots: [
      { period: "morning", activity: "Canal Saint-Martin stroll + café", durationMins: 90, costPerPerson: 8,
        why: "Relaxed, local, stroller-friendly", lat: 48.8709, lng: 2.3674 },
      { period: "afternoon", activity: "Cité des Sciences (kids' science museum)", durationMins: 150, costPerPerson: 13,
        why: "Hands-on exhibits for ages 5 and 8", lat: 48.8957, lng: 2.388 },
      { period: "evening", activity: "Early dinner at a crêperie", durationMins: 75, costPerPerson: 20,
        why: "Nut-allergy aware, quick for tired kids", lat: 48.842, lng: 2.325 },
    ],
  };
}

export async function findAlternatives(slot: Slot, destination: string): Promise<Slot[]> {
  const data = await geminiJSON(
    [
      `You are an expert local travel planner for ${destination}.`,
      `Suggest exactly 3 alternatives to this ${slot.period} activity: "${slot.activity}".`,
      "Keep a similar duration and budget. Return STRICT JSON: an array of 3 slots,",
      "each with: activity, duration_mins, cost_pp, booking_url (optional),",
      "why (one sentence), lat, lng.",
    ].join("\n"),
  );
  if (Array.isArray(data)) {
    const alts = data.map((raw) => toSlot(slot.period, raw)).filter((s): s is Slot => s !== null);
    if (alts.length > 0) return alts.slice(0, 3);
  }

  await delay(450);
  return [
    { period: slot.period, activity: "Sainte-Chapelle stained-glass visit", durationMins: 60, costPerPerson: 11,
      why: "Short, dazzling, history angle", lat: 48.8554, lng: 2.345 },
    { period: slot.period, activity: "Berthillon ice cream + Île Saint-Louis walk", durationMins: 60, costPerPerson: 7,
      why: "Treat for the kids, easy pace", lat: 48.8517, lng: 2.357 },
    { period: slot.period, activity: "Jardin des Plantes + small zoo", durationMins: 120, costPerPerson: 13,
      why: "Outdoor, wheelchair-friendly paths", lat: 48.8443, lng: 2.3599 },
  ];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
