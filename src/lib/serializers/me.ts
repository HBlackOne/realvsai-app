import "server-only";

import type { AppMeData } from "@/lib/api/me";
import { serializeBillingCustomer, serializeSubscription, serializeTransaction } from "@/lib/services/billing";
import { serializeWallet } from "@/lib/services/wallet";

type UserWithRelations = {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  address: string | null;
  imageUrl: string | null;
  onboardingComplete: boolean;
  unreadMessagesCount: number;
  trialScanBalance: number;
  trialVideoScans: number;
  trialAudioScans: number;
  isPaidUser: boolean;
  createdAt: Date;
  updatedAt: Date;
  wallet: Parameters<typeof serializeWallet>[0];
  billingCustomer: Parameters<typeof serializeBillingCustomer>[0];
  subscription: Parameters<typeof serializeSubscription>[0];
};

type SerializeMeInput = {
  user: UserWithRelations;
  latestPurchase?: Parameters<typeof serializeTransaction>[0];
  paymentHistory?: Parameters<typeof serializeTransaction>[0][];
};

export function serializeMe({ user, latestPurchase, paymentHistory = [] }: SerializeMeInput): AppMeData {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate,
    address: user.address,
    imageUrl: user.imageUrl,
    onboardingComplete: user.onboardingComplete,
    unreadMessagesCount: user.unreadMessagesCount,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    wallet: (() => {
      const wallet = serializeWallet(user.wallet);
      if (!wallet) return null;

      return {
        ...wallet,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    })(),
    billingCustomer: (() => {
      const billingCustomer = serializeBillingCustomer(user.billingCustomer);
      if (!billingCustomer) return null;

      return {
        ...billingCustomer,
        createdAt: billingCustomer.createdAt.toISOString(),
        updatedAt: billingCustomer.updatedAt.toISOString(),
      };
    })(),
    subscription: (() => {
      const subscription = serializeSubscription(user.subscription);
      if (!subscription) return null;

      return {
        ...subscription,
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
        subscriptionDeepVideoCount: subscription.subscriptionDeepVideoCount,
        subscriptionPriceCents: subscription.subscriptionPriceCents ?? null,
        subscriptionPriceLocked: subscription.subscriptionPriceLocked,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        renewsAt: subscription.renewsAt?.toISOString() ?? null,
        endsAt: subscription.endsAt?.toISOString() ?? null,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      };
    })(),
    latestPurchase: (() => {
      const transaction = serializeTransaction(latestPurchase ?? null);
      if (!transaction) return null;

      return {
        ...transaction,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      };
    })(),
    paymentHistory: paymentHistory.reduce<NonNullable<AppMeData["paymentHistory"]>>((items, transaction) => {
      const serialized = serializeTransaction(transaction);

      if (!serialized) {
        return items;
      }

      items.push({
        ...serialized,
        createdAt: serialized.createdAt.toISOString(),
        updatedAt: serialized.updatedAt.toISOString(),
      });

      return items;
    }, []),
    trial: {
      balance: user.trialScanBalance,
      videoScans: user.trialVideoScans,
      audioScans: user.trialAudioScans,
      maxVideoScans: 3,
      maxAudioScans: 5,
      isPaidUser: user.isPaidUser,
      trialEndsAt: (() => {
        const sub = user.subscription;
        return sub?.trialEndsAt ? sub.trialEndsAt.toISOString() : null;
      })(),
    },
  };
}
