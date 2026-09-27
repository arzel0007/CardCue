"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useStore } from "@/lib/store";
import { CardCueLogo } from "@/components/brand/cardcue-logo";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/calendar", label: "Calendar" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
];

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthReady, isDemoMode, signOut } = useStore();
  const isAuthPage = AUTH_PATHS.has(pathname);

  React.useEffect(() => {
    if (!isAuthReady) return;
    // Demo mode keeps the UI explorable without login.
    if (isDemoMode) return;
    if (!isAuthPage && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthReady, isAuthPage, isAuthenticated, isDemoMode, router]);

  // Auth pages render full-bleed without app chrome.
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-[14px] text-ink-secondary">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-divider bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center">
            <CardCueLogo size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <Nav />
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
              className="rounded-full border border-divider px-3.5 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:border-ink-tertiary hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8">
        {children}
      </main>
    </div>
  );
}

function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
