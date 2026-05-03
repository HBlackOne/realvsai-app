export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface2 ${className ?? ""}`}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={`h-4 w-24 ${className ?? ""}`} />;
}

export function SkeletonNumber({ className }: { className?: string }) {
  return <Skeleton className={`h-8 w-16 ${className ?? ""}`} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={`h-24 w-full rounded-[18px] ${className ?? ""}`} />;
}
