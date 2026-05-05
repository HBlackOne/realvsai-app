export function Skeleton({ className }: { className?: string }) {
  return <div className={`balance-shimmer rounded-md ${className ?? ""}`} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return (
    <span className={`balance-shimmer block h-4 w-24 rounded-full ${className ?? ""}`} />
  );
}

export function SkeletonNumber({ className }: { className?: string }) {
  return (
    <span className={`balance-shimmer block h-8 w-16 rounded-full ${className ?? ""}`} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`balance-shimmer h-24 w-full rounded-[18px] ${className ?? ""}`} />
  );
}
