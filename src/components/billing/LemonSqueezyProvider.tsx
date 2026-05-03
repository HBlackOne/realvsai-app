"use client";

import { useEffect } from "react";
import { useAppMe } from "@/hooks/use-app-me";
import { useToast } from "@/components/ui/Toast";

export function LemonSqueezyProvider() {
  const { refresh } = useAppMe();
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Required for React — lemon.js may init before React mounts
    window.createLemonSqueezy?.();

    if (!window.LemonSqueezy) return;

    window.LemonSqueezy.Setup({
      eventHandler: async (event) => {
        if (event.event === "Checkout.Success") {
          // 1. Close overlay
          window.LemonSqueezy?.Url?.Close?.();

          // 2. Refresh user state immediately
          await refresh();

          // 3. Detect purchase type from Order object
          const attrs = event.data?.attributes;
          const firstItem = attrs?.first_order_item;
          const variantName = (firstItem?.variant_name ?? "").toLowerCase();
          const productName = (firstItem?.product_name ?? "").toLowerCase();

          // 4. Show contextual success toast
          if (variantName.includes("trial")) {
            showToast("Trial activated · 500 credits ready", "success");
          } else if (
            productName.includes("pro") ||
            productName.includes("basic") ||
            productName.includes("loyalty")
          ) {
            showToast("Plan activated · Credits added to your account", "success");
          } else {
            showToast("Credits added to your wallet", "success");
          }
        }

        if (event.event === "PaymentMethodUpdate.Updated") {
          await refresh();
          showToast("Payment method updated", "success");
        }
      },
    });
  }, []);

  return null;
}
