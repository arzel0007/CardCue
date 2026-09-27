"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { CardCueMark } from "@/components/brand/cardcue-logo";

type Mode = "signin" | "signup";

export function AuthScreen({ initialMode = "signin" }: { initialMode?: Mode }) {
  const router = useRouter();
  const { signIn, signUp, isAuthenticated } = useStore();

  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-root">
      {/* Brand story — left */}
      <aside className="auth-brand" aria-hidden="false">
        <Link href="/" className="auth-logo">
          <CardCueMark size={36} />
          <span className="auth-logo-word">CardCue</span>
        </Link>

        <div className="auth-hero">
          <p className="auth-hero-kicker">Cycle & spending awareness</p>
          <h1>Know your cycle.</h1>
          <p>
            See what is happening with your cards right now — statement cutoffs,
            payment dates, and your personal cycle budget — without the spreadsheet.
          </p>

          <div className="auth-pills">
            <span className="auth-pill">
              <span className="auth-pill-dot ok" />
              OK to spend
            </span>
            <span className="auth-pill">
              <span className="auth-pill-dot warn" />
              Near personal limit
            </span>
            <span className="auth-pill">
              <span className="auth-pill-dot out" />
              Outside this cycle
            </span>
          </div>

          <div className="auth-cycle">
            <p className="auth-cycle-label">The lifecycle</p>
            <div className="auth-cycle-track">
              <div className="auth-cycle-step">
                Spend
                <span>track</span>
              </div>
              <div className="auth-cycle-arrow">→</div>
              <div className="auth-cycle-step">
                Cycle
                <span>budget</span>
              </div>
              <div className="auth-cycle-arrow">→</div>
              <div className="auth-cycle-step">
                Statement
                <span>cutoff</span>
              </div>
            </div>
            <div className="auth-cycle-track" style={{ marginTop: 10 }}>
              <div className="auth-cycle-step">
                Payment
                <span>due</span>
              </div>
              <div className="auth-cycle-arrow">→</div>
              <div className="auth-cycle-step" style={{ gridColumn: "span 3" }}>
                Next cycle
                <span>start again</span>
              </div>
            </div>
          </div>
        </div>

        <p className="auth-footnote">
          CardCue never stores full card numbers, CVVs, or bank credentials.
          Only nicknames, last four digits, limits, and the dates you choose to track.
        </p>
      </aside>

      {/* Form — right */}
      <main className="auth-form-panel">
        <div className="auth-form-card">
          <Link href="/" className="auth-logo auth-mobile-logo">
            <CardCueMark size={36} />
            <span className="auth-logo-word" style={{ color: "var(--ink)" }}>
              CardCue
            </span>
          </Link>

          <h2 className="auth-form-title">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="auth-form-sub">
            {mode === "signin"
              ? "Sign in to see your cycles, cutoffs, and remaining budget."
              : "Start tracking statement dates and personal cycle limits in minutes."}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Sign in or sign up">
            <button
              type="button"
              role="tab"
              className="auth-tab"
              aria-selected={mode === "signin"}
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              className="auth-tab"
              aria-selected={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-fields" noValidate>
            {mode === "signup" ? (
              <div>
                <label className="auth-field-label" htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  className="auth-input"
                  autoComplete="name"
                  placeholder="Alex Reyes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="auth-field-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="auth-field-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="auth-submit" disabled={pending}>
              {pending
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="auth-secondary"
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                await signIn("demo@cardcue.app", "demo-password");
                router.replace("/");
              } catch {
                setError("Could not start the demo session.");
              } finally {
                setPending(false);
              }
            }}
            disabled={pending}
          >
            Continue with demo data
          </button>

          <p className="auth-legal">
            By continuing, you agree to keep CardCue as an organization tool —
            not financial advice. <Link href="/">Privacy</Link>
          </p>

          <p className="auth-demo">
            Demo mode: any email + password works. Live Supabase Auth plugs in later
            via <code>lib/supabase.ts</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
