"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.realvs.ai";

export async function setWelcomeSeen() {
  const cookieStore = await cookies();

  cookieStore.set("hasSeenWelcome", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 10,
    path: "/",
  });
}

export async function markWelcomeSeen(destination: string = `${APP_URL}/dashboard`) {
  await setWelcomeSeen();
  redirect(destination);
}
