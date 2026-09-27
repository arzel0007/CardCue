import SwiftUI
import SwiftData
import BillingCycleEngine

// Card detail + spend window calendar actions share the domain engine.

/// Complete picture for a single card: cycle, spending, payments, activity.
struct CardDetailView: View {
    let card: CreditCard

    @State private var showAddTransaction = false

    private let engine: BillingCycleEngine
    private let calendar: Calendar

    init(card: CreditCard) {
        self.card = card
        var cal = Calendar.current
        cal.timeZone = .current
        self.calendar = cal
        self.engine = BillingCycleEngine(calendar: cal)
    }

    private var snapshot: BillingCycleSnapshot {
        engine.cycleSnapshot(
            today: CalendarDay(date: .now, calendar: calendar),
            schedule: card.billingSchedule
        )
    }

    private var spending: SpendingSnapshot {
        engine.spendingSnapshot(
            transactions: card.cycleTransactions,
            today: CalendarDay(date: .now, calendar: calendar),
            schedule: card.billingSchedule,
            personalCycleLimit: card.personalCycleLimit
        )
    }

    private var status: CardStatus {
        engine.status(snapshot: snapshot, spending: spending)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Space.x6) {
                header
                currentCycleSection
                spendingSection
                creditLimitSection
                nextPaymentSection
                recentActivitySection
            }
            .padding(Theme.Space.x5)
        }
        .background(Theme.Colors.bg)
        .navigationTitle(card.nickname)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("Add Transaction") { showAddTransaction = true }
                    Button("Edit Card") {}
                    Button("Notification Settings") {}
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showAddTransaction) {
            AddTransactionSheet(cards: [card]) { tx in
                tx.card = card
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x1) {
            Text(card.nickname)
                .font(Theme.Font.title)
                .foregroundStyle(Theme.Colors.ink)
            Text("•••• \(card.lastFourDigits)")
                .font(Theme.Font.callout)
                .foregroundStyle(Theme.Colors.inkSecondary)
        }
    }

    private var currentCycleSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            SectionLabel("Current cycle")
            CycleTimelineView(snapshot: snapshot, calendar: calendar)
            Text(CardCopy.statementCountdown(snapshot.daysUntilStatement))
                .font(Theme.Font.callout)
                .foregroundStyle(Theme.Colors.ink)
        }
    }

    private var spendingSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            SectionLabel("Cycle spending")
            SpendingProgress(
                spent: spending.currentCycleSpending,
                limit: card.personalCycleLimit,
                status: status
            )
        }
    }

    private var creditLimitSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            SectionLabel("Credit limit")
            Text(CardCopy.currency(card.creditLimit))
                .font(Theme.Font.moneyLarge)
                .foregroundStyle(Theme.Colors.ink)
                .monospacedDigit()
            Text("Display only — separate from your personal cycle limit.")
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkTertiary)
        }
    }

    private var nextPaymentSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            SectionLabel("Next payment")
            Text(shortDueDate)
                .font(Theme.Font.moneyLarge)
                .foregroundStyle(Theme.Colors.ink)
            Text(CardCopy.dueCountdown(snapshot.daysUntilDue))
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.inkSecondary)
        }
    }

    private var shortDueDate: String {
        let fmt = DateFormatter()
        fmt.calendar = calendar
        fmt.timeZone = calendar.timeZone
        fmt.setLocalizedDateFormatFromTemplate("MMM d")
        let date = snapshot.nextDueDate.date(on: calendar) ?? .now
        return fmt.string(from: date)
    }

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            SectionLabel("Recent activity")

            if card.transactions.isEmpty {
                EmptyStateView(
                    icon: "list.bullet",
                    title: "No spending recorded yet.",
                    message: "Add transactions to see your current cycle progress.",
                    actionTitle: "Add Transaction",
                    action: { showAddTransaction = true }
                )
            } else {
                ForEach(card.transactions.sorted(by: { $0.transactionDate > $1.transactionDate }).prefix(8), id: \.id) { tx in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(tx.category)
                                .font(Theme.Font.body)
                                .foregroundStyle(Theme.Colors.ink)
                            if let merchant = tx.merchant, !merchant.isEmpty {
                                Text(merchant)
                                    .font(Theme.Font.footnote)
                                    .foregroundStyle(Theme.Colors.inkSecondary)
                            }
                        }
                        Spacer()
                        Text(CardCopy.currency(tx.amount))
                            .font(Theme.Font.moneyBody)
                            .foregroundStyle(Theme.Colors.ink)
                            .monospacedDigit()
                    }
                    .padding(.vertical, Theme.Space.x2)
                }
            }
        }
    }
}

/// Subtle billing-cycle timeline.
struct CycleTimelineView: View {
    let snapshot: BillingCycleSnapshot
    let calendar: Calendar

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            HStack {
                Text(short(snapshot.currentCycleStart))
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.inkSecondary)
                Spacer()
                Text(short(snapshot.currentCycleEnd))
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.inkSecondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Theme.Colors.surfaceMuted)
                        .frame(height: 6)
                    Capsule()
                        .fill(Theme.Colors.accent)
                        .frame(width: max(6, geo.size.width * snapshot.cycleProgress), height: 6)
                        .animation(Theme.Motion.slow, value: snapshot.cycleProgress)

                    Circle()
                        .fill(Theme.Colors.accent)
                        .frame(width: 12, height: 12)
                        .offset(x: max(0, geo.size.width * snapshot.cycleProgress - 6))
                }
            }
            .frame(height: 12)
            .accessibilityLabel("Cycle progress \(Int(snapshot.cycleProgress * 100)) percent")

            HStack {
                Label("Today", systemImage: "circle.fill")
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.accent)
                Spacer()
                Label("Statement", systemImage: "doc.text")
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.inkSecondary)
            }

            Divider()
                .background(Theme.Colors.divider)
                .padding(.vertical, Theme.Space.x1)

            HStack {
                Text("Payment window")
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.inkTertiary)
                Spacer()
                Text("Due \(short(snapshot.nextDueDate))")
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.statusAttention)
            }
        }
        .padding(Theme.Space.x4)
        .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.md))
    }

    private func short(_ day: CalendarDay) -> String {
        let fmt = DateFormatter()
        fmt.calendar = calendar
        fmt.timeZone = calendar.timeZone
        fmt.setLocalizedDateFormatFromTemplate("MMM d")
        return fmt.string(from: day.date(on: calendar) ?? .now)
    }
}
