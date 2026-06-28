import Foundation
import SwiftData

/// A single day's price observation for a tracked item. 90 days of these per
/// route drive the candlestick chart and the rolling-average verdict.
@Model
final class PricePoint {
    var id: UUID = UUID()
    var date: Date = Date.now

    // Daily OHLC-style figures for the candlestick chart.
    var low: Double = 0
    var high: Double = 0
    var average: Double = 0

    /// What the item is: flight, hotel, airbnb, experience.
    var categoryRaw: String = PriceCategory.flight.rawValue
    var category: PriceCategory {
        get { PriceCategory(rawValue: categoryRaw) ?? .flight }
        set { categoryRaw = newValue.rawValue }
    }

    var trip: WatchedTrip?

    init(date: Date, low: Double, high: Double, average: Double, category: PriceCategory) {
        self.date = date
        self.low = low
        self.high = high
        self.average = average
        self.categoryRaw = category.rawValue
    }
}

enum PriceCategory: String, Codable, CaseIterable {
    case flight, hotel, airbnb, experience
}
