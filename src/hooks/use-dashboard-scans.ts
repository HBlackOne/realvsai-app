"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDashboardScans, type DashboardScanItem } from "@/lib/api/dashboard-scans";

export function useDashboardScans() {
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);
  const [recentScans, setRecentScans] = useState<DashboardScanItem[]>([]);
  const [usage, setUsage] = useState({
    creditsSpent: 0,
    completedScans: 0,
    byType: {
      image: 0,
      video: 0,
      audio: 0,
    },
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const response = await fetchDashboardScans();

    if (response.success && response.data) {
      setTotalScans(response.data.totalScans);
      setRecentScans(response.data.recentScans);
      setUsage(response.data.usage);
    } else {
      setTotalScans(0);
      setRecentScans([]);
      setUsage({
        creditsSpent: 0,
        completedScans: 0,
        byType: {
          image: 0,
          video: 0,
          audio: 0,
        },
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    totalScans,
    recentScans,
    usage,
    refresh,
  };
}
