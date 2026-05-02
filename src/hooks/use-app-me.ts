"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchMe, type AppMeData } from "@/lib/api/me";

type AppMeStoreState = {
  me: AppMeData | null;
  loading: boolean;
};

let state: AppMeStoreState = {
  me: null,
  loading: true,
};

const listeners = new Set<() => void>();
let refreshPromise: Promise<void> | null = null;
let hasLoadedOnce = false;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<AppMeStoreState>) {
  state = {
    ...state,
    ...partial,
  };
  emitChange();
}

async function runRefresh() {
  setState({ loading: true });

  try {
    const payload = await fetchMe();

    if (payload.success && payload.data) {
      setState({ me: payload.data, loading: false });
      return;
    }

    setState({ loading: false });
  } catch {
    setState({ loading: false });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

async function refreshStore() {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
      hasLoadedOnce = true;
    });
  }

  await refreshPromise;
}

export function useAppMe() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(async () => {
    await refreshStore();
  }, []);

  const setMe = useCallback((next: AppMeData | ((current: AppMeData | null) => AppMeData | null) | null) => {
    const resolved = typeof next === "function" ? next(state.me) : next;
    setState({ me: resolved });
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce && !refreshPromise) {
      void refreshStore();
    }
  }, []);

  return {
    me: snapshot.me,
    loading: snapshot.loading,
    refresh,
    setMe,
  };
}
