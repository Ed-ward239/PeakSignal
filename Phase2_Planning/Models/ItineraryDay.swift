import Foundation
import SwiftData

/// One day of the plan, split into morning / afternoon / evening slots.
@Model
final class ItineraryDay {
    var id: UUID = UUID()
    var date: Date = Date.now
    var theme: String = ""
    var dayIndex: Int = 0 // 0-based order, for drag-to-rearrange

    /// Ordered slots (morning, afternoon, evening) for this day.
    var slots: [ItinerarySlot] = []

    var itinerary: Itinerary?

    init(date: Date, theme: String, dayIndex: Int, slots: [ItinerarySlot]) {
        self.date = date
        self.theme = theme
        self.dayIndex = dayIndex
        self.slots = slots
    }
}

/// A single activity within a day. Stored as a Codable value on the day.
struct ItinerarySlot: Codable, Hashable, Identifiable {
    var id = UUID()
    var period: Period          // morning / afternoon / evening
    var activity: String
    var durationMins: Int
    var costPerPerson: Double
    var bookingURL: URL?
    /// Brief note on why this fits the trip profile.
    var why: String
    /// Optional coordinates for the map view.
    var latitude: Double?
    var longitude: Double?

    enum Period: String, Codable, CaseIterable { case morning, afternoon, evening }
}
