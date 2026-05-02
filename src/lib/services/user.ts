import "server-only";

import { db } from "@/lib/db";

export async function markUserOnboardingComplete(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: {
      onboardingComplete: true,
    },
    include: {
      wallet: true,
      billingCustomer: true,
      subscription: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    birthDate: string | null;
    address: string | null;
  },
) {
  return db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      address: input.address,
    },
    include: {
      wallet: true,
      billingCustomer: true,
      subscription: true,
    },
  });
}

export async function markUserAsPaid(userId: string) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { isPaidUser: true },
  });
  if (existing?.isPaidUser) return;
  await db.user.update({
    where: { id: userId },
    data: { isPaidUser: true },
  });
}
