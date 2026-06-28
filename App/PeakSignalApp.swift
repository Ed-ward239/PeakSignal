import SwiftUI
import SwiftData

@main
struct PeakSignalApp: App {
    /// Shared SwiftData container. Local price-history cache + itinerary plans;
    /// CloudKit sync is layered on for the watchlist and itineraries.
    let modelContainer: ModelContainer

    init() {
        do {
            let schema = Schema([
                WatchedTrip.self,
                PricePoint.self,
                TripProfile.self,
                Itinerary.self,
                ItineraryDay.self,
            ])
            let config = ModelConfiguration(
                schema: schema,
                isStoredInMemoryOnly: false,
                cloudKitDatabase: .private("iCloud.com.peaksignal.app")
            )
            modelContainer = try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }

        BackgroundSync.registerTasks()
    }

    var body: some Scene {
        WindowGroup {
            AppRouter()
        }
        .modelContainer(modelContainer)
    }
}
