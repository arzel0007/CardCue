import Foundation

public extension Decimal {
    /// Formats as whole-currency units (presentation layer uses locale from settings).
    func cardCueCurrency(code: String = "PHP") -> String {
        formatted(.currency(code: code).precision(.fractionLength(0)))
    }

    var doubleValue: Double {
        (self as NSDecimalNumber).doubleValue
    }
}

public extension Date {
    /// Calendar day in the given timezone.
    func calendarDay(calendar: Calendar = .current) -> CalendarDay {
        CalendarDay(date: self, calendar: calendar)
    }
}
