// Core domain types (shared by client, API routes, and the verdict engine).

export type Signal = "buy" | "wait" | "peak";

export interface Verdict {
  signal: Signal;
  /** Percent away from the rolling average (always positive). */
  pct: number;
  headline: string;      // "BUY NOW" | "WAIT" | "PEAK PRICE"
  explanation: string;   // plain-English assessment (spec §3.2)
}

export type PriceCategory = "flight" | "hotel" | "airbnb" | "experience";

export interface PricePoint {
  date: string;          // ISO date
  low: number;
  high: number;
  average: number;
  category: PriceCategory;
}

export interface WatchedTrip {
  id: string;
  origin: string;        // IATA, e.g. "JFK"
  destination: string;   // IATA / city, e.g. "CDG"
  destinationName: string;
  departDate: string;    // ISO
  returnDate: string;    // ISO
  travellers: number;
  targetPrice?: number;
  createdAt: string;     // ISO
  isBooking: boolean;
  priceHistory: PricePoint[];
}

export interface StayQuote {
  kind: "hotel" | "airbnb";
  name: string;
  pricePerNight: number;
  cancellation: string;
  refundable: boolean;
  locationScore: number; // 0–10
  superhost?: boolean;
}

export interface Experience {
  id: string;
  title: string;
  pricePerPerson: number;
  rating: number;        // 0–5
  reviewCount: number;
  bookingUrl?: string;
  bookingWindowAdvice: string;
}

// ---- Phase 2 ----

export type TravelGroup = "solo" | "couple" | "family" | "friends";
export type Pace = "relaxed" | "balanced" | "packed";
export type Mobility = "standard" | "wheelchair_accessible";
export type Interest =
  | "food" | "art" | "nightlife" | "nature" | "history" | "shopping" | "adventure";

export interface Traveller {
  age: number;
  role: "adult" | "child" | "senior";
}

export interface TripProfile {
  group: TravelGroup;
  travellers: Traveller[];
  budgetPerPersonPerDay: number;
  pace: Pace;
  interests: Interest[];
  dietary: string[];
  mobility: Mobility;
}

export type Period = "morning" | "afternoon" | "evening";

export interface Slot {
  period: Period;
  activity: string;
  durationMins: number;
  costPerPerson: number;
  bookingUrl?: string;
  why: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  id: string;
  date: string;          // ISO
  theme: string;
  dayIndex: number;
  slots: Slot[];
}

export interface Itinerary {
  id: string;
  tripId: string;
  destinationName: string;
  arrival: string;       // ISO
  departure: string;     // ISO
  generatedAt: string;   // ISO
  profile?: TripProfile;
  days: ItineraryDay[];
  shareToken?: string;
}
