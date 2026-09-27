# CardCue iOS

Primary product. SwiftUI + SwiftData + BillingCycleEngine.

## Open in Xcode

This machine currently has only Command Line Tools (no full Xcode). On a Mac with Xcode 16+:

```bash
cd apps/ios
xcodegen generate
open CardCue.xcodeproj
```

If you don't have XcodeGen:

```bash
brew install xcodegen
```

Or create an iOS App project in Xcode named `CardCue` (iOS 17+), then add:

1. Local Swift package: `../../packages/BillingCycleEngine`
2. All sources under `CardCue/`

## Feature parity with web

| Feature | iOS | Web |
| --- | --- | --- |
| Dashboard (next up, due, cards) | `DashboardView` | `/` |
| Cards list + add/edit/archive | `CardsListView`, `CardFormSheet` | `/cards` |
| Card detail + timeline | `CardDetailView` | card summary |
| **Spend-window calendar** | `CalendarView` | `/calendar` |
| Transactions list + add | `TransactionsListView`, `AddTransactionSheet` | `/transactions` |
| Settings | `SettingsView` | `/settings` |
| BillingCycleEngine | Swift package | TS mirror + tests |

Spend-window days: **green = OK to spend** · **amber = near/limit** · **hatched = outside this cycle**.

## Structure

```
CardCue/
├── App/                 # @main entry, root tabs
├── DesignSystem/        # Theme tokens + shared components
├── Features/
│   ├── Dashboard/       # Home
│   ├── Cards/           # List, form, detail + timeline
│   ├── Transactions/    # List + add sheet
│   ├── Onboarding/
│   ├── Calendar/        # Spend-window calendar
│   └── Settings/
├── Models/              # SwiftData models
├── Services/            # Notifications
├── Utilities/           # Microcopy helpers
└── Extensions/
```

## Domain

Business rules live in `packages/BillingCycleEngine` (not in views).

## Security

No full card numbers, CVV, PINs, or bank credentials. See `docs/SECURITY.md`.
