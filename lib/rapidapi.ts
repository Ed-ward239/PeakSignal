/**
 * Server-only RapidAPI fetch helper. NEVER import this from a client component —
 * RAPIDAPI_KEY must stay on the server.
 *
 * The *_HOST env vars hold full base URLs (e.g.
 * "https://booking-com15.p.rapidapi.com/api/v1"); we use them as the base and
 * derive the bare hostname for the required `x-rapidapi-host` header.
 */
import { createHash } from "crypto";
import { redisGet, redisSetEx } from "./redis";

export const BOOKING_BASE = process.env.RAPIDAPI_BOOKING_HOST ?? "";
export const AIRBNB_BASE = process.env.RAPIDAPI_AIRBNB_HOST ?? "";

function hostFromBase(base: string): string {
  return base.replace(/^https?:\/\//, "").split("/")[0];
}

type Params = Record<string, string | number | undefined>;

/** Common cache TTLs: place lookups never really change; searches go stale. */
export const TTL_LOOKUP = 30 * 24 * 3600; // 30 days
export const TTL_SEARCH = 6 * 3600; // 6 hours

function cacheKey(base: string, path: string, params: Params): string {
  const stable = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return "ps:rapid:v1:" + createHash("sha1").update(`${hostFromBase(base)}${path}?${stable}`).digest("hex");
}

export interface RapidResult {
  /** HTTP status; 0 = not configured, -1 = network error. */
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null;
}

/** True when the upstream refused us (rate limit / quota / auth) rather than
 *  genuinely having no results — callers surface this instead of an empty state. */
export function isDegraded(status: number): boolean {
  return status === -1 || status >= 400;
}

/**
 * GET from RapidAPI with an optional Redis cache (`cacheTtl` seconds). Only
 * successful (200) responses are cached, so quota errors never poison the
 * cache; cache hits cost zero quota — page refreshes stop hitting RapidAPI.
 */
export async function rapidGet(
  base: string,
  path: string,
  params: Params = {},
  cacheTtl?: number,
): Promise<RapidResult> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key || !base) return { status: 0, data: null }; // not configured → caller falls back

  const ck = cacheTtl ? cacheKey(base, path, params) : null;
  if (ck) {
    const hit = await redisGet(ck);
    if (hit) {
      try {
        return { status: 200, data: JSON.parse(hit) };
      } catch {
        /* corrupt entry → fall through to live fetch */
      }
    }
  }

  const url = new URL(base.replace(/\/$/, "") + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": hostFromBase(base) },
      cache: "no-store",
    });
    if (!res.ok) {
      // Make upstream refusals visible in the server log — a silent null here
      // shows up as a misleading "no results" in the UI (e.g. 429 = quota).
      console.warn(`[rapidapi] ${res.status} ${hostFromBase(base)}${path}`);
      return { status: res.status, data: null };
    }
    const data = await res.json();
    if (ck && cacheTtl) await redisSetEx(ck, cacheTtl, JSON.stringify(data));
    return { status: res.status, data };
  } catch {
    console.warn(`[rapidapi] network error ${hostFromBase(base)}${path}`);
    return { status: -1, data: null };
  }
}
