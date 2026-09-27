"use client";

import * as React from "react";

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        "border transition-colors duration-200",
        "disabled:opacity-50",
        checked ? "bg-accent border-accent" : "bg-surface-muted border-divider",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          "transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[15px] font-medium text-ink">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-[13px] text-ink-secondary">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
