/**
 * Netlify scheduled function — fires the price poller every 6 hours (offset
 * 13 min so searches don't land exactly on the 6-hour Redis cache boundary).
 * All real work happens in the Next API route, where Prisma and the app's
 * lib/ clients are available; this function is just the alarm clock.
 *
 * Runs on published production deploys only. Requires CRON_SECRET to be set
 * in the Netlify environment (same value the API route checks).
 */
export default async () => {
  const base = process.env.URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/cron/poll`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
  });
  console.log(`price-poller: ${res.status} ${await res.text()}`);
};

export const config = { schedule: "13 */6 * * *" };
