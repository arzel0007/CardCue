"use client";

import * as React from "react";
import type { CreditCard } from "@/lib/types";
import { cardIssuers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";

export interface CardFormValues {
  nickname: string;
  issuer: string;
  cardType: string;
  lastFourDigits: string;
  creditLimit: number;
  personalCycleLimit: number;
  statementDay: number;
  dueDay: number;
}

const emptyValues: CardFormValues = {
  nickname: "",
  issuer: "BPI",
  cardType: "",
  lastFourDigits: "",
  creditLimit: 50_000,
  personalCycleLimit: 20_000,
  statementDay: 5,
  dueDay: 25,
};

function toFormValues(card: CreditCard | null): CardFormValues {
  if (!card) return emptyValues;
  return {
    nickname: card.nickname,
    issuer: card.issuer,
    cardType: card.cardType ?? "",
    lastFourDigits: card.lastFourDigits,
    creditLimit: card.creditLimit,
    personalCycleLimit: card.personalCycleLimit,
    statementDay: card.statementDay,
    dueDay: card.dueDay,
  };
}

export function CardFormDialog({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: CardFormValues) => void;
  editing: CreditCard | null;
}) {
  const [values, setValues] = React.useState<CardFormValues>(emptyValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setValues(toFormValues(editing));
      setErrors({});
    }
  }, [open, editing]);

  function set<K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.nickname.trim()) next.nickname = "Nickname is required.";
    if (!/^\d{4}$/.test(values.lastFourDigits)) {
      next.lastFourDigits = "Enter exactly 4 digits.";
    }
    if (values.creditLimit < 0) next.creditLimit = "Must be zero or more.";
    if (values.personalCycleLimit <= 0) {
      next.personalCycleLimit = "Personal cycle limit must be greater than zero.";
    }
    if (values.statementDay < 1 || values.statementDay > 31) {
      next.statementDay = "Day must be 1–31.";
    }
    if (values.dueDay < 1 || values.dueDay > 31) {
      next.dueDay = "Day must be 1–31.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...values,
      nickname: values.nickname.trim(),
      lastFourDigits: values.lastFourDigits,
      cardType: values.cardType.trim() || undefined as unknown as string,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit card" : "Add card"}
      description="Track your Personal Cycle Limit — your budget for this billing cycle."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nickname" htmlFor="card-nickname" error={errors.nickname}>
          <Input
            id="card-nickname"
            value={values.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            placeholder="e.g. BPI Rewards"
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Issuer" htmlFor="card-issuer">
            <Select
              id="card-issuer"
              value={values.issuer}
              onChange={(e) => set("issuer", e.target.value)}
            >
              {cardIssuers.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Card type (optional)" htmlFor="card-type">
            <Input
              id="card-type"
              value={values.cardType}
              onChange={(e) => set("cardType", e.target.value)}
              placeholder="e.g. Gold"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          label="Last 4 digits"
          htmlFor="card-last4"
          hint="Only the last 4 — never a full card number."
          error={errors.lastFourDigits}
        >
          <Input
            id="card-last4"
            inputMode="numeric"
            maxLength={4}
            value={values.lastFourDigits}
            onChange={(e) =>
              set("lastFourDigits", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="0000"
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Credit limit" htmlFor="card-credit" error={errors.creditLimit}>
            <Input
              id="card-credit"
              type="number"
              min={0}
              step={100}
              value={values.creditLimit}
              onChange={(e) => set("creditLimit", Number(e.target.value))}
            />
          </Field>
          <Field
            label="Personal Cycle Limit"
            htmlFor="card-limit"
            hint="Your budget for the cycle."
            error={errors.personalCycleLimit}
          >
            <Input
              id="card-limit"
              type="number"
              min={1}
              step={100}
              value={values.personalCycleLimit}
              onChange={(e) => set("personalCycleLimit", Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Statement day"
            htmlFor="card-statement"
            hint="1–31"
            error={errors.statementDay}
          >
            <Input
              id="card-statement"
              type="number"
              min={1}
              max={31}
              value={values.statementDay}
              onChange={(e) => set("statementDay", Number(e.target.value))}
            />
          </Field>
          <Field
            label="Due day"
            htmlFor="card-due"
            hint="1–31"
            error={errors.dueDay}
          >
            <Input
              id="card-due"
              type="number"
              min={1}
              max={31}
              value={values.dueDay}
              onChange={(e) => set("dueDay", Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">{editing ? "Save changes" : "Add card"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
