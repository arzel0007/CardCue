import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white border border-accent hover:opacity-90 active:opacity-80",
  secondary:
    "bg-accent-soft text-accent border border-transparent hover:opacity-85",
  ghost:
    "bg-transparent text-ink-secondary border border-transparent hover:bg-surface-muted hover:text-ink",
  destructive:
    "bg-status-critical text-white border border-status-critical hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[15px]",
  lg: "h-[50px] px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className = "", variant = "primary", size = "md", type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md font-medium",
          "transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      />
    );
  }
);
