"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppMe } from "@/hooks/use-app-me";
import { resolveUserState, type UserStateKind } from "@/lib/user-state";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import type { AppMessageItem } from "@/lib/api/messages";

interface DashboardHeaderProps {
  onHamburger?: () => void;
  onUpgrade?: () => void;
}

function getPlanLabel(userState: UserStateKind, trialDaysLeft?: number): string {
  switch (userState) {
    case "ea_trial":
      return `Free Trial · EA${trialDaysLeft !== undefined ? ` · ${trialDaysLeft}d left` : ""}`;
    case "normal_trial":
      return `Free Trial${trialDaysLeft !== undefined ? ` · ${trialDaysLeft}d left` : ""}`;
    case "ea_pro":
      return "EA Pro · $9.99";
    case "loyalty_pro":
      return "Loyalty Pro · $12.99";
    case "normal_pro":
      return "Pro";
    case "basic":
      return "Basic";
    case "wallet_only":
      return "Pay as you go";
    case "trial_expired":
      return "Trial ended";
    case "free":
    default:
      return "No active plan";
  }
}

function getCreditColor(credits: number): string {
  if (credits > 200) return "text-text";
  if (credits >= 50) return "text-warning";
  return "text-danger animate-pulse";
}

function relativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function DashboardHeader({ onHamburger, onUpgrade }: DashboardHeaderProps) {
  const { me, loading } = useAppMe();
  const { unreadCount } = useUnreadMessages();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [latestMessages, setLatestMessages] = useState<AppMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const userState = resolveUserState(me);
  const spendableCredits =
    (me?.trial?.balance ?? 0) +
    (me?.subscription?.subscriptionCreditBalance ?? 0) +
    (me?.wallet?.balance ?? 0);

  const trialDaysLeft = me?.trial?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(me.trial.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined;

  const planLabel = getPlanLabel(userState, trialDaysLeft);
  const creditColor = getCreditColor(spendableCredits);

  useEffect(() => {
    if (!messagesOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!messagesRef.current?.contains(event.target as Node)) {
        setMessagesOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [messagesOpen]);

  useEffect(() => {
    if (!messagesOpen) return;

    let cancelled = false;
    async function loadLatestMessages() {
      setMessagesLoading(true);
      try {
        const res = await fetch("/api/messages?limit=3", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setLatestMessages(data.messages ?? data.data ?? []);
      } catch {
        if (!cancelled) setLatestMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    void loadLatestMessages();
    return () => {
      cancelled = true;
    };
  }, [messagesOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-8 lg:left-[220px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburger}
          className="hidden p-2 text-text-dim transition-colors hover:text-text lg:inline-flex"
          aria-label="Open navigation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-text">RealvsAI</span>
          <span className="mt-1 text-[11px] font-medium text-text-dim">AI Authenticity scanner</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUpgrade}
          className="cursor-pointer rounded-full border-none bg-primary px-4 py-2 text-[14px] font-bold text-bg shadow-[0_0_16px_rgba(138,180,248,0.25)] transition-colors hover:bg-primary-hover"
        >
          Upgrade
        </button>

        <div ref={messagesRef} className="relative">
          <button
            type="button"
            onClick={() => setMessagesOpen((open) => !open)}
            className="relative flex h-9 w-9 items-center justify-center rounded-[12px] transition-colors hover:bg-surface2"
            style={{ border: "1px solid var(--color-border)", background: messagesOpen ? "var(--surface2)" : "var(--color-surface)" }}
            aria-label="Messages"
            aria-expanded={messagesOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={messagesOpen ? "var(--color-primary)" : "var(--color-text-dim)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ width: 16, height: 16, minWidth: 16, background: "var(--color-danger)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 top-[46px] z-50 w-[260px] max-w-[calc(100vw-20px)] transition-all duration-200 ease-out ${messagesOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"}`}
          >
            <div className="overflow-hidden rounded-[18px] border border-border bg-surface2 shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
              <div className="border-b border-border/60 px-3 pb-1.5 pt-2.5">
                <div className="text-[13px] font-semibold text-text">Messages</div>
                <div className="mt-0.5 text-[10.5px] text-text-dim">Latest notifications</div>
              </div>

              <div className="max-h-[236px] overflow-y-auto px-1.5 py-1.5">
                {messagesLoading ? (
                  <div className="space-y-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5" style={{ background: "var(--color-surface3)" }}>
                        <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-[8px] bg-surface-hover" />
                        <div className="min-w-0 flex-1">
                          <SkeletonText className="h-3 w-32" />
                          <SkeletonText className="mt-1.5 h-2.5 w-14" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : latestMessages.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {latestMessages.slice(0, 3).map((message) => (
                      <div
                        key={message.id}
                        className="flex max-h-[44px] items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors"
                        style={{ background: "var(--color-surface3)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface3)"; }}
                      >
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]"
                          style={{ background: message.isRead ? "var(--surface3)" : "color-mix(in srgb, var(--color-primary) 14%, var(--surface3))" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={message.isRead ? "var(--color-text-dim)" : "var(--color-primary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{message.title}</p>
                          <p className="mt-0.5 text-[10.5px] leading-tight" style={{ color: "var(--color-text-dim)" }}>{relativeTime(message.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center">
                    <div className="text-[13px] font-semibold text-text-muted">No messages yet</div>
                    <div className="mt-1 text-[11px] text-text-dim">Notifications will appear here.</div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 px-2 pb-2 pt-2">
                <Link
                  href="/messages"
                  onClick={() => setMessagesOpen(false)}
                  className="flex w-full items-center justify-center rounded-[11px] bg-primary px-3 py-1.5 text-[11.5px] font-bold text-bg transition-colors hover:bg-primary-hover"
                >
                  View all messages
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface2 px-3.5 py-1.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="var(--color-warning)"
            stroke="none"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {loading ? (
            <SkeletonText className="w-12" />
          ) : (
            <span className={`text-[14px] font-bold ${creditColor}`}>{spendableCredits}</span>
          )}
          <span className="hidden text-[13px] text-text-dim sm:inline">credits</span>
        </div>
      </div>
    </header>
  );
}
