import { Film, Link as LinkIcon, Upload, X } from "lucide-react";
import type { VideoSource } from "./types";
import { formatBytes } from "./utils";

export default function VideoInputPanel({
  videoSource,
  setVideoSource,
  videoUrl,
  setVideoUrl,
  file,
  onBrowse,
  onClear,
  disabled = false,
}: {
  videoSource: VideoSource;
  setVideoSource: (value: VideoSource) => void;
  videoUrl: string;
  setVideoUrl: (value: string) => void;
  file: File | null;
  onBrowse: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Video input</h2>
          <p className="mt-1 text-xs text-text-muted">Upload a file or paste a media link to analyze.</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-bg p-1">
          <button
            onClick={() => setVideoSource("url")}
            disabled={disabled}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              videoSource === "url" ? "bg-primary-dim text-primary" : "text-text-muted"
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setVideoSource("file")}
            disabled={disabled}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              videoSource === "file" ? "bg-primary-dim text-primary" : "text-text-muted"
            }`}
          >
            File
          </button>
        </div>
      </div>

      {videoSource === "url" ? (
        <div className="mt-4 rounded-2xl bg-bg p-4">
          <label className="text-sm font-medium">Paste a video URL</label>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-3">
            <LinkIcon className="h-4 w-4 shrink-0 text-text-dim" />
            <input
              type="url"
              value={videoUrl}
              disabled={disabled}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://tiktok.com/@user/video/..."
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-text-dim disabled:cursor-not-allowed disabled:opacity-60"
            />
            {videoUrl && (
              <button onClick={() => setVideoUrl("")} disabled={disabled} className="text-text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-dim">
            {["TikTok", "YouTube", "Instagram", "Facebook"].map((item) => (
              <span key={item} className="rounded-full bg-bg px-2.5 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {!file ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg p-6 text-center sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dim">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-sm font-medium">Drop your video here</p>
              <p className="mt-1 text-xs text-text-muted">MP4, MOV, WEBM up to 100MB</p>
              <button
                onClick={onBrowse}
                disabled={disabled}
                className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Browse video
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-dim">
                    <Film className="h-5 w-5 text-primary" />
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
        </div>
      )}
    </div>
  );
}
