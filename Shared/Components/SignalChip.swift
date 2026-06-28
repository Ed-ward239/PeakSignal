import SwiftUI

/// A small pill that renders a verdict (buy / wait / peak) in the signal
/// palette. Reused across the watchlist, detail, and Live Activity.
struct SignalChip: View {
    let verdict: Verdict

    var body: some View {
        HStack(spacing: PSSpacing.xs) {
            Image(systemName: verdict.symbol)
            Text(verdict.headline)
        }
        .font(PSFont.ui(12, weight: .bold))
        .padding(.horizontal, PSSpacing.sm)
        .padding(.vertical, PSSpacing.xs)
        .foregroundStyle(verdict.color)
        .background(verdict.color.opacity(0.15), in: Capsule())
    }
}
