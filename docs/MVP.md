# CardCue MVP Scope

## In scope (v1)

1. **Onboarding** — 3 short screens → add first card
2. **Add / edit card** — nickname, issuer, last 4, credit limit, personal cycle limit, statement day, due day
3. **Home dashboard** — next up, payment due, card list with status
4. **Card detail** — cycle, spending progress, credit limit, next payment, recent activity
5. **Billing cycle timeline**
6. **Transactions** — fast add sheet, list, edit/delete
7. **Calendar** — statement & payment indicators
8. **Local notifications** — statement / due / threshold, user-configurable
9. **Settings** — currency, timezone, appearance, Face ID, export CSV, privacy/about
10. **Empty states** — cards, transactions, upcoming events
11. **Dark mode** — full semantic color set
12. **BillingCycleEngine** — complete unit coverage

## Web companion (v1)

- Sign-in (Supabase Auth)
- Card management (list / create / edit / archive)
- Transaction list & CSV export
- Notification preference management
- Same domain language and calculations

## Explicitly out of scope

- Bank login / scraping
- Credit bureau / scores
- Loans, investments, crypto
- Financial advice
- Automatic payments
- Recurring detection, subscription detection
- Shared household accounts
- Premium subscription
- Widgets / Watch / Siri (architecture-ready only)

## Definition of done

A user opens CardCue and within ~5 seconds knows:

1. Which card needs attention
2. When the next statement is
3. When the next payment is due
4. Cycle spending
5. Remaining personal cycle budget
6. The next important event

Feel: **Premium · Calm · Fast · Trustworthy · Native · Intentionally designed.**
