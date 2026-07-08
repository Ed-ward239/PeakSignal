"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import type { Itinerary, WatchedTrip } from "@/lib/types";

/**
 * Client data layer.
 *
 *  - Signed in  → watched trips AND itineraries live in Postgres via the API
 *                 (synced here, optimistic writes).
 *  - Guest      → trips live in localStorage (survive restarts); itineraries
 *                 are SESSION-ONLY by design (sessionStorage) — closing the
 *                 browser discards a guest's generated plans.
 *
 * Share tokens stay in localStorage in both modes (the share page resolves
 * them against this browser).
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
  removeItinerary: (tripId: string) => void;
  createShare: (tripId: string) => string;
}

const TRIPS_KEY = "peaksignal.trips.v1";
const SHARES_KEY = "peaksignal.shares.v1";
const ITINS_SESSION_KEY = "peaksignal.itineraries.v1"; // sessionStorage (guests)
const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Neon Auth session. Signed in → DB via the API; signed out → guest mode.
  const { data: sessionData, isPending } = authClient.useSession();
  const signedIn = Boolean(sessionData?.user);
  const status: "loading" | "authenticated" | "unauthenticated" = isPending
    ? "loading"
    : signedIn
      ? "authenticated"
      : "unauthenticated";

  const [hydrated, setHydrated] = useState(false);
  const [trips, setTrips] = useState<WatchedTrip[]>([]);
  const [dbMode, setDbMode] = useState(false); // true only when signed in AND the API is DB-backed
  const [itineraries, setItineraries] = useState<Record<string, Itinerary>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  // Shares — localStorage in both modes.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHARES_KEY);
      if (raw) setShares(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
  }, [shares, hydrated]);

  // Trips + itineraries — DB when signed in AND the API is DB-backed; otherwise
  // local (trips: localStorage; itineraries: sessionStorage), so signing in
  // without a database configured doesn't blank the list.
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
      try {
        const raw = sessionStorage.getItem(ITINS_SESSION_KEY);
        setItineraries(raw ? (JSON.parse(raw) as Record<string, Itinerary>) : {});
      } catch {
        setItineraries({});
      }
      setDbMode(false);
    };
    (async () => {
      if (signedIn) {
        try {
          const [tripsRes, itinsRes] = await Promise.all([
            fetch("/api/trips"),
            fetch("/api/itineraries"),
          ]);
          if (tripsRes.ok) {
            const data = await tripsRes.json();
            if (Array.isArray(data)) {
              if (!active) return;
              setTrips(data);
              setDbMode(true);
              if (itinsRes.ok) {
                const itins = await itinsRes.json().catch(() => null);
                if (itins && typeof itins === "object") setItineraries(itins as Record<string, Itinerary>);
              }
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

  // Persist locally only in guest mode (the DB owns the data in DB mode).
  useEffect(() => {
    if (hydrated && !dbMode) localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  }, [trips, hydrated, dbMode]);

  useEffect(() => {
    if (hydrated && !dbMode) sessionStorage.setItem(ITINS_SESSION_KEY, JSON.stringify(itineraries));
  }, [itineraries, hydrated, dbMode]);

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

  const setItinerary = (it: Itinerary) => {
    setItineraries((s) => ({ ...s, [it.tripId]: it }));
    if (dbMode) {
      fetch(`/api/trips/${it.tripId}/itinerary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(it),
      }).catch(() => {});
    }
  };

  const removeItinerary = (tripId: string) => {
    setItineraries((s) => {
      const { [tripId]: _gone, ...rest } = s;
      void _gone;
      return rest;
    });
    if (dbMode) fetch(`/api/trips/${tripId}/itinerary`, { method: "DELETE" }).catch(() => {});
  };

  const createShare = (tripId: string) => {
    const token = Math.random().toString(36).slice(2, 10);
    setShares((s) => ({ ...s, [token]: tripId }));
    return token;
  };

  const value: StoreShape = {
    hydrated, signedIn, trips, itineraries, shares,
    addTrip, removeTrip, updateTrip, setItinerary, removeItinerary, createShare,
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
