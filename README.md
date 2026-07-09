# Peak Signal

**Know when to buy. Know what to do when you get there.**

A full-stack travel intelligence web app. It tracks flight, hotel, and Airbnb
prices honestly — no commissions, no upsells — delivers a data-driven **buy /
wait** verdict, then activates a **per-trip AI itinerary planner** the moment you
decide to go.

Built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind**,
designed Apple-minimalist, and installable as a **PWA** (service worker +
offline page). Two-mode design: a dark, data-dense *intelligence* canvas for
Phase 1, a light, warm *planning* canvas for Phase 2.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Runs with an empty `.env` — every integration degrades gracefully (see below).
Sign-in is optional: **guest mode** keeps trips in `localStorage` and generated
itineraries in `sessionStorage`; signing in (Neon Auth, Google OAuth) syncs
everything to Postgres.

## Two phases

| Phase | Mode | What it does |
|-------|------|--------------|
| **1 — Price Intelligence** | dark | Watchlist, price history chart, live ±7-day flexible-date heat map, buy/wait verdict, multi-traveller + cabin-class pricing, hotel vs Airbnb comparison, experiences. |
| **2 — Trip Intelligence** | light | Per-trip profile builder → Gemini itinerary (flight-aware via your selected flights), day-by-day planner with drag-to-reorder, regenerate a day, find alternatives, interactive Mapbox map, budget tracker, `.ics` export, print-to-PDF, shareable read-only link. |

## Architecture

```
app/                       Next.js 16 App Router (pages + API routes)
  (app)/                   landing, watchlist, trip/[id]/{prices,compare,itinerary},
                           share/[token], settings, profile, privacy
  (auth)/sign-in           Neon Auth sign-in (Google OAuth)
  offline/                 PWA offline fallback page
  api/                     trips (+ per-trip itinerary), flights, stays, resolve,
                           price-calendar, itinerary (+ regenerate, alternatives),
                           itineraries, alerts, settings, cron/poll, auth/[...path]
components/
  ui/        prices/        itinerary/      design-system atoms + feature components
  store.tsx                client data layer — Postgres via API when signed in,
                           localStorage/sessionStorage for guests
lib/
  flights.ts · stays.ts    Booking.com via RapidAPI (flights, hotels) + airbnb19 scraper
  rapidapi.ts · redis.ts   server-only RapidAPI fetch helper + Upstash Redis cache
  gemini.ts · prompt.ts    Gemini itinerary generation (server-only, JSON-forced)
  viator.ts · mailer.ts    experiences (Viator/GetYourGuide) + Resend email alerts
  verdict.ts               buy/wait verdict algorithm (90-day rolling avg + days-to-departure decay)
  compare.ts · iata.ts · ics.ts · images.ts · sample-data.ts
  auth/                    Neon Auth server + client instances
prisma/schema.prisma       Neon PostgreSQL model (+ migrations)
cron/pricePoller.ts        price poller — live prices → history → verdict → email alerts
netlify/functions/         scheduled function fires the poller every 6 h via /api/cron/poll
public/sw.js               service worker (offline resilience)
netlify.toml               Netlify deploy config (prisma generate before build)
```

### Data & degradation model

Every external integration is written as a real client that **degrades
gracefully when its key is absent** — the app boots and demos with an empty
`.env` (see `.env.example`):

| Integration | With key | Without key |
|-------------|----------|-------------|
| **Booking.com via RapidAPI** (flights + hotels) | Live prices, place resolution, ±7-day price calendar | Empty results with a `degraded` flag so the UI says why (no fake flights) |
| **airbnb19 via RapidAPI** | Live listings, guarded by a city-match check against wrong-city results | Labelled estimate |
| **Gemini** (`gemini-2.5-flash`) | Real per-trip itineraries as structured JSON | Deterministic sample itinerary |
| **Neon Postgres + Neon Auth** | Sign-in, cross-device sync | Guest mode (localStorage/sessionStorage) |
| **Upstash Redis** | Response cache (30-day lookups, 6-hour searches) — protects RapidAPI quota | Best-effort no-op |
| **Resend** | Price-drop + buy-signal emails from the scheduled poller, honoring per-user Settings toggles | Alerts logged to the server console |
| **Viator / GetYourGuide, Mapbox** | Live experiences, interactive map | Mock experiences, static map placeholder |

## The verdict algorithm

`lib/verdict.ts` weighs the current price against the 90-day rolling average,
then applies a **days-to-departure decay** — prices typically rise in the ~3
weeks before departure, so as the trip nears the model biases toward *buy* rather
than waiting for a drop history says is unlikely. Highest-in-window prices return
*peak*.

## Honest API caveats (spec §9)

- **Amadeus was dropped.** Its free test environment returned stale, sparse data;
  the app now uses **Booking.com via RapidAPI** (`booking-com15`) for flights and
  hotels — live data, but metered by RapidAPI quota (hence the Redis cache and
  the `degraded` flag on 429s).
- **Airbnb** has no official public API. The `airbnb19` RapidAPI scraper is
  fragile and sometimes ignores location filters — results are guarded by a
  city-match check and dropped rather than shown wrong.
- **Viator / GetYourGuide** affiliate APIs need approval (Viator ~3–5 business
  days) — the client is scaffolded with mock fallback until then.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Recharts · Neon PostgreSQL +
Prisma · Neon Auth (Better Auth, Google OAuth) · Upstash Redis · RapidAPI
(Booking.com, Airbnb) · Viator · Gemini API · Resend · Mapbox GL · Netlify.
