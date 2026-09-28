# CardO Architecture

## Product layering

```
┌─────────────────────────────────────────┐
│              Presentation               │
│     SwiftUI (iOS)   ·   Next.js (Web)   │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│                Domain                   │
│   BillingCycleEngine · Spending · Status│
│   (pure, deterministic, shared concept) │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│                 Data                    │
│     SwiftData (local)  ·  Supabase      │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│            Notifications                │
│   Local scheduling · Deduplication      │
└─────────────────────────────────────────┘
```

Rules:

1. Views never talk to Firebase/Supabase/SQL directly.
2. Business rules live in the domain layer — never in SwiftUI `body` or React components.
3. Domain code is pure and unit-tested. I/O stays at the edges.
4. iOS is offline-first. Supabase syncs when reachable.

---

## Apps

### iOS (primary)

| Layer | Responsibility |
| --- | --- |
| Views | Presentation, accessibility, gestures |
| ViewModels | Presentation state, user intents |
| Models | SwiftData `@Model` + value types |
| Services | Notifications, Keychain, Auth, Sync |
| DesignSystem | Tokens, components, status styles |

Native capabilities used: sheets, haptics, Face ID, WidgetKit (later), App Intents (later).

### Web (companion)

Management surface: cards, transactions, notification preferences, data export.

Not a stretched mobile UI — denser, table-friendly, desktop-first layout sharing the same product language and domain rules.

### Backend (Supabase)

- PostgreSQL — normalized relational model
- Auth — email magic link / OAuth
- RLS — every user-owned row gated by `auth.uid()`
- Edge Functions — reserved for work that must not run on the client (exports, digests)

Never ship service-role keys to clients.

---

## Billing Cycle Engine

The single most important business component. Lives in `packages/BillingCycleEngine` as a pure Swift package so iOS can depend on it directly and web can mirror the same rules in TypeScript (or share via tests that lock behavior).

### Inputs

- `statementDay` (1–31, clamped per month)
- `dueDay` (1–31, clamped per month)
- `today` (calendar day in the user's timezone)
- `timezone` / `Calendar`

### Outputs

| Field | Description |
| --- | --- |
| `currentCycleStart` | Day after the previous statement date |
| `currentCycleEnd` | Next statement date (inclusive) |
| `nextStatementDate` | Next occurrence of `statementDay` on or after today |
| `nextDueDate` | Earliest due date on or after today (often the just-closed statement's payment) |
| `daysUntilStatement` | Whole days from today to next statement |
| `daysUntilDue` | Whole days from today to next due date |
| `cycleProgress` | 0…1 through the current cycle |
| `currentCycleSpending` | Sum of transactions in `[cycleStart, cycleEnd]` |
| `personalLimitRemaining` | `personalLimit − spending` (if limit set) |
| `personalLimitUtilization` | `spending / personalLimit` (if limit set) |

### Date rules

- Do **not** assume 30-day months.
- Handle 28/29-day February, 30/31-day months, leap years, Dec→Jan.
- `statementDay` / `dueDay` of 29–31 clamp to the month's last day when needed.
- All calculations use the user's timezone; never UTC-naive date math for "calendar day" questions.

### Transaction boundary rule (manual tracking)

A transaction belongs to the cycle where `transactionDate` is in
`[currentCycleStart, currentCycleEnd]` inclusive.

| Transaction date | Assigned to |
| --- | --- |
| One day before statement (e.g. Oct 4, statement Oct 5) | Cycle ending Oct 5 |
| On statement date (Oct 5) | Cycle ending Oct 5 (statement closes end-of-day) |
| One day after statement (Oct 6) | Next cycle (Oct 6 → Nov 5) |

### Due date rule

The dashboard's "due" countdown is the **earliest payment due date on or after today**:

| Today | Statement that closed | Outstanding payment | `nextDueDate` |
| --- | --- | --- | --- |
| Oct 3 | Sep 5 (due Sep 25 — paid) | none | Oct 25 (for Oct 5 statement) |
| Oct 23 | Oct 5 | **Oct 25** | Oct 25 |
| Oct 28 | Oct 5 (due Oct 25 — passed) | none | Nov 25 (for Nov 5 statement) |

This is why "Due in 5 days" still appears after the statement closed — the payment is still open.

CardO does **not** know an issuer's actual posting lag unless a real transaction feed is connected. Manual entries are labeled as user-entered.

---

## Offline-first

Works without network:

- View cards and cycles
- Add / edit transactions
- Spending and remaining budget
- Upcoming dates
- Local notification schedule

Supabase sync is additive. Conflicts: last-write-wins by `updatedAt` for MVP; document any field-level merge later.

---

## Notification intelligence

A single `NotificationScheduler` service owns:

- Schedule
- Cancel
- Reschedule
- Deduplicate

Triggers for recalculation: card created/updated/archived, transaction added/edited/deleted, preference change, timezone change.

Never spam: acknowledgeable events should not re-fire without a genuine state change.

---

## Testing strategy

| Layer | Focus |
| --- | --- |
| `BillingCycleEngine` | Exhaustive unit tests — month lengths, leap years, year boundaries, clamping, timezone |
| Domain spending | Cycle assignment, thresholds, utilization |
| Notifications | Schedule/dedup/cancel on card lifecycle |
| iOS UI | Add card, add transaction, dashboard, card detail, calendar |
| Security | RLS isolation, no secrets in logs/builds |

---

## Future-ready (not in MVP)

CSV import, open banking, widgets, Apple Watch, Siri/App Intents, shared households, premium subscription.

Architecture keeps domain pure so widgets/intents can reuse it without UI coupling.
