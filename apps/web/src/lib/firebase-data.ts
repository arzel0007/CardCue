/**
 * Firestore data access for CardCue.
 *
 * Collection layout (per user, enforced by firestore.rules):
 *
 *   users/{uid}
 *   users/{uid}/cards/{cardId}
 *   users/{uid}/transactions/{txnId}
 *   users/{uid}/notificationPreferences/{prefId}
 *
 * Domain types in `types.ts` stay UI-agnostic; this module maps them to
 * Firestore documents. All writes stamp updatedAt.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type { CreditCard, NotificationPreference, Transaction, User } from "./types";

function db() {
  const database = getFirestoreDb();
  if (!database) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in apps/web/.env.local");
  }
  return database;
}

/** Fail fast on flaky mobile networks instead of spinning forever. */
async function withTimeout<T>(promise: Promise<T>, ms = 6000, label = "request"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const t = setTimeout(() => {
        reject(new Error(`firebase/${label}-timeout after ${ms}ms`));
      }, ms);
      // Avoid unhandled timer leak in tests
      if (typeof (t as unknown as { unref?: () => void }).unref === "function") {
        (t as unknown as { unref: () => void }).unref();
      }
    }),
  ]);
}

function userDoc(uid: string) {
  return doc(db(), "users", uid);
}

function cardsCol(uid: string) {
  return collection(db(), "users", uid, "cards");
}

function txnsCol(uid: string) {
  return collection(db(), "users", uid, "transactions");
}

function prefsCol(uid: string) {
  return collection(db(), "users", uid, "notificationPreferences");
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await withTimeout(getDoc(userDoc(uid)), 6000, "profile");
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<User>;
  const prefs = (data.preferences ?? {}) as Record<string, unknown>;
  const prefName = typeof prefs.displayName === "string" ? prefs.displayName : undefined;
  return {
    ...data,
    id: uid,
    email: data.email ?? "",
    displayName: data.displayName || prefName,
    preferredCurrency: data.preferredCurrency ?? "PHP",
    timezone: data.timezone ?? "Asia/Manila",
    preferences: prefs,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function upsertUserProfile(uid: string, user: User): Promise<void> {
  const displayName =
    user.displayName ||
    (typeof user.preferences?.displayName === "string"
      ? (user.preferences.displayName as string)
      : undefined);

  await setDoc(
    userDoc(uid),
    {
      email: user.email,
      displayName: displayName ?? null,
      preferredCurrency: user.preferredCurrency,
      timezone: user.timezone,
      preferences: {
        ...(user.preferences ?? {}),
        ...(displayName ? { displayName } : {}),
      },
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export async function fetchCards(uid: string): Promise<CreditCard[]> {
  // No orderBy — avoids index waits and faster empty reads on mobile.
  const snap = await withTimeout(getDocs(cardsCol(uid)), 6000, "cards");
  const list = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CreditCard, "id">),
  }));
  return list.sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}

export async function saveCard(uid: string, card: CreditCard): Promise<void> {
  const { id, ...rest } = card;
  await setDoc(
    doc(cardsCol(uid), id),
    {
      ...rest,
      userId: uid,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function archiveCard(uid: string, cardId: string): Promise<void> {
  await setDoc(
    doc(cardsCol(uid), cardId),
    {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function fetchTransactions(uid: string): Promise<Transaction[]> {
  const snap = await withTimeout(getDocs(txnsCol(uid)), 6000, "transactions");
  const list = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Transaction, "id">),
  }));
  return list.sort((a, b) =>
    (b.transactionDate ?? "").localeCompare(a.transactionDate ?? "")
  );
}

export async function saveTransaction(uid: string, txn: Transaction): Promise<void> {
  const { id, ...rest } = txn;
  await setDoc(
    doc(txnsCol(uid), id),
    {
      ...rest,
      userId: uid,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deleteTransaction(uid: string, txnId: string): Promise<void> {
  await deleteDoc(doc(txnsCol(uid), txnId));
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export async function fetchNotificationPreference(
  uid: string,
  cardId: string | null = null
): Promise<NotificationPreference | null> {
  const id = cardId ?? "global";
  const snap = await withTimeout(getDoc(doc(prefsCol(uid), id)), 6000, "prefs");
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<NotificationPreference, "id">) };
}

export async function saveNotificationPreference(
  uid: string,
  pref: NotificationPreference
): Promise<void> {
  const id = pref.cardId ?? "global";
  const rest = { ...pref } as Partial<NotificationPreference> & Record<string, unknown>;
  delete rest.id;
  await setDoc(
    doc(prefsCol(uid), id),
    {
      ...rest,
      userId: uid,
      cardId: pref.cardId ?? null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Auth helpers (email / password)
// ---------------------------------------------------------------------------

export async function signUpEmailPassword(email: string, password: string) {
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  const auth = (await import("./firebase")).getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInEmailPassword(email: string, password: string) {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const auth = (await import("./firebase")).getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutFirebase() {
  const { signOut } = await import("firebase/auth");
  const auth = (await import("./firebase")).getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

/** Converts a Firestore Timestamp or ISO string into ISODateString. */
export function toISODate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}
