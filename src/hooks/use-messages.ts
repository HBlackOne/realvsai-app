"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMessages, markAllMessagesRead, type AppMessageItem } from "@/lib/api/messages";
import { useAppMe } from "@/hooks/use-app-me";

export function useMessages() {
  const { setMe } = useAppMe();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<AppMessageItem[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const response = await fetchMessages();

    if (response.success && response.data) {
      setMessages(response.data);
    } else {
      setMessages([]);
    }

    setLoading(false);
  }, []);

  const markRead = useCallback(async () => {
    await markAllMessagesRead();
    setMessages((current) => current.map((message) => ({ ...message, isRead: true })));
    setMe((current) => (current ? { ...current, unreadMessagesCount: 0 } : current));
  }, [setMe]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    messages,
    refresh,
    markRead,
  };
}
