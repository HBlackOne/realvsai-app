import { Award } from "lucide-react";

export default async function BadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-md flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-dim">
        <Award className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Badge</h1>
      <p className="mt-1 text-sm text-text-muted">Badge ID: {id}</p>
      <span className="mt-4 rounded-lg bg-primary-dim px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">Coming soon</span>
    </div>
  );
}
