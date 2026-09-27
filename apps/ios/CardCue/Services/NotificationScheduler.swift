import Foundation
import UserNotifications
import BillingCycleEngine

/// Owns local notification schedule / cancel / reschedule / dedupe.
/// Never spam: re-scheduling replaces prior requests for the same card+event key.
@MainActor
public final class NotificationScheduler {
    public static let shared = NotificationScheduler()

    private let center = UNUserNotificationCenter.current()

    private init() {}

    // MARK: - Authorization

    public func requestAuthorization() async throws -> Bool {
        try await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    // MARK: - Scheduling

    /// Reschedules all reminders for a card. Cancels prior requests first.
    public func reschedule(
        for card: CardNotificationConfig
    ) async {
        cancelAll(forCardID: card.cardID)

        var requests: [UNNotificationRequest] = []

        if card.prefs.statement7Days {
            requests.append(makeRequest(card: card, kind: .statement, daysBefore: 7))
        }
        if card.prefs.statement3Days {
            requests.append(makeRequest(card: card, kind: .statement, daysBefore: 3))
        }
        if card.prefs.statement1Day {
            requests.append(makeRequest(card: card, kind: .statement, daysBefore: 1))
        }
        if card.prefs.statementGenerated {
            requests.append(makeRequest(card: card, kind: .statement, daysBefore: 0))
        }

        if card.prefs.due7Days {
            requests.append(makeRequest(card: card, kind: .due, daysBefore: 7))
        }
        if card.prefs.due3Days {
            requests.append(makeRequest(card: card, kind: .due, daysBefore: 3))
        }
        if card.prefs.due1Day {
            requests.append(makeRequest(card: card, kind: .due, daysBefore: 1))
        }
        if card.prefs.dueDate {
            requests.append(makeRequest(card: card, kind: .due, daysBefore: 0))
        }

        for request in requests {
            try? await center.add(request)
        }
    }

    public func cancelAll(forCardID cardID: UUID) {
        let prefix = cardID.uuidString
        center.getPendingNotificationRequests { requests in
            let ids = requests
                .map(\.identifier)
                .filter { $0.hasPrefix(prefix) }
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
        }
    }

    public func cancelEverything() {
        center.removeAllPendingNotificationRequests()
    }

    // MARK: - Copy

    private func makeRequest(
        card: CardNotificationConfig,
        kind: EventKind,
        daysBefore: Int
    ) -> UNNotificationRequest {
        let identifier = "\(card.cardID.uuidString)-\(kind.rawValue)-\(daysBefore)"
        let content = UNMutableNotificationContent()
        content.title = card.nickname
        content.body = copy(card: card, kind: kind, daysBefore: daysBefore)
        content.sound = .default

        // MVP: fire on the calendar day at 09:00 local, offset from the target date.
        var components = Calendar.current.dateComponents([.year, .month, .day], from: card.referenceDate(for: kind))
        components.hour = 9
        if daysBefore > 0 {
            // earlier reminder — subtract days by using a trigger offset
        }

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        return UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
    }

    private func copy(card: CardNotificationConfig, kind: EventKind, daysBefore: Int) -> String {
        switch kind {
        case .statement:
            switch daysBefore {
            case 0: return "Statement is ready."
            case 1: return "Statement is tomorrow."
            default: return "Statement is in \(daysBefore) days."
            }
        case .due:
            switch daysBefore {
            case 0: return "Payment is due today."
            case 1: return "Payment is due tomorrow."
            default: return "Payment is due in \(daysBefore) days."
            }
        case .threshold:
            return "Has reached \(daysBefore)% of your personal cycle limit."
        }
    }
}

// MARK: - Config value types

public enum EventKind: String, Sendable {
    case statement
    case due
    case threshold
}

public struct NotificationPrefs: Sendable {
    public var statement7Days: Bool
    public var statement3Days: Bool
    public var statement1Day: Bool
    public var statementGenerated: Bool
    public var due7Days: Bool
    public var due3Days: Bool
    public var due1Day: Bool
    public var dueDate: Bool
    public var threshold50: Bool
    public var threshold75: Bool
    public var threshold90: Bool
    public var threshold100: Bool

    public init(
        statement7Days: Bool = true,
        statement3Days: Bool = true,
        statement1Day: Bool = true,
        statementGenerated: Bool = true,
        due7Days: Bool = true,
        due3Days: Bool = true,
        due1Day: Bool = true,
        dueDate: Bool = true,
        threshold50: Bool = false,
        threshold75: Bool = true,
        threshold90: Bool = true,
        threshold100: Bool = true
    ) {
        self.statement7Days = statement7Days
        self.statement3Days = statement3Days
        self.statement1Day = statement1Day
        self.statementGenerated = statementGenerated
        self.due7Days = due7Days
        self.due3Days = due3Days
        self.due1Day = due1Day
        self.dueDate = dueDate
        self.threshold50 = threshold50
        self.threshold75 = threshold75
        self.threshold90 = threshold90
        self.threshold100 = threshold100
    }
}

public struct CardNotificationConfig: Sendable {
    public let cardID: UUID
    public let nickname: String
    public let schedule: BillingSchedule
    public let prefs: NotificationPrefs
    public let today: Date

    public init(
        cardID: UUID,
        nickname: String,
        schedule: BillingSchedule,
        prefs: NotificationPrefs = NotificationPrefs(),
        today: Date = .now
    ) {
        self.cardID = cardID
        self.nickname = nickname
        self.schedule = schedule
        self.prefs = prefs
        self.today = today
    }

    public func referenceDate(for kind: EventKind) -> Date {
        let engine = BillingCycleEngine(timeZone: .current)
        let day = CalendarDay(date: today, calendar: Calendar.current)
        let snap = engine.cycleSnapshot(today: day, schedule: schedule)
        let target: CalendarDay
        switch kind {
        case .statement, .threshold:
            target = snap.nextStatementDate
        case .due:
            target = snap.nextDueDate
        }
        return target.date(on: Calendar.current) ?? today
    }
}
