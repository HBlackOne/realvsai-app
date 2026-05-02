import { X } from "lucide-react";
import { AppButton, appButtonStyles } from "@/components/app-shell/AppButton";
import { InfoMiniCard } from "./shared";

export default function ConfirmModal({
  title,
  cost,
  balance,
  onClose,
  onConfirm,
}: {
  title: string;
  cost: number;
  balance: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">Confirm this scan before balance is used.</p>
          </div>
          <button onClick={onClose} className={appButtonStyles({ variant: "secondary", size: "icon", className: "text-text-muted" })}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoMiniCard label="This scan costs" value={`${cost} units`} />
          <InfoMiniCard label="Your balance" value={`${balance} units`} />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
          Balance should only be deducted after a successful result.
        </div>

        <div className="mt-5 flex gap-3">
          <AppButton onClick={onClose} variant="secondary" size="lg" className="flex-1">
            Cancel
          </AppButton>
          <AppButton onClick={onConfirm} variant="primary" size="lg" className="flex-1">
            Start scan
          </AppButton>
        </div>
      </div>
    </div>
  );
}
