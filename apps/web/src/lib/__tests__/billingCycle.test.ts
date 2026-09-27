import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  cardStatus,
  clampDayOfMonth,
  cycleProgress,
  cycleSnapshot,
  cycleSpending,
  dayCutoffInfo,
  daysInMonth,
  daysUntil,
  dueDateForStatement,
  nextStatementDate,
  parseISODate,
  previousStatementDate,
  spendDayVerdict,
  spendWindowFacts,
  spendingSnapshot,
  toISODate,
  transactionBelongsToCycle,
} from "../billingCycle";

const schedule = (statementDay: number, dueDay: number) => ({ statementDay, dueDay });

describe("daysInMonth / clamping", () => {
  it("handles 28/29 Feb and 30/31", () => {
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29); // leap
    expect(daysInMonth(2000, 2)).toBe(29); // 400-year leap
    expect(daysInMonth(1900, 2)).toBe(28); // 100-year non-leap
    expect(daysInMonth(2025, 4)).toBe(30);
    expect(daysInMonth(2025, 1)).toBe(31);
  });

  it("clamps day-of-month into target month", () => {
    expect(clampDayOfMonth(2025, 2, 31)).toEqual({ year: 2025, month: 2, day: 28 });
    expect(clampDayOfMonth(2024, 2, 31)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(clampDayOfMonth(2025, 4, 31)).toEqual({ year: 2025, month: 4, day: 30 });
    expect(clampDayOfMonth(2025, 1, 31)).toEqual({ year: 2025, month: 1, day: 31 });
    expect(clampDayOfMonth(2025, 1, 0)).toEqual({ year: 2025, month: 1, day: 1 });
  });
});

describe("addMonths / addDays", () => {
  it("clamps month-end when adding months", () => {
    expect(addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addMonths({ year: 2025, month: 1, day: 31 }, 1)).toEqual({ year: 2025, month: 2, day: 28 });
    expect(addMonths({ year: 2025, month: 3, day: 31 }, -1)).toEqual({ year: 2025, month: 2, day: 28 });
    expect(addMonths({ year: 2025, month: 12, day: 15 }, 1)).toEqual({ year: 2026, month: 1, day: 15 });
    expect(addMonths({ year: 2025, month: 1, day: 15 }, -1)).toEqual({ year: 2024, month: 12, day: 15 });
  });

  it("adds days across month/year boundaries", () => {
    expect(addDays({ year: 2025, month: 1, day: 31 }, 1)).toEqual({ year: 2025, month: 2, day: 1 });
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addDays({ year: 2025, month: 12, day: 31 }, 1)).toEqual({ year: 2026, month: 1, day: 1 });
    expect(addDays({ year: 2025, month: 1, day: 1 }, -1)).toEqual({ year: 2024, month: 12, day: 31 });
  });
});

describe("daysUntil", () => {
  it("counts whole days", () => {
    expect(daysUntil(parseISODate("2025-01-01"), parseISODate("2025-01-02"))).toBe(1);
    expect(daysUntil(parseISODate("2025-01-01"), parseISODate("2025-01-01"))).toBe(0);
    expect(daysUntil(parseISODate("2025-01-10"), parseISODate("2025-01-01"))).toBe(-9);
    expect(daysUntil(parseISODate("2025-02-27"), parseISODate("2025-03-01"))).toBe(2);
  });
});

describe("nextStatementDate / previousStatementDate", () => {
  const s = schedule(5, 25);

  it("returns today when today is the statement day", () => {
    const d = parseISODate("2025-01-05");
    expect(toISODate(nextStatementDate(d, s))).toBe("2025-01-05");
  });

  it("returns this month's statement when still ahead", () => {
    const d = parseISODate("2025-01-01");
    expect(toISODate(nextStatementDate(d, s))).toBe("2025-01-05");
  });

  it("rolls to next month when statement day has passed", () => {
    const d = parseISODate("2025-01-06");
    expect(toISODate(nextStatementDate(d, s))).toBe("2025-02-05");
  });

  it("previous statement is strictly before today", () => {
    expect(toISODate(previousStatementDate(parseISODate("2025-01-06"), s))).toBe("2025-01-05");
    expect(toISODate(previousStatementDate(parseISODate("2025-01-05"), s))).toBe("2024-12-05");
    expect(toISODate(previousStatementDate(parseISODate("2025-01-01"), s))).toBe("2024-12-05");
  });

  it("clamps statement day 31 in February", () => {
    const s31 = schedule(31, 15);
    expect(toISODate(nextStatementDate(parseISODate("2025-02-01"), s31))).toBe("2025-02-28");
    expect(toISODate(nextStatementDate(parseISODate("2024-02-01"), s31))).toBe("2024-02-29");
    expect(toISODate(nextStatementDate(parseISODate("2025-02-28"), s31))).toBe("2025-02-28");
  });
});

