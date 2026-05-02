export function CreditPackCard({
  amount,
  price,
  per,
  popular,
}: {
  amount: number;
  price: string;
  per?: string;
  popular?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${popular ? "bg-primary-dim ring-1 ring-border-subtle" : "bg-surface"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-dim">Top-up option</p>
          <p className="mt-3 text-3xl font-semibold text-text">{amount} units</p>
          <p className="mt-1 text-sm text-text-muted">Use balance across image, audio, and video scans</p>
        </div>
        {popular ? (
          <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-primary">Most popular</span>
        ) : null}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 rounded-xl bg-bg px-4 py-3">
        <div>
          <p className="text-[11px] text-text-muted">Price</p>
          <p className="mt-1 text-2xl font-semibold text-text">{price}</p>
        </div>
        {per ? (
          <div className="text-right">
            <p className="text-[11px] text-text-muted">Rate</p>
            <p className="mt-1 text-sm font-medium text-text">{per}/unit</p>
          </div>
        ) : null}
      </div>

      <button
        className={`mt-4 w-full rounded-xl py-2.5 text-sm font-medium transition ${
          popular ? "bg-primary text-bg hover:bg-primary-hover" : "bg-bg text-text hover:bg-surface-hover"
        }`}
      >
        Available soon
      </button>
    </div>
  );
}

export function CostBlock({ label, cost }: { label: string; cost: string }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-3 text-center">
      <p className="text-2xl font-semibold">{cost}</p>
      <p className="mt-0.5 text-xs text-text-muted">{label}</p>
    </div>
  );
}
