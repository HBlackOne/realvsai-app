"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  X,
  Shield,
  ScanLine,
  Eye,
  Users,
  Bell,
  Key,
  TerminalSquare,
  LayoutDashboard,
  History,
  CreditCard,
  Settings,
  Languages,
  LogOut,
  User,
  Activity,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Coins,
} from "lucide-react";
import { useLang } from "@/components/LangProvider";
import { useAppMe } from "@/hooks/use-app-me";

const GUEST_URL = process.env.NEXT_PUBLIC_GUEST_URL || "https://realvs.ai";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  href: string;
  soon?: boolean;
};

function getGreeting(isRtl: boolean) {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return isRtl ? "صباح الخير ☀️" : "Good morning ☀️";
  if (h >= 12 && h < 17) return isRtl ? "مساء الخير 🌤️" : "Good afternoon 🌤️";
  if (h >= 17 && h < 21) return isRtl ? "مساء النور 🌇" : "Good evening 🌇";
  return isRtl ? "تصبح على خير 🌙" : "Good night 🌙";
}

const MAIN_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard className="h-4 w-4 text-text-muted" />, label: "Dashboard", labelAr: "لوحة التحكم", href: "/dashboard" },
  { icon: <ScanLine className="h-4 w-4 text-primary" />, label: "Universal Detector", labelAr: "الكاشف الشامل", href: "/scan" },
  { icon: <History className="h-4 w-4 text-text-muted" />, label: "Scan History", labelAr: "سجل الفحص", href: "/history" },
  { icon: <CreditCard className="h-4 w-4 text-warning" />, label: "Wallet & Billing", labelAr: "المحفظة والفوترة", href: "/credits" },
  { icon: <MessageSquare className="h-4 w-4 text-primary" />, label: "Messages", labelAr: "الرسائل", href: "/messages" },
  { icon: <User className="h-4 w-4 text-text-muted" />, label: "Profile", labelAr: "الملف الشخصي", href: "/profile" },
  { icon: <Settings className="h-4 w-4 text-text-muted" />, label: "Settings", labelAr: "الإعدادات", href: "/settings" },
];

const MORE_ITEMS: NavItem[] = [
  { icon: <Activity className="h-4 w-4 text-primary" />, label: "Local Detector", labelAr: "الكاشف المحلي", href: "/local-detector", soon: true },
  { icon: <Eye className="h-4 w-4 text-primary" />, label: "Profile Monitor", labelAr: "مراقبة الملفات", href: "/monitor", soon: true },
  { icon: <Shield className="h-4 w-4 text-success" />, label: "Creator", labelAr: "المبدع", href: "/creator", soon: true },
  { icon: <Users className="h-4 w-4 text-text-muted" />, label: "Team", labelAr: "الفريق", href: "/team", soon: true },
  { icon: <Bell className="h-4 w-4 text-warning" />, label: "Webhooks", labelAr: "الويب هوكس", href: "/webhooks", soon: true },
  { icon: <Key className="h-4 w-4 text-primary" />, label: "API Keys", labelAr: "مفاتيح API", href: "/api-keys", soon: true },
  { icon: <TerminalSquare className="h-4 w-4 text-text-muted" />, label: "Developers", labelAr: "المطورون", href: "/developers", soon: true },
];

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SideDrawer({ open, onClose }: SideDrawerProps) {
  const pathname = usePathname();
  const { lang, setLang, isRtl } = useLang();
  const clerk = useClerk();
  const { me } = useAppMe();
  const onCloseRef = useRef(onClose);
  const [moreOpen, setMoreOpen] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    onCloseRef.current();
  }, [pathname]);

  const slideClass = open ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full";
  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || "Your account";
  const balanceText = me?.wallet ? `${me.wallet.balance} ${me.wallet.currency}` : "0 units";
  const unreadMessages = me?.unreadMessagesCount ?? 0;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`fixed top-0 ${isRtl ? "right-0" : "left-0"} z-[70] flex h-full w-72 max-w-[85vw] flex-col border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          isRtl ? "border-l" : "border-r"
        } ${slideClass}`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-sm font-bold">RealvsAi</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-3 mb-3 rounded-2xl bg-bg p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary-dim text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14px] font-semibold text-text">{fullName}</p>
                {unreadMessages > 0 ? <span className="h-2 w-2 shrink-0 rounded-full bg-danger" /> : null}
              </div>
              <p className="truncate text-[12px] text-text-muted">{getGreeting(isRtl)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface px-3 py-3">
              <div className="flex items-center gap-2 text-text-muted">
                <Coins className="h-3.5 w-3.5 text-warning" />
                <span className="text-[11px]">{isRtl ? "الرصيد" : "Balance"}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-warning">{balanceText}</p>
            </div>
            <div className="rounded-xl bg-surface px-3 py-3">
              <div className="flex items-center gap-2 text-text-muted">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px]">{isRtl ? "الرسائل" : "Messages"}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-text">{unreadMessages}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div>
            <h2 className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-text-dim">
              {isRtl ? "التنقل" : "Navigation"}
            </h2>
            <div className="mt-2 space-y-1">
              {MAIN_ITEMS.map((item) => (
                <NavLink key={item.label} item={item} isRtl={isRtl} pathname={pathname} onClose={onClose} />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={() => setMoreOpen((value) => !value)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-muted transition hover:bg-surface-hover hover:text-text"
            >
              <span className="flex-1 text-start text-[13px] font-medium">{isRtl ? "المزايا المميزة" : "Premium features"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>

            {moreOpen && (
              <div className="mt-2 space-y-1">
                {MORE_ITEMS.map((item) => (
                  <NavLink key={item.label} item={item} isRtl={isRtl} pathname={pathname} onClose={onClose} compact />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-3 py-3">
          <div className="space-y-1">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-muted transition hover:bg-bg hover:text-text"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg">
                <Languages className="h-4 w-4" />
              </span>
              <span>{isRtl ? "English" : "العربية"}</span>
            </button>

            <button
              onClick={() => {
                clerk.signOut({ redirectUrl: GUEST_URL });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-danger transition hover:bg-danger/10"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-danger/10">
                <LogOut className="h-4 w-4" />
              </span>
              <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({
  item,
  isRtl,
  pathname,
  onClose,
  compact = false,
}: {
  item: NavItem;
  isRtl: boolean;
  pathname: string | null;
  onClose: () => void;
  compact?: boolean;
}) {
  const active = pathname === item.href && !item.soon;

  return (
    <Link
      href={item.soon ? "#" : item.href}
      onClick={(e) => {
        if (item.soon) {
          e.preventDefault();
          return;
        }
        onClose();
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active ? "bg-primary-dim font-medium text-primary" : "text-text-muted hover:bg-surface-hover hover:text-text"
      } ${item.soon ? "cursor-default opacity-60" : ""} ${compact ? "ps-5" : ""}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-hover">{item.icon}</span>
      <span className="flex-1 text-start text-[13px]">{isRtl ? item.labelAr : item.label}</span>
      {active && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
      {item.soon && (
        <span className="rounded-md border border-primary/20 bg-primary-dim px-2 py-0.5 text-[10px] font-semibold text-primary">
          {isRtl ? "قريباً" : "Soon"}
        </span>
      )}
    </Link>
  );
}
