import type { CardCycleView } from "@/lib/types";
import {
  countdownCopy,
  formatDateShort,
  formatMoney,
  formatPercent,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusChip } from "@/components/ui/status";

/**
 * Compact card summary — issuer, nickname, cycle, spending, status.
 * Dense enough for mobile lists; scales to two-column desktop.
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

  const progressTone =
    status === "complete"
      ? "complete"
      : status === "threshold"
        ? "threshold"
        : status === "attention"
          ? "attention"
          : "accent";

  const body = (
    <article className="surface flex flex-col gap-3 p-4 sm:p-5">
      {/* Row 1: name + status */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold leading-tight text-ink sm:text-[17px]">
            {card.nickname}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-secondary">
            {card.issuer} · •••• {card.lastFourDigits}
          </p>
        </div>
        <StatusChip
          status={status}
          overrideLabel={
            status === "upcoming"
              ? countdownCopy(cycle.daysUntilStatement, "Statement")
              : status === "attention"
                ? countdownCopy(cycle.daysUntilDue, "Due")
                : undefined
          }
        />
      </div>

      {/* Row 2: spend + progress */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="tabular text-[22px] font-semibold leading-none text-ink sm:text-[24px]">
            {formatMoney(spending.currentCycleSpending, currency)}
          </p>
          <p className="truncate text-[12px] text-ink-secondary">
            of{" "}
            <span className="tabular">
              {card.personalCycleLimit != null
                ? formatMoney(card.personalCycleLimit, currency)
                : "no limit"}
            </span>
          </p>
        </div>
        <div className="mt-2">
          <Progress
            value={util}
            tone={progressTone}
            label={`${formatPercent(util)} of personal cycle limit`}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="truncate text-[12px] text-ink-secondary">
            {remaining != null ? (
              <span className="tabular">{formatMoney(remaining, currency)} left</span>
            ) : (
              "No personal cycle limit"
            )}
          </p>
          <p className="tabular shrink-0 text-[11px] text-ink-tertiary">
            {formatPercent(util)}
          </p>
        </div>
      </div>

      {/* Row 3: timeline chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-divider pt-2.5">
        <Badge tone="neutral">
          <span className="tabular">
            {formatDateShort(cycle.currentCycleStart)} – {formatDateShort(cycle.currentCycleEnd)}
          </span>
        </Badge>
        <Badge tone="accent">{countdownCopy(cycle.daysUntilDue, "Due")}</Badge>
      </div>

      {actions ? (
        <div className="flex items-center justify-end gap-1">{actions}</div>
      ) : null}
    </article>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-lg transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {body}
      </a>
    );
  }
  return body;
}
