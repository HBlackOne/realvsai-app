"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { FilterPills } from "@/components/history/FilterPills";
import { ScanRow, ScanRowSkeleton, type Scan } from "@/components/history/ScanRow";
import { BulkBar } from "@/components/history/BulkBar";
import { fetchScans, type ScanListItem } from "@/lib/api/scans";
import { AppPage, AppPageHeader, AppSectionHeader } from "@/components/app-shell/AppPage";

const PAGE_SIZE = 8;

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 9999) + 1;
}

function toHistoryScan(scan: ScanListItem): Scan {
  return {
    id: scan.id,
    mediaType: scan.mediaType,
    inputType: scan.inputType,
    status: scan.status,
    sourceLabel: scan.sourceLabel,
    costCredits: scan.costCredits,
    verdict: scan.verdict,
    confidence: scan.confidence,
    errorMessage: scan.errorMessage,
    createdAt: scan.createdAt,
    seed: hashSeed(scan.id),
  };
}

export default function HistoryPage() {
  const [filter, setFilter] = useState("All");
  const [booting, setBooting] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBooting(true);
      setError(null);
      const response = await fetchScans(null, PAGE_SIZE);

      if (cancelled) return;

      if (!response.success || !response.data) {
        setError(response.error || "Failed to load scans.");
        setScans([]);
        setNextCursor(null);
        setBooting(false);
        return;
      }

      setScans(response.data.map(toHistoryScan));
      setNextCursor(response.meta?.nextCursor ?? null);
      setBooting(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return scans;
    return scans.filter((s) => s.mediaType === filter.toUpperCase());
  }, [filter, scans]);

  const anySelected = selected.size > 0;
  const allVisibleSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const someSelected = anySelected && !allVisibleSelected;

  const toggleSelect = useCallback((id: string, val: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => setSelected(new Set()), []);

  function handleFilterChange(val: string) {
    setFilter(val);
    deselectAll();
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore || filter !== "All") return;

    setLoadingMore(true);
    const response = await fetchScans(nextCursor, PAGE_SIZE);

    if (!response.success || !response.data) {
      setLoadingMore(false);
      return;
    }

    setScans((current) => [...current, ...response.data!.map(toHistoryScan)]);
    setNextCursor(response.meta?.nextCursor ?? null);
    setLoadingMore(false);
  }

  const counts = useMemo(() => ({
    total: scans.length,
    completed: scans.filter((s) => s.status === "COMPLETED").length,
    failed: scans.filter((s) => s.status === "FAILED" || s.status === "CANCELED").length,
    credits: scans.reduce((a, s) => a + s.costCredits, 0),
  }), [scans]);

  return (
    <AppPage className="max-w-[860px]">
      <AppPageHeader
        title="Scan History"
        description="Your completed scans — verdicts, confidence scores, and timestamps."
        action={
          <Link
            href="/scan"
            className="inline-flex items-center gap-[7px] rounded-[11px] px-4 py-[9px] text-[13px] font-bold transition-opacity hover:opacity-90"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-bg)",
              border: "none",
              boxShadow: "0 0 18px rgba(126,170,255,0.18)",
              fontFamily: "inherit",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
            </svg>
            New Scan
          </Link>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <div>
        <div className="grid grid-cols-4 gap-2">
        {[
          { label: nextCursor ? "Loaded" : "Total", value: counts.total, color: "var(--color-primary)" },
          { label: "Completed", value: counts.completed, color: "var(--color-success)" },
          { label: "Failed", value: counts.failed, color: "var(--color-danger)" },
          { label: nextCursor ? "Loaded cr." : "Cr. used", value: counts.credits, color: "var(--color-warning)" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-[14px] px-4 py-3"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[.1em] mb-2" style={{ color: "var(--color-text-dim)" }}>
              {c.label}
            </p>
            <p className="text-[22px] font-extrabold tracking-tight font-mono" style={{ color: c.color }}>
              {c.value.toLocaleString()}
            </p>
          </div>
        ))}
        </div>

        {nextCursor ? (
          <p className="mt-2 text-[11px]" style={{ color: "var(--color-text-dim)" }}>
            Summary reflects the currently loaded history. Load more to expand it.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <AppSectionHeader title="Filters" icon="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          <FilterPills active={filter} onChange={handleFilterChange} />
        </div>

        {!booting && filtered.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center w-[17px] h-[17px] rounded-[5px] cursor-pointer flex-shrink-0 transition-all"
              style={{
                border: `1.5px solid ${someSelected || allVisibleSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                background: someSelected || allVisibleSelected ? "var(--color-primary)" : "var(--color-surface3)",
              }}
              onClick={() => allVisibleSelected ? deselectAll() : selectAll()}
            >
              {someSelected && !allVisibleSelected ? (
                <svg width="9" height="2" viewBox="0 0 9 2"><rect width="9" height="2" rx="1" fill="var(--color-bg)" /></svg>
              ) : allVisibleSelected ? (
                <svg width="10" height="8" viewBox="0 0 10 8">
                  <polyline points="1 4 4 7 9 1" fill="none" stroke="var(--color-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
            <span
              className="text-[12px] cursor-pointer select-none"
              style={{ color: "var(--color-text-dim)" }}
              onClick={() => allVisibleSelected ? deselectAll() : selectAll()}
            >
              {allVisibleSelected ? "Deselect all" : "Select all"}
            </span>
          </div>
        )}
      </div>

      <div>
        <AppSectionHeader
          title={filter === "All"
            ? `${filtered.length} scan${filtered.length !== 1 ? "s" : ""}`
            : `${filtered.length} ${filter.toLowerCase()} scan${filtered.length !== 1 ? "s" : ""}`}
          icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        />

        <div
          className="rounded-[20px] p-2"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {booting ? (
            <>{[0, 1, 2, 3].map((i) => <ScanRowSkeleton key={i} />)}</>
          ) : error ? (
            <div className="py-14 text-center">
              <div
                className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center mx-auto mb-3.5"
                style={{ background: "var(--color-surface2)", border: "1px solid var(--color-border)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--color-danger)" }}>Unable to load scan history</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                {error}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div
                className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center mx-auto mb-3.5"
                style={{ background: "var(--color-surface2)", border: "1px solid var(--color-border)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--color-text-muted)" }}>No scans yet</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
                Start scanning to build your history.
              </p>
            </div>
          ) : (
            <>
              {filtered.map((scan, i) => (
                <ScanRow
                  key={scan.id}
                  scan={scan}
                  idx={i}
                  selected={selected.has(scan.id)}
                  onSelect={(v) => toggleSelect(scan.id, v)}
                  anySelected={anySelected}
                />
              ))}

              {filter === "All" && nextCursor && (
                <div className="px-4 pt-2.5 pb-1.5 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-[7px] px-5 py-2 rounded-[10px] text-[12.5px] font-medium transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface2)",
                      color: loadingMore ? "var(--color-text-dim)" : "var(--color-text-muted)",
                      cursor: loadingMore ? "default" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{
                            border: "1.5px solid var(--color-border)",
                            borderTopColor: "var(--color-primary)",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        Loading…
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                        Load more
                      </>
                    )}
                  </button>
                </div>
              )}

              {filter === "All" && !nextCursor && filtered.length > 0 && (
                <div className="px-4 pt-2.5 pb-1.5 text-center text-[11.5px]" style={{ color: "var(--color-text-dim)" }}>
                  End of history
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {anySelected && (
          <BulkBar
            count={selected.size}
            total={filtered.length}
            allSelected={allVisibleSelected}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />
        )}
      </div>
    </AppPage>
  );
}