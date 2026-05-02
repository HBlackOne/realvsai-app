"use client";

interface Last7DaysCardProps {
  chartData?: { day: string; v: number }[];
}

const DEFAULT_CHART = [
  { day: "M", v: 0 },
  { day: "T", v: 1 },
  { day: "W", v: 0 },
  { day: "T", v: 2 },
  { day: "F", v: 3 },
  { day: "S", v: 0 },
  { day: "S", v: 1 },
];

export function Last7DaysCard({ chartData = DEFAULT_CHART }: Last7DaysCardProps) {
  const total = chartData.reduce((sum, item) => sum + item.v, 0);

  if (total === 0) {
    return (
      <section className="rounded-[18px] border border-border/70 bg-surface p-4">
        <div className="flex min-h-[148px] flex-col items-center justify-center gap-2.5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border bg-surface2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-text-muted">No stats yet</p>
          <p className="text-[13px] text-text-dim">No activity yet</p>
        </div>
      </section>
    );
  }

  const maxV = Math.max(...chartData.map((d) => d.v), 1);

  return (
    <section className="rounded-[18px] border border-border/70 bg-surface p-4">
      <div className="flex h-32 items-end gap-2">
        {chartData.map((d, index) => (
          <div key={`${d.day}-${index}`} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-[6px] transition-all duration-500"
                style={{
                  height: d.v > 0 ? `${(d.v / maxV) * 100}%` : "6px",
                  minHeight: d.v > 0 ? 10 : 6,
                  background: d.v > 0 ? "var(--color-primary)" : "var(--color-surface2)",
                }}
              />
            </div>
            <span className="text-[10px] text-text-dim">{d.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
