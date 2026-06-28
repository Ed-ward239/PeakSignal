import Foundation
import BackgroundTasks

/// Schedules silent price checks via the BackgroundTasks framework.
///
/// Flights refresh every 4–6 hours, hotels every 12 hours, Airbnb daily,
/// experiences every 24 hours. After a refresh, the PriceEngine re-evaluates
/// each item and a single push alert fires only if a target price is breached.
enum BackgroundSync {
    static let taskIdentifier = "com.peaksignal.app.pricesync"

    /// Call once at launch (from PeakSignalApp.init).
    static func registerTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskIdentifier, using: nil) { task in
            guard let task = task as? BGAppRefreshTask else { return }
            handleRefresh(task)
        }
    }

    /// Requests the next refresh window (~4 hours out).
    static func schedule() {
        let request = BGAppRefreshTaskRequest(identifier: taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 4 * 60 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    private static func handleRefresh(_ task: BGAppRefreshTask) {
        schedule() // always queue the next one

        let work = Task {
            // TODO: refresh prices for all WatchedTrips, persist PricePoints,
            // recompute verdicts, fire push alerts on target-price breach.
            task.setTaskCompleted(success: true)
        }

        task.expirationHandler = { work.cancel() }
    }
}
