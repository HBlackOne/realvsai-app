"use client";

import { Trash2 } from "lucide-react";
import { AppSection } from "@/components/app-shell/AppPage";

export function DangerZone() {
  return (
    <AppSection title="Danger zone" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3" iconColor="var(--danger)">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text">Delete account</p>
          <p className="mt-1 text-xs text-text-muted">
            Permanently remove your account and all associated data. This flow is not wired yet.
          </p>
        </div>
        <button
          disabled
          title="Account deletion is not wired yet"
          className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </button>
      </div>
    </AppSection>
  );
}
