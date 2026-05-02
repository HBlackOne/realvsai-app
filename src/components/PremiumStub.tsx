import type { ReactNode } from "react";
import { AppPage, AppPageHeader, AppSectionHeader } from "@/components/app-shell/AppPage";

export default function PremiumStub({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader title={title} description={desc} />

      <div className="mt-8">
        <AppSectionHeader title="Coming soon" />
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-dim">
            {icon}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text">{title}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-text-muted">{desc}</p>
          <span className="mt-5 inline-flex rounded-lg border border-primary/20 bg-primary-dim px-4 py-1.5 text-sm font-medium text-primary">
            Coming soon
          </span>
        </div>
      </div>
    </AppPage>
  );
}
