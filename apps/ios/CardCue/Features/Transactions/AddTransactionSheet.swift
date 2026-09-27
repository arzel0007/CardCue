import SwiftUI
import SwiftData
import BillingCycleEngine

/// Fast add-transaction sheet. Amount focused first; keyboard-aware.
struct AddTransactionSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    let cards: [CreditCard]
    var onSave: (Transaction) -> Void = { _ in }

    @State private var amountText = ""
    @State private var selectedCardID: UUID?
    @State private var date = Date.now
    @State private var category = "Groceries"
    @State private var merchant = ""
    @State private var notes = ""
    @FocusState private var amountFocused: Bool

    private let categories = [
        "Groceries", "Fuel", "Restaurant", "Shopping",
        "Bills", "Travel", "Health", "Entertainment", "Other"
    ]

    private var amount: Decimal? {
        Money.parse(amountText)
    }

    private var isValid: Bool {
        (amount ?? 0) > 0 && selectedCardID != nil
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Text("₱")
                            .font(Theme.Font.moneyLarge)
                            .foregroundStyle(Theme.Colors.inkSecondary)
                        TextField("0", text: $amountText)
                            .keyboardType(.decimalPad)
                            .font(Theme.Font.moneyDisplay)
                            .foregroundStyle(Theme.Colors.ink)
                            .focused($amountFocused)
                            .accessibilityLabel("Amount")
                    }
                }

                Section("Details") {
                    Picker("Card", selection: $selectedCardID) {
                        Text("Select a card").tag(UUID?.none)
                        ForEach(cards) { card in
                            Text(card.nickname).tag(Optional(card.id))
                        }
                    }

                    DatePicker("Date", selection: $date, displayedComponents: .date)

                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.self) { Text($0) }
                    }

                    TextField("Merchant (optional)", text: $merchant)
                    TextField("Notes (optional)", text: $notes)
                }
            }
            .navigationTitle("Add Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { save() }
                        .disabled(!isValid)
                        .fontWeight(.semibold)
                }
            }
            .onAppear {
                amountFocused = true
                if selectedCardID == nil {
                    selectedCardID = cards.first?.id
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func save() {
        guard let amount, amount > 0 else { return }
        let tx = Transaction(
            amount: amount,
            transactionDate: date,
            category: category,
            merchant: merchant.isEmpty ? nil : merchant,
            notes: notes.isEmpty ? nil : notes
        )
        if let id = selectedCardID {
            tx.card = cards.first(where: { $0.id == id })
        }
        if tx.card != nil {
            context.insert(tx)
        }
        onSave(tx)
        dismiss()
    }
}

#Preview {
    AddTransactionSheet(cards: [])
}
