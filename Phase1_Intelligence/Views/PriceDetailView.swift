import SwiftUI
import Charts

/// Detail for a tracked trip: the verdict card, the 90-day candlestick chart,
/// the multi-traveller toggle, and entry points to accommodation comparison,
/// experiences, the date heat map, and Phase 2 ("I'm booking this trip").
struct PriceDetailView: View {
    let trip: WatchedTrip
    @State private var travellers: Int = 1

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PSSpacing.lg) {
                VerdictCard(verdict: .buyNow(percentBelowAverage: 19))
                PriceHistoryChart(history: trip.priceHistory)
                travellerToggle

                NavigationLink("Date heat map", value: Route.priceDetail(trip)) // TODO: heat map route
                NavigationLink("Compare hotel vs Airbnb", value: Route.accommodationCompare(trip))
                NavigationLink("Experiences", value: Route.experiences(trip))

                Divider().overlay(.white.opacity(0.1))

                NavigationLink(value: Route.tripProfile(trip)) {
                    Label("I'm booking this trip", systemImage: "checkmark.seal.fill")
                        .font(PSFont.ui(17, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(PSColor.accent, in: RoundedRectangle(cornerRadius: 12))
                        .foregroundStyle(.white)
                }
            }
            .padding()
        }
        .background(PSColor.bgIntelligence)
        .navigationTitle("\(trip.origin) → \(trip.destination)")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var travellerToggle: some View {
        Picker("Travellers", selection: $travellers) {
            ForEach([1, 2, 4, 6], id: \.self) { Text("\($0)") }
        }
        .pickerStyle(.segmented)
    }
}

/// The plain-English verdict card.
struct VerdictCard: View {
    let verdict: Verdict

    var body: some View {
        HStack(alignment: .top, spacing: PSSpacing.md) {
            Image(systemName: verdict.symbol)
                .font(.title)
                .foregroundStyle(verdict.color)
            VStack(alignment: .leading, spacing: PSSpacing.xs) {
                Text(verdict.headline)
                    .font(PSFont.ui(18, weight: .bold))
                    .foregroundStyle(verdict.color)
                // TODO: render the specific, honest reason string.
                Text("Below the 90-day average for this route.")
                    .font(PSFont.ui(14))
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(verdict.color.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
    }
}

/// Custom 90-day low/high/average candlestick built on Swift Charts.
struct PriceHistoryChart: View {
    let history: [PricePoint]

    var body: some View {
        Chart(history) { point in
            // Candlestick body: low→high bar, average tick.
            RuleMark(
                x: .value("Date", point.date),
                yStart: .value("Low", point.low),
                yEnd: .value("High", point.high)
            )
            .foregroundStyle(.white.opacity(0.4))

            PointMark(
                x: .value("Date", point.date),
                y: .value("Average", point.average)
            )
            .foregroundStyle(PSColor.accent)
        }
        .frame(height: 220)
        .chartXAxis { AxisMarks(values: .stride(by: .day, count: 15)) }
    }
}
