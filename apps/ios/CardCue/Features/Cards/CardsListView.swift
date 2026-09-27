import SwiftUI
import SwiftData
import BillingCycleEngine

/// Cards list + create/edit — parity with web /cards.
struct CardsListView: View {
    @Environment(\.modelContext) private var context
    @Query(filter: #Predicate<CreditCard> { !$0.isArchived })
    private var cards: [CreditCard]

    @State private var showForm = false
    @State private var editing: CreditCard?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.x5) {
                    if cards.isEmpty {
                        EmptyStateView(
                            icon: "creditcard",
                            title: "Your cards live here.",
                            message: "Add your first card to start tracking your billing cycles.",
                            actionTitle: "Add Card",
                            action: { showForm = true }
                        )
                    } else {
                        ForEach(cards) { card in
                            VStack(spacing: 0) {
                                NavigationLink {
                                    CardDetailView(card: card)
                                } label: {
                                    cardRow(card)
                                }
                                .buttonStyle(.plain)

                                HStack {
                                    Button("Edit") { editing = card; showForm = true }
                                        .font(Theme.Font.footnote)
                                        .foregroundStyle(Theme.Colors.accent)
                                    Spacer()
                                    Button("Archive", role: .destructive) {
                                        card.isArchived = true
                                        card.updatedAt = .now
                                    }
                                    .font(Theme.Font.footnote)
                                }
                                .padding(.horizontal, Theme.Space.x5)
                                .padding(.bottom, Theme.Space.x4)
                            }
                            .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
                            .overlay(
                                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                                    .stroke(Theme.Colors.divider, lineWidth: 1)
                            )
                        }
                    }
                }
                .padding(Theme.Space.x5)
            }
            .background(Theme.Colors.bg)
            .navigationTitle("Cards")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        editing = nil
                        showForm = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("Add Card")
                }
            }
            .sheet(isPresented: $showForm) {
                CardFormSheet(editing: editing)
            }
        }
    }

    private func cardRow(_ card: CreditCard) -> some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            HStack {
                VStack(alignment: .leading) {
                    Text(card.nickname)
                        .font(Theme.Font.headline)
                        .foregroundStyle(Theme.Colors.ink)
                    Text("\(card.issuer) · •••• \(card.lastFourDigits)")
                        .font(Theme.Font.footnote)
                        .foregroundStyle(Theme.Colors.inkSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(Theme.Colors.inkTertiary)
            }

            HStack(spacing: Theme.Space.x4) {
                labeled("Statement", "Day \(card.statementDay)")
                labeled("Due", "Day \(card.dueDay)")
                if let limit = card.personalCycleLimit {
                    labeled("Cycle limit", CardCopy.currency(limit))
                }
            }
        }
        .padding(Theme.Space.x5)
    }

    private func labeled(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(Theme.Colors.inkTertiary)
            Text(value)
                .font(Theme.Font.footnote)
                .foregroundStyle(Theme.Colors.ink)
        }
    }
}

// MARK: - Add / edit form

struct CardFormSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    let editing: CreditCard?

    @State private var nickname = ""
    @State private var issuer = ""
    @State private var lastFour = ""
    @State private var creditLimit = ""
    @State private var personalLimit = ""
    @State private var statementDay = 5
    @State private var dueDay = 25

    private var isValid: Bool {
        !nickname.trimmingCharacters(in: .whitespaces).isEmpty
            && lastFour.count == 4
            && (1...31).contains(statementDay)
            && (1...31).contains(dueDay)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Card") {
                    TextField("Nickname (e.g. BPI Rewards)", text: $nickname)
                    TextField("Issuer (e.g. BPI)", text: $issuer)
                    TextField("Last 4 digits", text: $lastFour)
                        .keyboardType(.numberPad)
                        .onChange(of: lastFour) { _, v in
                            lastFour = String(v.filter(\.isNumber).prefix(4))
                        }
                }

                Section("Limits") {
                    TextField("Credit limit", text: $creditLimit)
                        .keyboardType(.decimalPad)
                    TextField("Personal cycle limit", text: $personalLimit)
                        .keyboardType(.decimalPad)
                }

                Section("Billing") {
                    Stepper("Statement day: \(statementDay)", value: $statementDay, in: 1...31)
                    Stepper("Due day: \(dueDay)", value: $dueDay, in: 1...31)
                }
            }
            .navigationTitle(editing == nil ? "Add Card" : "Edit Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(!isValid)
                        .fontWeight(.semibold)
                }
            }
            .onAppear(perform: load)
        }
        .presentationDetents([.large])
    }

    private func load() {
        guard let editing else { return }
        nickname = editing.nickname
        issuer = editing.issuer
        lastFour = editing.lastFourDigits
        creditLimit = editing.creditLimit == 0 ? "" : "\(editing.creditLimit)"
        personalLimit = editing.personalCycleLimit.map { "\($0)" } ?? ""
        statementDay = editing.statementDay
        dueDay = editing.dueDay
    }

    private func save() {
        let credit = Money.parse(creditLimit) ?? 0
        let personal = Money.parse(personalLimit)

        if let editing {
            editing.nickname = nickname.trimmingCharacters(in: .whitespaces)
            editing.issuer = issuer.trimmingCharacters(in: .whitespaces)
            editing.lastFourDigits = lastFour
            editing.creditLimit = credit
            editing.personalCycleLimit = personal
            editing.statementDay = statementDay
            editing.dueDay = dueDay
            editing.updatedAt = .now
        } else {
            let card = CreditCard(
                nickname: nickname.trimmingCharacters(in: .whitespaces),
                issuer: issuer.trimmingCharacters(in: .whitespaces),
                lastFourDigits: lastFour,
                creditLimit: credit,
                personalCycleLimit: personal,
                statementDay: statementDay,
                dueDay: dueDay
            )
            context.insert(card)
        }
        dismiss()
    }
}
