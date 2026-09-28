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
  daysUntil,
  spendDayVerdict,
  spendWindowFacts,
  toISODate,
} from "@/lib/billingCycle";
import { formatDateShort, formatMoney, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const VERDICT: Record<
  SpendDayVerdict,
  { title: string; short: string; mark: string; cellClass: string; bannerClass: string }
> = {
  ok: {
    title: "OK to spend",
    short: "OK",
    mark: "✓",
    cellClass: "spend-ok",
    bannerClass: "spend-banner-ok",
  },
  "near-limit": {
    title: "Near personal limit",
    short: "Near",
    mark: "~",
    cellClass: "spend-near-limit",
    bannerClass: "spend-banner-risk",
  },
  "limit-reached": {
    title: "Limit reached",
    short: "Limit",
    mark: "!",
    cellClass: "spend-limit-reached",
    bannerClass: "spend-banner-risk",
  },
  "outside-cycle": {
    title: "Outside this cycle",
    short: "Next",
    mark: "»",
    cellClass: "spend-outside",
    bannerClass: "spend-banner-outside",
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
  const [cursor, setCursor] = React.useState({ year: today.year, month: today.month });
  const [selected, setSelected] = React.useState<CalendarDay>(today);
  const [slide, setSlide] = React.useState<"none" | "left" | "right">("none");
  const gridRef = React.useRef<HTMLDivElement>(null);

  const days = React.useMemo(() => {
    const start = startOfMonthGrid(cursor.year, cursor.month);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor.year, cursor.month]);

  const selectedFacts = React.useMemo(
    () => spendWindowFacts(selected, schedule, today, transactions, personalCycleLimit ?? null),
    [selected, schedule, today, transactions, personalCycleLimit]
  );

  const todayFacts = React.useMemo(
    () => spendWindowFacts(today, schedule, today, transactions, personalCycleLimit ?? null),
    [schedule, today, transactions, personalCycleLimit]
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

  const cycleStart = dayCutoffInfo(today, schedule, today).cycleStart;
  const cycleEnd = dayCutoffInfo(today, schedule, today).cycleEnd;
  const cycleLen = Math.max(1, daysUntil(cycleStart, cycleEnd));
  const cycleElapsed = Math.min(cycleLen, Math.max(0, daysUntil(cycleStart, today)));
  const cyclePct = Math.round((cycleElapsed / cycleLen) * 100);

  function shiftMonth(delta: number) {
    setSlide(delta > 0 ? "left" : "right");
    window.setTimeout(() => setSlide("none"), 220);
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

  function onGridKey(e: React.KeyboardEvent) {
    const map: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    const step = map[e.key];
    if (step == null) return;
    e.preventDefault();
    const next = addDays(selected, step);
    setSelected(next);
    if (next.month !== cursor.month) {
      setCursor({ year: next.year, month: next.month });
    }
  }

  return (
    <div className="space-y-4">
      {/* Hero: spend window + live stats */}
      <section
        className={`rounded-2xl border-2 p-4 sm:p-5 ${VERDICT[todayFacts.verdict].bannerClass}`}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
              Spend window · today
            </p>
            <h2 className="mt-1 text-[20px] font-semibold leading-snug text-ink sm:text-[24px]">
              {headlineFor(todayFacts, openDaysLeft, currency)}
            </h2>
            <p className="mt-1 text-[13px] text-ink-secondary">{cardLabel}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="caption">Days left</p>
            <p className="tabular text-[28px] font-semibold leading-none text-ink">
              {openDaysLeft}
            </p>
          </div>
        </div>

        {/* Cycle progress rail */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-ink-secondary">
            <span>{formatDateShort(toISODate(cycleStart))}</span>
            <span className="tabular font-medium text-ink">{cyclePct}%</span>
            <span>
              Cutoff {formatDateShort(toISODate(cycleEnd))}
            </span>
          </div>
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${cyclePct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink"
              style={{ left: `${cyclePct}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-secondary">
            <span>
              Budget{" "}
              <strong className="font-medium text-ink">
                {todayFacts.personalLimitRemaining != null
                  ? formatMoney(todayFacts.personalLimitRemaining, currency)
                  : "—"}
              </strong>{" "}
              left
            </span>
            {todayFacts.personalLimitUtilization != null ? (
              <span>
                Used{" "}
                <strong className="font-medium text-ink">
                  {formatPercent(todayFacts.personalLimitUtilization)}
                </strong>
              </span>
            ) : null}
            <span>
              Due{" "}
              <strong className="font-medium text-ink">
                {formatDateShort(toISODate(dayCutoffInfo(today, schedule, today).cycleEnd))}
              </strong>{" "}
              statement
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
        {/* Month grid */}
        <section className="surface overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-4 py-3">
            <div>
              <p className="caption">Calendar</p>
              <h3 className="text-[18px] font-semibold text-ink">
                {monthLabel(cursor.year, cursor.month)}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                ←
              </Button>
              <Button
                variant="secondary"
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
          </header>

          <div className="px-3 pb-3 pt-2">
            <div
              role="grid"
              aria-label="Month spend window"
              tabIndex={0}
              ref={gridRef}
              onKeyDown={onGridKey}
              className={`grid grid-cols-7 gap-1 transition-transform duration-200 ${
                slide === "left"
                  ? "-translate-x-1 opacity-60"
                  : slide === "right"
                    ? "translate-x-1 opacity-60"
                    : "translate-x-0 opacity-100"
              }`}
            >
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  role="columnheader"
                  className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary"
                >
                  {d.slice(0, 3)}
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
                const meta = VERDICT[verdict];
                return (
                  <button
                    key={toISODate(day)}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={`${toISODate(day)} ${meta.title}${info.isToday ? " today" : ""}${info.isStatementDay ? " statement cutoff" : ""}${info.isDueDay ? " payment due" : ""}`}
                    onClick={() => setSelected(day)}
                    className={[
                      "relative min-h-[52px] rounded-xl border p-1.5 text-left",
                      "transition-[transform,box-shadow] duration-150 hover:scale-[1.06]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      outsideMonth ? "opacity-25" : "",
                      isSelected
                        ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                        : "",
                      meta.cellClass,
                    ].join(" ")}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold tabular leading-none">
                        {day.day}
                      </span>
                      {info.isToday ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      ) : null}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-0.5">
                      <span className="text-[11px] font-bold leading-none" aria-hidden="true">
                        {meta.mark}
                      </span>
                      {info.isStatementDay ? (
                        <span className="rounded-full bg-ink px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-bg">
                          Cut
                        </span>
                      ) : null}
                      {info.isDueDay ? (
                        <span className="rounded-full bg-status-attention px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-white">
                          Due
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="flex flex-wrap gap-1.5 border-t border-divider px-4 py-3">
            {(Object.keys(VERDICT) as SpendDayVerdict[]).map((key) => (
              <li
                key={key}
                className="flex items-center gap-1.5 rounded-full border border-divider px-2 py-1 text-[11px] text-ink-secondary"
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${VERDICT[key].cellClass}`}
                  aria-hidden="true"
                >
                  {VERDICT[key].mark}
                </span>
                {VERDICT[key].short}
              </li>
            ))}
          </ul>
        </section>

        {/* Inspector */}
        <DayInspector
          facts={selectedFacts}
          currency={currency}
          isToday={dayEquals(selected, today)}
          onGoToday={() => {
            setSelected(today);
            setCursor({ year: today.year, month: today.month });
          }}
        />
      </div>
    </div>
  );
}

function headlineFor(facts: SpendWindowFacts, openDaysLeft: number, currency: string): string {
  if (facts.verdict === "limit-reached") return "Personal cycle limit reached";
  if (facts.verdict === "near-limit") return "Still in cycle — near your limit";
  if (facts.verdict === "outside-cycle") return "Outside this statement window";
  if (facts.personalLimitRemaining != null) {
    return `${formatMoney(facts.personalLimitRemaining, currency)} left · OK window open`;
  }
  return openDaysLeft > 0 ? "OK to spend in this cycle" : "Cutoff day";
}

function DayInspector({
  facts,
  currency,
  isToday,
  onGoToday,
}: {
  facts: SpendWindowFacts;
  currency: string;
  isToday: boolean;
  onGoToday: () => void;
}) {
  const meta = VERDICT[facts.verdict];
  return (
    <aside className={`flex flex-col gap-4 rounded-2xl border-2 p-4 sm:p-5 ${meta.bannerClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="caption">Selected day</p>
          <h3 className="mt-1 text-[22px] font-semibold leading-tight text-ink">
            {formatDateShort(toISODate(facts.day))}
          </h3>
        </div>
        {isToday ? (
          <Button variant="ghost" size="sm" onClick={onGoToday}>
            Today
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onGoToday}>
            Go to today
          </Button>
        )}
      </div>

      <div>
        <p className="text-[17px] font-semibold text-ink">{meta.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
          {facts.withinCutoff
            ? "A charge on this date lands on the upcoming statement."
            : facts.zone === "already-on-statement"
              ? "A charge on this date already belongs to the statement that is closing."
              : "A charge on this date moves to the next statement cycle."}
        </p>
      </div>

      <div className="rounded-xl border border-divider/60 bg-black/5 p-3">
        <p className="caption">Dates</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">{facts.cutoffLabel}</p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="caption">Personal cycle limit</p>
          {facts.personalLimitUtilization != null ? (
            <p className="tabular text-[12px] text-ink-secondary">
              {formatPercent(facts.personalLimitUtilization)}
            </p>
          ) : null}
        </div>
        <p className="mt-1 text-[14px] font-medium text-ink">{facts.budgetLabel}</p>
        {facts.personalCycleLimit != null && facts.personalCycleLimit > 0 ? (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  facts.limitReached
                    ? "bg-status-attention"
                    : (facts.personalLimitUtilization ?? 0) >= 0.9
                      ? "bg-status-threshold"
                      : "bg-accent"
                }`}
                style={{ width: `${Math.round((facts.personalLimitUtilization ?? 0) * 100)}%` }}
              />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <dt className="text-ink-secondary">Spent</dt>
                <dd className="tabular font-medium text-ink">
                  {formatMoney(
                    (facts.personalCycleLimit ?? 0) - (facts.personalLimitRemaining ?? 0),
                    currency
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-secondary">Limit</dt>
                <dd className="tabular font-medium text-ink">
                  {formatMoney(facts.personalCycleLimit, currency)}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mt-2 text-[12px] text-ink-secondary">
            Set a Personal Cycle Limit on the card to overlay budget risk here.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {facts.isStatementDay ? (
          <span className="rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-bg">
            Statement cutoff
          </span>
        ) : null}
        {facts.isDueDay ? (
          <span className="rounded-full bg-status-attention px-2 py-1 text-[11px] font-medium text-white">
            Payment due
          </span>
        ) : null}
        <span className="rounded-full border border-divider px-2 py-1 text-[11px] font-medium text-ink-secondary">
          {meta.short}
        </span>
      </div>
    </aside>
  );
}
