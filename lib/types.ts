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

/** Cabin class for flight search (Booking.com values). */
export type CabinClass = "ECONOMY" | "BUSINESS" | "FIRST";

export interface WatchedTrip {
  id: string;
  origin: string;        // IATA, e.g. "JFK"
  destination: string;   // IATA / city, e.g. "CDG"
  destinationName: string;
  departDate: string;    // ISO
  returnDate: string;    // ISO (ignored when roundTrip is false)
  roundTrip: boolean;
  travellers: number;
  /** Seat class searched/tracked; legacy trips without one mean ECONOMY. */
  cabinClass?: CabinClass;
  targetPrice?: number;
  createdAt: string;     // ISO
  isBooking: boolean;
  priceHistory: PricePoint[];
  /** Flights the traveller picked — the itinerary planner works around their times. */
  selectedFlights?: SelectedFlights;
}

export interface SelectedFlights {
  outbound?: Flight;
  return?: Flight;
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

/** One flight leg (used in the expanded Google Flights–style detail view). */
export interface FlightLeg {
  departTime: string;   // ISO, e.g. "2026-11-21T19:25:00" — full date for layover math
  arriveTime: string;   // ISO
  fromCode: string;     // "JFK"
  fromName: string;     // "John F. Kennedy International Airport"
  toCode: string;
  toName: string;
  airline: string;
  flightNumber: string; // "FI 614"
  durationMins: number;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departTime: string;   // "08:30"
  arriveTime: string;   // "20:45"
  durationMins: number;
  stops: number;        // 0 = nonstop
  price: number;        // per person
  bookingUrl: string;
  legs?: FlightLeg[];   // per-leg detail incl. layover airports
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
  /** Free-text extra context the traveller wants Claude to consider. */
  notes?: string;
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
  imageUrl?: string;
}

export interface ItineraryDay {
  id: string;
  date: string;          // ISO
  theme: string;
  dayIndex: number;
  slots: Slot[];
}

/** Flight timing context handed to the itinerary planner. */
export interface FlightContext {
  arrivalAt?: string;      // ISO datetime the traveller lands at the destination
  departureAt?: string;    // ISO datetime the return flight leaves
  outboundSummary?: string; // "Icelandair FI 614 · lands 12:10"
  returnSummary?: string;
}

/** A to-do to complete before the trip (advance bookings, passes, etc.). */
export interface PreTripItem {
  task: string;
  note?: string;
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
  /** "Before you go" checklist (generated alongside the plan). */
  preTrip?: PreTripItem[];
  /** True when the plan was generated around real flight times. */
  flightAware?: boolean;
  shareToken?: string;
}

// ---- Account ----

export type AlertFrequency = "instant" | "daily" | "weekly";

/** Notification preferences (Settings page; consumed by the cron poller). */
export interface NotificationSettings {
  emailPriceDrop: boolean; // price falls below target
  emailBuySignal: boolean; // verdict flips to BUY
  weeklyDigest: boolean;   // weekly price summary
  frequency: AlertFrequency;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  emailPriceDrop: true,
  emailBuySignal: true,
  weeklyDigest: false,
  frequency: "instant",
};
