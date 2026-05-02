"use client";

interface FilterPillsProps {
  active: string;
  onChange: (value: string) => void;
}

const FILTERS = [
  { label: "All", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { label: "Image", icon: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" },
  { label: "Video", icon: "M15 10l4.553-2.07A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.916L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" },
  { label: "Audio", icon: "M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4" },
];

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-[7px]">
      {FILTERS.map((f) => {
        const on = active === f.label;
        return (
          <button
            key={f.label}
            onClick={() => onChange(f.label)}
            className="inline-flex items-center gap-1.5 px-[13px] py-[6px] rounded-[9px] text-[12px] transition-all"
            style={{
              border: `1px solid ${on ? "rgba(126,170,255,.25)" : "var(--color-border)"}`,
              background: on ? "rgba(126,170,255,0.09)" : "var(--color-surface)",
              color: on ? "var(--color-primary)" : "var(--color-text-muted)",
              fontWeight: on ? 600 : 400,
              fontFamily: "inherit",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={f.icon} />
            </svg>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
