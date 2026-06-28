import Foundation

/// Client for experiences via the Viator affiliate API (and GetYourGuide as a
/// secondary source). Returns top-rated activities with pricing and booking
/// deep links used in both Phase 1 (browse) and Phase 2 (itinerary booking).
///
/// Viator's affiliate programme is accessible; approval takes ~3–5 business
/// days — apply early in the build.
actor ViatorService {
    static let shared = ViatorService()

    private let viatorKey = AppConfig.viatorAPIKey
    private let getYourGuideKey = AppConfig.getYourGuideAPIKey
    private let session = URLSession.shared

    /// Top-rated experiences for a destination.
    func experiences(destination: String, travellers: Int) async throws -> [Experience] {
        // TODO: POST Viator /products/search; merge GetYourGuide results.
        fatalError("Implement Viator experiences fetch")
    }
}

struct Experience: Identifiable, Codable {
    let id: String
    let title: String
    let rating: Double
    let pricePerPerson: Double
    let currency: String
    let bookingURL: URL?
    let provider: ExperienceProvider
}

enum ExperienceProvider: String, Codable {
    case viator
    case getYourGuide
}
