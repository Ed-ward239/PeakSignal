# Peak Signal

**Know when to buy. Know what to do when you get there.**

A native iOS travel intelligence app that treats trip planning like a stock trader treats the market — watch the signals, strike at the right moment, then execute the plan.

> *"In trading, you watch the signal and act at the right moment. Peak Signal applies that same discipline to travel pricing — flights, hotels, and experiences all have signals. When the price signal peaks and starts to drop, you buy. When it's still climbing, you wait."*

Swift / SwiftUI · iOS 17+ · portfolio project.

---

## Two-phase product

| Phase | Name | What it does | Triggered by |
|-------|------|--------------|--------------|
| **1** | Price Intelligence | Track flights, hotels, Airbnb & experiences. Price-history charts, flexible-date heat map, buy/wait verdict, push alerts. | Adding a trip you're considering |
| **2** | Trip Intelligence | Per-trip AI itinerary builder. Fill in who's coming, budget, pace, interests → Claude builds a day-by-day plan. | Tapping **"I'm booking this trip"** (manual) |

The design shifts with the phase: Phase 1 is a **dark, data-dense financial** aesthetic (analytical buying mode); Phase 2 is a **warm, light** palette (exploratory planning mode).

---

## Architecture

```
                         ┌─────────────────────────┐
                         │     PeakSignalApp        │
                         │  (SwiftData + CloudKit)  │
                         └────────────┬────────────┘
                                      │ AppRouter
              ┌───────────────────────┴────────────────────────┐
              ▼                                                 ▼
  ┌───────────────────────┐                       ┌───────────────────────┐
  │  Phase 1 — Intelligence│                       │  Phase 2 — Planning    │
  │  (dark / financial)    │                       │  (light / warm)        │
  ├───────────────────────┤                       ├───────────────────────┤
  │ Views: Watchlist,      │                       │ Views: TripProfile,    │
  │   PriceDetail, HeatMap,│                       │   Itinerary, DayDetail,│
  │   AccommodationCompare │                       │   TripMap, TripBudget  │
  │ Models: WatchedTrip,   │                       │ Models: TripProfile,   │
  │   PricePoint, Verdict  │                       │   Itinerary, …Day      │
  │ Services:              │                       │ Services:              │
  │   AmadeusService ──────┼──► Amadeus API        │   ClaudeService ───────┼──► Claude API
  │   AirbnbService ───────┼──► RapidAPI           │   ItineraryPromptBuilder│
  │   ViatorService ───────┼──► Viator/GYG         │   ItineraryParser      │
  │   PriceEngine (verdict)│                       └───────────────────────┘
  │   BackgroundSync ──────┼──► BGTaskScheduler
  └───────────────────────┘
        │
        ├── Widgets/  → ActivityKit Live Activity (Lock Screen price ticker)
        └── AppClip/  → shareable iMessage flight price card
```

The folder layout under `App/`, `Phase1_Intelligence/`, `Phase2_Planning/`, `Shared/`, `AppClip/`, and `Widgets/` mirrors section 7 of the project spec.

---

## Getting started

This repo holds **source + an XcodeGen spec**, not a committed `.xcodeproj`. Generate the project on a Mac:

```bash
brew install xcodegen
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig   # then fill in keys
xcodegen generate
open PeakSignal.xcodeproj
```

Set your Apple Developer **Team ID** in `project.yml` (`DEVELOPMENT_TEAM`) for code signing, CloudKit, push, and App Clips.

### API keys

Fill `Config/Secrets.xcconfig` (gitignored). Required per feature:

| Key | Used by | How to get it |
|-----|---------|---------------|
| `AMADEUS_CLIENT_ID` / `_SECRET` | Flights + hotels | [developers.amadeus.com](https://developers.amadeus.com) — free self-service, no approval |
| `RAPIDAPI_KEY` / `_AIRBNB_HOST` | Airbnb pricing | [rapidapi.com](https://rapidapi.com) Airbnb scraper |
| `VIATOR_API_KEY` | Experiences | Viator affiliate programme (apply early — 3–5 business days) |
| `GETYOURGUIDE_API_KEY` | Experiences | GetYourGuide affiliate API |
| `ANTHROPIC_API_KEY` | Phase 2 itineraries | [console.anthropic.com](https://console.anthropic.com) |

---

## Honest API caveats

Documenting limitations honestly is itself a signal of engineering maturity.

- **Amadeus test environment** — free and approval-free, perfect for a portfolio build. Test data is close to real-time but can be a few hours stale and may not reflect all airlines. Fine for light personal usage; swap `AMADEUS_HOST` to `api.amadeus.com` for production.
- **Airbnb** — no official public API. The RapidAPI scraper works for a portfolio app but is **fragile** and can be blocked at any time. A production app would require an official API partnership.
- **Viator / GetYourGuide** — both offer accessible affiliate APIs; approval takes ~3–5 business days, so apply early.

---

## Build milestones

- **1a** Core price intelligence — Amadeus OAuth + flight search, SwiftData schema, CloudKit watchlist, candlestick chart, verdict algorithm
- **1b** Accommodation + experiences — hotels, Airbnb, hotel-vs-Airbnb compare, Viator, multi-traveller toggle
- **1c** Platform features — BackgroundTasks, push alerts, Live Activity, App Clips, date heat map
- **2a** Trip profile + itinerary generation — profile builder, Claude integration, parser, day view, regenerate-day
- **2b** Map, calendar, sharing — MapKit, drag-to-rearrange, EventKit, PDFKit, budget tracker
- **3** Polish + launch — offline mode, onboarding, App Store assets, this README

## Tech stack

SwiftUI · SwiftData · CloudKit · Swift Charts · BackgroundTasks · UserNotifications · ActivityKit · App Clips · MapKit · EventKit · PDFKit · Amadeus · RapidAPI · Viator/GetYourGuide · Claude API (`claude-sonnet-4-6`).