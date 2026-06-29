import type { Experience } from "./types";

/**
 * Viator / GetYourGuide experiences client (spec §5, §9). Affiliate APIs need
 * approval (3–5 business days); falls back to mock data without keys.
 */
const isConfigured = Boolean(process.env.VIATOR_API_KEY);

export async function getExperiences(destination: string): Promise<Experience[]> {
  if (isConfigured) {
    // TODO: GET Viator /products by destination → map to Experience[].
  }
  return [
    { id: "exp_louvre", title: "Skip-the-Line Louvre Guided Tour", pricePerPerson: 69, rating: 4.8,
      reviewCount: 12430, bookingUrl: "https://www.viator.com",
      bookingWindowAdvice: "Book 2+ weeks ahead — sells out in peak season" },
    { id: "exp_seine", title: "Seine River Evening Cruise", pricePerPerson: 38, rating: 4.6,
      reviewCount: 8902, bookingUrl: "https://www.viator.com",
      bookingWindowAdvice: "Same-week booking usually fine" },
    { id: "exp_versailles", title: "Versailles Palace + Gardens Day Trip", pricePerPerson: 110, rating: 4.7,
      reviewCount: 5318, bookingUrl: "https://www.getyourguide.com",
      bookingWindowAdvice: "Book early — limited timed entries" },
    { id: "exp_montmartre", title: "Montmartre Food Walking Tour", pricePerPerson: 95, rating: 4.9,
      reviewCount: 3204, bookingUrl: "https://www.getyourguide.com",
      bookingWindowAdvice: "Small groups — reserve 1 week ahead" },
  ];
}
