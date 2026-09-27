import * as React from "react";

export function Progress({
  value,
  label,
  tone = "accent",
}: {
  /** 0..1 */
  value: number;
  label: string;
  tone?: "accent" | "attention" | "threshold" | "complete";
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const fillClass =
    tone === "accent"
      ? "bg-accent"
      : tone === "attention"
        ? "bg-status-attention"
        : tone === "threshold"
          ? "bg-status-threshold"
          : "bg-status-complete";

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="progress-track h-2 w-full"
    >
      <div
        className={["progress-fill h-full", fillClass].join(" ")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
