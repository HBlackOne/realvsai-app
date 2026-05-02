"use client";

/**
 * AppearanceSection.tsx
 *
 * Controls: dark mode (disabled — always dark for now), display language (soon).
 *
 * Backend wiring needed:
 *  • When light mode is implemented, add `theme: "dark" | "light" | "system"` to userSettings.
 *  • PATCH /api/settings with { theme }
 *  • When multi-locale is implemented, add `locale: string` to userSettings.
 *  • PATCH /api/settings with { locale }
 */

import { Globe, Moon } from "lucide-react";
import { InfoRow, RowDivider, SectionWrapper, Toggle, Badge } from "./shared";

export function AppearanceSection() {
  return (
    <SectionWrapper title="Appearance" icon={<Moon className="h-3.5 w-3.5" />}>
      {/* Dark mode — always on, light mode not yet available */}
      <InfoRow
        icon={<Moon className="h-4 w-4 text-primary" />}
        iconBgClass="bg-primary/10"
        title="Dark mode"
        desc="The app always runs in dark mode. Light mode support is coming in a future update."
        action={
          // TODO: remove `disabled` and wire to theme setting when light mode ships
          <Toggle checked={true} onChange={() => {}} disabled={true} />
        }
      />

      <RowDivider />

      {/* Language — coming soon */}
      <InfoRow
        icon={<Globe className="h-4 w-4 text-text-muted" />}
        title="Display language"
        desc="Language switching will appear here when multi-locale support is available."
        badge={<Badge label="Soon" />}
      />
    </SectionWrapper>
  );
}
