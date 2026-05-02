import "server-only";

import crypto from "node:crypto";
import { assertLemonConfig } from "@/lib/billing/config";

export async function createCheckoutUrl({
  variantId,
  email,
  name,
  custom,
  token,
}: {
  variantId: string;
  email?: string;
  name?: string;
  custom?: Record<string, string | number | boolean | null>;
  token?: string;
}) {
  const config = assertLemonConfig();

  const successBase = `${config.appUrl}/billing/success`;
  const redirectUrl = token ? `${successBase}?token=${token}` : successBase;

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          test_mode: true,
          product_options: {
            redirect_url: redirectUrl,
            enabled_variants: [Number(variantId)],
          },
          checkout_data: {
            email,
            name,
            custom,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(config.storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.detail || "Failed to create LemonSqueezy checkout.",
    );
  }

  return payload?.data?.attributes?.url as string;
}

export function verifyLemonSignature(
  rawBody: string,
  signature: string | null,
) {
  const { webhookSecret } = assertLemonConfig();

  if (!webhookSecret) {
    throw new Error("Missing LEMONSQUEEZY_WEBHOOK_SECRET.");
  }

  if (!signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
