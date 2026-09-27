# Supabase

Backend for CardCue: PostgreSQL, Auth, RLS, Edge Functions.

## Layout

```
supabase/
├── migrations/
│   ├── 0001_initial_schema.sql   # tables + triggers
│   └── 0002_rls_policies.sql     # row-level security
└── functions/                    # Edge Functions (future)
```

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Profile: currency, timezone, preferences |
| `credit_cards` | Card metadata only (no PAN/CVV/PIN) |
| `transactions` | User-entered spending |
| `notification_preferences` | Per-card or global reminder toggles |

## Security model

- Every table has RLS enabled.
- Policies scope by `auth.uid() = user_id`.
- Transaction inserts require the card to belong to the same user.
- Service-role key stays on the server only — never in iOS/web bundles.
- `last_four_digits` is constrained to exactly 4 digits.

## Local development

```bash
supabase start
supabase db reset
```

## Production

```bash
supabase db push
```

## Never store

Full card numbers, CVV, PINs, bank passwords, or online-banking credentials.
