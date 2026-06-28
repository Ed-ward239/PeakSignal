import Foundation

/// The "buy or wait" verdict algorithm.
///
/// Weighs the current price against the 90-day rolling average, applies a
/// days-to-departure decay (prices tend to rise close to departure, so the
/// tolerance for "wait" shrinks as the date approaches), and flags an absolute
/// peak when the current price is the highest in the tracked window.
///
/// This is intentionally transparent rather than a black-box prediction — the
/// reasoning is surfaced verbatim in the verdict card.
struct PriceEngine {

    /// Tunable thresholds, expressed as fractions of the rolling average.
    struct Config {
        var buyThreshold: Double = 0.10   // ≥10% below average → buy
        var waitThreshold: Double = 0.10  // ≥10% above average → wait
        /// How much the buy threshold loosens per day as departure nears.
        var departureDecayPerDay: Double = 0.0015
        init() {}
    }

    let config: Config
    init(config: Config = Config()) { self.config = config }

    /// Produces a verdict from a price history and the current price.
    /// - Parameters:
    ///   - current: today's price for the item.
    ///   - history: prior `PricePoint`s (any length; 90 days is typical).
    ///   - daysToDeparture: days until the departure date, for the decay term.
    func verdict(current: Double, history: [PricePoint], daysToDeparture: Int) -> Verdict {
        let averages = history.map(\.average).filter { $0 > 0 }
        guard !averages.isEmpty else {
            // No baseline yet — default to caution rather than a false "buy".
            return .wait(percentAboveAverage: 0)
        }

        let rollingAverage = averages.reduce(0, +) / Double(averages.count)
        let maxObserved = history.map(\.high).max() ?? current

        // Absolute peak takes precedence.
        if current >= maxObserved {
            return .peakPrice
        }

        let delta = (current - rollingAverage) / rollingAverage // negative = cheaper

        // As departure nears, accept a smaller discount to still call "buy".
        let decay = Double(max(0, 90 - daysToDeparture)) * config.departureDecayPerDay
        let effectiveBuyThreshold = max(0.0, config.buyThreshold - decay)

        if delta <= -effectiveBuyThreshold {
            return .buyNow(percentBelowAverage: abs(delta) * 100)
        } else if delta >= config.waitThreshold {
            return .wait(percentAboveAverage: delta * 100)
        } else {
            // Within the noise band; lean on time pressure.
            return daysToDeparture <= 14
                ? .buyNow(percentBelowAverage: max(0, -delta) * 100)
                : .wait(percentAboveAverage: max(0, delta) * 100)
        }
    }
}
