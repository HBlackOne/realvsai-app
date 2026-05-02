"use client";

interface PlanCardProps {
  plan?: string;
  onUpgrade?: () => void;
  paid?: boolean;
}

const FREE_FEATURES = [
  { text: "Image, audio & video included", ok: true },
  { text: "Deep video detection", ok: false },
  { text: "Higher monthly credits", ok: false },
  { text: "Priority processing", ok: false },
  { text: "Advanced usage limits", ok: false },
  { text: "Billing & upgrade controls", ok: false },
];

const PAID_FEATURES = [
  { text: "Monthly credits included", ok: true },
  { text: "Image, audio & video included", ok: true },
  { text: "Deep video detection", ok: false },
  { text: "Priority processing", ok: true },
  { text: "Locked plan pricing", ok: true },
  { text: "Billing & upgrade controls", ok: true },
];

export function PlanCard({ plan = "Free Trial", onUpgrade, paid = false }: PlanCardProps) {
  const features = paid ? PAID_FEATURES : FREE_FEATURES;

  return (
    <section
      className="relative overflow-hidden rounded-[18px] border"
      style={{
        background: "linear-gradient(140deg,var(--color-surface) 0%, rgba(19,19,20,0.96) 100%)",
        borderColor: "rgba(138,180,248,0.12)",
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full" style={{ background: "rgba(138,180,248,0.11)", filter: "blur(40px)" }} />

      <div className="relative p-4">
        <div className="mb-4 flex flex-col gap-2">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[12px] font-semibold text-text">{plan}</span>
          </div>

          {features.slice(0, 4).map((feature, index) => (
            <div key={`${feature.text}-${index}`} className="flex items-center gap-2.5">
              {feature.ok ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <span className={`text-[13px] ${feature.ok ? "text-text" : "text-text-muted"}`}>{feature.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full cursor-pointer rounded-[12px] border border-primary/20 bg-primary/10 py-2.5 text-[13.5px] font-semibold tracking-tight text-primary transition-colors hover:border-primary/35 hover:bg-primary/14 font-['DM_Sans']"
        >
          {paid ? "Manage subscription" : "Upgrade plan"}
        </button>
        <p className="mt-2 text-center text-[12px] text-text-muted">{paid ? "Billing, credits, and plan details" : "Unlock video detection + stronger limits"}</p>
      </div>
    </section>
  );
}
