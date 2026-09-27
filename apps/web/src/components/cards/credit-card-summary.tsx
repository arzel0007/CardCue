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
 * Physical-card-inspired summary — not a fake payment card.
 * Issuer + nickname, last 4, cycle dates, countdown, spending progress, status.
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
  /** Row of card actions — rendered in the footer so nothing overlaps the status chip. */
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
    <article className="surface flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="caption">{card.issuer}</p>
          <h3 className="mt-1 text-[20px] font-semibold leading-tight text-ink">
            {card.nickname}
          </h3>
          <p className="mt-1 text-[13px] text-ink-secondary">
            •••• {card.lastFourDigits}
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

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="tabular text-[28px] font-semibold leading-none text-ink">
            {formatMoney(spending.currentCycleSpending, currency)}
          </p>
          <p className="text-[13px] text-ink-secondary">
            of{" "}
            <span className="tabular">
              {formatMoney(card.personalCycleLimit, currency)}
            </span>
          </p>
        </div>
        <div className="mt-3">
          <Progress
            value={util}
            tone={progressTone}
            label={`${formatPercent(util)} of personal cycle limit`}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-secondary">
            {remaining != null ? (
              <span className="tabular">{formatMoney(remaining, currency)} remaining</span>
            ) : (
              "No personal cycle limit set"
            )}
          </p>
          <p className="tabular text-[12px] text-ink-tertiary">
            {formatPercent(util)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-divider pt-4">
        <div>
          <p className="caption">Cycle</p>
          <p className="mt-1 text-[13px] text-ink">
            {formatDateShort(cycle.currentCycleStart)} –{" "}
            {formatDateShort(cycle.currentCycleEnd)}
          </p>
        </div>
        <div>
          <p className="caption">Statement</p>
          <p className="mt-1 text-[13px] text-ink">
            {formatDateShort(cycle.nextStatementDate)}
            <span className="text-ink-secondary">
              {" "}
              · {countdownCopy(cycle.daysUntilStatement, "Statement").replace(/^Statement /, "in ")}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          {countdownCopy(cycle.daysUntilDue, "Due")}
        </Badge>
        <span className="text-[12px] text-ink-tertiary">
          Due {formatDateShort(cycle.nextDueDate)}
        </span>
      </div>

      {actions ? (
        <div className="flex items-center justify-end gap-1 border-t border-divider pt-3">
          {actions}
        </div>
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
