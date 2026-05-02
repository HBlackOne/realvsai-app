export default function BalanceCardLoader() {
  return (
    <div className="mt-3 rounded-2xl bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">Current balance</p>

      <div className="mt-4 rounded-xl bg-bg px-5 py-5 text-center">
        <div className="mx-auto w-fit">
          <span className="balance-shimmer block h-9 w-36 rounded-xl" />
        </div>
      </div>

      <div className="mt-4 text-left">
        <p className="text-[11px] text-text-muted">Recently added</p>
        <span className="balance-shimmer mt-2 block h-4 w-24 rounded-full" />
      </div>
    </div>
  );
}
