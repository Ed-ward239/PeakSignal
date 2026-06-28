import Foundation

/// Client for the Anthropic Claude API — generates per-trip itineraries and
/// the hotel-vs-Airbnb recommendation.
///
/// The spec named `claude-sonnet-4`; this defaults to the current Sonnet 4.6
/// (`claude-sonnet-4-6`). Update the constant as newer models ship.
actor ClaudeService {
    static let shared = ClaudeService()

    static let model = "claude-sonnet-4-6"
    private let apiKey = AppConfig.anthropicAPIKey
    private let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private let session = URLSession.shared

    /// Sends a structured prompt and returns the raw assistant text (expected to
    /// be JSON for itinerary generation — see ItineraryParser).
    func complete(system: String, user: String, maxTokens: Int = 4096) async throws -> String {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        let body: [String: Any] = [
            "model": Self.model,
            "max_tokens": maxTokens,
            "system": system,
            "messages": [["role": "user", "content": user]],
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw ClaudeError.requestFailed(String(data: data, encoding: .utf8) ?? "")
        }

        // Extract the first text block from the Messages API response.
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let content = json?["content"] as? [[String: Any]]
        guard let text = content?.first(where: { $0["type"] as? String == "text" })?["text"] as? String else {
            throw ClaudeError.unexpectedResponse
        }
        return text
    }
}

enum ClaudeError: Error {
    case requestFailed(String)
    case unexpectedResponse
}
