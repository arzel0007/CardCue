"use client";

import * as React from "react";
import type {
  BillingSchedule,
  CalendarDay,
  CycleTransaction,
  SpendDayVerdict,
  SpendWindowFacts,
} from "@/lib/billingCycle";
import {
  addDays,
  calendarDay,
  dayCutoffInfo,
  dayEquals,
  spendDayVerdict,
  spendWindowFacts,
  toISODate,
} from "@/lib/billingCycle";
import { formatDateShort, formatMoney, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const VERDICT_META: Record<
  SpendDayVerdict,
  {
    title: string;
    short: string;
    legend: string;
    cellClass: string;
    bannerClass: string;
    mark: string;
    chip: "accent" | "threshold" | "complete" | "neutral";
  }
> = {
  ok: {
    title: "OK to spend",
    short: "OK",
    legend: "OK to spend — still in this cycle",
    cellClass: "spend-ok",
    bannerClass: "spend-banner-ok",
    mark: "✓",
    chip: "accent",
  },
  "near-limit": {
    title: "Near personal limit",
    short: "Near limit",
    legend: "Near personal cycle limit — check budget",
    cellClass: "spend-near-limit",
    bannerClass: "spend-banner-risk",
    mark: "~",
    chip: "threshold",
  },
  "limit-reached": {
    title: "Personal cycle limit reached",
    short: "Limit hit",
    legend: "Limit reached this cycle",
    cellClass: "spend-limit-reached",
    bannerClass: "spend-banner-risk",
    mark: "!",
    chip: "complete",
  },
  "outside-cycle": {
    title: "Outside this cycle",
    short: "Next cycle",
    legend: "Outside this cycle — goes on the next statement",
    cellClass: "spend-outside",
    bannerClass: "spend-banner-outside",
    mark: "»",
    chip: "neutral",
  },
};

function startOfMonthGrid(year: number, month: number): CalendarDay {
  const first = calendarDay(year, month, 1);
  const jsDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const monFirst = (jsDow + 6) % 7;
  return addDays(first, -monFirst);
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function CycleCalendar({
  schedule,
  today,
  transactions,
  personalCycleLimit,
  currency = "PHP",
  cardLabel,
}: {
  schedule: BillingSchedule;
  today: CalendarDay;
  transactions: CycleTransaction[];
  personalCycleLimit?: number | null;
  currency?: string;
  cardLabel: string;
}) {
  const [cursor, setCursor] = React.useState(() => ({
    year: today.year,
    month: today.month,
  }));
  const [selected, setSelected] = React.useState<CalendarDay>(today);

  const days = React.useMemo(() => {
    const start = startOfMonthGrid(cursor.year, cursor.month);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor.year, cursor.month]);

  const selectedFacts = React.useMemo(
    () =>
      spendWindowFacts(selected, schedule, today, transactions, personalCycleLimit ?? null),
    [selected, schedule, today, transactions, personalCycleLimit]
  );

  const openDaysLeft = React.useMemo(() => {
    let n = 0;
    let d = today;
    for (let i = 0; i < 40; i++) {
      const info = dayCutoffInfo(d, schedule, today);
      if (!info.withinCutoff) break;
      n += 1;
      if (info.isStatementDay) break;
      d = addDays(d, 1);
    }
    return n;
  }, [schedule, today]);

  function shiftMonth(delta: number) {
    let month = cursor.month + delta;
    let year = cursor.year;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    while (month > 12) {
      month -= 12;
      year += 1;
    }
    setCursor({ year, month });
  }

  return (
    <div className="space-y-5">
      <SpendWindowBanner
        facts={selectedFacts}
        openDaysLeft={openDaysLeft}
        currency={currency}
      />

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="surface overflow-hidden" aria-label="Spend window calendar">
          <div className="border-b border-divider p-5 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="caption">Spend window</p>
                <h2 className="mt-1 text-[22px] font-semibold text-ink">
                  {monthLabel(cursor.year, cursor.month)}
                </h2>
                <p className="mt-1 text-[13px] text-ink-secondary">{cardLabel}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCursor({ year: today.year, month: today.month });
                    setSelected(today);
                  }}
                >
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={() => shiftMonth(1)} aria-label="Next month">
                  →
                </Button>
              </div>
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {(Object.keys(VERDICT_META) as SpendDayVerdict[]).map((key) => (
                <li key={key} className="flex items-center gap-2.5 text-[12px] text-ink-secondary">
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 text-[12px] font-bold ${VERDICT_META[key].cellClass}`}
                  >
                    {VERDICT_META[key].mark}
                  </span>
                  <span>{VERDICT_META[key].legend}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 pt-3">
            <div role="grid" aria-label="Month grid" className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  role="columnheader"
                  className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary"
                >
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const info = dayCutoffInfo(day, schedule, today);
                const verdict = spendDayVerdict(
                  day,
                  schedule,
                  today,
                  transactions,
                  personalCycleLimit ?? null
                );
                const outsideMonth = day.month !== cursor.month;
                const isSelected = dayEquals(day, selected);
                const meta = VERDICT_META[verdict];
                return (
                  <button
                    key={toISODate(day)}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={`${toISODate(day)}, ${meta.title}${info.isToday ? ", today" : ""}${info.isStatementDay ? ", statement cutoff" : ""}${info.isDueDay ? ", payment due" : ""}`}
                    onClick={() => setSelected(day)}
                    className={[
                      "relative min-h-[72px] rounded-xl border-2 p-2 text-left",
                      "transition-transform hover:scale-[1.03]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      outsideMonth ? "opacity-30" : "",
                      isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "",
                      meta.cellClass,
                    ].join(" ")}
                  >
                    <span className="flex items-start justify-between gap-1">
                      <span className="text-[15px] font-semibold tabular leading-none">
                        {day.day}
                      </span>
                      {info.isToday ? (
                        <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase text-bg">
                          Today
                        </span>
                      ) : null}
                    </span>

                    <span className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide leading-tight">
                      <span aria-hidden="true">{meta.mark}</span>
                      {meta.short}
                    </span>

                    {(info.isStatementDay || info.isDueDay) && (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {info.isStatementDay ? (
                          <span className="rounded bg-ink px-1 py-0.5 text-[8px] font-bold uppercase text-bg">
                            Cutoff
                          </span>
                        ) : null}
                        {info.isDueDay ? (
                          <span className="rounded bg-status-attention px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                            Due
                          </span>
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <DayDetail facts={selectedFacts} currency={currency} />
      </div>
    </div>
  );
}

function SpendWindowBanner({
  facts,
  openDaysLeft,
  currency,
}: {
  facts: SpendWindowFacts;
  openDaysLeft: number;
  currency: string;
}) {
  const meta = VERDICT_META[facts.verdict];

  const headline =
    facts.verdict === "ok"
      ? "These dates are still OK to spend"
      : facts.verdict === "near-limit"
        ? "Still in cycle — near your personal limit"
        : facts.verdict === "limit-reached"
          ? "Still in cycle — personal limit reached"
          : "These dates are outside this cycle";

  const sub =
    facts.verdict === "outside-cycle"
      ? "A charge here lands on the next statement, not the one closing soon. You decide if that risk fits your plan."
      : openDaysLeft > 0
        ? `${openDaysLeft} day${openDaysLeft === 1 ? "" : "s"} left before the statement cutoff — ${
            facts.limitReached
              ? "personal limit is already reached."
              : facts.personalLimitRemaining != null
                ? `${formatMoney(facts.personalLimitRemaining, currency)} still left in your personal cycle limit.`
                : "no personal cycle limit set."
          }`
        : "Cutoff window is open until the statement date.";

  return (
    <div
      className={`rounded-2xl border-2 p-5 ${meta.bannerClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
            {formatDateShort(toISODate(facts.day))} · spend window
          </p>
          <h3 className="mt-1.5 text-[20px] font-semibold leading-snug text-ink">{headline}</h3>
          <p className="mt-1.5 text-[14px] text-ink-secondary">{sub}</p>
          <p className="mt-1 text-[13px] text-ink-tertiary">{facts.cutoffLabel}</p>
        </div>
        <div className="text-right">
          <p className="caption">Personal cycle budget</p>
          <p className="tabular mt-1 text-[22px] font-semibold text-ink">
            {facts.personalLimitRemaining != null
              ? formatMoney(facts.personalLimitRemaining, currency)
              : "—"}
          </p>
          <p className="text-[12px] text-ink-secondary">{facts.budgetLabel}</p>
        </div>
      </div>
    </div>
  );
}

function DayDetail({ facts, currency }: { facts: SpendWindowFacts; currency: string }) {
  const meta = VERDICT_META[facts.verdict];
  return (
    <aside className="surface flex flex-col gap-5 p-6" aria-live="polite">
      <div>
        <p className="caption">Selected day</p>
        <h2 className="mt-1 text-[24px] font-semibold text-ink">
          {formatDateShort(toISODate(facts.day))}
        </h2>
      </div>

      <div className={`rounded-xl border-2 p-4 ${meta.bannerClass}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
          Decision view
        </p>
        <p className="mt-1.5 text-[18px] font-semibold text-ink">{meta.title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
          {facts.withinCutoff
            ? "Still inside the current statement cutoff. Spending here stays on the upcoming statement."
            : "Outside the current cutoff. Spending here moves to the next statement cycle."}
        </p>
        {facts.limitReached ? (
          <p className="mt-2 text-[13px] font-medium text-ink">
            Personal cycle limit is already reached — more spending would go past the
            threshold you set.
          </p>
        ) : facts.verdict === "near-limit" ? (
          <p className="mt-2 text-[13px] font-medium text-ink">
            You&apos;re close to your personal cycle limit — remaining budget is below 10%.
          </p>
        ) : null}
      </div>

      <div>
        <p className="caption">Dates</p>
        <p className="mt-1.5 text-[14px] text-ink">{facts.cutoffLabel}</p>
      </div>

      <div>
        <p className="caption">Personal cycle limit</p>
        <p className="mt-1.5 text-[15px] font-medium text-ink">{facts.budgetLabel}</p>
        {facts.personalCycleLimit != null && facts.personalCycleLimit > 0 ? (
          <>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-divider">
              <div
                className={`h-full rounded-full ${
                  facts.limitReached
                    ? "bg-status-complete"
                    : (facts.personalLimitUtilization ?? 0) >= 0.9
                      ? "bg-status-threshold"
                      : "bg-accent"
                }`}
                style={{ width: `${Math.round((facts.personalLimitUtilization ?? 0) * 100)}%` }}
              />
            </div>
            <dl className="mt-3 space-y-1.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-secondary">Spent this cycle</dt>
                <dd className="tabular text-ink">
                  {formatMoney(
                    (facts.personalCycleLimit ?? 0) - (facts.personalLimitRemaining ?? 0),
                    currency
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-secondary">Personal cycle limit</dt>
                <dd className="tabular text-ink">
                  {formatMoney(facts.personalCycleLimit, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-secondary">Utilization</dt>
                <dd className="tabular text-ink">
                  {formatPercent(facts.personalLimitUtilization ?? 0)}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-ink-secondary">
            Set a Personal Cycle Limit on the card to overlay budget risk on the calendar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {facts.isStatementDay ? <Badge tone="upcoming">Statement cutoff</Badge> : null}
        {facts.isDueDay ? <Badge tone="attention">Payment due</Badge> : null}
        <Badge tone={meta.chip}>{meta.short}</Badge>
      </div>
    </aside>
  );
}
