import { X } from "lucide-react";
import { appButtonStyles } from "@/components/app-shell/AppButton";

export default function CheckoutConfirmModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  loading = false,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
          <button
            onClick={onClose}
            className={appButtonStyles({ variant: "secondary", size: "icon", className: "text-text-muted" })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
          You’ll be redirected to secure checkout to continue.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={appButtonStyles({ variant: "ghost", size: "md", className: "flex-1" })}
          >
            Not now
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={appButtonStyles({ variant: "primary", size: "md", className: "flex-1" })}
          >
            {loading ? "Redirecting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
