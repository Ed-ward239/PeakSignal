"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Itinerary, WatchedTrip } from "@/lib/types";

/**
 * Client data layer.
 *
 *  - Signed in  → watched trips live in Postgres via /api/trips (synced here).
 *  - Guest      → trips live in localStorage, seeded from sample data so the
 *                 demo works with no account (spec §9) and survives offline
 *                 (spec §4.3 — offline resilience).
 *
 * Itineraries and share tokens are kept in localStorage in both modes; wiring
 * them to the DB is the same pattern as trips.
 */

interface StoreShape {
  hydrated: boolean;
  signedIn: boolean;
  trips: WatchedTrip[];
  itineraries: Record<string, Itinerary>;
  shares: Record<string, string>;
  addTrip: (t: WatchedTrip) => void;
  removeTrip: (id: string) => void;
  updateTrip: (id: string, patch: Partial<WatchedTrip>) => void;
  setItinerary: (it: Itinerary) => void;
  createShare: (tripId: string) => string;
}

const TRIPS_KEY = "peaksignal.trips.v1";
const PLANS_KEY = "peaksignal.plans.v1";
const StoreContext = createContext<StoreShape | null>(null);

interface Plans {
  itineraries: Record<string, Itinerary>;
  shares: Record<string, string>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Auth is being migrated (NextAuth removed; Neon Auth lands in Phase 1). The app
  // runs in guest mode meanwhile — trips live in localStorage. The DB-backed paths
  // below stay in place, gated on `signedIn`, ready for Phase 1 to flip on.
  const status = "unauthenticated" as "loading" | "authenticated" | "unauthenticated";
  const signedIn: boolean = false;

  const [hydrated, setHydrated] = useState(false);
  const [trips, setTrips] = useState<WatchedTrip[]>([]);
  const [dbMode, setDbMode] = useState(false); // true only when signed in AND the API is DB-backed
  const [plans, setPlans] = useState<Plans>({ itineraries: {}, shares: {} });

  // Plans (itineraries + shares) — localStorage in both modes.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLANS_KEY);
      if (raw) setPlans(JSON.parse(raw) as Plans);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans, hydrated]);

  // Trips — use the DB when signed in AND the API is DB-backed; otherwise fall
  // back to the local (seeded) watchlist, so signing in without a database
  // configured doesn't blank the list.
  useEffect(() => {
    if (status === "loading") return;
    let active = true;
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(TRIPS_KEY);
        const parsed = raw ? (JSON.parse(raw) as WatchedTrip[]) : [];
        // Strip any fabricated price history stored by older builds — this app
        // no longer generates dummy history; it accrues from real tracking.
        setTrips(parsed.map((t) => ({ ...t, priceHistory: [] })));
      } catch {
        setTrips([]);
      }
      setDbMode(false);
    };
    (async () => {
      if (signedIn) {
        try {
          const r = await fetch("/api/trips");
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data)) {
              if (active) { setTrips(data); setDbMode(true); }
              return;
            }
          }
        } catch {
          /* fall through to local */
        }
      }
      if (active) loadLocal();
    })().finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, [status, signedIn]);

  // Persist trips locally only in local mode (the DB owns them in DB mode).
  useEffect(() => {
    if (hydrated && !dbMode) localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  }, [trips, hydrated, dbMode]);

  const addTrip = (t: WatchedTrip) => {
    setTrips((s) => [t, ...s]);
    if (dbMode) {
      fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      }).catch(() => {});
    }
  };

  const removeTrip = (id: string) => {
    setTrips((s) => s.filter((t) => t.id !== id));
    if (dbMode) fetch(`/api/trips/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const updateTrip = (id: string, patch: Partial<WatchedTrip>) => {
    setTrips((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (dbMode) {
      fetch(`/api/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {});
    }
  };

  const setItinerary = (it: Itinerary) =>
    setPlans((p) => ({ ...p, itineraries: { ...p.itineraries, [it.tripId]: it } }));

  const createShare = (tripId: string) => {
    const token = Math.random().toString(36).slice(2, 10);
    setPlans((p) => ({ ...p, shares: { ...p.shares, [token]: tripId } }));
    return token;
  };

  const value: StoreShape = {
    hydrated, signedIn, trips,
    itineraries: plans.itineraries, shares: plans.shares,
    addTrip, removeTrip, updateTrip, setItinerary, createShare,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export function useTrip(id: string): WatchedTrip | undefined {
  return useStore().trips.find((t) => t.id === id);
}
