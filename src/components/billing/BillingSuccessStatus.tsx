"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";

export default function BillingSuccessStatus() {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setComplete(true);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="py-4 text-center">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        {!complete ? (
          <>
            <span className="absolute inset-0 rounded-full border-4 border-border/80" />
            <span className="success-ring-spin absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary" />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-primary">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </span>
          </>
        ) : (
          <div className="success-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-dim text-primary">
            <span className="absolute inset-0 rounded-full border border-primary/25" />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-6 w-6" />
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-text">
        {complete ? "Your purchase was completed successfully." : "Processing payment"}
      </p>
      <p className="mt-1.5 text-xs text-text-dim">
        {complete
          ? "Your balance and billing details were synced to your account."
          : "We’re confirming your order and preparing your account update."}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1.5 text-xs text-text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-success" /> LemonSqueezy payment confirmed
      </div>
    </div>
  );
}
