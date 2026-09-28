# CardO Domain Model

## Entities

### User

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| email | text | |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |
| preferredCurrency | text | ISO 4217, default `PHP` |
| timezone | text | IANA, default device |
| preferences | jsonb | UI / notification defaults |

### CreditCard

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | FK → users |
| nickname | text | e.g. "BPI Rewards" |
| issuer | text | e.g. "BPI" |
| cardType | text | optional enum-ish |
| lastFourDigits | text | **only** last 4 |
| creditLimit | numeric | display only |
| personalCycleLimit | numeric | user's cycle budget |
| statementDay | int | 1–31 |
| dueDay | int | 1–31 |
| isArchived | bool | soft delete |
| createdAt / updatedAt | timestamptz | |

### Transaction

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | |
| cardId | uuid | FK → credit_cards |
| amount | numeric | positive = spend; signed later if needed |
| transactionDate | date | user-entered posting/transaction date |
| category | text | Groceries, Fuel, Restaurant, … |
| merchant | text | optional |
| notes | text | optional |
| createdAt / updatedAt | timestamptz | |

### NotificationPreference

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | |
| cardId | uuid | nullable = global default |
| statement7Days … statementGenerated | bool | |
| due7Days … dueDate | bool | |
| threshold50 / 75 / 90 / 100 | bool | personal cycle limit utilization |

---

## Derived concepts (not stored)

Computed by `BillingCycleEngine` at read time:

- `currentCycleStart` / `currentCycleEnd`
- `nextStatementDate` / `nextDueDate`
- `daysUntilStatement` / `daysUntilDue`
- `cycleProgress`
- `currentCycleSpending`
- `personalLimitRemaining`
- `personalLimitUtilization`

---

## Status system

Semantic, text + icon first. Color reinforces, never carries meaning alone.

| Status | Meaning | Example copy |
| --- | --- | --- |
| **Neutral** | Mid-cycle, nothing urgent | "Current cycle" |
| **Upcoming** | Statement approaching | "Statement in 3 days" |
| **Attention** | Payment approaching | "Due in 5 days" |
| **Threshold** | Personal limit utilization high | "90% of cycle limit" |
| **Complete** | Personal cycle limit reached | "Cycle limit reached" |

---

## Terminology (do / don't)

| Use | Never use |
| --- | --- |
| Personal Cycle Limit | Available credit |
| Cycle Spending | Balance |
| Remaining Cycle Budget | Credit left |
| Statement in 3 days | Your statement date is approaching |
| ₱8,550 remaining | You have ₱8,550 remaining available to spend |

No financial advice. No "you should use / stop using this card."

---

## Currency & locale

- Default currency: PHP / ₱
- Format via locale-aware APIs (iOS `FormatStyle`, web `Intl.NumberFormat`)
- Never hardcode symbol placement or separators

---

## Security constraints

Never store: full PAN, CVV, PIN, bank passwords.

User data is always scoped by `userId`. RLS enforces isolation at the database.
