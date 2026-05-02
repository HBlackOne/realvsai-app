"use client";

/**
 * shared.tsx — Settings page building blocks
 * Shared across all settings sections.
 */

import React from "react";

/* ─────────────────────────────────────────────
   SectionWrapper
   Same heading pattern as profile page sections.
───────────────────────────────────────────── */
export function SectionWrapper({
  title,
  icon,
  titleClass = "text-text",
  dividerClass = "bg-border-subtle",
  borderClass = "border-border",
  children,
}: {
  title:        string;
  icon?:        React.ReactNode;
  titleClass?:  string;
  dividerClass?: string;
  borderClass?: string;
  children:     React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="flex text-primary">{icon}</span> : null}
          <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${titleClass}`}>
            {title}
          </span>
        </div>
        <div className={`h-px flex-1 ${dividerClass}`} />
      </div>
      <div className={`overflow-hidden rounded-2xl border bg-surface ${borderClass}`}>
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Toggle
   Controlled on/off switch.
───────────────────────────────────────────── */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  pending = false,
}: {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
  pending?:  boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative h-[22px] w-10 flex-shrink-0 rounded-full border-none outline-none",
        "transition-[background,box-shadow] duration-200",
        pending && checked ? "bg-primary/35 shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]" : checked ? "bg-primary" : "bg-surface3",
        pending && !checked ? "shadow-[0_0_0_3px_color-mix(in_srgb,var(--text-dim)_10%,transparent)]" : "",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
          "transition-[left] duration-200",
          checked ? "left-[21px]" : "left-[3px]",
        ].join(" ")}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Badge
   Small status pill.
───────────────────────────────────────────── */
export function Badge({
  label,
  colorClass   = "text-text-muted",
  bgClass      = "bg-surface3",
  borderClass  = "border-border-subtle",
}: {
  label:        string;
  colorClass?:  string;
  bgClass?:     string;
  borderClass?: string;
}) {
  return (
    <span
      className={[
        "flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        colorClass, bgClass, borderClass,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   InfoRow
   Icon + title + desc + optional badge/action.
   Divider rendered between rows via CSS divide.
───────────────────────────────────────────── */
export function InfoRow({
  icon,
  iconBgClass = "bg-surface3",
  title,
  desc,
  badge,
  action,
  highlighted = false,
}: {
  icon:          React.ReactNode;
  iconBgClass?:  string;
  title:         string;
  desc:          string;
  badge?:        React.ReactNode;
  action?:       React.ReactNode;
  highlighted?:  boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-4 px-5 py-4 transition-[background,box-shadow] duration-500",
        highlighted ? "bg-success/8 shadow-[inset_3px_0_0_var(--success)]" : "bg-transparent shadow-[inset_0_0_0_transparent]",
      ].join(" ")}
    >
      {/* icon box */}
      <div
        className={[
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border-subtle",
          iconBgClass,
        ].join(" ")}
      >
        {icon}
      </div>

      {/* text */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-dim">{desc}</p>
      </div>

      {/* right slot: badge or action */}
      {badge ?? null}
      {action ?? null}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RowDivider — hairline between InfoRows
───────────────────────────────────────────── */
export function RowDivider() {
  return <div className="mx-5 h-px bg-border-subtle" />;
}
