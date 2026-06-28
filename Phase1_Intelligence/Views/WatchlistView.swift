import SwiftUI
import SwiftData

/// The home screen — the watchlist of tracked trips, each showing its current
/// "buy or wait" verdict at a glance. Phase 1, dark intelligence mode.
struct WatchlistView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WatchedTrip.createdAt, order: .reverse) private var trips: [WatchedTrip]

    var body: some View {
        List {
            ForEach(trips) { trip in
                NavigationLink(value: Route.priceDetail(trip)) {
                    WatchlistRow(trip: trip)
                }
                .listRowBackground(PSColor.bgIntelligence)
            }
            .onDelete(perform: delete)
        }
        .scrollContentBackground(.hidden)
        .background(PSColor.bgIntelligence)
        .navigationTitle("Watchlist")
        .toolbar {
            Button {
                // TODO: present add-trip sheet
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(trips[index]) }
    }
}

/// One row: route, dates, and the current verdict chip.
private struct WatchlistRow: View {
    let trip: WatchedTrip

    var body: some View {
        VStack(alignment: .leading, spacing: PSSpacing.xs) {
            Text("\(trip.origin) → \(trip.destination)")
                .font(PSFont.data(17, weight: .semibold))
                .foregroundStyle(.white)
            Text(trip.destinationName)
                .font(PSFont.ui(13))
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, PSSpacing.xs)
    }
}
