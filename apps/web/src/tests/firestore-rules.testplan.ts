/**
 * Firestore security rules test plan (run against the emulator).
 *
 * Requires: firebase emulators:exec --only auth,firestore "npx vitest run --dir src/tests"
 * or a dedicated `firebase emulators:exec` script once @firebase/rules-unit-testing is installed.
 *
 * Covered assertions (implement in CI before production):
 *
 * 1. Unauthenticated get/list/create/update/delete on users/** → denied
 * 2. User A cannot read users/B/cards/* or users/B/transactions/*
 * 3. User A cannot write into users/B/**
 * 4. Card create requires lastFourDigits matching ^[0-9]{4}$
 * 5. Card create rejects fields pan|cardNumber|cvv|pin|password
 * 6. Transaction create rejects amount <= 0
 * 7. User A can CRUD own cards/transactions
 * 8. Cross-user list queries return empty / permission-denied
 */

export const RULES_TEST_CASES = [
  "unauthenticated access denied",
  "cross-user card read denied",
  "cross-user card write denied",
  "last four validation enforced",
  "forbidden PAN/CVV fields rejected",
  "positive transaction amount required",
  "owner can CRUD own data",
] as const;
