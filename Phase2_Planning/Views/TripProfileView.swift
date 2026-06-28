import SwiftUI

/// Per-trip profile builder — the gateway into Phase 2. Captures who's coming,
/// traveller ages, budget, pace, interests, dietary needs, and mobility, then
/// triggers itinerary generation. Light "planning" mode.
struct TripProfileView: View {
    let trip: WatchedTrip
    @Environment(\.modelContext) private var context

    @State private var profile = TripProfile()
    @State private var isGenerating = false

    var body: some View {
        Form {
            Section("Who's coming") {
                Picker("Group", selection: $profile.groupRaw) {
                    ForEach(TravelGroup.allCases, id: \.rawValue) { Text($0.rawValue.capitalized).tag($0.rawValue) }
                }
                // TODO: add/remove travellers with ages + roles
            }
            Section("Budget & pace") {
                // TODO: budget per person/day stepper; pace picker
            }
            Section("Interests this trip") {
                // TODO: multi-select Interest chips
            }
            Section("Needs") {
                // TODO: dietary multi-select; mobility picker
            }

            Button {
                Task { await generate() }
            } label: {
                if isGenerating { ProgressView() } else { Text("Build my itinerary") }
            }
            .disabled(isGenerating)
        }
        .navigationTitle("Trip profile")
        .psMode(.planning)
    }

    private func generate() async {
        isGenerating = true
        defer { isGenerating = false }
        let builder = ItineraryPromptBuilder(
            destinationName: trip.destinationName,
            arrival: trip.earliestDeparture,
            departure: trip.latestReturn,
            profile: profile
        )
        do {
            let raw = try await ClaudeService.shared.complete(system: builder.system, user: builder.user)
            let itinerary = try ItineraryParser().parse(
                raw,
                destinationName: trip.destinationName,
                arrival: trip.earliestDeparture,
                departure: trip.latestReturn
            )
            context.insert(itinerary)
            // TODO: navigate to ItineraryView(itinerary:)
        } catch {
            // TODO: surface error to the user
        }
    }
}
