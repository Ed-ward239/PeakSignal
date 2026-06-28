import WidgetKit
import SwiftUI

/// The widget + Live Activity bundle for Peak Signal.
@main
struct PeakSignalWidgetBundle: WidgetBundle {
    var body: some Widget {
        FlightPriceLiveActivity()
        // TODO: add a Home Screen / Lock Screen watchlist widget here.
    }
}
