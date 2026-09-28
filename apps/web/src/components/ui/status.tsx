import type { CardStatus } from "@/lib/types";
import { Badge } from "./badge";

export const statusMeta: Record<
  CardStatus,
  { label: string; tone: "neutral" | "upcoming" | "attention" | "threshold" | "complete"; icon: React.ReactNode }
> = {
  neutral: {
    label: "Current cycle",
    tone: "neutral",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  upcoming: {
    label: "Statement approaching",
    tone: "upcoming",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 3.5V6l1.75 1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  attention: {
    label: "Payment approaching",
    tone: "attention",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M6 1.75 10.5 9.5h-9L6 1.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6 5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="6" cy="8.4" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  threshold: {
    label: "Limit utilization high",
    tone: "threshold",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 9.5 5 5.5l2 2 3-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  complete: {
    label: "Cycle limit reached",
    tone: "complete",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="m4 6.1 1.4 1.4L8.1 4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export function StatusChip({
  status,
  overrideLabel,
  onBrand = false,
}: {
  status: CardStatus;
  overrideLabel?: string;
  /** Frosted pill for issuer-colored card surfaces */
  onBrand?: boolean;
}) {
  const meta = statusMeta[status];
  if (onBrand) {
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1",
          "bg-white/15 text-[11px] font-medium tracking-wide text-white",
          "backdrop-blur-sm",
        ].join(" ")}
      >
        <span aria-hidden="true" className="shrink-0">
          {meta.icon}
        </span>
        {overrideLabel ?? meta.label}
      </span>
    );
  }
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden="true" className="shrink-0">
        {meta.icon}
      </span>
      {overrideLabel ?? meta.label}
    </Badge>
  );
}
