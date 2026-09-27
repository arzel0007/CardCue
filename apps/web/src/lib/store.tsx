"use client";

/**
 * App store — source of truth for auth + user data.
 *
 * When Firebase is configured (NEXT_PUBLIC_FIREBASE_*):
 *   - Session is Firebase Auth only (onAuthStateChanged)
 *   - Profile / cards / transactions live in Firestore
 *   - localStorage is never treated as identity
 *
 * Demo mode (no Firebase env): in-memory mock data for local UI work only.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CreditCard, NotificationPreference, Transaction, User } from "./types";
import {
  mockCards,
  mockNotificationPreference,
  mockTransactions,
  mockUser,
} from "./mock-data";

export interface AppStore {
  user: User;
  cards: CreditCard[];
  transactions: Transaction[];
  notificationPreference: NotificationPreference;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  /** True when running without Firebase (local mock only). */
  isDemoMode: boolean;
  upsertCard: (card: CreditCard) => Promise<void>;
  archiveCard: (id: string) => Promise<void>;
  upsertTransaction: (txn: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateNotificationPreference: (patch: Partial<NotificationPreference>) => void;
  updateUser: (patch: Partial<User>) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveDisplayName(
  user: Pick<User, "email" | "displayName" | "preferences">
): string {
  const fromField = user.displayName?.trim();
  if (fromField) return fromField;
  const fromPrefs = user.preferences?.displayName;
  if (typeof fromPrefs === "string" && fromPrefs.trim()) return fromPrefs.trim();
  const local = user.email.split("@")[0] || "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function emptyUser(email = ""): User {
  const now = new Date().toISOString();
  return {
    id: "",
    email,
    createdAt: now,
    updatedAt: now,
    preferredCurrency: "PHP",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila"
        : "Asia/Manila",
    preferences: {},
  };
}

function firebaseErrorCode(err: unknown): string {
  const e = err as { code?: string; message?: string };
  return e?.code || e?.message || "unknown";
}

function hydrationErrorMessage(code: string): string {
  if (code.includes("permission-denied")) {
    return "We couldn’t read your saved data (permission denied). Make sure Cloud Firestore is enabled and security rules allow your account.";
  }
  if (code.includes("unavailable") || code.includes("failed-precondition")) {
    return "We couldn’t reach the database. Check that Cloud Firestore is created in the Firebase project, then try again.";
  }
  if (code.includes("unauthenticated")) {
    return "Your session expired. Please sign in again.";
  }
  return "We couldn’t load your data. Check your connection and try again.";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(emptyUser());
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>(mockNotificationPreference);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratedUid = useRef<string | null>(null);

  // --- Auth lifecycle -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { getFirebaseConfig, getFirebaseAuth } = await import("./firebase");
      const config = getFirebaseConfig();
      const auth = getFirebaseAuth();

      if (cancelled) return;

      if (!config.isConfigured || !auth) {
        // Demo mode: seed mock data so the UI is explorable without a backend.
        setIsDemoMode(true);
        setUser(mockUser);
        setCards(mockCards);
        setTransactions(mockTransactions);
        setNotificationPreference(mockNotificationPreference);
        setIsAuthenticated(false);
        setIsAuthReady(true);
        setIsLoading(false);
        return;
      }

      setIsDemoMode(false);
      const { onAuthStateChanged } = await import("firebase/auth");

      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (cancelled) return;
        if (!fbUser) {
          hydratedUid.current = null;
          setIsAuthenticated(false);
          setUser(emptyUser());
          setCards([]);
          setTransactions([]);
          setIsAuthReady(true);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const uid = fbUser.uid;
        const {
          fetchUserProfile,
          upsertUserProfile,
          fetchCards,
          fetchTransactions,
          fetchNotificationPreference,
        } = await import("./firebase-data");

        try {
          setIsLoading(true);

          let profile: User | null = null;
          try {
            profile = await fetchUserProfile(uid);
          } catch (profileErr) {
            console.warn("[CardCue] profile read failed, will retry create", profileErr);
          }

          const authName = fbUser.displayName?.trim() || undefined;

          if (!profile) {
            profile = {
              id: uid,
              email: fbUser.email ?? "",
              displayName: authName,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              preferredCurrency: "PHP",
              timezone:
                Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila",
              preferences: authName ? { displayName: authName } : {},
            };
            try {
              await upsertUserProfile(uid, profile);
            } catch (writeErr) {
              console.warn("[CardCue] profile create failed", writeErr);
            }
          }
          if (cancelled) return;

          const displayName =
            profile.displayName ||
            authName ||
            resolveDisplayName(profile);

          setUser({
            ...profile,
            id: uid,
            email: fbUser.email || profile.email,
            displayName,
            preferences: {
              ...(profile.preferences ?? {}),
              displayName,
            },
          });

          // Load collections independently so one failure doesn't block the app.
          const [cardResult, txnResult, prefsResult] = await Promise.allSettled([
            fetchCards(uid),
            fetchTransactions(uid),
            fetchNotificationPreference(uid),
          ]);
          if (cancelled) return;

          if (cardResult.status === "fulfilled") {
            setCards(cardResult.value);
          } else {
            console.warn("[CardCue] cards load failed", cardResult.reason);
          }
          if (txnResult.status === "fulfilled") {
            setTransactions(txnResult.value);
          } else {
            console.warn("[CardCue] transactions load failed", txnResult.reason);
          }
          if (prefsResult.status === "fulfilled" && prefsResult.value) {
            setNotificationPreference(prefsResult.value);
          }

          hydratedUid.current = uid;

          // Only surface a user-facing error if nothing loaded.
          if (cardResult.status === "rejected" && txnResult.status === "rejected") {
            const code = firebaseErrorCode(cardResult.reason);
            setError(hydrationErrorMessage(code));
          } else {
            setError(null);
          }
        } catch (e) {
          console.error("[CardCue] Failed to load user data", e);
          setError(hydrationErrorMessage(firebaseErrorCode(e)));
        } finally {
          if (!cancelled) {
            setIsAuthReady(true);
            setIsLoading(false);
          }
        }
      });

      return () => unsub();
    }

    const dispose = init();
    return () => {
      cancelled = true;
      void dispose.then((u) => u?.());
    };
  }, []);

  const requireUid = useCallback((): string | null => {
    return hydratedUid.current;
  }, []);

  // --- Auth actions ---------------------------------------------------------

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { getFirebaseAuth } = await import("./firebase");
      const auth = getFirebaseAuth();
      if (auth) {
        const { signInEmailPassword } = await import("./firebase-data");
        await signInEmailPassword(email, password);
        return;
      }
      // Demo only
      await new Promise((r) => setTimeout(r, 350));
      if (!email.includes("@")) throw new Error("Enter a valid email address.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      setIsAuthenticated(true);
      setUser((prev) => ({ ...prev, email, updatedAt: new Date().toISOString() }));
      setCards(mockCards);
      setTransactions(mockTransactions);
    },
    []
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { getFirebaseAuth } = await import("./firebase");
      const auth = getFirebaseAuth();
      if (auth) {
        const { signUpEmailPassword, upsertUserProfile } = await import("./firebase-data");
        const cred = await signUpEmailPassword(email, password);
        const nameTrimmed = name.trim();
        // Store name on Auth profile too so hydration never loses it.
        try {
          const { updateProfile } = await import("firebase/auth");
          await updateProfile(cred.user, { displayName: nameTrimmed });
        } catch (e) {
          console.warn("[CardCue] Auth displayName update failed", e);
        }
        const now = new Date().toISOString();
        const profile: User = {
          id: cred.user.uid,
          email,
          displayName: nameTrimmed,
          createdAt: now,
          updatedAt: now,
          preferredCurrency: "PHP",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila",
          preferences: { displayName: nameTrimmed },
        };
        await upsertUserProfile(cred.user.uid, profile);
        setUser(profile);
        return;
      }
      await new Promise((r) => setTimeout(r, 450));
      if (!email.includes("@")) throw new Error("Enter a valid email address.");
      if (name.trim().length < 2) throw new Error("Enter your name.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        email,
        displayName: name.trim(),
        updatedAt: new Date().toISOString(),
        preferences: { ...prev.preferences, displayName: name.trim() },
      }));
      setCards(mockCards);
      setTransactions(mockTransactions);
      return;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { getFirebaseAuth } = await import("./firebase");
    const { signOutFirebase } = await import("./firebase-data");
    if (getFirebaseAuth()) {
      await signOutFirebase();
    }
    hydratedUid.current = null;
    setIsAuthenticated(false);
    if (!getFirebaseAuth()) {
      setCards([]);
      setTransactions([]);
    }
  }, []);

  // --- Data mutations -------------------------------------------------------

  const upsertCard = useCallback(
    async (card: CreditCard) => {
      const stamped = { ...card, updatedAt: new Date().toISOString() };
      setCards((prev) => {
        const idx = prev.findIndex((c) => c.id === card.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = stamped;
          return next;
        }
        return [...prev, stamped];
      });
      const uid = requireUid();
      if (uid) {
        const { saveCard } = await import("./firebase-data");
        await saveCard(uid, stamped);
      }
    },
    [requireUid]
  );

  const archiveCard = useCallback(
    async (id: string) => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isArchived: true, updatedAt: new Date().toISOString() } : c
        )
      );
      const uid = requireUid();
      if (uid) {
        const { archiveCard: archiveRemote } = await import("./firebase-data");
        await archiveRemote(uid, id);
      }
    },
    [requireUid]
  );

  const upsertTransaction = useCallback(
    async (txn: Transaction) => {
      const stamped = { ...txn, updatedAt: new Date().toISOString() };
      setTransactions((prev) => {
        const idx = prev.findIndex((t) => t.id === txn.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = stamped;
          return next;
        }
        return [stamped, ...prev];
      });
      const uid = requireUid();
      if (uid) {
        const { saveTransaction } = await import("./firebase-data");
        await saveTransaction(uid, stamped);
      }
    },
    [requireUid]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const uid = requireUid();
      if (uid) {
        const { deleteTransaction: deleteRemote } = await import("./firebase-data");
        await deleteRemote(uid, id);
      }
    },
    [requireUid]
  );

  const updateNotificationPreference = useCallback(
    (patch: Partial<NotificationPreference>) => {
      setNotificationPreference((prev) => {
        const next = { ...prev, ...patch };
        const uid = hydratedUid.current;
        if (uid) {
          void (async () => {
            const { saveNotificationPreference } = await import("./firebase-data");
            await saveNotificationPreference(uid, next);
          })();
        }
        return next;
      });
    },
    []
  );

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      const uid = hydratedUid.current;
      if (uid) {
        void (async () => {
          const { upsertUserProfile } = await import("./firebase-data");
          await upsertUserProfile(uid, next);
        })();
      }
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 450);
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      user,
      cards,
      transactions,
      notificationPreference,
      isLoading,
      isAuthReady,
      isAuthenticated,
      isDemoMode,
      upsertCard,
      archiveCard,
      upsertTransaction,
      deleteTransaction,
      updateNotificationPreference,
      updateUser,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [
      user,
      cards,
      transactions,
      notificationPreference,
      isLoading,
      isAuthReady,
      isAuthenticated,
      isDemoMode,
      upsertCard,
      archiveCard,
      upsertTransaction,
      deleteTransaction,
      updateNotificationPreference,
      updateUser,
      signIn,
      signUp,
      signOut,
      refresh,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {error ? (
        <div
          role="status"
          className="border-b border-status-critical/30 bg-status-critical/10 px-4 py-2 text-center text-[13px] text-status-critical"
        >
          {error}
        </div>
      ) : null}
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function newCardId(): string {
  return makeId("card");
}

export function newTransactionId(): string {
  return makeId("txn");
}

/** Shared helper so UI never greets with a raw email local-part when a name exists. */
export function displayNameForUser(user: User): string {
  return resolveDisplayName(user);
}
