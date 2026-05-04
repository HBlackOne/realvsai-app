"use client";

import { useEffect, useState } from "react";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSuccess = () => {
      setLoading(false);
      setError(null);
    };

    const handleClosed = () => {
      setLoading(false);
    };

    window.addEventListener("ls:checkout:success", handleSuccess);
    window.addEventListener("ls:checkout:closed", handleClosed);

    return () => {
      window.removeEventListener("ls:checkout:success", handleSuccess);
      window.removeEventListener("ls:checkout:closed", handleClosed);
    };
  }, []);

  /**
   * Fetches a checkout URL and opens the LemonSqueezy overlay.
   * For anchor-tag-based buttons: prefer setting className="lemonsqueezy-button"
   * and href={checkoutUrl} directly — LS auto-opens the overlay on click.
   *
   * Use openCheckout only for programmatic triggers (e.g. low-funds nudge).
   */
  const openCheckout = async (fetchUrl: () => Promise<string>) => {
    setLoading(true);
    setError(null);

    try {
      const checkoutUrl = await fetchUrl();

      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        setLoading(false);
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";

      let friendly = "Something went wrong. Please try again.";

      if (raw.includes("Invalid credit pack")) {
        friendly = "This pack is not available right now.";
      } else if (raw.includes("Unauthorized") || raw.includes("401")) {
        friendly = "Please sign in to continue.";
      } else if (raw.includes("429") || raw.includes("rate limit")) {
        friendly = "Too many requests. Please wait a moment.";
      } else if (raw.includes("network") || raw.includes("fetch")) {
        friendly = "Connection issue. Check your internet and try again.";
      } else if (raw.includes("Unable to start checkout")) {
        friendly = "Unable to open checkout. Please try again.";
      }

      setError(friendly);
      setLoading(false);
      throw new Error(friendly);
    }
  };

  return { openCheckout, loading, error };
}
