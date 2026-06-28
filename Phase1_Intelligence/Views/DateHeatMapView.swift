import SwiftUI

/// Flexible date heat map: a calendar view of ±7 days around the target date,
/// each day colour-coded by price (signal-buy → signal-peak). Tap any date for
/// a full price breakdown.
struct DateHeatMapView: View {
    let trip: WatchedTrip

    /// Placeholder price-by-date model; populated from PricePoints.
    struct DayPrice: Identifiable {
        let id = UUID()
        let date: Date
        let price: Double
        let color: Color
    }

    var body: some View {
        // TODO: 7-column grid, ±7 days, colour scaled by price percentile.
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: PSSpacing.sm) {
            // cells
        }
        .padding()
        .background(PSColor.bgIntelligence)
        .navigationTitle("Flexible dates")
    }
}
