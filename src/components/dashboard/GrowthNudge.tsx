"use client";

interface GrowthNudgeProps {
  message: {
    title: string;
    body: string;
    cta: string;
    ctaHref: string;
  } | null;
}

export function GrowthNudge({ message }: GrowthNudgeProps) {
  if (!message) return null;

  return (
    <div className="rounded-[14px] border border-primary/20 bg-primary-dim px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-primary/15">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-primary">{message.title}</p>
          <p className="mt-0.5 text-[12.5px] text-text-muted">{message.body}</p>
        </div>
        <a
          href={message.ctaHref}
          className="flex-shrink-0 rounded-[9px] bg-primary px-3 py-1.5 text-[12px] font-bold text-bg transition-colors hover:bg-primary-hover"
        >
          {message.cta}
        </a>
      </div>
    </div>
  );
}
