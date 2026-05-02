"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shield, User, Coins, Settings, LogOut, MessageSquare } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAppMe } from "@/hooks/use-app-me";
import BalanceInlineLoader from "@/components/billing/BalanceInlineLoader";

const GUEST_URL = process.env.NEXT_PUBLIC_GUEST_URL || "https://realvs.ai";

export default function Header() {
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { me, loading } = useAppMe();
  const clerk = useClerk();
  const balanceTimeoutRef = useRef<number | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const balanceTextRef = useRef<HTMLSpanElement | null>(null);
  const [expandedBalanceWidth, setExpandedBalanceWidth] = useState(0);

  const trialBalance = me?.trial?.balance ?? 0;
  const walletBalance = me?.wallet?.balance ?? 0;
  const subscriptionBalance = me?.subscription?.subscriptionCreditBalance ?? 0;
  const hasSubscriptionCredits = subscriptionBalance > 0;

  const trialText = `Trial: ${trialBalance}`;
  const subText = `Sub: ${subscriptionBalance}`;
  const walletText = `Wallet: ${walletBalance}`;

  const balanceText = hasSubscriptionCredits
    ? `${trialText} · ${subText} · ${walletText}`
    : `${trialText} · ${walletText}`;

  useLayoutEffect(() => {
    const textWidth = balanceTextRef.current?.scrollWidth ?? 0;
    setExpandedBalanceWidth(textWidth > 0 ? textWidth + 52 : 0);
  }, [balanceText, loading]);

  useEffect(() => {
    return () => {
      if (balanceTimeoutRef.current) {
        window.clearTimeout(balanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  function showBalance() {
    setBalanceOpen(true);

    if (balanceTimeoutRef.current) {
      window.clearTimeout(balanceTimeoutRef.current);
    }

    balanceTimeoutRef.current = window.setTimeout(() => {
      setBalanceOpen(false);
    }, 3000);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border border-border bg-surface/80 px-3 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-primary-dim">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">RealvsAi</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={showBalance}
            style={{ width: balanceOpen && expandedBalanceWidth ? `${expandedBalanceWidth}px` : "40px" }}
            className="flex h-10 items-center justify-start overflow-hidden rounded-xl border border-border bg-surface px-0 text-text-muted transition-all duration-300 hover:bg-surface-hover hover:text-text"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
              <Coins className="h-5 w-5 text-warning" />
            </span>
            <span
              ref={balanceTextRef}
              className={`overflow-hidden whitespace-nowrap font-mono text-[13px] font-medium leading-none transition-all duration-300 ${
                balanceOpen ? "ml-0 max-w-[220px] pr-3 opacity-100" : "ml-0 max-w-0 pr-0 opacity-0"
              } text-text-muted`}
            >
              {loading ? <BalanceInlineLoader /> : `${balanceText} credits`}
            </span>
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition hover:bg-surface-hover hover:text-text"
            >
              <User className="h-5 w-5" />
            </button>

            <div
              className={`absolute right-0 top-[54px] w-40 rounded-2xl border border-border bg-surface p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-all duration-200 ${
                profileMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <Link
                href="/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-text-muted transition hover:bg-bg hover:text-text"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/messages"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-text-muted transition hover:bg-bg hover:text-text"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-text-muted transition hover:bg-bg hover:text-text"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  clerk.signOut({ redirectUrl: GUEST_URL });
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-danger transition hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
