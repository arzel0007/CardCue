import SwiftUI
import SwiftData

/// Transaction list + fast add — parity with web /transactions.
struct TransactionsListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Transaction.transactionDate, order: .reverse)
    private var transactions: [Transaction]
    @Query(filter: #Predicate<CreditCard> { !$0.isArchived })
    private var cards: [CreditCard]

    @State private var showAdd = false
    @State private var filterCardID: UUID?

    private var filtered: [Transaction] {
        guard let filterCardID else { return transactions }
        return transactions.filter { $0.card?.id == filterCardID }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.x5) {
                    filterBar

                    if filtered.isEmpty {
                        EmptyStateView(
                            icon: "list.bullet",
                            title: "No spending recorded yet.",
                            message: "Add transactions to see your current cycle progress.",
                            actionTitle: "Add Transaction",
                            action: { showAdd = true }
                        )
                    } else {
                        ForEach(filtered, id: \.id) { tx in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(tx.category)
                                        .font(Theme.Font.body)
                                        .foregroundStyle(Theme.Colors.ink)
                                    Text(subtitle(for: tx))
                                        .font(Theme.Font.footnote)
                                        .foregroundStyle(Theme.Colors.inkSecondary)
                                }
                                Spacer()
                                Text(CardCopy.currency(tx.amount))
                                    .font(Theme.Font.moneyBody)
                                    .foregroundStyle(Theme.Colors.ink)
                                    .monospacedDigit()
                            }
                            .padding(Theme.Space.x4)
                            .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.md))
                        }
                    }
                }
                .padding(Theme.Space.x5)
            }
            .background(Theme.Colors.bg)
            .navigationTitle("Transactions")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("Add Transaction")
                }
            }
            .sheet(isPresented: $showAdd) {
                AddTransactionSheet(cards: cards)
            }
        }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Space.x2) {
                filterChip("All", selected: filterCardID == nil) { filterCardID = nil }
                ForEach(cards) { card in
                    filterChip(card.nickname, selected: filterCardID == card.id) {
                        filterCardID = card.id
                    }
                }
            }
        }
    }

    private func filterChip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Font.footnote)
                .padding(.horizontal, Theme.Space.x3)
                .padding(.vertical, Theme.Space.x2)
                .background(selected ? Theme.Colors.accentSoft : Theme.Colors.surface, in: Capsule())
                .foregroundStyle(selected ? Theme.Colors.accent : Theme.Colors.inkSecondary)
        }
        .buttonStyle(.plain)
    }

    private func subtitle(for tx: Transaction) -> String {
        let fmt = DateFormatter()
        fmt.setLocalizedDateFormatFromTemplate("MMM d")
        let date = fmt.string(from: tx.transactionDate)
        if let merchant = tx.merchant, !merchant.isEmpty {
            return "\(date) · \(merchant)"
        }
        return date
    }
}
