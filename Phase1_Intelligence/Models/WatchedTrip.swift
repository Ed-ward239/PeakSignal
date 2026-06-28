import Foundation
import SwiftData

/// A trip the user is considering and tracking prices for.
///
/// Stored in SwiftData and synced via CloudKit so the watchlist survives app
/// offload and follows the user across their Apple devices.
@Model
final class WatchedTrip {
    var id: UUID = UUID()
    var origin: String = ""          // IATA code, e.g. "JFK"
    var destination: String = ""     // IATA / city code, e.g. "PAR"
    var destinationName: String = "" // human-readable, e.g. "Paris, France"

    var earliestDeparture: Date = Date.now
    var latestReturn: Date = Date.now
    var travellerCount: Int = 1      // multi-traveller pricing toggle: 1, 2, 4, 6

    /// Price below which the user wants a push alert. nil = no alert set.
    var targetPrice: Double?

    var createdAt: Date = Date.now

    /// Whether the user has committed ("I'm booking this trip") and unlocked Phase 2.
    var isBooking: Bool = false

    @Relationship(deleteRule: .cascade, inverse: \PricePoint.trip)
    var priceHistory: [PricePoint] = []

    init(
        origin: String,
        destination: String,
        destinationName: String,
        earliestDeparture: Date,
        latestReturn: Date,
        travellerCount: Int = 1,
        targetPrice: Double? = nil
    ) {
        self.origin = origin
        self.destination = destination
        self.destinationName = destinationName
        self.earliestDeparture = earliestDeparture
        self.latestReturn = latestReturn
        self.travellerCount = travellerCount
        self.targetPrice = targetPrice
    }
}
