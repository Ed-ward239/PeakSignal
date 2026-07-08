/**
 * Upstash Redis over REST (spec §5 cache layer). Server-only. Best-effort:
 * every helper no-ops / returns null when Upstash isn't configured or errors,
 * so the app works without it — the cache only ever removes work.
 */
const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

export const redisEnabled = Boolean(URL_ && TOKEN);

const headers = { Authorization: `Bearer ${TOKEN}` };

export async function redisGet(key: string): Promise<string | null> {
  if (!redisEnabled) return null;
  try {
    const res = await fetch(`${URL_}/get/${encodeURIComponent(key)}`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as { result: string | null };
    return j.result ?? null;
  } catch {
    return null;
  }
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  if (!redisEnabled) return;
  try {
    await fetch(`${URL_}/set/${encodeURIComponent(key)}?EX=${Math.max(1, Math.floor(ttlSeconds))}`, {
      method: "POST",
      headers,
      body: value,
      cache: "no-store",
    });
  } catch {
    /* best-effort */
  }
}
