import Foundation
import SwiftData

/// Per-trip traveller context — the key design decision of Peak Signal.
///
/// Built fresh from scratch for every trip. Peak Signal deliberately does NOT
/// accumulate a global user profile: a solo adventure and a family holiday must
/// produce completely different AI plans, so context is rebuilt each time.
@Model
final class TripProfile {
    var id: UUID = UUID()

    var groupRaw: String = TravelGroup.solo.rawValue
    var group: TravelGroup {
        get { TravelGroup(rawValue: groupRaw) ?? .solo }
        set { groupRaw = newValue.rawValue }
    }

    /// Ages + roles of travellers on THIS trip (affects every recommendation).
    var travellers: [Traveller] = []

    var budgetPerPersonPerDay: Double = 120
    var paceRaw: String = Pace.relaxed.rawValue
    var pace: Pace {
        get { Pace(rawValue: paceRaw) ?? .relaxed }
        set { paceRaw = newValue.rawValue }
    }

    /// Multi-select interests for this trip — e.g. food in Rome, nightlife in Ibiza.
    var interests: [String] = []      // Interest.rawValue values
    var dietary: [String] = []        // e.g. "nut_allergy", "vegan"
    var mobilityRaw: String = Mobility.standard.rawValue
    var mobility: Mobility {
        get { Mobility(rawValue: mobilityRaw) ?? .standard }
        set { mobilityRaw = newValue.rawValue }
    }

    init() {}
}

struct Traveller: Codable, Hashable {
    var age: Int
    var role: String // "adult" | "child" | "senior"
}

enum TravelGroup: String, Codable, CaseIterable { case solo, couple, family, friends }
enum Pace: String, Codable, CaseIterable { case relaxed, balanced, packed }
enum Mobility: String, Codable, CaseIterable { case standard, wheelchairAccessible = "wheelchair_accessible" }

enum Interest: String, Codable, CaseIterable {
    case food, art, nightlife, nature, history, shopping, adventure
}
