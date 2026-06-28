import Foundation

/// Client for Airbnb pricing via a RapidAPI scraper endpoint.
///
/// ⚠️ Airbnb has no official public API. This scraper approach works for a
/// portfolio app but is fragile — Airbnb can block scrapers at any time. A
/// production app would require an official API partnership. This limitation is
/// documented honestly in the README.
actor AirbnbService {
    static let shared = AirbnbService()

    private let key = AppConfig.rapidAPIKey
    private let host = AppConfig.rapidAPIAirbnbHost
    private let session = URLSession.shared

    /// Fetches Airbnb listings for a destination + date range.
    func listings(destination: String, checkIn: Date, checkOut: Date, guests: Int) async throws -> [AirbnbListing] {
        // TODO: GET RapidAPI Airbnb search endpoint with X-RapidAPI-Key header.
        fatalError("Implement Airbnb listings fetch")
    }
}

struct AirbnbListing: Identifiable, Codable {
    let id: String
    let title: String
    let pricePerNight: Double
    let currency: String
    let isSuperhost: Bool
    let isRefundable: Bool
    let locationScore: Double
}
