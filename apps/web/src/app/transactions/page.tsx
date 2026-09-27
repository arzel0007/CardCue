"use client";

import * as React from "react";
import type { Transaction } from "@/lib/types";
import { useStore, newTransactionId } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import {
  TransactionFormDialog,
  type TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { SectionHeader, Surface } from "@/components/ui/surface";
import { Field, Select } from "@/components/ui/form";

export default function TransactionsPage() {
  const {
    user,
    cards,
    transactions,
    isLoading,
    upsertTransaction,
    deleteTransaction,
    refresh,
  } = useStore();

  const [mounted, setMounted] = React.useState(false);
  const [cardFilter, setCardFilter] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const activeCards = React.useMemo(
    () => cards.filter((c) => !c.isArchived),
    [cards]
  );

  const filtered = React.useMemo(() => {
    const list =
      cardFilter === "all"
        ? transactions
        : transactions.filter((t) => t.cardId === cardFilter);
    return [...list].sort((a, b) =>
      a.transactionDate < b.transactionDate ? 1 : -1
    );
  }, [transactions, cardFilter]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  function handleSave(values: TransactionFormValues) {
    const now = new Date().toISOString();
    upsertTransaction({
      id: editing?.id ?? newTransactionId(),
      userId: user.id,
      cardId: values.cardId,
      amount: values.amount,
      transactionDate: values.transactionDate,
      category: values.category,
      merchant: values.merchant || undefined,
      notes: values.notes || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setFormOpen(false);
    setEditing(null);
  }

  if (!mounted || isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader onAdd={() => setFormOpen(true)} />
        <LoadingState label="Loading transactions…" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      {error ? (
        <ErrorState body={error} onRetry={() => { setError(null); refresh(); }} />
      ) : null}

      <Surface className="flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="w-full max-w-xs">
          <Field label="Filter by card" htmlFor="txn-filter">
            <Select
              id="txn-filter"
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
            >
              <option value="all">All cards</option>
              {activeCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname} · •••• {c.lastFourDigits}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="text-right">
          <p className="caption">Cycle spending (filtered)</p>
          <p className="tabular mt-1 text-[22px] font-semibold text-ink">
            {formatMoney(total, user.preferredCurrency)}
          </p>
        </div>
      </Surface>

      <section aria-label="Transaction list" className="space-y-4">
        <SectionHeader
          title="Transactions"
          subtitle={`${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
        />
        {filtered.length === 0 ? (
          <EmptyState
            title="No transactions"
            body={
              cardFilter === "all"
                ? "Add spending to see it appear in your cycle totals."
                : "No transactions for this card yet."
            }
            actionLabel="Add transaction"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <TransactionTable
            transactions={filtered}
            cards={activeCards}
            currency={user.preferredCurrency}
            onEdit={(txn) => {
              setEditing(txn);
              setFormOpen(true);
            }}
            onDelete={(id) => setDeleteId(id)}
          />
        )}
      </section>

      <TransactionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
        cards={activeCards}
        defaultCardId={cardFilter !== "all" ? cardFilter : activeCards[0]?.id}
      />

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteId(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete transaction"
            className="relative z-10 w-full max-w-md rounded-2xl border border-divider bg-surface p-6 shadow-sheet"
          >
            <h2 className="text-[18px] font-semibold text-ink">Delete transaction?</h2>
            <p className="mt-2 text-[14px] text-ink-secondary">
              This removes the entry from your cycle spending. This can’t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteTransaction(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink">
          Transactions
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-secondary">
          User-entered spending. Amounts count toward the current cycle.
        </p>
      </div>
      <Button onClick={onAdd}>Add transaction</Button>
    </header>
  );
}
