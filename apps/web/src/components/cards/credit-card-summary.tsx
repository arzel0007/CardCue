import type { CardCycleView } from "@/lib/types";
import {
  countdownCopy,
  formatDateShort,
  formatMoney,
  formatPercent,
} from "@/lib/format";
import { issuerTheme } from "@/lib/issuer-theme";
import { StatusChip } from "@/components/ui/status";

/**
 * Brand-colored card summary — full issuer surface with contrast-aware type.
 * Color language only; not a replica of a bank payment card.
 */
export function CreditCardSummary({
  view,
  currency = "PHP",
  href,
  actions,
}: {
  view: CardCycleView;
  currency?: string;
  href?: string;
  actions?: React.ReactNode;
}) {
  const { card, cycle, spending, status } = view;
  const remaining = spending.personalLimitRemaining;
  const util = spending.personalLimitUtilization ?? 0;
  const brand = issuerTheme(card.issuer, card.nickname);
  const pct = Math.round(util * 100);

  const body = (
    <article
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:p-5"
      style={{
        background: brand.surfaceFrom,
        color: brand.onPrimary,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.16)",
      }}
    >
      {/* Flat solid brand surface — no rails or gradients */}

      {/* Header */}
      <div className="relative flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: brand.onSurfaceMuted }}
          >
            {card.issuer}
          </p>
          <h3 className="mt-1 truncate text-[18px] font-semibold leading-tight tracking-tight">
            {card.nickname}
          </h3>
          <p
            className="mt-1 tabular text-[13px] font-medium tracking-[0.12em]"
            style={{ color: brand.onSurfaceMuted }}
          >
            •••• {card.lastFourDigits}
          </p>
        </div>
        <StatusChip
          status={status}
          onBrand
          overrideLabel={
            status === "upcoming"
              ? countdownCopy(cycle.daysUntilStatement, "Statement")
              : status === "attention"
                ? countdownCopy(cycle.daysUntilDue, "Due")
                : undefined
          }
        />
      </div>

      {/* Amount block */}
      <div className="relative">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: brand.onSurfaceMuted }}
            >
              Cycle spend
            </p>
            <p className="mt-0.5 tabular text-[28px] font-semibold leading-none tracking-tight">
              {formatMoney(spending.currentCycleSpending, currency)}
            </p>
          </div>
          <p
            className="tabular text-[12px] font-medium"
            style={{ color: brand.onSurfaceMuted }}
          >
            of{" "}
            {card.personalCycleLimit != null
              ? formatMoney(card.personalCycleLimit, currency)
              : "no limit"}
          </p>
        </div>

        {/* Progress on brand surface */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% of personal cycle limit`}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: brand.onSurfaceTrack }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(100, pct)}%`,
              background:
                status === "complete" || status === "threshold"
                  ? brand.accent
                  : "rgba(255,255,255,0.92)",
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="tabular text-[12px]" style={{ color: brand.onSurfaceMuted }}>
            {remaining != null
              ? `${formatMoney(remaining, currency)} left`
              : "No personal cycle limit"}
          </p>
          <p className="tabular text-[12px] font-semibold">{pct}%</p>
        </div>
      </div>

      {/* Meta row */}
      <div
        className="relative flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2.5 text-[11px]"
        style={{
          borderColor: brand.onSurfaceTrack,
          color: brand.onSurfaceMuted,
        }}
      >
        <span className="tabular">
          {formatDateShort(cycle.currentCycleStart)} –{" "}
          {formatDateShort(cycle.currentCycleEnd)}
        </span>
        <span aria-hidden="true">·</span>
        <span className="font-medium" style={{ color: brand.onPrimary }}>
          {countdownCopy(cycle.daysUntilDue, "Due")}
        </span>
        <span aria-hidden="true">·</span>
        <span>Due {formatDateShort(cycle.nextDueDate)}</span>
      </div>

      {card.statementBalance != null && card.statementBalance > 0 ? (
        <div
          className="relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[12px]"
          style={{
            background: brand.onSurfaceTrack,
            color: brand.onPrimary,
          }}
        >
          <span style={{ color: brand.onSurfaceMuted }}>
            Outstanding statement balance
          </span>
          <span className="tabular font-semibold">
            {formatMoney(card.statementBalance, currency)}
          </span>
        </div>
      ) : null}

      {actions ? (
        <div className="relative flex items-center justify-end gap-1 pt-0.5 [&_button]:text-white/85 [&_button:hover]:bg-white/15 [&_button:hover]:text-white">
          {actions}
        </div>
      ) : null}
    </article>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {body}
      </a>
    );
  }
  return body;
}
