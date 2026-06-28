import SwiftUI

/// The day-by-day plan. Swipe between days; each day shows morning / afternoon
/// / evening slots. Entry points for the map, budget tracker, calendar export,
/// PDF export, and share.
struct ItineraryView: View {
    let itinerary: Itinerary

    var body: some View {
        TabView {
            ForEach(itinerary.days.sorted { $0.dayIndex < $1.dayIndex }) { day in
                DayDetailView(day: day)
            }
        }
        .tabViewStyle(.page)
        .navigationTitle(itinerary.destinationName)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                NavigationLink(value: Route.itinerary(itinerary)) { Image(systemName: "map") } // TODO: map route
                Menu {
                    Button("Add to Calendar") { /* TODO: EventKit export */ }
                    Button("Export PDF") { /* TODO: PDFKit export */ }
                    Button("Share read-only link") { /* TODO */ }
                } label: { Image(systemName: "square.and.arrow.up") }
            }
        }
        .psMode(.planning)
    }
}
