"use client";

import { useEffect } from "react";
import { Bell, CreditCard, MessageSquare } from "lucide-react";
import { AppPage, AppPageHeader, AppSection } from "@/components/app-shell/AppPage";
import { useMessages } from "@/hooks/use-messages";

export default function MessagesPage() {
  const { loading, messages, markRead } = useMessages();

  useEffect(() => {
    if (loading || !messages.some((message) => !message.isRead)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void markRead();
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [loading, messages, markRead]);

  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader
        title="Messages"
        description="Purchase recaps, billing updates, and product alerts will appear here as they happen."
      />

      <div className="mt-8">
        <AppSection title="Inbox" icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl bg-bg px-4 py-4">
                  <span className="balance-shimmer block h-4 w-28 rounded-full" />
                  <span className="balance-shimmer mt-2.5 block h-3 w-44 rounded-full" />
                </div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-border">
              {messages.map((message) => (
                <MessageRow
                  key={message.id}
                  title={message.title}
                  body={message.body}
                  createdAt={message.createdAt}
                  isRead={message.isRead}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-text-dim" />
              <p className="mt-3 text-sm font-medium text-text-muted">No messages yet</p>
              <p className="mt-1 text-xs text-text-dim">
                Your inbox will show purchase recaps, billing alerts, and account notifications when they arrive.
              </p>
            </div>
          )}
        </AppSection>
      </div>
    </AppPage>
  );
}

function MessageRow({
  title,
  body,
  createdAt,
  isRead,
}: {
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}) {
  const dateText = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-dim text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">{title}</p>
              <p className="mt-0.5 text-xs text-text-dim">{dateText}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-muted">{body}</p>
        </div>
        {!isRead ? <Bell className="h-4 w-4 shrink-0 text-danger" /> : null}
      </div>
    </div>
  );
}
