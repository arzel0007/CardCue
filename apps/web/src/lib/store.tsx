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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(emptyUser());
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>(mockNotificationPreference);
  const [isLoading, setIsLoading] = useState(true);
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
          let profile = await fetchUserProfile(uid);
          if (!profile) {
            profile = {
              id: uid,
              email: fbUser.email ?? "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              preferredCurrency: "PHP",
              timezone:
                Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila",
              preferences: {},
            };
            await upsertUserProfile(uid, profile);
          }
          if (cancelled) return;
          setUser(profile);

          const [cardList, txnList, prefs] = await Promise.all([
            fetchCards(uid),
            fetchTransactions(uid),
            fetchNotificationPreference(uid),
          ]);
          if (cancelled) return;
          setCards(cardList);
          setTransactions(txnList);
          if (prefs) setNotificationPreference(prefs);
          hydratedUid.current = uid;
        } catch (e) {
          console.error("[CardCue] Failed to load user data", e);
          setError("We couldn’t load your data. Check your connection and try again.");
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
        const now = new Date().toISOString();
        await upsertUserProfile(cred.user.uid, {
          id: cred.user.uid,
          email,
          createdAt: now,
          updatedAt: now,
          preferredCurrency: "PHP",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila",
          preferences: { displayName: name.trim() },
        });
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
        updatedAt: new Date().toISOString(),
        preferences: { ...prev.preferences, displayName: name.trim() },
      }));
      setCards(mockCards);
      setTransactions(mockTransactions);
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
