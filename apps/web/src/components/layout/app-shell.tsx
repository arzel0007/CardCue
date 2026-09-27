"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useStore } from "@/lib/store";
import { CardCueMark } from "@/components/brand/cardcue-logo";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/cards",
    label: "Cards",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2.5" fill="currentColor" />
        <path d="M3 10h18" stroke="#fff" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="currentColor" />
        <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Spend",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h11M7 12h11M7 17h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="4.5" cy="7" r="1.1" fill="currentColor" />
        <circle cx="4.5" cy="12" r="1.1" fill="currentColor" />
        <circle cx="4.5" cy="17" r="1.1" fill="currentColor" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h11M7 12h11M7 17h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="4.5" cy="7" r="1.1" fill="currentColor" />
        <circle cx="4.5" cy="12" r="1.1" fill="currentColor" />
        <circle cx="4.5" cy="17" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Profile",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" fill="currentColor" />
        <path
          d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthReady, isDemoMode, signOut } = useStore();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!mounted || !isAuthReady) return;
    if (isDemoMode) return;
    if (!isAuthPage && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, isAuthReady, isAuthPage, isAuthenticated, isDemoMode, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  const showAuthProgress = mounted && !isAuthReady;

  return (
    <div className="relative min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-bg">
      {showAuthProgress ? (
        <div
          role="status"
          aria-label="Restoring session"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-accent/15"
        >
          <div className="h-full w-1/3 animate-[cardcue-slide_1s_ease-in-out_infinite] bg-accent" />
        </div>
      ) : null}

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-divider bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2 overflow-hidden">
            <CardCueMark size={28} />
            <span className="truncate text-[16px] font-semibold tracking-tight text-ink sm:text-[17px]">
              CardCue
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} desktop />
              ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
              className="shrink-0 rounded-full border border-divider px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-ink-secondary transition-colors hover:border-ink-tertiary hover:text-ink sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-24"
      >
        {children}
      </main>

      {/* Floating iOS-style tab bar (reference: creator dashboard) */}
      <nav
        aria-label="Primary mobile"
        className="fixed bottom-0 left-0 right-0 z-[60] px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden"
        style={{ width: "100vw", maxWidth: "100vw" }}
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-[28px] border border-divider bg-surface px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                  active
                    ? "bg-accent text-white"
                    : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
                ].join(" ")}
              >
                <span aria-hidden="true">
                  {active ? (item.activeIcon ?? item.icon) : item.icon}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  desktop,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  desktop?: boolean;
}) {
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-accent-soft text-accent"
          : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
        desktop ? "" : "hidden",
      ].join(" ")}
    >
      {item.label === "Profile" ? "Settings" : item.label === "Spend" ? "Transactions" : item.label}
    </Link>
  );
}