describe("dueDateForStatement", () => {
  it("keeps due date in the same month when due day is on/after statement day", () => {
    // statement Jan 5, due Jan 25
    expect(toISODate(dueDateForStatement(parseISODate("2025-01-05"), schedule(5, 25)))).toBe("2025-01-25");
  });

  it("rolls to next month when due day is before statement day", () => {
    // statement Jan 25, due day 5 → Feb 5
    expect(toISODate(dueDateForStatement(parseISODate("2025-01-25"), schedule(25, 5)))).toBe("2025-02-05");
  });

  it("clamps due day 31 into shorter months", () => {
    expect(toISODate(dueDateForStatement(parseISODate("2025-01-25"), schedule(25, 31)))).toBe("2025-01-31");
    // statement Jan 30, due day 31 → Jan 31 (same month, on/after)
    expect(toISODate(dueDateForStatement(parseISODate("2025-01-30"), schedule(30, 31)))).toBe("2025-01-31");
    // statement Feb 10, due day 31 → Feb 28 (clamped)
    expect(toISODate(dueDateForStatement(parseISODate("2025-02-10"), schedule(10, 31)))).toBe("2025-02-28");
  });

  it("handles statement Jan 31 with due day 30 rolling to next month", () => {
    // sameMonth = Jan 30 which is < Jan 31 → Feb 28 (due day 30 clamped in Feb 2025 is 28)
    // Actually due day 30 in Feb 2025 clamps to 28
    expect(toISODate(dueDateForStatement(parseISODate("2025-01-31"), schedule(31, 30)))).toBe("2025-02-28");
    expect(toISODate(dueDateForStatement(parseISODate("2024-01-31"), schedule(31, 30)))).toBe("2024-02-29");
  });
});

describe("cycleSnapshot", () => {
  const s = schedule(5, 25);

  it("cycle starts day after previous statement and ends at next statement", () => {
    const snap = cycleSnapshot(parseISODate("2025-01-15"), s);
    expect(toISODate(snap.currentCycleStart)).toBe("2025-01-06");
    expect(toISODate(snap.currentCycleEnd)).toBe("2025-02-05");
    expect(toISODate(snap.nextStatementDate)).toBe("2025-02-05");
    expect(snap.daysUntilStatement).toBe(21);
  });

  it("picks the earliest due date on or after today", () => {
    // On Jan 10: previous statement Jan 5 → due Jan 25 (on or after today)
    const snap = cycleSnapshot(parseISODate("2025-01-10"), s);
    expect(toISODate(snap.nextDueDate)).toBe("2025-01-25");
    expect(snap.daysUntilDue).toBe(15);
  });

  it("after due date passes, uses next cycle due date", () => {
    // On Jan 26: previousDue Jan 25 already past → upcoming due for Feb 5 statement = Feb 25
    const snap = cycleSnapshot(parseISODate("2025-01-26"), s);
    expect(toISODate(snap.nextDueDate)).toBe("2025-02-25");
    expect(snap.daysUntilDue).toBe(30);
  });

  it("progress is 0 at start and 1 at end", () => {
    const start = parseISODate("2025-01-06");
    const end = parseISODate("2025-02-05");
    expect(cycleProgress(start, start, end)).toBe(0);
    expect(cycleProgress(end, start, end)).toBe(1);
    const mid = parseISODate("2025-01-21");
    // 15 days elapsed of 30
    expect(cycleProgress(mid, start, end)).toBeCloseTo(0.5);
  });

  it("handles Feb clamping in cycle math", () => {
    // statementDay 31 clamps to Feb 28 in 2025; previous statement is Jan 31
    const snap = cycleSnapshot(parseISODate("2025-02-01"), schedule(31, 15));
    expect(toISODate(snap.currentCycleEnd)).toBe("2025-02-28");
    expect(toISODate(snap.currentCycleStart)).toBe("2025-02-01"); // day after Jan 31
  });
});

