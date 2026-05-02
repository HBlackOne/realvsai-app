"use client";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  user?: { name: string; plan: string; credits: number };
  onHamburger?: () => void;
  onUpgrade?: () => void;
  upgradeLabel?: string;
}

export function DashboardHeader({
  title = "RealvsAI",
  subtitle = "AI Authenticity scanner",
  user = { name: "Alex Carter", plan: "Free Trial", credits: 10 },
  onHamburger,
  onUpgrade,
  upgradeLabel = "Upgrade",
}: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-8 lg:left-[220px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburger}
          className="hidden p-2 text-text-dim transition-colors hover:text-text lg:inline-flex"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-text">{title}</span>
          <span className="mt-1 text-[11px] font-medium text-text-dim">{subtitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUpgrade}
          className="cursor-pointer rounded-full border-none bg-primary px-4 py-2 text-[14px] font-bold text-bg shadow-[0_0_16px_rgba(138,180,248,0.25)] transition-colors hover:bg-primary-hover"
        >
          {upgradeLabel}
        </button>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface2 px-3.5 py-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-[14px] font-bold text-text">{user.credits}</span>
          <span className="hidden text-[13px] text-text-dim sm:inline">credits</span>
        </div>

      </div>
    </header>
  );
}
