export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">System overview and management</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <AdminStat label="Total users" value="0" />
        <AdminStat label="Total scans" value="0" />
        <AdminStat label="Active plans" value="0" />
        <AdminStat label="Errors" value="0" />
      </div>
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