describe("cycleSpending", () => {
  const start = parseISODate("2025-01-06");
  const end = parseISODate("2025-02-05");

  it("includes transactions inside [start, end] inclusive", () => {
    const txs = [
      { transactionDate: parseISODate("2025-01-05"), amount: 100 }, // before
      { transactionDate: parseISODate("2025-01-06"), amount: 200 }, // start
      { transactionDate: parseISODate("2025-01-20"), amount: 300 }, // mid
      { transactionDate: parseISODate("2025-02-05"), amount: 400 }, // end
      { transactionDate: parseISODate("2025-02-06"), amount: 500 }, // after
    ];
    expect(cycleSpending(txs, start, end)).toBe(900);
    expect(transactionBelongsToCycle(txs[0], start, end)).toBe(false);
    expect(transactionBelongsToCycle(txs[1], start, end)).toBe(true);
    expect(transactionBelongsToCycle(txs[3], start, end)).toBe(true);
    expect(transactionBelongsToCycle(txs[4], start, end)).toBe(false);
  });
});

describe("spendingSnapshot", () => {
  const s = schedule(5, 25);
  const today = parseISODate("2025-01-15");

  it("computes remaining = max(0, limit - spent) and utilization", () => {
    const txs = [{ transactionDate: parseISODate("2025-01-10"), amount: 21_450 }];
    const snap = spendingSnapshot(txs, today, s, 30_000);
    expect(snap.currentCycleSpending).toBe(21_450);
    expect(snap.personalLimitRemaining).toBe(8_550);
    expect(snap.personalLimitUtilization).toBeCloseTo(21_450 / 30_000);
  });

  it("floors remaining at zero and clamps utilization to 1", () => {
    const txs = [{ transactionDate: parseISODate("2025-01-10"), amount: 50_000 }];
    const snap = spendingSnapshot(txs, today, s, 30_000);
    expect(snap.personalLimitRemaining).toBe(0);
    expect(snap.personalLimitUtilization).toBe(1);
  });

  it("returns nulls when no personal cycle limit is set", () => {
    const snap = spendingSnapshot([], today, s, null);
    expect(snap.personalLimitRemaining).toBeNull();
    expect(snap.personalLimitUtilization).toBeNull();
  });
});

describe("cardStatus", () => {
  const s = schedule(5, 25);
  const today = parseISODate("2025-01-15");
  const snap = cycleSnapshot(today, s);

  it("complete when utilization >= 1", () => {
    const spending = spendingSnapshot([{ transactionDate: today, amount: 30_000 }], today, s, 30_000);
    expect(cardStatus(snap, spending)).toBe("complete");
  });

  it("threshold when utilization >= 0.9", () => {
    const spending = spendingSnapshot([{ transactionDate: today, amount: 27_000 }], today, s, 30_000);
    expect(cardStatus(snap, spending)).toBe("threshold");
  });

  it("attention when due date is within 3 days", () => {
    // statement 5, due 25 → today Jan 22 is 3 days before due
    const t = parseISODate("2025-01-22");
    const snap2 = cycleSnapshot(t, s);
    const spending = spendingSnapshot([], t, s, 30_000);
    expect(snap2.daysUntilDue).toBe(3);
    expect(cardStatus(snap2, spending)).toBe("attention");
  });

  it("upcoming when statement is within 3 days", () => {
    const t = parseISODate("2025-01-03");
    const snap2 = cycleSnapshot(t, s);
    const spending = spendingSnapshot([], t, s, 30_000);
    expect(snap2.daysUntilStatement).toBe(2);
    expect(cardStatus(snap2, spending)).toBe("upcoming");
  });

  it("neutral mid-cycle", () => {
    const spending = spendingSnapshot([{ transactionDate: today, amount: 100 }], today, s, 30_000);
    expect(cardStatus(snap, spending)).toBe("neutral");
  });
});

