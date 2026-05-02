"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, Home, ScanLine, User } from "lucide-react";

type BottomNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  primary?: boolean;
};

const ITEMS: BottomNavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/scan", label: "Scan", icon: ScanLine, primary: true },
  { href: "/credits", label: "Credits", icon: CreditCard },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-5 items-center px-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] transition ${
                item.primary
                  ? active
                    ? "text-primary"
                    : "text-text"
                  : active
                  ? "text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-2xl ${
                  item.primary
                    ? active
                      ? "h-11 w-11 bg-primary-dim text-primary"
                      : "h-11 w-11 bg-bg text-text"
                    : "h-9 w-9"
                }`}
              >
                <Icon className={item.primary ? "h-5 w-5" : "h-4.5 w-4.5"} />
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
