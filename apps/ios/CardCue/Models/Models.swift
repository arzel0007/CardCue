import Foundation
import SwiftData
import BillingCycleEngine

// MARK: - Credit Card (SwiftData)

@Model
public final class CreditCard {
    @Attribute(.unique) public var id: UUID
    public var nickname: String
    public var issuer: String
    public var cardType: String?
    public var lastFourDigits: String
    public var creditLimit: Decimal
    public var personalCycleLimit: Decimal?
    public var statementDay: Int
    public var dueDay: Int
    public var isArchived: Bool
    public var createdAt: Date
    public var updatedAt: Date

    @Relationship(deleteRule: .cascade, inverse: \Transaction.card)
    public var transactions: [Transaction]

    public init(
        id: UUID = UUID(),
        nickname: String,
        issuer: String,
        cardType: String? = nil,
        lastFourDigits: String,
        creditLimit: Decimal = 0,
        personalCycleLimit: Decimal? = nil,
        statementDay: Int,
        dueDay: Int,
        isArchived: Bool = false,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.nickname = nickname
        self.issuer = issuer
        self.cardType = cardType
        self.lastFourDigits = lastFourDigits
        self.creditLimit = creditLimit
        self.personalCycleLimit = personalCycleLimit
        self.statementDay = statementDay
        self.dueDay = dueDay
        self.isArchived = isArchived
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.transactions = []
    }
}

// MARK: - Transaction (SwiftData)

@Model
public final class Transaction {
    @Attribute(.unique) public var id: UUID
    public var amount: Decimal
    public var transactionDate: Date
    public var category: String
    public var merchant: String?
    public var notes: String?
    public var createdAt: Date
    public var updatedAt: Date

    public var card: CreditCard?

    public init(
        id: UUID = UUID(),
        amount: Decimal,
        transactionDate: Date,
        category: String,
        merchant: String? = nil,
        notes: String? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.amount = amount
        self.transactionDate = transactionDate
        self.category = category
        self.merchant = merchant
        self.notes = notes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Domain bridges

public extension CreditCard {
    var billingSchedule: BillingSchedule {
        BillingSchedule(statementDay: statementDay, dueDay: dueDay)
    }

    /// User-entered only — never derived from a bank feed in MVP.
    var cycleTransactions: [CycleTransaction] {
        transactions.map {
            CycleTransaction(
                transactionDate: CalendarDay(date: $0.transactionDate, calendar: .current),
                amount: $0.amount
            )
        }
    }
}
