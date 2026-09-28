import * as React from "react";
import { formatNumberInput, parseNumberInput } from "@/lib/format";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="caption block text-ink-secondary">{children}</span>
      {hint ? (
        <span className="mt-0.5 block text-[11px] leading-snug text-ink-tertiary">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-snug text-ink-tertiary">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[12px] text-status-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Currency-aware number input with live commas (12000 → 12,000).
 * `value` is number | null; empty clears fully.
 */
export function NumberField({
  id,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  inputMode = "decimal",
  disabled,
  showCurrency = false,
}: {
  id: string;
  value: number | null;
  onChange: (n: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  disabled?: boolean;
  /** Prefix ₱ (or currency) inside the field */
  showCurrency?: boolean;
}) {
  const [text, setText] = React.useState(() => formatNumberInput(value == null ? "" : String(value)));
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) {
      setText(formatNumberInput(value == null ? "" : String(value)));
    }
  }, [value]);

  return (
    <div className="relative">
      {showCurrency ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-secondary"
        >
          ₱
        </span>
      ) : null}
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        disabled={disabled}
        placeholder={placeholder}
        className={["field tabular", showCurrency ? "pl-7" : ""].join(" ")}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setText(formatNumberInput(value == null ? "" : String(value)));
        }}
        onChange={(e) => {
          const next = formatNumberInput(e.target.value);
          setText(next);
          onChange(parseNumberInput(next));
        }}
      />
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["field", className].join(" ")} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={["field", className].join(" ")} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={["field h-auto min-h-[88px] py-2.5", className].join(" ")}
      {...props}
    />
  );
}
