import SwiftUI
import SwiftData
import BillingCycleEngine

/// Spend-window calendar — green days OK to spend, amber limit risk, hatched outside cycle.
struct CalendarView: View {
    @Query(filter: #Predicate<CreditCard> { !$0.isArchived })
    private var cards: [CreditCard]

    @State private var selectedCardID: UUID?
    @State private var monthAnchor = CalendarDay(date: .now, calendar: .current)
    @State private var selectedDay = CalendarDay(date: .now, calendar: .current)

    private let engine: BillingCycleEngine
    private let calendar: Calendar

    init() {
        var cal = Calendar.current
        cal.timeZone = .current
        self.calendar = cal
        self.engine = BillingCycleEngine(calendar: cal)
    }

    private var selectedCard: CreditCard? {
        cards.first(where: { $0.id == selectedCardID }) ?? cards.first
    }

    private var today: CalendarDay {
        CalendarDay(date: .now, calendar: calendar)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if cards.isEmpty {
                    EmptyStateView(
                        icon: "calendar",
                        title: "No cards to calendar",
                        message: "Add a card to see statement cutoffs and your personal cycle budget by day."
                    )
                    .padding(.top, Theme.Space.x8)
                } else {
                    VStack(alignment: .leading, spacing: Theme.Space.x5) {
                        cardPicker
                        if let card = selectedCard {
                            SpendWindowBannerView(
                                facts: facts(for: selectedDay, card: card),
                                openDaysLeft: openDaysLeft(card: card)
                            )
                            MonthGridView(
                                monthAnchor: monthAnchor,
                                today: today,
                                selectedDay: $selectedDay,
                                schedule: card.billingSchedule,
                                transactions: card.cycleTransactions,
                                personalCycleLimit: card.personalCycleLimit,
                                engine: engine
                            )
                            DayDetailPanel(facts: facts(for: selectedDay, card: card))
                        }
                    }
                    .padding(Theme.Space.x5)
                }
            }
            .background(Theme.Colors.bg)
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        monthAnchor = monthAnchor.adding(months: -1, calendar: calendar)
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        monthAnchor = monthAnchor.adding(months: 1, calendar: calendar)
                    } label: {
                        Image(systemName: "chevron.right")
                    }
                }
            }
        }
    }

    private var cardPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Space.x2) {
                ForEach(cards) { card in
                    Button {
                        selectedCardID = card.id
                        selectedDay = today
                    } label: {
                        Text(card.nickname)
                            .font(Theme.Font.callout)
                            .padding(.horizontal, Theme.Space.x4)
                            .padding(.vertical, Theme.Space.x2)
                            .background(
                                selectedCard?.id == card.id
                                    ? Theme.Colors.accentSoft
                                    : Theme.Colors.surface,
                                in: Capsule()
                            )
                            .foregroundStyle(
                                selectedCard?.id == card.id
                                    ? Theme.Colors.accent
                                    : Theme.Colors.inkSecondary
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func facts(for day: CalendarDay, card: CreditCard) -> SpendWindowFacts {
        engine.spendWindowFacts(
            day: day,
            schedule: card.billingSchedule,
            today: today,
            transactions: card.cycleTransactions,
            personalCycleLimit: card.personalCycleLimit
        )
    }

    private func openDaysLeft(card: CreditCard) -> Int {
        var n = 0
        var d = today
        for _ in 0..<40 {
            let info = engine.dayCutoffInfo(day: d, schedule: card.billingSchedule, today: today)
            guard info.withinCutoff else { break }
            n += 1
            if info.isStatementDay { break }
            d = d.adding(days: 1, calendar: calendar)
        }
        return n
    }
}

// MARK: - Banner

private struct SpendWindowBannerView: View {
    let facts: SpendWindowFacts
    let openDaysLeft: Int

    private var background: Color {
        switch facts.verdict {
        case .ok: return Color(hex: "E8F5E9")
        case .nearLimit, .limitReached: return Color(hex: "FFF7ED")
        case .outsideCycle: return Theme.Colors.surfaceMuted
        }
    }

    private var border: Color {
        switch facts.verdict {
        case .ok: return Color(hex: "2E7D32")
        case .nearLimit, .limitReached: return Color(hex: "B45309")
        case .outsideCycle: return Theme.Colors.divider
        }
    }

    private var headline: String {
        switch facts.verdict {
        case .ok: return "These dates are still OK to spend"
        case .nearLimit: return "Still in cycle — near your personal limit"
        case .limitReached: return "Still in cycle — personal limit reached"
        case .outsideCycle: return "These dates are outside this cycle"
        }
    }

    private var sub: String {
        switch facts.verdict {
        case .outsideCycle:
            return "A charge here lands on the next statement, not the one closing soon."
        default:
            if openDaysLeft > 0 {
                let days = openDaysLeft == 1 ? "1 day" : "\(openDaysLeft) days"
                return "\(days) left before the statement cutoff."
            }
            return "Cutoff window is open until the statement date."
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            Text("Spend window")
                .font(Theme.Font.caption)
                .foregroundStyle(Theme.Colors.inkSecondary)
            Text(headline)
                .font(Theme.Font.headline)
                .foregroundStyle(Theme.Colors.ink)
            Text(sub)
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkSecondary)
            Text(facts.cutoffLabel)
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkTertiary)

            if facts.personalLimitRemaining != nil {
                Text("\(CardCopy.currency(facts.personalLimitRemaining!)) remaining")
                    .font(Theme.Font.moneyBody)
                    .foregroundStyle(Theme.Colors.ink)
                    .monospacedDigit()
                    .padding(.top, Theme.Space.x1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Space.x5)
        .background(background, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(border, lineWidth: 2)
        )
    }
}

// MARK: - Month grid

private struct MonthGridView: View {
    let monthAnchor: CalendarDay
    let today: CalendarDay
    @Binding var selectedDay: CalendarDay
    let schedule: BillingSchedule
    let transactions: [CycleTransaction]
    let personalCycleLimit: Decimal?
    let engine: BillingCycleEngine

    private var calendar: Calendar { engine.calendar }

    private var monthTitle: String {
        let fmt = DateFormatter()
        fmt.calendar = calendar
        fmt.timeZone = calendar.timeZone
        fmt.setLocalizedDateFormatFromTemplate("MMMM y")
        return fmt.string(from: monthAnchor.date(on: calendar) ?? .now)
    }

    private var days: [CalendarDay] {
        let first = CalendarDay(year: monthAnchor.year, month: monthAnchor.month, day: 1)
        let jsDow = calendar.component(.weekday, from: first.date(on: calendar) ?? .now)
        // weekday: 1=Sun…7=Sat → Monday-first offset
        let monFirst = (jsDow + 5) % 7
        let start = first.adding(days: -monFirst, calendar: calendar)
        return (0..<42).map { start.adding(days: $0, calendar: calendar) }
    }

    private let weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            Text(monthTitle)
                .font(Theme.Font.headline)
                .foregroundStyle(Theme.Colors.ink)

            legend

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 7), spacing: 6) {
                ForEach(weekdayLabels, id: \.self) { label in
                    Text(label)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Theme.Colors.inkTertiary)
                        .frame(maxWidth: .infinity)
                }

                ForEach(days, id: \.self) { day in
                    DayCell(
                        day: day,
                        today: today,
                        isSelected: day == selectedDay,
                        info: engine.dayCutoffInfo(day: day, schedule: schedule, today: today),
                        verdict: engine.spendDayVerdict(
                            day: day,
                            schedule: schedule,
                            today: today,
                            transactions: transactions,
                            personalCycleLimit: personalCycleLimit
                        )
                    )
                    .onTapGesture { selectedDay = day }
                }
            }
        }
        .padding(Theme.Space.x4)
        .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
    }

    private var legend: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            legendRow(color: Color(hex: "E8F5E9"), border: Color(hex: "2E7D32"), text: "OK to spend — still in this cycle")
            legendRow(color: Color(hex: "FFF7ED"), border: Color(hex: "B45309"), text: "Near or at personal cycle limit")
            legendRow(
                color: Theme.Colors.surfaceMuted,
                border: Theme.Colors.divider,
                text: "Outside this cycle — next statement",
                hatched: true
            )
        }
    }

    private func legendRow(color: Color, border: Color, text: String, hatched: Bool = false) -> some View {
        HStack(spacing: Theme.Space.x2) {
            RoundedRectangle(cornerRadius: 4)
                .fill(color)
                .frame(width: 18, height: 18)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(border, lineWidth: 1.5))
                .opacity(hatched ? 0.7 : 1)
            Text(text)
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkSecondary)
        }
    }
}

