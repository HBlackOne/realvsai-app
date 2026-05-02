"use client";

/**
 * SecuritySection.tsx
 *
 * Rows: Authentication (active), Password & sign-in (soon),
 *       Saved account settings (soon), Two-factor authentication (soon).
 *
 * Backend wiring needed:
 *  • Password & sign-in: wire to Clerk's <UserProfile /> or updatePassword() if using
 *    Clerk password management. Route: /api/auth/change-password or Clerk SDK directly.
 *  • 2FA: Clerk provides built-in TOTP via user.createTOTP(). Expose a modal here that
 *    calls clerk.user.createTOTP() and renders the QR code + verification step.
 *  • Saved account settings: extend userSettings model as needed and PATCH /api/settings.
 */

import { useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Database, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Badge, InfoRow, RowDivider, SectionWrapper } from "./shared";

export function SecuritySection() {
  const { openUserProfile } = useClerk();

  return (
    <SectionWrapper title="Account & security" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
      {/* Authentication — already active */}
      <InfoRow
        icon={<ShieldCheck className="h-4 w-4 text-success" />}
        iconBgClass="bg-success/10"
        title="Authentication"
        desc="Your sign-in and account access are already active and secured."
        badge={
          <Badge
            label="Active"
            colorClass="text-success"
            bgClass="bg-success/10"
            borderClass="border-success/20"
          />
        }
      />

      <RowDivider />

      <InfoRow
        icon={<KeyRound className="h-4 w-4 text-warning" />}
        iconBgClass="bg-warning/10"
        title="Password & sign-in"
        desc="Update your password, connected emails, and sign-in methods through Clerk."
        action={
          <button
            type="button"
            onClick={() => openUserProfile({ appearance: { baseTheme: dark } })}
            className="flex-shrink-0 rounded-full border border-border-subtle bg-surface3 px-3 py-1.5 text-[11px] font-semibold text-text-muted transition hover:bg-surface-hover hover:text-text"
          >
            Manage
          </button>
        }
      />

      <RowDivider />

      {/* Saved account settings — soon */}
      {/*
        TODO: when extended account controls ship, replace Badge with
        a link/button to the relevant sub-section.
      */}
      <InfoRow
        icon={<Database className="h-4 w-4 text-warning" />}
        iconBgClass="bg-warning/10"
        title="Saved account settings"
        desc="More account controls and saved preferences will appear here later."
        badge={<Badge label="Soon" />}
      />

      <RowDivider />

      {/* Two-factor authentication — soon */}
      {/*
        TODO: implement via Clerk TOTP:
          const totp = await clerk.user.createTOTP();
          // Show totp.uri as QR code, then call clerk.user.verifyTOTP({ code })
      */}
      <InfoRow
        icon={<Lock className="h-4 w-4 text-text-muted" />}
        title="Two-factor authentication"
        desc="Add an extra layer of security to your account with 2FA."
        badge={<Badge label="Soon" />}
      />
    </SectionWrapper>
  );
}
