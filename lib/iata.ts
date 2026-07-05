/**
 * IATA airport code → human-readable city, so the user only enters the code and
 * we derive the display/search name (used for the watchlist title, headings, and
 * hotel/Airbnb/experience lookups). Unknown codes fall back to the code itself.
 */
const CITIES: Record<string, string> = {
  JFK: "New York, USA", LGA: "New York, USA", EWR: "New York, USA",
  LAX: "Los Angeles, USA", SFO: "San Francisco, USA", ORD: "Chicago, USA",
  MIA: "Miami, USA", BOS: "Boston, USA", SEA: "Seattle, USA", ATL: "Atlanta, USA",
  DFW: "Dallas, USA", LAS: "Las Vegas, USA", DEN: "Denver, USA",
  IAD: "Washington, USA", DCA: "Washington, USA", PHX: "Phoenix, USA", HNL: "Honolulu, USA",
  CDG: "Paris, France", ORY: "Paris, France",
  LHR: "London, UK", LGW: "London, UK", STN: "London, UK",
  HND: "Tokyo, Japan", NRT: "Tokyo, Japan",
  LIS: "Lisbon, Portugal", OPO: "Porto, Portugal",
  MAD: "Madrid, Spain", BCN: "Barcelona, Spain",
  FCO: "Rome, Italy", MXP: "Milan, Italy", LIN: "Milan, Italy", VCE: "Venice, Italy",
  AMS: "Amsterdam, Netherlands", BER: "Berlin, Germany", FRA: "Frankfurt, Germany",
  MUC: "Munich, Germany", DUB: "Dublin, Ireland", ZRH: "Zurich, Switzerland",
  VIE: "Vienna, Austria", CPH: "Copenhagen, Denmark", ARN: "Stockholm, Sweden",
  OSL: "Oslo, Norway", HEL: "Helsinki, Finland", ATH: "Athens, Greece",
  IST: "Istanbul, Turkey", PRG: "Prague, Czechia", BUD: "Budapest, Hungary",
  DXB: "Dubai, UAE", DOH: "Doha, Qatar", AUH: "Abu Dhabi, UAE",
  SIN: "Singapore", BKK: "Bangkok, Thailand", HKG: "Hong Kong", KUL: "Kuala Lumpur, Malaysia",
  ICN: "Seoul, South Korea", PEK: "Beijing, China", PVG: "Shanghai, China",
  DEL: "Delhi, India", BOM: "Mumbai, India", TPE: "Taipei, Taiwan",
  SYD: "Sydney, Australia", MEL: "Melbourne, Australia", AKL: "Auckland, New Zealand",
  YYZ: "Toronto, Canada", YVR: "Vancouver, Canada", YUL: "Montreal, Canada",
  GRU: "São Paulo, Brazil", GIG: "Rio de Janeiro, Brazil", MEX: "Mexico City, Mexico",
  CUN: "Cancún, Mexico", EZE: "Buenos Aires, Argentina", SCL: "Santiago, Chile",
  LIM: "Lima, Peru", BOG: "Bogotá, Colombia", CPT: "Cape Town, South Africa",
  JNB: "Johannesburg, South Africa", CAI: "Cairo, Egypt", NBO: "Nairobi, Kenya",
};

/** "CDG" → "Paris, France"; unknown codes return the code unchanged. */
export function cityForIata(code: string): string {
  return CITIES[code.trim().toUpperCase()] ?? code.trim().toUpperCase();
}

// Approximate coordinates for major hubs, used to guess the traveller's nearest
// departure airport from their browser geolocation.
const AIRPORTS: { code: string; lat: number; lng: number }[] = [
  { code: "JFK", lat: 40.64, lng: -73.78 }, { code: "LAX", lat: 33.94, lng: -118.41 },
  { code: "SFO", lat: 37.62, lng: -122.38 }, { code: "ORD", lat: 41.98, lng: -87.9 },
  { code: "MIA", lat: 25.8, lng: -80.29 }, { code: "BOS", lat: 42.36, lng: -71.01 },
  { code: "SEA", lat: 47.45, lng: -122.31 }, { code: "ATL", lat: 33.64, lng: -84.43 },
  { code: "DFW", lat: 32.9, lng: -97.04 }, { code: "DEN", lat: 39.86, lng: -104.67 },
  { code: "IAD", lat: 38.95, lng: -77.46 }, { code: "LAS", lat: 36.08, lng: -115.15 },
  { code: "PHX", lat: 33.43, lng: -112.01 }, { code: "HNL", lat: 21.32, lng: -157.92 },
  { code: "YYZ", lat: 43.68, lng: -79.63 }, { code: "YVR", lat: 49.19, lng: -123.18 },
  { code: "YUL", lat: 45.47, lng: -73.74 }, { code: "LHR", lat: 51.47, lng: -0.45 },
  { code: "CDG", lat: 49.01, lng: 2.55 }, { code: "AMS", lat: 52.31, lng: 4.76 },
  { code: "FRA", lat: 50.04, lng: 8.56 }, { code: "MAD", lat: 40.47, lng: -3.56 },
  { code: "BCN", lat: 41.3, lng: 2.08 }, { code: "FCO", lat: 41.8, lng: 12.25 },
  { code: "MUC", lat: 48.35, lng: 11.79 }, { code: "ZRH", lat: 47.46, lng: 8.55 },
  { code: "DUB", lat: 53.42, lng: -6.27 }, { code: "LIS", lat: 38.77, lng: -9.13 },
  { code: "CPH", lat: 55.62, lng: 12.65 }, { code: "ARN", lat: 59.65, lng: 17.92 },
  { code: "VIE", lat: 48.11, lng: 16.57 }, { code: "IST", lat: 41.28, lng: 28.74 },
  { code: "ATH", lat: 37.94, lng: 23.95 }, { code: "DXB", lat: 25.25, lng: 55.36 },
  { code: "DOH", lat: 25.27, lng: 51.61 }, { code: "SIN", lat: 1.36, lng: 103.99 },
  { code: "BKK", lat: 13.69, lng: 100.75 }, { code: "HKG", lat: 22.31, lng: 113.91 },
  { code: "ICN", lat: 37.46, lng: 126.44 }, { code: "HND", lat: 35.55, lng: 139.78 },
  { code: "PEK", lat: 40.08, lng: 116.58 }, { code: "PVG", lat: 31.14, lng: 121.81 },
  { code: "DEL", lat: 28.56, lng: 77.1 }, { code: "BOM", lat: 19.09, lng: 72.87 },
  { code: "SYD", lat: -33.94, lng: 151.18 }, { code: "MEL", lat: -37.67, lng: 144.84 },
  { code: "AKL", lat: -37.01, lng: 174.79 }, { code: "GRU", lat: -23.43, lng: -46.47 },
  { code: "MEX", lat: 19.44, lng: -99.07 }, { code: "EZE", lat: -34.82, lng: -58.54 },
  { code: "SCL", lat: -33.39, lng: -70.79 }, { code: "BOG", lat: 4.7, lng: -74.15 },
  { code: "CPT", lat: -33.97, lng: 18.6 }, { code: "JNB", lat: -26.13, lng: 28.24 },
  { code: "CAI", lat: 30.11, lng: 31.41 }, { code: "NBO", lat: -1.32, lng: 36.93 },
];

/** Nearest major airport code to a lat/lng (squared-distance; good enough). */
export function nearestAirport(lat: number, lng: number): string {
  let best = AIRPORTS[0];
  let min = Infinity;
  for (const a of AIRPORTS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < min) { min = d; best = a; }
  }
  return best.code;
}
