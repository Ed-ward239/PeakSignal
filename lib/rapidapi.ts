/**
 * Server-only RapidAPI fetch helper. NEVER import this from a client component —
 * RAPIDAPI_KEY must stay on the server.
 *
 * The *_HOST env vars hold full base URLs (e.g.
 * "https://booking-com15.p.rapidapi.com/api/v1"); we use them as the base and
 * derive the bare hostname for the required `x-rapidapi-host` header.
 */
export const BOOKING_BASE = process.env.RAPIDAPI_BOOKING_HOST ?? "";
export const AIRBNB_BASE = process.env.RAPIDAPI_AIRBNB_HOST ?? "";

function hostFromBase(base: string): string {
  return base.replace(/^https?:\/\//, "").split("/")[0];
}

type Params = Record<string, string | number | undefined>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rapidGet(base: string, path: string, params: Params = {}): Promise<any | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key || !base) return null; // not configured → caller falls back to mock

  const url = new URL(base.replace(/\/$/, "") + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": hostFromBase(base) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
