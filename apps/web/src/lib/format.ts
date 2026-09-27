import type { BillingSchedule, CalendarDay, CycleTransaction } from "./billingCycle";
import {
  addDays,
  addMonths,
  cardStatus,
  cycleSnapshot,
  cycleSpending,
  parseISODate,
  spendingSnapshot,
  toISODate,
} from "./billingCycle";
import type { BillingCycleSnapshot, CardCycleView, SpendingSnapshot, CardStatus } from "./types";

/** Format money with Intl.NumberFormat. Never hardcode symbol placement. */
export function formatMoney(
  amount: number,
  currency = "PHP",
  locale = "en-PH"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Compact money for tight spaces: ₱8.5k */
export function formatMoneyCompact(
  amount: number,
  currency = "PHP",
  locale = "en-PH"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(ratio: number, locale = "en-PH"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}

export function formatDate(iso: string, locale = "en-PH"): string {
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

export function formatDateShort(iso: string, locale = "en-PH"): string {
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

/** Microcopy: "Statement in 3 days" / "Statement today" / "Due in 5 days" */
export function countdownCopy(days: number, label: "Statement" | "Due"): string {
  if (days === 0) return `${label} today`;
  if (days === 1) return `${label} in 1 day`;
  if (days > 0) return `${label} in ${days} days`;
  const past = Math.abs(days);
  if (past === 1) return `${label} 1 day ago`;
  return `${label} ${past} days ago`;
}

/** Microcopy: "₱8,550 remaining" */
export function remainingCopy(remaining: number, currency = "PHP"): string {
  return `${formatMoney(remaining, currency)} remaining`;
}

// ---------------------------------------------------------------------------
// View builders bridging domain types ↔ billing-cycle engine
// ---------------------------------------------------------------------------

export function scheduleFromCard(card: { statementDay: number; dueDay: number }): BillingSchedule {
  return { statementDay: card.statementDay, dueDay: card.dueDay };
}

export function toCycleTransaction(t: {
  transactionDate: string;
  amount: number;
}): CycleTransaction {
  return { transactionDate: parseISODate(t.transactionDate), amount: t.amount };
}

export function snapshotToDomain(
  snap: ReturnType<typeof cycleSnapshot>
): BillingCycleSnapshot {
  return {
    currentCycleStart: toISODate(snap.currentCycleStart),
    currentCycleEnd: toISODate(snap.currentCycleEnd),
    nextStatementDate: toISODate(snap.nextStatementDate),
    nextDueDate: toISODate(snap.nextDueDate),
    daysUntilStatement: snap.daysUntilStatement,
    daysUntilDue: snap.daysUntilDue,
    cycleProgress: snap.cycleProgress,
    today: toISODate(snap.today),
  };
}

export function spendingToDomain(s: ReturnType<typeof spendingSnapshot>): SpendingSnapshot {
  return {
    currentCycleSpending: s.currentCycleSpending,
    personalCycleLimit: s.personalCycleLimit,
    personalLimitRemaining: s.personalLimitRemaining,
    personalLimitUtilization: s.personalLimitUtilization,
  };
}

export function buildCardCycleView(
  card: CardCycleView["card"],
  transactions: { transactionDate: string; amount: number }[],
  today: CalendarDay
): CardCycleView {
  const schedule = scheduleFromCard(card);
  const cycle = cycleSnapshot(today, schedule);
  const cycleTxs = transactions.map(toCycleTransaction);
  const spending = spendingSnapshot(
    cycleTxs,
    today,
    schedule,
    card.personalCycleLimit
  );
  const status = cardStatus(cycle, spending);
  return {
    card,
    cycle: snapshotToDomain(cycle),
    spending: spendingToDomain(spending),
    status: status as CardStatus,
  };
}

export { addDays, addMonths, cycleSpending };
