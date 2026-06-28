import SwiftUI

/// Peak Signal design tokens.
///
/// Peak Signal looks like a financial data app, not a travel app. Phase 1
/// (Price Intelligence) is dark, high-contrast and data-dense. Phase 2 (Trip
/// Intelligence) shifts to a warmer, lighter palette — the two-mode design
/// mirrors the two mental states: analytical buying, then exploratory planning.
enum PSColor {
    // Signal palette — the verdict language.
    static let signalBuy  = Color(hex: 0x10B981) // buy now / below average / good deal
    static let signalWait = Color(hex: 0xF59E0B) // wait / above average / caution
    static let signalPeak = Color(hex: 0xEF4444) // peak price / do not buy

    // Canvases.
    static let bgIntelligence = Color(hex: 0x0D1117) // Phase 1 dark canvas
    static let bgPlanning      = Color(hex: 0xFAFAFA) // Phase 2 light canvas

    // Interactive.
    static let accent = Color(hex: 0x0369A1) // primary CTAs, links
}

enum PSFont {
    /// SF Mono — all price figures, dates, percentages. Precision feel.
    static func data(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }

    /// SF Pro — labels, body copy, navigation. System native.
    static func ui(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }
}

enum PSSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

extension Color {
    /// Hex initializer, e.g. `Color(hex: 0x10B981)`.
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
