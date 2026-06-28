import SwiftUI

/// Side-by-side hotel vs Airbnb comparison for the same destination and dates —
/// price/night, cancellation flexibility, location score — with a plain-English
/// Peak Signal recommendation generated via the Claude API that weighs price,
/// flexibility, and location together.
struct AccommodationCompare: View {
    let trip: WatchedTrip

    @State private var bestHotel: HotelOffer?
    @State private var bestAirbnb: AirbnbListing?
    @State private var recommendation: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: PSSpacing.lg) {
                // TODO: two-column compare table (price/night, cancellation, location).
                Text("Hotel vs Airbnb")
                    .font(PSFont.ui(20, weight: .bold))

                if !recommendation.isEmpty {
                    Text(recommendation)
                        .font(PSFont.ui(15))
                        .padding()
                        .background(PSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding()
        }
        .background(PSColor.bgIntelligence)
        .navigationTitle("Stay")
        .task { await loadAndCompare() }
    }

    private func loadAndCompare() async {
        // TODO: fetch best hotel + best Airbnb, normalise prices across the two
        // sources, then ask ClaudeService for the recommendation string.
    }
}
