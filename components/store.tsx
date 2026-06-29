"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Itinerary, WatchedTrip } from "@/lib/types";
import { sampleItinerary, sampleTrips } from "@/lib/sample-data";

/**
 * Client-side data layer backed by localStorage (spec §4.3 — offline
 * resilience). Seeded from sample data on first load so the app is demoable
 * with no DB/auth. Production swaps these reads/writes for the API routes in
 * app/api/* backed by PostgreSQL (see lib/prisma.ts).
 */

interface StoreShape {
  hydrated: boolean;
  trips: WatchedTrip[];
  itineraries: Record<string, Itinerary>;
  shares: Record<string, string>; // token -> tripId
  addTrip: (t: WatchedTrip) => void;
  removeTrip: (id: string) => void;
  updateTrip: (id: string, patch: Partial<WatchedTrip>) => void;
  setItinerary: (it: Itinerary) => void;
  createShare: (tripId: string) => string;
}

const KEY = "peaksignal.store.v1";
const StoreContext = createContext<StoreShape | null>(null);

interface Persisted {
  trips: WatchedTrip[];
  itineraries: Record<string, Itinerary>;
  shares: Record<string, string>;
}

function seed(): Persisted {
  const it = sampleItinerary();
  return { trips: sampleTrips(), itineraries: { [it.tripId]: it }, shares: {} };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Persisted>({ trips: [], itineraries: {}, shares: {} });

  // Hydrate from localStorage (or seed) after mount — keeps SSR markup stable.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? (JSON.parse(raw) as Persisted) : seed());
    } catch {
      setState(seed());
    }
    setHydrated(true);
  }, []);

  // Persist on every change once hydrated.
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addTrip = (t: WatchedTrip) => setState((s) => ({ ...s, trips: [t, ...s.trips] }));
  const removeTrip = (id: string) =>
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  const updateTrip = (id: string, patch: Partial<WatchedTrip>) =>
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const setItinerary = (it: Itinerary) =>
    setState((s) => ({ ...s, itineraries: { ...s.itineraries, [it.tripId]: it } }));
  const createShare = (tripId: string) => {
    const token = Math.random().toString(36).slice(2, 10);
    setState((s) => ({ ...s, shares: { ...s.shares, [token]: tripId } }));
    return token;
  };

  const value: StoreShape = {
    hydrated, trips: state.trips, itineraries: state.itineraries, shares: state.shares,
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
