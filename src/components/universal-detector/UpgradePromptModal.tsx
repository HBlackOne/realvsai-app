import { X, Zap } from "lucide-react";
import { appButtonStyles } from "@/components/app-shell/AppButton";
import Link from "next/link";

export default function UpgradePromptModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold">Premium required</h3>
          </div>
          <button
            onClick={onClose}
            className={appButtonStyles({ variant: "secondary", size: "icon", className: "text-text-muted" })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text">Deep Video scan</span> requires an active Premium plan. This unlocks:
          </p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Unlimited video deep scans
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Full trial balance
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Wallet + card top-ups
            </li>
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className={appButtonStyles({ variant: "ghost", size: "md", className: "flex-1" })}
          >
            Not now
          </button>
          <Link href="/credits" className={appButtonStyles({ variant: "primary", size: "md", className: "flex-1 text-center" })} onClick={onClose}>
            Start trial
          </Link>
        </div>
      </div>
    </div>
  );
}
