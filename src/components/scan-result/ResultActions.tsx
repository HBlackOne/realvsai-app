"use client";

/**
 * ResultActions — primary "Scan another" CTA + secondary "View history".
 * Wire onScanAnother / onViewHistory to your router push handlers.
 */

type Props = {
  onScanAnother?: () => void;
  onViewHistory?: () => void;
  scanLabel?: string;
  historyLabel?: string;
};

export function ResultActions({
  onScanAnother,
  onViewHistory,
  scanLabel = "Scan another",
  historyLabel = "View history",
}: Props) {
  return (
    <div
      className="flex flex-col gap-2"
      style={{ animation: "scanResultUp 0.4s 0.24s ease both" }}
    >
      <button
        type="button"
        onClick={onScanAnother}
        className="w-full rounded-[14px] py-3.5 text-[14px] font-extrabold cursor-pointer transition-transform active:scale-[0.97] active:opacity-85"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-bg)",
          border: "none",
          boxShadow: "0 0 24px rgba(138,180,248,0.18)",
          fontFamily: "inherit",
        }}
      >
        {scanLabel}
      </button>
      <button
        type="button"
        onClick={onViewHistory}
        className="w-full rounded-[14px] py-[13px] text-[14px] font-semibold cursor-pointer transition-colors active:scale-[0.97] hover:bg-[var(--color-surface2)]"
        style={{
          background: "transparent",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          fontFamily: "inherit",
        }}
      >
        {historyLabel}
      </button>
    </div>
  );
}
