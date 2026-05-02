"use client";

/**
 * _client.tsx
 *
 * Client shell for the settings page.
 * Loads state via `useSettings` and renders all sections.
 * Kept separate from page.tsx so the Server Component boundary is clean.
 */

import { AppearanceSection }    from "@/components/settings/AppearanceSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { SecuritySection }      from "@/components/settings/SecuritySection";
import { SettingsDangerZone }   from "@/components/settings/SettingsDangerZone";
import { useSettings }          from "@/hooks/use-settings";

export function SettingsClient() {
  const { prefs, error, pendingKey, onChange } = useSettings();

  return (
    <div className="space-y-8">
      {error ? (
        <div aria-live="polite" className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {/* ── Sections ── */}

      {/* Preferences — notification toggles */}
      <NotificationsSection
        prefs={prefs}
        pendingKey={pendingKey}
        onChange={onChange}
      />

      {/* Appearance */}
      <AppearanceSection />

      {/* Account & security */}
      <SecuritySection />

      {/* Danger zone */}
      <SettingsDangerZone />

    </div>
  );
}
