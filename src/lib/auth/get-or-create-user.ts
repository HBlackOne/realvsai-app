import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isEarlyAccessActive } from "@/lib/billing/config";
import { ensureUserWallet } from "@/lib/services/wallet";

type ClerkBootstrapInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export async function getOrCreateUserFromClerk(input: ClerkBootstrapInput) {
  const existingUser = await db.user.findUnique({
    where: { clerkUserId: input.clerkUserId },
    include: { wallet: true, billingCustomer: true, subscription: true },
  });

  if (existingUser) {
    const updatedUser = await db.user.update({
      where: { id: existingUser.id },
      data: {
        email: input.email,
        firstName: existingUser.firstName || input.firstName || null,
        lastName: existingUser.lastName || input.lastName || null,
        imageUrl: input.imageUrl ?? undefined,
      },
      include: { wallet: true, billingCustomer: true, subscription: true },
    });

    if (updatedUser.wallet) return updatedUser;

    await ensureUserWallet(updatedUser.id);

    return db.user.findUniqueOrThrow({
      where: { id: updatedUser.id },
      include: { wallet: true, billingCustomer: true, subscription: true },
    });
  }

  return db.user.create({
    data: {
      clerkUserId: input.clerkUserId,
      email: input.email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      imageUrl: input.imageUrl ?? null,
      earlyAccessEligible: isEarlyAccessActive(),
      wallet: {
        create: {
          balance: 0,
        },
      },
    },
    include: { wallet: true, billingCustomer: true, subscription: true },
  });
}

export async function getOrCreateCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: Clerk user is missing.");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized: Clerk user record could not be loaded.");
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Cannot bootstrap user without an email address.");
  }

  return getOrCreateUserFromClerk({
    clerkUserId: clerkUser.id,
    email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  });
}
