import Foundation

/// Shared formatters — money and percentages use the SF Mono "data" treatment
/// in the UI for a precision feel.
extension Double {
    /// "$1,124" — no decimals, grouped.
    func asPrice(currencyCode: String = "USD") -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = currencyCode
        f.maximumFractionDigits = 0
        return f.string(from: self as NSNumber) ?? "$\(Int(self))"
    }

    /// "19%" from 19.0, "31%" from 31.4.
    func asPercent() -> String { "\(Int(rounded()))%" }
}

extension Date {
    /// Days from now until this date (negative if past).
    var daysFromNow: Int {
        Calendar.current.dateComponents([.day], from: .now, to: self).day ?? 0
    }
}
