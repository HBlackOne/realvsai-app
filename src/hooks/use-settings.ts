"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationPrefs } from "@/components/settings/NotificationsSection";

const DEFAULT_PREFS: NotificationPrefs = {
  emailNotifications: true,
  scanResultEmails: true,
  marketingEmails: false,
};

interface SettingsApiResponse {
  success: boolean;
  data?: NotificationPrefs;
  error?: string;
}

interface UseSettingsReturn {
  prefs: NotificationPrefs;
  loading: boolean;
  saving: boolean;
  error: string | null;
  pendingKey: keyof NotificationPrefs | null;
  onChange: (key: keyof NotificationPrefs, value: boolean) => void;
}

function isNotificationPrefs(value: unknown): value is NotificationPrefs {
  if (!value || typeof value !== "object") return false;
  const prefs = value as Record<keyof NotificationPrefs, unknown>;

  return (
    typeof prefs.emailNotifications === "boolean" &&
    typeof prefs.scanResultEmails === "boolean" &&
    typeof prefs.marketingEmails === "boolean"
  );
}

export function useSettings(): UseSettingsReturn {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<keyof NotificationPrefs | null>(null);

  const confirmedPrefsRef = useRef<NotificationPrefs>(DEFAULT_PREFS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const payload: SettingsApiResponse = await res.json();

        if (!res.ok || !payload.success || !isNotificationPrefs(payload.data)) {
          throw new Error(payload.error || "Failed to load settings.");
        }

        if (active) {
          confirmedPrefsRef.current = payload.data;
          setPrefs(payload.data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load settings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const persist = useCallback(async (updated: NotificationPrefs, changedKey: keyof NotificationPrefs) => {
    setSaving(true);
    setError(null);
    setPendingKey(changedKey);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const payload: SettingsApiResponse = await res.json();

      if (!res.ok || !payload.success || !isNotificationPrefs(payload.data)) {
        throw new Error(payload.error || "Failed to save settings.");
      }

      confirmedPrefsRef.current = payload.data;
      setPrefs(payload.data);
      setPendingKey(null);
    } catch (err) {
      setPrefs(confirmedPrefsRef.current);
      setPendingKey(null);
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }, []);

  const onChange = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      setPrefs((prev) => {
        const updated = { ...prev, [key]: value };

        setPendingKey(key);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => persist(updated, key), 600);

        return updated;
      });
    },
    [persist],
  );

  return { prefs, loading, saving, error, pendingKey, onChange };
}
