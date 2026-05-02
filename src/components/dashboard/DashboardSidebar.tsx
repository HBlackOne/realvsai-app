"use client";

import { useEffect, useState } from "react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 0-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4" },
  { id: "scan", label: "New Scan", icon: "M12 5v14M5 12h14" },
  { id: "history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { id: "results", label: "Results", icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { id: "api", label: "API", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface SidebarProps {
  activePage?: string;
  onNav?: (id: string) => void;
  onAction?: (id: string) => void;
  user?: { name: string; plan: string; credits: number };
}

function SidebarContent({ activePage = "dashboard", onNav, onClose, user }: SidebarProps & { onClose?: () => void }) {
  const u = user ?? { name: "Alex Carter", plan: "Free Trial", credits: 10 };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <span className="text-[16px] font-bold tracking-tight text-text">
            realvs<span className="text-primary">.</span>ai
          </span>
        </div>
        {onClose ? (
          <button onClick={onClose} className="p-1 text-text-dim transition-colors hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
        {NAV.map((item) => {
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav?.(item.id);
                onClose?.();
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[14.5px] font-medium transition-all duration-150
                ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-text-muted hover:bg-surface2 hover:text-text"}`}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface2 text-[14px] font-bold text-primary">
            {u.name.trim().charAt(0).toUpperCase() || "R"}
          </div>
          <div className="overflow-hidden">
            <div className="truncate text-[13.5px] font-semibold text-text">{u.name}</div>
            <div className="truncate text-[12px] text-text-dim">{u.plan} · {u.credits} credits</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] flex-shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

export function MobileDrawer({ open, onClose, ...props }: SidebarProps & { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
      <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-border bg-surface lg:hidden animate-[slideIn_0.28s_cubic-bezier(0.4,0,0.2,1)_both]">
        <SidebarContent {...props} onClose={onClose} />
      </aside>
    </>
  );
}

const BOTTOM_NAV = [
  { id: "dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 0-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4" },
  { id: "api", label: "Credit", icon: "$" },
  { id: "scan", label: "Scan", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", accent: true },
  { id: "history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { id: "profile", label: "Profile", icon: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
];

export function BottomNav({ activePage = "dashboard", onNav, onAction }: SidebarProps) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 flex items-center gap-1 border-t border-border bg-surface px-2 lg:hidden">
      {BOTTOM_NAV.map((item) => {
        const isActive = item.id === activePage;
        const usesAction = item.id === "api" || item.id === "profile";
        return (
          <button
            key={item.id}
            onClick={() => (usesAction ? onAction?.(item.id) : onNav?.(item.id))}
            className="flex flex-1 flex-col items-center gap-1 border-none bg-transparent py-2 pb-3 px-1"
          >
            {item.accent ? (
              <div className="-mt-5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary shadow-[0_0_20px_rgba(138,180,248,0.35)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </div>
            ) : item.icon === "$" ? (
              <div
                className="text-[21px] font-normal leading-none"
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-dim)" }}
              >
                $
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "var(--color-primary)" : "var(--color-text-dim)"} strokeWidth={isActive ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            )}
            <span className={`text-[11px] font-medium leading-none ${item.accent ? "text-primary" : isActive ? "text-primary" : "text-text-dim"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

interface MobileActionSheetProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  anchor?: "center" | "credit" | "profile";
  widthClass?: string;
}

export function MobileActionSheet({ open, title, subtitle, onClose, children, anchor = "center", widthClass = "w-[252px]" }: MobileActionSheetProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setRendered(false), 220);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!rendered) return null;

  const anchorClass = anchor === "credit"
    ? "left-[24%] -translate-x-1/2"
    : anchor === "profile"
      ? "right-[10px]"
      : "left-1/2 -translate-x-1/2";

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-200 lg:hidden ${visible ? "opacity-100 bg-black/30" : "pointer-events-none opacity-0 bg-black/0"}`}
      />
      <div className={`pointer-events-none fixed bottom-[74px] z-50 ${widthClass} max-w-[calc(100vw-20px)] ${anchorClass} lg:hidden`}>
        <div
          className={`pointer-events-auto transition-all duration-200 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
        >
          <div className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
            {(title || subtitle) ? (
              <div className="px-3 pb-1.5 pt-3 text-center">
                {title ? <div className="text-[15px] font-semibold text-text">{title}</div> : null}
                {subtitle ? <div className="mt-1 text-[12px] text-text-dim">{subtitle}</div> : null}
              </div>
            ) : null}
            <div className="px-2 pb-2 pt-2">{children}</div>
          </div>
          
        </div>
      </div>
    </>
  );
}
