"use client";

import { useState } from "react";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Do NOT reset loading here — Checkout.Success event handles that
        // when the overlay closes or payment completes
      } else {
        // Fallback: redirect — loading can reset since user leaves the page
        setLoading(false);
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  };

  return { openCheckout, loading, error };
}
