"use client";

import { CalendarDays, Flag, Mail, MapPin, Loader2, Check } from "lucide-react";
import { appButtonStyles } from "@/components/app-shell/AppButton";

interface Props {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  address: string;
  hasChanges: boolean;
  saving: boolean;
  saveError: string | null;
  saveSuccess: string | null;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onBirthDateChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onSave: () => void;
}

export function ProfileForm({
  firstName,
  lastName,
  email,
  birthDate,
  address,
  hasChanges,
  saving,
  saveError,
  saveSuccess,
  onFirstNameChange,
  onLastNameChange,
  onBirthDateChange,
  onAddressChange,
  onSave,
}: Props) {
  function handleBirthDate(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return onBirthDateChange(digits);
    if (digits.length <= 4) return onBirthDateChange(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    onBirthDateChange(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" value={firstName} placeholder="Add first name" editable onChange={onFirstNameChange} />
        <Field label="Last name" value={lastName} placeholder="Add last name" editable onChange={onLastNameChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Birthday"
          value={birthDate}
          placeholder="DD/MM/YYYY"
          icon={<CalendarDays className="h-4 w-4 text-text-dim" />}
          editable
          onChange={handleBirthDate}
          inputMode="numeric"
          maxLength={10}
        />
        <Field label="Country" value="Morocco" icon={<Flag className="h-4 w-4 text-text-dim" />} disabled />
      </div>

      <Field label="Email address" value={email} icon={<Mail className="h-4 w-4 text-text-dim" />} disabled />

      <Field
        label="Address"
        value={address}
        placeholder="Add address"
        icon={<MapPin className="h-4 w-4 text-text-dim" />}
        editable
        onChange={onAddressChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="min-h-[18px]">
          {saveError ? <p className="text-xs text-danger">{saveError}</p> : null}
          {saveSuccess ? (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" />
              {saveSuccess}
            </p>
          ) : null}
        </div>

        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className={appButtonStyles({ variant: "primary", size: "md" })}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  disabled,
  icon,
  editable,
  onChange,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  editable?: boolean;
  onChange?: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-dim">{label}</label>
      <div className="relative">
        {icon ? <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{icon}</div> : null}
        <input
          type={type}
          value={value}
          readOnly={!editable}
          disabled={disabled}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          className={[
            "w-full rounded-xl border border-border-subtle bg-bg py-2.5 text-sm text-text outline-none",
            "transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-dim)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-10 pr-3" : "px-3",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
