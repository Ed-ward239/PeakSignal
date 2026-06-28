import Foundation
import SwiftUI

/// The plain-English "buy or wait" verdict shown on every tracked item.
///
/// Not a vague prediction bar — a specific, honest assessment with a headline,
/// a reason, and the colour from the signal palette.
enum Verdict: Equatable {
    /// Price meaningfully below the 90-day average — book today.
    case buyNow(percentBelowAverage: Double)
    /// Price above average; history suggests it may drop — check back later.
    case wait(percentAboveAverage: Double)
    /// Highest price recorded in the tracked window — do not buy unless fixed.
    case peakPrice

    var headline: String {
        switch self {
        case .buyNow:    return "BUY NOW"
        case .wait:      return "WAIT"
        case .peakPrice: return "PEAK PRICE"
        }
    }

    var symbol: String {
        switch self {
        case .buyNow:    return "checkmark.circle.fill"
        case .wait:      return "hourglass"
        case .peakPrice: return "exclamationmark.octagon.fill"
        }
    }

    var color: Color {
        switch self {
        case .buyNow:    return PSColor.signalBuy
        case .wait:      return PSColor.signalWait
        case .peakPrice: return PSColor.signalPeak
        }
    }
}
