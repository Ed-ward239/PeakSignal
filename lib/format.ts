import { format, differenceInCalendarDays, parseISO } from "date-fns";

/** "$1,124" — no decimals, grouped. */
export function asPrice(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** "19%" from 19.4. */
export function asPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** "Nov 8" */
export function shortDay(iso: string): string {
  return format(parseISO(iso), "MMM d");
}

/** "Mon" */
export function weekdayAbbrev(iso: string): string {
  return format(parseISO(iso), "EEE");
}

/** Days from today until an ISO date (negative if past). */
export function daysFromNow(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

/** Nights between two ISO dates (min 1). */
export function nightsBetween(arrival: string, departure: string): number {
  return Math.max(1, differenceInCalendarDays(parseISO(departure), parseISO(arrival)));
}
