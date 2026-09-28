# Security

CardO handles personal financial *organization* data. Treat every field as sensitive.

## Never store

- Full card numbers (PAN)
- CVV / CVC
- PIN
- Bank passwords
- Online banking credentials
- Full account numbers

## Allowed card fields

Issuer, nickname, last four digits, credit limit, personal cycle limit, statement day, due day.

## Platform rules

| Layer | Rule |
| --- | --- |
| iOS | Secrets in Keychain only. No financial values in debug logs. |
| Web | No service-role keys. Env vars for `NEXT_PUBLIC_SUPABASE_URL` / anon key only. |
| Supabase | RLS on every table. Policies use `auth.uid()`. Service role stays server-side. |
| Logging | Never log amounts, card nicknames together with user identity, or tokens. |
| Analytics | No PII, no amounts, no card metadata. |

## Database

- `last_four_digits` constrained to `^[0-9]{4}$`
- All user tables RLS-enabled
- Transaction inserts require the parent card to belong to the same user

## Reporting

Treat any leak of credentials or card data as an incident: rotate keys, revoke sessions, audit `auth.logs`.
