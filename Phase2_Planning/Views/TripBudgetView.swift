import SwiftUI

/// Running cost tracker across all planned and booked items in the itinerary —
/// the Phase 2 budget view (the Phase 1 watchlist has its own price totals).
struct TripBudgetView: View {
    let itinerary: Itinerary

    var body: some View {
        List {
            Section {
                LabeledContent("Estimated total / person") {
                    Text("$\(itinerary.estimatedTotalPerPerson, specifier: "%.0f")")
                        .font(PSFont.data(17, weight: .semibold))
                }
            }
            ForEach(itinerary.days.sorted { $0.dayIndex < $1.dayIndex }) { day in
                Section("Day \(day.dayIndex + 1) — \(day.theme)") {
                    ForEach(day.slots) { slot in
                        LabeledContent(slot.activity) {
                            Text("$\(slot.costPerPerson, specifier: "%.0f")").font(PSFont.data(14))
                        }
                    }
                }
            }
        }
        .navigationTitle("Budget")
        .psMode(.planning)
    }
}
