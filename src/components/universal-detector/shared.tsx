import type { LucideIcon } from "lucide-react";

export function HeaderStat({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl bg-bg px-4 py-3">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClassName}`} />
        <span className="text-lg font-semibold text-text">{value}</span>
      </div>
    </div>
  );
}

export function StatusChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-bg px-4 py-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

export function InfoMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg px-4 py-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

export function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-bg p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

export function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-text-muted">{(score * 100).toFixed(0)}%</span>
    </div>
  );
}
