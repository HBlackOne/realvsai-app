import type { ReactNode } from "react";

export function AppPage({ children, className = "max-w-[1100px]" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full px-4 pb-16 pt-5 md:px-6 md:pt-6 lg:px-8 ${className}`}>{children}</div>;
}

export function AppPageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-[-0.025em] text-text">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-[13px] leading-6 text-text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

export function TitleIcon({ d, size = 14, color = "var(--color-primary)" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function AppSectionHeader({
  title,
  action,
  icon,
  iconColor,
  className = "",
  titleClassName = "text-text",
  dividerClassName = "bg-border-subtle",
}: {
  title: ReactNode;
  action?: ReactNode;
  icon?: string;
  iconColor?: string;
  className?: string;
  titleClassName?: string;
  dividerClassName?: string;
}) {
  return (
    <div className={`mb-3.5 flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {icon ? <TitleIcon d={icon} color={iconColor} /> : null}
        <h2 className={`text-[11px] font-bold uppercase tracking-[0.12em] ${titleClassName}`}>{title}</h2>
      </div>
      <div className={`h-px flex-1 ${dividerClassName}`} />
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

export function AppSection({
  title,
  action,
  children,
  className = "",
  icon,
  iconColor,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: string;
  iconColor?: string;
}) {
  return (
    <section className={className}>
      <AppSectionHeader title={title} action={action} icon={icon} iconColor={iconColor} />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5">{children}</div>
    </section>
  );
}