private struct DayCell: View {
    let day: CalendarDay
    let today: CalendarDay
    let isSelected: Bool
    let info: DayCutoffInfo
    let verdict: SpendDayVerdict

    private var fill: Color {
        switch verdict {
        case .ok: return Color(hex: "E8F5E9")
        case .nearLimit: return Color(hex: "FFF7ED")
        case .limitReached: return Color(hex: "FFEDD5")
        case .outsideCycle: return Theme.Colors.surface
        }
    }

    private var stroke: Color {
        switch verdict {
        case .ok: return Color(hex: "2E7D32")
        case .nearLimit: return Color(hex: "B45309")
        case .limitReached: return Color(hex: "C2410C")
        case .outsideCycle: return Theme.Colors.divider
        }
    }

    private var shortLabel: String {
        switch verdict {
        case .ok: return "OK"
        case .nearLimit: return "Near"
        case .limitReached: return "Limit"
        case .outsideCycle: return "Next"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text("\(day.day)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.Colors.ink)
                Spacer(minLength: 0)
                if info.isToday {
                    Text("•")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Theme.Colors.accent)
                }
            }
            Text(shortLabel)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(verdict == .outsideCycle ? Theme.Colors.inkTertiary : Theme.Colors.ink)
            if info.isStatementDay {
                Text("Cutoff")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(Theme.Colors.ink, in: Capsule())
            }
        }
        .padding(6)
        .frame(maxWidth: .infinity, minHeight: 56, alignment: .topLeading)
        .background(fill, in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Theme.Colors.accent : stroke, lineWidth: isSelected ? 2.5 : 1.5)
        )
        .accessibilityLabel(accessibility)
    }

    private var accessibility: String {
        "\(day), \(shortLabel)\(info.isToday ? ", today" : "")\(info.isStatementDay ? ", statement cutoff" : "")"
    }
}

// MARK: - Day detail

private struct DayDetailPanel: View {
    let facts: SpendWindowFacts

    private var title: String {
        switch facts.verdict {
        case .ok: return "OK to spend"
        case .nearLimit: return "Near personal limit"
        case .limitReached: return "Personal cycle limit reached"
        case .outsideCycle: return "Outside this cycle"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            Text("Selected day")
                .font(Theme.Font.caption)
                .foregroundStyle(Theme.Colors.inkTertiary)

            Text(title)
                .font(Theme.Font.headline)
                .foregroundStyle(Theme.Colors.ink)

            Text(facts.withinCutoff
                 ? "Still inside the current statement cutoff. Spending here stays on the upcoming statement."
                 : "Outside the current cutoff. Spending here moves to the next statement cycle.")
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkSecondary)

            Text(facts.cutoffLabel)
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.ink)

            Text(facts.budgetLabel)
                .font(Theme.Font.callout)
                .foregroundStyle(Theme.Colors.ink)

            if facts.limitReached {
                Text("Personal cycle limit is already reached — more spending would go past the threshold you set.")
                    .font(Theme.Font.footnote)
                    .foregroundStyle(Theme.Colors.statusAttention)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Space.x5)
        .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
    }
}
