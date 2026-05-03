export type AppMeData = {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  address: string | null;
  imageUrl: string | null;
  onboardingComplete: boolean;
  earlyAccessEligible: boolean;
  unreadMessagesCount: number;
  createdAt: string;
  updatedAt: string;
  wallet: {
    id: string;
    balance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  billingCustomer: {
    id: string;
    provider: string;
    customerId: string;
    customerEmail: string | null;
    customerName: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    status: string | null;
    customerPortalUrl: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  subscription: {
    id: string;
    provider: string;
    providerSubscriptionId: string | null;
    providerVariantId: string | null;
    productName: string | null;
    variantName: string | null;
    cardBrand: string | null;
    cardLastFour: string | null;
    paymentProcessor: string | null;
    customerPortalUrl: string | null;
    updatePaymentMethodUrl: string | null;
    status: string;
    trialEndsAt: string | null;
    trialVariantId: string | null;
    subscriptionCreditBalance: number;
    subscriptionPlanId: string | null;
    pricingPhase: string | null;
    subscriptionMonthlyCredits: number;
    subscriptionDeepVideoCount: number;
    subscriptionPriceCents: number | null;
    subscriptionPriceLocked: boolean;
    currentPeriodEnd: string | null;
    renewsAt: string | null;
    endsAt: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  latestPurchase: {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string | null;
    credits: number | null;
    description: string | null;
    providerOrderId: string | null;
    providerOrderNumber: string | null;
    providerProductName: string | null;
    providerVariantName: string | null;
    receiptUrl: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  paymentHistory: {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string | null;
    credits: number | null;
    description: string | null;
    providerOrderId: string | null;
    providerOrderNumber: string | null;
    providerProductName: string | null;
    providerVariantName: string | null;
    receiptUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  trial: {
    balance: number;
    videoScans: number;
    audioScans: number;
    maxVideoScans: number;
    maxAudioScans: number;
    isPaidUser: boolean;
    trialEndsAt: string | null;
  } | null;
};

export type MeResponse = {
  success: boolean;
  data?: AppMeData;
  error?: string;
};

export async function fetchMe(): Promise<MeResponse> {
  try {
    const response = await fetch("/api/me", { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return {
        success: false,
        error: `Unexpected /api/me response (${response.status})`,
      };
    }

    return (await response.json()) as MeResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load /api/me",
    };
  }
}
