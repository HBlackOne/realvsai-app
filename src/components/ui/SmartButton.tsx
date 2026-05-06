"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type SmartButtonProps = {
  label: string;
  confirmLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  successEventName?: string;
  resetEventName?: string;
  errorEventName?: string;
  variant?: ButtonVariant;
  requiresConfirm?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  error?: string | null;
  onClick: () => Promise<void> | void;
  onRetry?: () => void;
  /** When true, success state persists indefinitely — use for redirect flows */
  persistentSuccess?: boolean;
  /** When false, completing onClick returns the button to idle instead of showing green success. */
  successOnResolve?: boolean;
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

export function SmartButton({
  label,
  confirmLabel = "Are you sure? Tap again",
  loadingLabel = "Processing...",
  successLabel = "Done",
  errorLabel = "Something went wrong · Tap to retry",
  successEventName,
  resetEventName,
  errorEventName = "ls:checkout:error",
  variant = "primary",
  requiresConfirm = false,
  disabled = false,
  loading = false,
  className = "",
  error = null,
  onClick,
  onRetry,
  persistentSuccess = false,
  successOnResolve = true,
}: SmartButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
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

  const showSuccess = useCallback(() => {
    clearTimers();
    setState("success");
    setErrorMsg(null);
    if (!persistentSuccess) {
      timerRef.current = setTimeout(reset, 3000);
    }
  }, [persistentSuccess, reset]);

  const showError = useCallback((message: string) => {
    clearTimers();
    setErrorMsg(message);
    setErrorKey((key) => key + 1);
    setState("error");
  }, []);

  useEffect(() => {
    if (!error) return;
    setErrorKey((key) => key + 1);
  }, [error]);

  useEffect(() => {
    if (!successEventName && !resetEventName && !errorEventName) return;

    const isActiveCheckout = () => loading || state === "loading";
    const handleSuccess = () => {
      if (isActiveCheckout()) showSuccess();
    };
    const handleReset = () => {
      if (isActiveCheckout()) reset();
    };
    const handleError = (event: Event) => {
      if (!isActiveCheckout()) return;
      const message = event instanceof CustomEvent
        ? event.detail?.message ?? "Payment failed. Please try again."
        : "Payment failed. Please try again.";
      showError(message);
    };

    if (successEventName) window.addEventListener(successEventName, handleSuccess);
    if (resetEventName) window.addEventListener(resetEventName, handleReset);
    if (errorEventName) window.addEventListener(errorEventName, handleError);

    return () => {
      if (successEventName) window.removeEventListener(successEventName, handleSuccess);
      if (resetEventName) window.removeEventListener(resetEventName, handleReset);
      if (errorEventName) window.removeEventListener(errorEventName, handleError);
    };
  }, [errorEventName, loading, reset, resetEventName, showError, showSuccess, state, successEventName]);

  const handleClick = async () => {
    if (disabled || loading || state === "loading") return;

    if (state === "error" || error) {
      reset();
      onRetry?.();
      return;
    }

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
      if (!successEventName) {
        if (successOnResolve) {
          showSuccess();
        } else {
          reset();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showError(msg);
    }
  };

  useEffect(() => {
    if (state !== "error") return;
    const timer = setTimeout(reset, 4000);
    return () => clearTimeout(timer);
  }, [reset, state]);

  const isSuccessState = state === "success";
  const isErrorState = state === "error" || Boolean(error);
  const isLoading = !isSuccessState && !isErrorState && (loading || state === "loading");
  const isDisabled = disabled || isLoading || isSuccessState;

  let buttonClass = `inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-all duration-[80ms] active:scale-[0.97] active:opacity-85 active:shadow-[0_0_32px_var(--primary-glow)] cursor-pointer ${className}`;

  if (isErrorState) {
    buttonClass += " animate-[shake_400ms_ease-in-out] border border-danger bg-danger/20 text-danger";
  } else if (state === "idle" || state === "confirming") {
    buttonClass += ` ${VARIANT_STYLES[variant]}`;
  } else if (isSuccessState) {
    buttonClass += " bg-success text-bg cursor-not-allowed";
  } else if (isLoading) {
    buttonClass += ` opacity-70 cursor-not-allowed ${VARIANT_STYLES[variant]}`;
  }

  const displayLabel =
    isErrorState
      ? errorLabel
      : isSuccessState
        ? successLabel
        : isLoading
          ? loadingLabel
          : state === "confirming"
            ? confirmLabel
            : label;

  return (
    <div className="flex flex-col gap-1">
      <button
        key={errorKey}
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClass}
      >
        {isLoading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {displayLabel}
          </>
        ) : isSuccessState ? (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            {displayLabel}
          </>
        ) : (
          displayLabel
        )}
      </button>

    </div>
  );
}
