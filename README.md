# CardO

**Billing Cycles & Spend Limits**

Premium credit card cycle & spending awareness.

iOS is the primary product. Web is the companion / management interface.

> **What is happening with my cards right now?**
> **What should I be aware of next?**

CardO is an organizational, tracking, and reminder tool — not financial advice.

---

## Product at a glance

| Concept | Meaning |
| --- | --- |
| **Cycle** | Period from the day after a statement through the next statement date |
| **Statement** | End of the cycle; closes on `statementDay` |
| **Payment due** | `dueDay` in the statement month (or the following month if earlier) |
| **Personal Cycle Limit** | User-defined spending budget for a card's cycle — *not* available credit |
| **Cycle Spending** | Sum of transactions assigned to the current cycle |
| **Remaining Cycle Budget** | Personal Cycle Limit − Cycle Spending |

Lifecycle:

```
SPEND → CYCLE → STATEMENT → PAYMENT → NEXT CYCLE
```

---

## Repository layout

```
CardO/
├── apps/
│   ├── ios/                 # SwiftUI app (primary)
│   └── web/                 # Next.js companion
├── packages/
│   └── BillingCycleEngine/  # Shared domain logic (SwiftPM, heavily tested)
├── design/
│   └── tokens/              # Design tokens (JSON + CSS)
├── supabase/
│   ├── migrations/          # PostgreSQL schema + RLS
│   └── functions/           # Edge Functions
└── docs/
    ├── ARCHITECTURE.md
    ├── DESIGN_SYSTEM.md
    ├── DOMAIN.md
    └── MVP.md
```

---

## Tech stack

**iOS** — Swift, SwiftUI, SwiftData, UserNotifications, WidgetKit, App Intents, Keychain, LocalAuthentication

**Web** — Next.js, TypeScript, Tailwind CSS, Recharts

**Backend** — Firebase (Firestore, Auth, Hosting)

See [docs/FIREBASE.md](docs/FIREBASE.md) for project setup and deploy.

---

## Getting started

### Prerequisites

- Xcode 16+ (iOS)
- Node.js 20+ (web)
- Supabase CLI (backend)
- Swift 6+ (domain package tests)

### Billing Cycle Engine tests

```bash
cd packages/BillingCycleEngine
swift run BillingCycleEngineTests
```

### iOS

```bash
cd apps/ios
xcodegen generate   # if using XcodeGen
open CardO.xcodeproj
```

### Web

```bash
cd apps/web
npm install
npm run dev
```

---

## Security non-negotiables

Never store or transmit:

- Full card number
- CVV
- PIN
- Bank passwords / online banking credentials

Only store: issuer, nickname, last four digits, credit limit, personal cycle limit, statement day, due day, user-entered transactions.

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [MVP scope](docs/MVP.md)
- [Firebase setup](docs/FIREBASE.md)
- [Security](docs/SECURITY.md)

## Firebase quick start

```bash
# 1. Create project at console.firebase.google.com (Auth + Firestore + Hosting)
# 2. Copy web config into apps/web/.env.local
# 3. Link this repo
firebase login
firebase use --add          # alias: default
npm run web:build           # writes apps/web/out
npm run firebase:deploy
```
