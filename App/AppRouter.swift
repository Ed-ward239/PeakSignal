import SwiftUI

/// Top-level navigation between the two phases.
///
/// Phase 1 (Price Intelligence) is the default home — the watchlist. Phase 2
/// (Trip Intelligence) is entered explicitly when the user taps "I'm booking
/// this trip" on a watched trip, never automatically.
struct AppRouter: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            WatchlistView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .priceDetail(let trip):
                        PriceDetailView(trip: trip)
                    case .accommodationCompare(let trip):
                        AccommodationCompare(trip: trip)
                    case .experiences(let trip):
                        ExperiencesView(trip: trip)
                    case .tripProfile(let trip):
                        TripProfileView(trip: trip)
                    case .itinerary(let itinerary):
                        ItineraryView(itinerary: itinerary)
                    }
                }
        }
        .psMode(.intelligence)
    }
}

/// Typed navigation routes spanning both phases.
enum Route: Hashable {
    case priceDetail(WatchedTrip)
    case accommodationCompare(WatchedTrip)
    case experiences(WatchedTrip)
    case tripProfile(WatchedTrip)       // entry into Phase 2
    case itinerary(Itinerary)
}
