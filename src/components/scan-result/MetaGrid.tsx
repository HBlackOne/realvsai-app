"use client";

/**
 * MetaGrid — 2×2 grid of small meta values (credits, processing time, type, status).
 * The "status" cell uses --color-success when status is "Completed".
 */

export type MetaItem = {
  key: string;
  value: string;
  /** When true, value is rendered in the success color */
  success?: boolean;
};

export function MetaGrid({ items }: { items: MetaItem[] }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 rounded-[18px] px-[18px] py-3.5 mb-2.5"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        animation: "scanResultUp 0.4s 0.18s ease both",
      }}
    >
      {items.map((m) => (
        <div key={m.key}>
          <p
            className="text-[10px] uppercase tracking-[0.1em] mb-[3px]"
            style={{ color: "var(--color-text-dim)" }}
          >
            {m.key}
          </p>
          <p
            className="text-[13px] font-semibold"
            style={{
              color: m.success ? "var(--color-success)" : "var(--color-text)",
            }}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
