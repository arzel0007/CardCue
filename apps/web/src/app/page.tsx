"use client";

import * as React from "react";
import Link from "next/link";
import { useStore, displayNameForUser } from "@/lib/store";
import { todayInTimezone } from "@/lib/billingCycle";
import {
  buildCardCycleView,
  countdownCopy,
  formatDateShort,
  formatMoney,
} from "@/lib/format";
import { CreditCardSummary } from "@/components/cards/credit-card-summary";
import { SpendingChart } from "@/components/charts/spending-chart";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Surface, SectionHeader } from "@/components/ui/surface";
import type { CardCycleView } from "@/lib/types";

export default function DashboardPage() {
  const {
    user,
    cards,
    transactions,
    isLoading,
    refresh,
  } = useStore();
  const [mounted, setMounted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeCards = React.useMemo(
    () => cards.filter((c) => !c.isArchived),
    [cards]
  );

  const views = React.useMemo(() => {
    if (!mounted) return [];
    try {
      const today = todayInTimezone(user.timezone);
      return activeCards.map((card) =>
        buildCardCycleView(
          card,
          transactions.filter((t) => t.cardId === card.id),
          today
        )
      );
    } catch {
      setError("We couldn’t compute cycle data.");
      return [];
    }
  }, [mounted, activeCards, transactions, user.timezone]);

  const chartData = React.useMemo(() => {
    if (!mounted) return [];
    const today = todayInTimezone(user.timezone);
    const days: { label: string; amount: number; iso: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.year, today.month - 1, today.day - i));
      const iso = d.toISOString().slice(0, 10);
      days.push({
        label: new Intl.DateTimeFormat("en-PH", {
          weekday: "short",
          timeZone: "UTC",
        }).format(d),
        amount: transactions
          .filter((t) => t.transactionDate === iso)
          .reduce((s, t) => s + t.amount, 0),
        iso,
      });
    }
    return days;
  }, [mounted, transactions, user.timezone]);

  // Only block on first paint / active fetch when we have nothing to show yet.
  const showInitialLoading = !mounted || (isLoading && cards.length === 0);

  if (showInitialLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader />
        <LoadingState label="Loading your cards…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <ErrorState body={error} onRetry={() => { setError(null); refresh(); }} />
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <EmptyState
          title="No cards yet"
          body="Add a card to start tracking your Personal Cycle Limit, statement dates, and cycle spending."
          actionLabel="Add your first card"
          onAction={() => {
            window.location.href = "/cards";
          }}
        />
      </div>
    );
  }

  const sorted = [...views].sort(
    (a, b) => a.cycle.daysUntilStatement - b.cycle.daysUntilStatement
  );
  const nextUp = sorted[0];
  const dueNext = [...views]
    .filter((v) => v.cycle.daysUntilDue >= 0)
    .sort((a, b) => a.cycle.daysUntilDue - b.cycle.daysUntilDue)[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader />

      {/* Next up + Payment due — compact highlight tiles */}
      <section aria-label="Highlights" className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Surface className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="caption text-accent">Next up</p>
              <h2 className="mt-1 truncate text-[20px] font-semibold leading-tight text-ink sm:text-[22px]">
                {countdownCopy(nextUp.cycle.daysUntilStatement, "Statement")}
              </h2>
              <p className="mt-1 truncate text-[13px] text-ink-secondary">
                {nextUp.card.nickname} ·{" "}
                <span className="tabular">
                  {formatMoney(nextUp.spending.personalLimitRemaining ?? 0, user.preferredCurrency)}
                </span>{" "}
                left
              </p>
              <p className="mt-1 truncate text-[12px] text-ink-tertiary">
                {formatDateShort(nextUp.cycle.nextStatementDate)} · {nextUp.card.issuer} ••••{" "}
                {nextUp.card.lastFourDigits}
              </p>
            </div>
            <Link
              href="/cards"
              className="shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent"
            >
              Cards
            </Link>
          </div>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="caption text-status-attention">Payment due</p>
              <h2 className="mt-1 truncate text-[20px] font-semibold leading-tight text-ink sm:text-[22px]">
                {dueNext
                  ? countdownCopy(dueNext.cycle.daysUntilDue, "Due")
                  : "No payments due"}
              </h2>
              <p className="mt-1 truncate text-[13px] text-ink-secondary">
                {dueNext
                  ? `${dueNext.card.nickname} · ${formatDateShort(dueNext.cycle.nextDueDate)}`
                  : "You’re all caught up."}
              </p>
              {dueNext ? (
                <p className="mt-1 truncate text-[12px] text-ink-tertiary">
                  •••• {dueNext.card.lastFourDigits}
                </p>
              ) : null}
            </div>
            <Link
              href="/transactions"
              className="shrink-0 rounded-full bg-surface-muted px-3 py-1.5 text-[12px] font-medium text-ink-secondary"
            >
              Spend
            </Link>
          </div>
        </Surface>
      </section>

      {/* Spending chart */}
      <section aria-label="Spending chart">
        <SpendingChart data={chartData} currency={user.preferredCurrency} />
      </section>

      {/* Card list */}
      <section aria-label="Your cards" className="space-y-3 sm:space-y-4">
        <SectionHeader
          title="Your cards"
          subtitle="Cycle spending vs Personal Cycle Limit"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              aria-label="Refresh card data"
            >
              Refresh
            </Button>
          }
        />
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {sorted.map((view: CardCycleView) => (
            <CreditCardSummary
              key={view.card.id}
              view={view}
              currency={user.preferredCurrency}
              href="/cards"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PageHeader() {
  const { user } = useStore();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header>
      <p className="caption text-ink-secondary">{greeting}</p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
        {displayNameForUser(user)}
      </h1>
      <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-secondary sm:text-[15px]">
        Here’s where your cards stand this cycle.
      </p>
    </header>
  );
}
