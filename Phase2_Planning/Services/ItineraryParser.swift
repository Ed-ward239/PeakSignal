import Foundation

/// Parses Claude's JSON itinerary response into SwiftData `Itinerary` +
/// `ItineraryDay` models. Tolerant of the day-keyed object shape
/// ("day_1", "day_2", ...) described in the spec.
struct ItineraryParser {

    /// Decodes the raw assistant text into an Itinerary (not yet inserted into a context).
    func parse(_ raw: String, destinationName: String, arrival: Date, departure: Date) throws -> Itinerary {
        let cleaned = strippingCodeFences(raw)
        guard let data = cleaned.data(using: .utf8),
              let root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ParseError.invalidJSON
        }

        let itinerary = Itinerary(destinationName: destinationName, arrival: arrival, departure: departure)
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withFullDate]

        // Sort "day_1", "day_2", ... numerically.
        let dayKeys = root.keys
            .filter { $0.hasPrefix("day_") }
            .sorted { ($0.dropFirst(4).intValue) < ($1.dropFirst(4).intValue) }

        for (index, key) in dayKeys.enumerated() {
            guard let dayObj = root[key] as? [String: Any] else { continue }
            let date = (dayObj["date"] as? String).flatMap { iso.date(from: $0) } ?? arrival
            let theme = dayObj["theme"] as? String ?? ""

            var slots: [ItinerarySlot] = []
            for period in ItinerarySlot.Period.allCases {
                guard let slotObj = dayObj[period.rawValue] as? [String: Any] else { continue }
                slots.append(ItinerarySlot(
                    period: period,
                    activity: slotObj["activity"] as? String ?? "",
                    durationMins: slotObj["duration_mins"] as? Int ?? 0,
                    costPerPerson: (slotObj["cost_per_person"] as? NSNumber)?.doubleValue ?? 0,
                    bookingURL: (slotObj["booking_url"] as? String).flatMap(normaliseURL),
                    why: slotObj["why"] as? String ?? ""
                ))
            }

            itinerary.days.append(ItineraryDay(date: date, theme: theme, dayIndex: index, slots: slots))
        }

        guard !itinerary.days.isEmpty else { throw ParseError.noDays }
        return itinerary
    }

    private func strippingCodeFences(_ s: String) -> String {
        s.replacingOccurrences(of: "```json", with: "")
         .replacingOccurrences(of: "```", with: "")
         .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func normaliseURL(_ s: String) -> URL? {
        URL(string: s.hasPrefix("http") ? s : "https://\(s)")
    }

    enum ParseError: Error { case invalidJSON, noDays }
}

private extension Substring {
    var intValue: Int { Int(self) ?? 0 }
}
