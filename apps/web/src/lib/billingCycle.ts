/**
 * TypeScript mirror of packages/BillingCycleEngine (Swift).
 * Pure, deterministic billing-cycle calculations — no network, UI, or DB.
 *
 * All date math operates on CalendarDay (y/m/d), never raw Date instants,
 * so "statement day = 31" and "February 28" are unambiguous.
 */

export interface CalendarDay {
  year: number;
  month: number; // 1–12
  day: number;
}

export interface BillingSchedule {
  /** Day of the month the statement closes (1–31). Clamped to month length. */
  statementDay: number;
  /** Day of the month payment is due (1–31). Clamped to month length. */
  dueDay: number;
}

export interface CycleTransaction {
  transactionDate: CalendarDay;
  amount: number;
}

export type CardStatus = "neutral" | "upcoming" | "attention" | "threshold" | "complete";

export interface StatusRuleSet {
  statementUrgentDays: number;
  dueUrgentDays: number;
  thresholdLevel: number;
}

export const defaultStatusRules: StatusRuleSet = {
  statementUrgentDays: 3,
  dueUrgentDays: 3,
  thresholdLevel: 0.9,
};

// ---------------------------------------------------------------------------
// CalendarDay primitives
// ---------------------------------------------------------------------------

export function calendarDay(year: number, month: number, day: number): CalendarDay {
  if (month < 1 || month > 12) throw new RangeError(`month must be 1...12, got ${month}`);
  if (day < 1) throw new RangeError(`day must be >= 1, got ${day}`);
  return { year, month, day };
}

/** Parse YYYY-MM-DD. */
export function parseISODate(iso: string): CalendarDay {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`invalid ISO date: ${iso}`);
  return calendarDay(Number(m[1]), Number(m[2]), Number(m[3]));
}

export function toISODate(d: CalendarDay): string {
  const y = String(d.year).padStart(4, "0");
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in the day's month, honoring leap years. */
export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      throw new RangeError(`month must be 1...12, got ${month}`);
  }
}

/** Clamps a hypothetical day-of-month into this month (e.g. 31 → Feb 28). */
export function clampDayOfMonth(year: number, month: number, requestedDay: number): CalendarDay {
  const maxDay = daysInMonth(year, month);
  return calendarDay(year, month, Math.min(Math.max(requestedDay, 1), maxDay));
}

function toUTC(d: CalendarDay): number {
  return Date.UTC(d.year, d.month - 1, d.day);
}

