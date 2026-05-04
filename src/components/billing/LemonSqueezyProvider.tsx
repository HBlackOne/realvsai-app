"use client";

import { useEffect } from "react";
import { useAppMe } from "@/hooks/use-app-me";
import { useToast } from "@/components/ui/Toast";

export function LemonSqueezyProvider() {
  const { refresh } = useAppMe();
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let checkoutSucceeded = false;

    const cleanupCheckoutDom = (delayMs: number) => {
      setTimeout(() => {
        document.body.style.overflow = "";
        document.body.style.overflowY = "";
        document.documentElement.style.overflow = "";

        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("overflow-hidden");

        document.querySelectorAll("iframe").forEach((iframe) => {
          if (iframe.src.includes("lemonsqueezy")) {
            iframe.remove();
          }
        });
      }, delayMs);
    };

    const init = () => {
      if (typeof window.createLemonSqueezy === "function") {
        window.createLemonSqueezy();
      }

      if (!window.LemonSqueezy) {
        retryTimer = setTimeout(init, 100);
        return;
      }

      window.LemonSqueezy.Setup({
        eventHandler: async (event) => {
          const eventName = event.event as string;

          if (eventName === "Checkout.Success") {
            checkoutSucceeded = true;

            const refreshWithTimeout = Promise.race([
              refresh(),
              new Promise((resolve) => setTimeout(resolve, 3000)),
            ]);
            await refreshWithTimeout;

            window.dispatchEvent(new CustomEvent("ls:checkout:success"));

            const attrs = event.data?.attributes;
            const firstItem = attrs?.first_order_item;
            const variantName = (firstItem?.variant_name ?? "").toLowerCase();
            const productName = (firstItem?.product_name ?? "").toLowerCase();

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

          if (eventName === "Checkout.Close") {
            cleanupCheckoutDom(300);
            if (!checkoutSucceeded) {
              window.dispatchEvent(new CustomEvent("ls:checkout:closed"));
            }
            checkoutSucceeded = false;
          }

          if (eventName === "Checkout.PaymentError") {
            window.dispatchEvent(
              new CustomEvent("ls:checkout:error", {
                detail: { message: "Payment failed. Please try again." },
              }),
            );
          }

          if (eventName === "PaymentMethodUpdate.Updated") {
            await refresh();
            showToast("Payment method updated", "success");
          }
        },
      });
    };

    init();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [refresh, showToast]);

  return null;
}
