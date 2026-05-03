"use client";

import { useCallback, useRef, useState } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type SmartButtonProps = {
  label: string;
  confirmLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  variant?: ButtonVariant;
  requiresConfirm?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => Promise<void> | void;
};

type ButtonState = "idle" | "confirming" | "loading" | "success" | "error";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-bg hover:bg-primary-hover disabled:opacity-50",
  secondary:
    "bg-surface2 text-text border border-border hover:bg-surface-hover disabled:opacity-50",
  danger:
    "bg-danger text-white hover:bg-danger/90 disabled:opacity-50",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface2 disabled:opacity-50",
};

const CONFIRM_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-primary/60 text-bg",
  secondary: "bg-surface2 text-text border border-border",
  danger: "bg-danger/80 text-white",
  ghost: "bg-transparent text-text-muted border border-border",
};

export function SmartButton({
  label,
  confirmLabel = "Are you sure? Tap again",
  loadingLabel = "Processing...",
  successLabel = "Done",
  variant = "primary",
  requiresConfirm = false,
  disabled = false,
  className = "",
  onClick,
}: SmartButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  };

  const reset = useCallback(() => {
    clearTimers();
    setState("idle");
    setErrorMsg(null);
  }, []);

  const handleClick = async () => {
    if (disabled || state === "loading") return;

    if (requiresConfirm && state === "idle") {
      setState("confirming");
      confirmTimerRef.current = setTimeout(reset, 3000);
      return;
    }

    if (requiresConfirm && state !== "confirming") return;

    clearTimers();
    setState("loading");
    setErrorMsg(null);

    try {
      await onClick();
      setState("success");
      timerRef.current = setTimeout(reset, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMsg(msg);
      setState("error");
      timerRef.current = setTimeout(reset, 4000);
    }
  };

  const isDisabled = disabled || state === "loading";

  let buttonClass = `inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${className}`;

  if (state === "idle" || state === "confirming") {
    buttonClass += ` ${state === "confirming" ? CONFIRM_STYLES[variant] : VARIANT_STYLES[variant]}`;
  } else if (state === "loading") {
    buttonClass += ` opacity-70 cursor-not-allowed ${VARIANT_STYLES[variant]}`;
  } else if (state === "success") {
    buttonClass += " bg-success text-white cursor-not-allowed";
  } else if (state === "error") {
    buttonClass += " bg-danger text-white";
  }

  const displayLabel =
    state === "loading"
      ? loadingLabel
      : state === "confirming"
        ? confirmLabel
        : state === "success"
          ? successLabel
          : label;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClass}
      >
        {state === "loading" ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {displayLabel}
          </>
        ) : state === "success" ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 12l11-11" />
            </svg>
            {displayLabel}
          </>
        ) : (
          displayLabel
        )}
      </button>
      {state === "error" && errorMsg && (
        <p className="text-xs text-danger">{errorMsg}</p>
      )}
    </div>
  );
}
