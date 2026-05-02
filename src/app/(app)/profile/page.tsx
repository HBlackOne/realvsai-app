"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAppMe } from "@/hooks/use-app-me";
import { AppPage, AppPageHeader, AppSection } from "@/components/app-shell/AppPage";
import { AccountOverview } from "@/components/profile/AccountOverview";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { BillingSummary } from "@/components/profile/BillingSummary";
import { DangerZone } from "@/components/profile/DangerZone";

function resolvePlanLabel(status: string | null | undefined, variantName: string | null | undefined, productName: string | null | undefined, hasTrial: boolean) {
  if (variantName?.trim()) return variantName.trim();
  if (productName?.trim()) return productName.trim();
  if (status === "ON_TRIAL" || hasTrial) return "Free Trial";
  return "No active plan";
}

export default function ProfilePage() {
  const { user } = useUser();
  const { me, loading, setMe } = useAppMe();

  const syncedFirstName = me?.firstName || user?.firstName || "";
  const syncedLastName = me?.lastName || user?.lastName || "";
  const syncedEmail =
    me?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(syncedFirstName);
    setLastName(syncedLastName);
    setBirthDate(me?.birthDate || "");
    setAddress(me?.address || "");
  }, [syncedFirstName, syncedLastName, me?.birthDate, me?.address]);

  const hasChanges =
    firstName !== syncedFirstName ||
    lastName !== syncedLastName ||
    birthDate !== (me?.birthDate || "") ||
    address !== (me?.address || "");

  async function handleSaveProfile() {
    if (saving || !hasChanges) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, birthDate, address }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success || !payload?.data) {
        throw new Error(payload?.error || "Failed to save profile.");
      }

      setMe(payload.data);
      setSaveSuccess("Profile updated.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Your account";

  const billingName = (me?.billingCustomer?.customerName || "").trim() || fullName;
  const billingEmail = me?.billingCustomer?.customerEmail || syncedEmail || "Not available yet";
  const billingCountry = me?.billingCustomer?.country || "Not available yet";
  const billingAccount = me?.billingCustomer
    ? `Customer #${me.billingCustomer.customerId}`
    : loading
      ? "Loading…"
      : "Not available yet";
  const paymentStatus = me?.subscription
    ? me.subscription.status
    : me?.billingCustomer
      ? "Paid orders active"
      : loading
        ? "Loading…"
        : "Available after first purchase";

  const statusText = useMemo(() => {
    if (loading) return "Loading your account";
    if (me?.wallet || me?.subscription || me?.trial) return "Account active";
    return "Account ready";
  }, [loading, me?.wallet, me?.subscription, me?.trial]);

  const credits = (me?.trial?.balance ?? 0) + (me?.subscription?.subscriptionCreditBalance ?? 0) + (me?.wallet?.balance ?? 0);
  const planLabel = resolvePlanLabel(
    me?.subscription?.status,
    me?.subscription?.variantName,
    me?.subscription?.productName,
    Boolean(me?.trial?.balance || me?.trial?.trialEndsAt),
  );

  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader
        title="Profile"
        description="Manage your personal details, account look, and the billing summary tied to your purchases."
      />

      <div className="mt-8 space-y-8">
        <AccountOverview
          fullName={fullName}
          email={syncedEmail}
          loading={loading}
          statusText={statusText}
          planLabel={planLabel}
          credits={credits}
        />

        <AppSection title="Profile info" icon="M5 3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm2 3h10M9 9h10M9 13h6M9 17h4">
          <ProfileForm
            firstName={firstName}
            lastName={lastName}
            email={syncedEmail}
            birthDate={birthDate}
            address={address}
            hasChanges={hasChanges}
            saving={saving}
            saveError={saveError}
            saveSuccess={saveSuccess}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onBirthDateChange={setBirthDate}
            onAddressChange={setAddress}
            onSave={handleSaveProfile}
          />
        </AppSection>

        <AppSection title="Billing summary" icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z">
          <BillingSummary
            billingName={billingName}
            billingEmail={billingEmail}
            billingCountry={billingCountry}
            billingAccount={billingAccount}
            paymentStatus={paymentStatus}
          />
        </AppSection>

        <DangerZone />
      </div>
    </AppPage>
  );
}