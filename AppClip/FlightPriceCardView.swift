import SwiftUI

/// The shareable live-updating flight price card. Rendered both inside the App
/// Clip and as the iMessage preview. Financial/dark intelligence aesthetic.
struct FlightPriceCardView: View {
    var route: String = "JFK → CDG"
    var price: Double = 847
    var verdict: Verdict = .buyNow(percentBelowAverage: 19)

    var body: some View {
        VStack(alignment: .leading, spacing: PSSpacing.md) {
            Text("PEAK SIGNAL").font(PSFont.ui(12, weight: .bold)).foregroundStyle(.secondary)
            Text(route).font(PSFont.data(24, weight: .bold)).foregroundStyle(.white)
            Text(price.asPrice()).font(PSFont.data(40, weight: .bold)).foregroundStyle(verdict.color)
            SignalChip(verdict: verdict)
            Text("Get the full app to track this route").font(PSFont.ui(13)).foregroundStyle(.secondary)
        }
        .padding(PSSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PSColor.bgIntelligence)
        .preferredColorScheme(.dark)
    }
}
