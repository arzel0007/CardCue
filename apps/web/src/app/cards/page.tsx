"use client";

import * as React from "react";
import type { CreditCard } from "@/lib/types";
import { useStore, newCardId } from "@/lib/store";
import { todayInTimezone } from "@/lib/billingCycle";
import { buildCardCycleView, formatMoney } from "@/lib/format";
import { CardFormDialog, type CardFormValues } from "@/components/cards/card-form";
import { CreditCardSummary } from "@/components/cards/credit-card-summary";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { SectionHeader } from "@/components/ui/surface";
import { Dialog } from "@/components/ui/dialog";

export default function CardsPage() {
  const {
    user,
    cards,
    transactions,
    isLoading,
    upsertCard,
    archiveCard,
    refresh,
  } = useStore();

  const [mounted, setMounted] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CreditCard | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<CreditCard | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

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

  function handleSave(values: CardFormValues) {
    const now = new Date().toISOString();
    const base: CreditCard = {
      id: editing?.id ?? newCardId(),
      userId: user.id,
      nickname: values.nickname,
      issuer: values.issuer,
      cardType: values.cardType || undefined,
      lastFourDigits: values.lastFourDigits,
      creditLimit: values.creditLimit,
      personalCycleLimit: values.personalCycleLimit,
      statementDay: values.statementDay,
      dueDay: values.dueDay,
      isArchived: false,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    void upsertCard(base);
    setFormOpen(false);
    setEditing(null);
  }

  if (!mounted || isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader onAdd={() => setFormOpen(true)} />
        <LoadingState label="Loading cards…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader onAdd={() => { setEditing(null); setFormOpen(true); }} />

      {error ? (
        <ErrorState body={error} onRetry={() => { setError(null); refresh(); }} />
      ) : null}

      {activeCards.length === 0 && !error ? (
        <EmptyState
          title="No cards yet"
          body="Add a card to track your Personal Cycle Limit, statement day, and due day."
          actionLabel="Add card"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <section aria-label="Card list" className="space-y-5">
          <SectionHeader
            title={`${activeCards.length} ${activeCards.length === 1 ? "card" : "cards"}`}
            subtitle="Personal Cycle Limit is your budget — credit limit is display only."
          />
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {views.map((view) => (
              <CreditCardSummary
                key={view.card.id}
                view={view}
                currency={user.preferredCurrency}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(view.card);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${view.card.nickname}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-status-critical"
                      onClick={() => setArchiveTarget(view.card)}
                      aria-label={`Archive ${view.card.nickname}`}
                    >
                      Archive
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Summary" className="surface p-6">
        <h2 className="text-[20px] font-semibold text-ink">Totals</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="caption">Cycle spending</dt>
            <dd className="tabular mt-1 text-[22px] font-semibold text-ink">
              {formatMoney(
                views.reduce((s, v) => s + v.spending.currentCycleSpending, 0),
                user.preferredCurrency
              )}
            </dd>
          </div>
          <div>
            <dt className="caption">Remaining cycle budget</dt>
            <dd className="tabular mt-1 text-[22px] font-semibold text-ink">
              {formatMoney(
                views.reduce(
                  (s, v) => s + (v.spending.personalLimitRemaining ?? 0),
                  0
                ),
                user.preferredCurrency
              )}
            </dd>
          </div>
          <div>
            <dt className="caption">Credit limit (display)</dt>
            <dd className="tabular mt-1 text-[22px] font-semibold text-ink-secondary">
              {formatMoney(
                views.reduce((s, v) => s + v.card.creditLimit, 0),
                user.preferredCurrency
              )}
            </dd>
          </div>
        </dl>
      </section>

      <CardFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
      />

      <Dialog
        open={archiveTarget != null}
        onClose={() => setArchiveTarget(null)}
        title="Archive card?"
        description={`${archiveTarget?.nickname ?? "This card"} will be hidden from your dashboard. Transactions stay in your history.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (archiveTarget) void archiveCard(archiveTarget.id);
                setArchiveTarget(null);
              }}
            >
              Archive
            </Button>
          </>
        }
      >
        <p className="text-[14px] text-ink-secondary">
          Archiving is reversible in a future release. No card numbers are stored —
          only the nickname and last 4 digits.
        </p>
      </Dialog>
    </div>
  );
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          Cards
        </h1>
        <p className="mt-1 max-w-xl text-[14px] text-ink-secondary sm:text-[15px]">
          Manage nicknames, statement days, and Personal Cycle Limits.
        </p>
      </div>
      <Button onClick={onAdd} className="shrink-0">
        Add card
      </Button>
    </header>
  );
}
