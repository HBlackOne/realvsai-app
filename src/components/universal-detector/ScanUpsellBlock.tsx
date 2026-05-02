import Link from "next/link";
import { ArrowRight, Crown, Wallet } from "lucide-react";
import { appButtonStyles } from "@/components/app-shell/AppButton";
import type { ScanUpsellState } from "./scan-upsell";

const ICON_BY_KIND = {
  "deep-video-locked": Crown,
  "low-credits": Wallet,
  "subscription-lite": Crown,
  trial: ArrowRight,
} as const;

export default function ScanUpsellBlock({ upsell }: { upsell: ScanUpsellState }) {
  const Icon = ICON_BY_KIND[upsell.kind];

  return (
    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-dim/10 p-4 sm:p-4.5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary-dim/70 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Next step</p>
          <p className="mt-2 text-sm font-semibold text-text">{upsell.title}</p>
          <p className="mt-1.5 text-sm leading-6 text-text-muted">{upsell.description}</p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Link href={upsell.primaryHref} className={appButtonStyles({ variant: "primary", size: "md", fullWidth: true })}>
              {upsell.primaryLabel}
            </Link>
            {upsell.secondaryHref && upsell.secondaryLabel ? (
              <Link href={upsell.secondaryHref} className={appButtonStyles({ variant: "secondary", size: "md", fullWidth: true })}>
                {upsell.secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
