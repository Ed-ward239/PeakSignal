import { addMinutes, parseISO, set } from "date-fns";
import type { Itinerary } from "./types";

/**
 * Builds an RFC 5545 .ics calendar (spec §4.3) — importable into Google
 * Calendar and Apple Calendar. Each slot becomes a timed VEVENT, starting at
 * 9am and spaced through the day.
 */
export function itineraryToICS(itinerary: Itinerary): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peak Signal//Itinerary//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const day of [...itinerary.days].sort((a, b) => a.dayIndex - b.dayIndex)) {
    let clock = set(parseISO(day.date), { hours: 9, minutes: 0, seconds: 0 });
    for (const slot of [...day.slots].sort((a, b) => order(a.period) - order(b.period))) {
      const end = addMinutes(clock, slot.durationMins);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${itinerary.id}-${day.id}-${slot.period}@peaksignal`,
        `DTSTAMP:${stamp(new Date())}`,
        `DTSTART:${stamp(clock)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${escapeICS(slot.activity)}`,
        `DESCRIPTION:${escapeICS(slot.why)}`,
        "END:VEVENT",
      );
      clock = addMinutes(end, 30);
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function order(p: "morning" | "afternoon" | "evening") {
  return p === "morning" ? 0 : p === "afternoon" ? 1 : 2;
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}
