"use client";

/**
 * NotificationsSection.tsx
 *
 * Controls: email notifications, scan result emails, product updates.
 * All three are persisted via PATCH /api/settings (see TODOs below).
 *
 * Backend wiring needed:
 *  • Create or extend a `userSettings` table / field on the User model:
 *      emailNotifications : Boolean @default(true)
 *      scanResultEmails   : Boolean @default(true)
 *      marketingEmails    : Boolean @default(false)
 *  • PATCH /api/settings  — accepts { emailNotifications?, scanResultEmails?, marketingEmails? }
 *  • GET  /api/settings   — returns the above fields (load initial state in the parent page)
 */

import { Bell, Layers, ScanLine } from "lucide-react";
import { InfoRow, RowDivider, SectionWrapper, Toggle, Badge } from "./shared";

export interface NotificationPrefs {
  emailNotifications: boolean;
  scanResultEmails:   boolean;
  marketingEmails:    boolean;
}

interface Props {
  prefs:      NotificationPrefs;
  pendingKey: keyof NotificationPrefs | null;
  onChange:   (key: keyof NotificationPrefs, value: boolean) => void;
}

export function NotificationsSection({ prefs, pendingKey, onChange }: Props) {
  return (
    <SectionWrapper title="Preferences" icon={<Bell className="h-3.5 w-3.5" />}>
      {/* Email notifications */}
      <InfoRow
        icon={<Bell className="h-4 w-4 text-primary" />}
        iconBgClass="bg-primary/10"
        title="Email notifications"
        desc="Receive important account alerts and scan result summaries by email."
        action={
          <Toggle
            checked={prefs.emailNotifications}
            pending={pendingKey === "emailNotifications"}
            onChange={(v) => onChange("emailNotifications", v)}
          />
        }
      />

      <RowDivider />

      {/* Scan result emails */}
      <InfoRow
        icon={<ScanLine className="h-4 w-4 text-primary" />}
        iconBgClass="bg-primary/10"
        title="Scan result emails"
        desc="Get an email each time a scan finishes with a full breakdown of results."
        action={
          <Toggle
            checked={prefs.scanResultEmails}
            pending={pendingKey === "scanResultEmails"}
            onChange={(v) => onChange("scanResultEmails", v)}
          />
        }
      />

      <RowDivider />

      {/* Product updates */}
      <InfoRow
        icon={<Layers className="h-4 w-4 text-text-muted" />}
        title="Product updates & news"
        desc="Occasional emails about new features, tips, and product announcements."
        action={
          <Toggle
            checked={prefs.marketingEmails}
            pending={pendingKey === "marketingEmails"}
            onChange={(v) => onChange("marketingEmails", v)}
          />
        }
      />

      <RowDivider />

      {/* Scan preferences — coming soon */}
      <InfoRow
        icon={<ScanLine className="h-4 w-4 text-primary" />}
        iconBgClass="bg-primary/10"
        title="Scan preferences"
        desc="Default scan behavior and result preferences will appear here later."
        badge={<Badge label="Soon" />}
      />
    </SectionWrapper>
  );
}