function fromUTC(ms: number): CalendarDay {
  const dt = new Date(ms);
  return calendarDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Adds whole calendar days. */
export function addDays(d: CalendarDay, days: number): CalendarDay {
  return fromUTC(toUTC(d) + days * 86_400_000);
}

/**
 * Adds calendar months, then clamps the day into the target month.
 * `addMonths({y:2024,m:1,d:31}, 1)` → `2024-02-29`.
 */
export function addMonths(d: CalendarDay, months: number): CalendarDay {
  const total = d.year * 12 + (d.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  // JS % can be negative
  const normalizedMonth = month < 1 ? month + 12 : month;
  const normalizedYear = month < 1 ? year - 1 : year;
  return clampDayOfMonth(normalizedYear, normalizedMonth, d.day);
}

export function compareDays(a: CalendarDay, b: CalendarDay): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return 0;
}

export function dayEquals(a: CalendarDay, b: CalendarDay): boolean {
  return compareDays(a, b) === 0;
}

export function dayBefore(a: CalendarDay, b: CalendarDay): boolean {
  return compareDays(a, b) < 0;
}

export function dayAfter(a: CalendarDay, b: CalendarDay): boolean {
  return compareDays(a, b) > 0;
}

export function onOrAfter(a: CalendarDay, b: CalendarDay): boolean {
  return compareDays(a, b) >= 0;
}

export function onOrBefore(a: CalendarDay, b: CalendarDay): boolean {
  return compareDays(a, b) <= 0;
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysUntil(from: CalendarDay, to: CalendarDay): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function todayInTimezone(timeZone: string, now: Date = new Date()): CalendarDay {
  // en-CA yields YYYY-MM-DD
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parseISODate(iso);
}

// ---------------------------------------------------------------------------
// Statement dates
// ---------------------------------------------------------------------------

/**
 * The statement close date on or after `day`.
 * If `day` *is* the statement day, that day is returned (statement closes today).
 */
export function nextStatementDate(day: CalendarDay, schedule: BillingSchedule): CalendarDay {
  const thisMonth = clampDayOfMonth(day.year, day.month, schedule.statementDay);
  if (onOrAfter(thisMonth, day)) return thisMonth;
  return clampDayOfMonthOf(addMonths(day, 1), schedule.statementDay);
}

/** The statement close date strictly before `day` (previous close). */
export function previousStatementDate(day: CalendarDay, schedule: BillingSchedule): CalendarDay {
  const thisMonth = clampDayOfMonth(day.year, day.month, schedule.statementDay);
  if (dayBefore(thisMonth, day)) return thisMonth;
  return clampDayOfMonthOf(addMonths(day, -1), schedule.statementDay);
}

function clampDayOfMonthOf(base: CalendarDay, requestedDay: number): CalendarDay {
  return clampDayOfMonth(base.year, base.month, requestedDay);
}

/**
 * Payment due date for the statement window that closes on `statementDate`.
 *
 * - If `dueDay` falls on or after `statementDate` in that month, due date is that month.
 * - Otherwise due date is the following month (e.g. statement Jan 25, due day 5 → Feb 5).
 * - Day-of-month values 29–31 clamp to the target month's last day.
 */
export function dueDateForStatement(statementDate: CalendarDay, schedule: BillingSchedule): CalendarDay {
  const sameMonth = clampDayOfMonth(statementDate.year, statementDate.month, schedule.dueDay);
  if (sameMonth.day >= statementDate.day && onOrAfter(sameMonth, statementDate)) {
    return sameMonth;
  }
  if (dayBefore(sameMonth, statementDate)) {
    return clampDayOfMonthOf(addMonths(statementDate, 1), schedule.dueDay);
  }
  return sameMonth;
}

// ---------------------------------------------------------------------------
// Cycle snapshot
// ---------------------------------------------------------------------------

export interface BillingCycleSnapshot {
  currentCycleStart: CalendarDay;
  currentCycleEnd: CalendarDay;
  nextStatementDate: CalendarDay;
  nextDueDate: CalendarDay;
  daysUntilStatement: number;
  daysUntilDue: number;
  /** 0...1 */
  cycleProgress: number;
  today: CalendarDay;
}

/**
 * Full billing-cycle snapshot for `today`.
 * Cycle start = day after previous statement; cycle end = next statement (inclusive).
 * Due date = earliest due date on or after today.
 */
export function cycleSnapshot(today: CalendarDay, schedule: BillingSchedule): BillingCycleSnapshot {
  const nextStatement = nextStatementDate(today, schedule);
  const previousStatement = previousStatementDate(today, schedule);

  const cycleStart = addDays(previousStatement, 1);
  const cycleEnd = nextStatement;

  const previousDue = dueDateForStatement(previousStatement, schedule);
  const upcomingDue = dueDateForStatement(nextStatement, schedule);
  const due = onOrAfter(previousDue, today) ? previousDue : upcomingDue;

  return {
    currentCycleStart: cycleStart,
    currentCycleEnd: cycleEnd,
    nextStatementDate: nextStatement,
    nextDueDate: due,
    daysUntilStatement: daysUntil(today, nextStatement),
    daysUntilDue: daysUntil(today, due),
    cycleProgress: cycleProgress(today, cycleStart, cycleEnd),
    today,
  };
}

/** Progress through the cycle in `0...1`. Inclusive of both endpoints. */
export function cycleProgress(today: CalendarDay, start: CalendarDay, end: CalendarDay): number {
  const total = daysUntil(start, end);
  if (total <= 0) return 1;
  const elapsed = daysUntil(start, today);
  const clamped = Math.min(Math.max(elapsed, 0), total);
  return clamped / total;
}

// ---------------------------------------------------------------------------
// Spending
// ---------------------------------------------------------------------------

/**
 * Whether a transaction falls inside `[start, end]` inclusive.
 * Day before statement → that cycle. On statement date → that cycle.
 * Day after statement → next cycle.
 */
export function transactionBelongsToCycle(
  transaction: CycleTransaction,
  start: CalendarDay,
  end: CalendarDay
): boolean {
  return onOrAfter(transaction.transactionDate, start) && onOrBefore(transaction.transactionDate, end);
}

/** Filters transactions into the cycle window and sums their amounts. */
export function cycleSpending(
  transactions: CycleTransaction[],
  cycleStart: CalendarDay,
  cycleEnd: CalendarDay
): number {
  return transactions
    .filter((t) => transactionBelongsToCycle(t, cycleStart, cycleEnd))
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface SpendingSnapshot {
  currentCycleSpending: number;
  personalCycleLimit: number | null;
  personalLimitRemaining: number | null;
  /** 0..1 */
  personalLimitUtilization: number | null;
}

/**
 * Spending against the user-defined personal cycle limit (never "available credit").
 * remaining = max(0, limit - spent); utilization clamped to 0..1.
 */
export function spendingSnapshot(
  transactions: CycleTransaction[],
  today: CalendarDay,
  schedule: BillingSchedule,
  personalCycleLimit?: number | null
): SpendingSnapshot {
  const cycle = cycleSnapshot(today, schedule);
  const spending = cycleSpending(transactions, cycle.currentCycleStart, cycle.currentCycleEnd);

  if (personalCycleLimit != null && personalCycleLimit > 0) {
    return {
      currentCycleSpending: spending,
      personalCycleLimit,
      personalLimitRemaining: Math.max(0, personalCycleLimit - spending),
      personalLimitUtilization: Math.min(1, Math.max(0, spending / personalCycleLimit)),
    };
  }
  return {
    currentCycleSpending: spending,
    personalCycleLimit: personalCycleLimit ?? null,
    personalLimitRemaining: null,
    personalLimitUtilization: null,
  };
}

// ---------------------------------------------------------------------------
// Cutoff / calendar day classification
// ---------------------------------------------------------------------------

/**
 * Where a calendar day sits relative to **today's** statement cutoff.
 * Factual only — the UI never tells the user whether to use the card.
 */
export type CutoffZone =
  /** Today through statement close — still open for this statement. */
  | "in-cutoff"
  /** Statement close date (last day charges land on this statement). */
  | "statement"
  /** Cycle start through yesterday — already on this statement. */
  | "already-on-statement"
  /** After today's statement close — charges start the next cycle. */
  | "next-cycle"
  /** Before today's cycle start — prior statement already closed. */
  | "prior-cycle";

export interface DayCutoffInfo {
  day: CalendarDay;
  zone: CutoffZone;
  /**
   * True when a charge on this date would land on **today's** upcoming statement
   * (day is between today and the statement date, inclusive).
   */
  withinCutoff: boolean;
  isStatementDay: boolean;
  isDueDay: boolean;
  isToday: boolean;
  /** Today's current cycle (start/end inclusive). */
  cycleStart: CalendarDay;
  cycleEnd: CalendarDay;
}

/**
 * Classify one date against the card's schedule as of `today`.
 *
 * Zones use today's billing snapshot so the calendar answers:
 * "Is this date still before the cutoff I'm waiting on?"
 */
export function dayCutoffInfo(
  day: CalendarDay,
  schedule: BillingSchedule,
  today: CalendarDay
): DayCutoffInfo {
  const snap = cycleSnapshot(today, schedule);
  const cycleStart = snap.currentCycleStart;
  const cycleEnd = snap.currentCycleEnd;

  const isToday = dayEquals(day, today);
  const isStatementDay = dayEquals(day, cycleEnd);

  const dueToday = snap.nextDueDate;
  const dueForCycle = dueDateForStatement(cycleEnd, schedule);
  const isDueDay = dayEquals(day, dueToday) || dayEquals(day, dueForCycle);

  // Open for this statement = from today through the statement close (inclusive).
  const withinCutoff = onOrAfter(day, today) && onOrBefore(day, cycleEnd);

  let zone: CutoffZone;
  if (isStatementDay) {
    zone = "statement";
  } else if (onOrAfter(day, today) && dayBefore(day, cycleEnd)) {
    zone = "in-cutoff";
  } else if (dayAfter(day, cycleEnd)) {
    zone = "next-cycle";
  } else if (onOrAfter(day, cycleStart) && dayBefore(day, today)) {
    zone = "already-on-statement";
  } else {
    zone = "prior-cycle";
  }

  return {
    day,
    zone,
    withinCutoff,
    isStatementDay,
    isDueDay,
    isToday,
    cycleStart,
    cycleEnd,
  };
}

/**
 * Factual spend-window summary for a selected day.
 * Never says "you can/cannot use the card" — only cutoff + personal budget facts.
 */
export interface SpendWindowFacts {
  day: CalendarDay;
  zone: CutoffZone;
  withinCutoff: boolean;
  verdict: SpendDayVerdict;
  /** "Still within cutoff — lands on the Oct 5 statement" | "After cutoff…" */
  cutoffLabel: string;
  personalCycleLimit: number | null;
  personalLimitRemaining: number | null;
  personalLimitUtilization: number | null;
  /** True when the personal cycle limit is already reached (as of `today`). */
  limitReached: boolean;
  /** "₱8,550 remaining in personal cycle limit" | "Personal cycle limit reached" */
  budgetLabel: string;
  isStatementDay: boolean;
  isDueDay: boolean;
  isToday: boolean;
}

/**
 * One-glance spend-day verdict combining cutoff dates + personal limit.
 * Drives calendar color: green = open, amber/red = limit risk, hatch = outside cycle.
 */
export type SpendDayVerdict =
  /** Within cutoff and under the personal cycle limit. */
  | "ok"
  /** Within cutoff but ≥ 90% of personal cycle limit used. */
  | "near-limit"
  /** Within cutoff but personal cycle limit already reached. */
  | "limit-reached"
  /** After statement cutoff — charge lands on the next cycle. */
  | "outside-cycle";

export function spendDayVerdict(
  day: CalendarDay,
  schedule: BillingSchedule,
  today: CalendarDay,
  transactions: CycleTransaction[],
  personalCycleLimit?: number | null,
  nearLimitThreshold = 0.9
): SpendDayVerdict {
  const info = dayCutoffInfo(day, schedule, today);
  if (!info.withinCutoff) return "outside-cycle";

  const spending = spendingSnapshot(transactions, today, schedule, personalCycleLimit ?? null);
  const util = spending.personalLimitUtilization;
  if (util != null && util >= 1) return "limit-reached";
  if (util != null && util >= nearLimitThreshold) return "near-limit";
  return "ok";
}

export function spendWindowFacts(
  day: CalendarDay,
  schedule: BillingSchedule,
  today: CalendarDay,
  transactions: CycleTransaction[],
  personalCycleLimit?: number | null
): SpendWindowFacts {
  const info = dayCutoffInfo(day, schedule, today);
  const spending = spendingSnapshot(transactions, today, schedule, personalCycleLimit ?? null);
  const limit = spending.personalCycleLimit;
  const remaining = spending.personalLimitRemaining;
  const util = spending.personalLimitUtilization;

  // Cutoff label uses the statement that closes on this day's cycle end.
  const statementIso = toISODate(info.cycleEnd);
  const stmtDate = parseISODate(statementIso);
  const monthShort = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(stmtDate.year, stmtDate.month - 1, stmtDate.day)));

  let cutoffLabel: string;
  if (info.isStatementDay) {
    cutoffLabel = `Statement closes ${monthShort}`;
  } else if (info.withinCutoff) {
    cutoffLabel = `Still within cutoff — lands on the ${monthShort} statement`;
  } else if (info.zone === "already-on-statement") {
    cutoffLabel = `Already on the ${monthShort} statement`;
  } else if (info.zone === "prior-cycle") {
    cutoffLabel = `Prior cycle — closed before ${monthShort}`;
  } else {
    cutoffLabel = `After cutoff — starts the next cycle`;
  }

  const limitReached = limit != null && limit > 0 && util != null && util >= 1;

  let budgetLabel: string;
  if (limit == null || limit <= 0) {
    budgetLabel = "No personal cycle limit set";
  } else if (limitReached) {
    budgetLabel = "Personal cycle limit reached";
  } else if (remaining != null) {
    budgetLabel = `${formatMoneyPlain(remaining)} remaining in personal cycle limit`;
  } else {
    budgetLabel = "Personal cycle limit set";
  }

  return {
    day: info.day,
    zone: info.zone,
    withinCutoff: info.withinCutoff,
    verdict: spendDayVerdict(day, schedule, today, transactions, personalCycleLimit ?? null),
    cutoffLabel,
    personalCycleLimit: limit,
    personalLimitRemaining: remaining,
    personalLimitUtilization: util,
    limitReached,
    budgetLabel,
    isStatementDay: info.isStatementDay,
    isDueDay: info.isDueDay,
    isToday: info.isToday,
  };
}

function formatMoneyPlain(amount: number, currency = "PHP", locale = "en-PH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Status (derived, UI-agnostic)
// ---------------------------------------------------------------------------

/**
 * Semantic status. Priority: complete → threshold → attention → upcoming → neutral.
 * Text + icon always accompany this in the UI — never color alone.
 */
export function cardStatus(
  snapshot: BillingCycleSnapshot,
  spending: SpendingSnapshot,
  rules: StatusRuleSet = defaultStatusRules
): CardStatus {
  const util = spending.personalLimitUtilization;
  if (util != null && util >= 1) return "complete";
  if (util != null && util >= rules.thresholdLevel) return "threshold";
  if (snapshot.daysUntilDue >= 0 && snapshot.daysUntilDue <= rules.dueUrgentDays) return "attention";
  if (snapshot.daysUntilStatement <= rules.statementUrgentDays) return "upcoming";
  return "neutral";
}
