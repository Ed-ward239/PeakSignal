import SwiftUI

/// Browser of top-rated activities and experiences for the trip's destination,
/// with price per person and booking-window advice. Deep links to Viator /
/// GetYourGuide for booking.
struct ExperiencesView: View {
    let trip: WatchedTrip
    @State private var experiences: [Experience] = []

    var body: some View {
        List(experiences) { experience in
            VStack(alignment: .leading, spacing: PSSpacing.xs) {
                Text(experience.title).font(PSFont.ui(16, weight: .semibold))
                Text("\(experience.rating, specifier: "%.1f") ★  ·  \(experience.currency)\(experience.pricePerPerson, specifier: "%.0f")/person")
                    .font(PSFont.data(13))
                    .foregroundStyle(.secondary)
            }
        }
        .background(PSColor.bgIntelligence)
        .navigationTitle("Experiences")
        .task { await load() }
    }

    private func load() async {
        // TODO: experiences = try await ViatorService.shared.experiences(...)
    }
}
