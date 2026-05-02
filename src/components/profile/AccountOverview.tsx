"use client";

import { User, Zap, DollarSign, ShieldCheck } from "lucide-react";
import { AppSection } from "@/components/app-shell/AppPage";

interface Props {
  fullName: string;
  email: string;
  loading: boolean;
  statusText: string;
  planLabel: string;
  credits: number;
}

export function AccountOverview({ fullName, email, loading, statusText, planLabel, credits }: Props) {
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppSection title="Account overview" icon="M20 21a8 8 0 1 0-16 0m12-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary-dim text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {initials ? (
            <span className="text-xl font-bold tracking-tight">{initials}</span>
          ) : (
            <User className="h-7 w-7" />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold tracking-tight text-text">{fullName}</p>
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              {loading ? "Loading your account" : statusText}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">{email || "No email available"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <StatPill icon={<Zap className="h-3.5 w-3.5" />} label="Plan" value={planLabel} colorClass="text-primary" />
        <StatPill icon={<DollarSign className="h-3.5 w-3.5" />} label="Credits" value={credits.toLocaleString()} colorClass="text-warning" />
        <StatPill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Status" value="Verified" colorClass="text-success" />
      </div>
    </AppSection>
  );
}

function StatPill({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface3 px-3.5 py-2">
      <span className={colorClass}>{icon}</span>
      <div>
        <div className="text-[11px] font-medium text-text-dim">{label}</div>
        <div className="mt-0.5 text-[13px] font-semibold text-text">{value}</div>
      </div>
    </div>
  );
}
