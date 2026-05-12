"use client";

import { useEffect, useState } from "react";

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        const res = await fetch("/api/messages?unread=true", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setUnreadCount(Number(data.unreadCount ?? 0));
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    }

    void fetchUnread();
    const interval = window.setInterval(fetchUnread, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { unreadCount };
}
