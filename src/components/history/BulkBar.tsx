"use client";

interface BulkBarProps {
  count: number;
  total: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BulkBar({ count, total, allSelected, onSelectAll, onDeselectAll }: BulkBarProps) {
  return (
    <div className="sticky bottom-6 z-50 mt-4">
      <div className="max-w-[860px] mx-auto">
        <div
          className="flex items-center gap-2.5 rounded-[16px] px-4 py-3 flex-wrap"
          style={{
            background: "var(--color-surface2)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(126,170,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(126,170,255,0.09)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
              {count} scan{count !== 1 ? "s" : ""} selected
            </span>
            <span className="text-[11.5px]" style={{ color: "var(--color-text-dim)" }}>of {total}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="px-3 py-[7px] rounded-[9px] text-[12px] font-medium transition-all"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface3)",
                color: "var(--color-text-muted)",
                fontFamily: "inherit",
              }}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>

            <button
              onClick={onDeselectAll}
              className="px-3 py-[7px] rounded-[9px] text-[12px] font-medium transition-all"
              style={{
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-dim)",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>

            <button
              disabled
              title="Bulk delete will be wired later"
              className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[9px] text-[12px] font-semibold opacity-80"
              style={{
                border: "1px dashed rgba(255,107,107,.18)",
                background: "rgba(255,107,107,.05)",
                color: "rgba(255,107,107,.58)",
                cursor: "default",
                fontFamily: "inherit",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
              </svg>
              Delete later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
