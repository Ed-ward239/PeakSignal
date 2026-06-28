import ActivityKit
import WidgetKit
import SwiftUI

/// Live Activity attributes for the Lock Screen flight price ticker.
struct FlightPriceAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var price: Double
        var verdictHeadline: String // "BUY NOW" / "WAIT" / "PEAK PRICE"
    }
    var route: String // e.g. "JFK → CDG"
}

/// Lock Screen / Dynamic Island live price ticker for an actively watched flight.
struct FlightPriceLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FlightPriceAttributes.self) { context in
            // Lock Screen banner.
            HStack {
                VStack(alignment: .leading) {
                    Text(context.attributes.route).font(.system(.headline, design: .monospaced))
                    Text(context.state.verdictHeadline).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text(context.state.price.asPrice()).font(.system(.title2, design: .monospaced).bold())
            }
            .padding()
            .activityBackgroundTint(Color(hex: 0x0D1117))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text(context.attributes.route) }
                DynamicIslandExpandedRegion(.trailing) { Text(context.state.price.asPrice()) }
            } compactLeading: {
                Image(systemName: "airplane")
            } compactTrailing: {
                Text(context.state.price.asPrice())
            } minimal: {
                Image(systemName: "airplane")
            }
        }
    }
}
