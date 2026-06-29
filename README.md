# Peak Signal

**Know when to buy. Know what to do when you get there.**

A full-stack travel intelligence web app. It tracks flight, hotel, and Airbnb
prices honestly — no commissions, no upsells — delivers a data-driven **buy /
wait** verdict, then activates a **per-trip AI itinerary planner** the moment you
decide to go.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind**, designed
Apple-minimalist, and installable as a **PWA**. Two-mode design: a dark,
data-dense *intelligence* canvas for Phase 1, a light, warm *planning* canvas for
Phase 2.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

No keys, database, or auth required. The app seeds deterministic sample trips
(Paris, Tokyo, Lisbon) and a Paris family itinerary so every screen is demoable
immediately. Try the live demo from the landing page, or open `/watchlist`.

## Two phases

| Phase | Mode | What it does |
|-------|------|--------------|
| **1 — Price Intelligence** | dark | Watchlist, 90-day candlestick chart, flexible-date heat map, buy/wait verdict, multi-traveller pricing, hotel vs Airbnb comparison, experiences. |
| **2 — Trip Intelligence** | light | Per-trip profile builder → Claude itinerary, day-by-day planner, regenerate a day, find alternatives, interactive map, budget tracker, `.ics`/PDF export, shareable link. |

## Architecture

```
app/                       Next.js App Router (pages + API routes)
  (app)/                   landing, watchlist, trip/[id]/{prices,compare,itinerary}, share/[token]
  (auth)/sign-in           NextAuth UI scaffold
  api/                     trips, prices, itinerary, alerts, auth
components/
  ui/        prices/        itinerary/      design-system atoms + feature components
  store.tsx                client data layer (localStorage; swap for the API routes)
lib/
  amadeus · airbnb · viator · claude · mailer   API clients (mock fallback)
  verdict.ts               buy/wait verdict algorithm (90-day rolling avg + days-to-departure decay)
  prompt.ts · ics.ts · sample-data.ts
prisma/schema.prisma       production PostgreSQL model (spec §6.3)
cron/pricePoller.ts        node-cron server-side polling scaffold
public/sw.js               service worker (offline resilience)
```

### Demo vs production

This build is **frontend-complete and runs entirely on a mock data layer** so it
deploys to Vercel with zero configuration. Every external integration is written
as a real client that **degrades gracefully to deterministic mock data when its
API key is absent** (see `lib/*`). To go live, fill in `.env.local` (see
`.env.example`), install `@prisma/client`, `next-auth`, `node-cron`, `mapbox-gl`,
and switch the client store reads to the API routes.

## The verdict algorithm

`lib/verdict.ts` weighs the current price against the 90-day rolling average,
then applies a **days-to-departure decay** — prices typically rise in the ~3
weeks before departure, so as the trip nears the model biases toward *buy* rather
than waiting for a drop history says is unlikely. Highest-in-window prices return
*peak*.

## Honest API caveats (spec §9)

- **Amadeus** ships a free test environment (no approval needed). Data can be a
  few hours stale and may omit some airlines — fine for a portfolio app.
- **Airbnb** has no official public API. The RapidAPI scraper approach is fragile
  and can be blocked; production scale would need an official partnership.
- **Viator / GetYourGuide** affiliate APIs need approval (Viator ~3–5 business
  days) — apply early.

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · Recharts · PostgreSQL + Prisma ·
NextAuth.js · Upstash Redis · Amadeus · RapidAPI · Viator · Claude API · Resend ·
Mapbox GL · Vercel.
