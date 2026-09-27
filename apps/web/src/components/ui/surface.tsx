import * as React from "react";

export function Surface({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["surface", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[20px] font-semibold leading-tight text-ink">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-ink-secondary">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
