import { Upload, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatBytes } from "./utils";

export default function UploadPanel({
  title,
  subtitle,
  helper,
  buttonLabel,
  file,
  onBrowse,
  onClear,
  icon: Icon,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  helper: string;
  buttonLabel: string;
  file: File | null;
  onBrowse: () => void;
  onClear: () => void;
  icon: LucideIcon;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        </div>
        <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] text-text-muted/80">
          {disabled ? "Locked during scan" : "Single file"}
        </span>
      </div>

      {!file ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dim">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium">Drop your file here</p>
          <p className="mt-1 text-xs text-text-muted">or browse from your device</p>
          <button
            onClick={onBrowse}
            disabled={disabled}
            className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-bg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-dim">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{file.name}</p>
                <p className="mt-1 text-xs text-text-muted">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              onClick={onClear}
              disabled={disabled}
              className="rounded-xl bg-surface p-2 text-text-muted transition hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {helper ? <div className="mt-3 text-xs text-text-muted">{helper}</div> : null}
    </div>
  );
}
