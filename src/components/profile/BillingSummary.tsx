"use client";

import { CreditCard, Flag, Mail, ReceiptText, ShieldCheck, Sparkles, User } from "lucide-react";

interface Props {
  billingName: string;
  billingEmail: string;
  billingCountry: string;
  billingAccount: string;
  paymentStatus: string;
}

export function BillingSummary({
  billingName,
  billingEmail,
  billingCountry,
  billingAccount,
  paymentStatus,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary-dim p-4">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-text">Billing details finalized after live purchase</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Only billing data tied to a real purchase is shown here. Test-mode entries are excluded from this view.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border-subtle">
        <BillingRow icon={<User className="h-4 w-4" />} label="Billing name" value={billingName} />
        <BillingRow icon={<Mail className="h-4 w-4" />} label="Billing email" value={billingEmail} />
        <BillingRow icon={<Flag className="h-4 w-4" />} label="Country" value={billingCountry} />
        <BillingRow icon={<ReceiptText className="h-4 w-4" />} label="Billing account" value={billingAccount} />
        <BillingRow icon={<ShieldCheck className="h-4 w-4" />} label="Payment status" value={paymentStatus} accentClass="text-success" />

        <div className="flex items-center gap-3 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface3 text-text-dim">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-text-dim">Current note</p>
            <p className="mt-0.5 text-sm text-text-muted">Live purchase review pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingRow({
  icon,
  label,
  value,
  accentClass = "text-text-dim",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface3 ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-text-dim">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  );
}
