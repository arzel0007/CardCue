import SwiftUI
import SwiftData
import BillingCycleEngine

/// Home dashboard — answers "What is happening with my cards right now?"
struct DashboardView: View {
    @Environment(\.modelContext) private var context
    @Query(filter: #Predicate<CreditCard> { !$0.isArchived })
    private var cards: [CreditCard]

    private let engine: BillingCycleEngine
    private let calendar: Calendar

    init() {
        var cal = Calendar.current
        cal.timeZone = .current
        self.calendar = cal
        self.engine = BillingCycleEngine(calendar: cal)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.x6) {
                    header

                    if cards.isEmpty {
                        EmptyStateView(
                            icon: "creditcard",
                            title: "Your cards live here.",
                            message: "Add your first card to start tracking your billing cycles.",
                            actionTitle: "Add Card",
                            action: {}
                        )
                    } else {
                        nextUpSection
                        paymentDueSection
                        yourCardsSection
                    }
                }
                .padding(Theme.Space.x5)
            }
            .background(Theme.Colors.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(Theme.Colors.accent)
                    }
                    .accessibilityLabel("Add Card")
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x1) {
            Text(greeting)
                .font(Theme.Font.title)
                .foregroundStyle(Theme.Colors.ink)
            Text("Your credit cycle overview")
                .font(Theme.Font.body)
                .foregroundStyle(Theme.Colors.inkSecondary)
        }
        .padding(.top, Theme.Space.x2)
    }

    private var greeting: String {
        let hour = calendar.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    // MARK: - Derived events

    private struct CardEvent: Identifiable {
        let id: UUID
        let card: CreditCard
        let snapshot: BillingCycleSnapshot
        let spending: SpendingSnapshot
        let status: CardStatus
        let statusText: String
    }

    private var events: [CardEvent] {
        cards.map { card in
            let snap = engine.cycleSnapshot(today: today, schedule: card.billingSchedule)
            let spending = engine.spendingSnapshot(
                transactions: card.cycleTransactions,
                today: today,
                schedule: card.billingSchedule,
                personalCycleLimit: card.personalCycleLimit
            )
            let status = engine.status(snapshot: snap, spending: spending)
            return CardEvent(
                id: card.id,
                card: card,
                snapshot: snap,
                spending: spending,
                status: status,
                statusText: CardCopy.statusText(snapshot: snap, spending: spending, status: status)
            )
        }
    }

    private var today: CalendarDay {
        CalendarDay(date: .now, calendar: calendar)
    }

    private var nextUp: CardEvent? {
        events
            .filter { $0.status != .neutral && $0.status != .complete }
            .min { $0.snapshot.daysUntilStatement < $1.snapshot.daysUntilStatement }
    }

    private var paymentDue: CardEvent? {
        events
            .filter { $0.snapshot.daysUntilDue >= 0 && $0.snapshot.daysUntilDue <= 7 }
            .min { $0.snapshot.daysUntilDue < $1.snapshot.daysUntilDue }
    }

    // MARK: - Sections

    @ViewBuilder
    private var nextUpSection: some View {
        if let event = nextUp {
            VStack(alignment: .leading, spacing: Theme.Space.x3) {
                SectionLabel("Next up")
                HighlightCard(event: event, style: .nextUp)
            }
        }
    }

    @ViewBuilder
    private var paymentDueSection: some View {
        if let event = paymentDue {
            VStack(alignment: .leading, spacing: Theme.Space.x3) {
                SectionLabel("Payment due")
                HighlightCard(event: event, style: .payment)
            }
        }
    }

    private var yourCardsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            SectionLabel("Your cards")
            ForEach(events) { event in
                NavigationLink {
                    CardDetailView(card: event.card)
                } label: {
                    CreditCardSummary(
                        nickname: event.card.nickname,
                        issuer: event.card.issuer,
                        lastFour: event.card.lastFourDigits,
                        cycleLabel: CardCopy.cycleRange(event.snapshot, calendar: calendar),
                        statementLabel: CardCopy.statementCountdown(event.snapshot.daysUntilStatement),
                        spent: event.spending.currentCycleSpending,
                        limit: event.card.personalCycleLimit,
                        status: event.status,
                        statusText: event.statusText
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Highlight card

private struct HighlightCard: View {
    enum Style {
        case nextUp
        case payment
    }

    let event: DashboardView.CardEvent
    let style: Style

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x3) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(event.card.nickname)
                        .font(Theme.Font.headline)
                        .foregroundStyle(Theme.Colors.ink)
                    Text("\(event.card.issuer) · •••• \(event.card.lastFourDigits)")
                        .font(Theme.Font.footnote)
                        .foregroundStyle(Theme.Colors.inkSecondary)
                }
                Spacer()
                StatusChip(status: event.status, text: event.statusText)
            }

            Text(headline)
                .font(Theme.Font.callout)
                .foregroundStyle(Theme.Colors.ink)

            if style == .nextUp {
                SpendingProgress(
                    spent: event.spending.currentCycleSpending,
                    limit: event.card.personalCycleLimit,
                    status: event.status
                )
            } else {
                Text(amountLine)
                    .font(Theme.Font.moneyLarge)
                    .foregroundStyle(Theme.Colors.ink)
                    .monospacedDigit()
            }
        }
        .padding(Theme.Space.x5)
        .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(Theme.Colors.accent.opacity(0.25), lineWidth: 1)
        )
    }

    private var headline: String {
        switch style {
        case .nextUp:
            return CardCopy.statementCountdown(event.snapshot.daysUntilStatement)
        case .payment:
            return CardCopy.dueCountdown(event.snapshot.daysUntilDue)
        }
    }

    private var amountLine: String {
        if let remaining = event.spending.personalLimitRemaining {
            return "\(CardCopy.currency(remaining)) remaining"
        }
        return CardCopy.currency(event.spending.currentCycleSpending)
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: [CreditCard.self, Transaction.self], inMemory: true)
}
