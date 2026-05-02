"use client";

/**
 * SettingsDangerZone.tsx
 *
 * Account deletion with two-step confirmation.
 * Matches the same pattern as profile-page DangerZone.tsx.
 *
 * Backend wiring needed:
 *  • DELETE /api/account
 *      1. Cancel active LemonSqueezy subscription (if any) via lemonsqueezy.ts
 *      2. Delete user record + cascade: wallet, scans, settings, billing customer
 *      3. Delete Clerk user via clerkClient.users.deleteUser(userId)
 *      4. Return 200 on success
 *  • After successful deletion, call Clerk's signOut() and redirect to "/".
 *
 * Example implementation sketch:
 *   // app/api/account/route.ts
 *   export async function DELETE(req: Request) {
 *     const { userId } = auth();
 *     if (!userId) return new Response("Unauthorized", { status: 401 });
 *     await cancelSubscription(userId);          // lib/billing/lemonsqueezy.ts
 *     await db.user.delete({ where: { clerkId: userId } });
 *     await clerkClient.users.deleteUser(userId);
 *     return new Response(null, { status: 200 });
 *   }
 */

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function SettingsDangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      // TODO: replace stub with real API call + sign-out
      // const res = await fetch("/api/account", { method: "DELETE" });
      // if (!res.ok) throw new Error("Failed to delete account");
      // await signOut({ redirectUrl: "/" });   // Clerk signOut
      await new Promise((r) => setTimeout(r, 1200)); // ← stub, remove when wired
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      {/* Section header */}
      <div className="mb-3.5 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Trash2 className="h-3.5 w-3.5 text-danger" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text">
            Danger zone
          </span>
        </div>
        <div className="h-px flex-1 bg-danger/20" />
      </div>

      <div className="rounded-2xl border border-danger/20 bg-surface p-5 sm:p-6">
        {!confirming ? (
          /* ── idle state ── */
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">Delete account</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                Permanently remove your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger/45 hover:bg-danger/16"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        ) : (
          /* ── confirmation state ── */
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text">
              Are you sure? This is permanent.
            </p>
            <p className="text-xs leading-relaxed text-text-muted">
              All your scans, credits, and billing data will be permanently deleted.
              You will be signed out immediately.
            </p>

            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setConfirming(false); setError(null); }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border bg-surface3 px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/25 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, delete my account"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
