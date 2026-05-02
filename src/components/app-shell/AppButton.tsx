import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppButtonVariant = "primary" | "secondary" | "ghost";
type AppButtonSize = "sm" | "md" | "lg" | "icon";

export function appButtonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200",
    "disabled:cursor-not-allowed disabled:opacity-55",
    variant === "primary" && "bg-primary text-bg hover:bg-primary-hover",
    variant === "secondary" && "bg-bg text-text hover:bg-surface-hover",
    variant === "ghost" && "bg-surface text-text hover:bg-surface-hover",
    size === "sm" && "min-h-9 px-3.5 py-2 text-xs",
    size === "md" && "min-h-10 px-4 py-2.5 text-sm",
    size === "lg" && "min-h-11 px-5 py-3 text-sm",
    size === "icon" && "h-10 w-10 p-0",
    fullWidth && "w-full",
    className,
  );
}

export function AppButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={appButtonStyles({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}
