import * as React from "react";
import { Button } from "./button";

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="surface flex w-full max-w-full flex-col items-center justify-center px-5 py-12 text-center sm:px-6 sm:py-16">
      <div
        aria-hidden="true"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent"
      >
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h3 className="text-[18px] font-semibold text-ink sm:text-[20px]">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-secondary sm:text-[15px]">{body}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="surface flex items-center justify-center gap-3 px-6 py-16"
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-divider border-t-accent"
      />
      <span className="text-[15px] text-ink-secondary">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body = "We couldn’t load this right now. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="surface flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-status-critical"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
      </div>
      <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] text-ink-secondary">{body}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
