import SwiftUI

/// App Clip entry point — a lightweight, install-free experience launched from
/// a shared iMessage card. Shows the current live flight price for a route so
/// the recipient sees up-to-date pricing with no app download.
@main
struct PeakSignalAppClip: App {
    var body: some Scene {
        WindowGroup {
            FlightPriceCardView()
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    // TODO: parse invocation URL → route + date, then load price.
                }
        }
    }
}
