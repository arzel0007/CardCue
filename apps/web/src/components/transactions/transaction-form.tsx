"use client";

import * as React from "react";
import type { CreditCard, Transaction } from "@/lib/types";
import { transactionCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";

export interface TransactionFormValues {
  cardId: string;
  amount: number;
  transactionDate: string;
  category: string;
  merchant: string;
  notes: string;
}

/** Calendar day in the user's timezone (not UTC — avoids off-by-one near midnight). */
function todayISOLocal(timeZone?: string): string {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const emptyValues = (cardId: string): TransactionFormValues => ({
  cardId,
  amount: 0,
  transactionDate: todayISOLocal(),
  category: "Groceries",
  merchant: "",
  notes: "",
});

export function TransactionFormDialog({
  open,
  onClose,
  onSave,
  editing,
  cards,
  defaultCardId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: TransactionFormValues) => void;
  editing: Transaction | null;
  cards: CreditCard[];
  defaultCardId?: string;
}) {
  const [values, setValues] = React.useState<TransactionFormValues>(
    emptyValues(defaultCardId ?? cards[0]?.id ?? "")
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setValues({
        cardId: editing.cardId,
        amount: editing.amount,
        transactionDate: editing.transactionDate,
        category: editing.category,
        merchant: editing.merchant ?? "",
        notes: editing.notes ?? "",
      });
    } else {
      setValues(emptyValues(defaultCardId ?? cards[0]?.id ?? ""));
    }
  }, [open, editing, cards, defaultCardId]);

  function set<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.cardId) next.cardId = "Choose a card.";
    if (!(values.amount > 0)) next.amount = "Amount must be greater than zero.";
    if (!values.transactionDate) next.transactionDate = "Date is required.";
    if (!values.category) next.category = "Category is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...values,
      merchant: values.merchant.trim(),
      notes: values.notes.trim(),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add transaction"}
      description="User-entered spending for this billing cycle."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Card" htmlFor="txn-card" error={errors.cardId}>
          <Select
            id="txn-card"
            value={values.cardId}
            onChange={(e) => set("cardId", e.target.value)}
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} · •••• {c.lastFourDigits}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount" htmlFor="txn-amount" error={errors.amount}>
            <Input
              id="txn-amount"
              type="number"
              min={0}
              step={0.01}
              value={values.amount || ""}
              onChange={(e) => set("amount", Number(e.target.value))}
              placeholder="0"
            />
          </Field>
          <Field label="Date" htmlFor="txn-date" error={errors.transactionDate}>
            <Input
              id="txn-date"
              type="date"
              value={values.transactionDate}
              onChange={(e) => set("transactionDate", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" htmlFor="txn-category" error={errors.category}>
            <Select
              id="txn-category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {transactionCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Merchant (optional)" htmlFor="txn-merchant">
            <Input
              id="txn-merchant"
              value={values.merchant}
              onChange={(e) => set("merchant", e.target.value)}
              placeholder="e.g. SM Supermarket"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label="Notes (optional)" htmlFor="txn-notes">
          <Textarea
            id="txn-notes"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything worth remembering"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">{editing ? "Save changes" : "Add transaction"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
