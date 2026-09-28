"use client";

import * as React from "react";
import type { CycleTransaction } from "@/lib/billingCycle";
import { todayInTimezone, parseISODate } from "@/lib/billingCycle";
import { buildCardCycleView, formatMoney, formatDateShort } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CycleCalendar } from "@/components/calendar/cycle-calendar";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { StatusChip } from "@/components/ui/status";
import Link from "next/link";

export default function CalendarPage() {
  const { user, cards, transactions, isLoading } = useStore();
  const [mounted, setMounted] = React.useState(false);
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const activeCards = React.useMemo(
    () => cards.filter((c) => !c.isArchived),
    [cards]
  );

  const selectedCard =
    activeCards.find((c) => c.id === selectedCardId) ?? activeCards[0] ?? null;

  const today = React.useMemo(() => {
    if (!mounted) return parseISODate("2024-01-01");
    return todayInTimezone(user.timezone);
  }, [mounted, user.timezone]);

  const cardTransactions: CycleTransaction[] = React.useMemo(() => {
    if (!selectedCard) return [];
    return transactions
      .filter((t) => t.cardId === selectedCard.id)
      .map((t) => ({
        transactionDate: parseISODate(t.transactionDate),
        amount: t.amount,
      }));
  }, [selectedCard, transactions]);

  const view = React.useMemo(() => {
    if (!selectedCard || !mounted) return null;
    return buildCardCycleView(
      selectedCard,
      transactions.filter((t) => t.cardId === selectedCard.id),
      today
    );
  }, [selectedCard, transactions, today, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <LoadingState label="Loading calendar…" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      {activeCards.length === 0 ? (
        <EmptyState
          title="No cards to calendar"
          body="Add a card to see statement cutoffs, due dates, and your personal cycle budget by day."
          actionLabel="Add a card"
          onAction={() => {
            window.location.href = "/cards";
          }}
        />
      ) : (
        <>
          <section className="surface p-5" aria-label="Card and cycle summary">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select card">
                {activeCards.map((card) => {
                  const active = selectedCard?.id === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCardId(card.id)}
                      className={[
                        "rounded-full border px-4 py-2 text-[14px] font-medium transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                        active
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-divider text-ink-secondary hover:border-ink-tertiary hover:text-ink",
                      ].join(" ")}
                    >
                      {card.nickname}
                      <span className="ml-2 text-ink-tertiary">•••• {card.lastFourDigits}</span>
                    </button>
                  );
                })}
              </div>
              {view ? <StatusChip status={view.status} /> : null}
            </div>

            {view ? (
              <div className="mt-5 grid gap-4 border-t border-divider pt-5 sm:grid-cols-3">
                <div>
                  <p className="caption">Current cycle</p>
                  <p className="mt-1 text-[15px] font-medium text-ink">
                    {formatDateShort(view.cycle.currentCycleStart)} –{" "}
                    {formatDateShort(view.cycle.currentCycleEnd)}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-secondary">
                    Cutoff is the statement date
                  </p>
                </div>
                <div>
                  <p className="caption">Cycle spending</p>
                  <p className="tabular mt-1 text-[15px] font-medium text-ink">
                    {formatMoney(view.spending.currentCycleSpending, user.preferredCurrency)}
                    {view.spending.personalCycleLimit != null ? (
                      <span className="text-ink-secondary">
                        {" "}
                        of {formatMoney(view.spending.personalCycleLimit, user.preferredCurrency)}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-secondary">
                    {view.spending.personalLimitRemaining != null
                      ? `${formatMoney(view.spending.personalLimitRemaining, user.preferredCurrency)} remaining`
                      : "No personal cycle limit"}
                  </p>
                </div>
                <div>
                  <p className="caption">Next payment</p>
                  <p className="tabular mt-1 text-[15px] font-medium text-ink">
                    {formatDateShort(view.cycle.nextDueDate)}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-secondary">
                    Statement {formatDateShort(view.cycle.nextStatementDate)}
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          {selectedCard ? (
            <CycleCalendar
              schedule={{
                statementDay: selectedCard.statementDay,
                dueDay: selectedCard.dueDay,
              }}
              today={today}
              transactions={cardTransactions}
              personalCycleLimit={selectedCard.personalCycleLimit}
              currency={user.preferredCurrency}
              cardLabel={`${selectedCard.nickname} · •••• ${selectedCard.lastFourDigits}`}
            />
          ) : null}

          <p className="text-[13px] text-ink-secondary">
            <strong className="font-medium text-ink">Green days</strong> are still OK to spend
            before the statement cutoff. <strong className="font-medium text-ink">Amber days</strong>{" "}
            mean you&apos;re near or at your personal cycle limit.{" "}
            <strong className="font-medium text-ink">Hatched days</strong> are outside this
            cycle — spending lands on the next statement.
          </p>
        </>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          Calendar
        </h1>
        <p className="mt-1 max-w-xl text-[14px] text-ink-secondary sm:text-[15px]">
          See which dates sit inside the statement cutoff and how much of your
          personal cycle limit remains.
        </p>
      </div>
      <Link
        href="/cards"
        className="shrink-0 rounded-full bg-accent-soft px-4 py-2 text-[13px] font-medium text-accent"
      >
        Manage cards
      </Link>
    </header>
  );
}
