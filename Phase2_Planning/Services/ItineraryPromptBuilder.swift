import Foundation

/// Turns a per-trip profile + destination + dates into the structured prompt
/// sent to Claude. The trip profile is serialised as a JSON context block, and
/// a set of generation rules constrains the output to parseable JSON.
struct ItineraryPromptBuilder {
    let destinationName: String
    let arrival: Date
    let departure: Date
    let profile: TripProfile

    var system: String {
        """
        You are a meticulous travel planner. Build a day-by-day itinerary that \
        fits the supplied trip profile EXACTLY. Honour group composition, ages, \
        budget per person per day, pace, interests, dietary needs, and mobility. \
        Respond with ONLY valid JSON matching the requested schema — no prose, \
        no markdown fences.
        """
    }

    var user: String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withFullDate]

        let context: [String: Any] = [
            "destination": destinationName,
            "dates": [
                "arrival": iso.string(from: arrival),
                "departure": iso.string(from: departure),
            ],
            "profile": [
                "group": profile.group.rawValue,
                "travellers": profile.travellers.map { ["age": $0.age, "role": $0.role] },
                "budget_per_person_per_day": profile.budgetPerPersonPerDay,
                "pace": profile.pace.rawValue,
                "interests": profile.interests,
                "dietary": profile.dietary,
                "mobility": profile.mobility.rawValue,
            ],
        ]

        let contextJSON = (try? JSONSerialization.data(withJSONObject: context, options: [.prettyPrinted, .sortedKeys]))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"

        return """
        Trip context:
        \(contextJSON)

        Generation rules:
        - One object per day keyed "day_1", "day_2", ... covering arrival → departure.
        - Each day has: date, theme, and morning/afternoon/evening slots.
        - Each slot: activity, duration_mins, cost_per_person, optional booking_url, \
        and a short "why" tying it to the trip profile.
        - Keep daily cost within budget_per_person_per_day where possible.
        - Respect dietary and mobility constraints in every recommendation.
        """
    }
}
