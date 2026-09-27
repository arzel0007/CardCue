import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "upcoming" | "attention" | "threshold" | "complete" | "critical" | "accent";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-surface-muted text-status-neutral border-divider",
  upcoming: "bg-surface-muted text-status-upcoming border-divider",
  attention: "bg-surface-muted text-status-attention border-divider",
  threshold: "bg-surface-muted text-status-threshold border-divider",
  complete: "bg-surface-muted text-status-complete border-divider",
  critical: "bg-surface-muted text-status-critical border-divider",
  accent: "bg-accent-soft text-accent border-transparent",
};

/**
 * Status chip — always pair with text + icon. Never color alone.
 */
export function Badge({
  tone = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[11px] font-medium tracking-wide",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
