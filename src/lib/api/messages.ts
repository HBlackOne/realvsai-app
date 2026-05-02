export type AppMessageItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type MessagesResponse = {
  success: boolean;
  data?: AppMessageItem[];
  error?: string;
};

export async function fetchMessages(): Promise<MessagesResponse> {
  try {
    const response = await fetch("/api/messages", { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return { success: false, error: `Unexpected /api/messages response (${response.status})` };
    }

    return (await response.json()) as MessagesResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load messages",
    };
  }
}

export async function markAllMessagesRead() {
  const response = await fetch("/api/messages/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  return response.json();
}