describe("dayCutoffInfo (relative to today's cutoff)", () => {
  // Today Jan 20 → cycle Jan 6 – Feb 5, statement Feb 5
  const s = schedule(5, 25);
  const today = parseISODate("2025-01-20");

  it("marks today through statement as within cutoff", () => {
    const info = dayCutoffInfo(parseISODate("2025-01-20"), s, today);
    expect(info.zone).toBe("in-cutoff");
    expect(info.withinCutoff).toBe(true);
    expect(info.isToday).toBe(true);
  });

  it("marks future day before statement as in-cutoff", () => {
    const info = dayCutoffInfo(parseISODate("2025-02-01"), s, today);
    expect(info.zone).toBe("in-cutoff");
    expect(info.withinCutoff).toBe(true);
    expect(info.isStatementDay).toBe(false);
  });

  it("marks statement day (Feb 5)", () => {
    const info = dayCutoffInfo(parseISODate("2025-02-05"), s, today);
    expect(info.zone).toBe("statement");
    expect(info.isStatementDay).toBe(true);
    expect(info.withinCutoff).toBe(true);
  });

  it("marks day after statement as next cycle", () => {
    const info = dayCutoffInfo(parseISODate("2025-02-06"), s, today);
    expect(info.zone).toBe("next-cycle");
    expect(info.withinCutoff).toBe(false);
  });

  it("marks earlier days in the same cycle as already on this statement", () => {
    const info = dayCutoffInfo(parseISODate("2025-01-10"), s, today);
    expect(info.zone).toBe("already-on-statement");
    expect(info.withinCutoff).toBe(false);
  });

  it("flags due day", () => {
    const info = dayCutoffInfo(parseISODate("2025-01-25"), s, today);
    expect(info.isDueDay).toBe(true);
  });
});

describe("spendWindowFacts", () => {
  const s = schedule(5, 25);
  const today = parseISODate("2025-01-20");

  it("reports remaining personal cycle budget for a still-open date", () => {
    const facts = spendWindowFacts(
      parseISODate("2025-02-01"),
      s,
      today,
      [{ transactionDate: parseISODate("2025-01-10"), amount: 21_450 }],
      30_000
    );
    expect(facts.withinCutoff).toBe(true);
    expect(facts.limitReached).toBe(false);
    expect(facts.personalLimitRemaining).toBe(8_550);
    expect(facts.budgetLabel).toContain("8,550 remaining");
    expect(facts.cutoffLabel).toContain("Still within cutoff");
  });

  it("reports limit reached without judgment language", () => {
    const facts = spendWindowFacts(
      parseISODate("2025-02-01"),
      s,
      today,
      [{ transactionDate: parseISODate("2025-01-10"), amount: 30_000 }],
      30_000
    );
    expect(facts.limitReached).toBe(true);
    expect(facts.budgetLabel).toBe("Personal cycle limit reached");
  });

  it("labels post-cutoff days as after cutoff", () => {
    const facts = spendWindowFacts(parseISODate("2025-02-10"), s, today, [], 30_000);
    expect(facts.withinCutoff).toBe(false);
    expect(facts.cutoffLabel).toContain("After cutoff");
    expect(facts.verdict).toBe("outside-cycle");
  });
});

describe("spendDayVerdict", () => {
  const s = schedule(5, 25);
  const today = parseISODate("2025-01-20");

  it("ok when within cutoff and under limit", () => {
    expect(
      spendDayVerdict(
        parseISODate("2025-02-01"),
        s,
        today,
        [{ transactionDate: parseISODate("2025-01-10"), amount: 10_000 }],
        30_000
      )
    ).toBe("ok");
  });

  it("near-limit at 90%+ of personal limit", () => {
    expect(
      spendDayVerdict(
        parseISODate("2025-02-01"),
        s,
        today,
        [{ transactionDate: parseISODate("2025-01-10"), amount: 27_000 }],
        30_000
      )
    ).toBe("near-limit");
  });

  it("limit-reached at 100%", () => {
    expect(
      spendDayVerdict(
        parseISODate("2025-02-01"),
        s,
        today,
        [{ transactionDate: parseISODate("2025-01-10"), amount: 30_000 }],
        30_000
      )
    ).toBe("limit-reached");
  });

  it("outside-cycle after statement cutoff", () => {
    expect(spendDayVerdict(parseISODate("2025-02-06"), s, today, [], 30_000)).toBe(
      "outside-cycle"
    );
  });
});
