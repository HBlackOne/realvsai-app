import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, ScanLine } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
} from "@/components/app-shell/AppPage";
import { appButtonStyles } from "@/components/app-shell/AppButton";
import BillingSuccessStatus from "@/components/billing/BillingSuccessStatus";
import { db } from "@/lib/db";

const DASHBOARD_HREF = "/dashboard";
const SUCCESS_TOKEN_REPLAY_WINDOW_MS = 15 * 60 * 1000;

async function validateToken(token: string | undefined) {
  if (!token) return null;

  try {
    const record = await db.checkoutToken.findUnique({ where: { token } });
    const now = new Date();

    if (!record) return null;
    if (record.expiresAt < now) return null;

    if (record.usedAt) {
      const usedRecently = now.getTime() - record.usedAt.getTime() < SUCCESS_TOKEN_REPLAY_WINDOW_MS;
      return usedRecently ? record : null;
    }

    await db.checkoutToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    return record;
  } catch {
    return null;
  }
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const checkoutToken = await validateToken(token);

  if (!checkoutToken) {
    redirect(DASHBOARD_HREF);
  }

  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader
        title="Payment received"
        description="Your latest successful billing event has been confirmed and synced to your account."
      />

      <div className="mt-8 space-y-8">
        <AppSection
          title="Purchase status"
          icon="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
        >
          <BillingSuccessStatus />
        </AppSection>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/credits"
            className={appButtonStyles({
              variant: "primary",
              size: "md",
              className: "flex-1",
            })}
          >
            <CreditCard className="h-4 w-4" /> Back to billing hub
          </Link>
          <Link
            href="/scan"
            className={appButtonStyles({
              variant: "ghost",
              size: "md",
              className: "flex-1",
            })}
          >
            <ScanLine className="h-4 w-4" /> Open detector
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
