import Foundation

/// Reads API credentials from the build configuration (Config/Secrets.xcconfig
/// mapped into Info.plist). Keeps keys out of source control.
enum AppConfig {
    static var amadeusClientID: String { value("AMADEUS_CLIENT_ID") }
    static var amadeusClientSecret: String { value("AMADEUS_CLIENT_SECRET") }
    static var amadeusHost: String { value("AMADEUS_HOST", default: "test.api.amadeus.com") }
    static var rapidAPIKey: String { value("RAPIDAPI_KEY") }
    static var rapidAPIAirbnbHost: String { value("RAPIDAPI_AIRBNB_HOST") }
    static var viatorAPIKey: String { value("VIATOR_API_KEY") }
    static var getYourGuideAPIKey: String { value("GETYOURGUIDE_API_KEY") }
    static var anthropicAPIKey: String { value("ANTHROPIC_API_KEY") }

    private static func value(_ key: String, default fallback: String = "") -> String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              !raw.isEmpty else { return fallback }
        return raw
    }
}
