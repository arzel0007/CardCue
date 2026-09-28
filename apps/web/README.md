# CardO Web Companion

Premium management companion for CardO — a credit-card cycle & spending awareness product. iOS is the primary app; this web app is the desktop management surface.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS 4
- shadcn-style hand-written UI components (`src/components/ui/`)
- Recharts (cycle spending chart)
- Vitest (billing-cycle unit tests)

## Run

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run billing-cycle unit tests (Vitest) |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Dashboard — greeting, Next up, Payment due, spending chart, card list with status chips & progress |
| `/cards` | Card list + create/edit form (nickname, issuer, last 4, credit limit, Personal Cycle Limit, statement day, due day) |
| `/transactions` | User-entered transactions table with add/edit/delete, filter by card |
| `/settings` | Notification toggles, currency, timezone |

## Domain language

- **Personal Cycle Limit** — the user's cycle budget (never "available credit")
- **Cycle Spending** / **Remaining Cycle Budget**
- Microcopy: "Statement in 3 days", "Due in 5 days", "₱8,550 remaining"
- Default currency PHP / ₱ via `Intl.NumberFormat`
- No financial advice language

## Architecture

```
src/
  app/                  # App Router pages
  components/
    ui/                 # Button, Badge, Progress, Dialog, Switch, form, states
    cards/              # CreditCardSummary, CardFormDialog
    transactions/       # TransactionTable, TransactionFormDialog
    charts/             # SpendingChart (Recharts)
    layout/             # AppShell + nav
  lib/
    types.ts            # Domain types (User, CreditCard, Transaction, NotificationPreference)
    billingCycle.ts     # TypeScript mirror of packages/BillingCycleEngine
    format.ts           # Intl formatters + view builders
    mock-data.ts        # Local mock dataset
    store.tsx           # Client-side app store (React context)
    supabase.ts         # Thin stub — no credentials in repo
  lib/__tests__/        # Vitest unit tests for billingCycle
```

### Billing cycle rules

`src/lib/billingCycle.ts` mirrors `packages/BillingCycleEngine` (Swift):

- `nextStatementDate` / `previousStatementDate` with month-length clamping (28/29 Feb, 30/31)
- `dueDateForStatement` — due day before statement day rolls to next month
- Cycle start = day after previous statement; cycle end = next statement
- `daysUntilStatement` / `daysUntilDue` / `cycleProgress`
- Cycle spending = sum of transactions in `[start, end]` inclusive
- Remaining = `max(0, limit - spent)`; utilization clamped to `0...1`
- Status: complete → threshold → attention → upcoming → neutral

## Mocked vs real

| Layer | Status |
| --- | --- |
| UI, routing, design system | Real |
| Billing-cycle math + tests | Real (pure functions) |
| Cards / transactions / settings state | **Mock** — React context + `mock-data.ts` |
| Supabase | **Stub only** (`lib/supabase.ts`) — no credentials, no network |
| Notifications delivery | **Mock** — preference toggles only |

Data resets on refresh. Wire `lib/supabase.ts` + `lib/store.tsx` to live tables when the backend is ready.

## Design system

Matches `docs/DESIGN_SYSTEM.md` and `design/tokens/tokens.json`:

- Light: bg `#F7F5F2`, surface `#FFFFFF`, ink `#1A1A1A`, accent `#0E6B63`
- Dark: bg `#0F1114`, surface `#1A1D22`, ink `#F5F5F7`, accent `#3AA398`
- Inter / system-ui, tabular numerals for money
- 8-pt spacing, radius md 12 / lg 16
- Hairline borders over shadows
- Light + dark via `prefers-color-scheme`
- Accessible labels, focus rings, semantic HTML, skip link

## Security

- Never stores full PAN, CVV, PIN, or bank passwords — only nickname + last 4
- No secrets in the repo
- No fake bank integrations
