import SwiftUI

/// A single day's morning / afternoon / evening slots. Supports:
/// - "Surprise me" — regenerate this day only
/// - press-and-hold a slot → "Find alternative" (Claude suggests 3 swaps)
/// - drag to rearrange within the day or move to another day
struct DayDetailView: View {
    let day: ItineraryDay

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PSSpacing.lg) {
                HStack {
                    Text(day.theme).font(PSFont.ui(20, weight: .bold))
                    Spacer()
                    Button("Surprise me") { /* TODO: regenerate this day */ }
                        .font(PSFont.ui(14))
                }

                ForEach(day.slots) { slot in
                    SlotCard(slot: slot)
                        .contextMenu {
                            Button("Find alternative") { /* TODO: 3 Claude swaps */ }
                        }
                }
            }
            .padding()
        }
    }
}

private struct SlotCard: View {
    let slot: ItinerarySlot

    var body: some View {
        VStack(alignment: .leading, spacing: PSSpacing.xs) {
            Text(slot.period.rawValue.capitalized)
                .font(PSFont.ui(12, weight: .semibold))
                .foregroundStyle(PSColor.accent)
            Text(slot.activity).font(PSFont.ui(16, weight: .semibold))
            Text("\(slot.durationMins) min  ·  $\(slot.costPerPerson, specifier: "%.0f")/person")
                .font(PSFont.data(13))
                .foregroundStyle(.secondary)
            Text(slot.why).font(PSFont.ui(13)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}
