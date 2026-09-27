"use client";

import type { CreditCard, Transaction } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function TransactionTable({
  transactions,
  cards,
  currency = "PHP",
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  cards: CreditCard[];
  currency?: string;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const cardById = new Map(cards.map((c) => [c.id, c]));

  if (transactions.length === 0) {
    return (
      <div className="surface px-6 py-12 text-center">
        <p className="text-[15px] text-ink-secondary">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Transactions for the selected filter</caption>
          <thead>
            <tr className="border-b border-divider">
              <th scope="col" className="caption px-5 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="caption px-5 py-3 font-medium">
                Merchant
              </th>
              <th scope="col" className="caption px-5 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="caption px-5 py-3 font-medium">
                Card
              </th>
              <th scope="col" className="caption px-5 py-3 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="caption px-5 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const card = cardById.get(txn.cardId);
              return (
                <tr
                  key={txn.id}
                  className="border-b border-divider last:border-b-0 hover:bg-surface-muted/50"
                >
                  <td className="whitespace-nowrap px-5 py-3.5 text-[14px] text-ink-secondary">
                    {formatDate(txn.transactionDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[14px] font-medium text-ink">
                      {txn.merchant || "—"}
                    </p>
                    {txn.notes ? (
                      <p className="mt-0.5 text-[12px] text-ink-tertiary">{txn.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-[12px] text-ink-secondary">
                      {txn.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-ink-secondary">
                    {card ? `${card.nickname} · •••• ${card.lastFourDigits}` : "Unknown"}
                  </td>
                  <td className="tabular whitespace-nowrap px-5 py-3.5 text-right text-[15px] font-medium text-ink">
                    {formatMoney(txn.amount, currency)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(txn)}
                        aria-label={`Edit transaction ${txn.merchant || txn.category}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-status-critical"
                        onClick={() => onDelete(txn.id)}
                        aria-label={`Delete transaction ${txn.merchant || txn.category}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
