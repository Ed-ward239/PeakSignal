/**
 * Place photos for itinerary slots — keyword-matched to a curated set of
 * Unsplash images (reliable CDN, no API key). Production could swap in Google
 * Places photos or the Unsplash Search API for exact-venue imagery. The UI
 * degrades to a gradient if an image fails to load (see SlotImage).
 */
const PHOTO: Record<string, string> = {
  eiffel: "1502602898657-3e91760cbb34",
  market: "1488459716781-31db52582fe9",
  louvre: "1565099824688-e93eb20fe622",
  artMuseum: "1574169208507-84376144848b",
  garden: "1496564203457-11bb12075d90",
  restaurant: "1414235077428-338989a2e8c0",
  cafe: "1559925393-8be0ec4767c8",
  boat: "1520939817895-060bdaf4fe1b",
  palace: "1591289009723-aef0a1a8a211",
  church: "1522093007474-d86e9bf7ba6f",
  dessert: "1488900128323-21503983a07e",
  canal: "1467269204594-9661b134dd2b",
  science: "1518770660439-4636190af475",
  city: "1499856871958-5b9627545d1a",
};

// First matching pattern wins; falls back to a city/street photo.
const RULES: [RegExp, keyof typeof PHOTO][] = [
  [/eiffel|tower/, "eiffel"],
  [/market|rue cler/, "market"],
  [/louvre/, "louvre"],
  [/orsay|museum|gallery|art|exhibit/, "artMuseum"],
  [/garden|jardin|park|luxembourg|plantes|playground/, "garden"],
  [/science|cité des sciences|zoo/, "science"],
  [/cruise|seine|river|boat/, "boat"],
  [/versailles|palace|château|chateau/, "palace"],
  [/montmartre|sacr|chapelle|sainte|church|cathedral|basilica/, "church"],
  [/ice cream|berthillon|gelato|dessert|pâtiss|patiss/, "dessert"],
  [/canal/, "canal"],
  [/dinner|lunch|restaurant|café|cafe|crêp|crep|bistro|food|eat|brunch/, "restaurant"],
];

function url(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop&q=80`;
}

export function placeImage(activity: string, _destination?: string): string {
  const a = activity.toLowerCase();
  for (const [re, key] of RULES) if (re.test(a)) return url(PHOTO[key]);
  return url(PHOTO.city);
}
