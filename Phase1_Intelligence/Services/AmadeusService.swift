import Foundation

/// Client for the Amadeus Self-Service APIs: Flight Offers Search and Hotel
/// Search. Handles OAuth2 client-credentials token acquisition + refresh.
///
/// Uses the free test environment by default (test.api.amadeus.com). Test data
/// is close to real-time but can be a few hours stale and may not reflect all
/// airlines — documented honestly in the README.
actor AmadeusService {
    static let shared = AmadeusService()

    private let host = AppConfig.amadeusHost
    private var token: (value: String, expiresAt: Date)?
    private let session = URLSession.shared

    // MARK: - Auth

    private func validToken() async throws -> String {
        if let token, token.expiresAt > .now.addingTimeInterval(60) {
            return token.value
        }
        return try await refreshToken()
    }

    private func refreshToken() async throws -> String {
        // TODO: POST /v1/security/oauth2/token (grant_type=client_credentials)
        // with AppConfig.amadeusClientID / amadeusClientSecret.
        fatalError("Implement Amadeus OAuth token acquisition")
    }

    // MARK: - Flights

    /// Searches flight offers for a route + date and returns the day's prices.
    func flightOffers(origin: String, destination: String, departure: Date, travellers: Int) async throws -> [FlightOffer] {
        // TODO: GET /v2/shopping/flight-offers
        fatalError("Implement Flight Offers Search")
    }

    // MARK: - Hotels

    /// Searches hotels by destination + dates.
    func hotelOffers(cityCode: String, checkIn: Date, checkOut: Date, guests: Int) async throws -> [HotelOffer] {
        // TODO: GET /v3/shopping/hotel-offers
        fatalError("Implement Hotel Search")
    }
}

struct FlightOffer: Identifiable, Codable {
    let id: String
    let price: Double
    let currency: String
    let departure: Date
    let carrier: String
}

struct HotelOffer: Identifiable, Codable {
    let id: String
    let name: String
    let pricePerNight: Double
    let currency: String
    let freeCancellationUntil: Date?
    let locationScore: Double
}
