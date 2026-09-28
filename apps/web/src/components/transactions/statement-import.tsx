"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { formatMoney, formatDateShort, formatNumberInput, parseNumberInput } from "@/lib/format";
import {
  parseStatementText,
  type ParsedTransaction,
} from "@/lib/statement-parse";
import { extractStatementText, extractErrorMessage } from "@/lib/statement-extract";
import { newTransactionId } from "@/lib/store";
import type { CreditCard, Transaction } from "@/lib/types";

/**
 * Statement upload → OCR/extract → parse → review → import.
 * User confirms each line before it is saved.
 */
export function StatementImportSheet({
  cards,
  defaultCardId,
  onImport,
  onClose,
}: {
  cards: CreditCard[];
  defaultCardId?: string;
  onImport: (txns: Transaction[]) => void | Promise<void>;
  onClose: () => void;
}) {
  const [cardId, setCardId] = React.useState(defaultCardId ?? cards[0]?.id ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<
    "idle" | "extracting" | "review" | "importing" | "error"
  >("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [extractedText, setExtractedText] = React.useState("");
  const [method, setMethod] = React.useState<string>("");
  const [rows, setRows] = React.useState<ParsedTransaction[]>([]);
  const [checked, setChecked] = React.useState<Record<number, boolean>>({});
  const [defaultYear, setDefaultYear] = React.useState(
    new Date().getFullYear()
  );

  async function handleFile(next: File | null) {
    setFile(next);
    setError(null);
    setRows([]);
    if (!next) return;
    setStatus("extracting");
    setProgress(0);
    try {
      const result = await extractStatementText(next, setProgress);
      setExtractedText(result.text);
      setMethod(result.method);
      const parsed = parseStatementText(result.text, { defaultYear });
      setRows(parsed);
      setChecked(Object.fromEntries(parsed.map((_, i) => [i, true])));
      if (parsed.length === 0) {
        setError(
          "We couldn’t find clear transaction lines. You can paste statement text below or try a clearer scan."
        );
        setStatus("idle");
      } else {
        setStatus("review");
      }
    } catch (e) {
      console.error("[CardO] statement extract failed", e);
      setError(extractErrorMessage(e));
      setStatus("idle");
    }
  }

  function handleManualParse() {
    const parsed = parseStatementText(extractedText, { defaultYear });
    setRows(parsed);
    setChecked(Object.fromEntries(parsed.map((_, i) => [i, true])));
    setError(
      parsed.length ? null : "Still no transaction lines found in that text."
    );
    if (parsed.length) setStatus("review");
  }

  async function handleImport() {
    const picked = rows.filter((_, i) => checked[i]);
    if (!picked.length) return;
    setStatus("importing");
    const now = new Date().toISOString();
    const txns: Transaction[] = picked.map((p) => ({
      id: newTransactionId(),
      userId: "",
      cardId,
      amount: Math.abs(p.amount),
      transactionDate: p.transactionDate,
      category: p.category,
      merchant: p.merchant,
      notes: p.notes,
      createdAt: now,
      updatedAt: now,
    }));
    await onImport(txns);
    onClose();
  }

  const selectedCount = rows.filter((_, i) => checked[i]).length;
  const selectedTotal = rows
    .filter((_, i) => checked[i])
    .reduce((s, r) => s + Math.abs(r.amount), 0);
  const isImporting = status === "importing";

  return (
    <div className="space-y-5">
      <p className="text-[13px] leading-relaxed text-ink-secondary">
        Upload a PDF or photo. We&apos;ll read the lines and let you review before
        anything is saved.
      </p>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Card" htmlFor="import-card">
          <Select
            id="import-card"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} · •••• {c.lastFourDigits}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default year" htmlFor="import-year">
          <Select
            id="import-year"
            value={String(defaultYear)}
            onChange={(e) => setDefaultYear(Number(e.target.value))}
            className="w-full"
          >
            {[0, 1, 2].map((d) => {
              const y = new Date().getFullYear() - d;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </Select>
        </Field>
      </div>

      <label
        htmlFor="statement-file"
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-divider bg-surface-muted/50 px-4 py-8 text-center transition-colors hover:border-accent"
      >
        <input
          id="statement-file"
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-[14px] font-medium text-ink">
          {file ? file.name : "Choose statement PDF or photo"}
        </p>
        <p className="mt-1 text-[12px] text-ink-secondary">
          PDF · PNG · JPG — text is read in your browser
        </p>
      </label>

      {status === "extracting" ? (
        <div
          role="status"
          className="rounded-xl border border-divider bg-surface p-4"
        >
          <p className="text-[13px] text-ink-secondary">
            Reading statement… {Math.round(progress * 100)}%
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-divider">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-[13px] text-status-critical">
          {error}
        </p>
      ) : null}

      {/* Always-available paste path (works when OCR fails) */}
      <details
        className="rounded-xl border border-divider bg-surface"
        open={status === "idle" && !!error}
      >
        <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-ink-secondary">
          Paste statement text instead (or fix OCR text)
        </summary>
        <div className="px-4 pb-4">
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={8}
            placeholder={"09/12 SM SUPERMARKET 2500.00\n09/15 SHELL 1800.00\n…"}
            className="field w-full font-mono text-[12px]"
            aria-label="Statement text"
          />
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={handleManualParse}
            disabled={!extractedText.trim()}
          >
            Parse text
          </Button>
        </div>
      </details>

      {status === "review" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-medium text-ink">
              Review {selectedCount} line{selectedCount === 1 ? "" : "s"}
            </p>
            <p className="tabular text-[13px] text-ink-secondary">
              {formatMoney(selectedTotal, "PHP")} selected
            </p>
          </div>

          <ul className="max-h-[50dvh] divide-y divide-divider overflow-y-auto rounded-xl border border-divider bg-surface">
            {rows.map((row, i) => (
              <li key={`${row.transactionDate}-${i}`} className="p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!checked[i]}
                    onChange={(e) =>
                      setChecked((c) => ({ ...c, [i]: e.target.checked }))
                    }
                    className="mt-1.5 h-5 w-5 shrink-0 accent-[color:var(--accent)]"
                    aria-label={`Include ${row.merchant} ${row.amount}`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      className="field h-10 min-h-0 w-full px-2.5 text-[14px]"
                      value={row.merchant}
                      onChange={(e) => {
                        const merchant = e.target.value;
                        setRows((r) =>
                          r.map((x, j) => (j === i ? { ...x, merchant } : x))
                        );
                      }}
                      placeholder="Merchant"
                      aria-label="Edit merchant"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-ink-secondary">
                        {formatDateShort(row.transactionDate)} · {row.category}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <AmountInput
                          value={row.amount}
                          onChange={(amount) =>
                            setRows((r) =>
                              r.map((x, j) => (j === i ? { ...x, amount } : x))
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || isImporting}
            >
              {isImporting
                ? "Adding…"
                : `Add ${selectedCount} transaction${selectedCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Amount with comma grouping + clearable string state. */
function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = React.useState(() =>
    formatNumberInput(String(Math.abs(value)))
  );
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setText(formatNumberInput(String(Math.abs(value))));
  }, [value]);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-ink-secondary"
      >
        ₱
      </span>
      <input
        className="field tabular h-10 min-h-0 w-28 pl-6 pr-2 text-right text-[14px]"
        inputMode="decimal"
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setText(formatNumberInput(String(Math.abs(value))));
        }}
        onChange={(e) => {
          const next = formatNumberInput(e.target.value);
          setText(next);
          const n = parseNumberInput(next);
          onChange(n != null ? Math.abs(n) : 0);
        }}
        aria-label="Edit amount"
      />
    </div>
  );
}
