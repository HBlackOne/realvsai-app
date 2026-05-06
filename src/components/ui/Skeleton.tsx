export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-surface-hover ${className ?? ""}`} />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return (
    <span className={`block h-4 w-24 animate-pulse rounded-full bg-surface-hover ${className ?? ""}`} />
  );
}

export function SkeletonNumber({ className }: { className?: string }) {
  return (
    <span className={`block h-8 w-16 animate-pulse rounded-full bg-surface-hover ${className ?? ""}`} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`h-24 w-full animate-pulse rounded-[18px] bg-surface-hover ${className ?? ""}`} />
  );
}
