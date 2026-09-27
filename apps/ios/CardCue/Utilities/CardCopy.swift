import Foundation
import BillingCycleEngine

/// Presentation-facing copy for domain values. Keeps microcopy consistent.
public enum CardCopy {
    public static func statementCountdown(_ days: Int) -> String {
        switch days {
        case 0: return "Statement today"
        case 1: return "Statement in 1 day"
        default: return "Statement in \(days) days"
        }
    }

    public static func dueCountdown(_ days: Int) -> String {
        switch days {
        case 0: return "Due today"
        case 1: return "Due in 1 day"
        default: return "Due in \(days) days"
        }
    }

    public static func cycleRange(_ snapshot: BillingCycleSnapshot, calendar: Calendar = .current) -> String {
        let fmt = DateFormatter()
        fmt.calendar = calendar
        fmt.timeZone = calendar.timeZone
        fmt.setLocalizedDateFormatFromTemplate("MMM d")

        let start = snapshot.currentCycleStart.date(on: calendar) ?? .now
        let end = snapshot.currentCycleEnd.date(on: calendar) ?? .now
        return "\(fmt.string(from: start)) → \(fmt.string(from: end))"
    }

    public static func statusText(
        snapshot: BillingCycleSnapshot,
        spending: SpendingSnapshot,
        status: CardStatus
    ) -> String {
        switch status {
        case .complete:
            return "Cycle limit reached"
        case .threshold:
            if let util = spending.personalLimitUtilization {
                return "\(Int((util * 100).rounded()))% of cycle limit"
            }
            return "Near cycle limit"
        case .attention:
            return dueCountdown(snapshot.daysUntilDue)
        case .upcoming:
            return statementCountdown(snapshot.daysUntilStatement)
        case .neutral:
            return "Current cycle"
        }
    }

    public static func currency(_ amount: Decimal, code: String = "PHP") -> String {
        amount.formatted(.currency(code: code).precision(.fractionLength(0)))
    }
}
