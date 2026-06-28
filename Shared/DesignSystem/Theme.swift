import SwiftUI

/// The two design modes Peak Signal switches between.
enum PSMode {
    case intelligence // Phase 1 — dark, financial, analytical
    case planning     // Phase 2 — light, warm, exploratory

    var canvas: Color {
        switch self {
        case .intelligence: return PSColor.bgIntelligence
        case .planning:     return PSColor.bgPlanning
        }
    }

    var preferredColorScheme: ColorScheme {
        switch self {
        case .intelligence: return .dark
        case .planning:     return .light
        }
    }
}

private struct PSModeKey: EnvironmentKey {
    static let defaultValue: PSMode = .intelligence
}

extension EnvironmentValues {
    var psMode: PSMode {
        get { self[PSModeKey.self] }
        set { self[PSModeKey.self] = newValue }
    }
}

extension View {
    /// Applies a Peak Signal design mode: canvas background + color scheme.
    func psMode(_ mode: PSMode) -> some View {
        self
            .environment(\.psMode, mode)
            .background(mode.canvas.ignoresSafeArea())
            .preferredColorScheme(mode.preferredColorScheme)
    }
}
