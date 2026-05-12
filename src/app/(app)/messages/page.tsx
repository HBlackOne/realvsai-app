"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppPage, AppPageHeader, AppSectionHeader } from "@/components/app-shell/AppPage";
import { Skeleton, SkeletonNumber, SkeletonText } from "@/components/ui/Skeleton";
import type { AppMessageItem } from "@/lib/api/messages";

const PAGE_SIZE = 20;
const TABS = ["All", "Scans", "Billing", "System"] as const;
type Tab = (typeof TABS)[number];

type MessagesPayload = {
  success?: boolean;
  data?: AppMessageItem[];
  messages?: AppMessageItem[];
  meta?: {
    nextCursor?: string | null;
    stats?: {
      total: number;
      unread: number;
    };
  };
  nextCursor?: string | null;
  error?: string;
};

const iconConfig: Record<string, { bg: string; color: string; path: string }> = {
  scan_complete: { bg: "rgba(74,222,128,0.12)", color: "var(--color-success)", path: "M20 6 9 17l-5-5" },
  scan_failed: { bg: "rgba(255,92,92,0.12)", color: "var(--color-danger)", path: "M18 6 6 18M6 6l12 12" },
  credits_purchased: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M3 10h18M7 15h1m4 0h1" },
  purchase: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" },
  purchase_recap: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" },
  billing: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" },
  subscription_start: { bg: "rgba(138,180,248,0.12)", color: "var(--color-primary)", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  subscription_renew: { bg: "rgba(138,180,248,0.12)", color: "var(--color-primary)", path: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" },
  subscription_cancel: { bg: "rgba(255,92,92,0.08)", color: "var(--color-danger)", path: "M18 6 6 18M6 6l12 12" },
  trial_ending: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  trial_expired: { bg: "rgba(255,92,92,0.12)", color: "var(--color-danger)", path: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  credits_low: { bg: "rgba(245,158,11,0.12)", color: "var(--color-warning)", path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
  product_update: { bg: "rgba(138,180,248,0.12)", color: "var(--color-primary)", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" },
  announcement: { bg: "rgba(138,180,248,0.12)", color: "var(--color-primary)", path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0" },
  maintenance: { bg: "rgba(107,114,128,0.12)", color: "var(--color-text-muted)", path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  default: { bg: "rgba(138,180,248,0.12)", color: "var(--color-primary)", path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0" },
};

function getIcon(type: string) {
  return iconConfig[type] ?? iconConfig.default;
}

function formatDate(createdAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

async function fetchMessagePage(cursor?: string | null, activeTab: Tab = "All") {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  if (activeTab !== "All") params.set("category", activeTab.toLowerCase());
  const res = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
  return (await res.json()) as MessagesPayload;
}

function MessageRowSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4">
      <Skeleton className="h-9 w-9 flex-shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <SkeletonText className="h-4 w-36" />
        <SkeletonText className="mt-2 h-3 w-24" />
        <SkeletonText className="mt-3 h-3.5 w-4/5" />
      </div>
    </div>
  );
}

function MessageRow({
  message,
  selected,
  anySelected,
  onToggle,
}: {
  message: AppMessageItem;
  selected: boolean;
  anySelected: boolean;
  onToggle: () => void;
}) {
  const icon = getIcon(message.type);

  return (
    <div
      className="relative flex cursor-pointer gap-3 px-4 py-4 transition-colors"
      onClick={onToggle}
      style={{ background: selected ? "rgba(138,180,248,0.05)" : "transparent" }}
    >
      {!message.isRead && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 3, height: "60%", background: "var(--color-primary)" }}
        />
      )}

      {anySelected && (
        <div
          className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center self-center rounded-[5px]"
          style={{
            border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
            background: selected ? "var(--color-primary)" : "transparent",
          }}
        >
          {selected && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--color-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          )}
        </div>
      )}

      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: icon.bg }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={icon.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon.path} />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="mb-0.5 text-[13px]"
          style={{
            fontWeight: message.isRead ? 500 : 700,
            color: message.isRead ? "var(--color-text-muted)" : "var(--color-text)",
          }}
        >
          {message.title}
        </p>
        <p className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>
          {formatDate(message.createdAt)}
        </p>
        {message.body ? (
          <p className="mt-1.5 whitespace-pre-line text-[12px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {message.body}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<AppMessageItem[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const anySelected = selected.size > 0;
  const allSelected = messages.length > 0 && messages.every((m) => selected.has(m.id));

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const data = await fetchMessagePage(null, activeTab);
    const page = data.messages ?? data.data ?? [];
    setMessages(page);
    setStats(data.meta?.stats ?? { total: page.length, unread: page.filter((m) => !m.isRead).length });
    setNextCursor(data.meta?.nextCursor ?? data.nextCursor ?? null);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetch("/api/messages/read-all", { method: "POST" })
        .then(() => {
          setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
          setStats((prev) => ({ ...prev, unread: 0 }));
        })
        .catch(() => {});
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(messages.map((m) => m.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchMessagePage(nextCursor, activeTab);
    const page = data.messages ?? data.data ?? [];
    setMessages((prev) => [...prev, ...page]);
    setNextCursor(data.meta?.nextCursor ?? data.nextCursor ?? null);
    setLoadingMore(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await Promise.all([...selected].map((id) => fetch(`/api/messages/${id}`, { method: "DELETE" })));
    setMessages((prev) => prev.filter((m) => !selected.has(m.id)));
    setStats((prev) => ({
      total: Math.max(0, prev.total - selected.size),
      unread: Math.max(0, prev.unread - messages.filter((m) => selected.has(m.id) && !m.isRead).length),
    }));
    clearSelection();
    setDeleting(false);
  }

  async function markSelectedRead() {
    await Promise.all([...selected].map((id) => fetch(`/api/messages/${id}/read`, { method: "POST" })));
    const selectedUnread = messages.filter((m) => selected.has(m.id) && !m.isRead).length;
    setMessages((prev) => prev.map((m) => (selected.has(m.id) ? { ...m, isRead: true } : m)));
    setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - selectedUnread) }));
    clearSelection();
  }

  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader
        title="Messages"
        description="Purchase recaps, billing updates, and product alerts will appear here as they happen."
      />

      <div className="mt-8 flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: stats.total, color: "var(--color-primary)" },
            { label: "Unread", value: stats.unread, color: "var(--color-danger)" },
            { label: "Selected", value: selected.size, color: "var(--color-warning)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[14px] px-4 py-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: "var(--color-text-dim)" }}>
                {stat.label}
              </p>
              {loading ? (
                <SkeletonNumber className="h-8 w-12" />
              ) : (
                <p className="font-mono text-[22px] font-extrabold tracking-tight" style={{ color: stat.color }}>
                  {stat.value.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>

        <div>
          <AppSectionHeader
            title="Inbox"
            icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            action={
              !loading && messages.length > 0 ? (
                <button onClick={allSelected ? clearSelection : selectAll} className="text-[12.5px] text-primary transition-colors hover:text-primary-hover">
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              ) : undefined
            }
          />

          <div className="mb-3 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setNextCursor(null);
                  setMessages([]);
                  setSelected(new Set());
                }}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{
                  border: `1px solid ${activeTab === tab ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: activeTab === tab ? "rgba(138,180,248,0.1)" : "var(--surface2)",
                  color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-dim)",
                  fontFamily: "inherit",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {anySelected && (
            <div
              className="mb-2 flex flex-wrap items-center gap-2 rounded-[16px] px-4 py-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--color-border)" }}
            >
              <span className="flex-1 text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
                {selected.size} selected
              </span>
              <button onClick={markSelectedRead} className="rounded-[9px] px-3 py-1.5 text-[12px] font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "var(--surface3)", fontFamily: "inherit" }}>
                Mark read
              </button>
              <button onClick={clearSelection} className="rounded-[9px] px-3 py-1.5 text-[12px] font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-dim)", background: "transparent", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12px] font-semibold" style={{ border: "1px solid rgba(255,92,92,.25)", background: "rgba(255,92,92,.08)", color: "var(--color-danger)", fontFamily: "inherit" }}>
                {deleting ? "Deleting…" : `Delete ${selected.size}`}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-[20px] p-2" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {loading ? (
              <>{[0, 1, 2, 3].map((i) => <MessageRowSkeleton key={i} />)}</>
            ) : messages.length > 0 ? (
              <>
                <div className="divide-y divide-border/55">
                  {messages.map((message) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      selected={selected.has(message.id)}
                      anySelected={anySelected}
                      onToggle={() => toggleSelect(message.id)}
                    />
                  ))}
                </div>

                {nextCursor ? (
                  <div className="flex justify-center px-4 pb-1.5 pt-2.5">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-[10px] px-4 py-2 text-[12.5px] font-medium"
                      style={{
                        border: "1px solid var(--color-border)",
                        background: "var(--surface2)",
                        color: "var(--color-text-muted)",
                        fontFamily: "inherit",
                      }}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-[16px]" style={{ background: "var(--surface2)", border: "1px solid var(--color-border)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="mb-1.5 text-[14px] font-semibold" style={{ color: "var(--color-text-muted)" }}>No messages yet</p>
                <p className="mx-auto max-w-[320px] text-[12px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                  Your inbox will show purchase recaps, billing alerts, and account notifications when they arrive.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
