export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Pipeline</h1>
      <p className="mt-1 text-sm text-text-muted">Scan processing pipeline and job management</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-12 text-center">
        <p className="text-sm text-text-dim">No active jobs</p>
      </div>
    </div>
  );
}
