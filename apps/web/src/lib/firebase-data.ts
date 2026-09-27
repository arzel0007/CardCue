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
  orderBy,
  query,
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
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

export async function upsertUserProfile(uid: string, user: User): Promise<void> {
  await setDoc(
    userDoc(uid),
    {
      ...user,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export async function fetchCards(uid: string): Promise<CreditCard[]> {
  const snap = await getDocs(
    query(cardsCol(uid), orderBy("updatedAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CreditCard, "id">) }));
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
  const snap = await getDocs(
    query(txnsCol(uid), orderBy("transactionDate", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }));
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
  const snap = await getDoc(doc(prefsCol(uid), id));
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
