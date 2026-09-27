"use client";

/**
 * Client-side app store. Mock/local state stands in for Supabase until the
 * live backend is wired. All pages read/write through this provider.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
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
  /** Mock auth session — true after sign-in / sign-up. */
  isAuthenticated: boolean;
  upsertCard: (card: CreditCard) => void;
  archiveCard: (id: string) => void;
  upsertTransaction: (txn: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateNotificationPreference: (patch: Partial<NotificationPreference>) => void;
  updateUser: (patch: Partial<User>) => void;
  /** Mock credentials — stands in for Supabase Auth. */
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  /** Simulates a brief loading window for data screens. */
  refresh: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(mockUser);
  const [cards, setCards] = useState<CreditCard[]>(mockCards);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>(mockNotificationPreference);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore mock session (stands in for Supabase Auth cookie/local session).
  React.useEffect(() => {
    try {
      if (window.localStorage.getItem("cardcue.session") === "1") {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Prefer real Firebase Auth when configured; otherwise mock session.
    const { getFirebaseAuth } = await import("./firebase");
    const { signInEmailPassword } = await import("./firebase-data");
    if (getFirebaseAuth()) {
      await signInEmailPassword(email, password);
      setIsAuthenticated(true);
      setUser((prev) => ({ ...prev, email, updatedAt: new Date().toISOString() }));
      return;
    }

    // Mock delay so the button can show pending state
    await new Promise((r) => setTimeout(r, 450));
    if (!email.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    setIsAuthenticated(true);
    setUser((prev) => ({
      ...prev,
      email,
      updatedAt: new Date().toISOString(),
    }));
    try {
      window.localStorage.setItem("cardcue.session", "1");
    } catch {
      // ignore
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { getFirebaseAuth } = await import("./firebase");
    const { signUpEmailPassword } = await import("./firebase-data");
    if (getFirebaseAuth()) {
      await signUpEmailPassword(email, password);
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        email,
        updatedAt: new Date().toISOString(),
        preferences: { ...prev.preferences, displayName: name.trim() },
      }));
      return;
    }

    await new Promise((r) => setTimeout(r, 550));
    if (!email.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    if (name.trim().length < 2) {
      throw new Error("Enter your name.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    setIsAuthenticated(true);
    setUser((prev) => ({
      ...prev,
      email,
      updatedAt: new Date().toISOString(),
      preferences: { ...prev.preferences, displayName: name.trim() },
    }));
    try {
      window.localStorage.setItem("cardcue.session", "1");
    } catch {
      // ignore
    }
  }, []);

  const signOut = useCallback(() => {
    void (async () => {
      try {
        const { getFirebaseAuth } = await import("./firebase");
        const { signOutFirebase } = await import("./firebase-data");
        if (getFirebaseAuth()) await signOutFirebase();
      } catch {
        // ignore
      }
    })();
    setIsAuthenticated(false);
    try {
      window.localStorage.removeItem("cardcue.session");
    } catch {
      // ignore
    }
  }, []);

  const upsertCard = useCallback((card: CreditCard) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      const stamped = { ...card, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [...prev, stamped];
    });
  }, []);

  const archiveCard = useCallback((id: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isArchived: true, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const upsertTransaction = useCallback((txn: Transaction) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === txn.id);
      const stamped = { ...txn, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stamped;
        return next;
      }
      return [stamped, ...prev];
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateNotificationPreference = useCallback(
    (patch: Partial<NotificationPreference>) => {
      setNotificationPreference((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
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
      isAuthenticated,
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
      isAuthenticated,
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

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
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
